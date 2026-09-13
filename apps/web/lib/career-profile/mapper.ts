// Career Profile ↔ CV mappers — pure, deterministic, no DB, no React.
//
// The Career Profile (user_profile.career_profile) is the single source of
// truth for a user's career facts; CVs are derived views of it. These helpers
// make the conversion mechanical in both directions and implement the
// non-destructive merge rules that backfill/sync paths must follow:
//
//   1. profileToCvData — only spreads truthy/non-empty sections so a blank
//      profile never wipes a template default.
//   2. mergeProfileFromCv — NEVER overwrites a non-empty existing section;
//      fills only empty sections and blank scalar fields (the same philosophy
//      as /api/profile/seed). Opt-in and reversible by design.
//
// Fact provenance: when entries are copied into the profile, they are stamped
// with factMeta { source: "backfill" } — the seam Task 2's tagging layer
// (confirmed / needs-confirmation / ai-suggested) builds on. No AI facts are
// ever created here; everything comes from a real user-authored CV.

import { nanoid } from "nanoid";
import {
  createEmptyCareerProfile,
  createEmptyCVData,
  unwrapStoredJson,
  type CareerProfile,
  type CVData,
  type FactMeta,
  type FactStatus,
} from "@/types";
import { toStoredCvData } from "@sumaiya/utils/cv-shape";

// ─── Completeness ────────────────────────────────────────────────────────────

/** Count of non-empty career facts in a CV (used to pick the "most complete"). */
export function cvCompleteness(data: CVData): number {
  let score = 0;
  if (data.personal?.fullName?.trim()) score += 2;
  if (data.personal?.jobTitle?.trim()) score += 1;
  if (data.personal?.email?.trim()) score += 1;
  if (data.personal?.phone?.trim()) score += 1;
  if (data.summary?.trim()) score += 2;
  score += data.experience?.filter((e) => e.company || e.position).length ?? 0;
  score += data.education?.filter((e) => e.institution).length ?? 0;
  score += data.skills?.filter((s) => s.name).length ?? 0;
  score += data.certifications?.filter((c) => c.name).length ?? 0;
  score += data.languages?.filter((l) => l.name).length ?? 0;
  score += (data.projects ?? []).filter((p) => p.name).length ?? 0;
  score += data.referees?.filter((r) => r.name).length ?? 0;
  return score;
}

/**
 * Per-section fill status of a Career Profile — powers the UI card
 * ("Experience: 3 entries · Skills: 12 · …"). Returns { key, label, count }.
 */
export function profileSectionCounts(profile: CareerProfile | null | undefined): Array<{ key: string; count: number }> {
  if (!profile) return [];
  return [
    { key: "experience", count: profile.experience?.length ?? 0 },
    { key: "education", count: profile.education?.length ?? 0 },
    { key: "skills", count: profile.skills?.length ?? 0 },
    { key: "certifications", count: profile.certifications?.length ?? 0 },
    { key: "languages", count: profile.languages?.length ?? 0 },
    { key: "projects", count: profile.projects?.length ?? 0 },
    { key: "achievements", count: profile.achievements?.length ?? 0 },
    { key: "volunteer", count: profile.volunteer?.length ?? 0 },
    { key: "references", count: profile.references?.length ?? 0 },
  ].filter((s) => s.count > 0);
}

/** Pick the most complete CV (highest completeness; tie → newest updatedAt). */
export function pickMostCompleteCv<T extends { data: unknown; updatedAt?: Date | string | null }>(
  cvs: T[],
): T | null {
  let best: T | null = null;
  let bestScore = -1;
  for (const cv of cvs) {
    const parsed = parseCvLoose(cv.data);
    const score = cvCompleteness(parsed);
    if (score > bestScore || (score === bestScore && best && newer(cv.updatedAt, best.updatedAt))) {
      best = cv;
      bestScore = score;
    }
  }
  return best;
}

function newer(a: Date | string | null | undefined, b: Date | string | null | undefined): boolean {
  const ta = a ? new Date(a).getTime() : 0;
  const tb = b ? new Date(b).getTime() : 0;
  return ta > tb;
}

// ─── CVData parsing (loose — same philosophy as lib/cv/from-parsed.ts) ───────

/** Forgiving CVData parse: any missing section becomes empty. */
export function parseCvLoose(data: unknown): CVData {
  // Unwrap BEFORE the object check. `typeof data !== "object"` rejected every
  // string-encoded row, and that is 19 of 19 stored CVs — so this reader, which
  // seeds the career profile, snap-to-apply and the assistant's grounding, was
  // handing an empty CV to all of them. It was the second reader of the same
  // column; `parseCVData` was fixed first, which is exactly how a
  // one-column bug survives in half the codebase.
  //
  // `toStoredCvData` then maps the app's own shape (`personalInfo`/`headline`)
  // onto the stored one, so this reader agrees with `parseCVData` instead of
  // being a looser, differently-wrong cousin.
  const normalized = toStoredCvData<Record<string, unknown>>(unwrapStoredJson(data));
  if (!normalized || typeof normalized !== "object") return createEmptyCVData();
  const d = normalized as Record<string, unknown>;
  const empty = createEmptyCVData();
  const personal = (d.personal ?? {}) as Record<string, unknown>;
  return {
    ...empty,
    personal: {
      fullName: str(personal.fullName),
      jobTitle: str(personal.jobTitle),
      email: str(personal.email),
      phone: str(personal.phone),
      location: str(personal.location),
      linkedin: str(personal.linkedin) || undefined,
      website: str(personal.website) || undefined,
      photo: str(personal.photo) || undefined,
    },
    summary: str(d.summary),
    experience: Array.isArray(d.experience) ? (d.experience as CVData["experience"]) : [],
    education: Array.isArray(d.education) ? (d.education as CVData["education"]) : [],
    skills: Array.isArray(d.skills) ? (d.skills as CVData["skills"]) : [],
    certifications: Array.isArray(d.certifications) ? (d.certifications as CVData["certifications"]) : [],
    languages: Array.isArray(d.languages) ? (d.languages as CVData["languages"]) : [],
    projects: Array.isArray(d.projects) ? (d.projects as CVData["projects"]) : [],
    referees: Array.isArray(d.referees) ? (d.referees as CVData["referees"]) : [],
    hobbies: str(d.hobbies),
  };
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

// ─── Provenance ──────────────────────────────────────────────────────────────
//
// Every career fact carries provenance in factMeta, keyed by:
//   - scalar fields → the path ("personal.fullName", "summary", "preferences")
//   - list entries  → the entry id (existing pattern)
// Meta shape: { source, confidence, updatedAt, status }.
// Source priority (iron rule): user-edited > interview > conversation > cv:<id>
// > legacy (ai-draft/backfill/import). A fact whose existing provenance ranks
// AT OR ABOVE the incoming source is never overwritten; only lower-ranked
// facts (e.g. an old cv: fact when a NEW cv arrives — same rank, newer time —
// or legacy backfill facts when a real CV arrives) can be superseded.

export const USER_SOURCES = new Set(["user-edited", "user"]);

export function sourceRank(source: string | undefined): number {
  if (!source) return 4; // no provenance → treat as user-authored (never clobber)
  if (USER_SOURCES.has(source)) return 4;
  if (source === "interview") return 3;
  if (source === "conversation") return 2;
  if (source.startsWith("cv:")) return 1;
  return 0; // ai-draft / backfill / import
}

export interface Provenance {
  source: string;
  confidence?: number;
  status?: FactStatus;
  now?: string;
  /**
   * AI-derived content (conversation-built summary, experience descriptions).
   * When true, prose fields are stamped `needs-confirmation` — the user has NOT
   * confirmed the AI's wording yet — while structured facts (name, employers,
   * dates, skills, education) stay `confirmed`.
   */
  aiDerived?: boolean;
}

export function stampMeta(meta: FactMeta | undefined, p: Provenance): FactMeta {
  return {
    ...(meta ?? {}),
    source: p.source,
    confidence: p.confidence ?? 0.8,
    status: p.status ?? "confirmed",
    updatedAt: p.now ?? new Date().toISOString(),
  };
}

/**
 * Status for AI-derived PROSE fields (the conversation-built summary and
 * experience[].description). The user has NOT confirmed the AI's wording yet,
 * so these are stamped `needs-confirmation` — unlike structured facts (name,
 * employers, dates, skills, education) which stay `confirmed`.
 *
 * Keyed on the SOURCE, not on a caller-supplied flag: any prose that arrives
 * from a CV save (`cv:...`) or the conversation funnel could be AI/draft-
 * written, so it enters the trust loop by default. Only explicit user-authored
 * provenance (Settings save / interview answers — "user-edited"/"user") is
 * stamped confirmed outright. This covers every seed path — editor save,
 * guest migration, chat build — without threading `aiDerived` through callers.
 */
export function aiProseStatus(p: Provenance): FactStatus {
  const src = p.source ?? "";
  // User-typed facts are authoritative: never flag them for confirmation.
  if (src === "user-edited" || src === "user") return "confirmed";
  // CV saves and conversation output are draft/AI prose → trust loop.
  if (src.startsWith("cv:") || src === "conversation") return "needs-confirmation";
  return p.status ?? "confirmed";
}

/**
 * May the incoming provenance supersede the existing one for a fact?
 * The iron rule: a user-authored fact (source "user-edited"/"user", or NO
 * provenance at all) is never overwritten by a derived fact. Among derived
 * sources, higher priority wins; same source → newer updatedAt wins.
 */
export function maySupersede(existing: FactMeta | undefined, incoming: Provenance, existingNow?: string): boolean {
  const rank = sourceRank(existing?.source);
  const incRank = sourceRank(incoming.source);
  if (incRank < rank) return false;
  if (incRank > rank) return true;
  // Same rank: newer wins (only for same-source-family).
  const exT = existingNow ?? existing?.updatedAt ?? "";
  const inT = incoming.now ?? new Date().toISOString();
  return inT >= exT;
}

// ─── CV → Profile ────────────────────────────────────────────────────────────

/**
 * Build a Career Profile from a CV's data. Profile-only sections (achievements,
 * volunteer, preferences) start empty — they have no CV equivalent.
 * Entries are stamped factMeta with the given provenance (default: backfill).
 */
export function cvDataToProfile(cvData: CVData, p: Provenance = { source: "backfill" }): CareerProfile {
  const profile = createEmptyCareerProfile();
  const stamp: FactMeta = { source: p.source, confidence: p.confidence ?? 0.8, status: p.status ?? "confirmed", updatedAt: p.now ?? new Date().toISOString() };
  profile.personal = { ...cvData.personal };
  profile.summary = cvData.summary ?? "";
  profile.experience = (cvData.experience ?? []).map((e) => ({ ...e }));
  profile.education = (cvData.education ?? []).map((e) => ({ ...e }));
  profile.skills = (cvData.skills ?? []).map((s) => ({ ...s }));
  profile.certifications = (cvData.certifications ?? []).map((c) => ({ ...c }));
  profile.languages = (cvData.languages ?? []).map((l) => ({ ...l }));
  profile.projects = (cvData.projects ?? []).map((p2) => ({ ...p2 }));
  profile.references = (cvData.referees ?? []).map((r) => ({ ...r }));
  profile.factMeta = stampProfileEntries(profile, stamp);
  return profile;
}

/** Stamp every entry id in the profile with the given factMeta (Task 2 seam). */
export function stampProfileEntries(profile: CareerProfile, meta: FactMeta): Record<string, FactMeta> {
  const map: Record<string, FactMeta> = { ...(profile.factMeta ?? {}) };
  const ids = [
    ...profile.experience.map((e) => e.id),
    ...profile.education.map((e) => e.id),
    ...profile.skills.map((s) => s.id),
    ...profile.certifications.map((c) => c.id),
    ...profile.languages.map((l) => l.id),
    ...profile.projects.map((p) => p.id),
    ...profile.achievements.map((a) => a.id),
    ...profile.volunteer.map((v) => v.id),
    ...profile.references.map((r) => r.id),
  ];
  for (const id of ids) {
    if (id) map[id] = { ...map[id], ...meta };
  }
  return map;
}

// ─── Profile → CV ────────────────────────────────────────────────────────────

/**
 * Derive a CV's data from the Career Profile. Only truthy/non-empty sections
 * are copied, so a partially-filled profile never blanks a CV's own content.
 * `base` (an existing CV) wins for anything the profile doesn't cover.
 */
export function profileToCvData(profile: CareerProfile | null | undefined, base?: CVData): CVData {
  const empty = createEmptyCVData();
  const out: CVData = {
    ...empty,
    ...(base ?? {}),
  };
  if (!profile) return out;

  if (profile.personal?.fullName?.trim()) out.personal.fullName = profile.personal.fullName;
  if (profile.personal?.jobTitle?.trim()) out.personal.jobTitle = profile.personal.jobTitle;
  if (profile.personal?.email?.trim()) out.personal.email = profile.personal.email;
  if (profile.personal?.phone?.trim()) out.personal.phone = profile.personal.phone;
  if (profile.personal?.location?.trim()) out.personal.location = profile.personal.location;
  if (profile.personal?.linkedin?.trim()) out.personal.linkedin = profile.personal.linkedin;
  if (profile.personal?.website?.trim()) out.personal.website = profile.personal.website;
  if (profile.personal?.photo?.trim()) out.personal.photo = profile.personal.photo;

  if (profile.summary?.trim()) out.summary = profile.summary;
  if (profile.experience?.length) out.experience = profile.experience.map((e) => ({ ...e }));
  if (profile.education?.length) out.education = profile.education.map((e) => ({ ...e }));
  if (profile.skills?.length) out.skills = profile.skills.map((s) => ({ ...s }));
  if (profile.certifications?.length) out.certifications = profile.certifications.map((c) => ({ ...c }));
  if (profile.languages?.length) out.languages = profile.languages.map((l) => ({ ...l }));
  if (profile.projects?.length) out.projects = profile.projects.map((p) => ({ ...p }));
  // CVData calls them "referees"; the profile calls them "references".
  if (profile.references?.length) out.referees = profile.references.map((r) => ({ ...r }));

  return out;
}

// ─── Non-destructive merge (backfill / sync) ─────────────────────────────────

export interface MergeResult {
  profile: CareerProfile;
  /** Section keys that were filled by this merge (empty = nothing changed). */
  filled: string[];
}

/**
 * Content-dedup key for a list entry. Overlapping CVs each generate their own
 * nanoid ids, so the SAME fact (e.g. a "React" skill) would otherwise be
 * appended twice with different ids. Match by CONTENT:
 *   - skills / languages → normalized (lowercased/trimmed) name
 *   - certifications     → normalized name + issuer
 *   - experience         → normalized company + position + startDate
 * Sections without a natural key (education, projects, referees) return null —
 * those are only merged by id.
 */
export function entryContentKey(
  section: keyof CareerProfile,
  entry: Record<string, unknown>,
): string | null {
  const norm = (v: unknown): string => (typeof v === "string" ? v.trim().toLowerCase() : "");
  switch (section) {
    case "skills":
    case "languages":
      return `name:${norm(entry.name)}`;
    case "certifications":
      return `cert:${norm(entry.name)}|${norm(entry.issuer)}`;
    case "experience":
      return `exp:${norm(entry.company)}|${norm(entry.position)}|${norm(entry.startDate)}`;
    default:
      return null;
  }
}

/**
 * Identity fields for a section — the fields that MAKE UP the dedup key. On a
 * content match these are fill-only: the existing entry's canonical spelling
 * wins over a case/whitespace variant from the incoming CV. Derived from the
 * section directly (NOT by parsing the content-key string — parsing the key
 * yields garbage tokens for multi-part keys, e.g. ["cert","amazon"]).
 */
export function entryIdentityFields(section: keyof CareerProfile): string[] {
  switch (section) {
    case "skills":
    case "languages":
      return ["name"];
    case "certifications":
      return ["name", "issuer"];
    case "experience":
      return ["company", "position", "startDate"];
    default:
      return [];
  }
}

/** Field-by-field merge of an incoming entry into an existing one (iron rule). */
function mergeEntryFields(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
  meta: FactMeta | undefined,
  p: Provenance,
  now: string,
  fillOnlyFields: string[] = [],
): { merged: Record<string, unknown>; changed: boolean } {
  const merged: Record<string, unknown> = { ...existing };
  let changed = false;
  for (const [field, value] of Object.entries(incoming)) {
    if (field === "id") continue;
    const v = typeof value === "string" ? value.trim() : value;
    if (v == null || v === "") continue;
    const curV = typeof existing[field] === "string" ? (existing[field] as string).trim() : existing[field];
    // Identity fields on a content-dedup match (e.g. the skill name itself) are
    // fill-only: the existing entry already carries the canonical spelling, so
    // a case/whitespace variant from another CV must never overwrite it.
    if (fillOnlyFields.includes(field)) {
      if (!curV) {
        merged[field] = value;
        changed = true;
      }
      continue;
    }
    if (!curV) {
      merged[field] = value;
      changed = true;
    } else if (curV !== value && maySupersede(meta, p, now)) {
      merged[field] = value;
      changed = true;
    }
  }
  return { merged, changed };
}

/**
 * Merge facts from a CV (or a conversation-built CV) into an existing Career
 * Profile. Non-destructive + provenance-aware:
 * - a blank scalar field / empty section gets filled from the CV
 * - a non-blank fact is only superseded when the INCOMING provenance ranks
 *   higher than the existing one (or same rank + newer timestamp) — the iron
 *   rule: user-authored facts are never silently overwritten
 * - list entries: same-id entries merge field-by-field; unmatched entries are
 *   APPENDED (a newer CV enriches the profile — that's the point of "fix a
 *   fact once → correct everywhere")
 * - everything the CV contributed is stamped factMeta { source, confidence,
 *   updatedAt, status } so every fact stays auditable
 * Returns the merged profile + which sections changed.
 */
export function mergeProfileFromCv(
  existing: CareerProfile | null | undefined,
  cvData: CVData,
  p: Provenance = { source: "backfill" },
): MergeResult {
  const current = existing && Object.keys(existing).length ? existing : createEmptyCareerProfile();
  const incoming = cvDataToProfile(cvData, p);
  const filled: string[] = [];
  const out: CareerProfile = {
    ...current,
    personal: { ...current.personal },
    preferences: {
      ...createEmptyCareerProfile().preferences,
      ...(current.preferences ?? {}),
    },
    factMeta: { ...(current.factMeta ?? {}) },
  };
  const now = p.now ?? new Date().toISOString();
  const touched = (key: string) => { if (!filled.includes(key)) filled.push(key); };
  const metaFor = (key: string): FactMeta | undefined => out.factMeta![key];

  // Scalars: fill blanks; supersede only when provenance allows.
  const personalFields: Array<keyof CareerProfile["personal"]> = [
    "fullName", "jobTitle", "email", "phone", "location", "linkedin", "website", "photo",
  ];
  for (const f of personalFields) {
    const key = `personal.${String(f)}`;
    const inc = incoming.personal[f]?.trim() ?? "";
    if (!inc) continue;
    const cur = out.personal[f]?.trim() ?? "";
    if (!cur) {
      out.personal[f] = inc;
      out.factMeta![key] = stampMeta(metaFor(key), p);
      touched("personal");
    } else if (cur !== inc && maySupersede(metaFor(key), p, now)) {
      out.personal[f] = inc;
      out.factMeta![key] = stampMeta(metaFor(key), p);
      touched("personal");
    }
  }
  const summaryKey = "summary";
  if (incoming.summary?.trim()) {
    if (!(out.summary?.trim() ?? "")) {
      out.summary = incoming.summary;
      out.factMeta![summaryKey] = stampMeta(metaFor(summaryKey), { ...p, status: aiProseStatus(p) });
      touched("summary");
    } else if (out.summary !== incoming.summary && maySupersede(metaFor(summaryKey), p, now)) {
      out.summary = incoming.summary;
      out.factMeta![summaryKey] = stampMeta(metaFor(summaryKey), { ...p, status: aiProseStatus(p) });
      touched("summary");
    }
  }

  // List sections: fill empty; merge same-id entries; append unmatched.
  const sections: Array<{ key: keyof CareerProfile; inc: unknown[]; cur: unknown[] }> = [
    { key: "experience", inc: incoming.experience, cur: current.experience },
    { key: "education", inc: incoming.education, cur: current.education },
    { key: "skills", inc: incoming.skills, cur: current.skills },
    { key: "certifications", inc: incoming.certifications, cur: current.certifications },
    { key: "languages", inc: incoming.languages, cur: current.languages },
    { key: "projects", inc: incoming.projects, cur: current.projects },
    { key: "references", inc: incoming.references, cur: current.references },
    // Profile-only sections have no CV source — never filled by this merge.
    { key: "achievements", inc: [], cur: current.achievements },
    { key: "volunteer", inc: [], cur: current.volunteer },
  ];

  for (const { key, inc, cur } of sections) {
    if (!inc.length) continue;
    const existingArr = cur?.length ? [...cur] : [];
    const byId = new Map(existingArr.map((e) => [String((e as { id?: string }).id ?? ""), e]));
    // Content-dedup index: same fact from overlapping CVs (different nanoid ids)
    // must merge into the existing entry instead of being appended twice.
    const byContent = new Map<string, unknown>();
    for (const e of existingArr) {
      const ck = entryContentKey(key, e as Record<string, unknown>);
      if (ck) byContent.set(ck, e);
    }

    // CV/conversation-sourced experience descriptions are stamped
    // needs-confirmation (the user has NOT confirmed the draft/AI wording yet)
    // — per-field, keyed "<id>.description", while the entry's structured
    // facts (company/position/dates) stay confirmed. Keyed on the SOURCE so
    // editor-save and guest-migration paths (which never set aiDerived) get
    // the trust-loop treatment too.
    const stampAiDescription = (entryId: string, desc: unknown, changed: boolean) => {
      if (key !== "experience") return;
      const src = p.source ?? "";
      if (!src.startsWith("cv:") && src !== "conversation") return;
      const d = typeof desc === "string" ? desc.trim() : "";
      if (!d) return;
      // Only stamp when the description actually entered/changed — never clobber
      // an existing (possibly user-confirmed) description stamp on a no-op merge.
      if (!changed) return;
      out.factMeta![`${entryId}.description`] = stampMeta(out.factMeta![`${entryId}.description`], {
        ...p, status: aiProseStatus(p),
      });
    };

    // Merge each incoming entry into the section. Entries matched by id OR by
    // content merge field-by-field; truly new facts are appended (this also
    // covers the empty-profile case: result starts empty, every entry appends
    // with within-CV dedup). Both paths dedup WITHIN one CV (two "React" rows
    // with different ids → one).
    const result: unknown[] = [...existingArr];
    for (const incEntry of inc as Array<Record<string, unknown>>) {
      const id = String(incEntry.id ?? "");
      const existingEntry = id ? byId.get(id) : undefined;
      const contentKey = entryContentKey(key, incEntry);
      const contentMatch = existingEntry ?? (contentKey ? byContent.get(contentKey) : undefined);
      if (contentMatch) {
        // Field-by-field merge inside the matched entry (iron rule preserved).
        // On a content match the identity fields (the dedup key itself) are
        // fill-only — the existing entry's canonical spelling wins over a
        // case/whitespace variant from the incoming CV.
        const ex = contentMatch as Record<string, unknown>;
        const exId = String((ex as { id?: string }).id ?? id);
        const identityFields = entryIdentityFields(key);
        const { merged: mergedEntry, changed: entryChanged } = mergeEntryFields(ex, incEntry, out.factMeta![exId], p, now, identityFields);
        if (entryChanged) {
          const idx = result.indexOf(ex);
          if (idx >= 0) result[idx] = mergedEntry;
          out.factMeta![exId] = stampMeta(out.factMeta![exId], p);
          touched(String(key));
        }
        stampAiDescription(exId, incEntry.description, entryChanged);
      } else {
        // New fact from the CV → append (non-destructive: nothing removed).
        result.push({ ...incEntry });
        if (id) out.factMeta![id] = stampMeta(out.factMeta![id], p);
        if (contentKey) byContent.set(contentKey, result[result.length - 1]);
        touched(String(key));
        stampAiDescription(id, incEntry.description, true);
      }
    }
    (out as unknown as Record<string, unknown>)[key] = result;
  }

  // Preferences: fill only blank scalar prefs (arrays untouched if set).
  const pref = out.preferences;
  const incomingPref = incoming.preferences ?? {};
  if (!pref.targetRoles?.length && incomingPref.targetRoles?.length) {
    pref.targetRoles = incomingPref.targetRoles;
    if (!filled.includes("preferences")) filled.push("preferences");
  }
  if (!pref.preferredLocations?.length && incomingPref.preferredLocations?.length) {
    pref.preferredLocations = incomingPref.preferredLocations;
    if (!filled.includes("preferences")) filled.push("preferences");
  }
  if (!pref.remotePreference && incomingPref.remotePreference) {
    pref.remotePreference = incomingPref.remotePreference;
    if (!filled.includes("preferences")) filled.push("preferences");
  }
  if (filled.includes("preferences")) {
    out.factMeta!["preferences"] = stampMeta(out.factMeta!["preferences"], p);
  }

  return { profile: out, filled };
}

/**
 * Stamp EVERY fact in a profile as user-authored (or interview/conversation).
 * Used by POST/PATCH /api/profile when the client replaces the profile
 * wholesale (Settings save, Career Interview answer) — the user just typed
 * these facts, so they are authoritative and no derived fact may overwrite
 * them until the user edits again.
 */
export function stampProfileAllFacts(profile: CareerProfile, p: Provenance): CareerProfile {
  const now = p.now ?? new Date().toISOString();
  const factMeta: Record<string, FactMeta> = { ...(profile.factMeta ?? {}) };
  const personalFields: Array<keyof CareerProfile["personal"]> = [
    "fullName", "jobTitle", "email", "phone", "location", "linkedin", "website", "photo",
  ];
  for (const f of personalFields) {
    if ((profile.personal[f] ?? "").trim()) {
      factMeta[`personal.${String(f)}`] = stampMeta(factMeta[`personal.${String(f)}`], { ...p, now });
    }
  }
  if (profile.summary?.trim()) factMeta["summary"] = stampMeta(factMeta["summary"], { ...p, now });
  const entryIds = [
    ...profile.experience.map((e) => e.id),
    ...profile.education.map((e) => e.id),
    ...profile.skills.map((s) => s.id),
    ...profile.certifications.map((c) => c.id),
    ...profile.languages.map((l) => l.id),
    ...profile.projects.map((pr) => pr.id),
    ...profile.achievements.map((a) => a.id),
    ...profile.volunteer.map((v) => v.id),
    ...profile.references.map((r) => r.id),
  ];
  for (const id of entryIds) {
    if (id) factMeta[id] = stampMeta(factMeta[id], { ...p, now });
  }
  // Experience descriptions (possibly AI-derived, stamped needs-confirmation by
  // the conversation seed) become user-authored once the user saves the whole
  // profile — "preview → confirm" resolves them, same as every other fact.
  for (const e of profile.experience) {
    if (e.id && e.description?.trim()) {
      factMeta[`${e.id}.description`] = stampMeta(factMeta[`${e.id}.description`], { ...p, now });
    }
  }
  if (profile.preferences.targetRoles?.length || profile.preferences.preferredLocations?.length || profile.preferences.remotePreference) {
    factMeta["preferences"] = stampMeta(factMeta["preferences"], { ...p, now });
  }
  return { ...profile, factMeta };
}

// ─── ID helpers ──────────────────────────────────────────────────────────────

export function freshId(): string {
  return nanoid();
}
