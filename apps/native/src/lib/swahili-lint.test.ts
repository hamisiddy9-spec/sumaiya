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
import { join, extname, relative, sep } from "path";

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
//
// `kagua` was added 2026-09-20: the alternation had `kikagua` but not `kagua`,
// so a quick-action chip reading "Kagua ATS" in
// src/hooks/use-sumaiya-chat.ts sailed past the guard — the same class of
// string this pattern exists to stop. (The string is now "Kagua CV".)
//
// The verb half became `\w*kagua` for the same reason: "Walikagua ATS" (the
// admin campaign funnel's Swahili label) has the verb inflected with a subject
// prefix, so a bare `kagua` alternative never matched it either.
const ATS_IN_SWAHILI = /\b(?:\w*kagua\s+ATS|(?:wa|ya|kwa|za|la|cha|na|kwenye)\s+ATS)\b/i;

// A bare "nafasi" where the word means a JOB. Owner's instruction, verbatim:
// "isiwe nafasi kwakomiwe nafasi za kazi tu". Swahili "nafasi" alone can mean
// space, room, a chance or a seat as well as a job opening, so a label reading
// only "Nafasi" leaves the reader guessing which one is meant; where the job
// sense is meant it has to say "nafasi za kazi" / "nafasi ya kazi".
//
// Deliberately a CLOSED SET of the exact labels that were wrong, NOT a bare
// /\bNafasi\b/. "nafasi" is correct Swahili for whitespace ("Bila rangi.
// Muundo na nafasi tu.", ~30 template blurbs) and for a seat ("Nafasi 50
// zimechukuliwa", early-access places), so a broad guard would fail the build
// on correct copy — the opposite of useful.
const BARE_NAFASI_FOR_A_JOB = /"(Nafasi kwako|Nafasi zote|Nafasi mpya|Nafasi mpya zinazokufaa|Hakuna nafasi kwa sasa)"/;

// "Fonti" is a calque of "Font" — Swahili does not form a noun by adding -i. The
// word is "Herufi" (letters / type). English keeps "Font" so the mapping is
// learnable, which is exactly why the Swahili side must not be the English word.
const FONTI_CALQUE = /\bfonti\b/i;
// "Msongamano" is congestion / crowding; the owner's word for CV density is
// "Ujazo" (fill / volume), and the English side keeps "Density". Only the LABEL
// forms are caught: "bila msongamano" ("without clutter") in
// src/lib/template-suggestions.ts is correct prose and must stay legal.
const MSONGAMANO_DENSITY_CALQUE = /\bMsongamano\s*:|Msongamano wa (compact|airy|normal|kubana|kawaida)/i;

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
    message: (m, file, line) => `"${m}" — names the ATS mechanism in Swahili copy; describe the outcome instead ("mifumo ya kuajiri", "vigezo vya waajiri", "kikagua CV", "waajiri") in ${file}:${line}`,
  },
  {
    pattern: BARE_NAFASI_FOR_A_JOB,
    message: (m, file, line) => `"${m}" — a bare "nafasi" does not say whether it means a job or a space; where the job sense is meant write "Nafasi za kazi …" / "nafasi ya kazi" in ${file}:${line}`,
  },
  {
    pattern: FONTI_CALQUE,
    message: (m, file, line) => `"${m}" — calque of "Font": use "Herufi" in ${file}:${line}`,
  },
  {
    pattern: MSONGAMANO_DENSITY_CALQUE,
    message: (m, file, line) => `"${m}" — "msongamano" is congestion; the CV density label is "Ujazo" (English keeps "Density") in ${file}:${line}`,
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

// ── Voice agreement on the user's OWN objects ───────────────────────────────
/**
 * The defect this guards: the home screen's tile read "CV zako" (your CV) and
 * the screen it opens was headed "CV zangu" (my CVs) — the same feature named
 * in the second person on one surface and the first person on the other, which
 * reads as two different products. Seen on the device, 2026-09-20.
 *
 * Both strings are correct Swahili. "CV" is a borrowed noun taking zi-
 * agreement, so "zako" and "zangu" are equally grammatical: this is a VOICE
 * fault, not a grammar fault, and the grammar checks above cannot see it. Only
 * the PAIR of strings is wrong, so the check is per noun over the whole corpus.
 *
 * The house voice is the SECOND person — chrome speaks TO the user about the
 * user's own things ("CV zako", "wasifu wako", "maombi yako", "akaunti yako").
 * The measurement behind that choice, taken across native + web copy on
 * 2026-09-20, was 456 second-person occurrences against 31 first-person, and
 * the assistant herself does the same thing when she speaks for herself
 * ("nimeandaa CV yako"). First person on the user's own objects survives in
 * exactly four places, and each one is written down in FIRST_PERSON_EXEMPT:
 *
 *   1. the user's own words — a message they send, a prompt they issue;
 *   2. the user's own consent — the affirmative control of a confirm dialog
 *      ("Ndiyo, futa akaunti yangu");
 *   3. the user's own questions — FAQ entries phrased as the user asking;
 *   4. the user's own authored text — a document/letter body, share and invite
 *      messages that carry the user's name to a third party.
 *
 * The exemption list is the tolerance: it is bounded by
 * MAX_FIRST_PERSON_EXEMPT (so it cannot quietly become a list of every string)
 * and every entry must still match a live occurrence — a stale exemption fails
 * this suite too. Anything first-person that is NOT on the list, on a noun the
 * product also names in the second person, fails.
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
  /** Path relative to src/, matched as a suffix (posix separators). */
  file: string;
  /** Substring the exempt line must contain. */
  contains: string;
  /** Why the first person is right here. Required — it is shown on failure. */
  why: string;
}

const FIRST_PERSON_EXEMPT: VoiceExemption[] = [
  {
    file: "lib/courses.ts",
    contains: "Niandikie sehemu fupi",
    why: "practice prompt the learner sends to Sumaiya verbatim",
  },
  {
    file: "screens/app/help-faq-screen.tsx",
    contains: "q: { en:",
    why: "FAQ question written in the user's own voice (the English slot does the same: \"How do I delete my account?\")",
  },
  {
    file: "screens/invite-screen.tsx",
    contains: "Natumia Sumaiya kutengeneza CV yangu",
    why: "invite message the user sends, carrying the user's own name",
  },
  {
    file: "screens/learning-hub-screen.tsx",
    contains: "Niboresheje CV yangu",
    why: "suggested question rendered as the question the user would ask",
  },
  {
    file: "screens/sumaiya-chat-screen.tsx",
    contains: 't("My CV", "CV yangu")',
    why: "the jobseeker's CV pasted into the chat as their own message body",
  },
  {
    file: "screens/sumaiya-chat-screen.tsx",
    contains: "Nisaidie kutengeneza CV yangu.",
    why: "the message the user sends when they tap the Build-my-CV chip",
  },
];

const voiceHits = walk(SRC_ROOT).flatMap((file) => {
  const rel = relative(SRC_ROOT, file).split(sep).join("/");
  return readFileSync(file, "utf8")
    .split("\n")
    .flatMap((line, i) => {
      if (line.includes("swahili-lint-ignore")) return [];
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

describe("voice agreement on the user's own objects (zako/zangu regression guard)", () => {
  it("scanned a real corpus of possessive constructions", () => {
    // A regex or walker that silently stops matching would make every check
    // below a false pass — same reason as the "found source files" check above.
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
    // The exempted first-person occurrences must stay a small fraction of the
    // corpus they are exempted inside.
    const first = voiceHits.filter((h) => h.firstPerson);
    expect(voiceHits.length).toBeGreaterThan(0);
    expect(first.length / voiceHits.length).toBeLessThan(0.15);
  });
});
