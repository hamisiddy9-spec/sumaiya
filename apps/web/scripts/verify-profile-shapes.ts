/**
 * Read-only audit: does every stored Career Profile actually load?
 *
 * `user_profile.career_profile` holds a JSON STRING in 12 of its 14 production
 * rows, and `parseCareerProfile` called `safeParse` without unwrapping — so it
 * silently returned an empty profile and every caller believed the user had
 * filled nothing in. The blast radius is not cosmetic: routes/jobs.ts scores
 * job matches from this value.
 *
 *   node --env-file=.env.local scripts/verify-profile-shapes.ts
 *
 * SELECT only. It never writes.
 */
import postgres from "postgres";
import { parseCareerProfile, careerProfileSchema } from "../types";
import { profileSectionCounts } from "../lib/career-profile/mapper";

const url = process.env.DATABASE_URL ?? "";

/** Total populated sections — the project's own measure of "has content". */
function sections(profile: unknown): number {
  return profileSectionCounts(profile as never).reduce((s, x) => s + x.count, 0);
}

async function main() {
  if (!url) { console.error("DATABASE_URL required"); process.exit(1); }
  const sql = postgres(url, { ssl: "require", prepare: false });

  try {
    const rows = await sql<{ id: string; career_profile: unknown }[]>`
      select id, career_profile from user_profile order by updated_at desc nulls last`;

    let stored = 0, beforeOk = 0, nowOk = 0, regressions = 0;
    const broken: string[] = [];

    console.log("");
    console.log("user".padEnd(26), "shape".padEnd(10), "before".padEnd(8), "after");
    console.log("-".repeat(62));

    for (const row of rows) {
      const raw = row.career_profile;
      const kind = raw === null ? "null" : typeof raw === "string" ? "string" : "object";

      // What the reader did BEFORE the unwrap was added.
      const legacy = careerProfileSchema.safeParse(raw).success;
      const legacySections = legacy ? sections(careerProfileSchema.safeParse(raw).data) : 0;

      const now = parseCareerProfile(raw);
      const nowSections = sections(now);

      const hasContent = nowSections > 0;
      if (kind !== "null") stored++;
      if (legacySections > 0) beforeOk++;
      if (hasContent) nowOk++;
      if (legacySections > 0 && !hasContent) regressions++;
      if (hasContent && legacySections === 0) broken.push(row.id);

      console.log(
        String(row.id).slice(0, 25).padEnd(26),
        kind.padEnd(10),
        String(legacySections).padEnd(8),
        String(nowSections),
      );
    }

    console.log("-".repeat(62));
    console.log(`rows                     : ${rows.length}`);
    console.log(`non-null stored          : ${stored}`);
    console.log(`sections BEFORE (broken) : ${beforeOk}`);
    console.log(`sections AFTER (working) : ${nowOk}`);
    console.log(`regressions              : ${regressions}`);
    if (broken.length) console.log(`\nrecovered for ${broken.length} user(s): ${broken.join(", ")}`);
  } catch (e) {
    console.error("AUDIT FAILED:", (e as Error).message);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
