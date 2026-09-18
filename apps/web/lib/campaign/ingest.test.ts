/**
 * The ingest door bouncer. `campaign_event` is what every campaign number is
 * read from, so what it refuses matters as much as what it stores: a row with a
 * junk src or an invented event name would land in the rollup as a campaign
 * that never existed.
 */
import { describe, expect, it } from "vitest";
import {
  MAX_EVENT_AGE_MS,
  clampOccurredAt,
  normalizeVisitorId,
  parseCampaignEvent,
} from "@/lib/campaign/ingest";

const NOW = Date.parse("2026-09-17T09:00:00.000Z");
const VALID = {
  src: "poster",
  name: "campaign_landing",
  visitorId: "0f4b1c2d-1234",
  at: NOW,
  props: { path: "/ats-checker" },
};

describe("parseCampaignEvent — accepts what the client actually sends", () => {
  it("returns a normalised event", () => {
    const parsed = parseCampaignEvent(VALID, NOW);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error("unreachable");
    expect(parsed.value.src).toBe("poster");
    expect(parsed.value.name).toBe("campaign_landing");
    expect(parsed.value.visitorId).toBe("0f4b1c2d-1234");
    expect(parsed.value.occurredAt.toISOString()).toBe("2026-09-17T09:00:00.000Z");
    expect(parsed.value.props).toEqual({ path: "/ats-checker" });
  });

  it("accepts every declared funnel step", () => {
    for (const name of [
      "campaign_landing",
      "ats_checked",
      "sign_in_completed",
      "document_created",
    ]) {
      expect(parseCampaignEvent({ ...VALID, name }, NOW).ok).toBe(true);
    }
  });

  it("slugifies a src that arrives unsanitized", () => {
    const parsed = parseCampaignEvent({ ...VALID, src: "  Poster A!" }, NOW);
    expect(parsed.ok && parsed.value.src).toBe("poster-a");
  });

  it("caps a hostile-length src at the slug bound", () => {
    const parsed = parseCampaignEvent({ ...VALID, src: "a".repeat(500) }, NOW);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error("unreachable");
    expect(parsed.value.src.length).toBeLessThanOrEqual(64);
  });

  it("strips PII out of props on the way in", () => {
    const parsed = parseCampaignEvent(
      { ...VALID, props: { path: "/x", email: "a@b.c", message: "x".repeat(400) } },
      NOW,
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error("unreachable");
    expect(parsed.value.props).not.toHaveProperty("email");
    expect(String(parsed.value.props.path)).toBe("/x");
  });
});

describe("parseCampaignEvent — rejects what would poison the rollup", () => {
  it("rejects a missing, empty or unsalvageable src", () => {
    for (const src of [undefined, "", "   ", "%%%", "!!!", null, 42]) {
      const parsed = parseCampaignEvent({ ...VALID, src }, NOW);
      expect(parsed.ok).toBe(false);
      if (!parsed.ok) expect(parsed.reason).toBe("src");
    }
  });

  it("rejects an event name that is not a declared funnel step", () => {
    for (const name of ["", "made_up", "campaign_landing ", "POSTER", "__proto__"]) {
      const parsed = parseCampaignEvent({ ...VALID, name }, NOW);
      expect(parsed.ok).toBe(false);
      if (!parsed.ok) expect(parsed.reason).toBe("name");
    }
  });

  it("rejects a missing or too-short visitor id", () => {
    for (const visitorId of [undefined, "", "ab", "a+b!", 1234]) {
      const parsed = parseCampaignEvent({ ...VALID, visitorId }, NOW);
      expect(parsed.ok).toBe(false);
      if (!parsed.ok) expect(parsed.reason).toBe("visitorId");
    }
  });

  it("rejects a body that is not an object at all", () => {
    for (const body of [null, undefined, "poster", 7, [VALID]]) {
      const parsed = parseCampaignEvent(body, NOW);
      expect(parsed.ok).toBe(false);
      if (!parsed.ok) expect(parsed.reason).toBe("body");
    }
  });
});

describe("clampOccurredAt — the client clock is advisory", () => {
  it("falls back to now when the client sent nothing usable", () => {
    expect(clampOccurredAt(undefined, NOW).getTime()).toBe(NOW);
    expect(clampOccurredAt(Number.NaN, NOW).getTime()).toBe(NOW);
    expect(clampOccurredAt("2026-01-01" as unknown as number, NOW).getTime()).toBe(NOW);
  });

  it("refuses a future timestamp", () => {
    expect(clampOccurredAt(NOW + 60_000, NOW).getTime()).toBe(NOW);
  });

  it("refuses a timestamp older than the window", () => {
    expect(clampOccurredAt(NOW - MAX_EVENT_AGE_MS - 1, NOW).getTime()).toBe(NOW - MAX_EVENT_AGE_MS);
  });

  it("keeps a plausible timestamp as sent", () => {
    expect(clampOccurredAt(NOW - 5_000, NOW).getTime()).toBe(NOW - 5_000);
  });
});

describe("normalizeVisitorId", () => {
  it("lowercases and keeps the safe characters", () => {
    expect(normalizeVisitorId("0F4B-1C2D")).toBe("0f4b-1c2d");
  });

  it("returns \"\" for anything unusable", () => {
    expect(normalizeVisitorId("VISITOR 12!")).toBe("visitor12");
    expect(normalizeVisitorId("ab")).toBe(""); // too short to be a real id
    expect(normalizeVisitorId(null)).toBe("");
    expect(normalizeVisitorId({})).toBe("");
  });

  it("bounds the length", () => {
    expect(normalizeVisitorId("a".repeat(200)).length).toBe(64);
  });
});
