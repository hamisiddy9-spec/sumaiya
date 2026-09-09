// Outcome event module — pure, deterministic tests (no DB, no network).
// The write path itself is best-effort by contract (never throws), verified
// against the real prod DB by scripts/acceptance-outcomes.ts (RUN_DB_VERIFY).

import { describe, it, expect, afterEach } from "vitest";
import { hashUserId, sanitizePayload, recordOutcomeEvent } from "./events";

/** Minimal drizzle-shaped stub: records the calls it receives. Rows mirror
 *  the real db.select({ optOut: userProfile.analyticsOptOut }) projection —
 *  the column comes back renamed to `optOut`. */
function stubDb() {
  const calls: { kind: string; values?: unknown }[] = [];
  const db = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => {
            calls.push({ kind: "optout" });
            return [{ optOut: false }];
          },
        }),
      }),
    }),
    insert: () => ({
      values: async (values: unknown) => {
        calls.push({ kind: "insert", values });
      },
    }),
  };
  return { db, calls };
}

describe("recordOutcomeEvent", () => {
  const prevSalt = process.env.OUTCOME_SALT;

  afterEach(() => {
    if (prevSalt !== undefined) process.env.OUTCOME_SALT = prevSalt;
    else delete process.env.OUTCOME_SALT;
  });

  it("no-ops entirely when OUTCOME_SALT is not set (privacy gate)", async () => {
    delete process.env.OUTCOME_SALT;
    const { db, calls } = stubDb();
    await recordOutcomeEvent(db as never, {
      userId: "user-1",
      type: "snap.started",
      payload: { lang: "sw" },
    });
    expect(calls).toEqual([]); // never touches the DB
  });

  it("writes a salted, PII-stripped event when OUTCOME_SALT is set", async () => {
    process.env.OUTCOME_SALT = "test-salt";
    const { db, calls } = stubDb();
    // email is deliberately out-of-band (not in OutcomePayload) to prove the
    // PII strip removes unknown keys too — cast via a variable keeps the
    // payload literal type-safe while still exercising the runtime strip.
    const input = {
      userId: "user-1",
      type: "snap.tailored_ok",
      payload: { beforeAts: 40, afterAts: 62, deltaAts: 22, source: "profile", lang: "en", email: "x@y.z" },
    };
    await recordOutcomeEvent(db as never, input as never);
    expect(calls.map((c) => c.kind)).toEqual(["optout", "insert"]);
    const inserted = calls[1].values as Record<string, unknown>;
    expect(inserted.type).toBe("snap.tailored_ok");
    expect(inserted.userHash).toMatch(/^[0-9a-f]{64}$/);
    expect(inserted.userHash).not.toContain("user-1");
    expect(JSON.stringify(inserted.payload)).not.toContain("x@y.z");
  });

  it("skips the write for opted-out users", async () => {
    process.env.OUTCOME_SALT = "test-salt";
    const calls: string[] = [];
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => {
              calls.push("optout");
              return [{ optOut: true }]; // mirrors the select projection rename
            },
          }),
        }),
      }),
      insert: () => ({
        values: async () => {
          calls.push("insert");
          throw new Error("must not insert");
        },
      }),
    };
    await recordOutcomeEvent(db as never, {
      userId: "user-1",
      type: "snap.started",
      payload: { lang: "en" },
    });
    expect(calls).toEqual(["optout"]); // opt-out read happened, insert never did
  });
});

describe("hashUserId", () => {
  it("is deterministic per user (aggregation works)", () => {
    expect(hashUserId("user-123")).toBe(hashUserId("user-123"));
  });

  it("differs across users", () => {
    expect(hashUserId("user-123")).not.toBe(hashUserId("user-456"));
  });

  it("is a sha256 hex string (64 chars) and never contains the raw id", () => {
    const h = hashUserId("alice@example.com");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toContain("alice");
    expect(h).not.toContain("example");
  });
});

describe("sanitizePayload", () => {
  it("drops PII keys at the top level", () => {
    const out = sanitizePayload({
      email: "alice@example.com",
      phone: "+255700000000",
      fullName: "Alice",
      score: 71,
      deltaAts: 12,
    });
    expect(out).toEqual({ score: 71, deltaAts: 12 });
  });

  it("drops PII keys nested inside objects", () => {
    const out = sanitizePayload({
      tool: "cv.tailor",
      args: { jobDescription: "long JD text...", jobTitle: "Engineer" },
      priority: 5,
    });
    expect(out).toEqual({ tool: "cv.tailor", priority: 5 });
  });

  it("truncates long string values (defense against free text)", () => {
    const long = "x".repeat(500);
    const out = sanitizePayload({ trigger: long, score: 1 });
    expect(out.trigger).toHaveLength(120);
    expect(out.score).toBe(1);
  });

  it("keeps numeric/count payloads intact (the aggregatable surface)", () => {
    const payload = {
      beforeAts: 42,
      afterAts: 68,
      deltaAts: 26,
      beforeMatch: 30,
      afterMatch: 31,
      lang: "sw",
    };
    expect(sanitizePayload(payload)).toEqual(payload);
  });

  it("keeps trust-loop kinds (categories, never the keys)", () => {
    const out = sanitizePayload({ decision: "accept", count: 3, kinds: ["summary", "experience"] });
    expect(out).toEqual({ decision: "accept", count: 3, kinds: ["summary", "experience"] });
  });

  it("handles arrays and nulls without crashing", () => {
    const out = sanitizePayload({ kinds: ["a", null, 2], trigger: null, n: 0 });
    expect(out.kinds).toEqual(["a", null, 2]);
    expect(out.trigger).toBeNull();
    expect(out.n).toBe(0);
  });
});
