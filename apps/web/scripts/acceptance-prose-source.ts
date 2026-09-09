/**
 * REAL-DATA CHECK — Wave 1 Fix 1: CV-sourced prose defaults to needs-confirmation.
 *
 *   npx tsx --env-file=.env.local scripts/acceptance-prose-source.ts
 *
 * Reproduces the guest-migration / editor-save path: a CV is seeded into the
 * Career Profile with source "cv:<docId>" and NO aiDerived flag (exactly what
 * POST /api/cv and PATCH /api/cv/:id do today). Previously this stamped the AI
 * summary + experience descriptions as CONFIRMED — bypassing the trust loop.
 * After the fix, prose must land needs-confirmation while structured facts
 * (employer, skills, education) stay confirmed. Then the trust loop
 * (resolveConfirmations accept) flips prose to confirmed — user-edited wins.
 * Test rows are removed.
 */
import { db, profile, userProfile } from "../lib/db";
import { eq } from "drizzle-orm";
import { createEmptyCVData, type CVData } from "../types";
import { ensureProfileRow, seedProfileFromCv } from "../lib/career-profile/sync";
import { listPendingConfirmations, resolveConfirmations } from "../lib/career-profile/confirmations";
import { parseCareerProfile } from "../types";
import { nanoid } from "nanoid";

const userId = `prose_${Date.now()}`;
const docId = nanoid();

function migrationCv(): CVData {
  const e = createEmptyCVData();
  return {
    ...e,
    personal: { ...e.personal, fullName: "Prose Test User", jobTitle: "Data Analyst", email: "prose@test.tz", phone: "+255 700 000 000", location: "Dodoma" },
    summary: "Data analyst with 3 years building dashboards and reports for a telecom...",
    skills: [{ id: "p_sk1", name: "SQL", level: 4 }, { id: "p_sk2", name: "Power BI", level: 3 }],
    experience: [{
      id: "p_e1", company: "Tigo Tanzania", position: "Data Analyst", location: "Dar es Salaam",
      startDate: "2022-02", endDate: "", current: true,
      description: "- Built subscriber churn dashboards used by the exec team\n- Cut reporting time from days to hours",
    }],
    education: [{ id: "p_ed1", institution: "University of Dodoma", degree: "B.Sc.", field: "Statistics", startDate: "2016-09", endDate: "2020-06" }],
  };
}

async function readProfile() {
  const [row] = await db.select({ careerProfile: userProfile.careerProfile }).from(userProfile).where(eq(userProfile.id, userId)).limit(1);
  return row?.careerProfile ? parseCareerProfile(row.careerProfile) : null;
}

async function persist(profile: NonNullable<Awaited<ReturnType<typeof readProfile>>>) {
  await db.insert(userProfile).values({ id: userId, careerProfile: profile, updatedAt: new Date() } as never)
    .onConflictDoUpdate({ target: userProfile.id, set: { careerProfile: profile, updatedAt: new Date() } as never });
}

async function main() {
  console.log("FIX 1 CHECK — CV-sourced prose → needs-confirmation (guest-migration path)");
  console.log(`user: ${userId} | doc: ${docId}\n`);

  await ensureProfileRow(userId);
  // The exact provenance POST /api/cv + PATCH /api/cv/:id pass today: cv: source,
  // confidence 1, NO aiDerived.
  await seedProfileFromCv(userId, migrationCv(), { source: `cv:${docId}`, confidence: 1 });

  const seeded = await readProfile();
  if (!seeded) throw new Error("profile not seeded");
  const fm = seeded.factMeta ?? {};

  console.log("── After CV save (source cv:<docId>, no aiDerived) ──");
  console.log(`summary:            ${fm["summary"]?.status ?? "MISSING"} (expect needs-confirmation)`);
  console.log(`p_e1.description:   ${fm["p_e1.description"]?.status ?? "MISSING"} (expect needs-confirmation)`);
  console.log(`p_e1 (employer):    ${fm["p_e1"]?.status ?? "MISSING"} (expect confirmed)`);
  console.log(`p_sk1 (skill):      ${fm["p_sk1"]?.status ?? "MISSING"} (expect confirmed)`);
  console.log(`p_ed1 (education):  ${fm["p_ed1"]?.status ?? "MISSING"} (expect confirmed)`);

  const pending = listPendingConfirmations(seeded).map((p) => p.key).sort();
  console.log(`\npending confirmations: ${pending.join(", ") || "NONE"}`);
  console.log(`   (expect exactly ["p_e1.description", "summary"])`);

  const ok1 =
    fm["summary"]?.status === "needs-confirmation" &&
    fm["p_e1.description"]?.status === "needs-confirmation" &&
    fm["p_e1"]?.status === "confirmed" &&
    fm["p_sk1"]?.status === "confirmed" &&
    fm["p_ed1"]?.status === "confirmed" &&
    pending.length === 2 && pending.includes("summary") && pending.includes("p_e1.description");

  console.log(`\n✓ prose needs-confirmation + structured confirmed: ${ok1}`);
  if (!ok1) throw new Error("prose-status verification failed");

  // ── Trust loop: user accepts → user-edited confirmed ──
  const resolved = resolveConfirmations(seeded, ["summary", "p_e1.description"], "accept");
  await persist(resolved);
  const after = await readProfile();
  if (!after) throw new Error("profile lost after resolve");
  const fm2 = after.factMeta ?? {};
  console.log("\n── After trust-loop accept ──");
  console.log(`summary:          ${fm2["summary"]?.status} / ${fm2["summary"]?.source} (expect confirmed / user-edited)`);
  console.log(`p_e1.description: ${fm2["p_e1.description"]?.status} / ${fm2["p_e1.description"]?.source} (expect confirmed / user-edited)`);

  const ok2 = fm2["summary"]?.status === "confirmed" && fm2["summary"]?.source === "user-edited" &&
    fm2["p_e1.description"]?.status === "confirmed" && fm2["p_e1.description"]?.source === "user-edited" &&
    listPendingConfirmations(after).length === 0;

  console.log(`\n✓ trust loop flips prose to confirmed: ${ok2}`);
  if (!ok2) throw new Error("trust-loop verification failed");

  await db.delete(profile).where(eq(profile.id, userId));
  console.log("\n✅ FIX 1 ACCEPTANCE PASSED — CV-sourced prose enters the trust loop; structured facts stay confirmed; user confirm flips prose to confirmed.");
  console.log("test rows removed");
}

main().then(() => process.exit(0)).catch((err) => { console.error("❌ FAILED:", err); process.exit(1); });
