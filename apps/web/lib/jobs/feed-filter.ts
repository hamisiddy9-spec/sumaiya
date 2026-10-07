/**
 * Pure feed filtering/sorting/grouping for the jobs page. No React, no DB —
 * unit-testable and shared between the server page (default sort) and the
 * client feed (interactive filters).
 */

export interface FeedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  category: string;
  employmentType: string;
  description: string;
  applyUrl: string;
  status: string;
  featured: boolean;
  applicationDeadline: string | null;
  sourceName: string;
  createdAt: string;
  matchScore: number | null;
  missing: string[];
}

export type SortMode = "newest" | "match" | "closing";
export type RecencyFilter = "any" | "7d" | "14d" | "30d";
export type ScoreFilter = "any" | "50" | "70" | "90";

export interface FeedFilters {
  query: string;
  category: string;
  location: string; // "" = anywhere, "__remote__" = remote-only, else exact location
  minScore: ScoreFilter;
  recency: RecencyFilter;
}

export const REMOTE_LOCATION = "__remote__";
const REMOTE_RE = /remote|anywhere|worldwide|global/i;

export const DEFAULT_FILTERS: FeedFilters = {
  query: "",
  category: "",
  location: "",
  minScore: "any",
  recency: "any",
};

export function isRemoteLocation(location: string): boolean {
  return REMOTE_RE.test(location);
}

export function filterJobs(jobs: FeedJob[], f: FeedFilters): FeedJob[] {
  const q = f.query.trim().toLowerCase();
  const minScore = f.minScore === "any" ? null : Number(f.minScore);
  const maxAgeMs =
    f.recency === "7d" ? 7 * 86_400_000
    : f.recency === "14d" ? 14 * 86_400_000
    : f.recency === "30d" ? 30 * 86_400_000
    : null;
  const now = Date.now();

  return jobs.filter((j) => {
    if (f.category && j.category.trim() !== f.category) return false;
    if (f.location === REMOTE_LOCATION) {
      if (!isRemoteLocation(j.location)) return false;
    } else if (f.location && j.location.trim() !== f.location) {
      return false;
    }
    if (minScore !== null && (j.matchScore ?? 0) < minScore) return false;
    if (maxAgeMs !== null) {
      const age = now - new Date(j.createdAt).getTime();
      if (age > maxAgeMs) return false;
    }
    if (!q) return true;
    return (
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q) ||
      j.category.toLowerCase().includes(q)
    );
  });
}

export function sortJobs(jobs: FeedJob[], sort: SortMode): FeedJob[] {
  const arr = [...jobs];
  if (sort === "match") {
    arr.sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));
  } else if (sort === "closing") {
    arr.sort((a, b) => {
      const da = a.applicationDeadline ? new Date(a.applicationDeadline).getTime() : Number.POSITIVE_INFINITY;
      const db = b.applicationDeadline ? new Date(b.applicationDeadline).getTime() : Number.POSITIVE_INFINITY;
      return da - db;
    });
  } else {
    arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return arr;
}

/** Recency bands for grouped browsing (only meaningful on the newest sort). */
export interface RecencyGroup {
  key: "today" | "thisWeek" | "earlier";
  jobs: FeedJob[];
}

export function groupByRecency(jobs: FeedJob[], now = Date.now()): RecencyGroup[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6); // rolling 7 days incl. today

  const groups: RecencyGroup[] = [
    { key: "today", jobs: [] },
    { key: "thisWeek", jobs: [] },
    { key: "earlier", jobs: [] },
  ];
  for (const j of jobs) {
    const t = new Date(j.createdAt).getTime();
    if (t >= today.getTime()) groups[0].jobs.push(j);
    else if (t >= weekStart.getTime()) groups[1].jobs.push(j);
    else groups[2].jobs.push(j);
  }
  return groups.filter((g) => g.jobs.length > 0);
}

/** Location options: "Remote" first (when any job is remote), then the most
 *  common concrete locations, capped so the dropdown stays scannable. */
export function topLocations(jobs: FeedJob[], limit = 12): string[] {
  const counts = new Map<string, number>();
  let remoteCount = 0;
  for (const j of jobs) {
    const loc = j.location.trim();
    if (!loc) continue;
    if (isRemoteLocation(loc)) {
      remoteCount += 1;
      continue;
    }
    counts.set(loc, (counts.get(loc) ?? 0) + 1);
  }
  const out = remoteCount > 0 ? [REMOTE_LOCATION] : [];
  out.push(
    ...[...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit)
      .map(([loc]) => loc),
  );
  return out;
}

/** Category options sorted by frequency (most common first). */
export function topCategories(jobs: FeedJob[], limit = 20): string[] {
  const counts = new Map<string, number>();
  for (const j of jobs) {
    const c = j.category.trim();
    if (!c) continue;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([c]) => c);
}

/* ── Home market ─────────────────────────────────────────────────────────────
 * Sumaiya is a Tanzanian product, and until the JobwebTanzania source was
 * added the feed held ZERO Tanzanian listings out of 8,079 — every one was
 * Arbeitnow/Germany, Jobicy, Himalayas or USAJobs. A Tanzanian job-seeker
 * opening "Ajira" was shown Berlin and London, which reads as a product that
 * is not for them.
 *
 * This is ordering, not censorship: nothing is hidden or deleted, and remote
 * and foreign listings remain in the feed below the home-market ones. The
 * names below are Tanzanian cities/regions used as a MATCHING AID only — no
 * job is ever given a location it did not state.
 */
/**
 * The home-market matching aid, as DATA — one list, two consumers.
 *
 * This is deliberately a single source of truth, because the two consumers MUST NOT
 * drift: the JS predicate below, and the SQL ORDER BY in `lib/api/routes/jobs.ts` that
 * decides WHICH rows the LIMIT slice is taken from.
 *
 * Measured 2026-09-21, and this is why the SQL side exists at all: `homeMarketFirst` is
 * a stable partition of rows the caller has ALREADY fetched, so it can only reorder what
 * survived the LIMIT — it cannot promote a row that was never in the slice. The public
 * feed fetched `ORDER BY featured, created_at LIMIT 100` and every one of those 100 rows
 * was a German listing, so the partition was a no-op and **365 live Tanzanian jobs were
 * unreachable** — a user in Dar es Salaam opened the jobs tab on Berlin and Frankfurt.
 * Ordering in SQL before the LIMIT is the fix; this list is what both halves match on.
 */
export const HOME_MARKET_TERMS = [
  "tanzania", "tanzanian", "dar es salaam", "dar", "dodoma", "arusha", "mwanza",
  "mbeya", "morogoro", "tanga", "zanzibar", "unguja", "pemba", "kilimanjaro",
  "moshi", "kigoma", "shinyanga", "tabora", "songea", "iringa", "singida",
  "bukoba", "musoma", "mtwara", "lindi", "njombe", "geita", "simiyu", "katavi",
  "rukwa", "pwani", "ruvuma", "kagera",
] as const;

const HOME_MARKET_RE = new RegExp(`\\b(${HOME_MARKET_TERMS.join("|")})\\b`, "i");

/**
 * The same list for the SQL ORDER BY, built from `HOME_MARKET_TERMS` so the two can
 * never diverge — but with Postgres' OWN word-boundary escape.
 *
 * `\b` is JavaScript's word boundary and **Postgres does not implement it**: inside an
 * ARE pattern `\b` is a backspace character. Measured against the live table
 * (2026-09-21, 1,304 rows, 365 with `location = 'Tanzania'`):
 *
 *     location ~* '\b(tanzania)\b'  -> 0 rows     <- silently matches nothing
 *     location ~* '\y(tanzania)\y'  -> 365 rows   <- Postgres' word boundary
 *
 * Copying the JS pattern into SQL would therefore have produced a fix that did nothing,
 * with no error and no failing test. Postgres' escape is `\y`.
 */
export const HOME_MARKET_SQL_PATTERN = `\\y(${HOME_MARKET_TERMS.join("|")})\\y`;

/** True when a listing's own stated location is in the home market. */
export function isHomeMarketLocation(location: string): boolean {
  return HOME_MARKET_RE.test(location);
}

/**
 * Stable partition — home-market listings first, everything else after, with
 * the incoming order preserved inside each group (so the caller's
 * featured/newest ordering still decides within a group).
 */
export function homeMarketFirst<T extends { location: string }>(jobs: T[]): T[] {
  const home: T[] = [];
  const rest: T[] = [];
  for (const j of jobs) (isHomeMarketLocation(j.location) ? home : rest).push(j);
  return [...home, ...rest];
}
