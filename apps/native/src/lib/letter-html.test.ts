import { letterIsEmpty, letterToHtml, MIN_LETTER_CHARS } from "./letter-html";

/** A realistic body: three short paragraphs, the way the model is asked to write. */
const REAL_LETTER = `I am applying for the Platform Engineer role at Ecoplanet Green Operations. I have spent four years running Linux infrastructure for a payments platform in Dar es Salaam, where downtime is measured in lost transactions rather than lost minutes.

At Nala Money I operated Kubernetes clusters on AWS, wrote the Terraform modules the team still uses, and cut monthly cloud spend by 22% by rightsizing workloads and moving cold data to cheaper storage. I set up the Prometheus and Grafana stack we monitor with, and wrote the runbooks the on-call rota follows.

I would bring the same approach to your platform: treat reliability and cost as one problem, and make every change reversible. I would welcome the chance to talk about how I can help.`;

describe("letterIsEmpty", () => {
  it("accepts a real letter", () => {
    expect(letterIsEmpty(REAL_LETTER)).toBe(false);
  });

  it("rejects what the exported PDF actually contained — nothing", () => {
    // The reported bug: a letter object existed, its body did not.
    expect(letterIsEmpty("")).toBe(true);
    expect(letterIsEmpty("   ")).toBe(true);
    expect(letterIsEmpty("\n\n\n")).toBe(true);
    expect(letterIsEmpty(null)).toBe(true);
    expect(letterIsEmpty(undefined)).toBe(true);
  });

  it("rejects a body too short to be a letter", () => {
    expect(letterIsEmpty("Dear Sir/Madam")).toBe(true);
    expect(letterIsEmpty("x".repeat(MIN_LETTER_CHARS - 1))).toBe(true);
    expect(letterIsEmpty("x".repeat(MIN_LETTER_CHARS))).toBe(false);
  });
});

describe("letterToHtml", () => {
  it("produces a document with the header AND the whole letter in it", () => {
    const html = letterToHtml({
      jobTitle: "Platform Engineer (m/f/d)",
      company: "Ecoplanet Green Operations Gmbh",
      content: REAL_LETTER,
    });

    expect(html).toContain("Platform Engineer (m/f/d)");
    expect(html).toContain("Ecoplanet Green Operations Gmbh");
    // The part that was missing from the exported file.
    expect(html).toContain("I am applying for the Platform Engineer role");
    expect(html).toContain("22%");
    expect(html).toContain("reversible");
    // Three paragraphs in, three <p> out.
    expect(html.match(/<p>/g)?.length).toBe(3);
  });

  it("refuses to render an empty body at all", () => {
    // Belt and braces: even a caller that skips the guard cannot produce the
    // blank-but-valid PDF that started this.
    expect(() => letterToHtml({ jobTitle: "Platform Engineer", company: "Ecoplanet", content: "" })).toThrow();
    expect(() => letterToHtml({ jobTitle: "Platform Engineer", company: "Ecoplanet", content: "   \n " })).toThrow();
  });

  it("keeps a single newline as a line break, not a new paragraph", () => {
    const html = letterToHtml({ content: `Line one\nLine two\n\nSecond paragraph. ${"y".repeat(70)}` });
    expect(html).toContain("Line one<br/>Line two");
    expect(html.match(/<p>/g)?.length).toBe(2);
  });

  it("escapes anything that could break the document", () => {
    const html = letterToHtml({ content: `<script>alert("x")</script> ${"z".repeat(80)}` });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("falls back to a sensible title when the job title is missing", () => {
    const html = letterToHtml({ content: REAL_LETTER });
    expect(html).toContain("Cover letter");
  });
});
