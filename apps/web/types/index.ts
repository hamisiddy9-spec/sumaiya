import { z } from "zod";
import { toStoredCvData } from "@sumaiya/utils/cv-shape";
import { TEMPLATE_REGISTRY } from "@/lib/templates/registry";
import { CURATED_CV_TEMPLATE_IDS, PREMIUM_TEMPLATE_IDS } from "@/lib/templates/curation";

// ─── Zod Schemas for Runtime Validation ──────────────────────────────────────
//
// The `.default(...)` / `.catch(...)` calls below are load-bearing, not
// decoration. Documents in the database are written by several clients over
// time, and they do not all contain every key — the mobile app omits whatever
// it has no data for, and older web versions predate fields like `referees`.
// zod rejects the WHOLE object when one key is missing, and parseCVData then
// falls back to an empty CV — so a missing referees list cost the user their
// entire CV, silently. Measured 2026-09-13: 13 of 19 stored CVs rendered blank
// for exactly this reason. A missing field must never blank a document.

export const personalInfoSchema = z.object({
  fullName: z.string().default(""),
  jobTitle: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  linkedin: z.string().optional(),
  website: z.string().optional(),
  photo: z.string().optional(),
});

// ─── The row rule: a wrong type costs the FIELD, never the row ───────────────
//
// A stored CV is written by the editor, the native app, an import adapter and
// older builds. Any of them can get ONE scalar wrong (a `level` as "3", a
// `current` as "yes", a date as a number) while the row as a whole is perfectly
// good — so a malformed scalar is REPAIRED, and only a row that carries no
// content at all is dropped. See `keepRow` for the drop half of the rule.

/**
 * Text as the candidate typed it.
 *
 * A primitive with the wrong type is coerced losslessly — `String(v)`, exactly
 * what `@sumaiya/utils/cv-shape`'s `str()` does, so `startDate: 2020` survives
 * as "2020" rather than taking the row (and, at the document level, the CV) with
 * it. An object/array/null is NOT stringified: "[object Object]" is not what
 * anyone typed, so it becomes "".
 */
const text = () =>
  z.preprocess((v) => (typeof v === "string" ? v : v == null || typeof v === "object" ? "" : String(v)), z.string());

/** The same, for an optional field: absence stays absent. A malformed optional
 *  is dropped as a field rather than invented as "". */
const textOpt = () =>
  z.preprocess(
    (v) => (v == null || typeof v === "object" ? undefined : typeof v === "string" ? v : String(v)),
    z.string().optional(),
  );

/** A boolean that survives a wrong type. "true"/"yes"/1 are what a client means
 *  by true; anything unrecognisable is false, never invented as true. */
const bool = () => z.preprocess((v) => v === true || v === "true" || v === "yes" || v === 1 || v === "1", z.boolean());

export const experienceEntrySchema = z.object({
  id: text().default(""),
  company: text().default(""),
  position: text().default(""),
  location: textOpt(),
  startDate: text().default(""),
  endDate: text().default(""),
  // "yes"/"true"/1 all mean true; an unrecognisable value means false, never
  // an invented "still here".
  current: bool().default(false),
  description: text().default(""),
});

export const educationEntrySchema = z.object({
  id: text().default(""),
  institution: text().default(""),
  degree: text().default(""),
  field: text().default(""),
  startDate: text().default(""),
  endDate: text().default(""),
  grade: textOpt(),
  description: textOpt(),
});

export const SKILL_LEVEL_DEFAULT = 3;
/**
 * A skill's level arrives from the editor, the native app, an import, or an older build.
 * `z.union([literal(1)…literal(5)])` rejected anything else, `looseArray` then dropped the
 * row, and losing every row deleted the whole section from the page and the ATS layer.
 * A number (or numeric string) is CLAMPED into 1–5 — 0 → 1, 7 → 5, "3" → 3 — so the
 * candidate's intent survives; anything else falls back to 3. One malformed level must
 * cost one skill's precision, never a section.
 */
const skillLevelSchema = z.preprocess((v) => {
  const n = typeof v === "string" ? Number(v.trim()) : v;
  if (typeof n !== "number" || !Number.isFinite(n)) return SKILL_LEVEL_DEFAULT;
  return Math.min(5, Math.max(1, Math.round(n)));
}, z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).catch(SKILL_LEVEL_DEFAULT));
export const skillEntrySchema = z.object({
  id: text().default(""),
  name: text().default(""),
  level: skillLevelSchema,
});

export const LANGUAGE_PROFICIENCIES = ["Native", "Fluent", "Advanced", "Intermediate", "Basic"] as const;
/**
 * Three vocabularies reach this field and none of them is the other's:
 * the editor writes the five tokens below, the native AI route writes
 * `elementary|limited|professional|fluent|native` (`lib/api/routes/mobile.ts`),
 * and `@sumaiya/types` declares yet another set. Rejecting a value outside the
 * five used to drop the whole language row; now a known token is normalised to
 * its canonical spelling, an unknown one is KEPT as the candidate wrote it
 * (a human can read "professional"), and only a non-string becomes "".
 * Nothing is invented here — unlike `lib/cv/from-parsed.ts`'s
 * `normalizeProficiency`, which answers "Fluent" for an unstated value. That is
 * the right call for AI output, and the wrong one for a stored row.
 */
const proficiencySchema = z.preprocess((v) => {
  if (typeof v !== "string") return "";
  const raw = v.trim();
  return LANGUAGE_PROFICIENCIES.find((p) => p.toLowerCase() === raw.toLowerCase()) ?? raw;
}, z.string().default(""));

export const languageEntrySchema = z.object({
  id: text().default(""),
  name: text().default(""),
  proficiency: proficiencySchema,
});

export const certificationEntrySchema = z.object({
  id: text().default(""),
  name: text().default(""),
  issuer: text().default(""),
  date: text().default(""),
  url: textOpt(),
});

export const projectEntrySchema = z.object({
  id: text().default(""),
  name: text().default(""),
  description: text().default(""),
  role: textOpt(),
  url: textOpt(),
  date: textOpt(),
});

export const refereeEntrySchema = z.object({
  id: text().default(""),
  name: text().default(""),
  title: text().default(""),
  company: text().default(""),
  email: text().default(""),
  phone: text().default(""),
});

// ─── THE ROW RULE ────────────────────────────────────────────────────────────
//
// ONE rule, applied to every array section (skills, experience, education,
// projects, languages, certifications, referees) and to the write boundary:
//
//   1. the row is not a plain object                      -> DROPPED
//      (a string, a number, null: not a row at all)
//   2. the row's IDENTITY fields hold no readable text    -> DROPPED
//      (nothing but blanks and junk is corruption, not the candidate's data:
//       kept, it renders as an empty bullet in their CV)
//   3. the row carries content but has a missing or
//      malformed SCALAR (a skill's `level`, a job's
//      `current`, a date as a number)                     -> KEPT, scalar REPAIRED
//
// Rule 3 is the defect this rule exists for. `z.array(itemSchema)` fails the
// WHOLE document when one row is off, and `parseCVData` answers a failed
// document with an EMPTY CV — so a skill written without `level` (an older
// client, an import, the mobile writer) deleted the entire Skills section from
// the rendered CV AND from the exported PDF's ATS text layer. Measured, fixture
// `docs/qa-fixtures-2026-09-20/parsecvdata-proof.txt`
// (docs/QA-IO-MATRIX-2026-09-20.md D8): 9 skills in, 9 out with `level: 3`;
// **0 out** without `level`, with `"3"`, with `0`, with `7`.
//
// Rule 2 is the other half, and it is why this is a RULE and not a blanket
// `keep everything`: the first attempt at rule 3 kept every row it was handed,
// which put empty-name skills into the CV as blank bullets. A row with nothing
// readable is not the candidate's data.

/** The fields that make a row THAT row. `cvSections()` in
 *  `@sumaiya/utils/cv-shape` already defines "this section carries content"
 *  with these same keys, so the reader and the content check agree. */
const CV_ROW_IDENTITY: Record<string, readonly string[]> = {
  experience: ["company", "position"],
  education: ["institution", "degree", "field"],
  skills: ["name"],
  projects: ["name"],
  languages: ["name"],
  certifications: ["name"],
  referees: ["name"],
};

const isRow = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const readable = (v: unknown): boolean => typeof v === "string" && v.trim().length > 0;

/**
 * Apply the row rule to ONE row. Returns the parsed (repaired) row, or null when
 * the row is corruption.
 *
 * `identity` is the list of fields whose readable text makes the row worth
 * keeping; a row with none of them is dropped whatever else it holds.
 */
function keepRow<T extends z.ZodTypeAny>(
  item: T,
  identity: readonly string[],
  row: unknown,
): z.infer<T> | null {
  if (!isRow(row)) return null; // rule 1
  if (!identity.some((key) => readable(row[key]))) return null; // rule 2
  const parsed = item.safeParse(row);
  return parsed.success ? (parsed.data as z.infer<T>) : null; // rule 3
}

/**
 * An array whose items are validated INDIVIDUALLY under the row rule above,
 * dropping only what carries no content and repairing what it can.
 *
 * `z.array(x)` fails the WHOLE array when a single item fails, which fails the
 * whole object, which makes `parseCVData` return an empty CV. Measured
 * 2026-09-13: a CV whose only fault was one unrecognised `projects` entry
 * (`{ nonsense: true }`) parsed as completely blank; measured 2026-09-20: a
 * skill without `level` blanked the whole Skills section (D8).
 */
function rowArray<T extends z.ZodTypeAny>(section: string, item: T) {
  const identity = CV_ROW_IDENTITY[section] ?? ["name"];
  return z
    .array(z.unknown())
    .default([])
    .transform((raw) => raw.flatMap((row) => (keepRow(item, identity, row) ?? []) as z.infer<T>[]));
}

/** Same, for the sections that must stay ABSENT rather than become `[]`. */
function looseOptionalArray<T extends z.ZodTypeAny>(item: T) {
  return z
    .array(z.unknown())
    .optional()
    .transform((raw) =>
      raw === undefined
        ? undefined
        : raw.flatMap((entry) => {
            const parsed = item.safeParse(entry);
            return parsed.success ? [parsed.data as z.infer<T>] : [];
          }),
    );
}

export const cvDataSchema = z.object({
  // `.catch` rather than `.default` so a *malformed* personal block survives too,
  // not just a missing one. Losing a name is survivable; losing the CV is not.
  personal: personalInfoSchema.catch({ fullName: "", jobTitle: "", email: "", phone: "", location: "" }),
  summary: z.string().default(""),
  // Each array repairs what it can and drops only contentless rows (the rule
  // above), so one malformed row costs the user that row and nothing else.
  experience: rowArray("experience", experienceEntrySchema),
  education: rowArray("education", educationEntrySchema),
  skills: rowArray("skills", skillEntrySchema),
  // Optional-with-default so CVs saved before projects existed still parse.
  projects: rowArray("projects", projectEntrySchema),
  languages: rowArray("languages", languageEntrySchema),
  certifications: rowArray("certifications", certificationEntrySchema),
  referees: rowArray("referees", refereeEntrySchema),
  hobbies: z.string().default(""),
  hiddenSections: looseOptionalArray(z.string()),
  sectionOrder: looseOptionalArray(z.string()),
  density: z.enum(["compact", "normal", "airy"]).optional(),
  mode: z.string().optional(),
});

/**
 * Rows written before 2026-09-13 hold a document as a **JSON string inside** the
 * jsonb column (`jsonb_typeof = 'string'`) rather than as a jsonb object — in
 * every jsonb column on this database, not just one. A plain object parse
 * therefore failed and each reader silently returned an empty document, with
 * the data sitting right there in the column.
 *
 * Measured 2026-09-13 across all 26 jsonb columns: 11 of them carry a JSON
 * string in at least one row — `cv.data` 19/19, `user_profile.career_profile`
 * 12/14, `letter.data` 1/1, `business_card.data` 2/2,
 * `ats_score_snapshot.checks` 6/6, `job_recommendation.matched_terms` 46/46,
 * `job.corroborated_sources` 6635/8079, `document_version.snapshot` 3/3,
 * `cv.template_history` 2/19, `app_event.props` 11/57,
 * `debug_event.detail` 19/19.
 *
 * One unwrap, shared by every reader, so this cannot be fixed in one place and
 * left broken in the next. Two levels, so a doubly-encoded row still resolves.
 * On a genuine failure the caller decides what to do; nothing is invented here.
 */
export function unwrapStoredJson(data: unknown): unknown {
  let candidate: unknown = data;
  for (let i = 0; i < 2 && typeof candidate === "string"; i++) {
    try {
      candidate = JSON.parse(candidate);
    } catch {
      break; // not JSON — hand back the string and let the caller fall back
    }
  }
  return candidate;
}

/**
 * Read a value the TYPES call `string[]` when the DATABASE may hold a JSON
 * string, at the boundary, so the lie cannot travel further.
 *
 * `job_recommendation.matched_terms` is a JSON string in 46 of 46 production
 * rows — and it was read with an unchecked cast:
 *
 *     matchedTerms: (r.rec.matchedTerms ?? []) as string[]
 *
 * A string wearing an array type does not fail where you would notice. It is
 * NOT null-ish, so `?? []` never fires; `.length` returns the character count;
 * `.slice(0, 8)` returns the first eight CHARACTERS — so the chips that show a
 * user *why* a job matched would have rendered the first characters of the
 * serialised JSON. Only a `.map` in a render path throws, and then it is a
 * TypeError blamed on the component rather than on the row.
 *
 * Returns `string[]` always, so every caller stops being a place this can
 * go wrong differently.
 */
export function toStringArray(value: unknown): string[] {
  const unwrapped = unwrapStoredJson(value);
  if (!Array.isArray(unwrapped)) return [];
  return unwrapped.filter((v): v is string => typeof v === "string");
}

/** Every array section, paired with the schema for ONE of its rows. */
const CV_ARRAY_SECTIONS: Array<[string, z.ZodTypeAny]> = [
  ["experience", experienceEntrySchema],
  ["education", educationEntrySchema],
  ["skills", skillEntrySchema],
  ["projects", projectEntrySchema],
  ["languages", languageEntrySchema],
  ["certifications", certificationEntrySchema],
  ["referees", refereeEntrySchema],
];

/**
 * Repair the array sections of a CV payload at the write boundary, under the
 * same row rule the reader uses (`keepRow`) — so what a client can STORE is
 * always a shape the renderer can read, and the reader is no longer the only
 * place the rule is applied.
 *
 * The API validated `data` only as `z.record(z.unknown())`, so a skill written
 * with no `level` (or `"3"`, or `0`) was storable while every subsequent read
 * dropped it — the D8 silent section loss, reintroduced from the client.
 *
 * Two properties this must keep:
 *   • it MERGES (`{ ...row, ...repaired }`), so keys this file does not know —
 *     the native app's `title`, `keyAchievements`, anything added later — are
 *     preserved, not stripped by a schema that never declared them;
 *   • it only touches the seven known sections, and only when the value really
 *     is an array. Every other key passes through by reference, and a row that
 *     still cannot be parsed is left exactly as it arrived rather than deleted.
 */
export function repairCvArraySections(data: unknown): Record<string, unknown> {
  if (!isRow(data)) return (data ?? {}) as Record<string, unknown>;
  const repaired: Record<string, unknown> = { ...data };
  for (const [section, rowSchema] of CV_ARRAY_SECTIONS) {
    const rows = data[section];
    if (!Array.isArray(rows)) continue;
    const identity = CV_ROW_IDENTITY[section] ?? ["name"];
    repaired[section] = rows.flatMap((row) => {
      const kept = keepRow(rowSchema, identity, row);
      return kept === null ? [] : [{ ...(isRow(row) ? row : {}), ...kept }];
    });
  }
  return repaired;
}

/**
 * Second-chance parse: keep every row that parses, drop only the rows that do
 * not, then parse the document again.
 *
 * `cvDataSchema` is deliberately strict — a plain `z.array(itemSchema)` fails
 * the WHOLE document when one row is off, and `parseCVData` answers a failed
 * document with an EMPTY CV. Measured, before this existed: a single skill row
 * written without `level` (an older app version, the mobile writer, an import)
 * turned a complete CV into `fullName: "" · summary: "" · experience: [] ·
 * skills: []` — the name and every job gone because of one missing number in an
 * unrelated section. Same failure mode as the 2026-09-13 P0 that left 19 stored
 * CVs rendering blank; the guard `personal` already carries ("losing a name is
 * survivable; losing the CV is not") protected that one field only.
 *
 * Takes the document AFTER unwrapStoredJson + toStoredCvData have run, so it
 * composes with them rather than repeating their work — the shape it filters is
 * the STORED shape `cvDataSchema` expects.
 *
 * Returns null when even the salvage fails, so the caller keeps its own
 * last-resort behaviour.
 */
function salvageCvData(candidate: unknown): CVData | null {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
  const raw = candidate as Record<string, unknown>;
  const salvaged: Record<string, unknown> = { ...raw };

  for (const [section, rowSchema] of CV_ARRAY_SECTIONS) {
    const rows = raw[section];
    if (rows === undefined) continue; // let the schema's default handle "missing"
    // The SAME row rule as the schema: repair what can be read, drop only rows
    // that carry no readable content (or are not rows at all).
    const identity = CV_ROW_IDENTITY[section] ?? ["name"];
    salvaged[section] = Array.isArray(rows)
      ? rows.flatMap((row) => (keepRow(rowSchema, identity, row) ?? []) as unknown[])
      : [];
  }
  // Scalars: a wrong type here used to take the entire CV down with it.
  if (typeof raw.summary !== "string") salvaged.summary = "";
  if (typeof raw.hobbies !== "string") salvaged.hobbies = "";

  const result = cvDataSchema.safeParse(salvaged);
  return result.success ? result.data : null;
}

export function parseCVData(data: unknown): CVData {
  const candidate = unwrapStoredJson(data);
  // ...then normalise the APP's shape to the STORED one before validating.
  // Both shapes reach this column. The native app (and the shared `CVData`
  // type) calls this block `personalInfo` with a `headline`; the stored shape
  // is `personal` with a `jobTitle`. `cvDataSchema` knows only the stored one,
  // so a phone-written CV parsed to a BLANK header — name, job title, email,
  // phone and location all gone — while the values sat intact in the column.
  // Measured 2026-09-13: 3 of the 19 production rows are app-shaped and all 3
  // lost their header this way.
  //
  // `toStoredCvData` is this project's converter for exactly this pair of
  // shapes. It was already wired into the API's way out (`lib/api/routes/cv.ts`
  // normalises every row it returns) and was simply never wired into the
  // reader — so the same row rendered correctly through one path and blank
  // through another.
  const normalized = toStoredCvData<Record<string, unknown>>(candidate);
  const result = cvDataSchema.safeParse(normalized);
  if (result.success) return result.data;
  // Strict parse failed. Before throwing the document away, try once more
  // keeping only the rows/fields that parse — one stale entry must not cost the
  // user their name and every job. See salvageCvData.
  return salvageCvData(normalized) ?? createEmptyCVData();
}

// ─── CV Data Types ────────────────────────────────────────────────────────────

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  photo?: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  grade?: string;
  description?: string;
}

export interface SkillEntry {
  id: string;
  name: string;
  level: 1 | 2 | 3 | 4 | 5;
}

export interface LanguageEntry {
  id: string;
  name: string;
  /**
   * Usually one of "Native" | "Fluent" | "Advanced" | "Intermediate" | "Basic",
   * but a stored row can hold any word a client wrote — the native AI route
   * writes `professional` (`lib/api/routes/mobile.ts`), and `@sumaiya/types`
   * declares a third vocabulary again. Widened from the five-token union on
   * purpose: the candidate's own value is preserved rather than the row being
   * dropped for not speaking the editor's dialect. An unrecognisable value is
   * left as-is, never invented.
   */
  proficiency: string;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  role?: string;
  url?: string;
  date?: string;
}

export interface RefereeEntry {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
}

export interface CVData {
  personal: PersonalInfo;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillEntry[];
  projects: ProjectEntry[];
  languages: LanguageEntry[];
  certifications: CertificationEntry[];
  referees: RefereeEntry[];
  hobbies: string;
  hiddenSections?: string[];
  sectionOrder?: string[];
  density?: "compact" | "normal" | "airy";
  mode?: string;
}

// ─── Career Profile (source of truth) ─────────────────────────────────────────
// The single verified career fact-set that CVs are derived from. One profile →
// many targeted CVs. Lives on user_profile.career_profile (jsonb).
//
// Section entry types are REUSED from CVData so profile↔CV mapping is
// mechanical and the deterministic engines (ats-score, job-match, tailor) keep
// consuming CVData built from the profile.
//
// Provenance seam (Task 2 fills this in; Task 1 only defines it):
// `factMeta` tags individual entries by their id with a status. When Task 2
// lands, AI-drafted facts get "needs-confirmation" / "ai-suggested" and the
// TRUTH_CONSTRAINT provenance is recorded here — never beside it.

export type FactStatus = "confirmed" | "needs-confirmation" | "ai-suggested" | "inferred" | "unverified";
// Provenance of a career fact. `cv:<id>` means "derived from saved CV <id>".
// Priority (iron rule): user-edited > interview > conversation > cv:<id> >
// legacy (ai-draft/backfill/import). A user-edited fact is NEVER silently
// overwritten by a derived one.
export type FactSource =
  | "user-edited"   // typed/saved by the user directly (Settings / editor save)
  | "user"          // legacy: user-typed before provenance existed (treated as user-edited)
  | "interview"     // answered in the Career Interview
  | "conversation"  // confirmed while chatting with Sumaiya / built from a chat
  | `cv:${string}`  // derived from a saved CV (the suffix is the CV id)
  | "ai-draft"      // AI-generated, not yet confirmed
  | "backfill"      // legacy bulk migration
  | "import";       // legacy import path

export interface FactMeta {
  status?: FactStatus;
  source?: string;
  /** 0..1 — how confident we are the fact is real (1 = user-stated/typed). */
  confidence?: number;
  updatedAt?: string;
}

export interface AchievementEntry {
  id: string;
  title: string;
  description?: string;
  date?: string;
  category?: string;
}

export interface VolunteerEntry {
  id: string;
  organization: string;
  role: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface CareerPreferences {
  targetRoles: string[];
  preferredLocations: string[];
  remotePreference: "remote" | "hybrid" | "onsite" | "";
  salaryExpectation?: string;
  noticePeriod?: string;
  workAuthorization?: string;
  availability?: string;
  /** Free-text career direction ("what kind of work, and where in N years") —
   *  kept distinct from targetRoles (short role tags) so it round-trips back
   *  to the native app's own "Malengo ya kazi" field intact. */
  careerGoals?: string;
}

export interface CareerProfile {
  personal: PersonalInfo;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillEntry[];
  certifications: CertificationEntry[];
  languages: LanguageEntry[];
  projects: ProjectEntry[];
  achievements: AchievementEntry[];
  volunteer: VolunteerEntry[];
  references: RefereeEntry[];
  preferences: CareerPreferences;
  factMeta?: Record<string, FactMeta>;
}

export function createEmptyCareerProfile(): CareerProfile {
  return {
    personal: { fullName: "", jobTitle: "", email: "", phone: "", location: "" },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    languages: [],
    projects: [],
    achievements: [],
    volunteer: [],
    references: [],
    preferences: {
      targetRoles: [],
      preferredLocations: [],
      remotePreference: "",
    },
  };
}

// ─── Career Profile Zod (additive; section arrays default so old/partial
// payloads always parse). Entry schemas mirror the CVData ones.
export const achievementEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  date: z.string().optional(),
  category: z.string().optional(),
});

export const volunteerEntrySchema = z.object({
  id: z.string(),
  organization: z.string(),
  role: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  description: z.string().optional(),
});

export const careerPreferencesSchema = z.object({
  targetRoles: z.array(z.string()).default([]),
  preferredLocations: z.array(z.string()).default([]),
  remotePreference: z.enum(["remote", "hybrid", "onsite", ""]).default(""),
  salaryExpectation: z.string().optional(),
  noticePeriod: z.string().optional(),
  workAuthorization: z.string().optional(),
  availability: z.string().optional(),
  careerGoals: z.string().optional(),
});

export const factMetaSchema = z.object({
  status: z.enum(["confirmed", "needs-confirmation", "ai-suggested", "inferred", "unverified"]).optional(),
  source: z.string().max(64).optional(),
  confidence: z.number().min(0).max(1).optional(),
  updatedAt: z.string().optional(),
});

export const careerProfileSchema = z.object({
  personal: personalInfoSchema,
  summary: z.string(),
  experience: z.array(experienceEntrySchema).default([]),
  education: z.array(educationEntrySchema).default([]),
  skills: z.array(skillEntrySchema).default([]),
  certifications: z.array(certificationEntrySchema).default([]),
  languages: z.array(languageEntrySchema).default([]),
  projects: z.array(projectEntrySchema).default([]),
  achievements: z.array(achievementEntrySchema).default([]),
  volunteer: z.array(volunteerEntrySchema).default([]),
  references: z.array(refereeEntrySchema).default([]),
  preferences: careerPreferencesSchema.default({
    targetRoles: [],
    preferredLocations: [],
    remotePreference: "",
  }),
  factMeta: z.record(z.string(), factMetaSchema).optional(),
});

export function parseCareerProfile(data: unknown): CareerProfile {
  // Same defect that blanked every CV, one table over: this column holds a JSON
  // STRING for 12 of its 14 production rows, so `safeParse` failed and every
  // caller got an empty profile while the user had filled one in. The blast
  // radius is not cosmetic — `lib/api/routes/jobs.ts` scores job matches from
  // this value, so those users were matched against nothing at all.
  const result = careerProfileSchema.safeParse(unwrapStoredJson(data));
  if (result.success) return result.data;
  return createEmptyCareerProfile();
}

export const DEFAULT_SECTION_ORDER = [
  "summary", "experience", "projects", "education", "skills",
  "languages", "certifications", "referees", "hobbies",
] as const;

export type SectionKey = typeof DEFAULT_SECTION_ORDER[number];

export interface SectionTemplate {
  name: string;
  label: string;
  order: string[];
}

export function createEmptyCVData(): CVData {
  return {
    personal: { fullName: "", jobTitle: "", email: "", phone: "", location: "" },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    languages: [],
    certifications: [],
    referees: [],
    hobbies: "",
  };
}

// ─── CV Templates ─────────────────────────────────────────────────────────────

export type TemplateId =
  | "rift" | "zahabu" | "nuru" | "pemba" | "malachite" | "coral" | "kioo"
  | "bento" | "zege" | "console" | "riso" | "vibe" | "neon"
  | "regent" | "marlowe" | "cavendish" | "haven"
  | "nakuru" | "kilimanjaro" | "serengeti" | "zanzibar" | "nile"
  | "ubuntu" | "savanna" | "sahara" | "nairobi" | "mombasa" | "victoria"
  | "canvas-magazine" | "monarch" | "vertex" | "berlin" | "atlas"
  | "aurora-edge" | "nordic-minimal" | "executive-one" | "tokyo-grid" | "silicon-pro"
  | "eclipse" | "muse" | "titan" | "alpine" | "nova"
  | "oxford" | "metro" | "horizon" | "ascent" | "imperial"
  | "meridian" | "apex" | "studio" | "grid" | "narrative"
  | "cascade"
  | "dusk"
  | "verdant"
  | "terracotta"
  | "slate-two"
  | "carbon"
  | "aurora-two"
  | "crimson"
  | "ocean"
  | "graphite"
  | "jade"
  | "ember"
  | "cobalt"
  | "storm"
  | "bloom"
  | "stripe"
  | "rail"
  | "inset"
  | "ribbon"
  | "edge"
  | "axis"
  | "ledger"
  | "serif-cv"
  | "flux"
  | "tempo"
  | "margin"
  | "script-cv"
  | "mono-cv"
  | "pier"
  | "herald"
  | "kibo"
  | "lodge"
  | "brisk"
  | "chrome"
  | "linen"
  | "denim"
  | "cocoa"
  | "slate-v2"
  | "onyx"
  | "cobblestone"
  | "capsule"
  | "ledge"
  | "ticker"
  | "slab"
  | "peel"
  | "trace"
  | "clean-cv"
  | "herald-cv"
  | "folio"
  | "atlas-v2"
  | "ruwenzori"
  | "turkana"
  | "aberdare"
  | "samburu"
  | "laikipia"
  | "marsabit"
  | "malindi"
  | "watamu"
  | "diani"
  | "lamu"
  | "busia"
  | "homabay"
  | "migori"
  | "kisii"
  | "kericho"
  | "kitale"
  | "machakos"
  | "kajiado"
  | "narok"
  | "voi"
  | "wajir"
  | "garissa"
  | "moyale"
  | "tanganyika"
  | "bangweulu"
  | "okavango"
  | "kariba"
  | "rufiji"
  | "ruvuma"
  | "kagera"
  | "lukuga"
  | "volta-cv"
  | "gambia-cv"
  | "cunene"
  | "limpopo-cv"
  | "kavango"
  | "tana"
  | "ewaso"
  | "galana"
  | "sabaki"
  | "athi"
  | "awash"
  | "baro"
  | "tekeze"
  | "mareb"
  | "gash"
  | "geneva"
  | "zurich"
  | "vienna"
  | "stockholm"
  | "oslo"
  | "copenhagen"
  | "helsinki"
  | "dublin"
  | "warsaw"
  | "prague"
  | "budapest"
  | "lisbon"
  | "madrid"
  | "athens"
  | "istanbul"
  | "dubai"
  | "singapore-cv"
  | "sydney-cv"
  | "melbourne"
  | "toronto"
  | "montreal"
  | "vancouver"
  | "chicago"
  | "boston"
  | "seattle"
  | "portland"
  | "austin"
  | "nashville"
  | "atlanta"
  | "houston"
  | "denver"
  | "dallas"
  | "minneapolis"
  | "indianapolis"
  | "charlotte"
  | "baltimore"
  | "tampa"
  | "sacramento"
  | "pittsburgh"
  | "cincinnati"
  | "louisville"
  | "richmond"
  | "raleigh"
  | "miami-cv"
  | "phoenix"
  | "detroit"
  | "memphis"
  | "st-louis"
  | "bauhaus"
  | "futura-cv"
  | "bodoni-cv"
  | "garamond-cv"
  | "caslon"
  | "palatino-cv"
  | "baskerville-cv"
  | "didot-cv"
  | "clarendon-cv"
  | "rockwell-cv"
  | "brutalist-cv"
  | "modernist-cv"
  | "constructivist"
  | "deco-cv"
  | "structuralist"
  | "impressionist-cv"
  | "baroque-cv"
  | "classical-cv"
  | "neoclassical-cv"
  | "avant-garde-cv"
  | "de-stijl"
  | "suprematist"
  | "dadaist"
  | "futurism-cv"
  | "nebula"
  | "cosmos"
  | "orbit"
  | "solstice"
  | "equinox"
  | "zenith"
  | "solaris"
  | "lunar"
  | "stellar"
  | "stratus"
  | "nimbus"
  | "cirrus"
  | "cumulus"
  | "altus"
  | "celeste"
  | "quantum"
  | "photon"
  | "quasar"
  | "pulsar"
  | "gravity"
  | "vector"
  | "neural"
  | "cipher"
  | "prism"
  | "mosaic"
  | "parallax"
  | "collage"
  | "panorama"
  | "montage"
  | "fjord"
  | "canyon"
  | "veldt"
  | "fractal"
  | "relief"
  | "tableau"
  | "cameo"
  | "vignette"
  | "lagoon"
  | "delta"
  | "plateau"
  | "highland"
  | "estuary"
  | "mesa"
  | "contour"
  | "silhouette";

export interface Template {
  id: TemplateId;
  name: string;
  description: string;
  previewColor: string;
  style: "sidebar" | "header" | "minimal" | "creative" | "classic";
  popular?: boolean;
}

type TemplatePresentation = Omit<Template, "name">;

const TEMPLATE_PRESENTATION: TemplatePresentation[] = [
  { id: "rift",        description: "Premium colour sidebar · photo ring · skill bars", previewColor: "#12433D", style: "sidebar", popular: true },
  { id: "zahabu",      description: "Dark charcoal · gold accent · timeline",          previewColor: "#F2A93B", style: "sidebar", popular: true },
  { id: "nuru",        description: "Infographic · stat strip · skill rings",          previewColor: "#C13E14", style: "creative", popular: true },
  { id: "pemba",       description: "Editorial serif · masthead · drop cap",           previewColor: "#B57A18", style: "creative", popular: true },
  { id: "malachite",   description: "Two-column · chip skills · ring photo",           previewColor: "#0E7490", style: "header",  popular: true },
  { id: "coral",       description: "Accent header bars · timeline · photo",           previewColor: "#E4572E", style: "sidebar", popular: true },
  { id: "kioo",        description: "Full-height photo column · charcoal panel",       previewColor: "#1E3A5F", style: "sidebar", popular: true },
  { id: "bento",       description: "Bento-grid of rounded cards · contemporary",      previewColor: "#4F46E5", style: "creative", popular: true },
  { id: "zege",        description: "Neo-brutalist · thick borders · hard shadows",    previewColor: "#3D5AFE", style: "creative", popular: true },
  { id: "console",     description: "Terminal · monospace · ascii meters",             previewColor: "#3FB950", style: "creative", popular: true },
  { id: "riso",        description: "Risograph poster · offset colour · numbered",     previewColor: "#F0466E", style: "creative", popular: true },
  { id: "vibe",        description: "Vibrant gradient header · gradient meters",       previewColor: "#6366F1", style: "creative", popular: true },
  { id: "neon",        description: "Dark · sleek · gradient bars on cards",           previewColor: "#22D3EE", style: "creative", popular: true },
  { id: "regent",      description: "Executive · serif header · gold rule · two-column", previewColor: "#1E3A5F", style: "classic", popular: true },
  { id: "marlowe",     description: "Elegant serif · centered · refined",              previewColor: "#8A6D3B", style: "classic", popular: true },
  { id: "cavendish",   description: "Academic · long-form · ruled sections",           previewColor: "#7F1D1D", style: "classic", popular: true },
  { id: "haven",       description: "Clean · calm · rounded · people-facing roles",    previewColor: "#0E9488", style: "minimal", popular: true },
  { id: "nakuru",      description: "Modern sidebar · skill bars",    previewColor: "#DA4A1C", style: "sidebar",  popular: true },
  { id: "kilimanjaro", description: "Classic centered serif",           previewColor: "#211A15", style: "classic" },
  { id: "serengeti",   description: "Header band · two-column",         previewColor: "#12433D", style: "header" },
  { id: "zanzibar",    description: "Editorial display serif",          previewColor: "#7C3AED", style: "creative" },
  { id: "nile",        description: "Classic traditional",              previewColor: "#1D4ED8", style: "classic" },
  { id: "ubuntu",      description: "Executive dark sidebar",           previewColor: "#F2A93B", style: "sidebar" },
  { id: "savanna",     description: "Minimal · timeline margin",        previewColor: "#B57A18", style: "header" },
  { id: "sahara",      description: "Ultra-minimal whitespace",          previewColor: "#6B7280", style: "minimal" },
  { id: "nairobi",     description: "Corporate ledger rule",            previewColor: "#1E3A5F", style: "header" },
  { id: "mombasa",     description: "Photo header · portrait",          previewColor: "#0E7490", style: "sidebar" },
  { id: "victoria",    description: "Elegant serif · executive",        previewColor: "#7A5410", style: "classic" },
  { id: "canvas-magazine", description: "Editorial magazine feel",       previewColor: "#7C3AED", style: "creative" },
  { id: "monarch",         description: "Classic prestigious layout",   previewColor: "#B45309", style: "classic" },
  { id: "vertex",          description: "Diagonal accent header",       previewColor: "#0891B2", style: "creative" },
  { id: "berlin",          description: "Brutalist minimal density",    previewColor: "#111827", style: "minimal" },
  { id: "atlas",           description: "Dark header band with cards",  previewColor: "#2563EB", style: "header" },
  { id: "aurora-edge",    description: "Sidebar with pill skills",      previewColor: "#2563EB", style: "sidebar" },
  { id: "nordic-minimal", description: "Ultra-clean single column",    previewColor: "#0F172A", style: "minimal" },
  { id: "executive-one",  description: "Centered serif classic",        previewColor: "#1E293B", style: "classic" },
  { id: "tokyo-grid",     description: "Dark sidebar, bold red header", previewColor: "#DC2626", style: "creative" },
  { id: "silicon-pro",    description: "Tech header band with bars",    previewColor: "#2563EB", style: "header" },
  { id: "eclipse",        description: "Dark full header executive",    previewColor: "#0F172A", style: "header" },
  { id: "muse",           description: "Creative pink sidebar",         previewColor: "#EC4899", style: "creative" },
  { id: "titan",          description: "Bold navy authority",           previewColor: "#1E3A8A", style: "classic" },
  { id: "alpine",         description: "Airy green minimal",            previewColor: "#10B981", style: "minimal" },
  { id: "nova",           description: "Purple header two-column",      previewColor: "#8B5CF6", style: "header" },
  { id: "oxford",         description: "Academic centered layout",      previewColor: "#374151", style: "classic" },
  { id: "metro",          description: "Urban sidebar with stripe",     previewColor: "#2563EB", style: "sidebar" },
  { id: "horizon",        description: "Orange banner three-column",    previewColor: "#F97316", style: "creative" },
  { id: "ascent",         description: "Green header timeline",         previewColor: "#059669", style: "header" },
  { id: "imperial",       description: "Prestigious deep crimson",      previewColor: "#7C2D12", style: "classic" },
  { id: "meridian",       description: "Dark sidebar, accent dots",       previewColor: "#0F172A", style: "sidebar",  popular: true },
  { id: "apex",           description: "Bold header, timeline body",      previewColor: "#1E293B", style: "header",   popular: true },
  { id: "studio",         description: "Editorial single-column",         previewColor: "#6366F1", style: "minimal",  popular: true },
  { id: "grid",           description: "ATS-strict, machine-readable",    previewColor: "#0F172A", style: "minimal",  popular: true },
  { id: "narrative",      description: "Bold header, editorial story",    previewColor: "#7C3AED", style: "creative", popular: true },
  { id: "cascade", description: "Dark header, left skill column, right story", previewColor: "#0F172A", style: "creative" },
  { id: "dusk", description: "Dark left column, accent-line right body", previewColor: "#1E293B", style: "creative" },
  { id: "verdant", description: "Green header, pill labels, two-column", previewColor: "#059669", style: "creative" },
  { id: "terracotta", description: "Warm amber header, ruled section dividers", previewColor: "#B45309", style: "creative" },
  { id: "slate-two", description: "Steel blue, two-col, grid skill display", previewColor: "#334155", style: "creative" },
  { id: "carbon", description: "Near-black header+left, timeline-v2 body", previewColor: "#059669", style: "creative" },
  { id: "aurora-two", description: "Violet header, pill labels, airy body", previewColor: "#6D28D9", style: "creative" },
  { id: "crimson", description: "Deep red, box sections, two-column", previewColor: "#DC2626", style: "creative" },
  { id: "ocean", description: "Ocean blue, numbered sections, timeline", previewColor: "#0369A1", style: "creative" },
  { id: "graphite", description: "Near-black, ruled labels, grid skills, compact", previewColor: "#404040", style: "creative" },
  { id: "jade", description: "Forest green, pill skills, accent lines", previewColor: "#059669", style: "creative" },
  { id: "ember", description: "Deep orange, timeline-v2 body", previewColor: "#EA580C", style: "creative" },
  { id: "cobalt", description: "Deep blue, airy two-column layout", previewColor: "#1D4ED8", style: "creative" },
  { id: "storm", description: "Steel, numbered+tag-rated, ruled body", previewColor: "#374151", style: "creative" },
  { id: "bloom", description: "Pink, pill labels, card body, two-column", previewColor: "#DB2777", style: "creative" },
  { id: "stripe", description: "8px left accent band, clean single column", previewColor: "#1D4ED8", style: "minimal" },
  { id: "rail", description: "12px rail, timeline, accent lines", previewColor: "#059669", style: "minimal" },
  { id: "inset", description: "6px band, ruled sections, airy", previewColor: "#7C3AED", style: "minimal" },
  { id: "ribbon", description: "10px ribbon, pill section labels, photo", previewColor: "#DC2626", style: "minimal" },
  { id: "edge", description: "Wide 16px edge, card experience, rounded photo", previewColor: "#0F172A", style: "minimal" },
  { id: "axis", description: "Black band, timeline-v2 experience", previewColor: "#0F172A", style: "minimal" },
  { id: "ledger", description: "Dark band, numbered headers, table exp, grid skills", previewColor: "#1E293B", style: "minimal" },
  { id: "serif-cv", description: "Warm paper bg, ruled sections, bar skills", previewColor: "#78350F", style: "minimal" },
  { id: "flux", description: "10px band, box headers, chip skills", previewColor: "#6D28D9", style: "minimal" },
  { id: "tempo", description: "Accent name, dot sections, dot skills, timeline", previewColor: "#0891B2", style: "minimal" },
  { id: "margin", description: "Slate band, square photo, tag-rated skills", previewColor: "#374151", style: "minimal" },
  { id: "script-cv", description: "Warm background, timeline-v2, accent lines", previewColor: "#B45309", style: "minimal" },
  { id: "mono-cv", description: "Black band, no section headers, ultra compact", previewColor: "#111827", style: "minimal" },
  { id: "pier", description: "Teal band, pill labels, grid skills", previewColor: "#0369A1", style: "minimal" },
  { id: "herald", description: "Dark band, ruled sections, table layout, rounded photo", previewColor: "#0F172A", style: "minimal" },
  { id: "kibo", description: "Dark sidebar, pill labels, numbered mains, grid skills", previewColor: "#0F172A", style: "sidebar" },
  { id: "lodge", description: "Charcoal, dot sidebar, ruled main, tag-rated, timeline-v2", previewColor: "#1E293B", style: "sidebar" },
  { id: "brisk", description: "Dark, tag sidebar, pill main, table experience", previewColor: "#111827", style: "sidebar" },
  { id: "chrome", description: "Light sidebar, numbered main, grid skills", previewColor: "#1D4ED8", style: "sidebar" },
  { id: "linen", description: "Warm cream sidebar, ruled sections, airy", previewColor: "#D97706", style: "sidebar" },
  { id: "denim", description: "Ice blue sidebar, pill mains, card experience", previewColor: "#1D4ED8", style: "sidebar" },
  { id: "cocoa", description: "Warm yellow sidebar, numbered, tag-rated skills", previewColor: "#B45309", style: "sidebar" },
  { id: "slate-v2", description: "White-ish sidebar, ruled main, grid, timeline-v2", previewColor: "#374151", style: "sidebar" },
  { id: "onyx", description: "Near-black, pill sidebar, accent lines, compact", previewColor: "#6D28D9", style: "sidebar" },
  { id: "cobblestone", description: "Warm dark, numbered main, table exp, timeline", previewColor: "#1C1917", style: "sidebar" },
  { id: "capsule", description: "Pill section labels, accent name, solid divider", previewColor: "#7C3AED", style: "minimal" },
  { id: "ledge", description: "Ruled sections, grid skills, no divider", previewColor: "#0F172A", style: "minimal" },
  { id: "ticker", description: "Centered, numbered, timeline-v2 experience", previewColor: "#DC2626", style: "minimal" },
  { id: "slab", description: "Numbered headers, table experience, tag-rated skills", previewColor: "#374151", style: "minimal" },
  { id: "peel", description: "Centered, pill labels, chip skills, card exp, airy", previewColor: "#BE185D", style: "minimal" },
  { id: "trace", description: "Ruled sections, dotted divider, left-aligned", previewColor: "#0891B2", style: "minimal" },
  { id: "clean-cv", description: "No section labels, grid skills, ultra compact", previewColor: "#1E293B", style: "minimal" },
  { id: "herald-cv", description: "Centered, numbered, dot skills, accent name", previewColor: "#1D4ED8", style: "minimal" },
  { id: "folio", description: "Pill labels, tag-rated skills, timeline-v2, airy", previewColor: "#059669", style: "minimal" },
  { id: "atlas-v2", description: "Numbered, chip skills, card blocks, accent name", previewColor: "#0F172A", style: "minimal" },
  { id: "ruwenzori", description: "Dark slate sidebar, bar skills", previewColor: "#0F172A", style: "sidebar" },
  { id: "turkana", description: "Charcoal sidebar, dot skills, timeline", previewColor: "#1E293B", style: "sidebar" },
  { id: "aberdare", description: "Dark charcoal, compact, rounded photo", previewColor: "#111827", style: "sidebar" },
  { id: "samburu", description: "Wide dark sidebar, accent lines", previewColor: "#0F172A", style: "sidebar" },
  { id: "laikipia", description: "Deep navy, card experience blocks", previewColor: "#1A1A2E", style: "sidebar" },
  { id: "marsabit", description: "Square photo, airy spacing", previewColor: "#1E293B", style: "sidebar" },
  { id: "malindi", description: "Borderless sections, accent lines", previewColor: "#0F172A", style: "sidebar" },
  { id: "watamu", description: "Narrow compact sidebar, skills only", previewColor: "#111827", style: "sidebar" },
  { id: "diani", description: "Wide airy sidebar, full sections", previewColor: "#1E293B", style: "sidebar" },
  { id: "lamu", description: "Midnight blue, card layout", previewColor: "#0D1B2A", style: "sidebar" },
  { id: "busia", description: "Square photo, borderless sections", previewColor: "#0F172A", style: "sidebar" },
  { id: "homabay", description: "Charcoal sidebar, rounded photo, timeline", previewColor: "#1E293B", style: "sidebar" },
  { id: "migori", description: "Dot-style sections throughout", previewColor: "#111827", style: "sidebar" },
  { id: "kisii", description: "Deep navy, chip skills", previewColor: "#1A1A2E", style: "sidebar" },
  { id: "kericho", description: "Minimal sections, card experience", previewColor: "#0F172A", style: "sidebar" },
  { id: "kitale", description: "Rounded photo, airy, accent lines", previewColor: "#1E293B", style: "sidebar" },
  { id: "machakos", description: "Midnight, timeline, dot labels", previewColor: "#0D1B2A", style: "sidebar" },
  { id: "kajiado", description: "Narrow, square photo, compact", previewColor: "#111827", style: "sidebar" },
  { id: "narok", description: "Full sidebar sections, airy layout", previewColor: "#1A1A2E", style: "sidebar" },
  { id: "voi", description: "Card experience, timeline, rounded photo", previewColor: "#0F172A", style: "sidebar" },
  { id: "wajir", description: "Box sections, dot labels, compact", previewColor: "#1E293B", style: "sidebar" },
  { id: "garissa", description: "Square photo, chip skills", previewColor: "#111827", style: "sidebar" },
  { id: "moyale", description: "Midnight, airy, dot sections, timeline", previewColor: "#0D1B2A", style: "sidebar" },
  { id: "tanganyika", description: "Teal accent sidebar, clean underlines", previewColor: "#0891B2", style: "sidebar" },
  { id: "bangweulu", description: "Purple accent, timeline, dot sections", previewColor: "#7C3AED", style: "sidebar" },
  { id: "okavango", description: "Green accent, airy, full sidebar sections", previewColor: "#059669", style: "sidebar" },
  { id: "kariba", description: "Red accent, square photo, compact", previewColor: "#DC2626", style: "sidebar" },
  { id: "rufiji", description: "Amber accent, wide sidebar, timeline", previewColor: "#D97706", style: "sidebar" },
  { id: "ruvuma", description: "Pink accent, card experience", previewColor: "#BE185D", style: "sidebar" },
  { id: "kagera", description: "Blue accent, rounded, compact", previewColor: "#0369A1", style: "sidebar" },
  { id: "lukuga", description: "Forest green, full sections", previewColor: "#065F46", style: "sidebar" },
  { id: "volta-cv", description: "Brown accent, square photo, card blocks", previewColor: "#7C2D12", style: "sidebar" },
  { id: "gambia-cv", description: "Royal blue accent sidebar", previewColor: "#1D4ED8", style: "sidebar" },
  { id: "cunene", description: "Slate accent, narrow, compact", previewColor: "#374151", style: "sidebar" },
  { id: "limpopo-cv", description: "Teal-green, wide airy sidebar", previewColor: "#0F766E", style: "sidebar" },
  { id: "kavango", description: "Violet accent, compact, dot labels", previewColor: "#6D28D9", style: "sidebar" },
  { id: "tana", description: "Deep ocean blue, square photo", previewColor: "#0C4A6E", style: "sidebar" },
  { id: "ewaso", description: "Warm brown, card experience", previewColor: "#78350F", style: "sidebar" },
  { id: "galana", description: "Deep green accent sidebar", previewColor: "#166534", style: "sidebar" },
  { id: "sabaki", description: "Navy accent, dot labels, accent lines", previewColor: "#1E3A5F", style: "sidebar" },
  { id: "athi", description: "Deep rose, square photo, timeline", previewColor: "#831843", style: "sidebar" },
  { id: "awash", description: "Deep plum, card blocks, airy", previewColor: "#4A044E", style: "sidebar" },
  { id: "baro", description: "Dark amber, compact, rounded photo", previewColor: "#422006", style: "sidebar" },
  { id: "tekeze", description: "Steel blue accent, timeline", previewColor: "#1C3A5E", style: "sidebar" },
  { id: "mareb", description: "Dark forest green, accent lines", previewColor: "#14532D", style: "sidebar" },
  { id: "gash", description: "Indigo accent, square photo, dot sections", previewColor: "#1E1B4B", style: "sidebar" },
  { id: "geneva", description: "Slate header, centered contact row", previewColor: "#0F172A", style: "header" },
  { id: "zurich", description: "Charcoal header, photo right", previewColor: "#1E293B", style: "header" },
  { id: "vienna", description: "Dark header, amber subtext, card blocks", previewColor: "#B45309", style: "header" },
  { id: "stockholm", description: "Midnight header, green sub, airy body", previewColor: "#059669", style: "header" },
  { id: "oslo", description: "Deep navy, violet accent, compact", previewColor: "#7C3AED", style: "header" },
  { id: "copenhagen", description: "Slate header, pink sub, photo right", previewColor: "#BE185D", style: "header" },
  { id: "helsinki", description: "Charcoal, cyan accent, timeline", previewColor: "#0891B2", style: "header" },
  { id: "dublin", description: "Dark, emerald accent, clean body", previewColor: "#059669", style: "header" },
  { id: "warsaw", description: "Midnight, orange accent, card blocks", previewColor: "#EA580C", style: "header" },
  { id: "prague", description: "Deep navy, purple, photo right, airy", previewColor: "#7C3AED", style: "header" },
  { id: "budapest", description: "Slate, amber sub, dot-label sections", previewColor: "#D97706", style: "header" },
  { id: "lisbon", description: "Charcoal, cyan, compact body", previewColor: "#0891B2", style: "header" },
  { id: "madrid", description: "Dark, rose accent, photo right", previewColor: "#E11D48", style: "header" },
  { id: "athens", description: "Midnight, light blue sub, clean body", previewColor: "#1D4ED8", style: "header" },
  { id: "istanbul", description: "Deep navy, pink, card experience", previewColor: "#DB2777", style: "header" },
  { id: "dubai", description: "Slate, gold sub, photo right, airy", previewColor: "#D97706", style: "header" },
  { id: "singapore-cv", description: "Charcoal, mint, chip skills", previewColor: "#059669", style: "header" },
  { id: "sydney-cv", description: "Dark, sky blue sub, dot sections", previewColor: "#0284C7", style: "header" },
  { id: "melbourne", description: "Midnight, lavender, compact", previewColor: "#6D28D9", style: "header" },
  { id: "toronto", description: "Deep navy, red-pink accent", previewColor: "#DC2626", style: "header" },
  { id: "montreal", description: "Slate, green, card timeline", previewColor: "#166534", style: "header" },
  { id: "vancouver", description: "Charcoal, pink, photo right, airy", previewColor: "#E11D48", style: "header" },
  { id: "chicago", description: "Dark, ice cyan, accent lines", previewColor: "#0891B2", style: "header" },
  { id: "boston", description: "Midnight, purple sub, timeline", previewColor: "#7C3AED", style: "header" },
  { id: "seattle", description: "Dark header, skill aside, timeline", previewColor: "#0F172A", style: "header" },
  { id: "portland", description: "Charcoal, narrow aside, accent lines", previewColor: "#1E293B", style: "header" },
  { id: "austin", description: "Dark, full aside, card blocks", previewColor: "#111827", style: "header" },
  { id: "nashville", description: "Midnight, compact, box aside", previewColor: "#0D1B2A", style: "header" },
  { id: "atlanta", description: "Deep navy, airy, accent lines", previewColor: "#1A1A2E", style: "header" },
  { id: "houston", description: "Slate, wide aside, box sections", previewColor: "#0F172A", style: "header" },
  { id: "denver", description: "Charcoal, narrow aside, card body", previewColor: "#1E293B", style: "header" },
  { id: "dallas", description: "Dark, dot sections, skill aside", previewColor: "#111827", style: "header" },
  { id: "minneapolis", description: "Midnight, accent lines, aside skills", previewColor: "#0D1B2A", style: "header" },
  { id: "indianapolis", description: "Deep navy, compact, box aside", previewColor: "#1A1A2E", style: "header" },
  { id: "charlotte", description: "Slate, card blocks, aside with hobbies", previewColor: "#0F172A", style: "header" },
  { id: "baltimore", description: "Charcoal, airy body, dot sections", previewColor: "#1E293B", style: "header" },
  { id: "tampa", description: "Dark, narrow aside, accent lines", previewColor: "#111827", style: "header" },
  { id: "sacramento", description: "Midnight, compact, slim aside", previewColor: "#0D1B2A", style: "header" },
  { id: "pittsburgh", description: "Deep navy, wide aside, box layout", previewColor: "#1A1A2E", style: "header" },
  { id: "cincinnati", description: "Slate, card timeline, accent lines", previewColor: "#0F172A", style: "header" },
  { id: "louisville", description: "Charcoal, clean underline sections", previewColor: "#1E293B", style: "header" },
  { id: "richmond", description: "Dark, airy body, dot labels", previewColor: "#111827", style: "header" },
  { id: "raleigh", description: "Midnight, compact, narrow aside", previewColor: "#0D1B2A", style: "header" },
  { id: "miami-cv", description: "Deep navy, timeline, hobbies in aside", previewColor: "#1A1A2E", style: "header" },
  { id: "phoenix", description: "Slate, box sections, skill aside", previewColor: "#0F172A", style: "header" },
  { id: "detroit", description: "Charcoal, card layout, dot sections", previewColor: "#1E293B", style: "header" },
  { id: "memphis", description: "Dark, compact, chip skills", previewColor: "#111827", style: "header" },
  { id: "st-louis", description: "Midnight, wide aside, full sections", previewColor: "#0D1B2A", style: "header" },
  { id: "bauhaus", description: "Left-aligned, solid divider, compact", previewColor: "#0F172A", style: "minimal" },
  { id: "futura-cv", description: "Blue accent name, accent-line sections", previewColor: "#1D4ED8", style: "minimal" },
  { id: "bodoni-cv", description: "No divider, borderless, generous whitespace", previewColor: "#111827", style: "minimal" },
  { id: "garamond-cv", description: "Dotted divider, dot-label sections", previewColor: "#374151", style: "minimal" },
  { id: "caslon", description: "Tag labels, compact, solid divider", previewColor: "#0F172A", style: "minimal" },
  { id: "palatino-cv", description: "No divider, accent name, airy", previewColor: "#1E293B", style: "minimal" },
  { id: "baskerville-cv", description: "Box sections, dotted divider", previewColor: "#374151", style: "minimal" },
  { id: "didot-cv", description: "Card experience, accent name, solid divider", previewColor: "#111827", style: "minimal" },
  { id: "clarendon-cv", description: "No divider, accent-line sections", previewColor: "#0F172A", style: "minimal" },
  { id: "rockwell-cv", description: "Dot sections, compact, solid divider", previewColor: "#1E293B", style: "minimal" },
  { id: "brutalist-cv", description: "Tag labels, accent name, borderless", previewColor: "#0F172A", style: "minimal" },
  { id: "modernist-cv", description: "Blue accent name, dotted divider", previewColor: "#1D4ED8", style: "minimal" },
  { id: "constructivist", description: "Red accent, box sections, compact", previewColor: "#DC2626", style: "minimal" },
  { id: "deco-cv", description: "Gold accent name, airy, accent lines", previewColor: "#B45309", style: "minimal" },
  { id: "structuralist", description: "Dot sections, dotted divider, slate", previewColor: "#374151", style: "minimal" },
  { id: "impressionist-cv", description: "Purple accent, borderless sections, airy", previewColor: "#7C3AED", style: "minimal" },
  { id: "baroque-cv", description: "Card experience, no divider, dark", previewColor: "#0F172A", style: "minimal" },
  { id: "classical-cv", description: "Tag labels, dotted divider, charcoal", previewColor: "#1E293B", style: "minimal" },
  { id: "neoclassical-cv", description: "Box sections, compact, solid divider", previewColor: "#111827", style: "minimal" },
  { id: "avant-garde-cv", description: "Violet accent name, accent lines", previewColor: "#6D28D9", style: "minimal" },
  { id: "de-stijl", description: "Blue, dot sections, card experience", previewColor: "#1D4ED8", style: "minimal" },
  { id: "suprematist", description: "Borderless, accent name, ultra-compact", previewColor: "#0F172A", style: "minimal" },
  { id: "dadaist", description: "Dotted divider, underline sections", previewColor: "#374151", style: "minimal" },
  { id: "futurism-cv", description: "Red accent name, tag labels, airy", previewColor: "#DC2626", style: "minimal" },
  { id: "nebula", description: "Centered violet name, airy whitespace", previewColor: "#6D28D9", style: "minimal" },
  { id: "cosmos", description: "Dark centered name, accent lines, airy", previewColor: "#1E293B", style: "minimal" },
  { id: "orbit", description: "Cyan, dot sections, dotted divider", previewColor: "#0891B2", style: "minimal" },
  { id: "solstice", description: "Amber name, tag labels, solid divider", previewColor: "#D97706", style: "minimal" },
  { id: "equinox", description: "No divider, borderless, spacious", previewColor: "#374151", style: "minimal" },
  { id: "zenith", description: "Purple name, underline sections", previewColor: "#7C3AED", style: "minimal" },
  { id: "solaris", description: "Amber, box sections, card experience", previewColor: "#F59E0B", style: "minimal" },
  { id: "lunar", description: "Dark centered, accent lines, spacious", previewColor: "#1E293B", style: "minimal" },
  { id: "stellar", description: "Dark, dot sections, dotted divider", previewColor: "#0F172A", style: "minimal" },
  { id: "stratus", description: "Slate, borderless, compact centered", previewColor: "#374151", style: "minimal" },
  { id: "nimbus", description: "Blue name, compact, no divider", previewColor: "#1D4ED8", style: "minimal" },
  { id: "cirrus", description: "Cyan, tag labels, dotted divider", previewColor: "#0891B2", style: "minimal" },
  { id: "cumulus", description: "Green name, box sections, airy", previewColor: "#059669", style: "minimal" },
  { id: "altus", description: "Slate, card experience, accent lines", previewColor: "#374151", style: "minimal" },
  { id: "celeste", description: "Pink name, dot sections, dotted divider", previewColor: "#BE185D", style: "minimal" },
  { id: "quantum", description: "Charcoal, borderless centered body", previewColor: "#1E293B", style: "minimal" },
  { id: "photon", description: "Sky blue name, airy, underline sections", previewColor: "#0284C7", style: "minimal" },
  { id: "quasar", description: "Purple, accent lines, dotted divider", previewColor: "#7C3AED", style: "minimal" },
  { id: "pulsar", description: "Dark name, tag labels, compact", previewColor: "#0F172A", style: "minimal" },
  { id: "gravity", description: "Slate, box sections, no divider", previewColor: "#374151", style: "minimal" },
  { id: "vector", description: "Blue name, dot sections, airy", previewColor: "#1D4ED8", style: "minimal" },
  { id: "neural", description: "Green, card experience, centered", previewColor: "#059669", style: "minimal" },
  { id: "cipher", description: "Red name, accent lines, no divider", previewColor: "#DC2626", style: "minimal" },
  { id: "prism", description: "Violet banner, card timeline, no aside", previewColor: "#8B5CF6", style: "creative" },
  { id: "mosaic", description: "Teal banner, skill aside, chip tags", previewColor: "#0891B2", style: "creative" },
  { id: "parallax", description: "Red banner, aside, card experience", previewColor: "#DC2626", style: "creative" },
  { id: "collage", description: "Amber banner, full aside, dot sections", previewColor: "#F59E0B", style: "creative" },
  { id: "panorama", description: "Green banner, single column, airy", previewColor: "#059669", style: "creative" },
  { id: "montage", description: "Pink banner, photo right, timeline", previewColor: "#BE185D", style: "creative" },
  { id: "fjord", description: "Ocean blue banner, airy single column", previewColor: "#0369A1", style: "creative" },
  { id: "canyon", description: "Brick banner, compact, aside", previewColor: "#7C2D12", style: "creative" },
  { id: "veldt", description: "Forest banner, tag labels", previewColor: "#166534", style: "creative" },
  { id: "fractal", description: "Light grey sidebar, purple accent lines", previewColor: "#6D28D9", style: "creative" },
  { id: "relief", description: "Ice blue sidebar, rounded photo", previewColor: "#1D4ED8", style: "creative" },
  { id: "tableau", description: "Lavender sidebar, square photo, cards", previewColor: "#7C3AED", style: "creative" },
  { id: "cameo", description: "Warm cream sidebar, amber accent", previewColor: "#D97706", style: "creative" },
  { id: "vignette", description: "Mint sidebar, airy accent lines", previewColor: "#059669", style: "creative" },
  { id: "lagoon", description: "Teal mint sidebar, rounded photo", previewColor: "#0F766E", style: "creative" },
  { id: "delta", description: "Sand sidebar, square photo, card body", previewColor: "#B45309", style: "creative" },
  { id: "plateau", description: "Near-white sidebar, navy accent", previewColor: "#1E3A8A", style: "creative" },
  { id: "highland", description: "Clean white sidebar, dark accent lines", previewColor: "#0F172A", style: "creative" },
  { id: "estuary", description: "Light blue sidebar, chip skills", previewColor: "#0891B2", style: "creative" },
  { id: "mesa", description: "Warm sand sidebar, compact, square", previewColor: "#92400E", style: "creative" },
  { id: "contour", description: "Slate-tint sidebar, box sections", previewColor: "#1E293B", style: "creative" },
  { id: "silhouette", description: "Barely-there sidebar, sharp accent lines", previewColor: "#0F172A", style: "creative" },
];

export const TEMPLATES: Template[] = TEMPLATE_PRESENTATION.map((t) => ({
  ...t,
  name: TEMPLATE_REGISTRY[t.id]?.name ?? t.id,
}));

// Curated set of genuinely-distinct CV layouts, surfaced in the gallery and the
// editor picker. The full TEMPLATES list (and the component registry) stays
// intact so every existing document keeps rendering — this only controls what's
// *offered*, cutting the dozens of recolor/rename variants down to real variety.
// The ID lists now live in lib/templates/curation.ts (single source of truth)
// and are re-exported here so the existing import surface keeps working.
export { CURATED_CV_TEMPLATE_IDS, PREMIUM_TEMPLATE_IDS };

export const CURATED_CV_TEMPLATES: Template[] = CURATED_CV_TEMPLATE_IDS
  .map((id) => TEMPLATES.find((t) => t.id === id))
  .filter((t): t is Template => Boolean(t));

export function isPremiumTemplate(id: string): boolean {
  return PREMIUM_TEMPLATE_IDS.has(id as TemplateId);
}

const VALID_TEMPLATE_IDS = new Set<string>(TEMPLATES.map(t => t.id));

export function isTemplateId(id: string): id is TemplateId {
  return VALID_TEMPLATE_IDS.has(id);
}

// ─── Business Card Types ──────────────────────────────────────────────────────

export type BusinessCardTemplateId =
  | "zege-card" | "neon-card" | "bento-card" | "riso-card"
  | "classic" | "modern" | "bold" | "minimal" | "corporate"
  | "gradient-bc" | "dark-pro-bc" | "neon-bc" | "earthy-bc" | "luxury-bc"
  | "creative-bc" | "tech-bc" | "nature-bc" | "artistic-bc" | "retro-bc"
  | "geometric-bc" | "organic-bc" | "marble-bc" | "duo-tone-bc" | "watercolor-bc"
  | "premium-bc" | "glass-bc" | "nordic-bc" | "tropical-bc" | "urban-bc";

export interface BusinessCardData {
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website?: string;
  address?: string;
  tagline?: string;
}

export function createEmptyBusinessCardData(): BusinessCardData {
  return { name: "", title: "", company: "", email: "", phone: "" };
}

export interface BusinessCardTemplate {
  id: BusinessCardTemplateId;
  name: string;
  description: string;
  previewColor: string;
  popular?: boolean;
}

export const BUSINESS_CARD_TEMPLATES: BusinessCardTemplate[] = [
  { id: "zege-card",    name: "Zege",         description: "Neo-brutalist · pairs with Zege CV",  previewColor: "#3D5AFE", popular: true },
  { id: "neon-card",    name: "Neon",         description: "Dark · sleek · pairs with Neon CV",   previewColor: "#22D3EE", popular: true },
  { id: "bento-card",   name: "Bento",        description: "Rounded panels · pairs with Bento CV", previewColor: "#4F46E5", popular: true },
  { id: "riso-card",    name: "Riso",         description: "Risograph poster · pairs with Riso CV", previewColor: "#F0466E", popular: true },
  { id: "classic",      name: "Duka",         description: "Retail / SME · clean classic",     previewColor: "#DA4A1C", popular: true },
  { id: "modern",       name: "Boda",         description: "Services · bold accent panel",      previewColor: "#DA4A1C" },
  { id: "bold",         name: "Soko",         description: "Consulting · minimal centered",     previewColor: "#211A15" },
  { id: "minimal",      name: "Kahawa",       description: "Hospitality · split accent bar",    previewColor: "#F2A93B" },
  { id: "corporate",    name: "Chai",         description: "Startup · circular brand dot",      previewColor: "#12433D" },
  { id: "gradient-bc",  name: "Mkeka",        description: "Creative · purple geometric",       previewColor: "#7C3AED" },
  { id: "dark-pro-bc",  name: "Pesa",         description: "Finance · corporate top border",    previewColor: "#1E3A5F" },
  { id: "neon-bc",      name: "Afya",         description: "Healthcare · mint organic",         previewColor: "#12433D" },
  { id: "earthy-bc",    name: "Shamba",       description: "Agriculture · warm organic tones",  previewColor: "#B45309" },
  { id: "luxury-bc",    name: "Jenga",        description: "Trades/Construction · dark gold",   previewColor: "#211A15" },
  { id: "creative-bc",  name: "Wasomi",       description: "Education · clean general",         previewColor: "#211A15" },
  { id: "tech-bc",      name: "Sanaa",        description: "Arts · gradient magenta-pink",      previewColor: "#BE185D" },
  { id: "nature-bc",    name: "Biashara",     description: "Corporate · dark ruled accent",     previewColor: "#211A15" },
  { id: "artistic-bc",  name: "Rafiki",       description: "Freelance · warm cream gold",       previewColor: "#F2A93B" },
  { id: "retro-bc",     name: "Uzuri",        description: "Beauty/Salon · pink accent",        previewColor: "#BE185D" },
  { id: "geometric-bc", name: "Teknolojia",   description: "Tech · dark green terminal",        previewColor: "#4ADE80" },
  { id: "organic-bc",   name: "Kilimo",       description: "Nonprofit/NGO · mint green",        previewColor: "#12433D" },
  { id: "marble-bc",    name: "Bahari",       description: "Tourism/Travel · ocean blue",       previewColor: "#0E7490" },
  { id: "duo-tone-bc",  name: "Zawadi",       description: "Events · portrait accent bar",      previewColor: "#DA4A1C" },
  { id: "watercolor-bc",name: "Simba",        description: "Luxury · gold foil effect",         previewColor: "#F2A93B" },
  { id: "premium-bc",   name: "Serengeti",    description: "Premium · black gold top border",   previewColor: "#D97706" },
  { id: "glass-bc",     name: "Nairobi",      description: "Corporate · frosted modern",        previewColor: "#6366F1" },
  { id: "nordic-bc",    name: "Zanzibar",     description: "Creative · hairline divider",       previewColor: "#0F172A" },
  { id: "tropical-bc",  name: "Mombasa",      description: "Hospitality · vibrant solid",       previewColor: "#0E7490" },
  { id: "urban-bc",     name: "Kilimanjaro",  description: "Executive · dark top strip",        previewColor: "#111827" },
];

// ─── Letter Types ─────────────────────────────────────────────────────────────

export type LetterType =
  | "reference" | "resignation" | "application"
  | "employment-verification" | "salary-increase" | "promotion"
  | "leave-of-absence" | "job-offer" | "appointment-confirmation"
  | "termination" | "business-proposal" | "complaint"
  | "apology" | "inquiry" | "authorization"
  | "partnership-mou" | "vacate-notice" | "scholarship"
  | "internship" | "sponsorship"
  | "quotation" | "invoice" | "letterhead";
export type LetterTemplateId =
  | "formal"
  | "modern-letter"
  | "executive-letter"
  | "clean-letter"
  | "minimal-letter"
  | "classic-letter"
  | "bold-letter"
  | "contemporary-letter"
  | "professional-letter"
  | "elegant-letter"
  | "compact-letter"
  | "academic-letter"
  | "official-letter"
  | "diplomatic-letter"
  | "corporate-letter"
  | "legal-letter"
  | "nonprofit-letter";

export interface LetterFrom {
  name: string;
  title?: string;
  company?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface LetterTo {
  name: string;
  title?: string;
  company?: string;
  address?: string;
}

export interface LetterData {
  letterType: LetterType;
  from: LetterFrom;
  to: LetterTo;
  date: string;
  subject: string;
  body: string;
  closing: string;
}

export function createEmptyLetterData(letterType: LetterType = "reference", lang: "en" | "sw" = "en"): LetterData {
  const subjects: Record<LetterType, string> = {
    reference:   "Letter of Reference",
    resignation: "Letter of Resignation",
    application: "Job Application",
    "employment-verification": "Employment Verification",
    "salary-increase": "Salary Increase Request",
    promotion:   "Promotion Request",
    "leave-of-absence": "Leave of Absence Request",
    "job-offer":  "Job Offer Letter",
    "appointment-confirmation": "Appointment Confirmation",
    termination: "Termination Notice",
    "business-proposal": "Business Proposal",
    complaint:   "Complaint Letter",
    apology:     "Apology Letter",
    inquiry:     "Inquiry Letter",
    authorization: "Authorization Letter",
    "partnership-mou": "Partnership / MOU Cover Letter",
    "vacate-notice": "Notice to Vacate",
    scholarship:              "Scholarship Application",
    internship:               "Internship Application",
    sponsorship:              "Sponsorship Request",
    quotation:                "Quotation",
    invoice:                  "Invoice",
    letterhead:               "Letterhead",
  };
  return {
    letterType,
    from: { name: "", title: "", company: "", address: "", email: "", phone: "" },
    to:   { name: "", title: "", company: "", address: "" },
    date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    subject: subjects[letterType],
    body: "",
    closing: lang === "sw" ? "Wako mwaminifu" : "Yours sincerely",
  };
}

export interface LetterTemplate {
  id: LetterTemplateId;
  name: string;
  description: string;
  previewColor: string;
  popular?: boolean;
}

export const LETTER_TEMPLATES: LetterTemplate[] = [
  { id: "formal",               name: "Formal",         description: "Traditional corporate layout",      previewColor: "#1e293b", popular: true },
  { id: "modern-letter",        name: "Modern",         description: "Clean contemporary style",          previewColor: "#2563EB" },
  { id: "executive-letter",     name: "Executive",      description: "Centered sender, wide margins",     previewColor: "#111111" },
  { id: "clean-letter",         name: "Clean",          description: "Top border, underlined subject",    previewColor: "#374151" },
  { id: "minimal-letter",       name: "Minimal",        description: "No border, open leading",           previewColor: "#6B7280" },
  { id: "classic-letter",       name: "Classic",        description: "Block format, sender top-right",    previewColor: "#1D4ED8" },
  { id: "bold-letter",          name: "Bold",           description: "Full-width color header",           previewColor: "#0F172A" },
  { id: "contemporary-letter",  name: "Contemporary",   description: "Two-column header, accent rule",    previewColor: "#0891B2" },
  { id: "professional-letter",  name: "Professional",   description: "Sender side-bordered, ruled",       previewColor: "#1E3A8A" },
  { id: "elegant-letter",       name: "Elegant",        description: "Italic name, double-rule header",   previewColor: "#78350F" },
  { id: "compact-letter",       name: "Compact",        description: "Tight spacing, fits more content",  previewColor: "#374151" },
  { id: "academic-letter",      name: "Academic",       description: "Centered institution header",       previewColor: "#4F46E5" },
  { id: "official-letter",      name: "Official",       description: "Government style with ref line",    previewColor: "#1E293B" },
  { id: "diplomatic-letter",    name: "Diplomatic",     description: "Small-caps, centered, ornamental",  previewColor: "#7C3AED" },
  { id: "corporate-letter",     name: "Corporate",      description: "Letterhead feel with logo space",   previewColor: "#0369A1" },
  { id: "legal-letter",         name: "Legal",          description: "Numbered paragraphs, dense text",   previewColor: "#111827" },
  { id: "nonprofit-letter",     name: "Nonprofit",      description: "Accent left strip, warm tone",      previewColor: "#059669" },
];

export const LETTER_TYPE_META: Record<LetterType, { label: string; description: string; emoji: string }> = {
  reference:   { label: "Reference Letter",   description: "Recommend a colleague or employee", emoji: "📋" },
  resignation: { label: "Resignation Letter", description: "Formally resign from a position",   emoji: "✉️" },
  application: { label: "Application Letter", description: "Apply for a job or program",        emoji: "📝" },
  "employment-verification": { label: "Employment Verification", description: "Confirm role, tenure & salary", emoji: "✅" },
  "salary-increase":        { label: "Salary Increase Request", description: "Evidence-based raise appeal", emoji: "📈" },
  promotion:                { label: "Promotion Request",       description: "Case for role advancement", emoji: "⭐" },
  "leave-of-absence":       { label: "Leave of Absence",       description: "Annual, study or medical leave", emoji: "🏖️" },
  "job-offer":              { label: "Job Offer Letter",        description: "Employer to candidate with terms", emoji: "🎉" },
  "appointment-confirmation": { label: "Appointment Confirmation", description: "Interview or meeting confirmation", emoji: "📅" },
  termination:              { label: "Termination Notice",      description: "Compliant end-of-contract", emoji: "🔚" },
  "business-proposal":      { label: "Business Proposal",      description: "Cover letter for pitch or bid", emoji: "💼" },
  complaint:                { label: "Complaint Letter",        description: "Firm but professional grievance", emoji: "⚠️" },
  apology:                  { label: "Apology Letter",          description: "Service recovery apology", emoji: "🙏" },
  inquiry:                  { label: "Inquiry Letter",          description: "Request for info or quote", emoji: "❓" },
  authorization:            { label: "Authorization Letter",    description: "Delegate someone to act for you", emoji: "📄" },
  "partnership-mou":        { label: "Partnership / MOU",      description: "Introduces partnership agreement", emoji: "🤝" },
  "vacate-notice":          { label: "Notice to Vacate",        description: "Tenant/landlord move-out notice", emoji: "🏠" },
  scholarship:              { label: "Scholarship Application", description: "Funding request with motivation", emoji: "🎓" },
  internship:               { label: "Internship Application",  description: "Student outreach to employer", emoji: "👔" },
  sponsorship:              { label: "Sponsorship Request",     description: "Event or community funding ask", emoji: "🤲" },
  quotation:                { label: "Quotation",               description: "Itemised price quote for a client", emoji: "🧾" },
  invoice:                  { label: "Invoice",                 description: "Bill for goods or services delivered", emoji: "📤" },
  letterhead:               { label: "Letterhead",              description: "Branded company letter header", emoji: "🏢" },
};

// ─── Document Category ────────────────────────────────────────────────────────

export type DocumentCategory = "cv" | "cover-letter" | "business-card" | "letter";

export const DOCUMENT_CATEGORIES: {
  id: DocumentCategory; label: string; description: string; emoji: string; href: string;
}[] = [
  { id: "cv",            label: "CV / Resume",    description: "160+ professional CV templates",  emoji: "📄", href: "/editor/cv/new" },
  { id: "cover-letter",  label: "Cover Letter",   description: "Matching cover letters",             emoji: "✉️", href: "/editor/cover-letter/new" },
  { id: "business-card", label: "Business Card",  description: "25 business card designs",      emoji: "💼", href: "/editor/business-card/new" },
  { id: "letter",        label: "Letter",         description: "20 formal letters — reference, resignation & more",       emoji: "📋", href: "/editor/letter/new" },
];

// ─── Subscription / Billing ───────────────────────────────────────────────────

export type PlanId = "trial" | "monthly" | "annual";
export type SubscriptionStatus = "active" | "trialing" | "cancelled" | "expired" | "past_due";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  priceKES: number;
  priceTZS: number;
  billingPeriod: "7-day" | "monthly" | "annual";
  description: string;
  popular?: boolean;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "monthly",
    name: "Monthly",
    price: 7.90,
    priceKES: 1030,
    priceTZS: 19500,
    billingPeriod: "monthly",
    description: "Unlimited AI + Word export, billed monthly. Cancel anytime.",
    features: [
      "Unlimited AI \u2014 Sumaiya writes & tailors every section",
      "AI cover letters & job tailoring, no daily limit",
      "Scan an old CV \u2014 AI fills it in for you",
      "Word (.docx) export",
      "ATS score history & tracking",
      "Priority support",
    ],
  },
  {
    id: "trial",
    name: "7-Day Access",
    price: 2.90,
    priceKES: 380,
    priceTZS: 7200,
    billingPeriod: "7-day",
    description: "Unlimited AI for 7 days, then $7.90/month. Cancel anytime.",
    popular: true,
    features: [
      "Unlimited AI \u2014 Sumaiya writes & tailors every section",
      "AI cover letters & job tailoring, no daily limit",
      "Scan an old CV \u2014 AI fills it in for you",
      "Word (.docx) export",
      "ATS score history & tracking",
      "Priority support",
    ],
  },
  {
    id: "annual",
    name: "Annual",
    price: 5.90,
    priceKES: 770,
    priceTZS: 14750,
    billingPeriod: "annual",
    description: "Unlimited AI, billed as $70.80/year. Cancel anytime.",
    features: [
      "Unlimited AI \u2014 Sumaiya writes & tailors every section",
      "AI cover letters & job tailoring, no daily limit",
      "Scan an old CV \u2014 AI fills it in for you",
      "Word (.docx) export",
      "ATS score history & tracking",
      "Priority support",
    ],
  },
];

// ─── API / Record Types ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CVRecord {
  id: string;
  title: string;
  templateId: TemplateId;
  primaryColor: string;
  fontFamily: string;
  data: CVData;
  status: "draft" | "complete";
  createdAt: string;
  updatedAt: string;
}

export interface CoverLetterRecord {
  id: string;
  title: string;
  cvId?: string;
  templateId: TemplateId;
  primaryColor: string;
  content: string;
  jobTitle?: string;
  companyName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessCardRecord {
  id: string;
  title: string;
  templateId: BusinessCardTemplateId;
  primaryColor: string;
  data: BusinessCardData;
  status: "draft" | "complete";
  createdAt: string;
  updatedAt: string;
}

export interface LetterRecord {
  id: string;
  title: string;
  letterType: LetterType;
  templateId: LetterTemplateId;
  primaryColor: string;
  data: LetterData;
  status: "draft" | "complete";
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  cvCount: number;
  coverLetterCount: number;
  businessCardCount: number;
  letterCount: number;
  downloadsThisMonth: number;
  subscription: SubscriptionStatus | null;
}
