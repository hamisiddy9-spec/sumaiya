// @sumaiya/analytics — cross-platform analytics primitives.
//
// apps/web keeps the full typed event catalog (it has server + client sinks,
// PostHog, identify). What lives HERE is the small shared vocabulary both apps
// must agree on so a moment logged from the phone and the same moment logged
// from the web land on one event name with one prop shape.

/** Cost class of an AI call — mirrors the tool registry `cost` field. */
export type AiCostClass = "none" | "cheap-ai" | "full-ai";

/** Who invoked a capability through the guardrail pipeline. */
export type ToolCaller = "ui" | "assistant" | "cron" | "whatsapp" | "api";

/** How a tool call resolved once it entered the pipeline. */
export type ToolOutcome =
  | "executed"
  | "previewed"
  | "awaiting_confirm"
  | "blocked_entitlement"
  | "blocked_quota"
  | "blocked_policy"
  | "failed";

/** Event names shared by both platforms. Platform-only events stay local. */
export const SHARED_EVENTS = [
  "assistant_message_sent",
  "document_created",
  "document_exported",
  "ats_checked",
  "application_logged",
  "application_status_changed",
  "tool_invoked",
  "referral_shared",
  "referral_activated",
  "voice_intake_started",
  "voice_intake_completed",
] as const;
export type SharedEvent = (typeof SHARED_EVENTS)[number];

type Primitive = string | number | boolean | null;

/**
 * Coerce an arbitrary props bag to primitives only — the sinks (PostHog,
 * Vercel) reject nested objects and silently drop events with bad shapes.
 * Undefined keys are removed; everything else is stringified if not already
 * primitive.
 */
export function sanitizeProps(
  props: Record<string, unknown> | undefined,
): Record<string, Primitive> {
  const out: Record<string, Primitive> = {};
  if (!props) return out;
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined) continue;
    if (v === null || typeof v === "string" || typeof v === "boolean") {
      out[k] = v;
    } else if (typeof v === "number") {
      out[k] = Number.isFinite(v) ? v : null;
    } else {
      out[k] = String(v);
    }
  }
  return out;
}
