// EVAL: E1 Snap-to-Apply — anti-fabrication regression pack (the flagship's
// moat). Deterministic, no AI, no DB. Part of `npm run evals` (merge gate).
//
// The E1 paste-text flow turns a pasted job description into an ATS score +
// tailored CV + cover letter. The moment it could lie: (a) treat non-job text
// as a job, (b) tailor a CV when there is no profile, (c) let the AI invent
// experience/skills/employers/dates. Each is pinned here so a PR that weakens
// any gate fails even if the prompt looks fine.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { looksLikeJobDescription } from "@/lib/job-match";
import { verifyAiContent } from "@/lib/career-profile/evidence";
import {
  snapMatch,
  isUsableProfile,
  snapTailorPrompt,
  snapCoverLetterPrompt,
  parseTailoredCv,
  snapNoProfileMessage,
  snapNotAJobMessage,
} from "@/lib/api/snap-apply";
import { createEmptyCVData } from "@/types";
import { cvFrontend } from "./fixtures/golden-pairs";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(resolve(ROOT, rel), "utf8");
const route = () => read("lib/api/routes/snap.ts");
const pipeline = () => read("lib/api/snap-apply.ts");
const client = () => read("app/(app)/snap/snap-client.tsx");

// A realistic frontend JD (passes the guard) used across the pack.
const JD = `Frontend Engineer — Dar es Salaam (Full-time)

About the role: We are looking for a Frontend Engineer to build customer-facing dashboards.

Responsibilities:
- Build responsive interfaces with React and TypeScript
- Integrate REST APIs and write unit tests
- Ship accessible, performant web applications with Next.js

Requirements:
- 3+ years of experience with React and JavaScript
- Experience with Git and deploying to Vercel
- Knowledge of Python is a plus

How to apply: send your CV to careers@example.com`;

describe("eval: E1 — never fabricate a job (JD guard)", () => {
  it("conversational text is rejected — a chat message can never become a 'job'", () => {
    const chat = "hi sumaiya please help me write my cv i am looking for a job in dar";
    expect(looksLikeJobDescription(chat)).toBe(false);
  });

  it("a short pasted fragment is rejected (must be a real posting)", () => {
    expect(looksLikeJobDescription("We are hiring! Apply now!")).toBe(false);
  });

  it("a real pasted advert passes", () => {
    expect(looksLikeJobDescription(JD)).toBe(true);
  });

  it("the route gates on looksLikeJobDescription BEFORE any AI work", () => {
    const src = route();
    expect(src).toMatch(/looksLikeJobDescription/);
    // The guard must sit before the AI calls in the file.
    const guardIdx = src.indexOf("looksLikeJobDescription");
    const aiIdx = src.indexOf("callAi(");
    expect(guardIdx).toBeGreaterThan(-1);
    expect(aiIdx).toBeGreaterThan(guardIdx);
  });

  it("the route replies NOT_A_JOB (never silently fabricates a job)", () => {
    expect(route()).toMatch(/"NOT_A_JOB"/);
    expect(route()).toMatch(/snapNotAJobMessage/);
  });
});

describe("eval: E1 — never hallucinate a result without a profile", () => {
  it("an empty profile is unusable — the route must refuse, not invent", () => {
    expect(isUsableProfile(createEmptyCVData())).toBe(false);
  });

  it("the route replies NO_PROFILE with a warm next step", () => {
    const src = route();
    expect(src).toMatch(/"NO_PROFILE"/);
    expect(src).toMatch(/snapNoProfileMessage/);
  });

  it("the warm next step actually guides (both languages, no dead end)", () => {
    expect(snapNoProfileMessage(false)).toMatch(/build|CV/i);
    expect(snapNoProfileMessage(true)).toMatch(/jenga|CV/i);
    expect(snapNotAJobMessage(false)).toMatch(/paste/i);
    expect(snapNotAJobMessage(true)).toMatch(/bandika/i);
  });
});

describe("eval: E1 — evidence engine catches invented claims in snap output", () => {
  it("an AI 'tailored' summary that invents an employer + skill + metric is flagged", () => {
    const r = verifyAiContent(
      "Led the frontend team at Google, increasing revenue by 40% with SAP S/4HANA.",
      cvFrontend.experience.map((e) => ({ id: e.id, company: e.company, description: e.description })),
      cvFrontend,
    );
    expect(r.allSupported).toBe(false);
    const kinds = r.unconfirmed.map((c) => `${c.kind}:${c.claim}`);
    expect(kinds.some((k) => k.startsWith("employer") && k.includes("google"))).toBe(true);
    expect(kinds.some((k) => k.startsWith("metric") && k.includes("40"))).toBe(true);
    expect(kinds.some((k) => k.startsWith("skill") && k.includes("sap"))).toBe(true);
  });

  it("a truthful re-emphasis stays confirmed (false-positive guard)", () => {
    const r = verifyAiContent(
      "Frontend engineer who built React dashboards at Nala Finance and integrated REST APIs.",
      cvFrontend.experience.map((e) => ({ id: e.id, company: e.company, description: e.description })),
      cvFrontend,
    );
    expect(r.allSupported).toBe(true);
  });

  it("the route runs verifyAiContent on the tailored CV (evidence gate)", () => {
    const src = route();
    expect(src).toMatch(/verifyAiContent/);
  });

  it("the client surfaces unconfirmed claims instead of silently committing them", () => {
    const src = client();
    expect(src).toMatch(/evidence\.unconfirmed/);
    expect(src).toMatch(/confirm/i);
  });
});

describe("eval: E1 — prompts stay truth-bound and id-guarded", () => {
  it("both prompt builders embed TRUTH_CONSTRAINT", () => {
    const src = pipeline();
    const occurrences = (src.match(/\$\{TRUTH_CONSTRAINT\}/g) ?? []).length;
    expect(occurrences).toBeGreaterThanOrEqual(2); // tailor + cover letter
    expect(snapTailorPrompt(JD, "Frontend Engineer", cvFrontend)).toContain("TRUTH CONSTRAINT");
    expect(snapCoverLetterPrompt(JD, cvFrontend)).toContain("TRUTH CONSTRAINT");
  });

  it("the tailor prompt carries the candidate's REAL facts (never a blank canvas)", () => {
    const p = snapTailorPrompt(JD, "Frontend Engineer", cvFrontend);
    expect(p).toContain("Nala Finance");
    expect(p).toContain("University of Dar es Salaam");
  });

  it("hallucinated experience ids are dropped by parseTailoredCv", () => {
    const raw = JSON.stringify({
      summary: "x",
      experience: [
        { id: "e1", description: "- real entry" },
        { id: "made-up-99", description: "- invented entry" },
      ],
    });
    const parsed = parseTailoredCv(raw, new Set(["e1"]));
    expect(parsed!.experience.map((e) => e.id)).toEqual(["e1"]);
  });

  it("snapMatch scores come from the real engine (0–100), not a guess", () => {
    const m = snapMatch(cvFrontend, JD);
    expect(m.before.score).toBeGreaterThanOrEqual(0);
    expect(m.before.score).toBeLessThanOrEqual(100);
    expect(m.after.score).toBeGreaterThanOrEqual(0);
    expect(m.after.score).toBeLessThanOrEqual(100);
    // The reorder can only help or keep the same — it never invents keywords.
    expect(m.after.score).toBeGreaterThanOrEqual(m.before.score);
  });
});
