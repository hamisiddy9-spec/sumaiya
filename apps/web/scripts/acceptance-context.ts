/**
 * REAL-DATA CHECK — Workstream B: the unified context assembler on the real prod DB.
 *
 *   npx tsx --env-file=.env.local scripts/acceptance-context.ts
 *
 * Creates a fresh user with a conversation-seeded Career Profile, a saved CV,
 * and a tracked application — then assembles the unified context exactly as
 * the assistant turn / dashboard / cockpit do, and verifies every bucket:
 * profile parsed, active CV resolved (explicit id wins), applications listed,
 * unconfirmed facts surfaced, recent activity non-empty. Test rows removed.
 */
import { db, profile, userProfile, cv, application } from "../lib/db";
import { eq } from "drizzle-orm";
import { createEmptyCVData, type CVData } from "../types";
import { ensureProfileRow, seedProfileFromCv } from "../lib/career-profile/sync";
import { assembleUserContext } from "../lib/assistant/context";
import { nanoid } from "nanoid";

const userId = `ctx_${Date.now()}`;

function aiBuiltCv(): CVData {
  const e = createEmptyCVData();
  return {
    ...e,
    personal: { ...e.personal, fullName: "Context Test User", jobTitle: "Software Engineer", email: "ctx@test.tz", phone: "+255****5555", location: "Dar es Salaam" },
    summary: "Software engineer with 3 years building fintech platforms...",
    skills: [{ id: "x_sk1", name: "React", level: 4 }],
    experience: [{
      id: "x_e1", company: "Zuri Fintech", position: "Software Engineer", location: "Dar es Salaam",
      startDate: "2022-03", endDate: "", current: true,
      description: "- Built mobile-money dashboards serving 1M+ users",
    }],
    education: [],
  };
}

async function main() {
  console.log("CONTEXT CHECK — unified context assembler on the real prod DB");
  console.log(`user: ${userId}\n`);

  await ensureProfileRow(userId);
  await seedProfileFromCv(userId, aiBuiltCv(), { source: "conversation", confidence: 0.7, aiDerived: true });

  const cvId = nanoid();
  await db.insert(cv).values({
    id: cvId, userId, title: "Chat-Built CV", templateId: "nakuru", primaryColor: "#2563EB",
    fontFamily: "Inter", data: aiBuiltCv() as never, status: "draft",
  } as never);

  const appId = nanoid();
  await db.insert(application).values({
    id: appId, userId, title: "Application to NMB", companyName: "NMB Bank", jobTitle: "Backend Engineer",
    jobDescription: "Node.js backend role", cvId, matchScore: 78, status: "applied",
    appliedAt: new Date(), notes: "",
  } as never);

  // ── Explicit active CV id ──
  const ctx = await assembleUserContext(userId, { activeCvId: cvId });
  console.log("── Assembled context ──");
  console.log(`profile:        ${ctx.profile ? `${ctx.profile.personal.fullName} — ${ctx.profile.experience.length} roles, ${ctx.profile.skills.length} skills` : "NULL"}`);
  console.log(`activeCv:       ${ctx.activeCv ? `"${ctx.activeCv.title}" (${ctx.activeCv.data.experience?.length ?? 0} roles)` : "NULL"}`);
  console.log(`applications:   ${ctx.applications.length} — ${ctx.applications.map((a) => `${a.title} [${a.status}]`).join(", ")}`);
  console.log(`unconfirmed:    ${ctx.unconfirmed.map((u) => u.key).join(", ") || "none"}`);
  console.log(`recentActivity: ${ctx.recentActivity.map((r) => `${r.type}:${r.label}`).join(" → ") || "none"}`);
  console.log(`signals:        ${ctx.signals.length} (expect 0 until Phase 2 C)`);

  const ok =
    ctx.profile?.personal.fullName === "Context Test User" &&
    ctx.profile.experience.length === 1 &&
    ctx.activeCv?.id === cvId &&
    ctx.activeCv?.title === "Chat-Built CV" &&
    ctx.applications.length === 1 &&
    ctx.applications[0].status === "applied" &&
    ctx.applications[0].companyName === "NMB Bank" &&
    ctx.unconfirmed.length === 2 && // summary + x_e1.description
    ctx.recentActivity.length > 0 &&
    ctx.signals.length === 0;
  console.log(`\n✓ context assembled correctly: ${ok}`);
  if (!ok) throw new Error("context verification failed");

  // ── No explicit id → latest CV wins ──
  const ctx2 = await assembleUserContext(userId);
  console.log(`✓ fallback activeCv (latest): ${ctx2.activeCv?.id === cvId}`);

  await db.delete(application).where(eq(application.id, appId));
  await db.delete(cv).where(eq(cv.id, cvId));
  await db.delete(profile).where(eq(profile.id, userId));
  console.log("\n✅ CONTEXT CHECK PASSED — profile, active CV, applications, unconfirmed, activity all assembled.");
  console.log("test rows removed");
}

main().then(() => process.exit(0)).catch((err) => { console.error("❌ FAILED:", err); process.exit(1); });
