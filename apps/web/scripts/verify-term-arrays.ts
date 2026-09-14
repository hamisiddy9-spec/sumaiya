/**
 * Read-only audit: do the stored term arrays survive being read?
 *
 * `job_recommendation.matched_terms` is a JSON string in 46 of 46 production
 * rows, and both readers took it with an unchecked `as string[]`. This runs the
 * real boundary helper over every stored row.
 *
 *   node --env-file=.env.local scripts/verify-term-arrays.ts
 *
 * SELECT only. It never writes.
 */
import postgres from "postgres";
import { toStringArray } from "../types";

const url = process.env.DATABASE_URL ?? "";

/** What the old code produced — a cast is a no-op at runtime. */
function legacy(value: unknown): unknown {
  return value ?? [];
}

async function main() {
  if (!url) { console.error("DATABASE_URL required"); process.exit(1); }
  const sql = postgres(url, { ssl: "require", prepare: false });

  const check = async (
    label: string,
    rows: { id: string; v: unknown }[],
  ) => {
    // Both sides must measure the SAME thing: rows that yield at least one
    // term. An earlier version counted "is an array at all" before and
    // "has terms" after — two different questions, which made a healthy column
    // look like it had gone backwards. A metric that changes shape between the
    // two sides is not evidence.
    let before = 0, after = 0, regressions = 0, badShapes = 0;
    for (const r of rows) {
      const b = legacy(r.v);
      const a = toStringArray(r.v);
      if (typeof b === "string") badShapes++;
      const beforeTerms = Array.isArray(b) ? (b as unknown[]).length : 0;
      if (beforeTerms > 0) before++;
      if (a.length > 0) after++;
      if (beforeTerms > 0 && a.length === 0) regressions++;
    }
    console.log("");
    console.log(`  ${label}`);
    console.log(`    rows                    : ${rows.length}`);
    console.log(`    stored as a STRING      : ${badShapes}`);
    console.log(`    rows WITH terms BEFORE  : ${before}`);
    console.log(`    rows WITH terms AFTER   : ${after}`);
    console.log(`    regressions             : ${regressions}`);
    if (badShapes === rows.length && rows.length > 0) {
      console.log(`    => every row was unreadable before; ${after} now carry terms`);
    }
  };

  try {
    const recs = await sql<{ id: string; v: unknown }[]>`
      select id, matched_terms as v from job_recommendation order by updated_at desc nulls last`;
    await check("job_recommendation.matched_terms", recs);

    const jobs = await sql<{ id: string; v: unknown }[]>`
      select id, corroborated_sources as v from job limit 200`;
    await check("job.corroborated_sources (first 200)", jobs);

    const snap = await sql<{ id: string; v: unknown }[]>`
      select id, checks as v from ats_score_snapshot`;
    await check("ats_score_snapshot.checks", snap);
  } catch (e) {
    console.error("AUDIT FAILED:", (e as Error).message);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
