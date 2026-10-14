/**
 * The Jobs flow's pure logic — no React, no styles, so the rules are testable
 * on their own (see `job-labels.test.ts`). Same shape as
 * `components/home/home-labels.ts`.
 *
 * THE ONE RULE THIS FILE EXISTS TO ENFORCE: **a score and its reason travel as
 * ONE value.** `JobMatch.score` and `JobMatch.reason` are declared together and
 * `reason` is required, so no card can render a percentage without the
 * one-line explanation the design makes mandatory — and no card can invent one
 * either, because the object only exists when an engine produced it:
 *
 *   `source: "profile"` — `GET /api/jobs/recommendations`, the server's own
 *     matcher, scored against the user's Career Profile / CV. Its `reason`
 *     comes from the server with its score.
 *   `source: "cv"` — `matchJd()` from `lib/ats.ts` on the device: the same
 *     keyword-overlap engine the CV check and the Applications list already
 *     run, comparing the user's most recent CV with the advert's own text.
 *     Nothing is fetched and nothing is guessed; its reason is built from the
 *     terms that actually overlapped.
 *
 * When neither engine can produce a number — no CV on the phone and no
 * profile match from the server — `matchViewFor()` returns the `unknown`
 * state and the card omits the score element entirely. §5 of the brief: never
 * a placeholder score.
 */
import type { CVData } from "@sumaiya/types";
import type { JobListing, JobRecommendation } from "@sumaiya/api-client";
import { matchJd } from "../../lib/ats";
import type { Lang } from "../../lib/i18n";

// ── The score's colour band ──────────────────────────────────────────────────
/**
 * The app's existing bands (they are the ones `MatchBadge` and Home's job rows
 * already use, so the feed and the advert cannot disagree about what "60 %"
 * looks like). §6: the design fragment paints 88 % `emerald-*` and 72 %
 * `amber-*` — Tailwind's palette is a mockup artefact, NOT a token. The band
 * is the app's; the colour comes from `useThemeColors()`.
 */
export type ScoreBand = "strong" | "fair" | "weak";

export function scoreBand(score: number): ScoreBand {
  return score >= 60 ? "strong" : score >= 35 ? "fair" : "weak";
}

/** The three token colours a band can use. Structural, so the rule is testable
 *  without loading the theme's native dependencies. */
export interface ScoreColors {
  success: string;
  warning: string;
  textMuted: string;
}

export function bandColor(band: ScoreBand, c: ScoreColors): string {
  return band === "strong" ? c.success : band === "fair" ? c.warning : c.textMuted;
}

// ── The match ────────────────────────────────────────────────────────────────
export interface JobMatch {
  /** 0–100, computed by the engine named in `source`. Never a placeholder. */
  score: number;
  /** The one-line why. Mandatory — this is why it lives in the same object. */
  reason: string;
  /** Real terms the advert and the profile/CV share (device engine). */
  matched: string[];
  /** Real terms the advert asks for and the CV does not have (device engine). */
  missing: string[];
  source: "profile" | "cv";
}

export type MatchView =
  | { state: "scored"; match: JobMatch }
  | { state: "unknown"; why: "no-cv" | "no-advert" };

/** `matchJd` is only meaningful on a real advert — the same 40-character floor
 *  the CV check and the Applications list already apply before scoring. */
export const MIN_ADVERT_CHARS = 40;

const clampScore = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

const reasonWhenProfileIsSilent: Record<Lang, string> = {
  en: "Your profile lines up with this advert's main requirements.",
  sw: "Wasifu wako unalingana na mahitaji makuu ya tangazo hili.",
};

/**
 * The device engine's result. Deterministic and offline: the user's CV against
 * the advert's own text. Returns the matched/missing terms as the engine
 * computed them, so the detail screen's ✓ / ! rows are real findings rather
 * than the design's sample sentence.
 */
export function localMatch(cvData: CVData, job: JobListing, lang: Lang): JobMatch {
  const { score, matched, missing } = matchJd(cvData, (job.description ?? "").trim());
  const terms = matched.slice(0, 3);
  const reason = terms.length
    ? lang === "sw"
      ? `Ujuzi unaolingana: ${terms.join(", ")}.`
      : `Matching skills: ${terms.join(", ")}.`
    : lang === "sw"
      ? "Bado hakuna maneno yanayolingana kati ya wasifu wako na tangazo hili."
      : "Nothing in the advert matches your CV yet.";
  return { score: clampScore(score), reason, matched, missing, source: "cv" };
}

/**
 * The one place a feed card or the advert screen asks "what is this match?".
 *
 * A server score wins when there is one — it is the profile-level match and it
 * is what the user's own recommendation list was built from. The device
 * engine's TERM LISTS are still attached when a CV is on the phone, because
 * they are separate, checkable facts (which words overlapped and which did
 * not) and they never restate the number.
 */
export function matchViewFor(
  job: JobListing,
  opts: {
    lang: Lang;
    /** The user's most recent CV, when the phone has one worth scoring. */
    cvData?: CVData | null;
    /** A score the server computed against the user's profile, when present. */
    serverScore?: number;
    serverReason?: string;
  },
): MatchView {
  const { lang } = opts;
  const advert = (job.description ?? "").trim();
  const local =
    opts.cvData && advert.length >= MIN_ADVERT_CHARS ? localMatch(opts.cvData, job, lang) : null;
  const server =
    typeof opts.serverScore === "number" && Number.isFinite(opts.serverScore)
      ? clampScore(opts.serverScore)
      : null;

  if (server !== null) {
    return {
      state: "scored",
      match: {
        score: server,
        // The server's reason is the sentence the design asks for; the device
        // engine's stands in only if the payload arrived without one, and a
        // plain statement of what the score means is the last resort. Never
        // an invented number — the score above is the server's own.
        reason: (opts.serverReason ?? "").trim() || local?.reason || reasonWhenProfileIsSilent[lang],
        matched: local?.matched ?? [],
        missing: local?.missing ?? [],
        source: "profile",
      },
    };
  }

  if (local) return { state: "scored", match: local };

  // Nothing to score with — and WHICH nothing matters, because the honest next
  // step differs (build a CV vs. read the advert, which has no text to compare).
  return { state: "unknown", why: opts.cvData ? "no-advert" : "no-cv" };
}

/** The recommendation payload, narrowed to the same shape as everything else. */
export function recommendationMatch(rec: JobRecommendation, lang: Lang): JobMatch | null {
  const view = matchViewFor(rec.job, { lang, serverScore: rec.score, serverReason: rec.reason });
  return view.state === "scored" ? view.match : null;
}

// ── "Imepostiwa …" ───────────────────────────────────────────────────────────
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * The advert's date line, from the right date.
 *
 * `postedAt` is when the SOURCE says the employer posted it; `createdAt` is
 * when our pipeline first saw the row. They are different facts and B4's line
 * is about the first one, so a listing whose source publishes no date gets a
 * different verb (`Imeingizwa` / "Added") rather than being told the advert
 * went up the moment we happened to crawl it.
 *
 * `fromSource` is returned so a caller can show the exact date (the advert
 * screen does) without re-deciding which date it is looking at.
 */
export function postedLine(
  job: { postedAt?: string | null; createdAt?: string | null },
  lang: Lang,
  now: Date = new Date(),
): { label: string; ago: string; fromSource: boolean } | null {
  if (job.postedAt) {
    const ago = postedAgo(job.postedAt, lang, now);
    if (ago) return { label: lang === "sw" ? "Imepostiwa" : "Posted", ago, fromSource: true };
  }
  const ago = postedAgo(job.createdAt ?? null, lang, now);
  if (!ago) return null;
  return { label: lang === "sw" ? "Imeingizwa" : "Added", ago, fromSource: false };
}

/**
 * The pay the source stated, or null.
 *
 * Only ever the source's own figure: the numeric range when it published
 * numbers, its own wording when it published words. NOTHING is derived — no
 * "salary not disclosed", no average, no conversion.
 *
 * A NUMERIC salary is withheld until its period is known. "TZS 1,800,000" with
 * no period reads as a monthly wage to the person deciding whether they can
 * afford to apply, and Jobicy/Adzuna both publish ANNUAL figures — that
 * misreading understates the pay twelvefold. Both adapters that produce numbers
 * set `salaryPeriod`, so this guards a source that forgets, not a live case.
 */
export function salaryView(
  job: {
    salaryMin?: number | null;
    salaryMax?: number | null;
    salaryCurrency?: string;
    salaryPeriod?: string;
    salaryText?: string;
  },
  lang: Lang,
): { text: string; numeric: boolean } | null {
  const min = typeof job.salaryMin === "number" && job.salaryMin > 0 ? job.salaryMin : null;
  const max = typeof job.salaryMax === "number" && job.salaryMax > 0 ? job.salaryMax : null;
  const period = periodWord(job.salaryPeriod, lang);
  const text = (job.salaryText ?? "").trim();

  if ((min !== null || max !== null) && period) {
    const fmt = (n: number) => n.toLocaleString("en-US");
    const range =
      min !== null && max !== null
        ? min === max
          ? fmt(min)
          : `${fmt(min)} – ${fmt(max)}`
        : fmt((min ?? max) as number);
    const currency = (job.salaryCurrency ?? "").trim().toUpperCase();
    return { text: [currency, range, period].filter(Boolean).join(" "), numeric: true };
  }

  // Numeric but no period: the numbers exist and cannot be safely printed, so
  // the source's own words are used when it gave any. Silence otherwise.
  return text ? { text, numeric: false } : null;
}

/** The words for a pay period, or "" when the source's period is unknown. */
function periodWord(period: string | undefined, lang: Lang): string {
  const p = (period ?? "").trim().toLowerCase();
  const tableSw: Record<string, string> = {
    year: "kwa mwaka", month: "kwa mwezi", week: "kwa wiki", day: "kwa siku", hour: "kwa saa",
  };
  const tableEn: Record<string, string> = {
    year: "a year", month: "a month", week: "a week", day: "a day", hour: "an hour",
  };
  return (lang === "sw" ? tableSw : tableEn)[p] ?? "";
}

/**
 * When the advert went up, in the words B4 uses (`Imepostiwa masaa 4
 * yaliyopita`, `Imepostiwa jana`).
 *
 * Home's `editedAgo` says `saa 4 zilizopita` for an edited document — the right
 * word for a CV, and the wrong one for an advert, which the design writes as
 * `masaa`. The two helpers also diverge past a week (Home falls back to a
 * date, this falls back to one too) but not in the same way: `masaa` needs its
 * own noun, so this is its own small formatter rather than a second parameter
 * threaded into Home's.
 *
 * Returns `null` for a listing with no `createdAt` — the app does not know when
 * it was posted, and B4's timestamp is a fact, not decoration.
 */
export function postedAgo(
  at: string | Date | null | undefined,
  lang: Lang,
  now: Date = new Date(),
): string | null {
  if (!at) return null;
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return null;

  const diff = Math.max(0, now.getTime() - date.getTime());
  const minutes = Math.floor(diff / MINUTE);
  const hours = Math.floor(diff / HOUR);
  const days = Math.floor(diff / DAY);

  if (lang === "sw") {
    if (minutes < 1) return "sasa hivi";
    // Singular is written as a word, never as "1 zilizopita" (swahili-lint-ignore).
    if (minutes < 60) return minutes === 1 ? "dakika moja iliyopita" : `dakika ${minutes} zilizopita`;
    if (hours < 24) return hours === 1 ? "saa moja iliyopita" : `masaa ${hours} yaliyopita`;
    if (days === 1) return "jana";
    if (days < 7) return `siku ${days} zilizopita`;
    return date.toLocaleDateString("sw-TZ", { day: "numeric", month: "short" });
  }

  if (minutes < 1) return "just now";
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

// ── The chip row's filters ───────────────────────────────────────────────────
/**
 * B4's four chips, in the design's order and with the design's words.
 *
 * They are LABELS over filters the data can actually answer — a location the
 * listing states, or the words `remote` / `mbali` in the location, the role or
 * the employment type. A chip whose result set is empty is not hidden: it
 * shows the honest "nothing here" state with the way back to `Zote`, because
 * the feed is live and today's empty chip is tomorrow's full one.
 */
export type JobFilterKey = "all" | "dar" | "gulf" | "remote";

export const JOB_FILTERS: readonly { key: JobFilterKey; en: string; sw: string }[] = [
  { key: "all", en: "All", sw: "Zote" },
  { key: "dar", en: "Dar es Salaam", sw: "Dar es Salaam" },
  { key: "gulf", en: "Gulf jobs", sw: "Kazi za Ghuba" },
  { key: "remote", en: "Remote", sw: "Za Mbali (Remote)" },
];

const DAR_RE = /\b(dar es salaam|dsm)\b/i;
const GULF_RE =
  /\b(doha|dubai|abu dhabi|sharjah|ajman|al ain|qatar|uae|united arab emirates|saudi|riyadh|jeddah|dammam|khobar|oman|muscat|kuwait|bahrain|manama)\b/i;
const REMOTE_RE = /\b(remote|mbali|work from home|wfh)\b/i;

/** Where a listing says it is — the fields a location filter may read. */
function place(job: JobListing): string {
  return [job.location, job.title, job.company, job.employmentType].filter(Boolean).join(" ");
}

export function matchesFilter(job: JobListing, key: JobFilterKey): boolean {
  if (key === "all") return true;
  const text = place(job);
  if (key === "dar") return DAR_RE.test(text);
  if (key === "gulf") return GULF_RE.test(text);
  return REMOTE_RE.test(text);
}

/** `Tafuta cheo au kampuni…` — matched against the two fields it names, plus
 *  the location, which is the third thing a user types into that field. */
export function matchesQuery(job: JobListing, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [job.title, job.company, job.location]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(q));
}

// ── The advert's own text, as a list ─────────────────────────────────────────
/**
 * The advert's own words, one line per point — the shape B5 gives the body
 * (`Majukumu Makuu:` + bullets).
 *
 * Nothing is summarised and nothing is rewritten: the lines are the listing's
 * `description`, with the leading bullet/number markers stripped and blank
 * lines dropped. An advert written as one paragraph is returned as its
 * sentences, so a scraped blob still reads as a list rather than one wall of
 * text. A description with no structure at all comes back as a single line and
 * the screen renders it as a paragraph instead of pretending it is a list.
 */
export function advertBullets(description: string | null | undefined, max = 40): string[] {
  const text = (description ?? "").replace(/\r/g, "").trim();
  if (!text) return [];
  const lines = text
    .split(/\n+/)
    .map((s) => s.replace(/^\s*(?:[-•*–]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
  const items =
    lines.length > 1
      ? lines
      : (lines[0] ?? "")
          .split(/(?<=[.!?])\s+/)
          .map((s) => s.trim())
          .filter(Boolean);
  return items.slice(0, max);
}
