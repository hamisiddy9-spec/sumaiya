import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CloudTtsProvider } from "./cloud-provider";
import { createTtsProvider, type TtsProvider } from "./provider";

// ─── test doubles ────────────────────────────────────────────────────────────

class FakeAudio {
  playbackRate = 1;
  src = "";
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play = vi.fn(async () => {});
  pause = vi.fn(() => {});
  static instances: FakeAudio[] = [];
  constructor(src?: string) {
    this.src = src ?? "";
    FakeAudio.instances.push(this);
  }
}

class FakeFallback implements TtsProvider {
  supported = true;
  speak = vi.fn();
  cancel = vi.fn();
  pause = vi.fn();
  resume = vi.fn();
}

const fakeUrl = "blob:fake-audio-url";

beforeEach(() => {
  FakeAudio.instances = [];
  // Browser-ish globals for the provider's supported check + playback.
  // Keep the real URL constructor (tests parse URLs); add createObjectURL.
  vi.stubGlobal("window", {});
  vi.stubGlobal("Audio", FakeAudio);
  vi.stubGlobal("URL", Object.assign(URL, {
    createObjectURL: vi.fn(() => fakeUrl),
    revokeObjectURL: vi.fn(),
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ─── supported ───────────────────────────────────────────────────────────────

describe("CloudTtsProvider.supported", () => {
  it("is false when the cloud flag is off (graceful off by default)", () => {
    vi.stubGlobal("process", { env: {} });
    const p = new CloudTtsProvider();
    expect(p.supported).toBe(false);
  });

  it("is false when Audio is unavailable (SSR / odd env)", () => {
    vi.stubGlobal("process", { env: { NEXT_PUBLIC_TTS_CLOUD: "1" } });
    vi.stubGlobal("Audio", undefined);
    const p = new CloudTtsProvider();
    expect(p.supported).toBe(false);
  });
});

// ─── speak success path ──────────────────────────────────────────────────────

describe("CloudTtsProvider.speak", () => {
  it("fetches the proxy route, plays the audio, fires start/end", async () => {
    vi.stubGlobal("process", { env: { NEXT_PUBLIC_TTS_CLOUD: "1" } });
    const fetchMock = vi.fn<(input: string) => Promise<Response>>(async () => new Response(new Blob(["mp3-bytes"]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const p = new CloudTtsProvider({ lang: "en-US", rate: 1.5 });
    const onstart = vi.fn();
    const onend = vi.fn();
    p.speak("Hello world", { onstart, onend });

    // Allow the promise chain to settle.
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("/api/tts?");
    // Parse properly — URLSearchParams encodes spaces as "+".
    const params = new URL(url, "http://localhost").searchParams;
    expect(params.get("text")).toBe("Hello world");
    expect(params.get("lang")).toBe("en-US");
    expect(params.get("rate")).toBe("1.5");

    await vi.waitFor(() => expect(FakeAudio.instances.length).toBe(1));
    const audio = FakeAudio.instances[0];
    expect(audio.src).toBe(fakeUrl);
    expect(audio.playbackRate).toBe(1.5);
    await vi.waitFor(() => expect(onstart).toHaveBeenCalledTimes(1));

    audio.onended?.();
    expect(onend).toHaveBeenCalledTimes(1);
  });

  it("falls back to the browser provider on 501 (no server key)", async () => {
    vi.stubGlobal("process", { env: { NEXT_PUBLIC_TTS_CLOUD: "1" } });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 501 })));

    const fallback = new FakeFallback();
    const p = new CloudTtsProvider({ lang: "sw-TZ" }, fallback);
    const onstart = vi.fn();
    p.speak("Habari", { onstart });

    await vi.waitFor(() => expect(fallback.speak).toHaveBeenCalledTimes(1));
    expect(fallback.speak.mock.calls[0][0]).toBe("Habari");
    expect(fallback.speak.mock.calls[0][1]?.onstart).toBe(onstart);
    // No audio element was created.
    expect(FakeAudio.instances.length).toBe(0);
  });

  it("falls back to the browser provider on network failure", async () => {
    vi.stubGlobal("process", { env: { NEXT_PUBLIC_TTS_CLOUD: "1" } });
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("network down"); }));

    const fallback = new FakeFallback();
    const p = new CloudTtsProvider({}, fallback);
    p.speak("Hi");
    await vi.waitFor(() => expect(fallback.speak).toHaveBeenCalledTimes(1));
    expect(FakeAudio.instances.length).toBe(0);
  });

  it("reports an error when not supported instead of throwing", () => {
    vi.stubGlobal("process", { env: {} });
    const p = new CloudTtsProvider();
    const onerror = vi.fn();
    p.speak("x", { onerror });
    expect(onerror).toHaveBeenCalledTimes(1);
  });

  it("cancel stops the current audio and revokes the blob URL", async () => {
    vi.stubGlobal("process", { env: { NEXT_PUBLIC_TTS_CLOUD: "1" } });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Blob(["x"]), { status: 200 })));

    const p = new CloudTtsProvider();
    p.speak("Hello");
    await vi.waitFor(() => expect(FakeAudio.instances.length).toBe(1));
    const audio = FakeAudio.instances[0];

    p.cancel();
    expect(audio.pause).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(fakeUrl);
  });
});

// ─── factory ("auto" seam) ────────────────────────────────────────────────────

describe("createTtsProvider factory", () => {
  it('"auto" picks the browser provider when cloud is not enabled', () => {
    vi.stubGlobal("process", { env: {} });
    vi.stubGlobal("window", {});
    const p = createTtsProvider("auto");
    expect(p.constructor.name).toBe("BrowserTtsProvider");
  });

  it('"auto" picks the cloud provider when the client flag is on', () => {
    vi.stubGlobal("process", { env: { NEXT_PUBLIC_TTS_CLOUD: "1" } });
    vi.stubGlobal("window", {});
    vi.stubGlobal("Audio", FakeAudio);
    const p = createTtsProvider("auto");
    expect(p.constructor.name).toBe("CloudTtsProvider");
  });

  it('"cloud" always returns the cloud provider when flag + Audio exist', () => {
    vi.stubGlobal("process", { env: { NEXT_PUBLIC_TTS_CLOUD: "1" } });
    vi.stubGlobal("window", {});
    vi.stubGlobal("Audio", FakeAudio);
    const p = createTtsProvider("cloud");
    expect(p.constructor.name).toBe("CloudTtsProvider");
  });

  it('"auto" for Swahili with no cloud and no sw voice → NullTtsProvider (button hidden, not faked in English)', () => {
    vi.stubGlobal("process", { env: {} });
    vi.stubGlobal("window", {
      speechSynthesis: { getVoices: () => [{ lang: "en-US" }, { lang: "en-GB" }] },
    });
    const p = createTtsProvider("auto", { lang: "sw" });
    expect(p.constructor.name).toBe("NullTtsProvider");
    expect(p.supported).toBe(false);
  });

  it('"auto" for Swahili uses the browser provider when the platform DOES ship a sw voice', () => {
    vi.stubGlobal("process", { env: {} });
    vi.stubGlobal("window", {
      speechSynthesis: { getVoices: () => [{ lang: "sw-TZ" }, { lang: "en-US" }] },
    });
    const p = createTtsProvider("auto", { lang: "sw" });
    expect(p.constructor.name).toBe("BrowserTtsProvider");
  });

  it('"auto" for Swahili still uses cloud when the flag is on (cloud handles every language)', () => {
    vi.stubGlobal("process", { env: { NEXT_PUBLIC_TTS_CLOUD: "1" } });
    vi.stubGlobal("window", { speechSynthesis: { getVoices: () => [] } });
    vi.stubGlobal("Audio", FakeAudio);
    const p = createTtsProvider("auto", { lang: "sw" });
    expect(p.constructor.name).toBe("CloudTtsProvider");
  });
});
