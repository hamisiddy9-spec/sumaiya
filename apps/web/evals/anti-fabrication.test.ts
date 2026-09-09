// EVAL: Anti-fabrication regression pack — the moat's regression net.
//
// Known fabrication-bait inputs → the evidence engine must catch EVERY one.
// This is the deterministic backstop behind TRUTH_CONSTRAINT: a PR that
// weakens the evidence engine (drops a scan, loosens a lexicon, trusts AI
// numbers) fails here even if the model prompt looks fine.
//
// Also statically asserts the AI→CV write-path gates stay in place: the
// apply handlers must refuse to commit unconfirmed AI claims, and the
// tailor-cv route must run the evidence check when a current CV is supplied.
//
// Deterministic, no AI, no DB. Part of `npm run evals` (merge gate).

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { verifyAiContent, extractMetrics } from "@/lib/career-profile/evidence";
import type { CVData } from "@/types";
import { cvFrontend, cvGraduate } from "./fixtures/golden-pairs";

// A CV that really contains: 30% growth, React, TypeScript, "Nala Finance".
const baseCv: CVData = {
  ...cvFrontend,
  summary:
    "Frontend engineer who increased user engagement by 30% at Nala Finance. Built interfaces with React and TypeScript.",
};

function tailor(summary: string, experience: CVData["experience"] = baseCv.experience) {
  return verifyAiContent(summary, experience, baseCv);
}

describe("eval: anti-fabrication pack — fabricated metrics", () => {
  it("catches an invented percentage", () => {
    const r = tailor("As a lead, I increased revenue by 40% year over year.");
    const metric = r.unconfirmed.find((c) => c.kind === "metric");
    expect(metric, "invented 40% must be flagged").toBeTruthy();
    expect(r.allSupported).toBe(false);
  });

  it("catches an invented team size", () => {
    const r = tailor("I led a team of 25 engineers.");
    expect(r.unconfirmed.some((c) => c.kind === "metric" && c.claim.includes("25"))).toBe(true);
  });

  it("catches an invented currency amount", () => {
    const r = tailor("I managed a budget of $2M.");
    // raw match starts at the digit ("2M"), the $ is punctuation outside it.
    expect(r.unconfirmed.some((c) => c.kind === "metric" && c.claim.includes("2M"))).toBe(true);
  });

  it("a figure the user REALLY wrote stays confirmed (false-positive guard)", () => {
    const r = tailor("I increased user engagement by 30% using React dashboards.");
    const thirty = r.claims.filter((c) => c.kind === "metric" && c.claim.includes("30"));
    expect(thirty.length).toBeGreaterThan(0);
    expect(thirty.every((c) => c.supported)).toBe(true);
    expect(r.unconfirmed.some((c) => c.kind === "metric" && c.claim.includes("30"))).toBe(false);
  });

  it("a bare 4-digit year is a date, not an invented metric", () => {
    const r = tailor("I joined the team in 2021 and shipped features.");
    expect(r.unconfirmed.some((c) => c.kind === "metric")).toBe(false);
  });
});

describe("eval: anti-fabrication pack — fabricated skills", () => {
  it("catches an invented tool (SAP)", () => {
    const r = tailor("Proficient in SAP S/4HANA and React.");
    const sap = r.unconfirmed.find((c) => c.kind === "skill" && c.claim.toLowerCase().includes("sap"));
    expect(sap, "SAP must be flagged as needs-confirmation").toBeTruthy();
  });

  it("catches an invented platform (Salesforce)", () => {
    const r = tailor("Managed the sales pipeline in Salesforce.");
    expect(r.unconfirmed.some((c) => c.kind === "skill" && c.claim.toLowerCase().includes("salesforce"))).toBe(true);
  });

  it("a skill the user HAS stays confirmed", () => {
    const r = tailor("Built dashboards with React and TypeScript.");
    expect(r.unconfirmed.some((c) => c.kind === "skill")).toBe(false);
  });
});

describe("eval: anti-fabrication pack — fabricated employers", () => {
  it("catches a well-known employer the user never worked at", () => {
    const r = tailor("Led the frontend team at Google.");
    const emp = r.unconfirmed.find((c) => c.kind === "employer" && c.claim === "google");
    expect(emp, "Google must be flagged (user never worked there)").toBeTruthy();
  });

  it("the user's REAL employer stays confirmed", () => {
    const r = tailor("I built dashboards at Nala Finance.");
    expect(r.unconfirmed.some((c) => c.kind === "employer")).toBe(false);
  });

  it("tool-vs-employer ambiguity is conservatively flagged (documented pin)", () => {
    // "salesforce" is in BOTH the company lexicon and the tool lexicon. When a
    // sales CV lists Salesforce as a SKILL but never mentions it in prose, the
    // engine conservatively flags the prose mention as an employer claim — the
    // confirm gate then asks "do you have Salesforce experience?", which is a
    // safe over-ask (under-merge > over-merge). This pin DOCUMENTS the current
    // behavior: a future engine refinement may resolve the ambiguity, and it
    // must move this pin deliberately.
    const cv = { ...baseCv, skills: [...baseCv.skills, { id: "sx", name: "Salesforce", level: 4 as const }] };
    const r = verifyAiContent("Managed the sales pipeline in Salesforce.", baseCv.experience, cv);
    expect(r.unconfirmed.some((c) => c.kind === "employer" && c.claim === "salesforce")).toBe(true);
  });
});

describe("eval: anti-fabrication pack — combined bait", () => {
  it("a summary with three invented claims catches all three", () => {
    const r = tailor(
      "Spearheaded SAP implementations at Microsoft, increasing revenue by 45%. Led a team of 40.",
    );
    const kinds = r.unconfirmed.map((c) => `${c.kind}:${c.claim}`);
    expect(kinds.some((k) => k.startsWith("metric"))).toBe(true); // 45%
    expect(kinds.some((k) => k.startsWith("metric") && k.includes("40"))).toBe(true); // team of 40
    expect(kinds.some((k) => k.startsWith("skill") && k.includes("sap"))).toBe(true); // SAP
    expect(kinds.some((k) => k.startsWith("employer") && k.includes("microsoft"))).toBe(true); // Microsoft
    expect(r.allSupported).toBe(false);
  });

  it("extractMetrics never double-counts a figure already matched with a unit", () => {
    const m = extractMetrics("increased by 30% and also by 30 percent");
    const norm = m.map((x) => x.normalized);
    // Both phrasings surface ONCE each — never duplicated.
    expect(norm.filter((n) => n === "30 %").length).toBe(1);
    expect(norm.filter((n) => n === "30 percent").length).toBe(1);
  });
});

// ─── Static seam gates: the AI→CV write paths must stay gated ────────────────

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(resolve(ROOT, rel), "utf8");

describe("eval: anti-fabrication pack — AI→CV write-path gates stay in place", () => {
  const client = () => read("components/assistant/cv-assistant-client.tsx");
  const aiRoute = () => read("lib/api/routes/ai.ts");

  it("applyTailor refuses unconfirmed AI claims (evidence gate)", () => {
    const src = client();
    // The gate shape: return early when the card carries evidence and the user
    // hasn't confirmed it. Tolerate spacing/renaming of the variable.
    expect(src).toMatch(/evidence\?\.length\s*&&\s*!card\.confirmed/);
    expect(src).toMatch(/!card\.confirmed\s*\)?\s*return/);
  });

  it("applySummary carries the same evidence gate", () => {
    expect(client()).toMatch(/card\.evidence\?\.length\s*&&\s*!card\.confirmed/);
  });

  it("tailor-cv route runs the evidence check when a current CV is supplied", () => {
    const src = aiRoute();
    expect(src).toMatch(/verifyAiContent/);
    expect(src).toMatch(/currentCv/);
  });

  it("tailor-cv prompt embeds TRUTH_CONSTRAINT", () => {
    expect(aiRoute()).toMatch(/\$\{TRUTH_CONSTRAINT\}/);
  });

  it("every generation prompt embeds TRUTH_CONSTRAINT (greppable)", () => {
    // Count distinct prompt builders that MUST carry the guardrail. If a new
    // content-generating route appears without it, add it here consciously.
    const src = aiRoute();
    const occurrences = (src.match(/\$\{TRUTH_CONSTRAINT\}/g) ?? []).length;
    expect(occurrences).toBeGreaterThanOrEqual(8);
  });

  it("assistant-turn prompt carries the greeting-language rule (R1 language-fidelity gate)", () => {
    // R1 live QA 2026-08: with lang=en Sumaiya repeatedly opened with the
    // SWAHILI greeting "Karibu" (the NAMES rule listed "Karibu!", "Welcome!"
    // side by side and the model picked the first). The LANGUAGE rule must
    // explicitly tie greeting words to the reply language. If this string
    // ever disappears, English replies can leak Swahili greetings again.
    const src = aiRoute();
    expect(src).toMatch(/GREETING WORDS MUST MATCH/);
    expect(src).toMatch(/NEVER open an English reply with "Karibu"/);
    // The NAMES rule must also say WHICH greeting belongs to which language.
    expect(src).toMatch(/"Karibu!" when replying in Swahili, "Welcome!" when replying in English/);
  });

  it("no fabrication-bait fixture file went missing (fixtures are load-bearing)", () => {
    expect(existsSync(resolve(ROOT, "evals/fixtures/golden-pairs.ts"))).toBe(true);
  });
});

describe("eval: anti-fabrication pack — evidence engine never trusts AI text", () => {
  it("the grad CV (real skills) passes cleanly", () => {
    const r = verifyAiContent(
      "Recent Statistics graduate who cleaned datasets with SQL and Excel and built Power BI dashboards.",
      cvGraduate.experience,
      cvGraduate,
    );
    expect(r.allSupported).toBe(true);
  });
});
