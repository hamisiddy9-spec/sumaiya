import { describe, it, expect } from "vitest";
import { extractTerms, scoreTerms, matchCvToJd, looksLikeJobDescription, findLastJobInHistory } from "@/lib/job-match";
import { createEmptyCVData, type CVData } from "@/types";

function cv(partial: Partial<CVData>): CVData {
  return { ...createEmptyCVData(), ...partial };
}

describe("extractTerms", () => {
  it("lowercases, dedupes and drops stop words", () => {
    const terms = extractTerms("We are looking for a Sales Manager with Excel and CRM");
    expect(terms).toContain("sales");
    expect(terms).toContain("excel");
    expect(terms).toContain("crm");
    expect(terms).not.toContain("the");
    expect(terms).not.toContain("with");
  });

  it("drops Swahili filler words (primary UI language) from missing-keyword lists", () => {
    // A Swahili job advert full of grammatical glue + generic nouns must NOT
    // surface "kazi", "kampuni", "katika", "mahitaji", "ujuzi" as missing
    // keywords — only the real skills survive.
    const terms = extractTerms(
      "Msimamizi wa kazi katika kampuni kubwa. Mahitaji: ujuzi wa React na Postgres, tajriba ya miaka 3, elimu ya chuo. Kwa maelezo zaidi piga simu.",
    );
    expect(terms).toContain("react");
    expect(terms).toContain("postgres");
    expect(terms).not.toContain("kazi");
    expect(terms).not.toContain("katika");
    expect(terms).not.toContain("kampuni");
    expect(terms).not.toContain("mahitaji");
    expect(terms).not.toContain("ujuzi");
    expect(terms).not.toContain("tajriba");
    expect(terms).not.toContain("elimu");
    expect(terms).not.toContain("miaka");
    expect(terms).not.toContain("maelezo");
    expect(terms).not.toContain("zaidi");
  });

  it("keeps real Swahili skill words that are NOT filler", () => {
    // uongozi (leadership) / mawasiliano (communication) are genuine skills —
    // they must survive the stopword filter.
    const terms = extractTerms("Mahitaji: uongozi, mawasiliano, usalama wa mtandao");
    expect(terms).toContain("uongozi");
    expect(terms).toContain("mawasiliano");
    expect(terms).toContain("usalama");
    expect(terms).not.toContain("mahitaji");
  });

  it("dedupes repeated terms", () => {
    const terms = extractTerms("excel Excel EXCEL");
    expect(terms.filter((t) => t === "excel")).toHaveLength(1);
  });

  it("never leaks HTML/entity noise into keywords", () => {
    // Real-world polluted descriptions (Anthropic/IonQ feed rows).
    const terms = extractTerms(
      '<div class="content-intro"><h2><strong>About Anthropic</strong></h2><p>We&rsquo;re hiring</p></div> &amp; more &lt;b&gt;stuff&lt;/b&gt; http://example.com',
    );
    expect(terms).not.toContain("div");
    expect(terms).not.toContain("span");
    expect(terms).not.toContain("class");
    expect(terms).not.toContain("href");
    expect(terms).not.toContain("http");
    expect(terms).not.toContain("www");
    expect(terms).not.toContain("com");
    expect(terms).not.toContain("amp");
    expect(terms).not.toContain("quot");
    expect(terms).not.toContain("nbsp");
    expect(terms).not.toContain("strong");
    expect(terms).toContain("anthropic");
    expect(terms).toContain("hiring");
  });

  it("filters generic filler that would pollute 'missing from your CV'", () => {
    const terms = extractTerms(
      "One kind of role: don't need markets experience, but 5 years of sales reporting is a plus",
    );
    expect(terms).not.toContain("one");
    expect(terms).not.toContain("kind");
    expect(terms).not.toContain("don");
    expect(terms).not.toContain("markets");
    expect(terms).not.toContain("years");
    expect(terms).toContain("sales");
    expect(terms).toContain("reporting");
  });
});

describe("scoreTerms", () => {
  it("scores coverage 0..100 and splits matched vs missing", () => {
    const r = scoreTerms(["excel", "sales", "crm", "inventory"], new Set(["excel", "sales"]));
    expect(r.matched.sort()).toEqual(["excel", "sales"]);
    expect(r.missing.sort()).toEqual(["crm", "inventory"]);
    expect(r.score).toBe(50);
  });

  it("returns 0 when there are no job terms (no divide-by-zero)", () => {
    expect(scoreTerms([], new Set(["x"])).score).toBe(0);
  });
});

describe("matchCvToJd", () => {
  const sampleCv = cv({
    summary: "Experienced sales professional skilled in Excel and CRM.",
    skills: [
      { id: "1", name: "Excel", level: 4 },
      { id: "2", name: "Sales reporting", level: 4 },
    ],
  });

  it("identifies skills the CV genuinely has", () => {
    const r = matchCvToJd(sampleCv, "Looking for a Sales rep with Excel and CRM.");
    expect(r.matched).toContain("excel");
    expect(r.matched).toContain("sales");
  });

  it("never invents coverage — every matched/missing term comes from the JD", () => {
    const jd = "Requires CRM and inventory management skills.";
    const jobTerms = extractTerms(jd);
    const r = matchCvToJd(sampleCv, jd);
    for (const m of r.matched) expect(jobTerms).toContain(m);
    for (const miss of r.missing) expect(jobTerms).toContain(miss);
  });

  it("is deterministic — same input yields the same score", () => {
    const jd = "Sales manager with Excel, CRM and inventory.";
    expect(matchCvToJd(sampleCv, jd).score).toBe(matchCvToJd(sampleCv, jd).score);
  });

  it("scores an empty CV against a real JD as low, not high", () => {
    const r = matchCvToJd(createEmptyCVData(), "Sales manager with Excel, CRM, inventory and reporting.");
    expect(r.score).toBeLessThan(50);
  });

  it("counts skills that only appear in a project (graduate case)", () => {
    const gradCv = cv({
      projects: [{ id: "p1", name: "Inventory tracker", description: "Built a Python and PostgreSQL app to manage stock." }],
    });
    const r = matchCvToJd(gradCv, "Seeking a developer skilled in Python and PostgreSQL databases");
    expect(r.matched).toContain("python");
    expect(r.matched).toContain("postgresql");
  });
});

describe("looksLikeJobDescription — P0 Fix 3 guard", () => {
  const REAL_JD = `Senior Software Engineer — NMB Bank
We are looking for an experienced engineer to join our platform team in Dar es Salaam.
Responsibilities:
- Build and maintain Node.js APIs serving 2M+ users
- Design PostgreSQL schemas for mobile money transactions
Requirements: 4+ years of backend experience, degree in Computer Science.
Salary: competitive. Full-time. Apply now.`;

  const SW_JD = `Meneja wa Mauzo — Bora Media
Maelezo ya kazi: Tunatafuta meneja wa mauzo mwenye uzoefu wa miaka 3+.
Mahitaji:
- Ujuzi wa Google Ads na SEO
- Uzoefu wa kuongoza timu ya watu 5
- Elimu ya marketing
Tuma maombi kabla ya tarehe 30.`;

  it("accepts a real pasted English JD", () => {
    expect(looksLikeJobDescription(REAL_JD)).toBe(true);
  });

  it("accepts a real pasted Swahili JD", () => {
    expect(looksLikeJobDescription(SW_JD)).toBe(true);
  });

  it("accepts a long attached-link job blob (emoji label + content)", () => {
    expect(looksLikeJobDescription(`🔗 Senior Data Analyst at Vodacom\n${REAL_JD}`)).toBe(true);
  });

  it("rejects a conversational sentence, however long", () => {
    const complaint = "Ninafanya kazi ya digital marketing kwa miaka 4 niko Dar es Salaam, nimefanya kazi na Bora Media kama specialist na nina ujuzi wa Google Ads na SEO na content creation, elimu yangu ni Bachelor of Arts in Marketing kutoka Chuo Kikuu cha Dar es Salaam, na nataka nafasi ya manager.";
    expect(looksLikeJobDescription(complaint)).toBe(false);
  });

  it("rejects short / vague text", () => {
    expect(looksLikeJobDescription("software engineer job")).toBe(false);
    expect(looksLikeJobDescription("")).toBe(false);
    expect(looksLikeJobDescription("I want a job in tech")).toBe(false);
  });

  it("accepts a short but real unstructured posting (keyword density)", () => {
    const shortJd =
      "We're hiring a shop assistant for our Nairobi branch. The ideal candidate is reliable, good with customers and available on weekends. Some retail experience is a plus. Salary negotiable — apply with your CV.";
    expect(looksLikeJobDescription(shortJd)).toBe(true);
  });

  it("accepts a plain 3-sentence posting with no headers", () => {
    const plain =
      "Bora Logistics is looking for a delivery rider in Dar es Salaam. You need a valid licence and two years of riding experience. We offer a fixed monthly salary and fuel allowance.";
    expect(looksLikeJobDescription(plain)).toBe(true);
  });

  it("awaiting-JD path regression: a short conversational reply never triggers a match", () => {
    // The cockpit awaiting-JD handler used to call runMatch(value) UNCONDITIONALLY
    // — a casual reply ("hi", "sawa") produced a bogus 0% match card built from
    // the user's own words. The guard must fail closed on every short non-JD.
    for (const casual of ["hi", "hello", "sawa", "ndio", "ok", "naam", "vipi", "asante"]) {
      expect(looksLikeJobDescription(casual)).toBe(false);
    }
  });

  it("rejects a conversational multi-line complaint with no advert structure", () => {
    const lines = ["Sijapata majibu ya kazi yangu",
      "Nimeomba kwenye kampuni tatu",
      "Lakini sijapata mwito hata mmoja",
      "Naomba ushauri wako kuhusu CV yangu",
      "Nimekata tamaa kidogo"];
    expect(looksLikeJobDescription(lines.join("\n"))).toBe(false);
  });
});

describe("findLastJobInHistory — P0 Fix 3 thread source", () => {
  const JD = `We are looking for a DevOps engineer. Responsibilities: build CI/CD pipelines, manage Kubernetes clusters. Requirements: 3+ years experience.`;

  it("returns the most recent JD-looking user message", () => {
    const msgs = [
      { role: "user", content: "Habari, nataka kuboresha CV" },
      { role: "assistant", content: "Sawa!" },
      { role: "user", content: JD },
      { role: "assistant", content: "Nimeiona" },
      { role: "user", content: "Naomba uilinganishe na CV yangu" },
    ];
    expect(findLastJobInHistory(msgs)).toBe(JD);
  });

  it("returns '' when nothing JD-like was ever pasted", () => {
    const msgs = [
      { role: "user", content: "Ninafanya kazi ya marketing" },
      { role: "assistant", content: "Vizuri" },
      { role: "user", content: "Nataka nafasi ya manager" },
    ];
    expect(findLastJobInHistory(msgs)).toBe("");
  });
});
