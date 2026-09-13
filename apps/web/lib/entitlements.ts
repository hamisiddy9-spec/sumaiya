/**
 * Entitlements — the one place that answers "can this user do this?".
 *
 * Handshake H7 from the system blueprint: the SAME `can()` is asked by the web
 * UI (to show/hide), the native UI, the API (to enforce), and the assistant
 * (to decide which tools to offer). The client answer is advisory UX; the
 * server answer is authoritative.
 *
 * Everything is free today (`PAYMENTS_ENABLED = false`) so no *paid* tier can be
 * bought yet — but "free" is not the same as "ungated". Referrals already grant
 * real Premium time (profile.premiumUntil, 7 days per activated friend — see
 * lib/referral.ts), so `template.premium` is `tier: "plan"` and `can()` answers
 * it from either a paid `plan` or an active earned window. Before this wiring
 * existed, `isPremiumActive` had zero call sites and a referrer who earned
 * Premium was told they had it while unlocking nothing.
 *
 * Pure + synchronous by default. `can()` takes an already-resolved
 * `EntitlementSubject` so it works identically on the server (from the Hono
 * auth user + profile row, see lib/entitlements-server.ts) and the client with
 * no I/O.
 */

/** Every gated capability. Namespaced <domain>.<action>. Keep in sync with the
 *  tool registry `capability` fields in lib/assistant/tools.ts. */
export type Capability =
  | "cv.create"
  | "cv.enhance"
  | "cv.tailor"
  | "cv.import"
  | "coverLetter.generate"
  | "letter.business" // quotation / invoice / letterhead / proposal
  | "ats.check"
  | "ats.deepCheck"
  | "jobs.match"
  | "jobs.search"
  | "application.track"
  | "assistant.chat"
  | "assistant.voice"
  | "doc.export"
  | "doc.exportBulk"
  | "pdf.tools"
  | "career.interview"
  | "outcome.record"
  /** The premium designs (types/index.ts PREMIUM_TEMPLATE_IDS) and the deep
   *  course set. Earned via referral days today; bought when billing returns. */
  | "template.premium";

export interface EntitlementSubject {
  /** null = a guest (not signed in). */
  userId: string | null;
  /** A paid tier. Nothing sells one today (`PAYMENTS_ENABLED = false`). */
  plan?: "free" | "pro" | "b2b";
  /** `profile.premiumUntil` — an active earned (referral) or future paid
   *  window. ISO string or Date; resolved server-side by
   *  lib/entitlements-server.ts so callers never hit the DB for this. */
  premiumUntil?: Date | string | null;
  /** Explicit grants (referral rewards, B2B seats). Empty today. */
  grants?: Capability[];
}

export interface EntitlementResult {
  allowed: boolean;
  /** Why not — a stable code the UI maps to localized copy. */
  reason?: "guest_only" | "requires_plan" | "quota" | "disabled";
  /** Human hint for logs / dev. Never shown raw to a user. */
  detail?: string;
}

const ALLOW: EntitlementResult = { allowed: true };

/**
 * Per-capability rule. `free` capabilities are allowed for everyone (guests
 * included, unless `requiresAccount`). `plan` capabilities need either a paid
 * `plan` or an active earned Premium window (`premiumUntil`).
 */
interface Rule {
  tier: "free" | "plan";
  /** Guests (no userId) are blocked with reason `guest_only`. */
  requiresAccount?: boolean;
}

const CAPABILITY_RULES: Record<Capability, Rule> = {
  "cv.create": { tier: "free" },
  "cv.enhance": { tier: "free" },
  "cv.tailor": { tier: "free" },
  "cv.import": { tier: "free" },
  "coverLetter.generate": { tier: "free" },
  "letter.business": { tier: "free" },
  "ats.check": { tier: "free" },
  "ats.deepCheck": { tier: "free" },
  "jobs.match": { tier: "free" },
  "jobs.search": { tier: "free" },
  "application.track": { tier: "free", requiresAccount: true },
  "assistant.chat": { tier: "free" },
  "assistant.voice": { tier: "free" },
  "doc.export": { tier: "free" },
  "doc.exportBulk": { tier: "free" },
  "pdf.tools": { tier: "free" },
  "career.interview": { tier: "free", requiresAccount: true },
  "outcome.record": { tier: "free", requiresAccount: true },
  // The ONLY plan-gated capability. Deliberately not `requiresAccount`: a guest
  // asking for a premium design should hear "premium", not "sign in" — the
  // upsell is the honest answer, and earn-Premium needs an account anyway.
  "template.premium": { tier: "plan" },
};

/**
 * The core check. Synchronous, no I/O — pass an already-resolved subject.
 */
export function can(
  subject: EntitlementSubject,
  capability: Capability,
): EntitlementResult {
  const rule = CAPABILITY_RULES[capability];
  if (!rule) return { allowed: false, reason: "disabled", detail: `unknown capability ${capability}` };

  if (subject.grants?.includes(capability)) return ALLOW;

  if (rule.requiresAccount && !subject.userId) {
    return { allowed: false, reason: "guest_only" };
  }

  if (rule.tier === "plan") {
    const plan = subject.plan ?? "free";
    // A paid plan OR a live earned window. `isPremiumActive` is the same
    // predicate the native app uses, so both doors agree on who has Premium.
    if (plan === "free" && !isPremiumActive(subject.premiumUntil)) {
      return { allowed: false, reason: "requires_plan" };
    }
  }

  return ALLOW;
}

/** Convenience boolean. */
export function allowed(
  subject: EntitlementSubject,
  capability: Capability,
): boolean {
  return can(subject, capability).allowed;
}

/** Is a referral-earned (or future paid) Premium window still active?
 *  `premiumUntil` is the `profile.premiumUntil` column — see lib/referral.ts.
 *  Consulted by `can()` for `tier: "plan"` capabilities; the native app uses
 *  the equivalent check in src/lib/entitlements.ts, so both doors agree. */
export function isPremiumActive(premiumUntil: Date | string | null | undefined): boolean {
  if (!premiumUntil) return false;
  const until = premiumUntil instanceof Date ? premiumUntil : new Date(premiumUntil);
  return until.getTime() > Date.now();
}

/** The full map for a subject — handy for hydrating a client hook once. */
export function entitlementsFor(
  subject: EntitlementSubject,
): Record<Capability, boolean> {
  const out = {} as Record<Capability, boolean>;
  for (const cap of Object.keys(CAPABILITY_RULES) as Capability[]) {
    out[cap] = can(subject, cap).allowed;
  }
  return out;
}
