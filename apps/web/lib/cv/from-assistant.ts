import { nanoid } from "nanoid";
import { createEmptyCVData, type CVData } from "@/types";

// Deterministic fallback for the conversational CV Assistant. The assistant
// already collects clean, labelled fields (name, jobTitle, contact, location,
// experience, education, skills), so if the AI structuring step is unavailable
// (no provider / quota / timeout) we can still build a usable, pre-filled CV
// from those answers instead of discarding everything the user typed.
//
// It won't split freeform experience into company/dates the way the AI does —
// each line becomes one entry the user can tidy in the editor — but that is a
// far better on-ramp than a blank CV or re-typing.

export interface AssistantAnswers {
  name?: string;
  jobTitle?: string;
  contact?: string;
  location?: string;
  experience?: string;
  education?: string;
  skills?: string;
}

/** Pull an email and a phone out of the free-form "contact" answer. */
function splitContact(raw: string): { email: string; phone: string } {
  const tokens = raw.split(/[\s,;·|]+/).map((t) => t.trim()).filter(Boolean);
  const email = tokens.find((t) => t.includes("@")) ?? "";
  const phone = tokens
    .filter((t) => t !== email && /\d/.test(t))
    .join(" ")
    .trim();
  return { email, phone };
}

/** Split a multi-line answer into trimmed, non-empty lines. */
function lines(raw: string): string[] {
  return raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

/** A "none"/"sina" style answer means the user has nothing for this section. */
function isNone(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return v === "" || v === "none" || v === "n/a" || v === "sina" || v === "hakuna";
}

export function cvFromAssistantAnswers(a: AssistantAnswers): CVData {
  const empty = createEmptyCVData();
  const { email, phone } = splitContact(a.contact ?? "");

  const experienceRaw = a.experience ?? "";
  const educationRaw = a.education ?? "";

  return {
    ...empty,
    personal: {
      ...empty.personal,
      fullName: (a.name ?? "").trim(),
      jobTitle: (a.jobTitle ?? "").trim(),
      email,
      phone,
      location: (a.location ?? "").trim(),
    },
    // Each experience line the user gave becomes one entry; company/position/
    // dates are left blank for them to fill, with their words kept as the
    // description so nothing is lost.
    experience: isNone(experienceRaw)
      ? []
      : lines(experienceRaw).slice(0, 12).map((line) => ({
          id: nanoid(),
          company: "",
          position: "",
          location: "",
          startDate: "",
          endDate: "",
          current: false,
          description: line,
        })),
    education: isNone(educationRaw)
      ? []
      : lines(educationRaw).slice(0, 8).map((line) => ({
          id: nanoid(),
          institution: line,
          degree: "",
          field: "",
          startDate: "",
          endDate: "",
        })),
    // Skills come comma- or newline-separated.
    skills: (a.skills ?? "")
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 24)
      .map((name) => ({ id: nanoid(), name, level: 3 as const })),
  };
}
