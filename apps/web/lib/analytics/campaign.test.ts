/**
 * The client half of the campaign funnel: what it is willing to send, and what
 * it refuses to send. The rule that matters most is the last one — an untagged
 * visitor (no `?src=`) must produce NO request, because the ingest route treats
 * `src` as required and a "campaign" with no campaign is not a measurement.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@vercel/analytics", () => ({ track: vi.fn() }));

import {
  MAX_CAMPAIGN_PROP_LENGTH,
  buildCampaignPayload,
} from "@/lib/analytics/campaign";
import {
  CAMPAIGN_FUNNEL_STEPS,
  EVENTS,
  isCampaignFunnelStep,
  isKnownEvent,
} from "@/lib/analytics/events";
import { ATTRIBUTION_STORAGE_KEY, resetAttribution, resetVisitorId } from "@/lib/analytics/attribution";
import { track } from "@/lib/analytics";

const AT = Date.parse("2026-09-17T09:00:00.000Z");

const globals = globalThis as unknown as Record<string, unknown>;

function setGlobal(key: string, value: unknown): void {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
}

/** Storage seeded as if the visitor had scanned `?src=poster`. */
function storageWith(seed: Record<string, string>) {
  const data = new Map<string, string>(Object.entries(seed));
  return {
    data,
    getItem: (k: string) => (data.has(k) ? (data.get(k) as string) : null),
    setItem: (k: string, v: string) => void data.set(k, String(v)),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe("buildCampaignPayload", () => {
  it("builds the body the route expects", () => {
    const payload = buildCampaignPayload({
      src: "poster",
      name: "campaign_landing",
      visitorId: "0f4b1c2d-1234",
      props: { path: "/ats-checker" },
      at: AT,
    });
    expect(payload).toEqual({
      src: "poster",
      name: "campaign_landing",
      visitorId: "0f4b1c2d-1234",
      at: AT,
      props: { path: "/ats-checker" },
    });
  });

  it("returns null when the visit carries no campaign — an organic visitor is not a campaign", () => {
    for (const src of [null, undefined, "", "   "]) {
      expect(
        buildCampaignPayload({ src, name: "campaign_landing", visitorId: "v-123456", at: AT }),
      ).toBeNull();
    }
  });

  it("returns null for a name that is not a declared funnel step", () => {
    for (const name of ["export_completed", "made_up", ""]) {
      expect(buildCampaignPayload({ src: "poster", name, visitorId: "v-123456", at: AT })).toBeNull();
    }
  });

  it("returns null when there is no visitor id to count with", () => {
    expect(
      buildCampaignPayload({ src: "poster", name: "ats_checked", visitorId: null, at: AT }),
    ).toBeNull();
  });

  it("drops non-primitive props and bounds long strings", () => {
    const payload = buildCampaignPayload({
      src: "poster",
      name: "ats_checked",
      visitorId: "v-123456",
      at: AT,
      props: { mode: "paste", score: 61, status: "good", nested: { a: 1 }, long: "x".repeat(500) },
    });
    expect(payload?.props).toEqual({
      mode: "paste",
      score: 61,
      status: "good",
      long: "x".repeat(MAX_CAMPAIGN_PROP_LENGTH),
    });
  });

  it("defaults the timestamp instead of sending NaN", () => {
    const payload = buildCampaignPayload({
      src: "poster",
      name: "ats_checked",
      visitorId: "v-123456",
      at: Number.NaN,
    });
    expect(Number.isFinite(payload?.at)).toBe(true);
  });
});

describe("the catalog and the funnel agree", () => {
  it("declares every funnel step as a real event", () => {
    for (const step of CAMPAIGN_FUNNEL_STEPS) {
      expect(isKnownEvent(step)).toBe(true);
      expect(EVENTS[step]).toBe(step);
    }
  });

  it("recognises only declared steps", () => {
    expect(isCampaignFunnelStep("campaign_landing")).toBe(true);
    expect(isCampaignFunnelStep("ats_checked")).toBe(true);
    expect(isCampaignFunnelStep("export_completed")).toBe(false);
    expect(isCampaignFunnelStep("__proto__")).toBe(false);
  });

  it("keeps the landing event at the top of the funnel", () => {
    expect(CAMPAIGN_FUNNEL_STEPS[0]).toBe("campaign_landing");
    expect(CAMPAIGN_FUNNEL_STEPS).toContain("sign_in_completed");
    expect(CAMPAIGN_FUNNEL_STEPS).toContain("document_created");
  });
});

/**
 * The wiring, not the pieces: `track()` is where every call site in the product
 * enters analytics, so it is the one place that has to mirror a funnel step to
 * our own database. If this stops happening the campaign view reads zero
 * forever while every call site still "works" — the exact failure this whole
 * change exists to end.
 */
describe("track() mirrors campaign funnel steps to the server", () => {
  let beacon: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetAttribution();
    resetVisitorId();
    beacon = vi.fn(() => true);
    setGlobal("window", {});
    setGlobal("location", { search: "" });
    setGlobal("localStorage", storageWith({ [ATTRIBUTION_STORAGE_KEY]: "poster" }));
    setGlobal("navigator", { sendBeacon: beacon });
  });

  afterEach(() => {
    resetAttribution();
    resetVisitorId();
    delete globals.window;
    delete globals.location;
    delete globals.localStorage;
    delete globals.navigator;
  });

  it("posts a declared funnel step for a campaign-attributed visitor", async () => {
    track("ats_checked", { mode: "paste", score: 61, status: "good" });

    expect(beacon).toHaveBeenCalledTimes(1);
    const [url, blob] = beacon.mock.calls[0] as [string, Blob];
    expect(url).toBe("/api/campaign/event");
    const body = JSON.parse(await blob.text());
    expect(body.src).toBe("poster");
    expect(body.name).toBe("ats_checked");
    // src rides top-level (it has its own column); it is not duplicated in props
    // where the two copies could drift apart.
    expect(body.props).toEqual({ mode: "paste", score: 61, status: "good" });
    expect(body.visitorId).toMatch(/^[a-z0-9-]{6,}$/);
    expect(Number.isFinite(body.at)).toBe(true);
  });

  it("sends nothing for an event that is not a funnel step", () => {
    // export_completed is real, attributable, and deliberately NOT mirrored —
    // mirroring the whole catalog would be a second analytics pipeline.
    track("export_completed", { source: "preview", templateId: "nakuru" });
    expect(beacon).not.toHaveBeenCalled();
  });

  it("sends nothing for an untagged visitor", () => {
    setGlobal("localStorage", storageWith({}));
    resetAttribution();
    track("campaign_landing", { path: "/ats-checker" });
    expect(beacon).not.toHaveBeenCalled();
  });

  it("never throws when the browser has no sendBeacon at all", () => {
    setGlobal("navigator", {});
    setGlobal("fetch", vi.fn(() => Promise.resolve(new Response("{}"))));
    expect(() => track("campaign_landing", { path: "/ats-checker" })).not.toThrow();
    delete globals.fetch;
  });
});
