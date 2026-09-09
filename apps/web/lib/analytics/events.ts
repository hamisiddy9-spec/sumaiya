/**
 * The typed analytics event catalog — the single registry of every event the
 * product emits, its exact name, and the shape of its properties.
 *
 * Why this exists: events are the instrument panel for the guest → activated →
 * retained funnel. When the same moment gets logged as `cv_export`,
 * `exportCv` and `export-complete` from three surfaces, the funnel is
 * meaningless. Every call site imports a name from `EVENTS` and (in new code)
 * the typed `capture()` helper, so an event cannot be logged two different
 * ways or with the wrong properties.
 *
 * Adding an event = add a line to `AnalyticsEventMap`. Nothing is emitted that
 * isn't declared here.
 */

export type DocumentType = "cv" | "cover-letter" | "letter" | "business-card";

/** Where an export was triggered from — mirrors lib/analytics ExportSource. */
export type ExportSource =
  | "preview"
  | "topbar"
  | "shortcut"
  | "retry"
  | "post-signup";

/** Cost class of an AI call — mirrors the tool registry `cost` field. */
export type AiCostClass = "none" | "cheap-ai" | "full-ai";

/** How a tool call resolved once it entered the guardrail pipeline. */
export type ToolOutcome =
  | "executed"
  | "previewed"
  | "awaiting_confirm"
  | "blocked_entitlement"
  | "blocked_quota"
  | "blocked_policy"
  | "failed";

/** Who invoked a tool. */
export type ToolCaller = "ui" | "assistant" | "cron" | "whatsapp" | "api";

/**
 * Every event, mapped to its property shape. `void` = a bare event with no
 * properties. Keep property values primitive (string | number | boolean |
 * null) — the sinks only accept primitives and `capture()` sanitizes.
 */
export interface AnalyticsEventMap {
  // ─── Acquisition & the activation funnel ──────────────────────────────────
  sample_cv_loaded: void;
  wizard_started: void;
  wizard_step_completed: { step: number; stepName: string };
  first_name_entered: void;
  document_created: { documentType: DocumentType };
  cv_editor_opened: { guest: boolean; templateId: string };
  template_changed: { templateId: string };

  // ─── The "aha" — activation is defined as the first of these per user ─────
  ats_checked: { mode: "paste" | "upload"; score: number; status: string };
  export_started: { source: ExportSource };
  export_completed: { source: ExportSource; templateId: string };
  export_failed: { source: ExportSource; error: string };
  document_exported: { documentType: DocumentType; templateId: string };
  guest_download_wall: { source: ExportSource };

  // ─── Engagement ──────────────────────────────────────────────────────────
  job_target_sample_jd_used: void;
  assistant_message_sent: { surface: "web" | "native" | "whatsapp"; hasDoc: boolean };
  daily_brief_opened: { matchCount: number };
  application_logged: { fromJobMatch: boolean };
  application_status_changed: { status: string };

  // ─── Auth ────────────────────────────────────────────────────────────────
  sign_in_started: { method: "magic_link" | "google" | "otp" };
  sign_in_completed: { method: "magic_link" | "google" | "otp"; isNew: boolean };
  guest_data_migrated: { documents: number };

  // ─── AI & tools (emitted server-side — never trusted from the client) ─────
  ai_call: {
    tool: string;
    model: string;
    costClass: AiCostClass;
    latencyMs: number;
    ok: boolean;
    fallback: boolean;
    promptVersion: string | null;
  };
  tool_invoked: {
    tool: string;
    caller: ToolCaller;
    policy: string;
    outcome: ToolOutcome;
    latencyMs: number;
  };

  // ─── Trust surface ───────────────────────────────────────────────────────
  provenance_chip_opened: { sourceKind: string };
  enhance_diff_reverted: { section: string };
  import_confidence_pass_completed: { confirmed: number; total: number };

  // ─── Outcomes & growth loops ─────────────────────────────────────────────
  outcome_recorded: { stage: "interview" | "offer" | "hired" | "no" };
  referral_sent: { channel: "whatsapp" | "link" | "copy" };
  referral_converted: Record<string, never>;
  pwa_installed: void;
  web_push_subscribed: void;
}

export type AnalyticsEventName = keyof AnalyticsEventMap;

/**
 * Name constants for call sites — `track(EVENTS.export_completed, …)` instead
 * of a bare string, so a typo is a compile error, not a silent orphan event.
 */
export const EVENTS = Object.freeze(
  (
    [
      "sample_cv_loaded",
      "wizard_started",
      "wizard_step_completed",
      "first_name_entered",
      "document_created",
      "cv_editor_opened",
      "template_changed",
      "ats_checked",
      "export_started",
      "export_completed",
      "export_failed",
      "document_exported",
      "guest_download_wall",
      "job_target_sample_jd_used",
      "assistant_message_sent",
      "daily_brief_opened",
      "application_logged",
      "application_status_changed",
      "sign_in_started",
      "sign_in_completed",
      "guest_data_migrated",
      "ai_call",
      "tool_invoked",
      "provenance_chip_opened",
      "enhance_diff_reverted",
      "import_confidence_pass_completed",
      "outcome_recorded",
      "referral_sent",
      "referral_converted",
      "pwa_installed",
      "web_push_subscribed",
    ] as const satisfies readonly AnalyticsEventName[]
  ).reduce(
    (acc, name) => {
      acc[name] = name;
      return acc;
    },
    {} as Record<AnalyticsEventName, AnalyticsEventName>,
  ),
);

/** Runtime guard — is this a declared event name? Used to warn in dev. */
const KNOWN = new Set<string>(Object.keys(EVENTS));
export function isKnownEvent(name: string): name is AnalyticsEventName {
  return KNOWN.has(name);
}

/**
 * Events that count as activation. The funnel north-star is:
 * guest → (any of these) → returns within 7 days.
 */
export const ACTIVATION_EVENTS: readonly AnalyticsEventName[] = Object.freeze([
  "export_completed",
  "document_exported",
  "ats_checked",
]);
