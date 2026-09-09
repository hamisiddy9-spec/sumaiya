/**
 * Assistant tool registry — the single catalog of things the AI can *do* in the
 * platform. This is the backbone of the "one conversation does everything"
 * ecosystem: instead of hardcoding a chip per capability, the assistant picks a
 * tool from this catalog and the client dispatches it.
 *
 * Protocol: each assistant turn may return, alongside its reply, an
 *   action: { tool: <ToolId>, args: {...} }
 * chosen from the tools below. The client executes it:
 *   - sideEffect "read"  → run immediately and render a result card
 *   - sideEffect "write" → render a PREVIEW card and wait for the user to
 *     confirm ("Apply") before anything changes. Every write goes through an
 *     owner-checked, reversible endpoint.
 *
 * The catalog grows one phase at a time; keep it in lockstep with what the
 * client can actually dispatch, so the model never promises an action that
 * silently does nothing.
 */

export type ToolSideEffect = "read" | "write";

export interface AssistantTool {
  /** Stable id the model emits as action.tool — namespaced <domain>.<verb>. */
  id: string;
  /** Short human title for the card / chip label. */
  title: string;
  /** When the model SHOULD choose this tool (goes into the system prompt). */
  whenToUse: string;
  /** read = safe/instant; write = preview + explicit confirm before it runs. */
  sideEffect: ToolSideEffect;
  /** Human description of the args the model must supply (for the prompt). */
  args: string;
  /** Whether this tool needs an active CV in context to run. */
  needsCv?: boolean;
  /** Whether this tool needs an attached file (PDF/image) in context to run. */
  needsFile?: boolean;
  /** Registered capability the assistant should NOT offer unprompted — it's
   *  driven by the UI or the system (e.g. outcome.record). Still runs through
   *  the same run-tool guardrail pipeline. */
  hidden?: boolean;
}

// ─── Capability-layer metadata (system blueprint) ────────────────────────────
// The blueprint's tool model adds four dimensions to each capability: how much
// oversight it needs (policy), what it costs (cost), whether it works offline,
// and which entitlement gates it. Rather than edit all ~35 entries above, the
// metadata lives in one map; anything not listed falls back to a safe default
// derived from `sideEffect` (read → auto/none/local, write → preview/none/queue).
//
// This is consumed by lib/assistant/run-tool.ts (the unified guardrail
// pipeline) and by toolCatalogPrompt (to hide blocked tools from the model).

export type ToolPolicy = "auto" | "preview" | "confirm" | "blocked";
export type ToolCost = "none" | "cheap-ai" | "full-ai";
export type ToolOffline = "local" | "queue" | "online-only";

export interface ToolMeta {
  policy: ToolPolicy;
  cost: ToolCost;
  offline: ToolOffline;
  /** Entitlement key — matches Capability in lib/entitlements.ts. */
  capability: string;
}

const TOOL_META: Record<string, Partial<ToolMeta>> = {
  "ats.check": { policy: "auto", cost: "none", offline: "local", capability: "ats.check" },
  "jobs.match": { policy: "auto", cost: "none", offline: "local", capability: "jobs.match" },
  "jobs.search": { policy: "auto", cost: "none", offline: "online-only", capability: "jobs.search" },
  "career.skillGap": { policy: "auto", cost: "cheap-ai", offline: "online-only", capability: "ats.check" },
  "cv.compare": { policy: "auto", cost: "cheap-ai", offline: "online-only", capability: "ats.check" },
  "doc.summarize": { policy: "auto", cost: "cheap-ai", offline: "online-only", capability: "assistant.chat" },
  "doc.proofread": { policy: "auto", cost: "cheap-ai", offline: "online-only", capability: "cv.enhance" },
  "doc.compare": { policy: "auto", cost: "cheap-ai", offline: "online-only", capability: "assistant.chat" },

  "cv.improveSummary": { policy: "preview", cost: "full-ai", offline: "queue", capability: "cv.enhance" },
  "cv.addSkills": { policy: "preview", cost: "none", offline: "queue", capability: "cv.enhance" },
  "doc.expand": { policy: "preview", cost: "full-ai", offline: "queue", capability: "cv.enhance" },
  "doc.shorten": { policy: "preview", cost: "full-ai", offline: "queue", capability: "cv.enhance" },
  "template.smartFit": { policy: "preview", cost: "none", offline: "local", capability: "cv.create" },

  // Anything that creates a named artifact, sends externally, or commits a fact
  // is always `confirm` — permanently, not just v1 (blueprint decision D3).
  "cv.tailor": { policy: "confirm", cost: "full-ai", offline: "online-only", capability: "cv.tailor" },
  "doc.convert": { policy: "confirm", cost: "full-ai", offline: "online-only", capability: "cv.create" },
  "coverLetter.generate": { policy: "confirm", cost: "full-ai", offline: "online-only", capability: "coverLetter.generate" },
  "letter.quotation": { policy: "confirm", cost: "cheap-ai", offline: "online-only", capability: "letter.business" },
  "letter.invoice": { policy: "confirm", cost: "cheap-ai", offline: "online-only", capability: "letter.business" },
  "letter.letterhead": { policy: "confirm", cost: "cheap-ai", offline: "online-only", capability: "letter.business" },
  "letter.proposal": { policy: "confirm", cost: "cheap-ai", offline: "online-only", capability: "letter.business" },
  "jobs.track": { policy: "confirm", cost: "none", offline: "queue", capability: "application.track" },
  "application.update": { policy: "confirm", cost: "none", offline: "queue", capability: "application.track" },

  // The tap IS the confirmation — a one-tap "I got the interview" from the UI.
  "outcome.record": { policy: "auto", cost: "none", offline: "queue", capability: "outcome.record" },
};

/** Resolve full metadata for a tool, filling gaps from its side-effect. */
export function toolMeta(id: string): ToolMeta {
  const tool = BY_ID.get(id);
  const partial = TOOL_META[id] ?? {};
  const isWrite = tool?.sideEffect === "write";
  const isFile = !!tool?.needsFile;
  return {
    policy: partial.policy ?? (isWrite ? "preview" : "auto"),
    cost: partial.cost ?? "none",
    offline: partial.offline ?? (isFile ? "local" : isWrite ? "queue" : "local"),
    capability: partial.capability ?? (isWrite ? "cv.enhance" : "assistant.chat"),
  };
}

// ── Phase 1: read-only tools (safe, instant, already backed by engines) ────────
// These render a card with no mutation, so they're the safe first slice of the
// agentic loop. Write tools (tailor, cover letter, create CV, PDF ops, apply to
// a job) land in later phases behind the preview+confirm flow.
export const ASSISTANT_TOOLS: AssistantTool[] = [
  {
    id: "ats.check",
    title: "Check ATS readiness",
    whenToUse:
      "The user wants to know how well their CV will pass Applicant Tracking Systems / recruiter screening software, or asks for an ATS score or to find what's weak in their CV.",
    sideEffect: "read",
    args: "none (uses the active CV)",
    needsCv: true,
  },
  {
    id: "jobs.match",
    title: "Match CV to a job",
    whenToUse:
      "The user pastes or names a specific job description / advert and wants to know how well they fit it, or what keywords they're missing for that role.",
    sideEffect: "read",
    args: '{ "jobDescription": "<the pasted JD text>" }',
    needsCv: true,
  },
  {
    id: "jobs.search",
    title: "Find matching jobs",
    whenToUse:
      "The user wants to browse or find live job listings, optionally in a field or role, without pasting a specific advert.",
    sideEffect: "read",
    args: '{ "query": "<optional role/field, e.g. \'software engineer\'>" }',
    needsCv: false,
  },

  // ── Write tools — each renders a PREVIEW the user must confirm before it
  // changes their CV. Never invent facts; edits are grounded in the real CV.
  {
    id: "cv.tailor",
    title: "Tailor CV to a job",
    whenToUse:
      "The user wants their CV rewritten/optimised to target a specific job they pasted or named (not just to see a match score). Rewrites the summary + experience truthfully.",
    sideEffect: "write",
    args: '{ "jobDescription": "<the pasted JD text>" }',
    needsCv: true,
  },
  {
    id: "cv.improveSummary",
    title: "Improve the summary",
    whenToUse:
      "The user wants their professional summary strengthened, rewritten, shortened, or made more impactful — without adding facts that aren't already true.",
    sideEffect: "write",
    args: 'none (uses the active CV). Optionally { "directive": "shorter" | "ats" | "measurable" | "leadership" }',
    needsCv: true,
  },
  {
    id: "cv.addSkills",
    title: "Add skills",
    whenToUse:
      "The user says they have one or more skills they want added to their CV. Only skills the user actually states.",
    sideEffect: "write",
    args: '{ "skills": ["<skill>", "<skill>"] }',
    needsCv: true,
  },
  {
    id: "coverLetter.generate",
    title: "Write a cover letter",
    whenToUse:
      "The user wants a cover letter written for a job, based on their CV. If they earlier pasted a job you may omit jobDescription and it is reused.",
    sideEffect: "write",
    args: '{ "jobTitle"?: "<role>", "company"?: "<company>", "jobDescription"?: "<JD text if given>" }',
    needsCv: true,
  },
  {
    id: "jobs.track",
    title: "Track a job application",
    whenToUse:
      "The user wants to save or track a job they are applying to (start an application). Creates an application linked to their CV.",
    sideEffect: "write",
    args: '{ "jobTitle"?: "<role>", "companyName"?: "<company>", "jobDescription"?: "<JD text if given>" }',
    needsCv: true,
  },
  // ── Application lifecycle (Phase 2 E): applied → interviewing → offer/rejected.
  // Chat and dashboard write the SAME application records (PATCH /api/applications/:id).
  {
    id: "application.update",
    title: "Update an application's status",
    whenToUse:
      "The user says an application moved forward or backward — they got an interview, an offer, a rejection, or want to mark it applied/archived. Updates the tracked application's status.",
    sideEffect: "write",
    args: '{ "applicationId": "<the tracked application id>", "status": "<draft | applied | interviewing | offer | rejected | archived>", "notes"?: "<optional note>" }',
    needsCv: false,
  },
  // ── Business documents — quotation / proposal / invoice / letterhead. These
  // reuse the existing letter engine (build-doc → /api/letter → letter editor
  // with its templates): the assistant collects ONLY user-stated facts (items,
  // prices, parties, dates), never invents figures. Proposal = business-proposal.
  {
    id: "letter.quotation",
    title: "Write a quotation",
    whenToUse:
      "The user wants a quotation / quote / price list for a client (goods or services). Collect the items, quantities, unit prices, the client and any validity terms — only what the user states.",
    sideEffect: "write",
    args: '{ "details"?: "<optional: what the quotation is for, items/prices already given>" }',
  },
  {
    id: "letter.invoice",
    title: "Write an invoice",
    whenToUse:
      "The user wants an invoice / bill for goods or services delivered. Collect the client, items, quantities, unit prices, payment terms and invoice date — only what the user states.",
    sideEffect: "write",
    args: '{ "details"?: "<optional: what the invoice is for, items/prices already given>" }',
  },
  {
    id: "letter.letterhead",
    title: "Create a letterhead",
    whenToUse:
      "The user wants a company letterhead / branded letter header — company name, logo text, address, phone, email, website and any tagline. Only what the user states.",
    sideEffect: "write",
    args: '{ "details"?: "<optional: company details already given>" }',
  },
  {
    id: "letter.proposal",
    title: "Write a business proposal",
    whenToUse:
      "The user wants a business proposal / pitch / bid cover letter. Collect the client, the project or offer, scope and price — only what the user states.",
    sideEffect: "write",
    args: '{ "details"?: "<optional: what the proposal is about, scope/pricing already given>" }',
  },
  {
    id: "career.skillGap",
    title: "Skill-gap check + learning plan",
    whenToUse:
      "The user wants to know what skills a job expects that their CV is missing, or asks for a learning plan / how to prepare for a role. Deterministic strengths/gaps from the real match engine; the learning plan is a clearly-labelled AI recommendation built only from the gaps.",
    sideEffect: "read",
    args: '{ "jobTitle"?: "<role>", "jobDescription": "<the job description or role requirements>" }',
    needsCv: true,
  },
  {
    id: "cv.compare",
    title: "Compare two CVs",
    whenToUse:
      "The user wants to compare their CV against another CV, or asks which of two CVs is better for a job. If they provide a job description, both CVs are scored deterministically by the match engine (facts) and the AI explains the verdict; otherwise it compares skills/experience structure.",
    sideEffect: "read",
    args: '{ "otherCvText": "<the other CV text or pasted content>", "jobDescription"?: "<job description if given>" }',
    needsCv: true,
  },

  // ── PDF tools — operate on the file(s) the user has ATTACHED. Only offered
  // when a file is present. The result is a processed file the user downloads.
  // ── Document intelligence — read-style analysis of the active document.
  // These call the doc-intel endpoint and render a card; edit ops
  // (expand/shorten) preview first and apply only on explicit confirm.
  {
    id: "doc.summarize",
    title: "Summarize the document",
    whenToUse:
      "The user wants a short overview/summary of the active document (CV, cover letter, letter, business card) — its strongest facts in a few sentences.",
    sideEffect: "read",
    args: "none (uses the active document)",
    needsCv: true,
  },
  {
    id: "doc.expand",
    title: "Expand a section",
    whenToUse:
      "The user wants a section of the document (e.g. summary, experience, skills) written out more richly and professionally — with the SAME facts, never invented ones.",
    sideEffect: "write",
    args: '{ "section": "<section name, e.g. summary>" }',
    needsCv: true,
  },
  {
    id: "doc.shorten",
    title: "Shorten the document",
    whenToUse:
      "The user wants the document or a section tightened — less filler, same facts, more concise.",
    sideEffect: "write",
    args: '{ "section": "<optional section name>" }',
    needsCv: true,
  },
  {
    id: "doc.proofread",
    title: "Proofread the document",
    whenToUse:
      "The user wants the document checked for grammar, typos, punctuation, clarity and consistency, with a corrected version.",
    sideEffect: "read",
    args: "none (uses the active document)",
    needsCv: true,
  },
  {
    id: "doc.convert",
    title: "Convert the document",
    whenToUse:
      "The user wants this document turned into another type (e.g. CV → cover letter, CV → business card) using only facts already in the document.",
    sideEffect: "write",
    args: '{ "target": "<cover letter | business card | formal letter | CV>" }',
    needsCv: true,
  },
  {
    id: "doc.compare",
    title: "Compare documents",
    whenToUse:
      "The user pastes another document or job description and wants to know what the active document is missing or how they differ.",
    sideEffect: "read",
    args: '{ "otherText": "<the other document / job description text>" }',
    needsCv: true,
  },

  // ── Templates + SmartFit — reason about density/style and drive the real
  // design engine (density + sectionOrder + template family). Preview first.
  {
    id: "template.smartFit",
    title: "Fit / restyle the CV",
    whenToUse:
      "The user asks to make the CV fit better ('it doesn't fit', 'too long/cramped', 'one page') or to restyle it ('make it executive', 'modern', 'minimal', 'classic', 'creative'). Applies the real density/section/template engine after a preview.",
    sideEffect: "write",
    args: '{ "directive": "<the style/fit request, e.g. make it executive>" }',
    needsCv: true,
  },

  {
    id: "pdf.merge",
    title: "Merge PDFs",
    whenToUse: "The user attached two or more PDFs and wants them combined into one. Needs ≥2 attached files.",
    sideEffect: "write", args: "none (uses the attached files)", needsFile: true,
  },
  {
    id: "pdf.split",
    title: "Split / keep pages",
    whenToUse: "The user wants to keep only certain pages of the attached PDF.",
    sideEffect: "write", args: '{ "pages": "<e.g. 1,3,5-7>" }', needsFile: true,
  },
  {
    id: "pdf.deletePages",
    title: "Delete pages",
    whenToUse: "The user wants to remove certain pages from the attached PDF.",
    sideEffect: "write", args: '{ "pages": "<e.g. 2,5-6>" }', needsFile: true,
  },
  {
    id: "pdf.rotate",
    title: "Rotate pages",
    whenToUse: "The user wants to rotate the attached PDF (all pages, or specific ones).",
    sideEffect: "write", args: '{ "angle": "90"|"180"|"270", "pages"?: "<blank = all>" }', needsFile: true,
  },
  {
    id: "pdf.watermark",
    title: "Add a watermark",
    whenToUse: "The user wants diagonal watermark text stamped across the attached PDF.",
    sideEffect: "write", args: '{ "text": "<watermark text, Latin letters, ≤60 chars>" }', needsFile: true,
  },
  {
    id: "pdf.pageNumbers",
    title: "Add page numbers",
    whenToUse: "The user wants page numbers added to the attached PDF.",
    sideEffect: "write", args: "none (uses the attached file)", needsFile: true,
  },
  {
    id: "pdf.imageToPdf",
    title: "Images to PDF",
    whenToUse: "The user attached one or more images (JPG/PNG) and wants them turned into a PDF.",
    sideEffect: "write", args: "none (uses the attached images)", needsFile: true,
  },
  {
    id: "pdf.extractText",
    title: "Extract text",
    whenToUse: "The user wants the plain text pulled out of the attached PDF.",
    sideEffect: "read", args: "none (uses the attached file)", needsFile: true,
  },
  // ── PDF intelligence — extract text from the attached file, then reason
  // about it with the document-intelligence engine.
  {
    id: "pdf.summarize",
    title: "Summarize a PDF",
    whenToUse: "The user attached a PDF (job posting, report, terms, contract) and wants a short summary of what it says.",
    sideEffect: "read", args: "none (uses the attached file)", needsFile: true,
  },
  {
    id: "pdf.structure",
    title: "Outline a PDF",
    whenToUse: "The user attached a PDF and wants its structure — the sections with a one-line summary of each (like a table of contents).",
    sideEffect: "read", args: "none (uses the attached file)", needsFile: true,
  },
  {
    id: "pdf.compare",
    title: "Compare two PDFs",
    whenToUse: "The user attached TWO PDFs (e.g. two CVs, two job offers, a contract vs its draft) and wants to know how they differ.",
    sideEffect: "read", args: "none (uses both attached files)", needsFile: true,
  },
  {
    id: "pdf.ocr",
    title: "Read a scanned PDF",
    whenToUse: "The user attached a scanned/image PDF and wants its text. Extracts the embedded text layer; if the file is a pure scan with no text layer, says so honestly.",
    sideEffect: "read", args: "none (uses the attached file)", needsFile: true,
  },

  // ── System / UI-driven capabilities — registered here so they run through the
  // same run-tool guardrail pipeline, but `hidden` so the assistant never
  // offers them unprompted.
  {
    id: "outcome.record",
    title: "Record an application outcome",
    whenToUse: "System/UI only — the get-hired feedback loop. The user taps 'I got the interview / the offer / the job / no'.",
    sideEffect: "write",
    args: '{ "applicationId": "<id>", "stage": "interview" | "offer" | "hired" | "no" }',
    hidden: true,
  },
];

const BY_ID = new Map(ASSISTANT_TOOLS.map((t) => [t.id, t]));

export function findTool(id: string): AssistantTool | undefined {
  return BY_ID.get(id);
}

export function isToolId(id: unknown): id is string {
  return typeof id === "string" && BY_ID.has(id);
}

/**
 * Render the catalog into a compact block for the assistant's system prompt, so
 * the model knows exactly which actions exist and when to pick each. Only tools
 * whose preconditions are met (e.g. an active CV) are offered.
 */
export function toolCatalogPrompt(opts: { hasCv: boolean; hasFile?: boolean }): string {
  const available = ASSISTANT_TOOLS.filter((t) =>
    !t.hidden && (t.needsCv ? opts.hasCv : true) && (t.needsFile ? !!opts.hasFile : true)
  );
  if (!available.length) return "";
  const lines = available
    .map((t) => `- ${t.id} — ${t.title}. Use when: ${t.whenToUse} Args: ${t.args}.`)
    .join("\n");
  return `You can also DO things for the user by returning an action. Available actions:\n${lines}\n\nWhen the user's intent clearly matches one of these, include it as "action": { "tool": "<id>", "args": { ... } } in your JSON, alongside a short natural "reply" that tells them what you're doing. If no action fits, omit "action" and just reply. Never invent a tool id that isn't listed.`;
}
