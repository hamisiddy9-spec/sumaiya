/**
 * Real-data dedup proof (PR-2): fetches live sources via the registry, runs
 * the canonical dedup, and prints the collapsed groups — the evidence that
 * cross-source duplicates collapse before upsert.
 *
 *   npx tsx --env-file=.env.local scripts/proof-dedup.ts
 */
import { runAllSources } from "../lib/jobs/sources/registry";
import { dedupeJobs, canonicalKey, fuzzyKey } from "../lib/jobs/dedup";

async function main() {
  const { jobs, reports } = await runAllSources();
  console.log("[proof] sources:", JSON.stringify(reports.map((r) => `${r.source}=${r.count}`).join(", ")));

  const { jobs: canonical, collapsed, corroboratedGroups, corroboration } = dedupeJobs(jobs);
  console.log(`[proof] dedup: ${jobs.length} raw → ${canonical.length} canonical (${collapsed} collapsed, ${corroboratedGroups} corroborated by 2+ sources)`);

  if (collapsed > 0) {
    // Group raw jobs by canonical key (exact) AND fuzzy key — show collapses.
    const byKey = new Map<string, typeof jobs>();
    const byFuzzy = new Map<string, typeof jobs>();
    for (const j of jobs) {
      const k = canonicalKey(j);
      if (k) {
        const list = byKey.get(k) ?? [];
        list.push(j);
        byKey.set(k, list);
      }
      const fk = fuzzyKey(j);
      if (fk) {
        const list = byFuzzy.get(fk) ?? [];
        list.push(j);
        byFuzzy.set(fk, list);
      }
    }
    let shown = 0;
    for (const [key, group] of byKey) {
      if (group.length > 1 && shown < 5) {
        const sources = [...new Set(group.map((g) => g.source))].join(" + ");
        console.log(`  EXACT COLLAPSE → ${group[0].title} @ ${group[0].company} (${sources})`);
        console.log(`    key: ${key}`);
        for (const g of group) console.log(`      [${g.source}] ext=${g.externalId} descLen=${g.description.length}`);
        shown += 1;
      }
    }
    for (const [key, group] of byFuzzy) {
      // Only show groups that differ from exact grouping (fuzzy-only collapses).
      const exactKeys = new Set(group.map((g) => canonicalKey(g)).filter(Boolean));
      if (group.length > 1 && exactKeys.size === group.length && shown < 8) {
        const sources = [...new Set(group.map((g) => g.source))].join(" + ");
        console.log(`  FUZZY COLLAPSE → "${group[0].title}" ~ "${group[1].title}" @ ${group[0].company} (${sources})`);
        console.log(`    fkey: ${key}`);
        for (const g of group) console.log(`      [${g.source}] ext=${g.externalId} descLen=${g.description.length}`);
        shown += 1;
      }
    }
  } else {
    console.log("[proof] no cross-source collapse in this batch (sources overlap less today)");
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("[proof] failed:", e);
  process.exit(1);
});
