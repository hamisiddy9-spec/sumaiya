// Typed assistant actions + per-tool input schemas (WS-3).
//
// The model emits `action: { tool, args }`. This module is the typed contract
// between the model, the server, and the client:
//   - TOOL_ARG_SCHEMAS — strict zod schemas per tool; the assistant-turn route
//     validates model-emitted args SERVER-SIDE before dispatch (previously
//     args passed through unvalidated — each client handler was the only
//     guard).
//   - semanticActionType(tool) — maps a tool to the directive's semantic UI
//     event vocabulary (show_match_score, show_missing_keywords,
//     show_document_diff, create_document, update_application,
//     ask_confirmation) so the client can pick the card family without a
//     parallel dispatch system.
//   - AssistantAction — the typed union the client dispatches.
//
// No AI here — pure validation + mapping, unit-tested.

import { z } from "zod";

export const APP_STATUS = ["draft", "applied", "interviewing", "offer", "rejected", "archived"] as const;

// ─── Per-tool input schemas ────────────────────────────────────────────────────
// Strict about shape; lenient about optional fields. max lengths mirror the
// downstream route schemas so a validated action can never 400 at the endpoint.
export const TOOL_ARG_SCHEMAS = {
  "ats.check": z.object({}).strict(),
  "jobs.match": z.object({ jobDescription: z.string().min(1).max(60000) }).strict(),
  "jobs.search": z.object({ query: z.string().max(200).optional() }).strict(),
  "career.skillGap": z.object({ jobTitle: z.string().max(200).optional(), jobDescription: z.string().min(1).max(60000) }).strict(),
  "cv.compare": z.object({ otherCvText: z.string().min(1).max(60000), jobDescription: z.string().max(60000).optional() }).strict(),
  "cv.tailor": z.object({ jobDescription: z.string().min(1).max(60000) }).strict(),
  "cv.improveSummary": z.object({ directive: z.string().max(1000).optional() }).strict(),
  "cv.addSkills": z.object({ skills: z.array(z.string().min(1).max(100)).min(1).max(40) }).strict(),
  "coverLetter.generate": z.object({
    jobTitle: z.string().max(200).optional(),
    company: z.string().max(200).optional(),
    jobDescription: z.string().max(60000).optional(),
  }).strict(),
  "jobs.track": z.object({
    jobTitle: z.string().max(200).optional(),
    companyName: z.string().max(200).optional(),
    jobDescription: z.string().max(60000).optional(),
  }).strict(),
  "application.update": z.object({
    applicationId: z.string().min(1).max(100),
    status: z.enum(APP_STATUS),
    notes: z.string().max(2000).optional(),
  }).strict(),
  "outcome.record": z.object({
    applicationId: z.string().min(1).max(100),
    stage: z.enum(["interview", "offer", "hired", "no"]),
  }).strict(),
  "doc.summarize": z.object({}).strict(),
  "doc.proofread": z.object({}).strict(),
  "doc.compare": z.object({ otherText: z.string().min(1).max(60000) }).strict(),
  "doc.expand": z.object({ section: z.string().min(1).max(100) }).strict(),
  "doc.shorten": z.object({ section: z.string().max(100).optional() }).strict(),
  "doc.convert": z.object({ target: z.string().min(1).max(100) }).strict(),
  "template.smartFit": z.object({ directive: z.string().min(1).max(1000) }).strict(),
  "letter.quotation": z.object({ details: z.string().max(4000).optional() }).strict(),
  "letter.invoice": z.object({ details: z.string().max(4000).optional() }).strict(),
  "letter.letterhead": z.object({ details: z.string().max(4000).optional() }).strict(),
  "letter.proposal": z.object({ details: z.string().max(4000).optional() }).strict(),
  "pdf.extractText": z.object({}).strict(),
  "pdf.summarize": z.object({}).strict(),
  "pdf.structure": z.object({}).strict(),
  "pdf.compare": z.object({}).strict(),
  "pdf.ocr": z.object({}).strict(),
  "pdf.merge": z.object({}).strict(),
  "pdf.split": z.object({ pages: z.string().max(200).optional() }).strict(),
  "pdf.deletePages": z.object({ pages: z.string().max(200).optional() }).strict(),
  "pdf.rotate": z.object({ angle: z.number().int().min(0).max(360).optional(), pages: z.string().max(200).optional() }).strict(),
  "pdf.watermark": z.object({ text: z.string().max(200).optional() }).strict(),
  "pdf.pageNumbers": z.object({}).strict(),
  "pdf.imageToPdf": z.object({}).strict(),
} as const satisfies Record<string, z.ZodType>;

export type ToolIdWithSchema = keyof typeof TOOL_ARG_SCHEMAS;

/** Validate model-emitted args for a tool id. Unknown tool → invalid. */
export function validateToolArgs(
  tool: string,
  args: Record<string, unknown>
): { ok: true; args: Record<string, unknown> } | { ok: false; error: string } {
  const schema = TOOL_ARG_SCHEMAS[tool as ToolIdWithSchema];
  if (!schema) return { ok: false, error: `no schema for tool ${tool}` };
  const result = schema.safeParse(args ?? {});
  if (!result.success) {
    return { ok: false, error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  }
  return { ok: true, args: result.data as Record<string, unknown> };
}

// ─── Semantic action vocabulary (directive §21) ────────────────────────────────
// The tool ids stay the dispatch contract; the semantic type tells the client
// WHICH card family renders. One tool → one semantic type (stable).

export type SemanticActionType =
  | "show_match_score"
  | "show_missing_keywords"
  | "show_document_diff"
  | "create_document"
  | "update_application"
  | "ask_confirmation";

const SEMANTIC_MAP: Record<string, SemanticActionType> = {
  "ats.check": "show_match_score",
  "jobs.match": "show_match_score",
  "career.skillGap": "show_missing_keywords",
  "cv.compare": "show_match_score",
  "cv.tailor": "show_document_diff",
  "cv.improveSummary": "show_document_diff",
  "cv.addSkills": "show_document_diff",
  "doc.summarize": "show_document_diff",
  "doc.proofread": "show_document_diff",
  "doc.compare": "show_document_diff",
  "doc.expand": "show_document_diff",
  "doc.shorten": "show_document_diff",
  "doc.convert": "show_document_diff",
  "template.smartFit": "show_document_diff",
  "coverLetter.generate": "create_document",
  "letter.quotation": "create_document",
  "letter.invoice": "create_document",
  "letter.letterhead": "create_document",
  "letter.proposal": "create_document",
  "jobs.track": "update_application",
  "application.update": "update_application",
  "jobs.search": "show_missing_keywords",
  "pdf.extractText": "show_document_diff",
  "pdf.summarize": "show_document_diff",
  "pdf.structure": "show_document_diff",
  "pdf.compare": "show_document_diff",
  "pdf.ocr": "show_document_diff",
  "pdf.merge": "show_document_diff",
  "pdf.split": "show_document_diff",
  "pdf.deletePages": "show_document_diff",
  "pdf.rotate": "show_document_diff",
  "pdf.watermark": "show_document_diff",
  "pdf.pageNumbers": "show_document_diff",
  "pdf.imageToPdf": "show_document_diff",
};

export function semanticActionType(tool: string): SemanticActionType | null {
  return SEMANTIC_MAP[tool] ?? null;
}

/** Typed dispatch contract the client receives (tool + validated args + card kind). */
export interface AssistantAction {
  tool: string;
  args: Record<string, unknown>;
  /** Card family selector — derived, never emitted by the model. */
  type: SemanticActionType;
}
