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
 * Scope: every guard below scans every source file under src/ — a bad string
 * anywhere in the app fails the build. (The calque guards used to be limited
 * to lib/templates/ while another workstream owned the rest of src; that
 * workstream is finished, so the limit is gone.)
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
// because the blurbs were generated, not written. Checked against every
// source file under src/, like the grammar checks above. "msisitizo" is
// emphasis or stress (accent lines are "mistari ya rangi"), "vibao" are planks
// or boards (UI/card blocks are "vipande"), "vidonge" are medicine tablets (UI
// pills are "mviringo"), "vitone"/"kitone" is a coinage nobody uses (a dot is
// "nukta", "dots" as a modifier is "yenye nukta"), "mbao" are planks of timber
// (a dashboard is a "dashibodi"/overview board, never "mbao za muhtasari"),
// "MANENO YA MAPENZI" is a banned all-caps literal headline, and
// "mviringo vya" is a broken agreement — "vya" has nothing to agree with once
// "mviringo" replaced a noun.
//
// NOTE on MBAO: the guard is deliberately the full phrase "Mbao za muhtasari",
// not a bare "mbao" — "mbao za matangazo" (a real notice board) is correct
// Swahili and must stay legal.
const MSISITIZO_CALQUE = /mistari ya msisitizo/i;
const VIBAO_CALQUE = /\bvibao\b/i;
const VIDONGE_CALQUE = /\bvidonge\b/i;
const VITONE_CALQUE = /\bvitone\b/i;
const KITONE_CALQUE = /\bkitone\b/i;
const MVIRINGO_VYA_CALQUE = /mviringo vya/i;
const MBAO_CALQUE = /Mbao za muhtasari/i;
const MANENO_MAPENZI_CALQUE = /MANENO YA MAPENZI/i;

// ── Loaded street vocabulary ────────────────────────────────────────────────
// The dictionary gloss makes these look right for "clever"/"shrewd" copy, but
// live Tanzanian usage carries TRICKERY. A native speaker rejected the
// button-title "Omba kwa ujanja" ("Apply smarter") on sight: "ujanja means
// tricky in the streets". In a job-application product, instructing people to
// apply by trickery is insulting and implies cheating employers.
// Wiktionary glosses ujanja "cunning, craftiness" and mjanja "a cunning /
// crafty person"; a Tanzanian interviewee in Vavrus (2015) notes mjanja "can
// mean mlaghai — a cheat or a liar". Describe the outcome instead.
const UJANJA_LOADED = /\b(ujanja|mjanja|wajanja|janja)\b/i;

// "mgusiko" is not a Swahili word at all — the noun for a touch is "mguso".
// Shipped as "Mgusiko mmoja, hakuna nywila." on the sign-in screen; the owner
// caught it. The same app coins "kitone"/"vitone" into the guard list above,
// so this is the same class of fabrication.
const MGUSIKO_COINAGE = /\bmgusiko\b/i;

// "link" sitting inside a Swahili sentence. The real word is "kiungo", which
// the rest of the app already uses ("Kiungo cha ajira", "tuma kiungo"). The
// owner corrected "tuma link" → "tuma kiungo" once already; four strings kept
// the English word.
const LINK_FOR_KIUNGO = /\blink ya\b/i;

// Naming the ATS mechanism in Swahili copy — the native mirror of the web
// lint's `ats-jargon-in-swahili` guard. Only the web tree carried this rule, so
// native shipped 15 user-visible Swahili strings with ATS in them ("Ukaguzi wa
// ATS" on the home tile, "Salama kwa ATS" as a CV preset, "Tayari kwa ATS" as a
// score band). English copy is still allowed to say "ATS".
const ATS_IN_SWAHILI = /\b(?:wa|ya|kwa|za|la|cha|na|kwenye|kikagua)\s+ATS\b/i;

// One entry per tripwire. `pattern` is the bad string; `message` names the
// pattern that tripped, the replacement to use, and the file and line, so the
// failure tells the next person exactly what to type instead.
interface CalqueGuard {
  pattern: RegExp;
  message: (match: string, file: string, line: number) => string;
}

const CALQUE_GUARDS: CalqueGuard[] = [
  {
    pattern: MSISITIZO_CALQUE,
    message: (m, file, line) => `"${m}" — calque of "accent lines": "msisitizo" is emphasis/stress, use "mistari ya rangi" in ${file}:${line}`,
  },
  {
    pattern: VIBAO_CALQUE,
    message: (m, file, line) => `"${m}" — calque of "blocks/boards": "vibao" are planks, use "vipande" in ${file}:${line}`,
  },
  {
    pattern: VIDONGE_CALQUE,
    message: (m, file, line) => `"${m}" — calque of "pills": "vidonge" are medicine tablets, use "mviringo" in ${file}:${line}`,
  },
  {
    pattern: VITONE_CALQUE,
    message: (m, file, line) => `"${m}" — coinage of "dots": "vitone" is not a Swahili word, use "nukta" or "yenye nukta" in ${file}:${line}`,
  },
  {
    pattern: KITONE_CALQUE,
    message: (m, file, line) => `"${m}" — coinage of "dot": "kitone" is not a Swahili word, use "nukta" or "yenye nukta" in ${file}:${line}`,
  },
  {
    pattern: MVIRINGO_VYA_CALQUE,
    message: (m, file, line) => `"${m}" — broken agreement: "vya" agrees with nothing after "mviringo", use "lebo za sehemu zenye mviringo" in ${file}:${line}`,
  },
  {
    pattern: MBAO_CALQUE,
    message: (m, file, line) => `"${m}" — calque of "dashboards": "mbao" are planks of timber, not a UI overview board in ${file}:${line}`,
  },
  {
    pattern: MANENO_MAPENZI_CALQUE,
    message: (m, file, line) => `"${m}" — banned all-caps word-by-word headline calque; rewrite in sentence case in ${file}:${line}`,
  },
  {
    pattern: UJANJA_LOADED,
    message: (m, file, line) => `"${m}" — loaded street word: ujanja/mjanja gloss as "cunning"/"crafty" and read as TRICKERY (mjanja can mean a cheat or a liar). Never tell a jobseeker to apply "kwa ujanja" — name the outcome instead ("Omba vyema") in ${file}:${line}`,
  },
  {
    pattern: MGUSIKO_COINAGE,
    message: (m, file, line) => `"${m}" — not a Swahili word; the noun for a touch is "mguso" ("Mguso mmoja, hakuna nywila.") in ${file}:${line}`,
  },
  {
    pattern: LINK_FOR_KIUNGO,
    message: (m, file, line) => `"${m}" — English "link" inside Swahili copy; use "kiungo" ("Bandika kiungo cha ajira", "tuma kiungo") in ${file}:${line}`,
  },
  {
    pattern: ATS_IN_SWAHILI,
    message: (m, file, line) => `"${m}" — names the ATS mechanism in Swahili copy; describe the outcome instead ("mifumo ya kuajiri", "vichujio vya waajiri", "kikagua CV", "waajiri") in ${file}:${line}`,
  },
];

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
      // Calque guards last, so the grammar checks above are reported first
      // when a single line trips both. These scan every source file, like
      // those checks — a calque anywhere in the app fails the build.
      for (const guard of CALQUE_GUARDS) {
        const match = line.match(guard.pattern);
        if (match) throw new Error(guard.message(match[0], file, i + 1));
      }
    });
  });
});
