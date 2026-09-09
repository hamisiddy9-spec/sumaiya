// Pin-maintenance tool for the eval harness. Measures the CURRENT engine's
// scores for every golden pair and prints the values to paste into
// evals/fixtures/golden-pairs.ts. Run when a REVIEWED scoring change lands:
//
//   npx tsx evals/probe-pins.ts
//
// If the printed values differ from the pins in the fixtures, the change is
// real — update the pins IN THE SAME PR as the scoring change (and only then).
import { matchCvToJd } from "@/lib/job-match";
import { goldenPairs } from "./fixtures/golden-pairs";

function main() {
  console.log("Golden-pair pins measured on current code:\n");
  for (const pair of goldenPairs) {
    const { score, matched, missing } = matchCvToJd(pair.cv, pair.jd);
    const pinState = score === pair.pinnedScore ? "OK" : `PIN DRIFT (was ${pair.pinnedScore})`;
    console.log(`- ${pair.name}: score=${score} [${pinState}]`);
    console.log(`  matched(${matched.length}): ${matched.slice(0, 10).join(", ") || "(none)"}`);
    console.log(`  missing(${missing.length}): ${missing.slice(0, 12).join(", ") || "(none)"}`);
    console.log("");
  }
  // Invariant sanity: the mustMatch/mustMiss lists must hold on the CURRENT
  // engine — if one fails, the fixture itself is stale.
  console.log("Semantic invariants:");
  let bad = 0;
  for (const pair of goldenPairs) {
    const { matched, missing } = matchCvToJd(pair.cv, pair.jd);
    for (const t of pair.mustMatch) {
      if (!matched.includes(t)) {
        console.log(`  ✗ ${pair.name}: expected "${t}" MATCHED but it is missing`);
        bad += 1;
      }
    }
    for (const t of pair.mustMiss) {
      if (missing.includes(t) === false && matched.includes(t)) {
        console.log(`  ✗ ${pair.name}: expected "${t}" MISSING but it is matched`);
        bad += 1;
      }
    }
  }
  if (!bad) console.log("  ✓ all invariant lists hold");
  process.exit(bad ? 1 : 0);
}

main();
