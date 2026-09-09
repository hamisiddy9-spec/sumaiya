/**
 * Safe first-name extraction for Sumaiya's greeting.
 *
 * P0: a user on a Hisense Smart-TV browser (or any device browser) can end up
 * with the DEVICE name in Supabase `user_metadata.name` — Sumaiya would then
 * greet them as "Hisense" every time. Same class of bug: email prefixes that
 * are actually device ids ("hisense-abc@...", "androidtv@..."), metadata
 * holding brand strings, gibberish sign-up names.
 *
 * The greeting name must come from the CAREER PROFILE (the real fact store)
 * first; auth metadata is only a fallback and only when it looks like a real
 * person name (letters, reasonable length, not a known device/brand token).
 */

// Device/brand tokens that commonly appear as auth metadata "name" on
// smart-TV / embedded browsers. Lowercase, no spaces — matched on word boundary
// after normalization.
const DEVICE_NAME_TOKENS = new Set([
  "hisense", "samsung", "lg", "sony", "tizen", "webos", "android", "androidtv",
  "androidtv2", "androidtv3", "smarttv", "smart", "bravia", "roku", "firetv",
  "firetvstick", "chromecast", "googletv", "google", "vidaa", "vidaaos",
  "tcl", "xiaomi", "miotv", "philips", "panasonic", "toshiba", "sharp",
  "skyworth", "haier", "anker", "nvidia", "shield", "mi-tv", "appletv", "tv",
  "device", "unknown", "guest", "user", "browser", "default", "anonymous",
  "null", "undefined", "na",
]);

// Characters that a real human name almost never contains.
const NAME_JUNK = /[\d_@#!$%^&*()+={}\[\]|\\:;"'<>,.?/~`]/;

/** Normalize a candidate name for token matching. */
export function normalizeNameToken(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z]+/g, " ").trim();
}

/** Is this a known device/brand token (or obviously not a person name)? */
export function isDeviceLikeName(s: string): boolean {
  const norm = normalizeNameToken(s);
  if (!norm) return true; // empty = not a usable name
  if (NAME_JUNK.test(s)) return true;
  const words = norm.split(/\s+/);
  if (words.length > 4) return true; // metadata blobs, not names
  if (words.some((w) => DEVICE_NAME_TOKENS.has(w))) return true;
  // A plausible human first name is 2–20 letters and mostly alphabetic.
  if (norm.length < 2 || norm.length > 24) return true;
  return false;
}

/**
 * Extract a safe first name for greetings.
 * Order: career profile fullName → auth metadata name → email prefix.
 * Any candidate that looks device-like/gibberish is skipped (empty string).
 */
export function safeFirstName(
  profileFullName?: string | null,
  metadataName?: string | null,
  email?: string | null,
): string {
  const candidates = [profileFullName, metadataName];
  if (email && email.includes("@")) {
    candidates.push(email.split("@")[0]);
  }
  for (const raw of candidates) {
    if (!raw || typeof raw !== "string") continue;
    const first = raw.trim().split(/\s+/)[0] ?? "";
    if (!first) continue;
    if (isDeviceLikeName(first)) continue;
    return first;
  }
  return "";
}
