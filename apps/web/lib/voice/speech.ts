"use client";

// A thin, typed wrapper over the browser's built-in speech APIs.
//
// SpeechRecognition (Chrome / most Android Chrome, Edge, Samsung Internet) does
// on-device-or-Google STT for free — no key, no cost — and supports Swahili
// (sw-TZ / sw-KE). SpeechSynthesis reads the question aloud. Both degrade:
// voiceInputSupported() is false on Firefox / older WebViews and the caller
// falls back to typing.

export interface SpeechResult {
  transcript: string;
  isFinal: boolean;
}

// Minimal ambient shape — lib.dom's SpeechRecognition types aren't guaranteed.
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionResultEventLike {
  resultIndex: number;
  results: ArrayLike<
    ArrayLike<{ transcript: string }> & { isFinal: boolean }
  >;
}

function RecognitionCtor(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function voiceInputSupported(): boolean {
  return RecognitionCtor() !== null;
}

export function voiceOutputSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

const BCP47: Record<"sw" | "en", string> = { sw: "sw-TZ", en: "en-KE" };

export interface Recognizer {
  start(): void;
  stop(): void;
  abort(): void;
}

/**
 * Start a one-utterance recognition session. `onResult` fires with interim then
 * final text; `onDone` fires once when recognition ends (naturally or via
 * stop()); `onError` fires with a code ("no-speech", "not-allowed", …).
 */
export function createRecognizer(
  lang: "sw" | "en",
  handlers: {
    onResult: (r: SpeechResult) => void;
    onDone: () => void;
    onError: (code: string) => void;
  },
): Recognizer | null {
  const Ctor = RecognitionCtor();
  if (!Ctor) return null;

  const rec = new Ctor();
  rec.lang = BCP47[lang];
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  rec.onresult = (e) => {
    let transcript = "";
    let isFinal = false;
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const alt = e.results[i][0];
      transcript += alt.transcript;
      if (e.results[i].isFinal) isFinal = true;
    }
    handlers.onResult({ transcript: transcript.trim(), isFinal });
  };
  rec.onerror = (e) => handlers.onError(e.error);
  rec.onend = () => handlers.onDone();

  return {
    start: () => {
      try {
        rec.start();
      } catch {
        /* already started */
      }
    },
    stop: () => rec.stop(),
    abort: () => rec.abort(),
  };
}

/** Speak a line. Best-effort — silently no-ops when unsupported. */
export function speak(text: string, lang: "sw" | "en"): void {
  if (!voiceOutputSupported()) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = BCP47[lang];
    u.rate = 0.98;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

export function stopSpeaking(): void {
  if (voiceOutputSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
}
