// /api/ai/snap route tests — quota/refund correctness on every failure path.
//
// The gate (resolveAiUser → checkAiQuota) consumes one quota unit up front for
// authed users. The route's own invariant is "never bill for nothing": a unit
// must be refunded whenever the request delivers NO AI value. These tests pin
// that the refund happens on every no-AI-output path and never on success.
//
// Heavy modules (DB-touching) are mocked; the pure pipeline (snapMatch,
// parseTailoredCv, mergeTailoredCv, evidence, JD guard) runs for real.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { snapRoutes } from "./snap";
import type { CVData } from "@/types";

const mocks = vi.hoisted(() => ({
  resolveAiUser: vi.fn(),
  hasAiProvider: vi.fn(),
  callAi: vi.fn(),
  refundAiUsage: vi.fn(),
  assembleUserContext: vi.fn(),
}));

vi.mock("@/lib/api/routes/ai", () => ({ resolveAiUser: mocks.resolveAiUser }));
vi.mock("@/lib/api/ai-provider", () => ({ callAi: mocks.callAi, hasAiProvider: mocks.hasAiProvider }));
vi.mock("@/lib/api/ai-limit", () => ({ refundAiUsage: mocks.refundAiUsage }));
vi.mock("@/lib/assistant/context", () => ({ assembleUserContext: mocks.assembleUserContext }));

// A realistic pasted advert — passes looksLikeJobDescription (real guard).
const JD = `Frontend Engineer — Dar es Salaam (Full-time)

About the role: We are looking for a Frontend Engineer to build customer-facing dashboards.

Responsibilities:
- Build responsive interfaces with React and TypeScript
- Integrate REST APIs and write unit tests

Requirements:
- 3+ years of experience with React and JavaScript
- Experience with Git and deploying to Vercel

How to apply: send your CV to careers@example.com`;

const cvData: CVData = {
  personal: {
    fullName: "Ada Lovelace",
    jobTitle: "Frontend Engineer",
    email: "ada@example.com",
    phone: "",
    location: "Dar es Salaam",
  },
  summary: "Frontend engineer who built React dashboards at Nala Finance and integrated REST APIs.",
  experience: [
    {
      id: "e1",
      company: "Nala Finance",
      position: "Frontend Engineer",
      startDate: "2021",
      endDate: "2024",
      current: false,
      description: "Built React dashboards and integrated REST APIs.",
    },
  ],
  education: [
    {
      id: "ed1",
      institution: "University of Dar es Salaam",
      degree: "BSc",
      field: "Computer Science",
      startDate: "2016",
      endDate: "2020",
    },
  ],
  skills: [
    { id: "s1", name: "React", level: 3 },
    { id: "s2", name: "TypeScript", level: 3 },
  ],
  projects: [],
  languages: [],
  certifications: [],
  referees: [],
  hobbies: "",
};

async function postSnap(body: Record<string, unknown>) {
  return snapRoutes.request("/snap", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function json(res: Response) {
  return (await res.json()) as Record<string, any>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.resolveAiUser.mockResolvedValue({ userId: "u1" });
  mocks.assembleUserContext.mockResolvedValue({ profile: null, activeCv: { data: cvData } });
  mocks.hasAiProvider.mockReturnValue(true);
  mocks.callAi.mockResolvedValue(null);
  mocks.refundAiUsage.mockResolvedValue(undefined);
});

describe("snap route — quota refunded on every no-AI-value path", () => {
  it("NO_PROFILE (no CV/profile at all) refunds the unit the gate consumed", async () => {
    mocks.assembleUserContext.mockResolvedValue({ profile: null, activeCv: null });

    const res = await postSnap({ jobDescription: JD });
    const body = await json(res);

    expect(res.status).toBe(422);
    expect(body.code).toBe("NO_PROFILE");
    // No AI work ran → the user must not be billed for the dead-end response.
    expect(mocks.refundAiUsage).toHaveBeenCalledTimes(1);
    expect(mocks.refundAiUsage).toHaveBeenCalledWith("u1");
  });

  it("no AI provider → deterministic-only snap refunds the unit (AI output is free)", async () => {
    mocks.hasAiProvider.mockReturnValue(false);

    const res = await postSnap({ jobDescription: JD });
    const body = await json(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.match.before.score).toBeGreaterThanOrEqual(0);
    expect(body.data.warnings.length).toBe(1);
    // The warning is Sumaiya speaking in the first person (see
    // docs/SUMAIYA-VOICE-RULE-2026-09-20.md) — it used to read "AI writing is
    // temporarily unavailable".
    expect(body.data.warnings[0]).toMatch(/I can't write right now/i);
    expect(mocks.refundAiUsage).toHaveBeenCalledTimes(1);
    expect(mocks.refundAiUsage).toHaveBeenCalledWith("u1");
  });

  it("guest + no provider → no refund attempted (guests are never charged)", async () => {
    mocks.resolveAiUser.mockResolvedValue({ userId: null });
    mocks.hasAiProvider.mockReturnValue(false);

    // Guests have no DB row, so the client sends the localStorage draft as `cv`.
    const res = await postSnap({ jobDescription: JD, cv: cvData });
    const body = await json(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.source).toBe("guest");
    expect(mocks.refundAiUsage).not.toHaveBeenCalled();
  });

  it("provider up but BOTH AI outputs failed → refund (never bill for nothing)", async () => {
    // callAi resolves null for the tailor AND the cover letter.
    const res = await postSnap({ jobDescription: JD });
    const body = await json(res);

    expect(res.status).toBe(200);
    expect(body.data.tailoredCv).toBeNull();
    expect(body.data.coverLetter).toBeNull();
    expect(body.data.warnings.length).toBe(1);
    expect(mocks.refundAiUsage).toHaveBeenCalledTimes(1);
    expect(mocks.refundAiUsage).toHaveBeenCalledWith("u1");
  });

  it("full success (tailored CV + cover letter) → NO refund", async () => {
    mocks.callAi.mockImplementation(async (prompt: string) => {
      if (prompt.includes("cover letter")) return "A warm, confident cover letter body.";
      return JSON.stringify({
        summary: "Frontend engineer who built React dashboards at Nala Finance and integrated REST APIs.",
        experience: [{ id: "e1", description: "- Built React dashboards and integrated REST APIs for fintech customers." }],
      });
    });

    const res = await postSnap({ jobDescription: JD });
    const body = await json(res);

    expect(res.status).toBe(200);
    expect(body.data.coverLetter).toBe("A warm, confident cover letter body.");
    expect(body.data.tailoredCv).not.toBeNull();
    expect(body.data.tailoredCv.summary).toContain("Nala Finance");
    expect(body.data.match.tailored).toBe(true);
    expect(mocks.refundAiUsage).not.toHaveBeenCalled();
  });
});
