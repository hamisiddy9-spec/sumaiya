/**
 * What the dashboard may truthfully claim about an account's access.
 *
 * THE DEFECT THIS FILE EXISTS TO PREVENT
 * The sidebar card told EVERY account "Umefunguliwa Kila Kitu / Kila kitu kipo
 * tayari kutumika" ("everything is unlocked") while `GET /api/entitlements`
 * answered `premium: false` with `capabilities["template.premium"] === false` —
 * the Premium designs were locked, so the sentence was false. A user who is told
 * everything is unlocked reads a later paywall as bait-and-switch.
 *
 * WHY ONE BOOLEAN IS THE WHOLE TRUTH
 * Payments are off (`PAYMENTS_ENABLED = false`), so nobody can buy a tier; the
 * rules in lib/entitlements.ts mark every capability except `template.premium`
 * as `tier: "free"`, and the three `requiresAccount` ones (application.track,
 * career.interview, outcome.record) are satisfied the moment somebody is signed
 * in — which they are, on this dashboard. So for a signed-in account the only
 * thing that can be missing is the Premium tier, and `premium` (an active
 * `profile.premiumUntil` window, earned by referrals — lib/referral.ts) is the
 * flag the copy keys off.
 *
 * Both surfaces that make the claim (the sidebar card and the dashboard banner)
 * render from this one function, so they can never disagree with each other or
 * with the API again. `accessCopy(false, …)` deliberately does NOT contain the
 * unlocked sentence — that is asserted in lib/access-copy.test.ts.
 */

export interface AccessCopy {
  title: string;
  body: string;
  /** Present only when there is an honest next step to offer. */
  cta?: { label: string; href: string };
}

/**
 * The account's access, in the account's language.
 *
 * @param premium true when an earned/paid Premium window is live (`premiumViewOf().premium`).
 * @param sw      Swahili copy (the product's primary language) when true.
 */
export function accessCopy(premium: boolean, sw: boolean): AccessCopy {
  if (premium) {
    return sw
      ? {
          title: "Umefunguliwa Kila Kitu",
          body: "Kila kitu kipo tayari kutumika.",
        }
      : {
          title: "Full access",
          body: "All features unlocked.",
        };
  }

  return sw
    ? {
        title: "Bure: karibu kila kitu",
        body:
          "CV, barua za maombi, kadi za biashara, barua rasmi, kukagua CV na kupakua — vyote bure. " +
          "Miundo ya Premium pekee ndiyo imefungwa; unaifungua kwa kumwalika rafiki (siku 7 kwa kila rafiki anayejiunga).",
        cta: { label: "Ona miundo ya Premium", href: "/templates" },
      }
    : {
        title: "Free: nearly everything",
        body:
          "CVs, cover letters, business cards, formal letters, CV checks and downloads — all free. " +
          "Only the Premium designs are locked; unlock them by inviting a friend (7 days per friend who joins).",
        cta: { label: "See the Premium designs", href: "/templates" },
      };
}
