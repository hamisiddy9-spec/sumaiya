// jest provides describe/it/expect as globals — this project's runner is jest,
// NOT vitest. Importing them from vitest works under vitest and fails here with
// "Cannot find module 'vitest'", which is exactly how a green local run can be
// a false positive.
//
// AsyncStorage ships a native module, which does not exist under jest — without
// this mock the suite dies at import with "[@RNC/AsyncStorage]: NativeModule:
// AsyncStorage is null". Mocked file-locally rather than in shared setup so this
// test is self-sufficient wherever it runs.
jest.mock("@sumaiya/utils", () => ({ offlineStorage: {} }));
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
import {
  EMPTY_MEMORY,
  CONSOLIDATION_THRESHOLD,
  addEpisode,
  addEpisodeEvent,
  consolidate,
  episodeText,
  eventText,
  factText,
  setFact,
  forget,
  recordPlaybook,
  renderMemoryBlock,
  type Memory,
  type Translate,
} from "./ai-memory";

const DAY = 1000 * 60 * 60 * 24;
const T0 = new Date("2026-09-01T09:00:00Z").getTime();
/** The two readings of `useLang().t`: one for each language. */
const en: Translate = (e) => e;
const sw: Translate = (_e, s) => s;

function withEpisodes(topic: string, n: number, spacingMs = DAY): Memory {
  let m = EMPTY_MEMORY;
  for (let i = 0; i < n; i++) m = addEpisode(m, topic, `${topic} attempt ${i + 1}`, T0 + i * spacingMs);
  return m;
}

describe("episodes", () => {
  it("records an event", () => {
    const m = addEpisode(EMPTY_MEMORY, "interview_practice", "asked how to answer 'tell me about yourself'", T0);
    expect(m.episodes).toHaveLength(1);
    expect(m.episodes[0].topic).toBe("interview_practice");
  });

  it("does not count the same topic twice in one day as two pieces of evidence", () => {
    let m = addEpisode(EMPTY_MEMORY, "interview_practice", "first ask", T0);
    m = addEpisode(m, "interview_practice", "same worry again an hour later", T0 + 1000 * 60 * 60);
    expect(m.episodes).toHaveLength(1);
  });

  it("does count the same topic on a later day", () => {
    let m = addEpisode(EMPTY_MEMORY, "interview_practice", "day one", T0);
    m = addEpisode(m, "interview_practice", "day two", T0 + DAY + 1000);
    expect(m.episodes).toHaveLength(2);
  });

  it("ignores an empty topic", () => {
    expect(addEpisode(EMPTY_MEMORY, "   ", "x", T0).episodes).toHaveLength(0);
  });

  it("stays bounded", () => {
    const m = withEpisodes("cv_editing", 200);
    expect(m.episodes.length).toBeLessThanOrEqual(60);
  });
});

describe("consolidation — the line between storing and learning", () => {
  it("does NOT promote below the threshold", () => {
    const m = withEpisodes("interview_practice", CONSOLIDATION_THRESHOLD - 1);
    const { memory, promoted } = consolidate(m, T0 + 10 * DAY);
    expect(promoted).toHaveLength(0);
    expect(memory.facts).toHaveLength(0);
  });

  it("promotes a repeated topic into a fact at the threshold", () => {
    const m = withEpisodes("interview_practice", CONSOLIDATION_THRESHOLD);
    const { memory, promoted } = consolidate(m, T0 + 10 * DAY);
    expect(promoted).toHaveLength(1);
    expect(memory.facts).toHaveLength(1);
    expect(memory.facts[0].key).toBe("interview_practice");
    expect(memory.facts[0].evidence).toBe(CONSOLIDATION_THRESHOLD);
    expect(memory.facts[0].confirmed).toBeFalsy();
  });

  it("refreshes an existing fact instead of duplicating it", () => {
    const m = withEpisodes("interview_practice", CONSOLIDATION_THRESHOLD);
    const first = consolidate(m, T0 + 10 * DAY);
    const second = consolidate(
      addEpisode(first.memory, "interview_practice", "asked again", T0 + 11 * DAY),
      T0 + 11 * DAY,
    );
    expect(second.memory.facts).toHaveLength(1);
    expect(second.memory.facts[0].evidence).toBe(CONSOLIDATION_THRESHOLD + 1);
  });

  it("expires an unconfirmed fact that has gone quiet", () => {
    const m = withEpisodes("stale_worry", CONSOLIDATION_THRESHOLD);
    // Consolidated once (the fact is born), then revisited long after the
    // episodes — with no new evidence in between.
    const born = consolidate(m, T0 + 10 * DAY).memory;
    expect(born.facts).toHaveLength(1);
    const aged = consolidate(born, T0 + 400 * DAY).memory;
    expect(aged.facts).toHaveLength(0);
  });

  it("keeps a fact alive while fresh evidence keeps arriving", () => {
    const m = withEpisodes("ongoing_theme", CONSOLIDATION_THRESHOLD);
    let memory = consolidate(m, T0 + 10 * DAY).memory;
    // A new episode well after the fact was formed — then a long gap.
    memory = consolidate(addEpisode(memory, "ongoing_theme", "still at it", T0 + 300 * DAY), T0 + 300 * DAY).memory;
    memory = consolidate(memory, T0 + 400 * DAY).memory;
    expect(memory.facts).toHaveLength(1);
  });

  it("never expires something the person confirmed, however old", () => {
    let m = setFact(EMPTY_MEMORY, "target_field", "logistics", true, T0);
    m = consolidate(m, T0 + 400 * DAY).memory;
    expect(m.facts).toHaveLength(1);
    expect(m.facts[0].confirmed).toBe(true);
  });
});

describe("corrections outrank inference", () => {
  it("a stated fact replaces an inferred one and is marked confirmed", () => {
    const inferred = consolidate(withEpisodes("target_field", CONSOLIDATION_THRESHOLD), T0 + 10 * DAY).memory;
    expect(inferred.facts[0].confirmed).toBeFalsy();
    const corrected = setFact(inferred, "target_field", "healthcare admin", true, T0 + 11 * DAY);
    expect(corrected.facts).toHaveLength(1);
    expect(corrected.facts[0].value).toBe("healthcare admin");
    expect(corrected.facts[0].confirmed).toBe(true);
  });
});

describe("forgetting", () => {
  it("removes a fact and its episodes by key", () => {
    const m = withEpisodes("interview_practice", CONSOLIDATION_THRESHOLD);
    const { memory } = consolidate(m, T0 + 10 * DAY);
    const gone = forget(memory, "interview_practice");
    expect(gone.facts).toHaveLength(0);
    expect(gone.episodes).toHaveLength(0);
  });
});

describe("prompt block", () => {
  it("is empty when there is nothing to say — no tokens, no half-formed impression", () => {
    expect(renderMemoryBlock(EMPTY_MEMORY)).toBe("");
  });

  it("puts stable facts before volatile episodes (cache prefix must not move)", () => {
    const m = withEpisodes("interview_practice", CONSOLIDATION_THRESHOLD);
    const { memory } = consolidate(m, T0 + 10 * DAY);
    const block = renderMemoryBlock(memory);
    expect(block.indexOf("Known:")).toBeLessThan(block.indexOf("Recently:"));
  });

  it("shows the evidence basis, so a 3-episode hunch reads differently from a fact", () => {
    const inferred = consolidate(withEpisodes("interview_practice", CONSOLIDATION_THRESHOLD), T0).memory;
    expect(renderMemoryBlock(inferred)).toContain(`seen ${CONSOLIDATION_THRESHOLD}x`);

    const told = setFact(EMPTY_MEMORY, "target_field", "logistics", true, T0);
    expect(renderMemoryBlock(told)).toContain("they told you");
  });

  it("lists approaches that worked", () => {
    const m = recordPlaybook(EMPTY_MEMORY, "ats_low", ["lead with the summary", "mirror the posting's words"], true, T0);
    expect(renderMemoryBlock(m)).toContain("Approaches that have worked here:");
    expect(renderMemoryBlock(m)).toContain("lead with the summary");
  });
});

/**
 * The defect this guards, seen on the device 2026-09-20: the memory screen's
 * "MATUKIO YA HIVI KARIBUNI" list printed raw English to a Swahili user
 * ("Rebuilt a CV using the Aurora template"), because every detail string was
 * authored in English at the call site — and consolidation then promoted those
 * same English sentences into Fact values injected into every later
 * conversation, so the coach read English about a person who had chosen
 * Kiswahili. An episode is now stored as an EVENT plus the sentence it rendered
 * to, so the sentence follows the reader's language instead of freezing it.
 */
describe("memory in the reader's language", () => {
  const REBUILT = { key: "cv_rebuilt", params: { template: "Asili" } };

  it("writes the sentence in the language in play, and re-renders it in the other", () => {
    const m = addEpisodeEvent(EMPTY_MEMORY, "cv_rebuilt", REBUILT, sw, T0);
    expect(m.episodes[0].detail).toBe("CV imeundwa upya kwa muundo wa Asili");
    expect(episodeText(m.episodes[0], sw)).toBe("CV imeundwa upya kwa muundo wa Asili");
    // The same row, read by someone using English — no second write needed.
    expect(episodeText(m.episodes[0], en)).toBe("Rebuilt a CV using the Asili template");
  });

  it("keeps a promoted fact readable in the reader's language", () => {
    let m: Memory = EMPTY_MEMORY;
    for (let i = 0; i < CONSOLIDATION_THRESHOLD; i++) m = addEpisodeEvent(m, "cv_rebuilt", REBUILT, en, T0 + i * DAY);
    const { memory, promoted } = consolidate(m, T0 + 10 * DAY);
    expect(promoted[0].value).toBe("Rebuilt a CV using the Asili template");
    expect(factText(memory.facts[0], en)).toBe("Rebuilt a CV using the Asili template");
    expect(factText(memory.facts[0], sw)).toBe("CV imeundwa upya kwa muundo wa Asili");
    expect(memory.facts[0].valueEvent?.key).toBe("cv_rebuilt");
  });

  it("renders the prompt block in the language the person is reading in", () => {
    let m: Memory = EMPTY_MEMORY;
    for (let i = 0; i < CONSOLIDATION_THRESHOLD; i++) m = addEpisodeEvent(m, "cv_exported", { key: "cv_exported", params: { template: "Kisasa" } }, sw, T0 + i * DAY);
    const { memory } = consolidate(m, T0 + 10 * DAY);
    expect(renderMemoryBlock(memory, sw)).toContain("CV imepakuliwa kwa muundo wa Kisasa");
    expect(renderMemoryBlock(memory, sw)).not.toContain("Exported a CV using");
    expect(renderMemoryBlock(memory, en)).toContain("Exported a CV using the Kisasa template");
    // No language passed (logs, tests, any caller without a context) stays English.
    expect(renderMemoryBlock(memory)).toContain("Exported a CV using the Kisasa template");
  });

  it("never names the screening mechanism in Swahili copy, anywhere it can reach the user", () => {
    const line = eventText({ key: "cv_check_failed", params: { score: 15, check: "Muhtasari (herufi 60+)" } }, sw);
    expect(line).toBe('Ukaguzi wa CV ulipata alama 15/100; sehemu iliyopunguza: "Muhtasari (herufi 60+)"');
    expect(line).not.toMatch(/\bATS\b/);
    expect(eventText({ key: "cv_check_failed", params: { score: 15, check: "Summary (60+ chars)" } }, en)).toContain("CV check scored 15/100");
  });

  it("falls back to the stored sentence for an episode written before events existed", () => {
    const m = addEpisode(EMPTY_MEMORY, "interview_practice", "asked how to answer 'tell me about yourself'", T0);
    expect(m.episodes[0].event).toBeUndefined();
    expect(episodeText(m.episodes[0], sw)).toBe("asked how to answer 'tell me about yourself'");
    // An old episode with no sentence at all still has its topic, spaced.
    const bare = addEpisode(EMPTY_MEMORY, "cv_editing", "", T0);
    expect(episodeText(bare.episodes[0], sw)).toBe("cv editing");
  });

  it("degrades an unknown or malformed event to something honest instead of throwing", () => {
    expect(eventText({ key: "not_registered" }, sw)).toBe("not registered");
    // A store written by a newer build (or a hand-edited one) must not crash the
    // memory screen: unreadable event -> the sentence it was written with.
    const m = addEpisode(EMPTY_MEMORY, "cv_rebuilt", "Rebuilt a CV using the Asili template", T0);
    const corrupted = { ...m.episodes[0], event: { key: 42 } as unknown as typeof m.episodes[0]["event"] };
    expect(episodeText(corrupted, sw)).toBe("Rebuilt a CV using the Asili template");
  });

  it("shows a corrected fact exactly as the person stated it", () => {
    let m: Memory = EMPTY_MEMORY;
    for (let i = 0; i < CONSOLIDATION_THRESHOLD; i++) m = addEpisodeEvent(m, "cv_exported", { key: "cv_exported", params: { template: "Asili" } }, en, T0 + i * DAY);
    const { memory } = consolidate(m, T0 + 10 * DAY);
    const corrected = setFact(memory, "cv_exported", "ninaomba kazi za uhasibu", true, T0 + 11 * DAY);
    expect(factText(corrected.facts[0], sw)).toBe("ninaomba kazi za uhasibu");
    expect(corrected.facts[0].valueEvent).toBeUndefined();
  });
});
