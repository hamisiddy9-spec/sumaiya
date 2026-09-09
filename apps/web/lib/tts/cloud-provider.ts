// Cloud neural TTS provider (P4) — the same TtsProvider seam the browser
// provider uses, but backed by the server-side cloud route (/api/tts, key stays
// server-side). Env-gated and self-healing:
//   - flag off / no API at all       → supported=false (callers see browser)
//   - flag on, server has no key     → /api/tts returns 501 → seamless
//     per-call fallback to the browser provider (never a silent dead button)
//   - flag on, key present           → neural voice, audio played via <Audio>
// The SpeechQueue chunks long text at 200 chars, so each speak() is one short
// MP3 — no need for MediaSource progressive playback.

import type { TtsProvider, TtsProviderConfig, TtsSpeakHandlers } from "@/lib/tts/provider";
import { BrowserTtsProvider } from "@/lib/tts/provider";
import { clampTtsRate, ttsCloudEnabled } from "@/lib/tts/cloud-config";

export class CloudTtsProvider implements TtsProvider {
  private lang: string;
  private rate: number;
  private fallback: TtsProvider;
  private audio: HTMLAudioElement | null = null;
  private objectUrl: string | null = null;
  private onstart: (() => void) | null = null;
  private onend: (() => void) | null = null;
  private onerror: ((_err?: unknown) => void) | null = null;

  constructor(config: TtsProviderConfig = {}, fallback?: TtsProvider) {
    this.lang = config.lang ?? "en-US";
    this.rate = clampTtsRate(config.rate ?? 1);
    this.fallback = fallback ?? new BrowserTtsProvider(config);
  }

  get supported(): boolean {
    return (
      ttsCloudEnabled() &&
      typeof window !== "undefined" &&
      typeof Audio !== "undefined"
    );
  }

  speak(text: string, handlers: TtsSpeakHandlers = {}): void {
    if (!this.supported) {
      handlers.onerror?.(new Error("cloud TTS not enabled"));
      return;
    }
    this.onstart = handlers.onstart ?? null;
    this.onend = handlers.onend ?? null;
    this.onerror = handlers.onerror ?? null;

    const params = new URLSearchParams({ text, lang: this.lang, rate: String(this.rate) });
    fetch(`/api/tts?${params.toString()}`, { headers: { Accept: "audio/mpeg" } })
      .then(async (res) => {
        if (!res.ok) {
          // 501 not-configured / 502 upstream / any error → browser voice.
          this.fallback.speak(text, {
            onstart: this.onstart ?? undefined,
            onend: this.onend ?? undefined,
            onerror: this.onerror ?? undefined,
          });
          return;
        }
        const blob = await res.blob();
        if (this.audio) this.cleanup();
        this.objectUrl = URL.createObjectURL(blob);
        const audio = new Audio(this.objectUrl);
        this.audio = audio;
        audio.playbackRate = this.rate;
        audio.onended = () => { this.onend?.(); this.cleanup(); };
        audio.onerror = () => { this.onerror?.(new Error("audio playback failed")); this.cleanup(); };
        await audio.play();
        this.onstart?.();
      })
      .catch(() => {
        // Network hiccup → browser voice for this chunk (queue keeps moving).
        this.fallback.speak(text, {
          onstart: this.onstart ?? undefined,
          onend: this.onend ?? undefined,
          onerror: this.onerror ?? undefined,
        });
      });
  }

  cancel(): void {
    this.cleanup();
  }

  pause(): void {
    this.audio?.pause();
  }

  resume(): void {
    if (this.audio) void this.audio.play();
  }

  private cleanup(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.onended = null;
      this.audio.onerror = null;
    }
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = null;
    this.audio = null;
  }
}
