/**
 * Static guard against a class of Swahili grammar mistakes that has shipped
 * live more than once: wrong noun-class agreement on the "-a" connective
 * ("kwa" used where "wa" was needed — "Ujuzi kwa Mauzo" instead of "Ujuzi wa
 * Mauzo") and plural verb-agreement used with a count of exactly one
 * ("Miezi 1 iliyopita" / "Wiki 1 zilizopita" instead of the singular form).
 *
 * This scans every source string in the web app for the specific known-bad
 * patterns — not a general Swahili grammar checker, just a tripwire so the
 * same two mistakes can't quietly reappear in a future string. Mirrors
 * apps/native/src/lib/swahili-lint.test.ts — extend both together.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname, resolve } from "path";

const ROOTS = ["lib", "components", "app"].map((d) => resolve(__dirname, "..", d));
const SKIP_DIRS = new Set(["node_modules", ".next"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if ([".ts", ".tsx"].includes(extname(entry)) && !entry.endsWith(".test.ts") && !entry.endsWith(".test.tsx")) {
      out.push(full);
    }
  }
  return out;
}

// U-class nouns (ujuzi, uzoefu, ...) always take "wa" as their -a connective —
// "kwa" means for/by/with, a different word entirely. Any of these directly
// followed by "kwa" is very likely this exact mistake.
const U_CLASS_NOUNS = ["ujuzi", "uzoefu", "wakati", "uongozi", "umahiri", "utaalamu", "uwezo", "uzalishaji"];
const KWA_MISUSE = new RegExp(`\\b(${U_CLASS_NOUNS.join("|")})\\s+kwa\\b`, "i");

// A count of exactly 1 paired with a plural relative-verb form
// (zilizopita/waliopita/vilivyopita/yaliyopita) instead of the singular
// (iliyopita/aliyepita/kilichopita/lililopita).
const PLURAL_WITH_ONE = /\b1\s+(zilizopita|waliopita|vilivyopita|yaliyopita)\b/i;
// A plural noun (Miezi) paired with a count of 1 — should be the singular
// noun (Mwezi) instead.
const PLURAL_NOUN_WITH_ONE = /\bMiezi\s+1\b/;

describe("Swahili grammar lint (regression guard)", () => {
  const files = ROOTS.flatMap((r) => walk(r));

  it("found source files to scan", () => {
    expect(files.length).toBeGreaterThan(200);
  });

  it("has no known-bad -a connective or plural-with-one patterns anywhere in lib/components/app", () => {
    // Line-by-line, not whole-file — lets a line that CITES the wrong
    // pattern as a documented counter-example (this file's own header, or
    // the assistant prompt's grammar-teaching block) opt out with an inline
    // "swahili-lint-ignore" marker instead of tripping the guard.
    const violations: string[] = [];
    for (const file of files) {
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        if (line.includes("swahili-lint-ignore")) return;
        const kwaMatch = line.match(KWA_MISUSE);
        const pluralMatch = line.match(PLURAL_WITH_ONE) ?? line.match(PLURAL_NOUN_WITH_ONE);
        if (kwaMatch) violations.push(`"${kwaMatch[0]}" — U-class noun + "kwa" (should be "wa") in ${file}:${i + 1}`);
        if (pluralMatch) violations.push(`"${pluralMatch[0]}" — plural agreement with a count of one in ${file}:${i + 1}`);
      });
    }
    expect(violations).toEqual([]);
  });
});
