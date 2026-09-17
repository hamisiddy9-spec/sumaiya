/**
 * Static guard against a class of Swahili grammar mistakes that has shipped
 * live more than once: wrong noun-class agreement on the "-a" connective
 * ("kwa" used where "wa" was needed — "Ujuzi kwa Mauzo" instead of "Ujuzi wa
 * Mauzo") and plural verb-agreement used with a count of exactly one
 * ("Miezi 1 iliyopita" / "Wiki 1 zilizopita" instead of the singular form).
 *
 * A third class is the word-by-word calque: English design vocabulary
 * translated literally into Swahili words that mean something else. The
 * template blurbs shipped "mistari ya msisitizo" (lines of emphasis — a colour
 * "accent line" is not a stress mark), "lebo za vidonge" (medicine-tablet
 * labels — a UI pill is not a tablet), "Mbao za muhtasari" for "dashboards"
 * (mbao are planks of timber) and "MANENO YA MAPENZI" for a shouted headline.
 *
 * This scans every source string in the native app for the specific known-bad
 * patterns — not a general Swahili grammar checker, just a tripwire so the
 * same mistakes can't quietly reappear in a future string. Extend the
 * pattern lists below as new instances of the same classes are found live.
 *
 * Scope: the -a connective and plural-with-one patterns still scan every
 * source file under src/. The calque patterns scan ONLY lib/templates/ —
 * those are the generated blurb strings this lint owns.
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname, sep } from "path";

const SRC_ROOT = join(__dirname, "..", "..", "src");
// The calque guards below only cover the template blurbs, which are the
// strings this lint owns: apps/native/src/lib/templates/. Other files in the
// scan keep the pre-existing -a connective / plural-with-one coverage but are
// not scanned for calques — a guard that fails on another area's in-flight
// work blocks the build for no reason.
const TEMPLATES_DIR = join(__dirname, "templates");
function isOwnedTemplateFile(file: string): boolean {
  return file.startsWith(TEMPLATES_DIR + sep);
}
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
const U_CLASS_NOUNS = ["ujuzi", "uzoefu", "wakati", "uongozi", "umahiri", "utaalamu", "uwezo", "uzalishaji", "ufanisi"];
const KWA_MISUSE = new RegExp(`\\b(${U_CLASS_NOUNS.join("|")})\\s+kwa\\b`, "i");

// A count of exactly 1 paired with a plural relative-verb form
// (zilizopita/waliopita/vilivyopita/yaliyopita) instead of the singular
// (iliyopita/aliyepita/kilichopita/lililopita).
const PLURAL_WITH_ONE = /\b1\s+(zilizopita|waliopita|vilivyopita|yaliyopita)\b/i;
// A plural noun (Miezi) paired with a count of 1 — should be the singular
// noun (Mwezi) instead.
const PLURAL_NOUN_WITH_ONE = /\bMiezi\s+1\b/;

// Word-by-word calques of English design vocabulary into a Swahili word that
// means something else. Each was repeated across dozens of template blurbs
// because the blurbs were generated, not written. Checked against
// lib/templates/ only (see isOwnedTemplateFile above). "msisitizo" is emphasis or
// stress (accent lines are "mistari ya rangi"), "vidonge" are medicine
// tablets (UI pills are "mviringo"), "mbao" are planks of timber (a dashboard
// is a "dashibodi"/overview board, never "mbao za muhtasari"), and
// "MANENO YA MAPENZI" is a banned all-caps literal headline.
const MSISITIZO_CALQUE = /mistari ya msisitizo/i;
const VIDONGE_CALQUE = /lebo za vidonge/i;
const MBAO_CALQUE = /Mbao za muhtasari/i;
const MANENO_MAPENZI_CALQUE = /MANENO YA MAPENZI/i;

describe("Swahili grammar lint (regression guard)", () => {
  const files = walk(SRC_ROOT);
  // Sanity check the scan itself is actually finding the codebase — a config
  // change that silently returns 0 files would make every check below a
  // false pass.
  it("found source files to scan", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it.each(files)("%s has no known-bad -a connective, plural-with-one, or calque patterns", (file) => {
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
      // The calque guards below cover ONLY the strings this lint owns — the
      // generated template blurbs in lib/templates/ — so they can never fail
      // on another area's in-flight file. Placed after the checks above so
      // those keep their coverage of the whole scan.
      if (!isOwnedTemplateFile(file)) return;
      const msisitizoMatch = line.match(MSISITIZO_CALQUE);
      const vidongeMatch = line.match(VIDONGE_CALQUE);
      const mbaoMatch = line.match(MBAO_CALQUE);
      const mapenziMatch = line.match(MANENO_MAPENZI_CALQUE);
      if (msisitizoMatch) {
        throw new Error(`"${msisitizoMatch[0]}" — calque of "accent lines": "msisitizo" is emphasis/stress, use "mistari ya rangi" in ${file}:${i + 1}`);
      }
      if (vidongeMatch) {
        throw new Error(`"${vidongeMatch[0]}" — calque of "pill labels": "vidonge" are medicine tablets, use "lebo za mviringo" in ${file}:${i + 1}`);
      }
      if (mbaoMatch) {
        throw new Error(`"${mbaoMatch[0]}" — calque of "dashboards": "mbao" are planks of timber, not a UI overview board in ${file}:${i + 1}`);
      }
      if (mapenziMatch) {
        throw new Error(`"${mapenziMatch[0]}" — banned all-caps word-by-word headline calque; rewrite in sentence case in ${file}:${i + 1}`);
      }
    });
  });
});
