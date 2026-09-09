/**
 * Mic (voice-input) error mapping (P5) — pure + deterministic so the friendly
 * inline states are unit-tested. The Web Speech API reports error codes; we
 * map them to warm, actionable SW/EN copy instead of a silent no-op.
 */
export type MicErrorTone = "denied" | "no-speech" | "generic";

const DENIED_CODES = new Set(["not-allowed", "service-not-allowed", "permission-denied"]);
const NO_SPEECH_CODES = new Set(["no-speech"]);

/** Classify a SpeechRecognition error code, or null when there is none. */
export function micErrorKey(error?: string): MicErrorTone | null {
  if (!error) return null;
  if (DENIED_CODES.has(error)) return "denied";
  if (NO_SPEECH_CODES.has(error)) return "no-speech";
  return "generic";
}

export function micErrorMessage(error: string | undefined, sw: boolean): string | null {
  const key = micErrorKey(error);
  if (!key) return null;
  if (key === "denied") {
    return sw
      ? "Ufikiaji wa maikrofoni umezuiwa. Ruhusu kwenye mipangilio ya kivinjari, kisha jaribu tena."
      : "Microphone access is blocked. Allow it in your browser settings, then try again.";
  }
  if (key === "no-speech") {
    return sw
      ? "Sikusikia sauti — jaribu tena, au andika ujumbe wako."
      : "I didn't hear anything — try again, or type your message.";
  }
  return sw
    ? "Kuna tatizo la sauti. Jaribu tena, au andika ujumbe wako."
    : "Voice input hit a snag. Try again, or type your message.";
}
