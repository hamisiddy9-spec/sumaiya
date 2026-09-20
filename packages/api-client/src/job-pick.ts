/**
 * "Which job are you aiming at?" — the shared model behind the assistant's
 * *Lenga kwenye kazi* action on BOTH surfaces (web assistant, Android app).
 *
 * The rule the owner set: the chat must never assume which job. It offers two
 * paths — pick one of Sumaiya's own live listings, or bring your own (paste the
 * advert, or a link) — and this module is the one place that decides what those
 * paths are, what each one costs the phone, and what text the match engine is
 * handed.
 *
 * Two invariants, both enforced by tests on both surfaces:
 *   1. Nothing is invented. A path that cannot be honoured (the feed is empty,
 *      a listing has no advert text, a link could not be read) is either not
 *      offered or says so — never filled with an example, a placeholder or a
 *      plausible-looking job.
 *   2. The light pick-list is LIGHT. The public feed is ~350 KB for 100 rows
 *      because every row carries its full description; a first-time jobseeker
 *      on a cheap Android phone must not pay that to see a list of titles.
 *      The picker asks for `light=1` (projected columns, no description) and
 *      fetches the one advert it actually needs, by id, only when chosen.
 */

/** The two (never more) ways a user can name the job in the chat. */
export type JobChoicePath = "ours" | "own";

export interface JobPickRow {
  id: string;
  title: string;
  company: string;
  location: string;
}

export interface JobPickDetail extends JobPickRow {
  /** The real advert text. Absent on a thin listing — which is why jobToJd refuses it. */
  description: string;
}

export const PICK_LIMIT_DEFAULT = 12;
export const PICK_LIMIT_MAX = 30;
export const PICK_QUERY_MAX = 60;

/**
 * The same floor the snap screen has always used before it will tailor
 * (`job-apply-screen.tsx`: `if (jd.trim().length < 60)`). Shared so the picker
 * cannot hand the engine something the screen itself would refuse.
 */
export const MIN_JD_CHARS = 60;

/** Trim, collapse whitespace, strip LIKE wildcards, cap. A search box is user input. */
export function normalizePickQuery(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    // Wildcards FIRST, then whitespace: stripping "%_" into spaces after the
    // collapse would leave a double space behind ("100%_man" → "100  man").
    .replace(/[%_\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, PICK_QUERY_MAX);
}

export function parsePickLimit(raw: unknown): number {
  const n = Math.trunc(Number(raw));
  if (!Number.isFinite(n) || n <= 0) return PICK_LIMIT_DEFAULT;
  return Math.min(n, PICK_LIMIT_MAX);
}

/**
 * Does this GET /api/jobs call want the picker shape (light projection, search,
 * or a single row by id) rather than the full public feed? The full feed's
 * response is unchanged when this is false — that is the back-compatibility the
 * jobs page, the web assistant's own job search and the Android jobs screen all
 * depend on.
 */
export function isPickRequest(q: { q?: string; id?: string; light?: string; limit?: string }): boolean {
  return Boolean(String(q.id ?? "").trim()) || Boolean(normalizePickQuery(q.q)) || q.light === "1" || q.limit !== undefined;
}

/** The short list: titles and companies only, so opening "our listings" is cheap. */
export function buildPickListUrl(input: { q?: string; limit?: number } = {}): string {
  const params = new URLSearchParams();
  params.set("light", "1");
  params.set("limit", String(parsePickLimit(input.limit ?? PICK_LIMIT_DEFAULT)));
  const q = normalizePickQuery(input.q);
  if (q) params.set("q", q);
  return `/api/jobs?${params.toString()}`;
}

/** The single advert, fetched only after the user has actually chosen it. */
export function buildPickRowUrl(id: string): string {
  return `/api/jobs?id=${encodeURIComponent(id)}`;
}

/**
 * Turn a server answer into rows, dropping anything malformed. A row without an
 * id or a title is not rendered at all: the picker must never show a job the
 * server did not send.
 */
export function parsePickResponse(json: unknown): JobPickRow[] {
  const data = (json as { data?: unknown } | null)?.data;
  if (!Array.isArray(data)) return [];
  const out: JobPickRow[] = [];
  for (const raw of data) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id.trim() : "";
    const title = typeof o.title === "string" ? o.title.trim() : "";
    if (!id || !title) continue;
    out.push({
      id,
      title,
      company: typeof o.company === "string" ? o.company.trim() : "",
      location: typeof o.location === "string" ? o.location.trim() : "",
    });
  }
  return out;
}

/** First row of a single-row answer (id lookup), or null. */
export function parsePickDetail(json: unknown): JobPickDetail | null {
  const data = (json as { data?: unknown } | null)?.data;
  const rows = Array.isArray(data) ? data : [];
  for (const raw of rows) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id.trim() : "";
    const title = typeof o.title === "string" ? o.title.trim() : "";
    if (!id || !title) continue;
    return {
      id,
      title,
      company: typeof o.company === "string" ? o.company.trim() : "",
      location: typeof o.location === "string" ? o.location.trim() : "",
      description: typeof o.description === "string" ? o.description : "",
    };
  }
  return null;
}

/**
 * The ONE job-description shape both surfaces hand to the match/tailor engine:
 * `<title>\n<company>\n\n<advert text>` — byte-identical to what the Android
 * jobs screen has always passed to the snap screen, so the same listing picked
 * in the chat or from the jobs list produces the same match.
 *
 * Returns "" when the listing carries no advert text. A title alone is not an
 * advert, and inventing one (or letting the engine guess) is the banned
 * fabrication pattern — the caller must say "this listing has no advert text"
 * instead of running on nothing.
 */
export function jobToJd(row: { title?: string; company?: string; description?: string }): string {
  const desc = String(row?.description ?? "").trim();
  if (!desc) return "";
  const title = String(row?.title ?? "").trim();
  const company = String(row?.company ?? "").trim();
  return `${title}\n${company}\n\n${desc}`;
}

/** Would the existing snap screen accept this? Mirrors its own 60-character floor. */
export function isUsableJd(jd: string): boolean {
  return String(jd ?? "").trim().length >= MIN_JD_CHARS;
}

export interface JobChoiceModel {
  /** In order. Always contains "own"; contains "ours" only when we have listings. */
  paths: JobChoicePath[];
  /** True when a job was already brought into this thread — never re-ask for it. */
  continuePending: boolean;
}

/**
 * The choice itself. Two paths from one place, and the honest exception:
 * when the feed came back empty we do NOT offer "our listings" — an app that
 * offers a list it does not have is lying to a jobseeker.
 */
export function jobChoiceModel(opts: { hasPendingJob?: boolean; feedEmpty?: boolean } = {}): JobChoiceModel {
  const paths: JobChoicePath[] = opts.feedEmpty === true ? ["own"] : ["ours", "own"];
  return { paths, continuePending: Boolean(opts.hasPendingJob) };
}

/**
 * Where a path leads, before any request is made. Kept data-shaped so the chat
 * component stays a renderer and the routing stays testable on both surfaces.
 */
export function jobChoiceAction(path: JobChoicePath): { kind: JobChoicePath; request: string | null } {
  return path === "ours" ? { kind: "ours", request: buildPickListUrl() } : { kind: "own", request: null };
}
