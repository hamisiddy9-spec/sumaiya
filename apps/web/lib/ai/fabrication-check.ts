/**
 * A second, narrow AI pass that checks whether a tailored CV summary or
 * rewritten experience bullets claim anything the candidate's own facts don't
 * support — a job title, seniority, employer, mentorship, or scope of duties
 * lifted from the job posting rather than the candidate's real background.
 *
 * Why this exists as a SEPARATE call instead of trusting the generation
 * prompt's own TRUTH_CONSTRAINT: prompt instructions are not enforcement.
 * Observed failure (native app, tailoring a real Warehouse/shop-worker CV to
 * a "Principal Sales Engineer" posting): the model rewrote the summary into a
 * fabricated senior technical-sales career lifted straight from the JD,
 * despite the TRUTH_CONSTRAINT line being present in the same prompt. A
 * deterministic term-overlap check can't do this job — the candidate's real
 * facts are stored in whatever language the person used, the summary is
 * written in the user's requested language, and a good-faith translation of
 * real experience shares almost no surface vocabulary with the English facts.
 * Only something that can read meaning (a second, adversarial model pass
 * whose only job is to hunt for unsupported claims) can catch this reliably.
 *
 * Kept separate from tailoring-guards.ts, which is pure and dependency-free
 * by design — this one calls the network on purpose.
 */
import { callAi } from "../api/ai-provider";

export interface FabricationVerdict {
  fabricated: boolean;
  /** Short human-readable reason, present when fabricated is true. */
  reason: string;
}

/**
 * `candidateFacts` is the same fact block the generation prompt was given.
 * `generatedText` is the summary and/or rewritten experience bullets to
 * check — pass everything generated in one call so the model has full
 * context, rather than checking each field separately.
 *
 * Fails OPEN (returns not-fabricated) on a timeout, a malformed response, or
 * the AI provider being unavailable — this is a second opinion on top of the
 * generation prompt's own constraint, not the only line of defense, and a
 * check that can't run must never block a legitimate request.
 */
export async function checkNoFabrication(
  candidateFacts: string,
  generatedText: string,
): Promise<FabricationVerdict> {
  if (!generatedText.trim()) return { fabricated: false, reason: "" };

  const prompt = `You are a strict fact-checker. Below are a candidate's REAL, VERIFIED facts, and a SUMMARY that an AI wrote about them for a job application.

Does the SUMMARY claim, state, or strongly imply ANY of the following that is NOT directly supported by the CANDIDATE FACTS?
- a job title, role, or seniority level the candidate has not actually held
- an employer, industry, or years of experience not in their facts
- mentoring, managing, or leading others when their facts don't say so
- a specific technical skill, certification, or tool not in their facts
- any metric, number, or achievement not in their facts

Reframing real experience in the job's own vocabulary is FINE and expected (e.g. calling shop/retail work "customer-facing sales experience" is fine). Claiming the candidate already holds the target job itself, or duties/seniority they have not performed, is NOT fine.

Respond with STRICT JSON only: {"fabricated": true|false, "reason": ""}
"reason": one short sentence naming the specific unsupported claim, or "" when fabricated is false.

CANDIDATE FACTS:
"""
${candidateFacts}
"""

SUMMARY TO CHECK:
"""
${generatedText}
"""`;

  try {
    const raw = await callAi(prompt, { temperature: 0, maxTokens: 300, jsonMode: true, timeoutMs: 15_000 });
    if (!raw) return { fabricated: false, reason: "" };
    const parsed = JSON.parse(raw) as { fabricated?: unknown; reason?: unknown };
    if (typeof parsed.fabricated !== "boolean") return { fabricated: false, reason: "" };
    return { fabricated: parsed.fabricated, reason: typeof parsed.reason === "string" ? parsed.reason : "" };
  } catch {
    return { fabricated: false, reason: "" };
  }
}
