// Nightly production eval job (system blueprint — Stage 2 "eval sample").
//
//   DATABASE_URL="postgres://..." npx tsx scripts/run-prod-evals.ts [--limit=500] [--dry]
//
// run-tool samples a small fraction of real generative tool IO into
// `eval_sample` (PII-free: the user is a hash). This job re-runs the
// deterministic anti-fabrication / language-fidelity / repeat suites against
// that live traffic and writes a verdict per row, so a quality regression that
// slips past the merge-gate evals shows up here within a day.
//
// It is a REPORT, not a gate: it exits 0 on a clean run and exits 1 only when
// the flag rate crosses FLAG_RATE_ALARM, so the scheduled workflow goes red
// and pages nobody but is visible on the Actions tab.

import { eq, isNull, sql as dsql } from "drizzle-orm";
import { db, evalSample } from "@/lib/db";
import { verifyAiContent } from "@/lib/career-profile/evidence";
import { parseCvLoose } from "@/lib/career-profile/mapper";
import { replySimilarity, REPEAT_SIMILARITY_THRESHOLD } from "@/lib/assistant/repeat-guard";
import {
  scoreLanguageFidelity,
  LANGUAGE_PASS_THRESHOLD,
} from "@/evals/lib/rubric";
import type { CVData } from "@/types";

const LIMIT = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? 500);
const DRY = process.argv.includes("--dry");
const FLAG_RATE_ALARM = Number(process.env.EVAL_FLAG_RATE_ALARM ?? 0.15);

type CheckResult = { name: string; pass: boolean; detail?: string };

function pickText(output: unknown): string {
  if (typeof output === "string") return output;
  if (!output || typeof output !== "object") return "";
  const o = output as Record<string, unknown>;
  const direct = o.text ?? o.summary ?? o.content ?? o.reply ?? o.enhanced ?? o.body;
  if (typeof direct === "string") return direct;
  // tailor-shaped: { summary, experience: [{ description }] }
  const parts: string[] = [];
  if (typeof o.summary === "string") parts.push(o.summary);
  if (Array.isArray(o.experience)) {
    for (const e of o.experience) {
      if (e && typeof e === "object" && typeof (e as Record<string, unknown>).description === "string") {
        parts.push((e as Record<string, unknown>).description as string);
      }
    }
  }
  return parts.join("\n");
}

function expectedLang(input: Record<string, unknown>): "sw" | "en" | null {
  if (input.lang === "sw" || input.lang === "en") return input.lang;
  if (typeof input.sw === "boolean") return input.sw ? "sw" : "en";
  return null;
}

function referenceCv(input: Record<string, unknown>): CVData | null {
  const raw = input.cv ?? input.currentCv ?? input.baseCv;
  if (raw && typeof raw === "object") {
    try {
      return parseCvLoose(raw as Record<string, unknown>) as unknown as CVData;
    } catch {
      return null;
    }
  }
  return null;
}

function evaluate(row: typeof evalSample.$inferSelect): { verdict: "pass" | "flag" | "skip"; checks: CheckResult[] } {
  const input = (row.input ?? {}) as Record<string, unknown>;
  const output = row.output ?? {};
  const text = pickText(output).trim();
  const checks: CheckResult[] = [];

  if (text.length >= 40) {
    const lang = expectedLang(input);
    if (lang) {
      const score = scoreLanguageFidelity(text, lang);
      checks.push({
        name: "language",
        pass: score >= LANGUAGE_PASS_THRESHOLD,
        detail: `score=${score.toFixed(2)} expected=${lang}`,
      });
    }

    const cv = referenceCv(input);
    if (cv) {
      const report = verifyAiContent(text, [], cv);
      checks.push({
        name: "fabrication",
        pass: report.allSupported,
        detail: report.allSupported
          ? undefined
          : `unconfirmed: ${report.unconfirmed.map((c) => c.kind + ":" + c.claim).slice(0, 5).join(", ")}`,
      });
    }
  }

  // repeat: input may carry the prior assistant turn(s)
  const priors = Array.isArray(input.priorReplies) ? (input.priorReplies as unknown[]).filter((x): x is string => typeof x === "string") : [];
  if (priors.length && text) {
    const maxSim = Math.max(...priors.map((p) => replySimilarity(text, p)));
    checks.push({
      name: "repeat",
      pass: maxSim < REPEAT_SIMILARITY_THRESHOLD,
      detail: `maxSim=${maxSim.toFixed(2)}`,
    });
  }

  if (!checks.length) return { verdict: "skip", checks };
  return { verdict: checks.every((c) => c.pass) ? "pass" : "flag", checks };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is required");
    process.exit(1);
  }

  const rows = await db
    .select()
    .from(evalSample)
    .where(isNull(evalSample.evaluatedAt))
    .limit(LIMIT);

  if (!rows.length) {
    console.log("✅ No pending eval samples.");
    return;
  }

  const tally: Record<string, { pass: number; flag: number; skip: number }> = {};
  let flagged = 0;
  let scored = 0;

  for (const row of rows) {
    const { verdict, checks } = evaluate(row);
    tally[row.tool] ??= { pass: 0, flag: 0, skip: 0 };
    tally[row.tool][verdict] += 1;
    if (verdict === "flag") {
      flagged += 1;
      console.log(`  ⚠  ${row.tool} ${row.id}: ${checks.filter((c) => !c.pass).map((c) => c.name + " (" + (c.detail ?? "") + ")").join("; ")}`);
    }
    if (verdict !== "skip") scored += 1;

    if (!DRY) {
      await db
        .update(evalSample)
        .set({
          verdict,
          verdictDetail: { checks, evaluatedBy: "nightly", at: new Date().toISOString() },
          evaluatedAt: dsql`now()`,
        })
        .where(eq(evalSample.id, row.id));
    }
  }

  console.log("\n── nightly prod evals ──");
  for (const [tool, t] of Object.entries(tally)) {
    console.log(`  ${tool.padEnd(24)} pass=${t.pass} flag=${t.flag} skip=${t.skip}`);
  }
  const flagRate = scored ? flagged / scored : 0;
  console.log(`\n  ${rows.length} samples · ${scored} scored · ${flagged} flagged · flag rate ${(flagRate * 100).toFixed(1)}%`);
  if (DRY) console.log("  (dry run — no rows updated)");

  if (flagRate > FLAG_RATE_ALARM && scored >= 20) {
    console.error(`\n❌ flag rate ${(flagRate * 100).toFixed(1)}% > alarm ${(FLAG_RATE_ALARM * 100).toFixed(0)}%`);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
