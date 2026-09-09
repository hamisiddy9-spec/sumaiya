/**
 * REAL-DATA CHECK — Workstream A: the confirmation trust loop on the real prod DB.
 *
 *   npx tsx --env-file=.env.local scripts/acceptance-confirmations.ts
 *
 * Simulates the full loop exactly as the surfaces do:
 *   1. a conversation build-cv seeds AI prose (summary + description) with
 *      needs-confirmation stamps (same path as /api/ai/build-cv)
 *   2. listPendingConfirmations() returns exactly those two (the same data
 *      GET /api/profile/confirmations serves)
 *   3. resolveConfirmations(..., "accept") stamps user-edited confirmed and
 *      clears the pending list (the same mutation POST
 *      /api/profile/confirmations/resolve performs)
 *   4. a second user exercises "reject": prose removed, structured facts kept
 * Test rows are deleted at the end so prod stays clean.
 */
import { db, profile, userProfile } from "../lib/db";
import { eq } from "drizzle-orm";
import { createEmptyCVData, parseCareerProfile, type CVData } from "../types";
import { ensureProfileRow, seedProfileFromCv } from "../lib/career-profile/sync";
import { listPendingConfirmations, resolveConfirmations, hasPendingConfirmations } from "../lib/career-profile/confirmations";

const userIdAccept = `cfm_accept_${Date.now()}`;
const userIdReject = `cfm_reject_${Date.now()}`;

function aiBuiltCv(): CVData {
  const e = createEmptyCVData();
  return {
    ...e,
    personal: { ...e.personal, fullName: "Confirm Test User", jobTitle: "Software Engineer", email: "cfm@test.tz", phone: "+255****4444", location: "Dar es Salaam" },
    summary: "Results-driven software engineer with 3 years building fintech platforms in Tanzania...",
    skills: [{ id: "c_sk1", name: "React", level: 4 }, { id: "c_sk2", name: "Node.js", level: 4 }],
    experience: [{
      id: "c_e1", company: "Zuri Fintech", position: "Software Engineer", location: "Dar es Salaam",
      startDate: "2022-03", endDate: "", current: true,
      description: "- Built mobile-money dashboards serving 1M+ users\n- Cut API latency by 40% through caching",
    }],
    education: [{ id: "c_ed1", institution: "University of Dar es Salaam", degree: "BSc", field: "Computer Science", startDate: "2016", endDate: "2020" }],
  };
}

async function loadProfile(userId: string) {
  const [row] = await db.select({ careerProfile: userProfile.careerProfile }).from(userProfile).where(eq(userProfile.id, userId)).limit(1);
  return row?.careerProfile ? parseCareerProfile(row.careerProfile) : null;
}

async function main() {
  console.log("CONFIRMATIONS CHECK — trust loop on the real prod DB");
  console.log(`users: ${userIdAccept} / ${userIdReject}\n`);

  // ── Seed both users exactly like /api/ai/build-cv does ──
  for (const userId of [userIdAccept, userIdReject]) {
    await ensureProfileRow(userId);
    await seedProfileFromCv(userId, aiBuiltCv(), { source: "conversation", confidence: 0.7, aiDerived: true });
  }

  // ── 1. LIST — what GET /api/profile/confirmations returns ──
  const pending = listPendingConfirmations(await loadProfile(userIdAccept));
  console.log("── After conversation seed ──");
  for (const p of pending) console.log(`${p.key}: ${p.value.slice(0, 60)}... [${p.source}]`);
  const keys = pending.map((p) => p.key).sort();
  const okList = keys.includes("summary") && keys.includes("c_e1.description") && pending.every((p) => !p.entryId || p.key.endsWith(".description"));
  console.log(`✓ pending list = ${JSON.stringify(keys)}`);
  if (!okList) throw new Error("pending list wrong: " + JSON.stringify(keys));

  // ── 2. ACCEPT — the mutation POST /confirmations/resolve performs ──
  const profileBefore = await loadProfile(userIdAccept);
  const resolved = resolveConfirmations(profileBefore, pending.map((p) => p.key), "accept");
  const still = listPendingConfirmations(resolved);
  console.log("\n── After accept (user save / confirm) ──");
  console.log(`summary stamp:   ${JSON.stringify(resolved.factMeta?.["summary"])}`);
  console.log(`description stamp: ${JSON.stringify(resolved.factMeta?.["c_e1.description"])}`);
  console.log(`employer stamp:  ${JSON.stringify(resolved.factMeta?.["c_e1"])}`);
  const okAccept =
    resolved.factMeta?.["summary"]?.status === "confirmed" &&
    resolved.factMeta?.["summary"]?.source === "user-edited" &&
    resolved.factMeta?.["c_e1.description"]?.status === "confirmed" &&
    resolved.factMeta?.["c_e1"]?.status === "confirmed" &&
    still.length === 0 &&
    resolved.summary.startsWith("Results-driven");
  console.log(`✓ accept resolved all, values kept, pending empty: ${okAccept}`);
  if (!okAccept) throw new Error("accept path failed");

  // Persist the accepted state (the resolve endpoint writes it back) and verify
  // the read-side sees zero pending — the "reflected everywhere" half.
  await db.update(userProfile).set({ careerProfile: resolved as never, updatedAt: new Date() }).where(eq(userProfile.id, userIdAccept));
  const afterSave = await loadProfile(userIdAccept);
  console.log(`✓ stored profile now has pending: ${listPendingConfirmations(afterSave).length} (expect 0)`);
  if (hasPendingConfirmations(afterSave)) throw new Error("accepted facts still pending after persist");

  // ── 3. REJECT — prose removed, structured facts kept ──
  const rejProfile = await loadProfile(userIdReject);
  const rejected = resolveConfirmations(rejProfile, listPendingConfirmations(rejProfile).map((p) => p.key), "reject");
  console.log("\n── After reject ──");
  console.log(`summary:        "${rejected.summary}" (expect empty)`);
  console.log(`description:    "${rejected.experience[0]?.description ?? ""}" (expect empty)`);
  console.log(`employer:       ${rejected.experience[0]?.company} (expect kept)`);
  const okReject =
    rejected.summary === "" &&
    rejected.experience[0]?.description === "" &&
    rejected.experience[0]?.company === "Zuri Fintech" &&
    listPendingConfirmations(rejected).length === 0;
  console.log(`✓ reject removed prose, kept facts: ${okReject}`);
  if (!okReject) throw new Error("reject path failed");

  // ── Cleanup ──
  await db.delete(profile).where(eq(profile.id, userIdAccept));
  await db.delete(profile).where(eq(profile.id, userIdReject));
  console.log("\n✅ CONFIRMATIONS CHECK PASSED — list → accept → persist → reject all verified.");
  console.log("test rows removed");
}

main().then(() => process.exit(0)).catch((err) => { console.error("❌ FAILED:", err); process.exit(1); });
