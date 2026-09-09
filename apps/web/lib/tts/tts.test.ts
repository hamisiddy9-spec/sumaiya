import { describe, it, expect } from "vitest";
import { chunkText } from "@/lib/tts/chunk";
import { SpeechQueue } from "@/lib/tts/queue";
import type { TtsProvider, TtsSpeakHandlers } from "@/lib/tts/provider";

// ─── chunkText ───────────────────────────────────────────────────────────────

describe("chunkText", () => {
  it("splits on sentence boundaries", () => {
    // Small maxLen forces sentence-boundary splitting; short sentences batch
    // into one chunk under the default 200-char cap (fewer utterance gaps).
    const chunks = chunkText("First sentence. Second sentence! Third?", { maxLen: 20 });
    expect(chunks).toEqual(["First sentence.", "Second sentence!", "Third?"]);
  });

  it("keeps chunks under the max length", () => {
    const text = Array.from({ length: 60 }, (_, i) => `word${i}`).join(" ");
    const chunks = chunkText(text, { maxLen: 40 });
    expect(chunks.every((c) => c.length <= 40)).toBe(true);
    expect(chunks.join(" ").split(/\s+/)).toEqual(text.split(/\s+/));
  });

  it("never splits mid-word", () => {
    const text = Array.from({ length: 100 }, (_, i) => `word${i}`).join(" ");
    const chunks = chunkText(text, { maxLen: 50 });
    for (const c of chunks) {
      expect(c.startsWith(" ")).toBe(false);
      expect(c.endsWith(" ")).toBe(false);
    }
    // Reassembling preserves all words in order.
    expect(chunks.join(" ").split(/\s+/)).toEqual(text.split(/\s+/));
  });

  it("collapses whitespace and handles empty input", () => {
    expect(chunkText("  a   b  ")).toEqual(["a b"]);
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   ")).toEqual([]);
  });

  it("keeps punctuation attached to its sentence", () => {
    const chunks = chunkText("Hello, world. How are you today?", { maxLen: 20 });
    expect(chunks[0]).toBe("Hello, world.");
    expect(chunks[1]).toBe("How are you today?");
  });
});

// ─── SpeechQueue ─────────────────────────────────────────────────────────────

/** Fake provider: records utterances, lets tests fire lifecycle events. */
class FakeProvider implements TtsProvider {
  supported = true;
  spoken: string[] = [];
  handlers: TtsSpeakHandlers | null = null;
  cancelled = 0;
  paused = 0;
  resumed = 0;

  speak(text: string, handlers: TtsSpeakHandlers = {}): void {
    this.spoken.push(text);
    this.handlers = handlers;
  }
  cancel(): void { this.cancelled += 1; }
  pause(): void { this.paused += 1; }
  resume(): void { this.resumed += 1; }
}

function finish(provider: FakeProvider) {
  provider.handlers?.onend?.();
}

describe("SpeechQueue", () => {
  it("chunks long text and speaks chunks sequentially", () => {
    const provider = new FakeProvider();
    const queue = new SpeechQueue(provider, { maxChunkLen: 20 });
    queue.enqueue("one two three four five");
    expect(provider.spoken[0]).toBe("one two three four");
    finish(provider);
    expect(provider.spoken[1]).toBe("five");
  });

  it("queues multiple enqueues in order", () => {
    const provider = new FakeProvider();
    const queue = new SpeechQueue(provider);
    queue.enqueue("Hello there.");
    queue.enqueue("How are you?");
    expect(provider.spoken).toEqual(["Hello there."]);
    finish(provider);
    expect(provider.spoken).toEqual(["Hello there.", "How are you?"]);
  });

  it("cancel clears pending items and stops speech", () => {
    const provider = new FakeProvider();
    const queue = new SpeechQueue(provider);
    queue.enqueue("one");
    queue.enqueue("two");
    expect(queue.state.queued).toBe(1);
    queue.cancel();
    expect(queue.state).toMatchObject({ speaking: false, paused: false, queued: 0 });
    expect(provider.cancelled).toBe(1);
  });

  it("pause/resume suspend and continue the current utterance", () => {
    const provider = new FakeProvider();
    const queue = new SpeechQueue(provider);
    queue.enqueue("hello");
    queue.pause();
    expect(queue.state.paused).toBe(true);
    expect(provider.paused).toBe(1);
    queue.resume();
    expect(queue.state.paused).toBe(false);
    expect(provider.resumed).toBe(1);
  });

  it("survives a provider error by skipping the failed chunk", () => {
    const provider = new FakeProvider();
    const queue = new SpeechQueue(provider);
    queue.enqueue("first");
    queue.enqueue("second");
    provider.handlers?.onerror?.(new Error("boom"));
    expect(provider.spoken).toEqual(["first", "second"]);
  });

  it("reports state changes through onchange", () => {
    const provider = new FakeProvider();
    const queue = new SpeechQueue(provider);
    const states: Array<{ speaking: boolean; queued: number }> = [];
    queue.onchange = (s) => states.push({ speaking: s.speaking, queued: s.queued });
    queue.enqueue("a b c d e f");
    // One chunk → moved to current utterance, nothing left queued.
    expect(states.at(-1)).toEqual({ speaking: true, queued: 0 });
    finish(provider);
    expect(states.at(-1)).toEqual({ speaking: false, queued: 0 });
  });
});
