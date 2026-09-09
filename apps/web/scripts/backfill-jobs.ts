/**
 * One-shot backfill for job descriptions polluted by the pre-fix cleanHtml:
 * entities were decoded AFTER tag stripping, so encoded tags (`&lt;div&gt;`)
 * materialized as literal `<div>` text in the feed, and raw HTML from some
 * sources (Arbeitnow, RemoteOK, Himalayas) survived untouched.
 *
 * The upsert only rewrites CHANGED rows, so existing polluted rows would stay
 * dirty forever without this pass. Run once after deploying the fix:
 *
 *   npx tsx --env-file=.env.local scripts/backfill-jobs.ts
 *
 * Re-runnable: rows that are already clean are left untouched.
 */
import { db, job } from "../lib/db";
import { eq } from "drizzle-orm";
import { cleanHtml } from "../lib/jobs/text";

async function main() {
  const rows = await db
    .select({ id: job.id, description: job.description })
    .from(job);

  let changed = 0;
  let empty = 0;
  const updates: { id: string; description: string }[] = [];

  for (const r of rows) {
    const cleaned = cleanHtml(r.description ?? "");
    if (cleaned === (r.description ?? "")) continue;
    updates.push({ id: r.id, description: cleaned });
    if (!cleaned) empty += 1;
  }

  // Batch in chunks of 250 to stay well inside Postgres parameter limits.
  for (let i = 0; i < updates.length; i += 250) {
    const chunk = updates.slice(i, i + 250);
    for (const u of chunk) {
      await db
        .update(job)
        .set({ description: u.description, updatedAt: new Date() })
        .where(eq(job.id, u.id));
    }
  }

  changed = updates.length;
  console.log(`[backfill-jobs] total rows: ${rows.length}`);
  console.log(`[backfill-jobs] cleaned: ${changed} (${empty} became empty)`);
  console.log(`[backfill-jobs] already clean: ${rows.length - changed}`);
  if (changed > 0) {
    const sample = updates.slice(0, 3).map((u) => ({
      id: u.id,
      preview: u.description.slice(0, 100),
    }));
    console.log("[backfill-jobs] sample of cleaned rows:", JSON.stringify(sample, null, 2));
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[backfill-jobs] failed:", e);
    process.exit(1);
  });
