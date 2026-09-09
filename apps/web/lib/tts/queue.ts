// Speech queue — sequential, interruption-safe TTS playback.
//
// Long text is chunked (lib/tts/chunk) and spoken one chunk at a time so a
// single provider utterance never gets cut off. The queue owns the lifecycle:
//   - enqueue() appends and starts speaking if idle
//   - cancel() stops everything and clears the queue (unmount safety)
//   - pause()/resume() suspend/resume the current utterance
//   - an onchange listener reports { speaking, paused } so UI can react
//
// Deterministic and unit-testable: the provider is injected.

import { chunkText } from "@/lib/tts/chunk";
import type { TtsProvider } from "@/lib/tts/provider";

export interface SpeechQueueState {
  speaking: boolean;
  paused: boolean;
  queued: number;
}

export interface SpeechQueueOptions {
  /** Max chunk length in characters (default 200). */
  maxChunkLen?: number;
}

export class SpeechQueue {
  private provider: TtsProvider;
  private maxChunkLen: number;
  private items: string[] = [];
  private speaking = false;
  private paused = false;
  private current: string | null = null;
  onchange: ((_state: SpeechQueueState) => void) | null = null;

  constructor(provider: TtsProvider, opts: SpeechQueueOptions = {}) {
    this.provider = provider;
    this.maxChunkLen = opts.maxChunkLen ?? 200;
  }

  get supported(): boolean {
    return this.provider.supported;
  }

  get state(): SpeechQueueState {
    return { speaking: this.speaking, paused: this.paused, queued: this.items.length };
  }

  private emit(): void {
    this.onchange?.({ ...this.state });
  }

  /** Enqueue text to be spoken. Chunked internally; starts if idle. */
  enqueue(text: string): void {
    if (!text.trim()) return;
    const chunks = chunkText(text, { maxLen: this.maxChunkLen });
    if (!chunks.length) return;
    this.items.push(...chunks);
    if (!this.speaking && !this.paused) this.next();
    else this.emit();
  }

  /** Stop everything and clear the queue. Safe on unmount. */
  cancel(): void {
    this.provider.cancel();
    this.items = [];
    this.speaking = false;
    this.paused = false;
    this.current = null;
    this.emit();
  }

  pause(): void {
    if (!this.speaking || this.paused) return;
    this.paused = true;
    this.provider.pause();
    this.emit();
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.provider.resume();
    this.emit();
  }

  private next(): void {
    if (this.speaking || this.paused) return;
    const text = this.items.shift();
    if (!text) {
      this.speaking = false;
      this.current = null;
      this.emit();
      return;
    }
    this.speaking = true;
    this.current = text;
    this.emit();
    this.provider.speak(text, {
      onstart: () => this.emit(),
      onend: () => {
        this.speaking = false;
        this.current = null;
        this.next();
      },
      onerror: () => {
        // Skip the failed chunk and keep the queue moving.
        this.speaking = false;
        this.current = null;
        this.next();
      },
    });
  }
}
