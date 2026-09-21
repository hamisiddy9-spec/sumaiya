// Snap-to-Apply (E1) — paste-text vertical slice.
//
// POST /api/ai/snap: user pastes a job description → one round trip returns
// (1) ATS match score vs their real CV, (2) a tailored CV (AI reword behind
// TRUTH_CONSTRAINT + the evidence engine), (3) a matching cover letter.
//
// Guards (absolute):
//   • looksLikeJobDescription gates the input — non-JD text gets a warm
//     NOT_A_JOB reply, never a fabricated job.
//   • No CV/profile → a warm NO_PROFILE next step, never a hallucinated result.
//   • Tailored-CV claims are re-checked against the user's real CV by
//     verifyAiContent — unverified claims are returned for confirmation,
//     never silently committed.
//
// Guests: signed-out users are welcome (per-IP daily cap via resolveAiUser);
// their CV comes from the client's localStorage draft (sumaiya-guest-cv)
// so the existing guest→save migration pattern works unchanged.

import { Hono, type Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { resolveAiUser } from "@/lib/api/routes/ai";
import { getUserId } from "@/lib/api/auth";
import { db } from "@/lib/db";
import { callAi, hasAiProvider } from "@/lib/api/ai-provider";
import { refundAiUsage } from "@/lib/api/ai-limit";
import { buildSnapShareToken } from "@/lib/api/snap-share";
import { looksLikeJobDescription, matchCvToJd } from "@/lib/job-match";
import { parseCvLoose, profileToCvData } from "@/lib/career-profile/mapper";
import { assembleUserContext } from "@/lib/assistant/context";
import { verifyAiContent } from "@/lib/career-profile/evidence";
import { sanitizePromptText } from "@/lib/jobs/text";
import {
  snapMatch,
  isUsableProfile,
  snapTailorPrompt,
  snapCoverLetterPrompt,
  parseTailoredCv,
  mergeTailoredCv,
  toEvidenceView,
  snapNotAJobMessage,
  snapNoProfileMessage,
  snapAiUnavailableMessage,
  snapAiPartialMessage,
} from "@/lib/api/snap-apply";
import type { CVData } from "@/types";
import type { SnapTailoredOkPayload } from "@/lib/outcomes/types";

// ── D8 funnel: best-effort outcome events ───────────────────────────────────
// Mirrors the assistant flows (lib/api/routes/ai.ts): lazy-import the events
// module off the hot path, fire only for signed-in users (guests have no user
// row to key), and swallow every failure — instrumentation never breaks the
// snap. With OUTCOME_SALT unset the emitter no-ops entirely anyway.
async function emitJdDetected(c: Context, lang: string | null): Promise<void> {
  try {
    const userId = await getUserId(c);
    if (!userId) return;
    const { recordSnapJdDetected } = await import("@/lib/outcomes/events");
    await recordSnapJdDetected(db, userId, { lang });
  } catch { /* swallowed */ }
}

async function emitTailoredOk(c: Context, payload: SnapTailoredOkPayload): Promise<void> {
  try {
    const userId = await getUserId(c);
    if (!userId) return;
    const { recordSnapTailoredOk } = await import("@/lib/outcomes/events");
    await recordSnapTailoredOk(db, userId, payload);
  } catch { /* swallowed */ }
}

const snapSchema = z.object({
  jobDescription: z.string().min(1).max(8000),
  lang: z.enum(["en", "sw"]).optional(),
  // Guest CV (from localStorage "sumaiya-guest-cv") — guests have no DB
  // row, so the client sends their draft. Authed users are never allowed to
  // override their stored profile via this field.
  cv: z.record(z.unknown()).optional(),
});

export const snapRoutes = new Hono().post("/snap", zValidator("json", snapSchema), async (c) => {
  const { jobDescription, lang, cv } = c.req.valid("json");
  const sw = lang === "sw";

  // ── Guard 1: never fabricate a job ────────────────────────────────────────
  if (!looksLikeJobDescription(jobDescription)) {
    return c.json({ success: false, code: "NOT_A_JOB", message: snapNotAJobMessage(sw) }, 422);
  }

  // D8 funnel: the JD guard passed — record it (signed-in only, best-effort).
  await emitJdDetected(c, lang ?? null);

  // ── Gate: authed quota or guest per-IP daily cap ──────────────────────────
  const gate = await resolveAiUser(c);
  if ("reject" in gate) {
    return c.json({ error: gate.reject.message, retryAfter: gate.reject.retryAfter }, 429);
  }
  const userId = gate.userId;

  // ── Resolve the candidate's REAL CV (never invented) ──────────────────────
  let cvData: CVData | null = null;
  let source: "profile" | "guest" = "guest";
  if (userId) {
    const ctx = await assembleUserContext(userId);
    if (ctx.profile) {
      cvData = profileToCvData(ctx.profile);
      source = "profile";
    } else if (ctx.activeCv) {
      cvData = ctx.activeCv.data;
      source = "profile";
    }
  }
  if (!cvData && cv) {
    cvData = parseCvLoose(cv);
    source = "guest";
  }

  // ── Guard 2: no profile → warm next step, never a hallucinated result ─────
  if (!cvData || !isUsableProfile(cvData)) {
    // The gate above already consumed one quota unit, but no AI work ran —
    // give the unit back so a user is never billed for a dead-end response
    // (same never-bill-for-nothing policy as the /api/ai failure paths).
    if (userId) await refundAiUsage(userId);
    return c.json({ success: false, code: "NO_PROFILE", message: snapNoProfileMessage(sw) }, 422);
  }

  const cleanJd = sanitizePromptText(jobDescription, 8000);

  // ── ATS match: deterministic, always available (even when AI is down) ─────
  let match = snapMatch(cvData, cleanJd, sw ? "sw" : "en");

  // ── AI: tailored CV + cover letter in parallel (one snap = one quota unit) ─
  let tailoredCv: { summary: string; experience: Array<{ id: string; description: string }> } | null = null;
  let evidence: Awaited<ReturnType<typeof verifyAiContent>> | null = null;
  let coverLetter: string | null = null;
  const warnings: string[] = [];

  if (hasAiProvider()) {
    const [tailorRaw, letterRaw] = await Promise.all([
      callAi(snapTailorPrompt(cleanJd, match.jobTitle, cvData, lang ?? "en"), {
        temperature: 0.5,
        maxTokens: 3600,
        jsonMode: true,
        timeoutMs: 52_000,
      }),
      callAi(snapCoverLetterPrompt(cleanJd, cvData, lang ?? "en"), {
        temperature: 0.7,
        maxTokens: 1200,
        timeoutMs: 52_000,
      }),
    ]);

    if (tailorRaw) {
      const parsed = parseTailoredCv(tailorRaw, new Set(cvData.experience.map((e) => e.id)));
      if (parsed) {
        tailoredCv = parsed;
        // Evidence check: every claim in the rewrite must exist in the user's
        // real CV. Unverified claims are returned (never silently committed) —
        // the client shows them so the user confirms before saving.
        try {
          evidence = verifyAiContent(
            parsed.summary,
            parsed.experience.map((e) => ({
              ...e,
              company: cvData.experience.find((x) => x.id === e.id)?.company,
            })),
            cvData,
          );
        } catch {
          evidence = null; // evidence is best-effort; never blocks the flow
        }
        // Honest delta: re-score the MERGED tailored CV with the real engine.
        // The deterministic reorder alone never changes the keyword term-set,
        // so the visible lift is the actual coverage change from the rewrite.
        const merged = mergeTailoredCv(cvData, parsed);
        const after = matchCvToJd(merged, cleanJd);
        match = {
          ...match,
          after: { score: after.score, matched: after.matched, missing: after.missing },
          tailored: true,
        };
      }
    }
    coverLetter = letterRaw;

    if (!tailoredCv && !coverLetter) {
      // No AI value delivered → refund the quota unit (never bill for nothing).
      if (userId) await refundAiUsage(userId);
      warnings.push(snapAiUnavailableMessage(sw));
    } else if (!tailoredCv || !coverLetter) {
      warnings.push(snapAiPartialMessage(sw));
    }
  } else {
    // No provider → the deterministic ATS match + reorder is FREE output (the
    // AI quota must never be charged for it — same policy as /api/ai/enhance,
    // which only charges when a provider exists). Refund the unit the gate
    // consumed so an AI-less snap never bills the user.
    if (userId) await refundAiUsage(userId);
    warnings.push(snapAiUnavailableMessage(sw));
  }

  // D8 funnel: tailored results are about to render — record the honest ATS
  // lift (numbers only; the delta is the actual keyword-coverage change).
  if (tailoredCv) {
    await emitTailoredOk(c, {
      beforeAts: match.before.score,
      afterAts: match.after.score,
      deltaAts: match.after.score - match.before.score,
      source,
      lang: lang ?? null,
    });
  }

  return c.json({
    success: true,
    data: {
      source,
      match,
      // The tailored CV as a full CVData the client can save/download directly
      // (summary + experience already merged; personal untouched).
      tailoredCv: tailoredCv ? mergeTailoredCv(cvData, tailoredCv) : null,
      evidence: toEvidenceView(evidence),
      coverLetter,
      warnings,
      // D4 — "Made with Sumaiya" viral hook: a signed, PII-free share
      // token (ATS score + sanitized job title + lang ONLY — no CV text, no
      // names, no contacts). Renders the public share card at /snap/share/<t>.
      shareToken: buildSnapShareToken({
        score: match.after.score,
        jobTitle: match.jobTitle,
        lang: sw ? "sw" : "en",
      }),
    },
  });
});
