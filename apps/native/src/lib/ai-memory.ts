/**
 * Sumaiya's memory — what she knows about you, and how it grows.
 *
 * Three roles, one store (the CoALA split):
 *   episodic   — what happened: an event with a time
 *   semantic   — what we learned: stable facts + preferences about the person
 *   procedural — what worked: advice that landed, reusable next time
 *
 * Storage is not memory. Counting three episodes of the same worry is a
 * different act from concluding "this person needs interview coaching" — that
 * leap is CONSOLIDATION and it is deliberately explicit here: a topic must clear
 * an evidence threshold before it is allowed to steer advice. Without that line,
 * one hard day would rewrite who someone is.
 *
 * Offline-first by construction: everything lives on the device and nothing in
 * this module needs the network, so the coach never forgets because the data
 * dropped.
 *
 * Bounded on purpose. A phone is not a data lake, and unbounded memory makes
 * every prompt more expensive while adding less signal. Episodes, facts and
 * playbooks are all capped; the oldest, least-evidenced go first.
 *
 * The prompt block renders STABLE FIRST (facts, then playbooks) and volatile
 * last (recent episodes), because a provider's prompt cache only pays out on an
 * identical prefix — see docs/sumaiya-ai-cost-sweet-spot.md. Reordering this
 * silently multiplies the bill.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "sumaiya.memory.v1";

/** How many episodes of the same topic before it is allowed to become a fact. */
export const CONSOLIDATION_THRESHOLD = 3;
const MAX_EPISODES = 60;
const MAX_FACTS = 40;
const MAX_PLAYBOOKS = 12;
/** Facts untouched for this long stop steering advice. */
const FACT_TTL_MS = 1000 * 60 * 60 * 24 * 180; // 180 days

/**
 * Pick a string for the language the READER is using right now.
 * `useLang().t` satisfies this; the default is English so tests, logs and any
 * caller without a language context keep working unchanged.
 */
export type Translate = (en: string, sw: string) => string;
/** The default: no language context, so take the English slot. */
export const englishOnly: Translate = (en) => en;

/**
 * A known event, described so its sentence can be built LATER, in whatever
 * language the person is reading in when it is shown.
 *
 * Why this exists: `detail` is a rendered string, and a rendered string is
 * frozen in the language it was written in. Before this, every detail was
 * written in English by construction (the call sites had no language), so a
 * Swahili user opened "MATUKIO YA HIVI KARIBUNI" / "RECENT ACTIVITY SHE NOTED"
 * and read English — and consolidation then promoted that English sentence into
 * a Fact `value`, which is injected into every later conversation. Storing the
 * event instead of only the sentence means one write renders in either
 * language, and flipping the language toggle re-renders the whole history
 * rather than leaving a half-translated memory behind.
 *
 * `key` is a member of EPISODE_TEXT; `params` is the data the sentence needs.
 * An episode with no `event` (anything written before this existed, or by a
 * caller that only has a sentence) falls back to its stored `detail`.
 */
export interface EpisodeEvent {
  key: string;
  params?: Record<string, string | number>;
}

export interface Episode {
  id: string;
  /** Short machine-readable topic, e.g. "interview_practice". */
  topic: string;
  /** One line of what actually happened, in the language it was written in. */
  detail: string;
  at: number;
  /** Machine-readable form of `detail` — lets it be re-rendered in any language. */
  event?: EpisodeEvent;
}

export interface Fact {
  id: string;
  /** Machine key, e.g. "target_field". Stable across updates. */
  key: string;
  /** Plain sentence shown to the model, in the language it was written in. */
  value: string;
  /** How many episodes support it. This is the evidence, and it is visible. */
  evidence: number;
  at: number;
  updatedAt: number;
  /** True when the person confirmed or corrected it — never auto-demoted. */
  confirmed?: boolean;
  /** Inherited from the episode that formed the fact, so a fact renders in the reader's language too. */
  valueEvent?: EpisodeEvent;
}

export interface Playbook {
  id: string;
  /** What situation it applies to, e.g. "ats_low". */
  trigger: string;
  /** What to do, one step per line. */
  steps: string[];
  /** Times it was used and not rejected. */
  wins: number;
  updatedAt: number;
}

export interface Memory {
  version: number;
  episodes: Episode[];
  facts: Fact[];
  playbooks: Playbook[];
}

export const EMPTY_MEMORY: Memory = { version: 1, episodes: [], facts: [], playbooks: [] };

/* ------------------------------------------------------------------ pure ---- */

function idOf(seed: string): string {
  // Deterministic and collision-resistant enough for a device-local store.
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return `m${(h >>> 0).toString(36)}`;
}

/** Oldest-first eviction: keep the newest `max`. */
function cap<T>(items: T[], max: number): T[] {
  return items.length <= max ? items : items.slice(items.length - max);
}

/**
 * The catalogue of events the memory can record, each written once per language.
 *
 * ONE entry per `addEpisodeEvent` call site — this is the only place an episode
 * sentence is authored, so there is exactly one thing to review when copy
 * changes, and no screen can write a sentence in the wrong language again.
 * `params` are interpolated verbatim (a template name, a score, a check label);
 * only the frame around them is translated.
 *
 * Swahili rules applied here, same as the UI copy: no "ATS" (name the
 * mechanism as "ukaguzi wa CV" / "mifumo ya kuajiri" instead — the acronym in
 * Swahili copy fails `lib/swahili-lint.test.ts`), the passive voice where the
 * actor would be ambiguous ("CV imeundwa upya…" rather than picking a person),
 * and second person for the user's own objects if a possessive is ever needed.
 */
const EPISODE_TEXT: Record<string, (params: Record<string, string | number>, t: Translate) => string> = {
  /** cv-editor-screen.tsx — a CV was built or rebuilt from the editor. */
  cv_rebuilt: (p, t) =>
    t(`Rebuilt a CV using the ${p.template} template`, `CV imeundwa upya kwa muundo wa ${p.template}`),
  /** cv-editor-screen.tsx — a PDF left the app (the strongest "actively applying" signal). */
  cv_exported: (p, t) =>
    t(`Exported a CV using the ${p.template} template`, `CV imepakuliwa kwa muundo wa ${p.template}`),
  /** ats-checker-screen.tsx — a check scored the CV and named the biggest gap. */
  cv_check_failed: (p, t) =>
    t(
      `CV check scored ${p.score}/100, losing points on "${p.check}"`,
      `Ukaguzi wa CV ulipata alama ${p.score}/100; sehemu iliyopunguza: "${p.check}"`,
    ),
};

/**
 * Render an event in the reader's language. An unknown or malformed key is a
 * programming error (or a store from a newer build), not a crash: it renders as
 * the key with its underscores spaced, which is wrong-looking but honest and
 * never takes the memory screen down. Returns "" for nothing usable, so the
 * callers below can fall through to the stored sentence.
 */
export function eventText(event: EpisodeEvent | undefined, t: Translate = englishOnly): string {
  const key = typeof event?.key === "string" ? event.key : "";
  const build = key ? EPISODE_TEXT[key] : undefined;
  if (!build) return key.replace(/_/g, " ");
  return build(event?.params ?? {}, t);
}

/**
 * What to show for an episode, in the language the reader is using NOW.
 * An episode written before this mechanism existed has no `event`, so its
 * stored sentence is all there is — that is the honest fallback, not a blank.
 */
export function episodeText(e: Episode, t: Translate = englishOnly): string {
  return eventText(e.event, t) || e.detail || e.topic.replace(/_/g, " ");
}

/** What to show for a fact, in the language the reader is using NOW. */
export function factText(f: Fact, t: Translate = englishOnly): string {
  return eventText(f.valueEvent, t) || f.value || f.key.replace(/_/g, " ");
}

/**
 * Record something that happened. A repeat of the same topic within the same
 * day replaces rather than piles up — five identical entries are not five
 * pieces of evidence, and pretending they are is how a coach talks itself into
 * a wrong conclusion.
 *
 * `event` is optional because some callers genuinely only have a sentence;
 * prefer `addEpisodeEvent`, which stores both.
 */
export function addEpisode(
  memory: Memory,
  topic: string,
  detail: string,
  now = Date.now(),
  event?: EpisodeEvent,
): Memory {
  const cleanTopic = topic.trim().slice(0, 40);
  if (!cleanTopic) return memory;
  const dayStart = new Date(now).setHours(0, 0, 0, 0);
  const alreadyToday = memory.episodes.some((e) => e.topic === cleanTopic && e.at >= dayStart);
  if (alreadyToday) return memory;
  const episode: Episode = {
    id: idOf(`${cleanTopic}:${now}:${memory.episodes.length}`),
    topic: cleanTopic,
    detail: detail.trim().slice(0, 160),
    at: now,
    ...(event ? { event } : {}),
  };
  return { ...memory, episodes: cap([...memory.episodes, episode], MAX_EPISODES) };
}

/**
 * Record something that happened, from a described event rather than a
 * sentence. The one call sites should use.
 *
 * The sentence is written in the language in play when it happened (so the
 * stored `detail` is never a lie about what the person was reading), AND the
 * event is stored alongside it, so the same episode re-renders in the other
 * language the moment the reader switches. See EpisodeEvent for why both.
 */
export function addEpisodeEvent(
  memory: Memory,
  topic: string,
  event: EpisodeEvent,
  t: Translate = englishOnly,
  now = Date.now(),
): Memory {
  return addEpisode(memory, topic, eventText(event, t), now, event);
}

/**
 * The consolidation pass: repeated episodes become a fact.
 *
 * Only topics at or above the evidence threshold are promoted, only facts that
 * still see evidence get refreshed, and unconfirmed facts that have gone quiet
 * expire. This is the entire "she learns" mechanism — everything else is just
 * storage.
 */
export function consolidate(memory: Memory, now = Date.now()): { memory: Memory; promoted: Fact[] } {
  const byTopic = new Map<string, Episode[]>();
  for (const e of memory.episodes) {
    const list = byTopic.get(e.topic);
    if (list) list.push(e);
    else byTopic.set(e.topic, [e]);
  }

  const promoted: Fact[] = [];
  let facts = [...memory.facts];

  for (const [topic, episodes] of byTopic) {
    if (episodes.length < CONSOLIDATION_THRESHOLD) continue;
    const existing = facts.find((f) => f.key === topic);
    const latest = episodes[episodes.length - 1];
    if (existing) {
      // Only genuinely NEW evidence refreshes a fact. Without this test the old
      // episodes still sitting in the buffer kept re-dating the fact forever, so
      // "three worries last spring, nothing since" never aged out.
      const hasNewEvidence = latest.at > existing.updatedAt;
      facts = facts.map((f) =>
        f.key === topic
          ? {
              ...f,
              evidence: episodes.length,
              value: latest.detail || f.value,
              // Carried so the fact re-renders in the reader's language, like
              // the episode it was promoted from. Set unconditionally (not
              // merged) so a newer episode WITHOUT an event cannot leave an
              // older event describing a different sentence.
              valueEvent: latest.event,
              updatedAt: hasNewEvidence ? now : f.updatedAt,
            }
          : f,
      );
      continue;
    }
    const fact: Fact = {
      id: idOf(`fact:${topic}`),
      key: topic,
      value: latest.detail || topic.replace(/_/g, " "),
      evidence: episodes.length,
      at: now,
      updatedAt: now,
      ...(latest.event ? { valueEvent: latest.event } : {}),
    };
    facts.push(fact);
    promoted.push(fact);
  }

  // Expire what has gone quiet; keep anything the person confirmed.
  facts = facts.filter((f) => f.confirmed || now - f.updatedAt < FACT_TTL_MS);

  return { memory: { ...memory, facts: cap(facts, MAX_FACTS) }, promoted };
}

/** The person corrects or confirms a fact. Corrections outrank inference. */
export function setFact(memory: Memory, key: string, value: string, confirmed = true, now = Date.now()): Memory {
  const existing = memory.facts.find((f) => f.key === key);
  if (existing) {
    return {
      ...memory,
      facts: memory.facts.map((f) => (f.key === key ? { ...f, value, valueEvent: undefined, confirmed, updatedAt: now } : f)),
    };
  }
  const fact: Fact = { id: idOf(`fact:${key}`), key, value, evidence: 1, at: now, updatedAt: now, confirmed };
  return { ...memory, facts: cap([...memory.facts, fact], MAX_FACTS) };
}

/** Forget one thing, by key or id. Deliberate and total. */
export function forget(memory: Memory, keyOrId: string): Memory {
  return {
    ...memory,
    facts: memory.facts.filter((f) => f.key !== keyOrId && f.id !== keyOrId),
    episodes: memory.episodes.filter((e) => e.topic !== keyOrId && e.id !== keyOrId),
  };
}

export function recordPlaybook(memory: Memory, trigger: string, steps: string[], won = false, now = Date.now()): Memory {
  const existing = memory.playbooks.find((p) => p.trigger === trigger);
  if (existing) {
    return {
      ...memory,
      playbooks: memory.playbooks.map((p) =>
        p.trigger === trigger ? { ...p, steps, wins: won ? p.wins + 1 : p.wins, updatedAt: now } : p,
      ),
    };
  }
  const playbook: Playbook = { id: idOf(`pb:${trigger}`), trigger, steps, wins: won ? 1 : 0, updatedAt: now };
  return { ...memory, playbooks: cap([...memory.playbooks, playbook], MAX_PLAYBOOKS) };
}

/**
 * Render the memory for a prompt.
 *
 * Stable first, volatile last — the provider's cache only pays out on an
 * identical prefix. Facts and playbooks rarely change; recent episodes do, which
 * is exactly why they go last.
 *
 * Returns "" when there is nothing worth saying, so an empty memory costs no
 * tokens and cannot leak a half-formed impression into the conversation.
 *
 * `t` is the language the person is reading in. The one-line factual content
 * (each fact and each episode) is rendered in that language: a Swahili user's
 * memory used to enter every conversation as English sentences, so the coach
 * saw "Rebuilt a CV using the Aurora template" while the person had asked for
 * Kiswahili — and could paraphrase that English straight back at them. The
 * scaffold around the content stays English because it is an instruction to the
 * model, not copy for the reader.
 */
export function renderMemoryBlock(memory: Memory, t: Translate = englishOnly): string {
  if (memory.facts.length === 0 && memory.playbooks.length === 0 && memory.episodes.length === 0) return "";

  const parts: string[] = [
    "[What you know about this person — from previous conversations and their activity. Use it naturally; never recite it back, never ask them to repeat it.]",
  ];

  if (memory.facts.length > 0) {
    const facts = [...memory.facts].sort((a, b) => a.key.localeCompare(b.key));
    parts.push("Known:");
    for (const f of facts) {
      // Evidence is stated so the model can weigh a 3-episode hunch differently
      // from something the person told us outright.
      const basis = f.confirmed ? "they told you" : `seen ${f.evidence}x`;
      parts.push(`- ${factText(f, t)} (${basis})`);
    }
  }

  if (memory.playbooks.length > 0) {
    const best = [...memory.playbooks].sort((a, b) => b.wins - a.wins).slice(0, 3);
    parts.push("Approaches that have worked here:");
    for (const p of best) parts.push(`- ${p.trigger}: ${p.steps.join(" → ")}`);
  }

  if (memory.episodes.length > 0) {
    const recent = memory.episodes.slice(-5);
    parts.push("Recently:");
    for (const e of recent) parts.push(`- ${episodeText(e, t)}`);
  }

  return parts.join("\n");
}

/**
 * Consent — PDPA 2022 s.23(2).
 *
 * "Before collecting data, a data controller shall ensure that the data subject
 * is aware of the purposes for which the personal data is collected." A notice
 * shown after the fact is not notice, so nothing is written until the person has
 * been told what is kept and why.
 *
 * Three states, deliberately: we ask once, a refusal is remembered as firmly as
 * a yes, and refusing must not break the assistant — she simply stops learning.
 */
const CONSENT_KEY = "sumaiya.memory.consent.v1";
export type Consent = "unasked" | "granted" | "declined";

export async function loadConsent(): Promise<Consent> {
  try {
    const raw = await AsyncStorage.getItem(CONSENT_KEY);
    return raw === "granted" || raw === "declined" ? raw : "unasked";
  } catch {
    return "unasked";
  }
}

export async function setConsent(value: Consent): Promise<void> {
  try {
    await AsyncStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* silent */
  }
}

/* ------------------------------------------------------------ persistence --- */

/** Never throws: a broken store must not take the assistant down. */
export async function loadMemory(): Promise<Memory> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return EMPTY_MEMORY;
    const parsed = JSON.parse(raw) as Partial<Memory>;
    return {
      version: 1,
      episodes: Array.isArray(parsed.episodes) ? parsed.episodes : [],
      facts: Array.isArray(parsed.facts) ? parsed.facts : [],
      playbooks: Array.isArray(parsed.playbooks) ? parsed.playbooks : [],
    };
  } catch {
    return EMPTY_MEMORY;
  }
}

export async function saveMemory(memory: Memory): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* silent — memory is an enhancement, never a dependency */
  }
}

/**
 * The one call sites should use: read, apply a change, consolidate, write back.
 * Consolidation runs here rather than on a timer because it is cheap and
 * idempotent, and it keeps the device as the single source of truth offline.
 *
 * Refuses to WRITE without consent (PDPA s.23(2)) but always reports the current
 * memory, so a refusal never breaks a screen that reads it.
 */
export async function updateMemory(
  change: (memory: Memory) => Memory,
): Promise<{ memory: Memory; promoted: Fact[]; blocked: boolean }> {
  const before = await loadMemory();
  if ((await loadConsent()) !== "granted") {
    return { memory: before, promoted: [], blocked: true };
  }
  const changed = change(before);
  const { memory, promoted } = consolidate(changed);
  if (promoted.length > 0 || memory !== before) await saveMemory(memory);
  return { memory, promoted, blocked: false };
}

/** Wipe everything she has learned. PDPA s.38 — erasure, and it is total. */
export async function eraseMemory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    /* silent */
  }
}
