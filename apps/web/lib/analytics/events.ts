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
 * isn't declared here. Adding a property to EVERY event (attribution is the one
 * example) = extend `AttributionProps` below, instead of touching every event.
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
 * A campaign source captured from `?src=` on the landing URL — `poster` for the
 * printed posters, `flyer-boda`, `shop-kariakoo-3`, … Open-ended on purpose:
 * every new printed surface gets a new tag without a code change. Always the
 * sanitized slug produced by lib/analytics/attribution.ts, never raw input.
 */
export type CampaignSource = string;

/**
 * Attribution attached by lib/analytics to EVERY emitted event, so a scan of a
 * printed poster stays visible all the way down the funnel
 * (ats_checked → sign_in_completed → pwa_installed) instead of dissolving into
 * "some traffic". `src` is null — never absent — when the visitor arrived
 * without a tag, so a cohort or funnel filter can rely on the property existing.
 *
 * A `type` and not an `interface` on purpose: type aliases get an implicit index
 * signature, so `{ ...getAttributionProps() }` (or the bare object) can be
 * passed anywhere the sinks take a props bag — `identify(id, traits)` included.
 */
export type AttributionProps = { src: CampaignSource | null };

/**
 * The payload a sink actually receives: the event's own declared properties
 * plus attribution. `void` events (no properties of their own) are emitted with
 * attribution only — which is why `capture()` below still takes no argument for
 * them: attribution is injected by the tracker, not by the call site.
 */
export type EmittedEventProps<K extends AnalyticsEventName> =
  AnalyticsEventMap[K] extends void
    ? AttributionProps
    : AnalyticsEventMap[K] & AttributionProps;

/**
 * Every event, mapped to its property shape. `void` = a bare event with no
 * properties. Keep property values primitive (string | number | boolean |
 * null) — the sinks only accept primitives and `capture()` sanitizes.
 */
export interface AnalyticsEventMap {
  // ─── Acquisition & the activation funnel ──────────────────────────────────
  /**
   * A visit that arrived from a tagged printed surface (`?src=poster`). This is
   * the top of the campaign funnel: the scan itself. Emitted once per page load
   * from lib/analytics/provider.tsx, only when attribution was captured, and
   * mirrored to the server by lib/analytics/campaign.ts so the admin campaign
   * view has a denominator that does not live in a third-party dashboard.
   */
  campaign_landing: { path: string };
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

  // ─── Monetization funnel (PayMe Africa mobile money) ──────────────────────
  // The paid-conversion instrument. checkout_started fires when a user picks a
  // plan and submits their phone; payment_initiated once PayMe has accepted the
  // collection request (the push is on its way to the phone); payment_completed
  // server-side from the verified webhook; payment_failed at whichever stage
  // broke. amount is in minor units of `currency` (TZS has none, so whole
  // shillings). These are the numbers the Priority-3 "prove paid conversion"
  // goal reads back — never invented; each fires at a real code point.
  checkout_started: { plan: string; amount: number; currency: string };
  payment_initiated: { plan: string; amount: number; currency: string };
  payment_completed: { plan: string | null; amount: number; currency: string; days: number };
  payment_failed: { plan: string | null; stage: "initiate" | "callback"; status: string };

  // ─── Outcomes & growth loops ─────────────────────────────────────────────
  outcome_recorded: { stage: "interview" | "offer" | "hired" | "no" };
  referral_sent: { channel: "whatsapp" | "link" | "copy" };
  referral_converted: Record<string, never>;
  referral_premium_granted: { days: number; premiumUntil: string };
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
      "campaign_landing",
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
      "checkout_started",
      "payment_initiated",
      "payment_completed",
      "payment_failed",
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
      "referral_premium_granted",
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

/**
 * The campaign funnel — the steps a printed-poster scan can reach, in order.
 *
 * This is the list lib/analytics/campaign.ts mirrors to the server (POST
 * /api/campaign/event) and the list the admin campaign view reads back per
 * `src`. It is a SUBSET of the catalog on purpose: the whole catalog mirrored
 * per event would be a second analytics pipeline to maintain, while these four
 * are exactly what turns "someone scanned the poster" into "someone signed up
 * and built a CV".
 *
 * campaign_landing  — the scan landed            (server-recorded)
 * ats_checked       — the ATS checker was used   (client-reported)
 * sign_in_completed — an account signed in       (client-reported, isNew flag)
 * document_created  — a document was created     (client-reported)
 *
 * The step names are declared here, and nothing may be reported that is not in
 * this list — the ingest route rejects anything else.
 */
export const CAMPAIGN_FUNNEL_STEPS = Object.freeze([
  "campaign_landing",
  "ats_checked",
  "sign_in_completed",
  "document_created",
] as const satisfies readonly AnalyticsEventName[]);

export type CampaignFunnelStep = (typeof CAMPAIGN_FUNNEL_STEPS)[number];

const CAMPAIGN_STEP_SET = new Set<string>(CAMPAIGN_FUNNEL_STEPS);

/** Is this event a campaign funnel step (i.e. one the server should record)? */
export function isCampaignFunnelStep(
  name: string,
): name is CampaignFunnelStep {
  return CAMPAIGN_STEP_SET.has(name);
}
