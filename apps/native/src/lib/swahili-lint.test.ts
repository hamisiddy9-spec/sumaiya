/**
 * Static guard against a class of Swahili grammar mistakes that has shipped
 * live more than once: wrong noun-class agreement on the "-a" connective
 * ("kwa" used where "wa" was needed — "Ujuzi kwa Mauzo" instead of "Ujuzi wa
 * Mauzo") and plural verb-agreement used with a count of exactly one
 * ("Miezi 1 iliyopita" / "Wiki 1 zilizopita" instead of the singular form).
 *
 * This scans every source string in the native app for the specific known-bad
 * patterns — not a general Swahili grammar checker, just a tripwire so the
 * same two mistakes can't quietly reappear in a future string. Extend the
 * pattern lists below as new instances of the same classes are found live.
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const SRC_ROOT = join(__dirname, "..", "..", "src");
const SKIP_DIRS = new Set(["node_modules", "__tests__"]);

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
  const files = walk(SRC_ROOT);
  // Sanity check the scan itself is actually finding the codebase — a config
  // change that silently returns 0 files would make every check below a
  // false pass.
  it("found source files to scan", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it.each(files)("%s has no known-bad -a connective or plural-with-one patterns", (file) => {
    // Line-by-line, not whole-file — lets a line that CITES the wrong
    // pattern as a documented counter-example opt out with an inline
    // "swahili-lint-ignore" marker instead of tripping the guard.
    readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      if (line.includes("swahili-lint-ignore")) return;
      const kwaMatch = line.match(KWA_MISUSE);
      const pluralMatch = line.match(PLURAL_WITH_ONE) ?? line.match(PLURAL_NOUN_WITH_ONE);
      if (kwaMatch) {
        throw new Error(`"${kwaMatch[0]}" — U-class noun + "kwa" (should be "wa") in ${file}:${i + 1}`);
      }
      if (pluralMatch) {
        throw new Error(`"${pluralMatch[0]}" — plural agreement with a count of one in ${file}:${i + 1}`);
      }
    });
  });
});
