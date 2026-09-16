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

export interface Episode {
  id: string;
  /** Short machine-readable topic, e.g. "interview_practice". */
  topic: string;
  /** One line of what actually happened. */
  detail: string;
  at: number;
}

export interface Fact {
  id: string;
  /** Machine key, e.g. "target_field". Stable across updates. */
  key: string;
  /** Plain sentence shown to the model. */
  value: string;
  /** How many episodes support it. This is the evidence, and it is visible. */
  evidence: number;
  at: number;
  updatedAt: number;
  /** True when the person confirmed or corrected it — never auto-demoted. */
  confirmed?: boolean;
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
 * Record something that happened. A repeat of the same topic within the same
 * day replaces rather than piles up — five identical entries are not five
 * pieces of evidence, and pretending they are is how a coach talks itself into
 * a wrong conclusion.
 */
export function addEpisode(memory: Memory, topic: string, detail: string, now = Date.now()): Memory {
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
  };
  return { ...memory, episodes: cap([...memory.episodes, episode], MAX_EPISODES) };
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
      facts: memory.facts.map((f) => (f.key === key ? { ...f, value, confirmed, updatedAt: now } : f)),
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
 */
export function renderMemoryBlock(memory: Memory): string {
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
      parts.push(`- ${f.value} (${basis})`);
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
    for (const e of recent) parts.push(`- ${e.detail || e.topic.replace(/_/g, " ")}`);
  }

  return parts.join("\n");
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
 */
export async function updateMemory(
  change: (memory: Memory) => Memory,
): Promise<{ memory: Memory; promoted: Fact[] }> {
  const before = await loadMemory();
  const changed = change(before);
  const { memory, promoted } = consolidate(changed);
  if (promoted.length > 0 || memory !== before) await saveMemory(memory);
  return { memory, promoted };
}
