/**
 * Static guard against the Swahili machine-translation howlers that a
 * native-speaker audit found SHIPPED in the web copy. Every pattern below was
 * live user-facing text, was fixed by hand, and had nothing stopping it from
 * coming back. This is a tripwire, not a grammar checker: it scans the web copy
 * directories for these exact known-bad strings and throws with the pattern,
 * the approved replacement, the file and the line.
 *
 * Mirrors apps/native/src/lib/swahili-lint.test.ts (same class of bug, native
 * copy) — extend both together. The two guards the previous version of this
 * file carried (-a connective "kwa" misuse, plural agreement with a count of
 * one) are kept, now in the same guard table.
 *
 * The seven audited classes, with the replacement that was applied by hand:
 *   1. "MANENO YA MAPENZI" ("words of love")      → "MANENO YA KUPENDEZA"
 *   2. "barua ya kazi" (calque "job letter")      → "barua ya maombi" (cover letter)
 *   3. "tajriba" (calque "experience")            → "uzoefu" (u-class: "wako"/"huo")
 *   4. "Wathibitishaji" / "Marejeo" (references)  → "Wadhamini"
 *   5. "ailenge" / "iipitishe" (malformed verbs)  → "ilenge" / "ipitishe"
 *   6. a Preview label reading exactly "Hakiki"   → "Onyesho" ("hakiki" = verify)
 *   7. "ATS" named directly in Swahili copy       → describe the outcome
 *      ("mifumo ya kuajiri" / "vichujio vya waajiri" / "kikagua CV"), never
 *      the mechanism. English copy may still say "ATS".
 *
 * Scope: every non-test .ts/.tsx file under apps/web/{lib,app,components}. Test
 * files are skipped deliberately — they quote user utterances and job-advert
 * input verbatim (lib/assistant/intent.test.ts asserts on the phrase "nataka
 * barua ya kazi", lib/job-match.test.ts feeds "tajriba ya miaka 3" in as scraped
 * job-ad text). That is test INPUT, not copy the app renders, so guarding it
 * would fail the build for no reason.
 *
 * Two legitimate NON-copy uses survive in non-test source files and are
 * excluded explicitly, per line, in the guard table's `skip` closures — each
 * with a comment saying why, and each scoped to (file + line content) rather
 * than the whole file, so the rest of those files is still guarded. A line that
 * merely CITES a banned string can alternatively opt out with an inline
 * "swahili-lint-ignore" marker (same escape hatch as the native lint).
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname, resolve, relative, sep } from "path";

const WEB_ROOT = resolve(__dirname, "..");
// The copy-bearing web source directories, per the audit's scope.
const ROOTS = ["lib", "components", "app"].map((d) => resolve(WEB_ROOT, d));
const SKIP_DIRS = new Set(["node_modules", ".next", ".claude", "__tests__"]);
const IGNORE_MARKER = "swahili-lint-ignore";

// Repo-relative posix path, e.g. "lib/score/explain.ts" — what the `skip`
// closures below match on, so an absolute-path or line-number shift can never
// silently disable an exclusion.
function relPath(file: string): string {
  return relative(WEB_ROOT, file).split(sep).join("/");
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (
      [".ts", ".tsx"].includes(extname(entry)) &&
      !entry.endsWith(".test.ts") &&
      !entry.endsWith(".test.tsx")
    ) {
      out.push(full);
    }
  }
  return out;
}

interface Guard {
  /** Stable id, also used to look a guard up in the precision tests below. */
  id: string;
  pattern: RegExp;
  /** Human message: what the match means + the correct replacement. */
  message: (match: string) => string;
  /** Strings this guard MUST catch (asserted in the precision tests). */
  bad: string[];
  /** Strings this guard MUST NOT catch — the corrected copy (asserted too). */
  good: string[];
  /**
   * True when this exact (relative file, line) is a DELIBERATE non-copy use of
   * the pattern — intent vocabulary or a keyword list, not text the app renders.
   * Must stay line-scoped: a file-wide exclusion would hide real copy bugs in
   * the same file.
   */
  skip?: (file: string, line: string) => boolean;
}

// U-class nouns (ujuzi, uzoefu, ...) always take "wa" as their -a connective —
// "kwa" means for/by/with, a different word entirely. Any of these directly
// followed by "kwa" is very likely this exact mistake.
const U_CLASS_NOUNS = [
  "ujuzi", "uzoefu", "wakati", "uongozi", "umahiri", "utaalamu", "uwezo", "uzalishaji",
];
const KWA_MISUSE = new RegExp(`\\b(${U_CLASS_NOUNS.join("|")})\\s+kwa\\b`, "i");

// A count of exactly 1 paired with a plural relative-verb form
// (zilizopita/waliopita/vilivyopita/yaliyopita) instead of the singular
// (iliyopita/aliyepita/kilichopita/lililopita).
const PLURAL_WITH_ONE = /\b1\s+(zilizopita|waliopita|vilivyopita|yaliyopita)\b/i;
// A plural noun (Miezi) paired with a count of 1 — should be the singular
// noun (Mwezi) instead.
const PLURAL_NOUN_WITH_ONE = /\bMiezi\s+1\b/;

const GUARDS: Guard[] = [
  {
    id: "kwa-connective",
    pattern: KWA_MISUSE,
    message: (m) =>
      `"${m}" — U-class noun followed by "kwa"; its -a connective is "wa" ("Ujuzi wa Mauzo"), while "kwa" means for/by/with`,
    bad: ["ujuzi kwa mauzo", "Uzoefu kwa kazi", "umahiri kwa lugha"],
    good: ["ujuzi wa mauzo", "Uzoefu wa kazi", "kwa ujuzi wake"],
  },
  {
    id: "plural-with-one",
    pattern: PLURAL_WITH_ONE,
    message: (m) =>
      `"${m}" — plural relative-verb agreement with a count of exactly one; use the singular form (zilizopita→iliyopita, waliopita→aliyepita, vilivyopita→kilichopita, yaliyopita→lililopita)`,
    bad: ["1 zilizopita", "1 waliopita"],
    good: ["1 iliyopita", "1 aliyepita", "2 zilizopita", "Miezi 3 zilizopita"],
  },
  {
    id: "plural-noun-with-one",
    pattern: PLURAL_NOUN_WITH_ONE,
    message: (m) =>
      `"${m}" — plural noun "Miezi" with a count of exactly one; use the singular noun "Mwezi 1"`,
    bad: ["Miezi 1"],
    good: ["Mwezi 1", "Miezi 2"],
  },
  {
    id: "maneno-ya-mapenzi",
    pattern: /\bmaneno ya mapenzi\b/i,
    message: (m) =>
      `"${m}" — word-by-word calque of "words of love" used as a headline ("mapenzi" = romantic love); the approved wording is "MANENO YA KUPENDEZA"`,
    bad: ["MANENO YA MAPENZI", "maneno ya mapenzi"],
    good: ["MANENO YA KUPENDEZA"],
  },
  {
    id: "barua-ya-kazi",
    pattern: /\bbarua ya kazi\b/i,
    message: (m) =>
      `"${m}" — literal calque of "job letter"; a cover letter is "barua ya maombi" (the app already says "Barua ya Maombi" in doc-types, the dashboard and i18n)`,
    bad: ['sw ? "Barua ya Kazi" : "Cover Letter"', "barua ya kazi"],
    good: ["Barua ya Maombi", "barua ya maombi ya kazi", "CV ya kazi"],
    // NON-COPY, excluded deliberately: this is the JSDoc on
    // ConversationState.docMode documenting the intent classifier's INPUT
    // VOCABULARY — the phrase the end user may type to ask for a cover letter.
    // It is not a string the app renders, and rewriting it would make the
    // comment lie about what the classifier actually matches.
    // (The same phrase in lib/assistant/intent.test.ts is test input; test
    // files are skipped by the walker above.)
    skip: (file, line) =>
      file === "lib/assistant/intent.ts" &&
      line.trimStart().startsWith("*") &&
      line.includes("career request"),
  },
  {
    id: "tajriba",
    pattern: /\btajriba\b/i,
    message: (m) =>
      `"${m}" — machine-translation noun for "experience"; use "uzoefu"/"Uzoefu" (u-class, so the possessive and demonstrative change with it: "kwenye uzoefu wako", "uzoefu huo" — not "uzoefu yako"/"uzoefu hiyo")`,
    bad: ["kwenye tajriba yako", "Tajriba ya miaka 3", "maelezo ya tajriba"],
    good: ["kwenye uzoefu wako", "uzoefu huo", "maelezo ya uzoefu"],
    // NON-COPY, excluded deliberately: this line is a single entry in the
    // Swahili STOP-WORD list that job-match.ts filters out of scraped
    // job-advert text ("tajriba" and "uzoefu" both appear in it, because a job
    // advert may spell experience either way). It is keyword vocabulary
    // extracted FROM a job advert, never copy the app displays — banning it
    // here would break extraction of the very word we're replacing.
    skip: (file, line) => file === "lib/job-match.ts" && line.includes('"tajriba"'),
  },
  {
    id: "references-noun",
    pattern: /\b(wathibitishaji|marejeo)\b/i,
    message: (m) =>
      `"${m}" — wrong noun for CV "references"; every CV heading and the pre-filled referee data use "Wadhamini" (see lib/i18n/cv-headings.ts, lib/career-profile/confirmations.ts)`,
    bad: ["Wathibitishaji", "Marejeo", "marejeo ya CV"],
    good: ["Wadhamini", "Mdhamini", "Ongeza Mdhamini"],
  },
  {
    id: "malformed-verb",
    pattern: /\b(ailenge|iipitishe)\b/i,
    message: (m) =>
      `"${m}" — malformed verb: an object marker duplicated onto the subject prefix; the correct forms are "ilenge" ("AI ilenge CV yako") and "ipitishe" ("ipitishe kwenye ATS")`,
    bad: ["AI ailenge CV yako", "kisha iipitishe kwenye ATS"],
    good: [
      "AI ilenge CV yako",
      "kisha ipitishe kwenye kikagua ATS",
      "Kazi unayotaka CV yako ilenge.",
    ],
  },
  {
    id: "hakiki-preview-label",
    // Only the BARE label: a quoted string that is exactly "Hakiki", or JSX
    // text that is exactly Hakiki. Prose such as "Hakiki ya moja kwa moja"
    // ("live verification") is legitimate and must not trip this.
    pattern: /(["'`])Hakiki\1|>\s*Hakiki\s*</i,
    message: (m) =>
      `"${m}" — a Preview label reading exactly "Hakiki": "hakiki" means VERIFY (to check/inspect), not "preview"; the editor's preview label is "Onyesho" (see lib/i18n/translations.ts → editor.preview)`,
    bad: ['preview: "Hakiki"', 'sw ? "Hakiki" : "Preview"', "<span>Hakiki</span>"],
    good: [
      'desc: "Hakiki ya moja kwa moja, mapendekezo ya AI"',
      '"Onyesho"',
      '"Hakikisha tangazo lina mwanga wa kutosha"',
      '"Kila rasilimali imehakikiwa"',
    ],
  },
  {
    id: "ats-jargon-in-swahili",
    // Narrow on purpose: only fires when "ATS" is directly preceded by a
    // Swahili particle/connective (or the word "kikagua"), which is the
    // shape the mechanism-naming howler actually takes ("kwa ATS", "ya ATS",
    // "kikagua ATS", …). It must not fire on English strings like "Check
    // your ATS readiness" or "ATS-ready template" that happen to live in the
    // same file.
    pattern: /\b(?:\w*kagua\s+ATS|(?:wa|ya|kwa|za|la|cha|na|kwenye)\s+ATS)\b/i,
    message: (m) =>
      `"${m}" — names the ATS mechanism directly in Swahili copy; describe the outcome instead ("mifumo ya kuajiri", "vichujio vya waajiri", "kikagua CV") — the product rule is sell the outcome, never the mechanism, and English copy is allowed to keep "ATS"`,
    bad: [
      "ikague utayari wa ATS",
      "akili ya ATS",
      "kila muundo ni rafiki kwa ATS",
      "kisha ipitishe kwenye kikagua ATS bila malipo",
      "Kagua ATS",
      "Walikagua ATS",
    ],
    good: [
      "Check your ATS readiness",
      "ATS-ready template",
      "Sumaiya checks your CV",
      "ikague kama CV yako itavuka vichujio vya waajiri",
      "kikagua CV bila malipo",
    ],
    // The two page-level `keywords:` arrays are search terms, not rendered
    // copy: a Swahili speaker looking for this tool types "alama ya ATS", so
    // the term has to stay in the page's metadata or the page stops matching
    // the query it exists to serve. Line-scoped (file + content) like every
    // other exclusion here, so the rest of both files is still guarded.
    skip: (file, line) =>
      (file === "app/[locale]/(marketing)/ats-checker/page.tsx" ||
        file === "app/[locale]/(marketing)/snap-to-apply/page.tsx") &&
      line.includes('"alama ya ATS"'),
  },
  {
    id: "loaded-street-word",
    // A word whose dictionary gloss sounds right but whose live Tanzanian
    // register is loaded. The owner rejected the button-title "Omba kwa ujanja"
    // ("Apply smarter") the moment he saw it: "ujanja means tricky in the
    // streets". A job-application product telling people to apply by trickery
    // reads as teaching them to cheat an employer, which is worse than a plain
    // mistranslation. Wiktionary glosses ujanja "cunning, craftiness" and mjanja
    // "a cunning / crafty person"; a Tanzanian interviewee quoted in Vavrus
    // (2015) adds that mjanja "can mean mlaghai — a cheat or a liar".
    // Before adopting ANY Swahili word, check its colloquial register, not just
    // its dictionary gloss.
    pattern: /\b(ujanja|mjanja|wajanja|janja)\b/i,
    message: (m) =>
      `"${m}" — loaded street word: it glosses as "cunning"/"crafty" and reads as TRICKERY (mjanja can mean a cheat or a liar). Do not tell a jobseeker to apply "kwa ujanja" — name the outcome instead ("Omba vyema")`,
    bad: ["Omba kwa ujanja", "Omba kwa mjanja", "ujanja wa kuchakachua"],
    good: ["Omba vyema", "Omba kwa uangalifu", "Tumia akili yako"],
  },
  {
    id: "fabricated-word",
    // Not a Swahili word at all. Shipped as "Mgusiko mmoja, hakuna nywila." on
    // the sign-in screen; the noun for a touch is "mguso".
    pattern: /\bmgusiko\b/i,
    message: (m) =>
      `"${m}" — not a Swahili word; the noun for a touch is "mguso" ("Mguso mmoja, hakuna nywila.")`,
    bad: ["Mgusiko mmoja, hakuna nywila.", "mgusiko"],
    good: ["Mguso mmoja, hakuna nywila.", "Gusa mara moja"],
  },
  {
    id: "link-for-kiungo",
    // English "link" inside a Swahili sentence. "kiungo" is the word the app
    // already uses everywhere else ("Kiungo cha ajira (si lazima)", "tuma
    // kiungo", "Kiungo hakitumiki tena"). The owner corrected "tuma link" ->
    // "tuma kiungo" once already; four strings kept the English word.
    pattern: /\blink ya\b/i,
    message: (m) =>
      `"${m}" — English "link" inside Swahili copy; use "kiungo" ("Bandika kiungo cha ajira", "tuma kiungo")`,
    bad: ["Bandika link ya ajira", "Link ya ajira"],
    good: ["Bandika kiungo cha ajira", "Kiungo cha ajira", "tuma kiungo"],
  },
];

function guardById(id: string): Guard {
  const guard = GUARDS.find((g) => g.id === id);
  if (!guard) throw new Error(`no such guard: ${id}`);
  return guard;
}

describe("Swahili copy lint (regression guard)", () => {
  // [repo-relative path, absolute path] pairs — building them once keeps the
  // per-file lookup O(1) and lets the failure message name the path a
  // developer sees in their editor.
  const cases: [string, string][] = ROOTS.flatMap((r) => walk(r)).map((f) => [relPath(f), f]);

  // Sanity check the scan itself is actually finding the codebase — a config
  // change that silently returns 0 files would make every check below a
  // false pass.
  it("found source files to scan", () => {
    expect(cases.length).toBeGreaterThan(200);
    expect(cases.map(([rel]) => rel)).toContain("lib/i18n/translations.ts");
  });

  it.each(cases)(
    "%s has no known-bad Swahili copy pattern",
    (rel, file) => {
      // Line-by-line, not whole-file — lets a line that CITES the wrong
      // pattern as a documented counter-example opt out with an inline
      // "swahili-lint-ignore" marker instead of tripping the guard.
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (line.includes(IGNORE_MARKER)) return;
          for (const guard of GUARDS) {
            const match = line.match(guard.pattern);
            if (!match) continue;
            if (guard.skip?.(rel, line)) continue;
            throw new Error(`${guard.message(match[0])} — in ${rel}:${i + 1}`);
          }
        });
    }
  );
});

describe("guard precision (the corrected copy must never trip a guard)", () => {
  it.each(GUARDS)("$id matches its bad samples and none of its good ones", (guard) => {
    for (const bad of guard.bad) {
      expect(guard.pattern.test(bad), `expected ${guard.id} to MATCH: ${bad}`).toBe(true);
    }
    for (const good of guard.good) {
      expect(guard.pattern.test(good), `expected ${guard.id} NOT to match: ${good}`).toBe(false);
    }
  });

  // The corrected forms are all over the copy today; if a guard above started
  // matching one of them the walk would fail on ~40 template/editor files, so
  // assert the three narrow-looking patterns directly.
  it("the malformed-verb guard does not fire on the correct verbs already in the copy", () => {
    const g = guardById("malformed-verb");
    for (const line of [
      'sw: "Kazi unayotaka CV yako ilenge."',
      '"Anza na Nakuru, kisha ipitishe kwenye kikagua ATS bila malipo na uone alama mwenyewe."',
      'placeholder={sw ? "Bandika maelezo ya kazi hapa ili barua ilenge kazi hii…" : ""}',
    ]) {
      expect(g.pattern.test(line), `must not match: ${line}`).toBe(false);
    }
  });

  it("the Hakiki guard only fires on the bare label, not on verify-prose", () => {
    const g = guardById("hakiki-preview-label");
    expect(g.pattern.test('desc: "Miundo ya kitaalamu inayopita ATS. Hakiki ya moja kwa moja."')).toBe(false);
    expect(g.pattern.test('"Hakiki ya moja kwa moja, mapendekezo ya AI, PDF kamili."')).toBe(false);
    expect(g.pattern.test('preview: "Hakiki",')).toBe(true);
  });
});

describe("deliberate non-copy exclusions stay line-scoped, not file-wide", () => {
  // If either exclusion were ever widened to "skip this whole file", a real
  // howler re-introduced elsewhere in that file would sail through. These
  // assertions pin the exclusions to the exact legitimate line.
  it("excludes the intent classifier's documented input phrase only", () => {
    const g = guardById("barua-ya-kazi");
    expect(
      g.skip!(
        "lib/assistant/intent.ts",
        '   * OR derived from an explicit career request ("nataka CV", "barua ya kazi"…)'
      )
    ).toBe(true);
    expect(g.skip!("lib/assistant/intent.ts", 'sw ? "Barua ya Kazi" : "Cover Letter"')).toBe(false);
    expect(g.skip!("components/assistant/cv-assistant-client.tsx", '"barua ya kazi"')).toBe(false);
  });

  it("excludes the job-match stop-word line only", () => {
    const g = guardById("tajriba");
    expect(
      g.skip!(
        "lib/job-match.ts",
        '  "kazi", "ajira", "mwajiri", "kampuni", "biashara", "timu", "ujuzi", "tajriba",'
      )
    ).toBe(true);
    expect(g.skip!("lib/job-match.ts", "detailSw: `… kwenye tajriba yako.`")).toBe(false);
    expect(g.skip!("lib/score/explain.ts", "… maelezo ya tajriba …")).toBe(false);
  });
});

// ── Voice agreement on the user's OWN objects (web mirror) ──────────────────
/**
 * The defect: the native home screen's tile read "CV zako" (your CV) while the
 * screen it opens was headed "CV zangu" (my CVs) — one feature named in the
 * second person on one surface and the first person on the other, which reads
 * as two products. The web carried the same split ("CV Zangu" as the dashboard
 * tab and heading, "My CVs" as its English twin) while its own prose said
 * "Simamia nyaraka zako zote" and "Unda CV yako ya kwanza".
 *
 * Both voices are correct Swahili — "CV" is a borrowed noun taking zi-agreement,
 * so "CV zako" and "CV zangu" are equally grammatical. This is a VOICE fault,
 * not a grammar fault, and only the PAIR of strings is wrong; hence the check is
 * per noun over the whole scanned corpus, not per string.
 *
 * The house voice is the SECOND person: chrome speaks TO the user about the
 * user's own things ("CV zako", "wasifu wako", "maombi yako", "akaunti yako"),
 * and the assistant does the same when she speaks for herself ("nimeandaa CV
 * yako"). Measured across native + web copy on 2026-09-20: 456 second-person
 * occurrences against 31 first-person. First person survives in exactly four
 * places, each written down below:
 *
 *   1. the user's own words — a message they send, a prompt they issue;
 *   2. the user's own consent — the affirmative control of a confirm dialog;
 *   3. the user's own questions — FAQ entries phrased as the user asking;
 *   4. the user's own authored text — a letter body, and share/invite messages
 *      that carry the user's name to a third party;
 * plus text that is never rendered (assistant prompt scaffolding).
 *
 * The exemption list IS the tolerance: it is bounded by
 * MAX_FIRST_PERSON_EXEMPT, so it cannot be grown into a list of every string,
 * and every entry must still match a live occurrence — a stale exemption fails
 * this suite too. Mirrors apps/native/src/lib/swahili-lint.test.ts.
 */
const USER_OBJECT_NOUNS = [
  "CV", "wasifu", "maombi", "kazi", "akaunti", "nyaraka", "waraka", "picha",
  "barua", "ujuzi", "uzoefu", "taarifa", "alama", "historia", "maelezo",
  "jina", "simu", "kiungo", "nafasi",
];
const FIRST_PERSON_POSS = "zangu|yangu|wangu|langu|changu|pangu|vyangu|mwangu|kwangu";
const SECOND_PERSON_POSS = "zako|yako|wako|lako|chako|pako|vyako|mwako|kwako";
const NOUN_WITH_POSSESSIVE = new RegExp(
  `\\b(${USER_OBJECT_NOUNS.join("|")})\\b\\s+(${FIRST_PERSON_POSS}|${SECOND_PERSON_POSS})\\b`,
  "gi",
);
const IS_FIRST_PERSON = new RegExp(`^(?:${FIRST_PERSON_POSS})$`, "i");
const MAX_FIRST_PERSON_EXEMPT = 20;

interface VoiceExemption {
  /** Repo-relative path suffix (posix). */
  file: string;
  /** Substring the exempt line must contain. */
  contains: string;
  /** Why the first person is right here. Required — shown on failure. */
  why: string;
}

const FIRST_PERSON_EXEMPT: VoiceExemption[] = [
  {
    file: "lib/i18n/translations.ts",
    contains: "yesDelete",
    why: "the affirmative control of a confirm dialog is the user's own consent (\"Ndiyo, futa akaunti yangu\" — the English slot does the same: \"Yes, delete my account\")",
  },
  {
    file: "components/settings/settings-form.tsx",
    contains: "yesDelete",
    why: "same consent control, second copy of it",
  },
  {
    file: "lib/pdf-tools.ts",
    contains: "q: { en:",
    why: "FAQ question written in the user's own voice",
  },
  {
    file: "app/[locale]/(marketing)/contact/page.tsx",
    contains: "CV yangu itapita",
    why: "link label phrased as the question the user is asking (\"Will my CV pass ATS systems?\")",
  },
  {
    file: "components/assistant/cv-assistant-client.tsx",
    contains: 'content: sw ? "Kagua CV yangu"',
    why: 'message stamped role:"user" — this is what the user says to Sumaiya, not chrome',
  },
  {
    file: "components/assistant/cv-assistant-client.tsx",
    contains: "Onyesha kazi zinazofanana na wasifu wangu",
    why: "prompt sent as the user's own message",
  },
  {
    file: "components/dashboard/application-workspace.tsx",
    contains: "Nina hamu ya kujadili",
    why: "cover-letter body written in the applicant's voice — the letter IS the user speaking",
  },
  {
    file: "components/editor/cross-sell-banner.tsx",
    contains: "Nina hamu ya kujadili",
    why: "same letter body, second copy",
  },
  {
    file: "components/editor/cover-letter-editor-client.tsx",
    contains: "Barua yangu ya maombi",
    why: "share title + share text the user sends to a recipient",
  },
  {
    file: "components/editor/letter-editor-client.tsx",
    contains: '"Barua yangu',
    why: "share title + share text the user sends to a recipient",
  },
  {
    file: "components/editor/share-cv-modal.tsx",
    contains: "Angalia CV yangu",
    why: "WhatsApp share text written in the user's voice",
  },
  {
    file: "components/referral/referral-card.tsx",
    contains: "Nimekuwa nikitumia Sumaiya",
    why: "referral message the user sends to a friend",
  },
  {
    file: "lib/snap-share.ts",
    contains: "CV yangu",
    why: "share card text the sender sends on (their own words reaching a third party)",
  },
  {
    file: "lib/snap-strings.ts",
    contains: "shareSheetTitle",
    why: "the title that travels with the shared card — the sender's own words",
  },
  {
    file: "lib/assistant/intent.ts",
    contains: "kazi yangu",
    why: "never rendered: assistant prompt scaffolding quoting an example user utterance",
  },
];

const voiceHits = ROOTS.flatMap((root) => walk(root)).flatMap((file) => {
  const rel = relPath(file);
  return readFileSync(file, "utf8")
    .split("\n")
    .flatMap((line, i) => {
      if (line.includes(IGNORE_MARKER)) return [];
      const trimmed = line.trimStart();
      // A comment is not copy: the guard is about what a user reads.
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return [];
      return [...line.matchAll(NOUN_WITH_POSSESSIVE)].map((m) => ({
        noun: m[1],
        poss: m[2],
        firstPerson: IS_FIRST_PERSON.test(m[2]),
        file: rel,
        line: i + 1,
        text: line.trim(),
        exemption: FIRST_PERSON_EXEMPT.find((e) => rel.endsWith(e.file) && line.includes(e.contains)),
      }));
    });
});

describe("voice agreement on the user's own objects (web zako/zangu guard)", () => {
  it("scanned a real corpus of possessive constructions", () => {
    expect(voiceHits.length).toBeGreaterThan(100);
    expect(voiceHits.filter((h) => h.firstPerson).length).toBeGreaterThan(5);
  });

  it("names no user object in both a first-person and a second-person possessive", () => {
    const byNoun = new Map<string, typeof voiceHits>();
    for (const hit of voiceHits) {
      const key = hit.noun.toLowerCase();
      byNoun.set(key, [...(byNoun.get(key) ?? []), hit]);
    }
    const mixed: string[] = [];
    for (const [noun, list] of byNoun) {
      const second = list.filter((h) => !h.firstPerson);
      const first = list.filter((h) => h.firstPerson && !h.exemption);
      if (!second.length || !first.length) continue;
      mixed.push(
        `"${noun}" is named in BOTH voices.\n` +
          `  second person (the house voice, ${second.length}x, first at ${second[0].file}:${second[0].line}): "${noun} ${second[0].poss}"\n` +
          `  first person WITHOUT an exemption (${first.length}x):\n` +
          first.map((h) => `    ${h.file}:${h.line}  ${h.text}`).join("\n") +
          `\n  Rewrite to "${noun} ${second[0].poss}", or add an entry to FIRST_PERSON_EXEMPT saying why the user's own voice is intended here.`,
      );
    }
    expect(mixed).toEqual([]);
  });

  it("keeps every first-person exemption live — a stale one fails too", () => {
    const used = new Set(
      voiceHits.filter((h) => h.exemption).map((h) => `${h.exemption!.file}|${h.exemption!.contains}`),
    );
    const dead = FIRST_PERSON_EXEMPT.filter((e) => !used.has(`${e.file}|${e.contains}`))
      .map((e) => `${e.file} :: ${e.contains} (${e.why})`);
    expect(dead).toEqual([]);
  });

  it("keeps the exemption list a tolerance, not a blanket ban", () => {
    expect(FIRST_PERSON_EXEMPT.length).toBeLessThanOrEqual(MAX_FIRST_PERSON_EXEMPT);
    const first = voiceHits.filter((h) => h.firstPerson);
    expect(voiceHits.length).toBeGreaterThan(0);
    expect(first.length / voiceHits.length).toBeLessThan(0.15);
  });
});
