// Real-behavior verification for Task 1 (career profile as source of truth).
// Runs the EXACT code path /api/profile/backfill uses (mergeProfileFromCv +
// upsert) against the real project DB, then asserts row contents.
//
// Opt-in: only runs when RUN_DB_VERIFY=1 (needs DATABASE_URL). The regular
// suite stays green without a DB. Creates and cleans up its own test user —
// never touches real user data.
import { describe, it, expect } from "vitest";
import postgres from "postgres";
import { nanoid } from "nanoid";
import { mergeProfileFromCv, parseCvLoose } from "@/lib/career-profile/mapper";
import type { CVData } from "@/types";

const runDb = process.env.RUN_DB_VERIFY === "1";

describe.skipIf(!runDb)("career profile — real DB behavior", () => {
  it("migration + backfill + non-destructive merge work end-to-end", async () => {
    const url = process.env.DATABASE_URL!;
    const sql = postgres(url, { ssl: "require", prepare: false });
    const TEST_ID = "cp-test-" + nanoid(8);
    const cvId = "cp-test-cv-" + nanoid(6);

    const cvData: CVData = {
      personal: { fullName: "CP Test", jobTitle: "Software Engineer", email: "cp-test@example.com", phone: "0712 000 000", location: "Dar es Salaam" },
      summary: "Software engineer with 5 years building web apps.",
      experience: [{ id: "e1", company: "Acme Ltd", position: "Engineer", startDate: "2021-01", endDate: "", current: true, description: "Built platform" }],
      education: [{ id: "d1", institution: "UDSM", degree: "BSc", field: "CS", startDate: "2015", endDate: "2019" }],
      skills: [{ id: "s1", name: "TypeScript", level: 4 }, { id: "s2", name: "PostgreSQL", level: 3 }],
      certifications: [], languages: [], projects: [], referees: [], hobbies: "",
    };

    try {
      // 1. Migration applied
      const col = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='user_profile' AND column_name='career_profile'`;
      expect(col.length).toBe(1);

      // 2. Setup rows (like real signup + CV creation)
      await sql`INSERT INTO profile (id, name, email) VALUES (${TEST_ID}, 'CP Test', 'cp-test@example.com')`;
      await sql`INSERT INTO user_profile (id, full_name, email) VALUES (${TEST_ID}, 'CP Test', 'cp-test@example.com')`;
      await sql`INSERT INTO cv (id, user_id, title, data) VALUES (${cvId}, ${TEST_ID}, 'Test CV', ${cvData as unknown as string})`;

      // 3. Backfill code path — pick most complete CV (same logic as route)
      const cvs = await sql`SELECT id, data, updated_at FROM cv WHERE user_id=${TEST_ID}`;
      expect(cvs.length).toBe(1);
      const picked = parseCvLoose(cvs[0].data);
      const merged = mergeProfileFromCv(null, picked);
      expect(merged.filled.length).toBeGreaterThanOrEqual(3);
      expect(merged.profile.experience[0].company).toBe("Acme Ltd");
      expect(merged.profile.skills).toHaveLength(2);
      expect(merged.profile.factMeta?.["e1"]?.source).toBe("backfill");

      // 4. Persist (upsert — same as route)
      await sql`INSERT INTO user_profile (id, career_profile, updated_at) VALUES (${TEST_ID}, ${merged.profile as unknown as string}, now()) ON CONFLICT (id) DO UPDATE SET career_profile=EXCLUDED.career_profile, updated_at=now()`;
      const row = await sql`SELECT career_profile FROM user_profile WHERE id=${TEST_ID}`;
      expect(row[0].career_profile.experience[0].company).toBe("Acme Ltd");

      // 5. Existing CV untouched (one-way bridge)
      const cvAfter = await sql`SELECT data FROM cv WHERE id=${cvId}`;
      expect(JSON.parse(JSON.stringify(cvAfter[0].data))).toEqual(JSON.parse(JSON.stringify(cvData)));

      // 6. Non-destructive: existing facts never overwritten
      const existing = { ...merged.profile, summary: "MY OWN SUMMARY" };
      const again = mergeProfileFromCv(existing, picked);
      expect(again.profile.summary).toBe("MY OWN SUMMARY");
      expect(again.filled).toEqual([]);

      // 7. Incomplete data doesn't crash
      const junk = mergeProfileFromCv(existing, parseCvLoose({ junk: true }));
      expect(Array.isArray(junk.profile.experience)).toBe(true);

      // 8. Long CV — 500 skills survive
      const longSkills = Array.from({ length: 500 }, (_, i) => ({ id: `ls${i}`, name: `Skill ${i}`, level: 3 as const }));
      const longMerged = mergeProfileFromCv(null, parseCvLoose({ ...cvData, skills: longSkills }));
      expect(longMerged.profile.skills).toHaveLength(500);
    } finally {
      // Cleanup — never leave test rows behind
      try { await sql`DELETE FROM cv WHERE user_id=${TEST_ID}`; } catch {}
      try { await sql`DELETE FROM user_profile WHERE id=${TEST_ID}`; } catch {}
      try { await sql`DELETE FROM profile WHERE id=${TEST_ID}`; } catch {}
      await sql.end();
    }
  }, 60000);
});
