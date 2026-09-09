/**
 * One-shot jobs ingestion for local/dev runs:
 *
 *   npx tsx --env-file=.env.local scripts/seed-jobs.ts
 *
 * Fetches from all free job sources (Remotive, Jobicy, Arbeitnow, RemoteOK,
 * Working Nomads, Himalayas, Findwork), drops scam/placeholder listings,
 * dedups against the existing feed and inserts. Also expires stale listings.
 */
import { ingestJobs } from "../lib/jobs/ingest";

async function main() {
  console.log("[seed-jobs] starting…");
  const result = await ingestJobs();
  console.log("[seed-jobs] done", JSON.stringify(result, null, 2));
  if (!result.fetched) {
    console.error("[seed-jobs] no jobs fetched from any source — network may be blocked");
    process.exitCode = 1;
  }
  // The postgres client keeps its socket open — exit explicitly so the script
  // terminates (otherwise it hangs after the work is done).
  process.exit(process.exitCode ?? 0);
}

main().catch((e) => {
  console.error("[seed-jobs] failed:", e);
  process.exitCode = 1;
});
