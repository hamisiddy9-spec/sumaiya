/**
 * Job source adapter contracts — the foundation of the aggregation engine.
 *
 * Every job source (free API, key-gated API, public ATS feed) is ONE file
 * implementing `JobSourceAdapter`. The registry (`./registry`) iterates the
 * adapter list, so adding a source = adding a file + registering it — never
 * touching ingest logic again.
 *
 * Contract rules (non-negotiable):
 *   - `enabled()` returns false when the source needs a key that isn't
 *     configured. A disabled source is SKIPPED SILENTLY — ingest still runs.
 *   - `fetch()` returns RAW source fields. Cleaning/normalization into the
 *     canonical `NormalizedJob` shape happens ONCE, in the registry, through
 *     the existing text.ts pipeline (decode entities → strip tags → collapse).
 *   - `fetch()` may THROW (network down, 5xx, bad JSON). The registry wraps
 *     every adapter in try/catch so one dead source never kills the run.
 *   - Jobs are NEVER fabricated: every field traces back to the real source
 *     response, and `externalId`/`sourceUrl`/`applyUrl` pin the posting to
 *     its canonical page on that source.
 */

/** Optional per-run parameters (pagination etc.). Adapters may ignore. */
export interface FetchParams {
  limit?: number;
  offset?: number;
}

/**
 * A single posting exactly as the source reported it — fields are mapped
 * from the raw API response but NOT yet cleaned (descriptions may still
 * carry HTML/entities; that's the registry's job).
 */
export interface RawJob {
  title: string;
  company: string;
  location: string;
  category: string;
  employmentType: string;
  /** Raw description HTML/entities — cleaned by the registry via text.ts. */
  description: string;
  /** Real apply link (http/https only — verified again by authenticity). */
  applyUrl: string;
  /** Canonical listing URL on the source (may equal applyUrl). */
  sourceUrl: string;
  /** The source's own job id — the (source, externalId) dedup key. */
  externalId: string;
  /** Source-provided deadline (null when the source has none). */
  applicationDeadline?: Date | null;
  /** Source-provided posting date (null when the source has none). */
  postedAt?: Date | null;
  /** True when the source marks this posting as remote. */
  remote?: boolean;
}

/**
 * The canonical, cleaned job shape every downstream consumer (feed, match,
 * recommend, signals, orchestrator) reads. Produced by `normalizeRawJob`
 * in the registry — the ONLY place raw jobs become canonical.
 */
export interface NormalizedJob {
  title: string;
  company: string;
  location: string;
  category: string;
  employmentType: string;
  description: string;
  applyUrl: string;
  source: string; // adapter id: "remotive" | "jobicy" | …
  sourceName: string; // human label: "Remotive" | "Jobicy" | …
  sourceUrl: string;
  externalId: string;
  applicationDeadline?: Date | null;
  postedAt?: Date | null;
}

/**
 * One job source behind the registry. `id` must be unique and stable (it is
 * the `source` column value in the DB). `name` is the human label shown in
 * the feed.
 */
export interface JobSourceAdapter {
  id: string;
  name: string;
  /** False when the source needs a key that isn't configured. */
  enabled(): boolean;
  /** Fetch + map to RawJob[]. May throw — the registry isolates failures. */
  fetch(params?: FetchParams): Promise<RawJob[]>;
  /**
   * Optional ceiling on how many postings this source may contribute to ONE
   * run. Set on the global remote boards so a 300-posting Western feed cannot
   * swamp the Tanzania / East Africa sources this product is built for — the
   * ingest is otherwise source-counted, and raw volume wins every time.
   * Unset (or 0) means unlimited. The registry keeps the FIRST N postings the
   * adapter returned, which for these boards is the newest N. A function form
   * is allowed so the cap can be read from the environment at RUN time rather
   * than frozen at module load.
   */
  maxPerSource?: number | (() => number);
}

/** Per-source outcome of a run — used for logging + the run report. */
export interface SourceRunReport {
  source: string;
  name: string;
  /** True when the adapter was enabled and fetch() was attempted. */
  ran: boolean;
  /** True when the adapter fetched and normalized without throwing. */
  ok: boolean;
  /** Number of canonical jobs this source produced AFTER any per-source cap. */
  count: number;
  /** True when the adapter was skipped because enabled() was false. */
  skipped?: boolean;
  /** Error message when the fetch failed. */
  error?: string;
  /** How many postings were dropped by the adapter's own `maxPerSource`. */
  capped?: number;
}
