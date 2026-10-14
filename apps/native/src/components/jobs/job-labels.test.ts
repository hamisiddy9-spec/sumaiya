/**
 * The Jobs flow's rules, pinned without a renderer.
 *
 * Two classes of defect this file exists to catch, both of which the brief
 * calls out as non-negotiable:
 *
 *   1. A SCORE WITHOUT ITS REASON. The design's card carries a percentage and
 *      the one-line why, and the say-so sentence is what makes the number mean
 *      anything. `JobMatch` therefore carries `score` and `reason` in ONE
 *      value; these tests pin that no path through `matchViewFor()` ever
 *      produces one without the other, and that `reason` is never blank when a
 *      payload arrives with an empty or missing one.
 *   2. AN INVENTED NUMBER. Every score below is produced by one of the two
 *      real engines (the server's recommendation payload, or `matchJd()` on
 *      the device) — never by the UI. The static guard at the foot of this
 *      file keeps that true for the screens as written.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { matchJd } from "../../lib/ats";
import {
  advertBullets,
  bandColor,
  JOB_FILTERS,
  localMatch,
  matchesFilter,
  matchesQuery,
  matchViewFor,
  postedAgo,
  recommendationMatch,
  scoreBand,
} from "./job-labels";

const SW = "sw" as const;
const EN = "en" as const;

/** The guide's status tokens (§1) — the values `bandColor` must resolve to. */
const TOKENS = { success: "#186A22", warning: "#B45309", textMuted: "#5A413A" };

const CV = {
  personalInfo: { fullName: "Asha M.", email: "a@b.c", phone: "0700", location: "Dar es Salaam" },
  summary: "Nilisimamia mauzo ya simu kwa miaka mitano katika maduka mbalimbali.",
  experience: [
    { id: "e1", title: "Sales Officer", company: "Vodacom", description: "Sales management experience.", startDate: "2018-01", current: true },
  ],
  education: [],
  skills: [{ name: "Sales management" }, { name: "Customer care" }],
  certifications: [],
  languages: [{ name: "English" }],
} as never;

const JD =
  "Sales management experience needed. Driving licence required. Customer care and reporting skills.";

function listing(over: Record<string, unknown> = {}) {
  return {
    id: "j1",
    title: "Afisa Mauzo Mwandamizi",
    company: "Vodacom Tanzania",
    location: "Dar es Salaam",
    category: "Sales",
    employmentType: "Muda Wote",
    description: JD,
    applyUrl: "https://example.test/apply",
    createdAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
    ...over,
  } as never;
}

describe("a score and its reason travel together", () => {
  it("keeps the server's score and the server's reason as one match", () => {
    const view = matchViewFor(listing(), {
      lang: SW,
      serverScore: 88,
      serverReason: "Wasifu wako una uzoefu wa miaka 3 ya mauzo ya simu.",
    });
    expect(view.state).toBe("scored");
    if (view.state !== "scored") return;
    expect(view.match.score).toBe(88);
    expect(view.match.reason).toBe("Wasifu wako una uzoefu wa miaka 3 ya mauzo ya simu.");
    expect(view.match.source).toBe("profile");
  });

  it("never returns a score with a blank reason — an empty payload sentence is filled honestly", () => {
    // The server type declares `reason` required, but a partial payload is a
    // known failure mode in this app (see lib/defensive-guards.test.ts). The
    // device engine's own sentence — or, with no CV at all, a plain statement
    // of what the score means — stands in. Still no invented number.
    const withCv = matchViewFor(listing(), { lang: SW, cvData: CV, serverScore: 71, serverReason: "   " });
    expect(withCv.state).toBe("scored");
    if (withCv.state !== "scored") return;
    expect(withCv.match.score).toBe(71);
    expect(withCv.match.reason.trim().length).toBeGreaterThan(0);

    const bare = matchViewFor(listing(), { lang: SW, serverScore: 40 });
    expect(bare.state).toBe("scored");
    if (bare.state !== "scored") return;
    expect(bare.match.score).toBe(40);
    expect(bare.match.reason.length).toBeGreaterThan(0);
  });

  it("clamps a malformed server score instead of printing it", () => {
    const view = matchViewFor(listing(), { lang: EN, serverScore: 140.6 });
    expect(view.state).toBe("scored");
    if (view.state !== "scored") return;
    expect(view.match.score).toBe(100);
  });

  it("scores from the device engine when the server has no match for this user", () => {
    const view = matchViewFor(listing(), { lang: SW, cvData: CV });
    expect(view.state).toBe("scored");
    if (view.state !== "scored") return;
    expect(view.match.source).toBe("cv");
    expect(view.match.score).toBeGreaterThan(0);
    expect(view.match.score).toBeLessThanOrEqual(100);
    expect(view.match.reason.length).toBeGreaterThan(0);
    // The score is the engine's, and its findings are the engine's too.
    const engine = matchJd(CV, JD);
    expect(view.match.score).toBe(Math.round(engine.score));
    expect(view.match.matched).toEqual(engine.matched);
    expect(view.match.missing).toEqual(engine.missing);
  });

  it("reports a real 'nothing matches' rather than a made-up sentence", () => {
    const unrelated = {
      ...CV,
      summary: "Nilipika na kuuza vyakula sokoni.",
      skills: [{ name: "Cooking" }],
      experience: [{ id: "e1", title: "Cook", company: "Mgahawa", description: "Cooking." }],
    } as never;
    const match = localMatch(unrelated, listing(), EN);
    expect(match.score).toBe(0);
    expect(match.matched).toEqual([]);
    expect(match.reason).toBe("Nothing in the advert matches your CV yet.");
  });
});

describe("the two honest 'nothing to score with' states", () => {
  it("says no-cv when the phone holds no CV and the server sent no match", () => {
    const view = matchViewFor(listing(), { lang: SW });
    expect(view).toEqual({ state: "unknown", why: "no-cv" });
  });

  it("says no-advert when the listing has no text to compare", () => {
    // `matchJd` is only meaningful past the same 40-character floor the CV
    // check applies, so a stub description is not scored — it is reported.
    const view = matchViewFor(listing({ description: "" }), { lang: SW, cvData: CV });
    expect(view).toEqual({ state: "unknown", why: "no-advert" });
    expect(matchViewFor(listing({ description: "Short." }), { lang: SW, cvData: CV })).toEqual({
      state: "unknown",
      why: "no-advert",
    });
  });

  it("never invents a score for a recommendation whose payload carries none", () => {
    const rec = { jobId: "j1", score: Number.NaN, reason: "x", matchedTerms: [], job: listing() };
    expect(recommendationMatch(rec as never, SW)).toBeNull();
    const good = { jobId: "j1", score: 62, reason: "Unao uzoefu.", matchedTerms: [], job: listing() };
    expect(recommendationMatch(good as never, SW)?.score).toBe(62);
  });
});

describe("score bands are the app's, not the mockup's Tailwind palette", () => {
  it("bands at the thresholds the rest of the app already uses", () => {
    expect(scoreBand(60)).toBe("strong");
    expect(scoreBand(59)).toBe("fair");
    expect(scoreBand(35)).toBe("fair");
    expect(scoreBand(34)).toBe("weak");
  });

  it("resolves every band to a §1 status token", () => {
    expect(bandColor("strong", TOKENS)).toBe(TOKENS.success);
    expect(bandColor("fair", TOKENS)).toBe(TOKENS.warning);
    expect(bandColor("weak", TOKENS)).toBe(TOKENS.textMuted);
  });
});

describe("postedAgo — B4's 'Imepostiwa …' in the design's own words", () => {
  const now = new Date("2026-10-14T12:00:00Z");
  const ago = (ms: number) => new Date(now.getTime() - ms);
  const HOUR = 3600_000;

  it("uses `masaa` for hours, as the fragment does", () => {
    expect(postedAgo(ago(4 * HOUR), SW, now)).toBe("masaa 4 yaliyopita");
    expect(postedAgo(ago(HOUR), SW, now)).toBe("saa moja iliyopita");
    expect(postedAgo(ago(30 * 60_000), SW, now)).toBe("dakika 30 zilizopita");
    expect(postedAgo(ago(30_000), SW, now)).toBe("sasa hivi");
  });

  it("says `jana` for a day and counts the rest", () => {
    expect(postedAgo(ago(24 * HOUR), SW, now)).toBe("jana");
    expect(postedAgo(ago(3 * 24 * HOUR), SW, now)).toBe("siku 3 zilizopita");
  });

  it("falls back to a date past a week, and to English when the app is English", () => {
    const old = ago(20 * 24 * HOUR);
    expect(postedAgo(old, SW, now)).toMatch(/\d/);
    expect(postedAgo(old, SW, now)).not.toContain("siku");
    expect(postedAgo(ago(4 * HOUR), EN, now)).toBe("4 hours ago");
    expect(postedAgo(ago(HOUR), EN, now)).toBe("1 hour ago");
    expect(postedAgo(ago(24 * HOUR), EN, now)).toBe("yesterday");
  });

  it("returns null when there is no real timestamp — never a guess", () => {
    expect(postedAgo(undefined, SW, now)).toBeNull();
    expect(postedAgo(null, SW, now)).toBeNull();
    expect(postedAgo("not a date", SW, now)).toBeNull();
  });
});

describe("B4's four chips are filters over data the feed really has", () => {
  it("keeps the design's four labels, in the design's order", () => {
    expect(JOB_FILTERS.map((f) => f.sw)).toEqual([
      "Zote",
      "Dar es Salaam",
      "Kazi za Ghuba",
      "Za Mbali (Remote)",
    ]);
  });

  it("filters by the listing's own location", () => {
    const dar = listing({ location: "Dar es Salaam" });
    const gulf = listing({ id: "j2", location: "Doha / Dubai" });
    const remote = listing({ id: "j3", location: "Remote" });
    const nowhere = listing({ id: "j4", location: "" });

    expect(matchesFilter(dar, "dar")).toBe(true);
    expect(matchesFilter(dar, "gulf")).toBe(false);
    expect(matchesFilter(gulf, "gulf")).toBe(true);
    expect(matchesFilter(gulf, "dar")).toBe(false);
    expect(matchesFilter(remote, "remote")).toBe(true);
    expect(matchesFilter(remote, "gulf")).toBe(false);
    // Unknown location belongs to `Zote` only — it is never guessed into a
    // place the app does not know.
    for (const key of ["dar", "gulf", "remote"] as const) {
      expect(matchesFilter(nowhere, key)).toBe(false);
    }
    for (const job of [dar, gulf, remote, nowhere]) expect(matchesFilter(job, "all")).toBe(true);
  });

  it("searches the three fields the placeholder names", () => {
    const job = listing({ title: "Afisa Mauzo", company: "Vodacom Tanzania", location: "Dodoma" });
    expect(matchesQuery(job, "")).toBe(true);
    expect(matchesQuery(job, "  ")).toBe(true);
    expect(matchesQuery(job, "mauzo")).toBe(true);
    expect(matchesQuery(job, "VODACOM")).toBe(true);
    expect(matchesQuery(job, "dodoma")).toBe(true);
    expect(matchesQuery(job, "mhandisi")).toBe(false);
  });
});

describe("the advert's own words become B5's list", () => {
  it("strips the markers and keeps every line", () => {
    expect(
      advertBullets("- Kusimamia mtandao wa mawakala.\n• Kutoa mafunzo kwa timu.\n1) Kuandaa ripoti."),
    ).toEqual([
      "Kusimamia mtandao wa mawakala.",
      "Kutoa mafunzo kwa timu.",
      "Kuandaa ripoti.",
    ]);
  });

  it("turns one scraped paragraph into its sentences", () => {
    expect(advertBullets("Kusimamia timu. Kutoa mafunzo. Kuandaa ripoti.")).toEqual([
      "Kusimamia timu.",
      "Kutoa mafunzo.",
      "Kuandaa ripoti.",
    ]);
  });

  it("returns nothing for an empty advert, and caps a runaway one", () => {
    expect(advertBullets("")).toEqual([]);
    expect(advertBullets(undefined)).toEqual([]);
    expect(advertBullets(Array.from({ length: 60 }, (_, i) => `Point ${i}.`).join("\n")).length).toBe(40);
  });
});

describe("no screen may hand-roll a score", () => {
  const root = join(__dirname, "..", "..");
  const read = (rel: string) => readFileSync(join(root, rel), "utf8");

  it("both screens take their match from the engines in job-labels", () => {
    for (const file of ["screens/jobs-screen.tsx", "screens/job-detail-screen.tsx"]) {
      expect(read(file)).toContain("matchViewFor(");
    }
  });

  it("neither screen contains a literal score or a `?? 0` fallback", () => {
    for (const file of ["screens/jobs-screen.tsx", "screens/job-detail-screen.tsx", "components/jobs/job-card.tsx"]) {
      const source = read(file);
      expect(source).not.toMatch(/serverScore\s*(\?\?|\|\|)\s*0/);
      expect(source).not.toMatch(/score:\s*\d/);
    }
  });
});
