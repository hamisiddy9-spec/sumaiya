/**
 * Career Profile — the user's facts, stored once, read everywhere.
 *
 * Local-only JSON blob (AsyncStorage). This is the "spine" the direction doc
 * describes: Sumaiya reads it so the user doesn't re-type their history every
 * conversation. When /api/mobile/profile ships this syncs; until then it's
 * device-local and injected into the chat context.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "career_profile_v1";

export interface CareerProfile {
  fullName: string;
  headline: string;
  location: string;
  phone: string;
  email: string;
  summary: string;
  /** comma / newline separated, kept as a single string for a light editor */
  skills: string;
  experience: string;
  education: string;
  goals: string;
  languages: string;
  updatedAt: number;
}

export const EMPTY_PROFILE: CareerProfile = {
  fullName: "", headline: "", location: "", phone: "", email: "",
  summary: "", skills: "", experience: "", education: "", goals: "", languages: "",
  updatedAt: 0,
};

export async function loadProfile(): Promise<CareerProfile> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return EMPTY_PROFILE;
    return { ...EMPTY_PROFILE, ...JSON.parse(raw) };
  } catch {
    return EMPTY_PROFILE;
  }
}

export async function saveProfile(p: Omit<CareerProfile, "updatedAt">): Promise<CareerProfile> {
  const next: CareerProfile = { ...p, updatedAt: Date.now() };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function profileIsEmpty(p: CareerProfile): boolean {
  return !p.fullName && !p.headline && !p.summary && !p.skills && !p.experience;
}

/** Compact block fed to Sumaiya so she knows the user without them re-typing. */
export function profilePromptBlock(p: CareerProfile): string {
  if (profileIsEmpty(p)) return "";
  const parts: string[] = [];
  if (p.fullName) parts.push(`Name: ${p.fullName}`);
  if (p.headline) parts.push(`Headline: ${p.headline}`);
  if (p.location) parts.push(`Location: ${p.location}`);
  if (p.summary) parts.push(`Summary: ${p.summary}`);
  if (p.skills) parts.push(`Skills: ${p.skills.replace(/\s*\n\s*/g, ", ")}`);
  if (p.experience) parts.push(`Experience:\n${p.experience}`);
  if (p.education) parts.push(`Education: ${p.education}`);
  if (p.languages) parts.push(`Languages: ${p.languages}`);
  if (p.goals) parts.push(`Career goals: ${p.goals}`);
  return `[The user's career profile — use it, don't ask them to repeat it:\n${parts.join("\n")}\n]`;
}
