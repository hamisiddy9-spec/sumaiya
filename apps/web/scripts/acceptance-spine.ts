/**
 * ACCEPTANCE RUN — fresh new-user, end to end, against the REAL prod DB.
 *
 *   npx tsx --env-file=.env.local scripts/acceptance-spine.ts
 *
 * Simulates exactly what the shipped routes do for a brand-new user:
 *   1. sign up (create the profile parent row) — no CV, no profile facts
 *   2. build/import a CV → the /api/cv create path → seedProfileFromCv(cv:<id>)
 *   3. confirm user_profile.career_profile is populated with provenance stamps
 *   4. confirm matched jobs appear (computeRecommendations, same engine the
 *      dashboard's "Jobs zako" uses)
 *   5. iron-rule check: a user-edited fact is NOT overwritten by a CV fact
 *   6. conversation-seed check: build-cv path stamps source "conversation"
 * Test rows are deleted at the end so prod stays clean.
 */
import { db, profile, userProfile, cv } from "../lib/db";
import { eq } from "drizzle-orm";
import { createEmptyCVData, type CVData } from "../types";
import { seedProfileFromCv } from "../lib/career-profile/sync";
import { ensureProfileRow } from "../lib/career-profile/sync";
import { computeRecommendations } from "../lib/jobs/recommend";
import { mergeProfileFromCv } from "../lib/career-profile/mapper";

const userId = `accept_${Date.now()}`;
const cvId = "accept_cv_1";

function devCv(): CVData {
  const e = createEmptyCVData();
  return {
    ...e,
    personal: { ...e.personal, fullName: "Acceptance Test Dev", jobTitle: "Full-Stack Developer", email: "accept@test.tz", phone: "+255700000000", location: "Dar es Salaam" },
    summary: "Full-stack developer with 4 years building React, Node.js and PostgreSQL applications for fintech and e-commerce clients.",
    skills: [
      { id: "sk_react", name: "React", level: 4 },
      { id: "sk_node", name: "Node.js", level: 4 },
      { id: "sk_ts", name: "TypeScript", level: 3 },
      { id: "sk_pg", name: "PostgreSQL", level: 3 },
      { id: "sk_docker", name: "Docker", level: 3 },
    ],
    experience: [{ id: "ex1", company: "Mwanga Tech", position: "Full-Stack Developer", startDate: "2022-01", endDate: "", current: true, description: "Built fintech dashboards and payment APIs with React and Node.js." }],
    education: [{ id: "ed1", institution: "University of Dar es Salaam", degree: "BSc", field: "Computer Science", startDate: "2016", endDate: "2020" }],
  };
}

async function step(label: string) {
  console.log(`\n── ${label} ──`);
}

async function main() {
  console.log("ACCEPTANCE RUN — career spine, fresh user, real prod DB");
  console.log(`user: ${userId}`);

  // 1. Sign up — the auth row (profile parent) exists; NO career profile yet.
  await step("1. Fresh sign-up: profile parent row exists, no career profile");
  await ensureProfileRow(userId);
  const before = await db.select({ careerProfile: userProfile.careerProfile }).from(userProfile).where(eq(userProfile.id, userId)).limit(1);
  console.log("career_profile before CV:", JSON.stringify(before[0]?.careerProfile ?? null));

  // 2. Build/import a CV → the exact write /api/cv now performs.
  await step("2. Build a CV (create path) — seeds the profile with cv:<id>");
  const cvData = devCv();
  const seeded = await seedProfileFromCv(userId, cvData, { source: `cv:${cvId}`, confidence: 1 });
  console.log("filled sections:", JSON.stringify(seeded.filled));

  // 3. Confirm the career_profile row is populated + provenance stamps.
  await step("3. Verify career_profile is populated with provenance");
  const [row] = await db.select({ careerProfile: userProfile.careerProfile }).from(userProfile).where(eq(userProfile.id, userId)).limit(1);
  const cp = row?.careerProfile as unknown as Record<string, unknown> | null;
  if (!cp) throw new Error("FAIL: career_profile is still null after CV save!");
  const fm = (cp.factMeta ?? {}) as Record<string, { source?: string; confidence?: number; updatedAt?: string }>;
  console.log("fullName:", (cp.personal as Record<string, unknown>).fullName);
  console.log("summary set:", Boolean((cp.summary as string)?.trim()));
  console.log("skills:", ((cp.skills as Array<{ name: string }>) ?? []).map((s) => s.name).join(", "));
  console.log("experience count:", ((cp.experience as unknown[]) ?? []).length);
  console.log("factMeta.sk_react:", JSON.stringify(fm["sk_react"]));
  console.log("factMeta.personal.fullName:", JSON.stringify(fm["personal.fullName"]));
  if (fm["sk_react"]?.source !== `cv:${cvId}`) throw new Error("FAIL: entry provenance missing!");
  if (fm["personal.fullName"]?.source !== `cv:${cvId}`) throw new Error("FAIL: scalar provenance missing!");

  // 4. Matched jobs appear — the dashboard "Jobs zako" engine.
  await step("4. Matched jobs (dashboard 'Jobs zako' engine)");
  const recs = await computeRecommendations(userId, 3);
  console.log("recommendations:", recs.length);
  for (const r of recs.slice(0, 3)) {
    console.log(`  - ${r.score}% | ${r.job.title} @ ${r.job.company} | ${r.reason}`);
  }
  if (!recs.length) throw new Error("FAIL: no matched jobs for a fresh user with a CV!");

  // 5. Iron rule: user-edited fact is NOT overwritten by a newer CV fact.
  await step("5. Iron rule: user-edited location survives a newer CV save");
  const edited = devCv();
  edited.personal.location = "Mwanza"; // user later edited in Settings (stamped user-edited)
  const stamped = mergeProfileFromCv(row!.careerProfile as never, edited, {
    source: "user-edited", confidence: 1, now: new Date().toISOString(),
  });
  // Simulate: the user-edited profile is saved, then a NEW CV save happens.
  const editedProfile = { ...stamped.profile };
  const newCv = devCv();
  newCv.personal.location = "Arusha"; // the (stale) CV says Arusha
  const after = mergeProfileFromCv(editedProfile, newCv, { source: `cv:${cvId}`, confidence: 1 });
  console.log("location after user-edit + stale CV save:", after.profile.personal.location);
  if (after.profile.personal.location !== "Mwanza") throw new Error("FAIL: user-edited fact was overwritten!");

  // 6. Conversation seed (assistant build-cv path).
  await step("6. Conversation seed (assistant build-cv path)");
  const convUser = `accept_conv_${Date.now()}`;
  await ensureProfileRow(convUser);
  const convSeeded = await seedProfileFromCv(convUser, devCv(), { source: "conversation", confidence: 0.7 });
  const [convRow] = await db.select({ careerProfile: userProfile.careerProfile }).from(userProfile).where(eq(userProfile.id, convUser)).limit(1);
  const convFm = ((convRow?.careerProfile as unknown as Record<string, unknown>)?.factMeta ?? {}) as Record<string, { source?: string }>;
  console.log("conversation seed filled:", JSON.stringify(convSeeded.filled));
  console.log("factMeta.sk_react.source:", convFm["sk_react"]?.source);
  if (convFm["sk_react"]?.source !== "conversation") throw new Error("FAIL: conversation provenance missing!");

  // Cleanup — remove test rows so prod stays clean.
  await step("7. Cleanup");
  await db.delete(userProfile).where(eq(userProfile.id, userId));
  await db.delete(userProfile).where(eq(userProfile.id, convUser));
  await db.delete(profile).where(eq(profile.id, userId));
  await db.delete(profile).where(eq(profile.id, convUser));
  console.log("test rows removed");

  console.log("\n✅ ACCEPTANCE PASSED — fresh user: sign up → CV → profile populated → matched jobs appear.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("\n❌ ACCEPTANCE FAILED:", e.message ?? e);
    process.exit(1);
  });
