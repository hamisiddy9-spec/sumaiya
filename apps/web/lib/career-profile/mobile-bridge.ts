/**
 * Bridge between the native app's flat Career Profile (one free-text field per
 * section, AsyncStorage) and the web's structured `CareerProfile` (the Spine's
 * fact store). The native app never sees the structured shape — it PUTs/GETs
 * this flat shape at /api/mobile/profile and the route maps here.
 *
 * The mapping is deliberately lossy: native's first-run wizard captures a
 * headline, a skills list and a couple of free-text paragraphs, not dated
 * entries. We keep every character (nothing is dropped), we just don't invent
 * structure that isn't there — a web edit later can flesh it out.
 */
import { nanoid } from "nanoid";
import { createEmptyCareerProfile, type CareerProfile } from "@/types";

/** The exact contract the native `profile-store.ts` speaks. */
export interface NativeProfile {
  fullName: string;
  headline: string;
  location: string;
  phone: string;
  email: string;
  summary: string;
  skills: string; // comma / newline separated
  experience: string; // free text
  education: string; // free text
  goals: string;
  languages: string; // comma / newline separated
  /** Compressed data URL of the headshot (set in Wasifu), or "" when unset. */
  photo?: string;
  updatedAt: number; // ms epoch — native's clock
}

export const EMPTY_NATIVE_PROFILE: NativeProfile = {
  fullName: "", headline: "", location: "", phone: "", email: "",
  summary: "", skills: "", experience: "", education: "", goals: "",
  languages: "", updatedAt: 0,
};

// native joins list-ish fields with commas / newlines; `headline` uses " · ".
const splitList = (s: string): string[] =>
  s.split(/\s*[,\n;·|]\s*/).map((x) => x.trim()).filter(Boolean);

export function nativeProfileToCareer(n: NativeProfile): CareerProfile {
  const cp = createEmptyCareerProfile();

  cp.personal.fullName = n.fullName?.trim() ?? "";
  // Set once in the app, visible on every CV: the same compressed data URL.
  if (n.photo?.trim()) cp.personal.photo = n.photo.trim();
  cp.personal.email = n.email?.trim() ?? "";
  cp.personal.phone = n.phone?.trim() ?? "";
  cp.personal.location = n.location?.trim() ?? "";
  // `headline` holds field labels ("Finance & Accounting · Sales"), not a job
  // title — it belongs in target roles, not personal.jobTitle.
  cp.personal.jobTitle = "";

  cp.summary = n.summary?.trim() ?? "";

  cp.skills = splitList(n.skills).map((name) => ({ id: nanoid(8), name, level: 3 as const }));

  cp.languages = splitList(n.languages).map((name) => ({
    id: nanoid(8),
    name,
    proficiency: "Intermediate" as const,
  }));

  const exp = n.experience?.trim();
  if (exp) {
    cp.experience = [
      { id: nanoid(8), company: "", position: "", startDate: "", endDate: "", current: false, description: exp },
    ];
  }

  const edu = n.education?.trim();
  if (edu) {
    cp.education = [
      { id: nanoid(8), institution: "", degree: "", field: "", startDate: "", endDate: "", description: edu },
    ];
  }

  cp.preferences.targetRoles = Array.from(new Set(splitList(n.headline))).slice(0, 6);
  if (n.location?.trim()) cp.preferences.preferredLocations = [n.location.trim()];
  // Kept as its own field (not folded into targetRoles) so it round-trips
  // back via careerToNativeProfile below instead of being permanently lost —
  // it used to disappear from the native "Malengo ya kazi" field the moment
  // the profile round-tripped through the server (e.g. on reconnect sync).
  if (n.goals?.trim()) cp.preferences.careerGoals = n.goals.trim();

  return cp;
}

/** Render one free-text paragraph from possibly-structured entries. */
function experienceText(cp: CareerProfile): string {
  return (cp.experience ?? [])
    .map((e) => {
      const head = [e.position, e.company].filter(Boolean).join(" @ ");
      const dates = [e.startDate, e.current ? "present" : e.endDate].filter(Boolean).join(" – ");
      const line = [head, dates && `(${dates})`].filter(Boolean).join(" ");
      return [line, e.description].filter(Boolean).join("\n").trim();
    })
    .filter(Boolean)
    .join("\n\n");
}

function educationText(cp: CareerProfile): string {
  return (cp.education ?? [])
    .map((e) => {
      const head = [e.degree, e.field, e.institution].filter(Boolean).join(", ");
      const dates = [e.startDate, e.endDate].filter(Boolean).join(" – ");
      const line = [head, dates && `(${dates})`].filter(Boolean).join(" ");
      return [line, e.description].filter(Boolean).join("\n").trim();
    })
    .filter(Boolean)
    .join("\n\n");
}

export function careerToNativeProfile(cp: CareerProfile, updatedAt: number): NativeProfile {
  return {
    fullName: cp.personal?.fullName ?? "",
    photo: cp.personal?.photo ?? "",
    headline: (cp.preferences?.targetRoles ?? []).join(" · ") || (cp.personal?.jobTitle ?? ""),
    location: cp.personal?.location ?? "",
    phone: cp.personal?.phone ?? "",
    email: cp.personal?.email ?? "",
    summary: cp.summary ?? "",
    skills: (cp.skills ?? []).map((s) => s.name).filter(Boolean).join(", "),
    experience: experienceText(cp),
    education: educationText(cp),
    languages: (cp.languages ?? []).map((l) => l.name).filter(Boolean).join(", "),
    goals: cp.preferences?.careerGoals ?? "",
    updatedAt,
  };
}
