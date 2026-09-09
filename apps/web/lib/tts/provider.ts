// TTS provider abstraction — the seam between speech consumers (interview,
// future voice features) and actual speech engines. Today the working default
// is the browser's speechSynthesis (zero API keys, works offline-ish); the
// cloud provider (P4) is a key-gated neural upgrade that falls back seamlessly.

import { CloudTtsProvider } from "@/lib/tts/cloud-provider";

export interface TtsSpeakHandlers {
  onstart?: () => void;
  onend?: () => void;
  onerror?: (_err?: unknown) => void;
}

export interface TtsProvider {
  /** Whether this provider can speak in this environment. */
  readonly supported: boolean;
  speak(_text: string, _handlers?: TtsSpeakHandlers): void;
  cancel(): void;
  pause(): void;
  resume(): void;
}

export interface TtsProviderConfig {
  lang?: string;
  /** Speech rate, 0.1–10 (default 1). */
  rate?: number;
}

/** Browser speechSynthesis provider — the zero-key default. */
export class BrowserTtsProvider implements TtsProvider {
  private lang: string;
  private rate: number;

  constructor(config: TtsProviderConfig = {}) {
    this.lang = config.lang ?? "en-US";
    this.rate = config.rate ?? 1;
  }

  get supported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  speak(text: string, handlers: TtsSpeakHandlers = {}): void {
    if (!this.supported) {
      handlers.onerror?.(new Error("speechSynthesis not supported"));
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.lang;
    utterance.rate = this.rate;
    // Prefer a voice that matches the language when voices are already loaded.
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang?.toLowerCase().startsWith(this.lang.toLowerCase().slice(0, 2)));
    if (match) utterance.voice = match;
    utterance.onstart = handlers.onstart ?? null;
    utterance.onend = handlers.onend ?? null;
    utterance.onerror = (e) => handlers.onerror?.(e);
    window.speechSynthesis.speak(utterance);
  }

  cancel(): void {
    if (this.supported) window.speechSynthesis.cancel();
  }

  pause(): void {
    if (this.supported) window.speechSynthesis.pause();
  }

  resume(): void {
    if (this.supported) window.speechSynthesis.resume();
  }
}

/** A provider that reports itself unavailable — the callers hide their "Listen"
 *  button on `supported === false`, so this cleanly disables TTS for a language
 *  the environment can't actually speak. */
export class NullTtsProvider implements TtsProvider {
  readonly supported = false;
  speak(_text: string, handlers: TtsSpeakHandlers = {}): void {
    handlers.onerror?.(new Error("TTS unavailable for this language"));
  }
  cancel(): void {}
  pause(): void {}
  resume(): void {}
}

/** Does the browser ship a speechSynthesis voice for this 2-letter language?
 *  `getVoices()` is async on first call in Chrome — an empty list here means
 *  "not yet / none", and we'd rather hide the button than read the text in the
 *  wrong accent. */
function browserHasVoiceFor(lang2: string): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  try {
    return window.speechSynthesis
      .getVoices()
      .some((v) => v.lang?.toLowerCase().startsWith(lang2));
  } catch {
    return false;
  }
}

/** Factory — future providers register here (e.g. "cloud" → neural TTS). */
export function createTtsProvider(name: string, config: TtsProviderConfig = {}): TtsProvider {
  switch (name) {
    case "cloud":
      return new CloudTtsProvider(config);
    case "auto": {
      // Cloud neural when enabled — it handles every language (incl. Swahili).
      const cloud = new CloudTtsProvider(config);
      if (cloud.supported) return cloud;
      // Otherwise the zero-key browser voice — BUT only for a language the
      // platform actually has a voice for. In practice devices ship an English
      // voice and nothing for Swahili; an English voice reading Swahili is
      // worse than no audio, so disable TTS there rather than fake it.
      const lang2 = (config.lang ?? "en").slice(0, 2).toLowerCase();
      if (lang2 === "en" || browserHasVoiceFor(lang2)) return new BrowserTtsProvider(config);
      return new NullTtsProvider();
    }
    default:
      return new BrowserTtsProvider(config);
  }
}
