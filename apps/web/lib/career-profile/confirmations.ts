/**
 * Confirmation resolution — the trust loop for the Career Profile.
 *
 * The conversation path (Sumaiya's build-cv / build-doc) stamps AI-written
 * prose (summary, experience[].description) as `needs-confirmation` (PR #223).
 * This module is the ONE place that lists those pending facts and the ONE
 * place that resolves them (accept → user-edited confirmed; reject → removed).
 * Every surface — the assistant's inline prompt, the Settings card, the CV
 * editor badge — reads this module and writes through it, so a confirmation
 * made anywhere is reflected everywhere.
 *
 * Pure: no DB, no AI. Fully deterministic and unit-testable.
 */
import type { CareerProfile, FactMeta, FactStatus } from "@/types";
import { createEmptyCareerProfile } from "@/types";
import { stampMeta } from "./mapper";

export type ConfirmationDecision = "accept" | "reject";

export interface PendingConfirmation {
  /** The factMeta key: "summary" | "personal.<field>" | "<entryId>" | "<entryId>.description". */
  key: string;
  /** Profile section the fact lives in ("summary", "experience", "personal", …). */
  section: string;
  /** Entry id for per-entry facts (experience description, an entry itself). */
  entryId?: string;
  /** The field inside the section ("summary", "description", "company", …). */
  field: string;
  /** Human label, bilingual — shown on every surface verbatim. */
  label: { en: string; sw: string };
  /** Current value (trimmed, display-ready). */
  value: string;
  /** Provenance source that drafted the fact (e.g. "conversation", "cv:<id>"). */
  source: string;
  updatedAt?: string;
}

const SECTION_TITLES: Record<string, { en: string; sw: string }> = {
  summary: { en: "Professional summary", sw: "Muhtasari wa taaluma" },
  personal: { en: "Personal details", sw: "Taarifa binafsi" },
  experience: { en: "Work experience", sw: "Uzoefu wa kazi" },
  education: { en: "Education", sw: "Elimu" },
  skills: { en: "Skills", sw: "Ustadi" },
  certifications: { en: "Certifications", sw: "Vyeti" },
  languages: { en: "Languages", sw: "Lugha" },
  projects: { en: "Projects", sw: "Miradi" },
  achievements: { en: "Achievements", sw: "Mafanikio" },
  volunteer: { en: "Volunteering", sw: "Kujitolea" },
  references: { en: "References", sw: "Marejeo" },
  preferences: { en: "Preferences", sw: "Mapendeleo" },
};

function sectionTitle(section: string): { en: string; sw: string } {
  return SECTION_TITLES[section] ?? { en: section, sw: section };
}

/** Human short title for one entry, e.g. "Zuri Fintech — Engineer". */
function entryTitle(section: string, e: Record<string, unknown>): string {
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const a = s(e.company) || s(e.institution) || s(e.organization) || s(e.name) || s(e.title);
  const b = s(e.position) || s(e.degree) || s(e.role) || s(e.issuer);
  return [a, b].filter(Boolean).join(" — ") || "(entry)";
}

/**
 * Find which section an entry id lives in (first match wins — ids are unique).
 */
function findEntrySection(
  profile: CareerProfile,
  entryId: string,
): { section: string; entry: Record<string, unknown> } | null {
  const sections: Array<{ section: string; entries: unknown[] }> = [
    { section: "experience", entries: profile.experience as unknown[] },
    { section: "education", entries: profile.education as unknown[] },
    { section: "skills", entries: profile.skills as unknown[] },
    { section: "certifications", entries: profile.certifications as unknown[] },
    { section: "languages", entries: profile.languages as unknown[] },
    { section: "projects", entries: profile.projects as unknown[] },
    { section: "achievements", entries: profile.achievements as unknown[] },
    { section: "volunteer", entries: profile.volunteer as unknown[] },
    { section: "references", entries: profile.references as unknown[] },
  ];
  for (const { section, entries } of sections) {
    for (const e of entries) {
      const rec = e as Record<string, unknown>;
      if (String(rec.id ?? "") === entryId) return { section, entry: rec };
    }
  }
  return null;
}

/** Resolve one factMeta key to a display item (null when the key is unknown). */
function describeKey(profile: CareerProfile, key: string, meta: FactMeta): PendingConfirmation | null {
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  if (key === "summary") {
    return {
      key, section: "summary", field: "summary",
      label: { en: "Professional summary", sw: "Muhtasari wa taaluma" },
      value: s(profile.summary), source: meta.source ?? "", updatedAt: meta.updatedAt,
    };
  }
  if (key.startsWith("personal.")) {
    const field = key.slice("personal.".length);
    const value = s((profile.personal as unknown as Record<string, unknown>)[field]);
    if (!value) return null;
    return {
      key, section: "personal", field,
      label: { en: `Personal detail — ${field}`, sw: `Taarifa binafsi — ${field}` },
      value, source: meta.source ?? "", updatedAt: meta.updatedAt,
    };
  }
  if (key === "preferences") {
    const prefs = profile.preferences;
    const bits = [
      prefs.targetRoles?.length ? `roles: ${prefs.targetRoles.join(", ")}` : "",
      prefs.preferredLocations?.length ? `locations: ${prefs.preferredLocations.join(", ")}` : "",
      prefs.remotePreference ? `remote: ${prefs.remotePreference}` : "",
    ].filter(Boolean);
    return {
      key, section: "preferences", field: "preferences",
      label: { en: "Job preferences", sw: "Mapendeleo ya kazi" },
      value: bits.join(" · "), source: meta.source ?? "", updatedAt: meta.updatedAt,
    };
  }
  if (key.endsWith(".description")) {
    const entryId = key.slice(0, -".description".length);
    const found = findEntrySection(profile, entryId);
    if (!found || found.section !== "experience") return null;
    const value = s(found.entry.description);
    if (!value) return null;
    const t = sectionTitle("experience");
    return {
      key, section: "experience", entryId, field: "description",
      label: {
        en: `Description — ${entryTitle("experience", found.entry)}`,
        sw: `Maelezo — ${entryTitle("experience", found.entry)}`,
      },
      value, source: meta.source ?? "", updatedAt: meta.updatedAt,
    };
  }
  // A whole entry stamped needs-confirmation.
  const found = findEntrySection(profile, key);
  if (found) {
    const t = sectionTitle(found.section);
    const et = entryTitle(found.section, found.entry);
    return {
      key, section: found.section, entryId: key, field: "entry",
      label: { en: `${t.en} — ${et}`, sw: `${t.sw} — ${et}` },
      value: et, source: meta.source ?? "", updatedAt: meta.updatedAt,
    };
  }
  return null;
}

/**
 * All facts currently awaiting the user's confirmation, in a stable order:
 * summary first, then experience prose, then anything else (key order).
 */
export function listPendingConfirmations(profile: CareerProfile | null | undefined): PendingConfirmation[] {
  if (!profile) return [];
  const factMeta = profile.factMeta ?? {};
  const items: PendingConfirmation[] = [];
  for (const [key, meta] of Object.entries(factMeta)) {
    if (!meta || meta.status !== "needs-confirmation") continue;
    const item = describeKey(profile, key, meta);
    if (item) items.push(item);
  }
  const rank = (k: string) => (k === "summary" ? 0 : k.endsWith(".description") ? 1 : 2);
  return items.sort((a, b) => rank(a.key) - rank(b.key) || a.key.localeCompare(b.key));
}

/** Clear the underlying value of a rejected fact (blank prose, drop a rejected entry). */
function clearValue(profile: CareerProfile, key: string): void {
  if (key === "summary") {
    profile.summary = "";
    return;
  }
  if (key.startsWith("personal.")) {
    const field = key.slice("personal.".length);
    (profile.personal as unknown as Record<string, unknown>)[field] = "";
    return;
  }
  if (key === "preferences") {
    profile.preferences = createEmptyCareerProfile().preferences;
    return;
  }
  if (key.endsWith(".description")) {
    const entryId = key.slice(0, -".description".length);
    const found = findEntrySection(profile, entryId);
    if (found && found.section === "experience") {
      found.entry.description = "";
    }
    return;
  }
  // Whole entry — remove it from its section (the fact was drafted, not real).
  const found = findEntrySection(profile, key);
  if (!found) return;
  const section = found.section as keyof CareerProfile;
  const arr = profile[section] as unknown as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(arr)) {
    (profile as unknown as Record<string, unknown>)[section] = arr.filter((e) => String(e.id ?? "") !== key);
  }
}

/**
 * Resolve pending confirmations in one call.
 * - "accept" → each key is stamped user-edited + confirmed (source user-edited,
 *   confidence 1) so no derived fact can ever silently overwrite it again.
 * - "reject" → the factMeta entry is dropped AND the underlying value removed
 *   (AI prose is deleted, not kept as confirmed).
 * Unknown keys are ignored. Returns the updated profile (new object — input
 * is never mutated).
 */
export function resolveConfirmations(
  profile: CareerProfile | null | undefined,
  keys: string[],
  decision: ConfirmationDecision,
): CareerProfile {
  const base = profile && Object.keys(profile).length ? profile : createEmptyCareerProfile();
  const out: CareerProfile = JSON.parse(JSON.stringify(base)) as CareerProfile;
  const factMeta: Record<string, FactMeta> = { ...(out.factMeta ?? {}) };
  const now = new Date().toISOString();
  // ONLY keys that are ACTUALLY pending (needs-confirmation) may be resolved.
  // Without this intersection a caller could stamp ANY key as user-confirmed
  // (accept → invented provenance) or delete ANY value (reject → data loss) —
  // the trust loop must never touch a fact the user wasn't asked about.
  const pendingKeys = new Set(listPendingConfirmations(base).map((p) => p.key));
  const wanted = new Set(keys.filter((k) => typeof k === "string" && pendingKeys.has(k)));

  for (const key of wanted) {
    if (decision === "accept") {
      factMeta[key] = stampMeta(factMeta[key], {
        source: "user-edited", confidence: 1, status: "confirmed", now,
      });
    } else {
      delete factMeta[key];
      clearValue(out, key);
    }
  }
  return { ...out, factMeta };
}

/**
 * True when a profile still carries facts awaiting confirmation — used by
 * surfaces to decide whether to show the confirmation prompt at all.
 */
export function hasPendingConfirmations(profile: CareerProfile | null | undefined): boolean {
  return listPendingConfirmations(profile).length > 0;
}
