// run-tool — the unified guardrail pipeline (system blueprint).
//
// Every capability call — from a UI button, the assistant, cron, or the
// WhatsApp worker — goes through this one function, in this one order:
//
//   validate args → precondition (needs CV/file) → entitlement (can())
//   → content-boundary sanitize → AI quota → policy gate
//   → execute → provenance write → tool_invocation row → analytics event
//   → eval sample (generative tools)
//
// The guardrails live in the execution path, not in a prompt. A `confirm`-policy
// tool never runs until `confirmed: true` is passed. A `preview`-policy tool
// runs but returns its result as a preview for the caller to accept.
//
// Executors are registered per tool id. Deterministic tools (ats.check,
// jobs.match) are wired here; generative tools are added as their routes adopt
// the pipeline. An unregistered tool still runs the full guardrail pipeline and
// returns a typed `no_executor` — so callers can migrate incrementally.

import { createHash } from "node:crypto";
import { nanoid } from "nanoid";
import type { CVData } from "@/types";
import { db, toolInvocation, evalSample } from "@/lib/db";
import { can, type Capability, type EntitlementSubject } from "@/lib/entitlements";
import { findTool, toolMeta, type ToolCost, type ToolPolicy } from "@/lib/assistant/tools";
import { validateToolArgs } from "@/lib/assistant/actions";
import { checkAiQuota, refundAiUsage } from "@/lib/api/ai-limit";
import { sanitizePromptText } from "@/lib/jobs/text";
import { captureServer } from "@/lib/analytics/server";
import type { ToolCaller, ToolOutcome } from "@/lib/analytics/events";
import { analyzeCv, atsScore, atsBreakdown } from "@/lib/ats-score";
import { matchCvToJd, looksLikeJobDescription } from "@/lib/job-match";
import type { ProvenanceSpan } from "@/lib/provenance";
import { recordApplicationStatus } from "@/lib/outcomes/events";
import { checkRowOwnership } from "@/lib/assistant/tool-authz";
import { checkMonthlyBudget } from "@/lib/ai/budget";
import {
  execImproveSummary,
  execTailorCv,
  execCoverLetter,
  GenExecError,
} from "@/lib/assistant/executors/generative";
import { writeProvenance } from "@/lib/provenance-write";

// ─── Types ───────────────────────────────────────────────────────────────────

export type { ToolCaller };

export interface ToolSubject extends EntitlementSubject {
  /** UI language — passed to engines that render bilingual output. */
  sw?: boolean;
}

export interface ToolRunContext {
  /** The active CV, for tools with `needsCv`. */
  cv?: CVData | null;
  /** True when the caller has attached a file, for tools with `needsFile`. */
  hasFile?: boolean;
  /** Free-form context the executor may read (job id, application id, …). */
  extra?: Record<string, unknown>;
}

export type BlockReason =
  | "unknown_tool"
  | "invalid_args"
  | "needs_cv"
  | "needs_file"
  | "guest_only"
  | "requires_plan"
  | "quota"
  | "disabled"
  | "bad_advert"
  | "not_owner";

export type ToolResult =
  | { status: "ok"; tool: string; data: unknown; provenance?: ProvenanceSpan[] }
  | { status: "preview"; tool: string; data: unknown; provenance?: ProvenanceSpan[] }
  | { status: "confirm_required"; tool: string; summary: string }
  | { status: "blocked"; tool: string; reason: BlockReason; detail?: string; retryAfter?: number }
  | { status: "error"; tool: string; code: string };

export interface RunToolInput {
  toolId: string;
  args?: Record<string, unknown>;
  subject: ToolSubject;
  caller: ToolCaller;
  context?: ToolRunContext;
  /** Required for `confirm`-policy tools to actually execute. */
  confirmed?: boolean;
  /** Override the eval sample rate for tests (0..1). */
  evalSampleRate?: number;
}

interface ExecResult {
  data: unknown;
  provenance?: ProvenanceSpan[];
  /** Generative executors report which prompt + model produced the output. */
  meta?: { promptId?: string; promptVersion?: string; model?: string };
}

type ToolExecutor = (
  args: Record<string, unknown>,
  ctx: { subject: ToolSubject; run: ToolRunContext },
) => Promise<ExecResult>;

// ─── String args that carry untrusted pasted content ────────────────────────
// These are sanitized before an executor or a model ever sees them (the
// content-boundary rule: a JD / CV / pasted doc is DATA, never instructions).
const UNTRUSTED_STRING_ARGS = new Set([
  "jobDescription",
  "otherCvText",
  "otherText",
  "details",
  "message",
]);

// ─── Executors (deterministic reference set) ─────────────────────────────────

const EXECUTORS: Record<string, ToolExecutor> = {
  "ats.check": async (_args, { subject, run }) => {
    const cv = run.cv!;
    const checks = analyzeCv(cv, !!subject.sw);
    return {
      data: {
        score: atsScore(checks),
        breakdown: atsBreakdown(checks, !!subject.sw),
        checks,
      },
    };
  },

  "jobs.match": async (args, { run }) => {
    const cv = run.cv!;
    const jd = String(args.jobDescription ?? "");
    return { data: matchCvToJd(cv, jd) };
  },

  "career.skillGap": async (args, { run }) => {
    // Deterministic strengths / gaps / learnable gaps / real course links from
    // the match engine. The AI learning plan stays on the dedicated route.
    const { analyzeSkillGap } = await import("@/lib/skill-gap");
    return { data: { facts: analyzeSkillGap(run.cv!, String(args.jobDescription ?? "")), learningPlan: null } };
  },

  "cv.improveSummary": async (args, { subject, run }) =>
    execImproveSummary(args, run.cv!, !!subject.sw),

  "cv.tailor": async (args, { run }) => execTailorCv(args, run.cv!),

  "coverLetter.generate": async (args, { subject, run }) =>
    execCoverLetter(args, run.cv!, !!subject.sw),

  "outcome.record": async (args, { subject }) => {
    // The get-hired feedback loop. One-tap: "did you get the interview / offer?"
    const stage = String(args.stage ?? "");
    const to: Record<string, string> = {
      interview: "interviewing",
      offer: "offer",
      hired: "hired",
      no: "rejected",
    };
    if (!to[stage]) throw new ToolExecError("bad_stage");
    await recordApplicationStatus(db, subject.userId ?? "", {
      applicationId: String(args.applicationId ?? ""),
      from: "applied",
      to: to[stage],
      matchScore: null,
    });
    return { data: { recorded: true, stage, to: to[stage] } };
  },
};

class ToolExecError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hashInput(toolId: string, args: Record<string, unknown>): string {
  return createHash("sha256")
    .update(`${toolId}:${JSON.stringify(args)}`)
    .digest("hex")
    .slice(0, 32);
}

function userHash(userId: string | null): string {
  const salt = process.env.OUTCOME_SALT || "sumaiya-eval-dev-salt";
  return createHash("sha256").update(`${salt}:${userId ?? "anon"}`).digest("hex");
}

const CAPABILITY_BLOCK_REASON: Record<string, BlockReason> = {
  guest_only: "guest_only",
  requires_plan: "requires_plan",
  quota: "quota",
  disabled: "disabled",
};

function isGenerative(cost: ToolCost): boolean {
  return cost === "cheap-ai" || cost === "full-ai";
}

async function recordInvocation(row: {
  userId: string | null;
  tool: string;
  caller: ToolCaller;
  policy: ToolPolicy;
  outcome: ToolOutcome;
  costClass: ToolCost;
  latencyMs: number;
  inputHash: string;
  errorCode?: string | null;
}): Promise<void> {
  try {
    await db.insert(toolInvocation).values({
      id: nanoid(),
      userId: row.userId,
      tool: row.tool,
      caller: row.caller,
      policy: row.policy,
      outcome: row.outcome,
      costClass: row.costClass,
      latencyMs: Math.round(row.latencyMs),
      inputHash: row.inputHash,
      errorCode: row.errorCode ?? null,
    });
  } catch (err) {
    // The audit trail must never break the action it audits.
    console.error("[run-tool] invocation record failed:", err);
  }
}

async function sampleForEval(
  tool: string,
  userId: string | null,
  input: Record<string, unknown>,
  output: unknown,
  rate: number,
  meta?: { promptId?: string; promptVersion?: string; model?: string },
): Promise<void> {
  if (Math.random() >= rate) return;
  try {
    await db.insert(evalSample).values({
      id: nanoid(),
      userHash: userHash(userId),
      tool,
      promptVersion: meta?.promptVersion ?? "",
      model: meta?.model ?? "",
      input: input as Record<string, unknown>,
      output: (output ?? {}) as Record<string, unknown>,
    });
  } catch (err) {
    console.error("[run-tool] eval sample failed:", err);
  }
}

// ─── The pipeline ────────────────────────────────────────────────────────────

const DEFAULT_EVAL_SAMPLE_RATE = Number(process.env.EVAL_SAMPLE_RATE ?? 0.05);

export async function runTool(input: RunToolInput): Promise<ToolResult> {
  const { toolId, subject, caller } = input;
  const args = input.args ?? {};
  const started = Date.now();

  const tool = findTool(toolId);
  const meta = toolMeta(toolId);
  const emit = (outcome: ToolOutcome, errorCode?: string) => {
    const latencyMs = Date.now() - started;
    void recordInvocation({
      userId: subject.userId,
      tool: toolId,
      caller,
      policy: meta.policy,
      outcome,
      costClass: meta.cost,
      latencyMs,
      inputHash: hashInput(toolId, args),
      errorCode,
    });
    captureServer(subject.userId ?? "anonymous", "tool_invoked", {
      tool: toolId,
      caller,
      policy: meta.policy,
      outcome,
      latencyMs: Math.round(latencyMs),
    });
  };

  // 1. Known tool?
  if (!tool && !EXECUTORS[toolId]) {
    emit("blocked_policy", "unknown_tool");
    return { status: "blocked", tool: toolId, reason: "unknown_tool" };
  }

  // 2. Validate args against the strict per-tool schema (if one exists).
  const validated = validateToolArgs(toolId, args);
  const safeArgs: Record<string, unknown> = validated.ok ? validated.args : args;
  if (!validated.ok && tool) {
    emit("blocked_policy", "invalid_args");
    return { status: "blocked", tool: toolId, reason: "invalid_args", detail: validated.error };
  }

  // 3. Preconditions.
  if (tool?.needsCv && !input.context?.cv) {
    emit("blocked_policy", "needs_cv");
    return { status: "blocked", tool: toolId, reason: "needs_cv" };
  }
  if (tool?.needsFile && !input.context?.hasFile) {
    emit("blocked_policy", "needs_file");
    return { status: "blocked", tool: toolId, reason: "needs_file" };
  }

  // 4. Entitlement — evaluated as the subject, per the capability.
  const capability = meta.capability as Capability;
  const entitlement = can(subject, capability);
  if (!entitlement.allowed) {
    const reason = CAPABILITY_BLOCK_REASON[entitlement.reason ?? "disabled"] ?? "disabled";
    emit(`blocked_entitlement`, reason);
    return { status: "blocked", tool: toolId, reason, detail: entitlement.detail };
  }

  // 4b. Row ownership — a tool that names an applicationId / existing docId
  // must not act on another user's record ("RLS as tool authz").
  const ownership = await checkRowOwnership(subject.userId, safeArgs, input.context?.extra);
  if (ownership) {
    emit("blocked_entitlement", ownership);
    return { status: "blocked", tool: toolId, reason: ownership };
  }

  // 5. Content-boundary sanitize on untrusted pasted strings.
  for (const key of Object.keys(safeArgs)) {
    if (UNTRUSTED_STRING_ARGS.has(key) && typeof safeArgs[key] === "string") {
      safeArgs[key] = sanitizePromptText(safeArgs[key] as string);
    }
  }

  // Advert guard — jobs.match / cv.tailor only fire on a real pasted JD.
  if (
    (toolId === "jobs.match" || toolId === "cv.tailor" || toolId === "career.skillGap") &&
    typeof safeArgs.jobDescription === "string" &&
    !looksLikeJobDescription(safeArgs.jobDescription)
  ) {
    emit("blocked_policy", "bad_advert");
    return { status: "blocked", tool: toolId, reason: "bad_advert" };
  }

  // 6. AI quota — for cost-bearing tools: the per-day call limiter AND the
  // per-month spend ceiling (the model-router budget cap; off unless
  // AI_USER_MONTHLY_USD is set).
  let quotaCharged = false;
  if (isGenerative(meta.cost) && subject.userId) {
    const budget = await checkMonthlyBudget(subject.userId);
    if (!budget.ok) {
      emit("blocked_quota", "quota");
      return {
        status: "blocked",
        tool: toolId,
        reason: "quota",
        detail: `Monthly AI budget reached ($${budget.spentUsd.toFixed(2)} of $${budget.ceilingUsd.toFixed(2)}).`,
      };
    }
    const quota = await checkAiQuota(subject.userId);
    if (!quota.allowed) {
      emit("blocked_quota", "quota");
      return {
        status: "blocked",
        tool: toolId,
        reason: "quota",
        detail: quota.message,
        retryAfter: quota.retryAfter,
      };
    }
    quotaCharged = true;
  }

  // 7. Policy gate.
  if (meta.policy === "blocked") {
    emit("blocked_policy", "disabled");
    return { status: "blocked", tool: toolId, reason: "disabled" };
  }
  if (meta.policy === "confirm" && !input.confirmed) {
    emit("awaiting_confirm");
    return {
      status: "confirm_required",
      tool: toolId,
      summary: tool?.title ?? toolId,
    };
  }

  // 8. Execute.
  const executor = EXECUTORS[toolId];
  if (!executor) {
    emit("failed", "no_executor");
    if (quotaCharged && subject.userId) void refundAiUsage(subject.userId);
    return { status: "error", tool: toolId, code: "no_executor" };
  }

  let exec: ExecResult;
  try {
    exec = await executor(safeArgs, {
      subject,
      run: input.context ?? {},
    });
  } catch (err) {
    const code =
      err instanceof ToolExecError || err instanceof GenExecError ? err.code : "exec_failed";
    if (quotaCharged && subject.userId) void refundAiUsage(subject.userId);
    emit("failed", code);
    return { status: "error", tool: toolId, code };
  }

  // 9. Provenance write-through — every AI-touched span gets a source on
  // record (blueprint H8). Needs a doc to attach to: the caller passes
  // context.extra.docId / docType. Without one the spans still flow back to
  // the caller for the preview, just aren't persisted yet.
  const invocationId = nanoid();
  const docId = input.context?.extra?.docId;
  const docType = input.context?.extra?.docType;
  if (exec.provenance?.length && subject.userId && typeof docId === "string" && typeof docType === "string") {
    await writeProvenance(
      { userId: subject.userId, docType, docId },
      exec.provenance.map((s) => ({
        fieldPath: s.fieldPath,
        spanStart: s.spanStart,
        spanEnd: s.spanEnd,
        sourceKind: s.sourceKind,
        sourceRef: s.sourceRef,
      })),
      invocationId,
    );
  }

  // 10. Telemetry + eval sample.
  emit(meta.policy === "preview" ? "previewed" : "executed");
  if (isGenerative(meta.cost)) {
    void sampleForEval(
      toolId,
      subject.userId,
      safeArgs,
      exec.data,
      input.evalSampleRate ?? DEFAULT_EVAL_SAMPLE_RATE,
      exec.meta,
    );
  }

  return {
    status: meta.policy === "preview" ? "preview" : "ok",
    tool: toolId,
    data: exec.data,
    provenance: exec.provenance,
  };
}

/** Tool ids that have a real executor wired into the pipeline today. */
export function executableTools(): string[] {
  return Object.keys(EXECUTORS);
}
