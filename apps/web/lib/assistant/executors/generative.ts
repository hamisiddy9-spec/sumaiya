// Generative tool executors (system blueprint — Stage 3 core).
//
// These run INSIDE the run-tool guardrail pipeline: args are already validated,
// entitlement is already checked, AI quota is already reserved (run-tool refunds
// on a thrown error). Each executor:
//
//   1. builds its prompt from the CV in context + the validated args
//   2. calls the model
//   3. runs the deterministic evidence engine over the output
//   4. returns ProvenanceSpan[] — every rewritten field gets a source:
//        ai_tightened  — the user's own words, rephrased, no new facts
//        ai_suggested  — the evidence engine found an unbacked claim; the user
//                        must confirm it before the doc is "final"
//
// run-tool persists the spans (writeProvenance) and stamps promptVersion/model
// onto the eval sample via ExecResult.meta.

import "server-only";
import { callAi, activeProvider } from "@/lib/api/ai-provider";
import { TRUTH_CONSTRAINT } from "@/lib/api/ai-guardrails";
import { promptVersion, type PromptId } from "@/lib/ai/prompts";
import { verifyAiContent, type EvidenceReport } from "@/lib/career-profile/evidence";
import { sanitizePromptText } from "@/lib/jobs/text";
import type { CVData, ExperienceEntry } from "@/types";
import type { ProvenanceSpan, SourceKind } from "@/lib/provenance";

export interface GenExecResult {
  data: unknown;
  provenance: ProvenanceSpan[];
  meta: { promptId: PromptId; promptVersion: string; model: string };
}

function modelTag(): string {
  return activeProvider() ?? "none";
}

function span(fieldPath: string, text: string, kind: SourceKind): ProvenanceSpan {
  return {
    fieldPath,
    spanStart: 0,
    spanEnd: text.length,
    sourceKind: kind,
    sourceRef: "",
    confirmedAt: null,
  };
}

/** ai_suggested when the evidence engine found an unbacked claim, else ai_tightened. */
function kindFor(report: EvidenceReport | null): SourceKind {
  return report && !report.allSupported ? "ai_suggested" : "ai_tightened";
}

function safeParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

class GenExecError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

// ─── cv.improveSummary — rewrite the professional summary, truthfully ────────

export async function execImproveSummary(
  args: Record<string, unknown>,
  cv: CVData,
  sw: boolean,
): Promise<GenExecResult> {
  const current = (cv.summary ?? "").trim();
  if (!current) throw new GenExecError("no_summary");
  const directive = typeof args.directive === "string" ? sanitizePromptText(args.directive, 400) : "";
  const role = cv.personal?.jobTitle ? sanitizePromptText(cv.personal.jobTitle, 120) : "";

  const prompt = `You are helping a real job-seeker sharpen their CV professional summary. Write plainly and specifically, like a human — no corporate clichés (results-driven, passionate, team player, synergy, dynamic, detail-oriented), no "I am"/"Results-driven" opener. It MUST match the candidate's stated profession and describe the ACTUAL work of that profession — never reframe a clinical, trade, care or technical role as sales or customer service. Keep every real fact the candidate gave; invent no employers, numbers, industries or achievements. 2–4 sentences, in the SAME language as the input. ${TRUTH_CONSTRAINT}
${role ? `\nThe candidate's role/title: ${role}` : ""}${directive ? `\nAdjust for this: ${directive}` : ""}

CURRENT SUMMARY:
"""
${current}
"""

Return ONLY the rewritten summary, no preamble or quotes.`;

  const out = await callAi(prompt, { temperature: 0.6, maxTokens: 500 });
  if (!out) throw new GenExecError("ai_unavailable");
  const summary = out.trim();

  const evidence = verifyAiContent(summary, [], cv);
  return {
    data: { summary, source: "ai", evidence },
    provenance: [span("summary", summary, kindFor(evidence))],
    meta: { promptId: "tailor.summary", promptVersion: promptVersion("tailor.summary"), model: modelTag() },
  };
}

// ─── cv.tailor — rewrite summary + every experience entry to a job ──────────

export async function execTailorCv(
  args: Record<string, unknown>,
  cv: CVData,
): Promise<GenExecResult> {
  const jd = sanitizePromptText(String(args.jobDescription ?? ""), 8000);
  if (!jd) throw new GenExecError("no_jd");
  const experience = (cv.experience ?? []).slice(0, 12);
  const expBlock = experience
    .map((e) => `[${e.id}] ${e.position || ""}${e.company ? " @ " + e.company : ""}\n${e.description || "(no description)"}`)
    .join("\n\n");

  const prompt = `You are an expert CV writer tailoring a candidate's CV to a SPECIFIC job. Rewrite their professional summary AND each work-experience entry's bullet points to (1) emphasise the experience most relevant to THIS job and (2) naturally weave in the job's real keywords — but ONLY where truthful to what the candidate actually did. Don't drop important real content. Each experience's bullets concise, each starting with "- ". Same language as the CV content. ${TRUTH_CONSTRAINT}

Return STRICT JSON (no extra keys, no commentary, no markdown):
{"summary":"","experience":[{"id":"","description":""}]}
Return the SAME experience ids listed below — do not add, drop, reorder or renumber.

JOB DESCRIPTION:
"""
${jd}
"""

CURRENT SUMMARY:
"""
${cv.summary || "(none yet)"}
"""

CURRENT EXPERIENCE (id in [brackets]):
"""
${expBlock || "(none)"}
"""`;

  const raw = await callAi(prompt, { temperature: 0.5, maxTokens: 3600, jsonMode: true, timeoutMs: 52_000 });
  if (!raw) throw new GenExecError("ai_unavailable");
  const parsed = safeParseJson(raw) as { summary?: string; experience?: Array<{ id?: string; description?: string }> } | null;
  if (!parsed) throw new GenExecError("bad_json");

  const validIds = new Set(experience.map((e) => e.id));
  const exp = (parsed.experience ?? [])
    .filter((e) => e?.id && validIds.has(e.id) && typeof e.description === "string" && e.description.trim())
    .map((e) => ({ id: e.id!, description: e.description!.trim() }));
  const summary =
    typeof parsed.summary === "string" && parsed.summary.trim() ? parsed.summary.trim() : cv.summary || "";

  const aiExperience = exp.map((e) => {
    const src = experience.find((x) => x.id === e.id);
    return { id: e.id, position: src?.position, company: src?.company, description: e.description };
  });
  const evidence = verifyAiContent(summary, aiExperience, cv);
  const kind = kindFor(evidence);

  const provenance: ProvenanceSpan[] = [];
  if (summary) provenance.push(span("summary", summary, kind));
  for (const e of exp) provenance.push(span(`experience[${e.id}].description`, e.description, kind));

  return {
    data: { summary, experience: exp, evidence },
    provenance,
    meta: { promptId: "tailor.cv", promptVersion: promptVersion("tailor.cv"), model: modelTag() },
  };
}

// ─── coverLetter.generate — draft a letter body from the CV + job ───────────

export async function execCoverLetter(
  args: Record<string, unknown>,
  cv: CVData,
  sw: boolean,
): Promise<GenExecResult> {
  const jobTitle = typeof args.jobTitle === "string" ? sanitizePromptText(args.jobTitle, 200) : "";
  const company = typeof args.company === "string" ? sanitizePromptText(args.company, 200) : "";
  const jd = typeof args.jobDescription === "string" ? sanitizePromptText(args.jobDescription, 8000) : "";
  const fullName = cv.personal?.fullName ?? "";
  const highlights = [
    cv.summary,
    ...(cv.experience ?? []).slice(0, 4).map((e: ExperienceEntry) => `${e.position} @ ${e.company}: ${e.description}`),
    (cv.skills ?? []).slice(0, 12).join(", "),
  ]
    .filter(Boolean)
    .join("\n");
  const langName = sw ? "Swahili" : "English";

  const prompt = `Write a compelling, professional cover letter BODY for the job below, in ${langName}. Confident but warm, 3–4 short paragraphs. Do NOT include the address block, date, "Dear..." greeting or sign-off — ONLY the body paragraphs. Ground every claim in the candidate's highlights. If the candidate is a student or recent graduate with little work history, write a confident entry-level letter that leads with motivation, education and relevant skills, without apologising for inexperience. ${TRUTH_CONSTRAINT}

CANDIDATE: ${fullName || "(the applicant)"}
TARGET ROLE: ${jobTitle || "(not specified)"}
COMPANY: ${company || "(not specified)"}

CANDIDATE HIGHLIGHTS:
"""
${highlights || "(none provided)"}
"""

JOB DESCRIPTION:
"""
${jd || "(none provided)"}
"""`;

  const out = await callAi(prompt, { temperature: 0.7, maxTokens: 1200 });
  if (!out) throw new GenExecError("ai_unavailable");
  const content = out.trim();

  const evidence = verifyAiContent(content, [], cv);
  return {
    data: { content, lang: sw ? "sw" : "en", evidence },
    provenance: [span("body", content, kindFor(evidence))],
    meta: { promptId: "coverLetter.generate", promptVersion: promptVersion("coverLetter.generate"), model: modelTag() },
  };
}

export { GenExecError };
