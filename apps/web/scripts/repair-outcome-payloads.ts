/**
 * One-time repair: outcome_event rows written before the `::jsonb` fix hold
 * their payload as a double-encoded JSON *string* (jsonb_typeof = 'string'),
 * so every `payload->>'key'` read — including the whole admin Insights page —
 * silently returned NULL. This rewrites those rows in place as real objects.
 *
 * Idempotent: rows that are already objects are left untouched.
 * Run: npx tsx --env-file=.env.local scripts/repair-outcome-payloads.ts
 */
import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function main() {
  const before = (await db.execute(sql`
    select jsonb_typeof(payload) as t, count(*)::int as n
    from outcome_event group by 1 order by n desc
  `)) as unknown as { t: string; n: number }[];
  console.log("before:", JSON.stringify(before));

  const fixed = (await db.execute(sql`
    update outcome_event
    set payload = (payload #>> '{}')::jsonb
    where jsonb_typeof(payload) = 'string'
    returning id
  `)) as unknown as { id: string }[];
  console.log(`rewrote ${Array.isArray(fixed) ? fixed.length : 0} row(s)`);

  const after = (await db.execute(sql`
    select jsonb_typeof(payload) as t, count(*)::int as n
    from outcome_event group by 1 order by n desc
  `)) as unknown as { t: string; n: number }[];
  console.log("after: ", JSON.stringify(after));

  // Proof that a key is now readable where it used to be NULL.
  const probe = (await db.execute(sql`
    select payload->>'signalType' as signal_type
    from outcome_event
    where type = 'signal.shown'
    order by created_at desc limit 3
  `)) as unknown as { signal_type: string | null }[];
  console.log("readable now:", JSON.stringify(probe));
  process.exit(0);
}

main();
