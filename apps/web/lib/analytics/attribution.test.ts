import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ATTRIBUTION_STORAGE_KEY,
  MAX_CAMPAIGN_SOURCE_LENGTH,
  captureAttribution,
  getAttributionProps,
  getCampaignSource,
  initAttribution,
  readSrcFromSearch,
  resetAttribution,
  sanitizeCampaignSource,
} from "./attribution";

/**
 * Campaign attribution is the difference between "the poster sold nothing" and
 * "the poster brought 40 installs". It runs on every visit, on the worst devices
 * and in browsers with storage turned off, so the contract under test is:
 * a good tag survives later navigation and a signup, a bad tag is neutralised,
 * an absent tag is harmless, and NOTHING here ever throws.
 *
 * The vitest environment is `node` (see vitest.config.ts) — no jsdom here — so
 * the browser globals this module reads (`location`, `localStorage`) are
 * installed and torn down by hand below. That is deliberate: the same stubs
 * prove the module is safe when those globals are missing entirely (SSR) and
 * when they exist but throw (private mode).
 */

vi.mock("@vercel/analytics", () => ({ track: vi.fn() }));
import { track as vercelTrack } from "@vercel/analytics";
import { track } from "./index";

type StorageStub = {
  getItem: (_k: string) => string | null;
  setItem: (_k: string, _v: string) => void;
  removeItem: (_k: string) => void;
};

const globals = globalThis as unknown as Record<string, unknown>;

/** A localStorage lookalike that records what was written. */
function fakeStorage(seed: Record<string, string> = {}): StorageStub & {
  data: Map<string, string>;
} {
  const data = new Map<string, string>(Object.entries(seed));
  return {
    data,
    getItem: (k) => (data.has(k) ? (data.get(k) as string) : null),
    setItem: (k, v) => void data.set(k, String(v)),
    removeItem: (k) => void data.delete(k),
  };
}

function setGlobal(key: string, value: unknown): void {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
}

function setLocation(search: string): void {
  setGlobal("location", { search });
}

/** Storage that throws on *access* — the real private-mode / cookies-off case. */
function denyStorage(): void {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("SecurityError: storage is disabled");
    },
  });
}

beforeEach(() => {
  resetAttribution();
  setLocation("");
  delete globals.localStorage;
  delete globals.window;
});

afterEach(() => {
  resetAttribution();
  delete globals.localStorage;
  delete globals.location;
  delete globals.window;
});

describe("sanitizeCampaignSource", () => {
  it("keeps a normal campaign tag as-is", () => {
    expect(sanitizeCampaignSource("poster")).toBe("poster");
    expect(sanitizeCampaignSource("shop-kariakoo-3")).toBe("shop-kariakoo-3");
    expect(sanitizeCampaignSource("flyer_boda.v2")).toBe("flyer_boda.v2");
  });

  it("folds case so Poster and poster are one cohort", () => {
    expect(sanitizeCampaignSource("Poster")).toBe("poster");
    expect(sanitizeCampaignSource("POSTER")).toBe("poster");
  });

  it("returns null for a missing or empty tag", () => {
    expect(sanitizeCampaignSource(undefined)).toBeNull();
    expect(sanitizeCampaignSource(null)).toBeNull();
    expect(sanitizeCampaignSource("")).toBeNull();
    expect(sanitizeCampaignSource("   ")).toBeNull();
  });

  it("returns null for junk that leaves nothing usable", () => {
    expect(sanitizeCampaignSource("%%%")).toBeNull();
    expect(sanitizeCampaignSource("!!!")).toBeNull();
    expect(sanitizeCampaignSource("<>")).toBeNull();
    expect(sanitizeCampaignSource("====")).toBeNull();
    expect(sanitizeCampaignSource("✓")).toBeNull();
  });

  it("truncates an absurdly long tag instead of storing it", () => {
    const long = "a".repeat(5000);
    const out = sanitizeCampaignSource(long);
    expect(out).toHaveLength(MAX_CAMPAIGN_SOURCE_LENGTH);
    expect(out).toBe("a".repeat(MAX_CAMPAIGN_SOURCE_LENGTH));
  });

  it("trims the trailing separator truncation can expose", () => {
    // 63 usable chars + junk: the cut must not leave a trailing "-".
    const out = sanitizeCampaignSource(`${"b".repeat(63)} / ${"c".repeat(40)}`);
    expect(out).toBe("b".repeat(63));
    expect(out?.endsWith("-")).toBe(false);
  });

  it("neutralises an HTML / quote injection payload", () => {
    const payload = '"><script>alert(1)</script>';
    const out = sanitizeCampaignSource(payload);
    expect(out).toBe("script-alert-1-script");
    expect(out).not.toMatch(/[<>"'\s]/);
    expect(out).toMatch(/^[a-z0-9._-]+$/);
  });

  it("neutralises a payload that tries to break out with a quote and spaces", () => {
    const out = sanitizeCampaignSource(`" onmouseover="alert(1)" x`);
    expect(out).not.toMatch(/[<>"'=()\s]/);
    expect(out).toMatch(/^[a-z0-9._-]+$/);
  });
});

describe("readSrcFromSearch", () => {
  it("reads the tag out of a query string", () => {
    expect(readSrcFromSearch("?src=poster")).toBe("poster");
    expect(readSrcFromSearch("?utm_source=paper&src=poster&x=1")).toBe("poster");
  });

  it("accepts a bare query string with no leading ?", () => {
    expect(readSrcFromSearch("src=poster")).toBe("poster");
  });

  it("decodes percent-encoding the way the browser does", () => {
    expect(readSrcFromSearch("?src=shop%2Dkariakoo")).toBe("shop-kariakoo");
    expect(readSrcFromSearch("?src=poster+two")).toBe("poster-two");
  });

  it("is null when src is absent, empty or unusable", () => {
    expect(readSrcFromSearch("")).toBeNull();
    expect(readSrcFromSearch("?")).toBeNull();
    expect(readSrcFromSearch("?utm_source=poster")).toBeNull();
    expect(readSrcFromSearch("?src=")).toBeNull();
    expect(readSrcFromSearch("?src=%%%")).toBeNull();
  });

  it("takes the first tag when a URL carries several", () => {
    expect(readSrcFromSearch("?src=poster&src=flyer")).toBe("poster");
  });
});

describe("capture and persist", () => {
  it("captures a normal tag from the landing URL and persists it", () => {
    const store = fakeStorage();
    setGlobal("localStorage", store);
    setLocation("?src=poster");

    expect(initAttribution()).toBe("poster");
    expect(store.data.get(ATTRIBUTION_STORAGE_KEY)).toBe("poster");
    expect(getCampaignSource()).toBe("poster");
    expect(getAttributionProps()).toEqual({ src: "poster" });
  });

  it("reads a missing tag as null and writes nothing", () => {
    const store = fakeStorage();
    setGlobal("localStorage", store);
    setLocation("?utm_source=poster");

    expect(initAttribution()).toBeNull();
    expect(store.data.size).toBe(0);
    expect(getCampaignSource()).toBeNull();
    expect(getAttributionProps()).toEqual({ src: null });
  });

  it("stores a truncated slug for an absurdly long tag", () => {
    const store = fakeStorage();
    setGlobal("localStorage", store);
    setLocation(`?src=${"a".repeat(400)}`);

    const src = initAttribution();
    expect(src).toHaveLength(MAX_CAMPAIGN_SOURCE_LENGTH);
    expect(store.data.get(ATTRIBUTION_STORAGE_KEY)).toHaveLength(
      MAX_CAMPAIGN_SOURCE_LENGTH,
    );
  });

  it("stores a safe slug for an injection-looking tag", () => {
    const store = fakeStorage();
    setGlobal("localStorage", store);
    setLocation(`?src=${encodeURIComponent('"><img src=x onerror=alert(1)>')}`);

    const src = initAttribution();
    expect(src).toMatch(/^[a-z0-9._-]+$/);
    expect(store.data.get(ATTRIBUTION_STORAGE_KEY)).toBe(src);
  });

  it("keeps the first tag when a later page carries another one", () => {
    const store = fakeStorage();
    setGlobal("localStorage", store);
    setLocation("?src=poster");
    initAttribution();

    // Later navigation — a different poster, a shared link, anything.
    setLocation("?src=flyer-boda");
    expect(captureAttribution()).toBe("poster");
    expect(getCampaignSource()).toBe("poster");
    expect(store.data.get(ATTRIBUTION_STORAGE_KEY)).toBe("poster");
  });

  it("ignores a junk tag that arrives after a good one", () => {
    const store = fakeStorage();
    setGlobal("localStorage", store);
    setLocation("?src=poster");
    initAttribution();

    setLocation("?src=%1");
    expect(getCampaignSource()).toBe("poster");
  });

  it("re-sanitizes a tampered value already sitting in storage", () => {
    setGlobal(
      "localStorage",
      fakeStorage({ [ATTRIBUTION_STORAGE_KEY]: '<script>alert(1)</script>' }),
    );
    setLocation("");
    expect(getCampaignSource()).toBe("script-alert-1-script");
  });

  it("survives a reload: a fresh module instance reads the stored tag", async () => {
    const store = fakeStorage();
    setGlobal("localStorage", store);
    setLocation("?src=poster");
    expect(initAttribution()).toBe("poster");

    // New page load, no query string at all — the signup that follows the scan
    // must still be attributed to the poster.
    vi.resetModules();
    const fresh = await import("./attribution");
    setLocation("");
    expect(fresh.getCampaignSource()).toBe("poster");
    expect(fresh.getAttributionProps()).toEqual({ src: "poster" });
    // Don't leak the reloaded instance's in-memory state into later tests.
    fresh.resetAttribution();
  });

  it("is idempotent — mounting twice does not re-parse or double-write", () => {
    const store = fakeStorage();
    setGlobal("localStorage", store);
    setLocation("?src=poster");
    expect(initAttribution()).toBe("poster");
    expect(initAttribution()).toBe("poster");
    expect(store.data.size).toBe(1);
  });
});

describe("storage disabled (private mode / SSR)", () => {
  it("does not throw when localStorage access throws, and still attributes the session", () => {
    setLocation("?src=poster");
    denyStorage();

    expect(() => initAttribution()).not.toThrow();
    expect(initAttribution()).toBe("poster");
    expect(getCampaignSource()).toBe("poster");
    expect(getAttributionProps()).toEqual({ src: "poster" });
  });

  it("does not throw when writes throw but reads work", () => {
    setLocation("?src=poster");
    setGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {
        throw new Error("QuotaExceededError");
      },
    } satisfies StorageStub);

    expect(() => initAttribution()).not.toThrow();
    expect(getCampaignSource()).toBe("poster");
    expect(getAttributionProps()).toEqual({ src: "poster" });
  });

  it("keeps the captured tag after the URL changes, with no storage at all", () => {
    setLocation("?src=poster");
    denyStorage();
    initAttribution();

    // Client-side navigation drops the query string.
    setLocation("/editor/cv/try");
    expect(getCampaignSource()).toBe("poster");
  });

  it("degrades to null with no window, no location and no storage (SSR)", () => {
    delete globals.location;
    delete globals.localStorage;

    expect(() => initAttribution()).not.toThrow();
    expect(initAttribution()).toBeNull();
    expect(getCampaignSource()).toBeNull();
    expect(getAttributionProps()).toEqual({ src: null });
  });

  it("survives a nonsense query string", () => {
    setGlobal("localStorage", fakeStorage());
    setLocation("?%src=%zz&src");
    expect(() => getCampaignSource()).not.toThrow();
    expect(getCampaignSource()).toBeNull();
  });
});

describe("analytics wiring", () => {
  it("stamps the campaign source on an event that declares no properties of its own", () => {
    const store = fakeStorage();
    setGlobal("localStorage", store);
    setLocation("?src=poster");
    setGlobal("window", {}); // track() no-ops without a window
    const spy = vi.mocked(vercelTrack);
    spy.mockClear();

    track("pwa_installed");

    expect(spy).toHaveBeenCalledWith("pwa_installed", { src: "poster" });
  });

  it("stamps it alongside the event's own properties", () => {
    const store = fakeStorage();
    setGlobal("localStorage", store);
    setLocation("?src=poster");
    setGlobal("window", {});
    const spy = vi.mocked(vercelTrack);
    spy.mockClear();

    track("export_completed", { source: "preview", templateId: "classic" });

    expect(spy).toHaveBeenCalledWith("export_completed", {
      source: "preview",
      templateId: "classic",
      src: "poster",
    });
  });

  it("lets a call site pass its own props but not override the campaign", () => {
    const store = fakeStorage();
    setGlobal("localStorage", store);
    setLocation("?src=poster");
    setGlobal("window", {});
    const spy = vi.mocked(vercelTrack);
    spy.mockClear();

    track("ats_checked", {
      mode: "paste",
      score: 61,
      status: "ok",
      src: "someone-elses-campaign",
    });

    expect(spy).toHaveBeenCalledWith("ats_checked", {
      mode: "paste",
      score: 61,
      status: "ok",
      src: "poster",
    });
  });

  it("sends src: null — never a missing property — for untagged traffic", () => {
    setGlobal("localStorage", fakeStorage());
    setLocation("");
    setGlobal("window", {});
    const spy = vi.mocked(vercelTrack);
    spy.mockClear();

    track("ats_checked", { mode: "paste", score: 40, status: "poor" });

    expect(spy).toHaveBeenCalledWith("ats_checked", {
      mode: "paste",
      score: 40,
      status: "poor",
      src: null,
    });
  });
});
