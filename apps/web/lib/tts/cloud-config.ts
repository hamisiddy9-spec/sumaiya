/**
 * Cloud TTS configuration (P4) — pure, deterministic helpers for the cloud
 * neural provider seam. Env-gated: the CLIENT flag enables the attempt, the
 * SERVER key makes it actually work; no key → graceful browser fallback.
 */

/** ElevenLabs voice per language (fallback voice is the multilingual-safe one). */
export const TTS_CLOUD_VOICES: Record<string, string> = {
  en: "21m00Tcm4TlvDq8ikWAM", // Rachel — clear, warm EN
  sw: "21m00Tcm4TlvDq8ikWAM", // multilingual v2 handles sw; same default voice
};

export const TTS_CLOUD_MODEL = "eleven_multilingual_v2";

/** Pick the voice id for a language tag ("sw-TZ" → "sw", unknown → en). */
export function ttsVoiceForLang(lang: string): string {
  const key = lang.slice(0, 2).toLowerCase();
  return TTS_CLOUD_VOICES[key] ?? TTS_CLOUD_VOICES.en;
}

/** Clamp a user rate into the audio.playbackRate range (0.5–2). */
export function clampTtsRate(rate: number): number {
  if (!Number.isFinite(rate)) return 1;
  return Math.min(2, Math.max(0.5, rate));
}

/** Client-side flag: attempt the cloud provider at all. */
export function ttsCloudEnabled(): boolean {
  return typeof process !== "undefined" && process.env?.NEXT_PUBLIC_TTS_CLOUD === "1";
}

/** Server-side gate: the cloud provider is actually usable (key present). */
export function ttsCloudConfigured(): boolean {
  return typeof process !== "undefined" && !!process.env?.ELEVENLABS_API_KEY;
}
