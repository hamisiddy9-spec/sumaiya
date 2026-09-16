import { describe, it, expect } from "vitest";
import {
  EMPTY_MEMORY,
  CONSOLIDATION_THRESHOLD,
  addEpisode,
  consolidate,
  setFact,
  forget,
  recordPlaybook,
  renderMemoryBlock,
  type Memory,
} from "./ai-memory";

const DAY = 1000 * 60 * 60 * 24;
const T0 = new Date("2026-09-01T09:00:00Z").getTime();

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
