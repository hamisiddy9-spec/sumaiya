/**
 * REAL-DATA CHECK — content dedup on the real prod DB.
 *
 *   npx tsx --env-file=.env.local scripts/acceptance-content-dedup.ts
 *
 * Seeds a fresh user's Career Profile from TWO overlapping CVs (different
 * entry ids, same content: "React" skill, "Swahili" language, AWS cert,
 * Acme/Engineer/2020-01 experience) and verifies the profile contains each
 * fact EXACTLY ONCE after both merges. Test rows are deleted at the end.
 */
import { db, profile, userProfile } from "../lib/db";
import { eq } from "drizzle-orm";
import { createEmptyCVData, type CVData } from "../types";
import { ensureProfileRow, seedProfileFromCv } from "../lib/career-profile/sync";

const userId = `dedup_${Date.now()}`;

function cvA(): CVData {
  const e = createEmptyCVData();
  return {
    ...e,
    personal: { ...e.personal, fullName: "Dedup Test User", jobTitle: "Engineer", email: "dedup@test.tz", phone: "+255****1111", location: "Dar es Salaam" },
    summary: "Engineer with experience in fintech.",
    skills: [{ id: "a_sk1", name: "React", level: 4 }],
    languages: [{ id: "a_l1", name: "Swahili", proficiency: "Native" }],
    certifications: [{ id: "a_c1", name: "AWS", issuer: "Amazon", date: "2023" }],
    experience: [{ id: "a_e1", company: "Acme", position: "Engineer", startDate: "2020-01", endDate: "", current: true, description: "Built dashboards" }],
    education: [{ id: "a_ed1", institution: "UDSM", degree: "BSc", field: "CS", startDate: "2016", endDate: "2020" }],
  };
}

function cvB(): CVData {
  const e = createEmptyCVData();
  return {
    ...e,
    personal: { ...e.personal, fullName: "Dedup Test User", jobTitle: "Engineer", email: "dedup@test.tz", phone: "+255****2222", location: "Mwanza" },
    summary: "Engineer with experience in fintech and e-commerce.",
    // Same content as cvA but DIFFERENT ids (as real overlapping CVs produce)
    skills: [{ id: "b_sk9", name: "react", level: 5 }],
    languages: [{ id: "b_l9", name: "  swahili ", proficiency: "Fluent" }],
    certifications: [{ id: "b_c9", name: "AWS", issuer: "Amazon", date: "2024" }],
    experience: [{ id: "b_e9", company: "Acme", position: "Engineer", startDate: "2020-01", endDate: "", current: true, description: "Built dashboards and APIs" }],
    education: [{ id: "b_ed9", institution: "UDSM", degree: "BSc", field: "CS", startDate: "2016", endDate: "2020" }],
  };
}

async function main() {
  console.log("CONTENT-DEDUP CHECK — two overlapping CVs → real prod DB");
  console.log(`user: ${userId}`);

  await ensureProfileRow(userId);

  // 1. Seed CV A
  await seedProfileFromCv(userId, cvA(), { source: "cv:dedup_cvA", confidence: 1 });
  const [afterA] = await db.select({ careerProfile: userProfile.careerProfile }).from(userProfile).where(eq(userProfile.id, userId)).limit(1);
  const pA = afterA?.careerProfile as unknown as Record<string, unknown> | null;
  console.log("\n── After CV A ──");
  console.log("skills:", ((pA?.skills as Array<{ name: string }>) ?? []).map((s) => s.name).join(", "));
  console.log("languages:", ((pA?.languages as Array<{ name: string }>) ?? []).map((l) => l.name).join(", "));
  console.log("certs:", ((pA?.certifications as Array<{ name: string; issuer: string }>) ?? []).map((c) => `${c.name}@${c.issuer}`).join(", "));
  console.log("experience:", ((pA?.experience as Array<{ company: string; position: string; description: string }>) ?? []).map((x) => `${x.company}/${x.position}`).join(", "));

  // 2. Seed CV B (overlapping content, different ids, newer)
  await seedProfileFromCv(userId, cvB(), { source: "cv:dedup_cvB", confidence: 1 });
  const [afterB] = await db.select({ careerProfile: userProfile.careerProfile }).from(userProfile).where(eq(userProfile.id, userId)).limit(1);
  const pB = afterB?.careerProfile as unknown as Record<string, unknown> | null;
  console.log("\n── After CV B (overlap) ──");
  console.log("skills:", ((pB?.skills as Array<{ name: string }>) ?? []).map((s) => s.name).join(", "));
  console.log("languages:", ((pB?.languages as Array<{ name: string }>) ?? []).map((l) => l.name).join(", "));
  console.log("certs:", ((pB?.certifications as Array<{ name: string; issuer: string }>) ?? []).map((c) => `${c.name}@${c.issuer}`).join(", "));
  console.log("experience:", ((pB?.experience as Array<{ company: string; position: string; description: string }>) ?? []).map((x) => `${x.company}/${x.position}`).join(", "));
  console.log("education:", ((pB?.education as Array<{ institution: string }>) ?? []).map((ed) => ed.institution).join(", "));

  // 3. Assertions — every overlapping fact appears EXACTLY ONCE
  const sk = (pB?.skills as Array<{ name: string }>) ?? [];
  const lg = (pB?.languages as Array<{ name: string }>) ?? [];
  const ce = (pB?.certifications as Array<{ name: string; issuer: string }>) ?? [];
  const ex = (pB?.experience as Array<{ company: string; position: string; description: string }>) ?? [];
  const ed = (pB?.education as Array<{ institution: string }>) ?? [];
  let fail = 0;
  const check = (label: string, n: number, expected: number) => {
    const ok = n === expected;
    console.log(`${ok ? "✓" : "✗ FAIL"} ${label}: ${n} (expected ${expected})`);
    if (!ok) fail++;
  };
  check("skills count", sk.length, 1);
  check("languages count", lg.length, 1);
  check("certifications count", ce.length, 1);
  check("experience count", ex.length, 1);
  // Education has no dedup key per spec (id-merge only) — overlapping CVs with
  // different ids legitimately produce duplicates here. Report, don't fail.
  console.log(`ℹ education count (id-merge only, no dedup key per spec): ${ed.length}`);
  if (sk[0]?.name !== "React") { console.log(`✗ FAIL skill name canonical: got "${sk[0]?.name}"`); fail++; }
  if (lg[0]?.name !== "Swahili") { console.log(`✗ FAIL language name canonical: got "${lg[0]?.name}"`); fail++; }
  if ((ex[0]?.description ?? "").includes("APIs") === false) { console.log(`✗ FAIL experience fields merged: "${ex[0]?.description}"`); fail++; }
  const fm = (pB?.factMeta ?? {}) as Record<string, { source?: string }>;
  if (fm["b_sk9"]) { console.log("✗ FAIL incoming dup skill id stamped — should not exist:", fm["b_sk9"]?.source); fail++; }
  if (!fm["a_sk1"] || fm["a_sk1"]?.source !== "cv:dedup_cvB") { console.log("✗ FAIL existing skill id should be re-stamped by newer merge"); fail++; }

  console.log(fail ? `\n❌ CONTENT-DEDUP CHECK FAILED (${fail})` : "\n✅ CONTENT-DEDUP CHECK PASSED — no duplicate facts after two overlapping CVs.");

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
