// EVAL: Language fidelity — generated content stays in the requested language.
//
// Deterministic layer (always runs in CI): the prompt builders for EVERY
// generation route must embed the hard language constraint. A PR that drops
// the constraint (or a new route that forgets it) fails here — models flip
// Swahili→English on their own when the instruction is soft or missing.
//
// AI layer (skipped in CI — runs where an AI provider is configured): generate
// Swahili content and score it with the function-word rubric. Non-deterministic
// output is asserted by PROPERTY (language ratio), never exact strings.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { aiReady, evalCallAi } from "./lib/ai";
import {
  detectLanguage,
  scoreLanguageFidelity,
  LANGUAGE_PASS_THRESHOLD,
} from "./lib/rubric";

const ready = await aiReady();
const AI_TS = resolve(process.cwd(), "lib/api/routes/ai.ts");
const aiSrc = () => readFileSync(AI_TS, "utf8");

// ─── Deterministic layer: every generation route embeds the hard constraint ──

describe("eval: language fidelity (prompt builders)", () => {
  it("assistant-turn: 'reply ONLY in ${langName}' hard rule", () => {
    expect(aiSrc()).toContain("reply ONLY in ${langName}");
    expect(aiSrc()).toContain("Never flip Swahili→English on your own");
  });

  it("build-cv/build-doc (cvWriterPrompt): ENTIRE CV in the UI language", () => {
    expect(aiSrc()).toContain("Write the ENTIRE CV in ${lang === \"sw\" ? \"Swahili\" : \"English\"}");
    expect(aiSrc()).toContain("Never flip Swahili→English on your own");
  });

  it("build-doc langRule: all human-readable text in the UI language", () => {
    expect(aiSrc()).toContain("Write all human-readable text in ${L} (the user's UI language)");
  });

  it("cover-letter route: written 'in ${langName}'", () => {
    expect(aiSrc()).toContain("in ${langName}");
  });

  it("tailor-cv route: 'Write in ${L}'", () => {
    expect(aiSrc()).toContain("Write in ${L}");
  });

  it("interview-turn: 'speak ONLY in ${langName}'", () => {
    expect(aiSrc()).toContain("speak ONLY in ${langName}");
  });

  it("enhance directives cover BOTH languages (sw + en)", () => {
    const src = aiSrc();
    expect(src).toContain("sw: \"ADJUST: Write the result in natural, professional Swahili");
    expect(src).toContain("en: \"ADJUST: Write the result in natural, professional English");
  });

  it("doc-intel replies in the document's language", () => {
    expect(aiSrc()).toContain("Reply in the SAME language as the document");
  });
});

// ─── Rubric sanity (deterministic) ───────────────────────────────────────────

describe("eval: language rubric", () => {
  it("detects clear Swahili prose", () => {
    const d = detectLanguage(
      "Habari za asubuhi. Ninakupenda kusaidia kuandika CV yako kwa ajili ya kazi hii. Tunaweza kuanza sasa.",
    );
    expect(d.dominant).toBe("sw");
    expect(scoreLanguageFidelity("Habari za asubuhi. Ninakupenda kusaidia kuandika CV yako kwa ajili ya kazi hii. Tunaweza kuanza sasa.", "sw")).toBeGreaterThanOrEqual(LANGUAGE_PASS_THRESHOLD);
  });

  it("detects clear English prose", () => {
    const d = detectLanguage(
      "Good morning. I would like to help you write your CV for this job. We can start right now.",
    );
    expect(d.dominant).toBe("en");
  });

  it("scores an English reply to a Swahili request as failing", () => {
    const score = scoreLanguageFidelity(
      "Good morning. I would like to help you write your CV for this job. We can start right now.",
      "sw",
    );
    expect(score).toBeLessThan(LANGUAGE_PASS_THRESHOLD);
  });
});

// ─── AI layer: a Swahili request yields Swahili output ───────────────────────

describe.skipIf(!ready)("eval: language fidelity (AI generation)", () => {
  it(
    "generated CV summary in Swahili stays Swahili (property, not exact string)",
    { timeout: 90_000 },
    async () => {
      const prompt = `You are an expert CV writer. Write a professional CV summary (3–4 sentences) in SWAHILI for a React developer with 3 years of experience building web applications in Dar es Salaam. ${"Write ONLY in Swahili. Never mix in English."}
Return ONLY the summary text, no preamble, no quotes.`;
      const raw = await evalCallAi(prompt, { temperature: 0.3, maxTokens: 600, timeoutMs: 60_000 });
      expect(raw, "AI provider returned nothing").toBeTruthy();

      const score = scoreLanguageFidelity(raw!, "sw");
      const d = detectLanguage(raw!);
      // eslint-disable-next-line no-console
      console.log(`[eval] sw summary: sw=${d.sw} en=${d.en} ratio=${score.toFixed(2)}`);
      expect(score, `expected Swahili-dominant output, got ratio ${score.toFixed(2)}`).toBeGreaterThanOrEqual(LANGUAGE_PASS_THRESHOLD);
    },
  );
});
