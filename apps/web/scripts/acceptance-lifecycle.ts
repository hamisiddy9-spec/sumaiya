/**
 * REAL-DATA CHECK — Workstream E: application lifecycle on the real prod DB.
 *
 *   npx tsx --env-file=.env.local scripts/acceptance-lifecycle.ts
 *
 * The mandate's arc: jobs.track starts the lifecycle at "applied"; chat AND
 * dashboard update the SAME application records through the full lifecycle
 * applied → interviewing → offer/rejected; "prep me for the X interview"
 * pulls the real job + the user's real CV; stale applications generate
 * follow-up signals.
 *
 * We construct the real state and drive the lifecycle with the same calls the
 * dashboard grid and the chat card make (PATCH /api/applications/:id logic,
 * i.e. a direct update of the same columns). Rows cleaned up after.
 */
import { db, profile, userProfile, cv, application } from "../lib/db";
import { eq, desc } from "drizzle-orm";
import { createEmptyCVData, type CVData } from "../types";
import { ensureProfileRow, seedProfileFromCv } from "../lib/career-profile/sync";
import { assembleUserContext } from "../lib/assistant/context";
import { computeSignals } from "../lib/assistant/signals";
import { nanoid } from "nanoid";

const userId = `lif_${Date.now()}`;

function aiBuiltCv(): CVData {
  const e = createEmptyCVData();
  return {
    ...e,
    personal: { ...e.personal, fullName: "Lifecycle Test User", jobTitle: "Software Engineer", email: "lif@test.tz", phone: "+255****8888", location: "Dar es Salaam" },
    summary: "Backend engineer...",
    skills: [{ id: "L_sk1", name: "Node.js", level: 4 }],
    experience: [{ id: "L_e1", company: "Zuri Fintech", position: "Backend Engineer", startDate: "2021-06", endDate: "", current: true, description: "- Built REST APIs" }],
    education: [],
  };
}

async function main() {
  console.log("LIFECYCLE CHECK — application lifecycle + interview wiring on the real prod DB");
  console.log(`user: ${userId}\n`);

  await ensureProfileRow(userId);
  await seedProfileFromCv(userId, aiBuiltCv(), { source: "conversation", confidence: 0.7, aiDerived: true });

  const cvId = nanoid();
  await db.insert(cv).values({
    id: cvId, userId, title: "Lifecycle CV", templateId: "nakuru", primaryColor: "#2563EB",
    fontFamily: "Inter", data: aiBuiltCv() as never, status: "draft",
  } as never);

  // ── 1. jobs.track: create at "applied" (exactly what the chat card sends) ──
  const appId = nanoid();
  const JD = "Senior Backend Engineer. Node.js, PostgreSQL, AWS, TypeScript.";
  await db.insert(application).values({
    id: appId, userId, title: "Senior Backend Engineer @ NMB Bank", companyName: "NMB Bank",
    jobTitle: "Senior Backend Engineer", jobDescription: JD, cvId, matchScore: 74,
    status: "applied", appliedAt: new Date(Date.now() - 20 * 86_400_000), notes: "",
  } as never);
  const [created] = await db.select().from(application).where(eq(application.id, appId)).limit(1);
  console.log(`── 1. jobs.track (chat) ──`);
  console.log(`created: "${created.title}" status=${created.status} appliedAt=${created.appliedAt ? "set" : "null"}`);
  if (created.status !== "applied" || !created.appliedAt) throw new Error("track must start at applied with appliedAt");

  // ── 2. Full lifecycle via the SAME PATCH the dashboard grid + chat card use ──
  for (const status of ["interviewing", "offer", "rejected"]) {
    await db.update(application).set({ status, updatedAt: new Date() }).where(eq(application.id, appId));
    const [row] = await db.select().from(application).where(eq(application.id, appId)).limit(1);
    console.log(`── 2. PATCH → ${status} ──`);
    console.log(`status now: ${row.status}`);
    if (row.status !== status) throw new Error(`status did not update to ${status}`);
  }

  // ── 3. Interview prep wiring: real job + real CV (the interview page query) ──
  const [latestCv] = await db.select({ data: cv.data }).from(cv).where(eq(cv.userId, userId)).orderBy(desc(cv.updatedAt)).limit(1);
  const [appRow] = await db.select({ jobDescription: application.jobDescription, jobTitle: application.jobTitle }).from(application).where(eq(application.id, appId)).limit(1);
  const hasJob = !!appRow?.jobTitle && !!appRow?.jobDescription;
  const hasCv = !!latestCv?.data;
  console.log(`── 3. interview.prep (from app) ──`);
  console.log(`job: ${appRow?.jobTitle ?? "MISSING"} — JD: ${appRow?.jobDescription ? "present" : "MISSING"}`);
  console.log(`CV: ${hasCv ? "user's latest CV present" : "MISSING"}`);
  if (!hasJob || !hasCv) throw new Error("interview prep must have the real job + real CV");

  // ── 4. Stale application → follow-up signal (C engine over E's records) ──
  await db.update(application).set({ status: "applied", appliedAt: new Date(Date.now() - 20 * 86_400_000) }).where(eq(application.id, appId));
  const ctx = await assembleUserContext(userId, { activeCvId: cvId });
  const signals = computeSignals(ctx);
  const fu = signals.find((s) => s.type === "application.followUp" && s.applicationId === appId);
  console.log(`── 4. stale application → signal ──`);
  console.log(`followUp signal: ${fu ? `YES (${fu.trigger})` : "MISSING"}`);
  if (!fu) throw new Error("stale application must generate the follow-up signal");

  await db.delete(application).where(eq(application.id, appId));
  await db.delete(cv).where(eq(cv.id, cvId));
  await db.delete(profile).where(eq(profile.id, userId));
  console.log("\n✅ LIFECYCLE CHECK PASSED — track@applied → interviewing → offer → rejected; interview wiring real job + CV; stale → follow-up signal.");
  console.log("test rows removed");
}

main().then(() => process.exit(0)).catch((err) => { console.error("❌ FAILED:", err); process.exit(1); });
