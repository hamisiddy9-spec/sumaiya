/**
 * REAL-DATA CHECK — Workstream C: the proactive signal engine on the real prod DB.
 *
 *   npx tsx --env-file=.env.local scripts/acceptance-signals.ts
 *
 * The acceptance scenario from the mandate: "a user with a saved deadline +
 * untailored CV sees the exact nudge on both dashboard and assistant, and
 * clicking it runs the right tool."
 *
 * We construct exactly that state (fresh user + conversation-seeded profile +
 * saved CV + a published job whose applicationDeadline is 6 days away + a
 * recommendation row for it, NO application), assemble the unified context,
 * and compute signals. Expect:
 *   - cv.tailor signal for THAT job, trigger citing the deadline (dashboard
 *     and assistant both read this engine)
 *   - coverLetter.generate for the same job (score ≥ 70, not applied)
 *   - confirmations signal (the conversation seed left facts unconfirmed)
 * Then we add an application for the job and verify the tailor/coverLetter
 * signals disappear (grounded — no double nudge). Rows cleaned up after.
 */
import { db, profile, userProfile, cv, job, jobRecommendation, application } from "../lib/db";
import { eq } from "drizzle-orm";
import { createEmptyCVData, type CVData } from "../types";
import { ensureProfileRow, seedProfileFromCv } from "../lib/career-profile/sync";
import { assembleUserContext } from "../lib/assistant/context";
import { computeSignals } from "../lib/assistant/signals";
import { nanoid } from "nanoid";

const userId = `sig_${Date.now()}`;

function aiBuiltCv(): CVData {
  const e = createEmptyCVData();
  return {
    ...e,
    personal: { ...e.personal, fullName: "Signal Test User", jobTitle: "Software Engineer", email: "sig@test.tz", phone: "+255****6666", location: "Dar es Salaam" },
    summary: "Software engineer with 3 years building fintech platforms...",
    skills: [{ id: "g_sk1", name: "React", level: 4 }],
    experience: [{
      id: "g_e1", company: "Zuri Fintech", position: "Software Engineer", location: "Dar es Salaam",
      startDate: "2022-03", endDate: "", current: true,
      description: "- Built mobile-money dashboards serving 1M+ users",
    }],
    education: [],
  };
}

async function main() {
  console.log("SIGNALS CHECK — proactive signal engine on the real prod DB");
  console.log(`user: ${userId}\n`);

  await ensureProfileRow(userId);
  await seedProfileFromCv(userId, aiBuiltCv(), { source: "conversation", confidence: 0.7, aiDerived: true });

  const cvId = nanoid();
  await db.insert(cv).values({
    id: cvId, userId, title: "Signal CV", templateId: "nakuru", primaryColor: "#2563EB",
    fontFamily: "Inter", data: aiBuiltCv() as never, status: "draft",
  } as never);

  // A live job closing in 6 days.
  const deadline = new Date(Date.now() + 6 * 86_400_000);
  const jobId = nanoid();
  await db.insert(job).values({
    id: jobId, title: "Senior Backend Engineer", company: "NMB Bank", location: "Dar es Salaam",
    category: "engineering", employmentType: "full-time", description: "Node.js backend engineer for mobile banking...",
    applyUrl: "https://example.com/apply", source: "admin", sourceName: "Admin", sourceUrl: "", externalId: "",
    status: "published", applicationDeadline: deadline, lastVerifiedAt: new Date(),
  } as never);
  await db.insert(jobRecommendation).values({
    id: nanoid(), userId, jobId, score: 85, reason: "matched Node.js, backend, banking", matchedTerms: ["node", "backend"],
  } as never);

  const ctx = await assembleUserContext(userId, { activeCvId: cvId });
  const signals = computeSignals(ctx);
  console.log("── Signals for user with deadline + untailored CV ──");
  for (const s of signals) console.log(`[${s.priority}] ${s.type} — ${s.title.en} (trigger: ${s.trigger})`);

  const tailor = signals.find((s) => s.type === "cv.tailor" && s.jobId === jobId);
  const letter = signals.find((s) => s.type === "coverLetter.generate" && s.jobId === jobId);
  const conf = signals.find((s) => s.type === "confirmations");

  console.log(`\n✓ cv.tailor for the deadline job: ${!!tailor}`);
  console.log(`  trigger: ${tailor?.trigger}`);
  console.log(`✓ coverLetter for the strong match: ${!!letter}`);
  console.log(`✓ confirmations (unconfirmed prose): ${!!conf}`);

  const ok =
    !!tailor &&
    tailor!.trigger.includes("applicationDeadline") &&
    !!letter &&
    !!conf;
  if (!ok) throw new Error("signal verification failed — expected cv.tailor + coverLetter + confirmations");

  // ── Groundedness: once the user APPLIES for the job, the tailor/letter
  //    nudges for it must disappear (no double-nudging an applied job). ──
  const appId = nanoid();
  await db.insert(application).values({
    id: appId, userId, title: "Senior Backend Engineer at NMB", companyName: "NMB Bank",
    jobTitle: "Senior Backend Engineer", cvId, matchScore: 85, status: "applied", appliedAt: new Date(), notes: "",
  } as never);
  const ctx2 = await assembleUserContext(userId, { activeCvId: cvId });
  const signals2 = computeSignals(ctx2);
  const tailor2 = signals2.find((s) => s.type === "cv.tailor" && s.jobId === jobId);
  const letter2 = signals2.find((s) => s.type === "coverLetter.generate" && s.jobId === jobId);
  console.log(`\n── After applying for the job ──`);
  console.log(`✓ cv.tailor gone: ${!tailor2}`);
  console.log(`✓ coverLetter gone: ${!letter2}`);
  if (tailor2 || letter2) throw new Error("signals not grounded — nudges survived an application");

  // Cleanup
  await db.delete(application).where(eq(application.id, appId));
  await db.delete(jobRecommendation).where(eq(jobRecommendation.userId, userId));
  await db.delete(job).where(eq(job.id, jobId));
  await db.delete(cv).where(eq(cv.id, cvId));
  await db.delete(profile).where(eq(profile.id, userId));
  console.log("\n✅ SIGNALS CHECK PASSED — deadline + untailored CV produced the exact nudge; applying removed it.");
  console.log("test rows removed");
}

main().then(() => process.exit(0)).catch((err) => { console.error("❌ FAILED:", err); process.exit(1); });
