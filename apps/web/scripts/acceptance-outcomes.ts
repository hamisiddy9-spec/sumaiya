// Acceptance: outcome instrumentation write path against the REAL prod DB.
//
//   DATABASE_URL="postgres://..." npx tsx scripts/acceptance-outcomes.ts
//
// Verifies:
//   1. recordOutcomeEvent inserts a row with the hashed user id and a
//      PII-free payload (the aggregatable surface survives intact).
//   2. The same user's events share ONE user_hash (aggregation works).
//   3. The opt-out flag suppresses events entirely.
//   4. Cleanup: the synthetic rows are removed (the prod DB is left exactly
//      as it was — no test data survives).
// Exits non-zero on any failed check.
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { db, profile, userProfile, outcomeEvent } from "@/lib/db";
import { recordOutcomeEvent, recordTailorLift, recordConfirmationResolved } from "@/lib/outcomes/events";
import { hashUserId } from "@/lib/outcomes/events";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
}

async function main() {
  const userId = `accept-user-${nanoid(8)}`;

  // 1. Seed a synthetic profile row (profile.id is referenced by user_profile).
  await db.insert(profile).values({ id: userId, name: "Acceptance Test", email: `${userId}@example.test` });
  await db.insert(userProfile).values({ id: userId, analyticsOptOut: false });

  try {
    // 2. Fire the real event writers (the seams call these exact functions).
    await recordTailorLift(db, userId, {
      beforeAts: 42,
      afterAts: 68,
      deltaAts: 26,
      beforeMatch: 30,
      afterMatch: 31,
      lang: "sw",
    });
    await recordOutcomeEvent(db, {
      userId,
      type: "match.scored",
      payload: { score: 71, source: "targeted-cv", jobId: "job-abc" },
    });
    await recordConfirmationResolved(db, userId, {
      decision: "accept",
      count: 3,
      kinds: ["summary", "experience"],
    });

    const rows = await db
      .select()
      .from(outcomeEvent)
      .where(eq(outcomeEvent.userHash, hashUserId(userId)));

    check("three events were written", rows.length === 3, `got ${rows.length}`);
    check("user id is stored ONLY as a hash (never raw)", rows.every((r) => !r.userHash.includes(userId)));
    check("payloads survived sanitization (numbers intact)", rows.some((r) =>
      r.type === "tailor.lift" && (r.payload as { afterAts?: number }).afterAts === 68,
    ));
    check("no PII leaked into any payload", rows.every((r) => {
      const s = JSON.stringify(r.payload).toLowerCase();
      // jobId is an INTERNAL id (nanoid), deliberately in the schema — not PII.
      // The privacy boundary is: raw userId, email, name, contact details.
      return !s.includes(userId.toLowerCase())
        && !s.includes("@example.test")
        && !s.includes("acceptance test")
        && !s.includes("+255")
        && !s.includes("accept-user-");
    }));

    // 3. Opt-out: a user with analytics_opt_out=true must generate NOTHING.
    const optOutId = `accept-optout-${nanoid(8)}`;
    await db.insert(profile).values({ id: optOutId, name: "OptOut", email: `${optOutId}@example.test` });
    await db.insert(userProfile).values({ id: optOutId, analyticsOptOut: true });
    try {
      await recordOutcomeEvent(db, { userId: optOutId, type: "tool.executed", payload: { tool: "cv.tailor" } });
      const suppressed = await db
        .select()
        .from(outcomeEvent)
        .where(eq(outcomeEvent.userHash, hashUserId(optOutId)));
      check("opted-out user generates zero events", suppressed.length === 0, `got ${suppressed.length}`);
    } finally {
      await db.delete(userProfile).where(eq(userProfile.id, optOutId));
      await db.delete(profile).where(eq(profile.id, optOutId));
    }

    // 4. Cleanup (prod DB left exactly as found).
    await db.delete(outcomeEvent).where(eq(outcomeEvent.userHash, hashUserId(userId)));
    await db.delete(userProfile).where(eq(userProfile.id, userId));
    await db.delete(profile).where(eq(profile.id, userId));

    const leftover = await db
      .select()
      .from(outcomeEvent)
      .where(eq(outcomeEvent.userHash, hashUserId(userId)));
    check("cleanup complete (no leftover rows)", leftover.length === 0);
  } catch (err) {
    console.error("acceptance failed with exception:", err);
    // Best-effort cleanup so a failure can't leave test rows behind.
    await db.delete(outcomeEvent).where(eq(outcomeEvent.userHash, hashUserId(userId))).catch(() => {});
    await db.delete(userProfile).where(eq(userProfile.id, userId)).catch(() => {});
    await db.delete(profile).where(eq(profile.id, userId)).catch(() => {});
    failures += 1;
  }

  console.log(failures === 0 ? "\nACCEPTANCE PASSED" : `\nACCEPTANCE FAILED (${failures})`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
