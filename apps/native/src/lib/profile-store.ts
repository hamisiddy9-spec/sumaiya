/**
 * Career Profile — the user's facts, stored once, read everywhere.
 *
 * AsyncStorage is the fast local copy; the server Spine (/api/mobile/profile)
 * is the source of truth across devices and reinstalls, and what feeds job
 * matching + the web assistant. `saveProfile` writes locally and pushes;
 * `syncProfileFromServer` pulls on boot and when the local copy is empty.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "./api-client";

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
  void pushProfile(next);
  return next;
}

/** Best-effort push to the server Spine. Silent on failure (offline / signed
 *  out) — the local copy is already saved and the next successful save or a
 *  reconnect flush will carry it up. */
export async function pushProfile(p: CareerProfile): Promise<void> {
  try {
    await apiClient.putMobileProfile(p);
  } catch {
    /* offline / not signed in — nothing to do */
  }
}

/**
 * Pull the server's Career Profile and adopt it when it's ahead of (or the
 * local copy is missing) what's on the device. Called on app boot and right
 * before the first-run wizard so a returning user on a new device / after a
 * reinstall keeps their profile. Returns the effective local profile.
 */
export async function syncProfileFromServer(): Promise<CareerProfile> {
  const local = await loadProfile();
  let remote: CareerProfile | null = null;
  try {
    remote = (await apiClient.getMobileProfile()) as CareerProfile;
  } catch {
    return local; // offline / signed out — keep what we have
  }
  if (!remote || profileIsEmpty(remote)) return local;

  // Adopt the server copy when the device has nothing, or the server's is
  // newer. A local edit made offline (newer updatedAt) wins and will be pushed.
  const localEmpty = profileIsEmpty(local);
  if (localEmpty || (remote.updatedAt || 0) > (local.updatedAt || 0)) {
    await AsyncStorage.setItem(KEY, JSON.stringify(remote));
    return remote;
  }
  // Local is ahead — make sure the server has it.
  if ((local.updatedAt || 0) > (remote.updatedAt || 0)) void pushProfile(local);
  return local;
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
