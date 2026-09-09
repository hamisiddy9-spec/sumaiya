/**
 * Entitlements — the one place that answers "can this user do this?".
 *
 * Handshake H7 from the system blueprint: the SAME `can()` is asked by the web
 * UI (to show/hide), the native UI, the API (to enforce), and the assistant
 * (to decide which tools to offer). The client answer is advisory UX; the
 * server answer is authoritative.
 *
 * Everything is free today (`PAYMENTS_ENABLED = false`), so every capability
 * resolves to `{ allowed: true }`. The seam is real, though — when a paid tier
 * returns, it's a change to `CAPABILITY_RULES` and a `grants` lookup, not a
 * refactor of every call site.
 *
 * Pure + synchronous by default. `can()` takes an already-resolved
 * `EntitlementSubject` so it works identically on the server (from the Hono
 * auth user) and the client (from the Supabase session) with no I/O.
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
  | "outcome.record";

export interface EntitlementSubject {
  /** null = a guest (not signed in). */
  userId: string | null;
  /** Reserved for a future paid tier. Empty today. */
  plan?: "free" | "pro" | "b2b";
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
 * included, unless `requiresAccount`). Nothing is `plan`-gated yet.
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
    if (plan === "free") return { allowed: false, reason: "requires_plan" };
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
