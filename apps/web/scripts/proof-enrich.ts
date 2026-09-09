/**
 * Real-data enrichment proof (PR-3): pick a thin job from prod and enrich it
 * on demand through the SSRF-guarded fetch, showing before/after.
 *
 *   npx tsx --env-file=.env.local scripts/proof-enrich.ts <jobId>
 */
import { enrichJob } from "../lib/jobs/enrich";
import { db, job } from "../lib/db";
import { eq } from "drizzle-orm";

async function main() {
  const jobId = process.argv[2];
  if (!jobId) {
    console.error("usage: npx tsx scripts/proof-enrich.ts <jobId>");
    process.exit(1);
  }
  const [before] = await db
    .select({ id: job.id, title: job.title, company: job.company, source: job.source, description: job.description, applyUrl: job.applyUrl })
    .from(job)
    .where(eq(job.id, jobId))
    .limit(1);
  if (!before) {
    console.error("job not found:", jobId);
    process.exit(1);
  }
  console.log("BEFORE:", JSON.stringify({
    id: before.id, title: before.title, company: before.company, source: before.source,
    applyUrl: before.applyUrl,
    descLen: (before.description || "").length,
    descPreview: (before.description || "").slice(0, 100),
  }, null, 1));

  const result = await enrichJob(jobId);
  console.log("RESULT:", JSON.stringify(result, null, 1));

  const [after] = await db
    .select({ description: job.description })
    .from(job)
    .where(eq(job.id, jobId))
    .limit(1);
  console.log("AFTER descLen:", (after?.description || "").length);
  console.log("AFTER preview:", (after?.description || "").slice(0, 300));
  process.exit(0);
}

main().catch((e) => {
  console.error("[proof-enrich] failed:", e);
  process.exit(1);
});
