/**
 * Profile Mappers — pure functions that merge a user's shared profile
 * into every new document's initial data at creation time.
 *
 * Each mapper only spreads truthy fields so a blank profile never
 * overwrites a template default.
 */
import type { UserProfile } from "@/lib/db/schema";
import { createEmptyCVData, type CVData, type BusinessCardData, type LetterData } from "@/types";
import { profileToCvData } from "@/lib/career-profile/mapper";

// ─── CV ──────────────────────────────────────────────────────────────

export function seedCvData(prof: UserProfile | null | undefined): CVData {
  // Career Profile first — it's the source of truth. When the user has a
  // structured career profile, the new CV is derived from it wholesale
  // (experience, education, skills, certifications, languages, projects,
  // references + personal + summary). Only truthy/non-empty sections are
  // copied, so a partial profile never blanks a template default.
  if (prof?.careerProfile) {
    return profileToCvData(prof.careerProfile);
  }

  // Legacy path: no career profile yet — seed personal info + summary only
  // (unchanged behaviour for existing users).
  const empty = createEmptyCVData();
  if (!prof) return empty;

  return {
    ...empty,
    personal: {
      ...empty.personal,
      ...(prof.fullName && { fullName: prof.fullName }),
      ...(prof.jobTitle && { jobTitle: prof.jobTitle }),
      ...(prof.email && { email: prof.email }),
      ...(prof.phone && { phone: prof.phone }),
      ...(prof.location && { location: prof.location }),
      ...(prof.linkedin && { linkedin: prof.linkedin }),
      ...(prof.website && { website: prof.website }),
      ...(prof.photo && { photo: prof.photo }),
    },
    ...(prof.summary && { summary: prof.summary }),
  };
}

// ─── Business Card ───────────────────────────────────────────────────

export function seedBusinessCardData(prof: UserProfile | null | undefined): BusinessCardData {
  const empty = { name: "", title: "", company: "", email: "", phone: "" };
  if (!prof) return empty;

  return {
    ...empty,
    ...(prof.fullName && { name: prof.fullName }),
    ...(prof.jobTitle && { title: prof.jobTitle }),
    ...(prof.email && { email: prof.email }),
    ...(prof.phone && { phone: prof.phone }),
    ...(prof.website && { website: prof.website }),
    ...(prof.location && { address: prof.location }),
    // Note: profile.summary is intentionally NOT mapped to the card tagline —
    // a professional summary is far too long for a business-card tagline.
  };
}

// ─── Letter ──────────────────────────────────────────────────────────

export function seedLetterSender(prof: UserProfile | null | undefined): Pick<LetterData, "from"> {
  const empty = { name: "", title: "", company: "", address: "", email: "", phone: "" };
  if (!prof) return { from: empty };

  return {
    from: {
      ...empty,
      ...(prof.fullName && { name: prof.fullName }),
      ...(prof.jobTitle && { title: prof.jobTitle }),
      ...(prof.email && { email: prof.email }),
      ...(prof.phone && { phone: prof.phone }),
      ...(prof.location && { address: prof.location }),
    },
  };
}
