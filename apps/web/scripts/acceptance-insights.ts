// PR-3 acceptance: the insights data path against the REAL prod DB.
// Seeds a PII-free synthetic event set, runs the SAME aggregation the admin
// page runs (DB → rows → insightsOverview), prints the numbers the page would
// show, then cleans up — the prod DB is left exactly as found.
import { nanoid } from "nanoid";
import { db, outcomeEvent } from "@/lib/db";
import { insightsOverview, type OutcomeEventRow } from "@/lib/outcomes/aggregate";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
}

async function main() {
  const ids: string[] = [];
  const now = Date.now();
  const H = (n: number) => `h${n}`; // synthetic user hashes (already anonymized shape)

  const events: Array<{ userHash: string; type: string; payload: Record<string, unknown>; createdAt: Date }> = [
    // Tailor lifts across 3 users (deltas: +20, 0, +10, +5, +10, +8, +4, +2, 0, +10, +4, +6, +3, -2, +7)
    ...[20, 0, 10, 5, 10, 8, 4, 2, 0, 10, 4, 6, 3, -2, 7].map((d, i) => ({
      userHash: H(i % 3), type: "tailor.lift",
      payload: { beforeAts: 40 + i, afterAts: 40 + i + d, deltaAts: d, beforeMatch: 30, afterMatch: 30, lang: "sw" },
      createdAt: new Date(now - i * 3600_000),
    })),
    // Applications with match scores + lifecycle transitions
    ...[
      { app: "app-a", score: 82, to: ["applied", "interviewing", "offer"] },
      { app: "app-b", score: 74, to: ["applied", "interviewing"] },
      { app: "app-c", score: 58, to: ["applied"] },
      { app: "app-d", score: 33, to: ["applied"] },
      { app: "app-e", score: 91, to: ["applied", "offer"] },
      { app: "app-f", score: 66, to: ["applied", "interviewing"] },
      { app: "app-g", score: 47, to: ["applied"] },
      { app: "app-h", score: 88, to: ["applied", "interviewing"] },
    ].flatMap((a, i) => [
      { userHash: H(i % 3), type: "application.created", payload: { applicationId: a.app, matchScore: a.score, status: "draft" }, createdAt: new Date(now - 20 * 3600_000) },
      ...a.to.map((t) => ({ userHash: H(i % 3), type: "application.status", payload: { applicationId: a.app, from: "draft", to: t, matchScore: a.score }, createdAt: new Date(now - 18 * 3600_000) })),
    ]),
    // Nudges: cv.tailor shown 5×, acted 2× (same user runs the tool within 24h)
    ...[1, 2, 3, 4, 5].map((i) => ({
      userHash: H(i % 2), type: "signal.shown",
      payload: { signalType: "cv.tailor", trigger: `job-${i}`, tool: "cv.tailor", priority: 80 },
      createdAt: new Date(now - 10 * 3600_000),
    })),
    { userHash: H(0), type: "tool.executed", payload: { tool: "cv.tailor" }, createdAt: new Date(now - 8 * 3600_000) },
    { userHash: H(1), type: "tool.executed", payload: { tool: "cv.tailor" }, createdAt: new Date(now - 7 * 3600_000) },
    { userHash: H(2), type: "signal.shown", payload: { signalType: "ats.check", trigger: "score-40", tool: "ats.check", priority: 70 }, createdAt: new Date(now - 9 * 3600_000) },
    // Confirmations: 4 accept, 1 reject
    ...[1, 2, 3, 4].map((i) => ({ userHash: H(i % 3), type: "confirmation.resolved", payload: { decision: "accept", count: 2, kinds: ["summary"] }, createdAt: new Date(now - 5 * 3600_000) })),
    { userHash: H(0), type: "confirmation.resolved", payload: { decision: "reject", count: 1, kinds: ["experience"] }, createdAt: new Date(now - 4 * 3600_000) },
  ];

  for (const e of events) {
    const id = nanoid();
    ids.push(id);
    await db.insert(outcomeEvent).values({ id, userHash: e.userHash, type: e.type, payload: e.payload as unknown as string, createdAt: e.createdAt });
  }
  console.log(`seeded ${ids.length} synthetic events`);

  // Reload the exact seeded rows (the page loads by date window; we target
  // our own ids so cleanup is exact and nothing else is touched).
  const { inArray } = await import("drizzle-orm");
  const seededRows = await db.select().from(outcomeEvent).where(inArray(outcomeEvent.id, ids));
  const mapped: OutcomeEventRow[] = seededRows.map((r) => ({
    userHash: r.userHash, type: r.type, payload: (r.payload ?? {}) as Record<string, unknown>, createdAt: r.createdAt,
  }));

  const o = insightsOverview(mapped, 90);

  console.log("\n--- what the admin insights page would show ---");
  console.log(`tailor.lift: n=${o.tailorLift.n} avgΔATS=${o.tailorLift.avgDeltaAts?.toFixed(1)} median=${o.tailorLift.medianDeltaAts} liftRate=${o.tailorLift.liftRate}% avgΔmatch=${o.tailorLift.avgDeltaMatch}`);
  for (const b of o.matchOutcome.buckets) {
    console.log(`match ${b.bucket}: n=${b.n} interviewing=${b.interviewing} (${b.interviewRate}%) offer=${b.offer} (${b.offerRate}%)`);
  }
  for (const n of o.nudgeEfficacy) {
    console.log(`nudge ${n.signalType}: shown=${n.shown} acted=${n.actedOn} (${n.actRate}%)`);
  }
  console.log(`confirmations: n=${o.confirmations.n} accept=${o.confirmations.accept} reject=${o.confirmations.reject} (${o.confirmations.acceptRate}%)`);
  console.log(`total events: ${o.totalEvents}`);

  // Verifications
  check("15 tailor events aggregated", o.tailorLift.n === 15, `got ${o.tailorLift.n}`);
  check("lift rate matches the real deltas (12 of 15 > 0)", o.tailorLift.liftRate === 80, `got ${o.tailorLift.liftRate}`);
  const high = o.matchOutcome.buckets.find((b) => b.bucket === "≥70")!;
  check("high-match bucket has 4 applications", high.n === 4, `got ${high.n}`);
  check("high-match interviewing = 3, offer = 2", high.interviewing === 3 && high.offer === 2, `got ${high.interviewing}/${high.offer}`);
  const tailorNudge = o.nudgeEfficacy.find((x) => x.signalType === "cv.tailor")!;
  // Both synthetic users (H0, H1) ran cv.tailor within 24h → all 5 signals acted.
  check("cv.tailor nudge acted 5 of 5", tailorNudge?.shown === 5 && tailorNudge?.actedOn === 5, `got ${tailorNudge?.shown}/${tailorNudge?.actedOn}`);
  check("confirmations 4 accept / 1 reject", o.confirmations.accept === 4 && o.confirmations.reject === 1, `got ${o.confirmations.accept}/${o.confirmations.reject}`);

  // Cleanup
  await db.delete(outcomeEvent).where(inArray(outcomeEvent.id, ids));
  const leftover = await db.select().from(outcomeEvent).where(inArray(outcomeEvent.id, ids));
  check("cleanup complete (no leftover rows)", leftover.length === 0);

  console.log(failures === 0 ? "\nPR3 ACCEPTANCE PASSED" : `\nPR3 ACCEPTANCE FAILED (${failures})`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
