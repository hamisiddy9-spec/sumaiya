/**
 * REAL-DATA CHECK — Workstream D: the goal-chaining orchestrator on the real prod DB.
 *
 *   npx tsx --env-file=.env.local scripts/acceptance-orchestrator.ts
 *
 * The acceptance scenario from the mandate: from a single "help me get this
 * job," Sumaiya walks match → tailor → cover letter → track in one
 * conversation, each write still confirmed.
 *
 * We construct the real state (fresh user + conversation-seeded profile +
 * saved CV + a published job with a deadline + recommendation), then drive
 * the chain exactly as the server would: jobs.match on the real JD (score via
 * matchCvToJd) → computeNextAction → cv.tailor → computeNextAction →
 * coverLetter.generate → computeNextAction → jobs.track → computeNextAction →
 * interview.prep. Every step must be grounded in the real engine's score.
 * Rows cleaned up after.
 */
import { db, profile, userProfile, cv, job, jobRecommendation } from "../lib/db";
import { eq } from "drizzle-orm";
import { createEmptyCVData, type CVData } from "../types";
import { ensureProfileRow, seedProfileFromCv } from "../lib/career-profile/sync";
import { assembleUserContext } from "../lib/assistant/context";
import { computeNextAction } from "../lib/assistant/orchestrator";
import { matchCvToJd } from "../lib/job-match";
import { nanoid } from "nanoid";

const userId = `orc_${Date.now()}`;

const JD = "Senior Backend Engineer at NMB Bank. Requirements: Node.js, PostgreSQL, AWS, Docker, TypeScript, REST APIs, mobile banking experience preferred. 5+ years.";

function aiBuiltCv(): CVData {
  const e = createEmptyCVData();
  return {
    ...e,
    personal: { ...e.personal, fullName: "Orchestrator Test User", jobTitle: "Software Engineer", email: "orc@test.tz", phone: "+255****7777", location: "Dar es Salaam" },
    summary: "Backend engineer focused on Node.js and TypeScript...",
    skills: [
      { id: "o_sk1", name: "Node.js", level: 4 },
      { id: "o_sk2", name: "TypeScript", level: 4 },
      { id: "o_sk3", name: "React", level: 3 },
    ],
    experience: [{
      id: "o_e1", company: "Zuri Fintech", position: "Backend Engineer", location: "Dar es Salaam",
      startDate: "2021-06", endDate: "", current: true,
      description: "- Built REST APIs serving 500k users\n- Worked with PostgreSQL and AWS",
    }],
    education: [],
  };
}

async function main() {
  console.log("ORCHESTRATOR CHECK — goal-chaining on the real prod DB");
  console.log(`user: ${userId}\n`);

  await ensureProfileRow(userId);
  await seedProfileFromCv(userId, aiBuiltCv(), { source: "conversation", confidence: 0.7, aiDerived: true });

  const cvId = nanoid();
  await db.insert(cv).values({
    id: cvId, userId, title: "Orchestrator CV", templateId: "nakuru", primaryColor: "#2563EB",
    fontFamily: "Inter", data: aiBuiltCv() as never, status: "draft",
  } as never);

  const jobId = nanoid();
  await db.insert(job).values({
    id: jobId, title: "Senior Backend Engineer", company: "NMB Bank", location: "Dar es Salaam",
    category: "engineering", employmentType: "full-time", description: JD,
    applyUrl: "https://example.com/apply", source: "admin", sourceName: "Admin", sourceUrl: "", externalId: "",
    status: "published", applicationDeadline: new Date(Date.now() + 6 * 86_400_000), lastVerifiedAt: new Date(),
  } as never);
  await db.insert(jobRecommendation).values({
    id: nanoid(), userId, jobId, score: 74, reason: "matched Node.js, backend, TypeScript", matchedTerms: ["node", "typescript"],
  } as never);

  const ctx = await assembleUserContext(userId, { activeCvId: cvId });

  // Step 1: user pastes the job → jobs.match (real engine score).
  const matchScore = ctx.activeCv ? matchCvToJd(ctx.activeCv.data, JD).score : 0;
  console.log(`── Step 1: jobs.match on the real JD → score ${matchScore} ──`);
  const s1 = computeNextAction(ctx, { tool: "jobs.match", args: { jobDescription: JD }, score: matchScore });
  console.log(`next: ${s1?.tool ?? "null"} — ${s1?.reason.en}`);
  if (s1?.tool !== "cv.tailor") throw new Error("expected cv.tailor after a sub-70 match");
  if (s1.args.jobDescription !== JD) throw new Error("cv.tailor must carry the same JD");

  // Step 2: tailor applied → cover letter.
  const s2 = computeNextAction(ctx, { tool: "cv.tailor", args: { jobDescription: JD } });
  console.log(`── Step 2: cv.tailor applied ──`);
  console.log(`next: ${s2?.tool ?? "null"} — ${s2?.reason.en}`);
  if (s2?.tool !== "coverLetter.generate") throw new Error("expected coverLetter.generate after tailor");

  // Step 3: letter saved → track.
  const s3 = computeNextAction(ctx, { tool: "coverLetter.generate", args: { jobTitle: "Senior Backend Engineer", company: "NMB Bank", jobDescription: JD } });
  console.log(`── Step 3: coverLetter.generate saved ──`);
  console.log(`next: ${s3?.tool ?? "null"} — ${s3?.reason.en}`);
  if (s3?.tool !== "jobs.track") throw new Error("expected jobs.track after cover letter");
  if (s3.args.jobTitle !== "Senior Backend Engineer") throw new Error("jobs.track must carry the job title");

  // Step 4: tracked → interview prep.
  const s4 = computeNextAction(ctx, { tool: "jobs.track", args: { jobTitle: "Senior Backend Engineer", companyName: "NMB Bank" }, applicationId: "app_x" });
  console.log(`── Step 4: jobs.track confirmed ──`);
  console.log(`next: ${s4?.tool ?? "null"} — ${s4?.reason.en} href=${s4?.href}`);
  if (s4?.tool !== "interview.prep") throw new Error("expected interview.prep after track");
  if (s4.href !== "/interview?app=app_x") throw new Error("interview.prep must carry the application link");

  // Nothing else chains.
  const s5 = computeNextAction(ctx, { tool: "jobs.search", args: {} });
  console.log(`── Step 5: jobs.search (read) → next: ${s5?.tool ?? "null"} (no invented chain) ──`);
  if (s5 !== null) throw new Error("read-only tools must not chain");

  await db.delete(jobRecommendation).where(eq(jobRecommendation.userId, userId));
  await db.delete(job).where(eq(job.id, jobId));
  await db.delete(cv).where(eq(cv.id, cvId));
  await db.delete(profile).where(eq(profile.id, userId));
  console.log("\n✅ ORCHESTRATOR CHECK PASSED — match → tailor → cover letter → track → interview prep, one grounded chain.");
  console.log("test rows removed");
}

main().then(() => process.exit(0)).catch((err) => { console.error("❌ FAILED:", err); process.exit(1); });
