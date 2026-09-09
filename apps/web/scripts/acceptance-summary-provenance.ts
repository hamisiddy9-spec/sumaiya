/**
 * REAL-DATA CHECK — summary-provenance honesty on the real prod DB.
 *
 *   npx tsx --env-file=.env.local scripts/acceptance-summary-provenance.ts
 *
 * Simulates the conversation build-cv path exactly as /api/ai/build-cv does:
 * an AI-written CV (source "conversation", aiDerived) is seeded into a fresh
 * user's Career Profile. Verifies:
 *   - summary      → factMeta.status "needs-confirmation" (AI prose)
 *   - experience[].description → "needs-confirmation" (AI prose, per-field key)
 *   - employer/company entry   → "confirmed" (structured user fact)
 *   - a user Settings save (stampProfileAllFacts) resolves all to confirmed
 * Test rows are deleted at the end so prod stays clean.
 */
import { db, profile, userProfile } from "../lib/db";
import { eq } from "drizzle-orm";
import { createEmptyCVData, type CVData } from "../types";
import { ensureProfileRow, seedProfileFromCv } from "../lib/career-profile/sync";
import { stampProfileAllFacts } from "../lib/career-profile/mapper";

const userId = `prov_${Date.now()}`;

// The AI-shaped CV /api/ai/build-cv would produce from a chat (conversation
// about being a fintech engineer at Zuri Fintech since 2022).
function aiBuiltCv(): CVData {
  const e = createEmptyCVData();
  return {
    ...e,
    personal: { ...e.personal, fullName: "Provenance Test User", jobTitle: "Software Engineer", email: "prov@test.tz", phone: "+255****3333", location: "Dar es Salaam" },
    summary: "Results-driven software engineer with 3 years building fintech platforms in Tanzania...",
    skills: [{ id: "p_sk1", name: "React", level: 4 }, { id: "p_sk2", name: "Node.js", level: 4 }],
    experience: [{
      id: "p_e1", company: "Zuri Fintech", position: "Software Engineer", location: "Dar es Salaam",
      startDate: "2022-03", endDate: "", current: true,
      description: "- Built mobile-money dashboards serving 1M+ users\n- Cut API latency by 40% through caching",
    }],
    education: [{ id: "p_ed1", institution: "University of Dar es Salaam", degree: "BSc", field: "Computer Science", startDate: "2016", endDate: "2020" }],
  };
}

async function main() {
  console.log("SUMMARY-PROVENANCE CHECK — conversation build-cv path → real prod DB");
  console.log(`user: ${userId}`);

  await ensureProfileRow(userId);

  // 1. Seed exactly as /api/ai/build-cv does (source conversation + aiDerived).
  await seedProfileFromCv(userId, aiBuiltCv(), { source: "conversation", confidence: 0.7, aiDerived: true });
  const [row] = await db.select({ careerProfile: userProfile.careerProfile }).from(userProfile).where(eq(userProfile.id, userId)).limit(1);
  const cp = row?.careerProfile as unknown as Record<string, unknown> | null;
  if (!cp) throw new Error("FAIL: career_profile is null after conversation seed!");
  const fm = (cp.factMeta ?? {}) as Record<string, { source?: string; status?: string }>;

  console.log("\n── After conversation seed (AI-built CV) ──");
  console.log("summary:  ", JSON.stringify(fm["summary"]));
  console.log("experience entry (employer):", JSON.stringify(fm["p_e1"]));
  console.log("experience description:", JSON.stringify(fm["p_e1.description"]));
  console.log("skill:    ", JSON.stringify(fm["p_sk1"]));

  let fail = 0;
  const check = (label: string, cond: boolean, got?: unknown) => {
    console.log(`${cond ? "✓" : "✗ FAIL"} ${label}${got !== undefined ? `: ${JSON.stringify(got)}` : ""}`);
    if (!cond) fail++;
  };
  check("summary status = needs-confirmation", fm["summary"]?.status === "needs-confirmation", fm["summary"]?.status);
  check("summary source = conversation", fm["summary"]?.source === "conversation", fm["summary"]?.source);
  check("description status = needs-confirmation", fm["p_e1.description"]?.status === "needs-confirmation", fm["p_e1.description"]?.status);
  check("employer entry status = confirmed", fm["p_e1"]?.status === "confirmed", fm["p_e1"]?.status);
  check("skill status = confirmed", fm["p_sk1"]?.status === "confirmed", fm["p_sk1"]?.status);

  // 2. User later saves the profile (Settings) → preview→confirm resolves prose.
  const saved = stampProfileAllFacts(cp as never, { source: "user-edited", confidence: 1 });
  console.log("\n── After user Settings save (stampProfileAllFacts) ──");
  console.log("summary after save:      ", JSON.stringify(saved.factMeta?.["summary"]));
  console.log("description after save:  ", JSON.stringify(saved.factMeta?.["p_e1.description"]));
  check("summary resolved to confirmed", saved.factMeta?.["summary"]?.status === "confirmed", saved.factMeta?.["summary"]?.status);
  check("description resolved to confirmed", saved.factMeta?.["p_e1.description"]?.status === "confirmed", saved.factMeta?.["p_e1.description"]?.status);

  console.log(fail ? `\n❌ SUMMARY-PROVENANCE CHECK FAILED (${fail})` : "\n✅ SUMMARY-PROVENANCE CHECK PASSED — AI prose needs-confirmation, structured facts confirmed, user save resolves.");

  // Cleanup — remove test rows so prod stays clean.
  await db.delete(userProfile).where(eq(userProfile.id, userId));
  await db.delete(profile).where(eq(profile.id, userId));
  console.log("test rows removed");

  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error("\n❌ CHECK FAILED:", e.message ?? e);
  process.exit(1);
});
