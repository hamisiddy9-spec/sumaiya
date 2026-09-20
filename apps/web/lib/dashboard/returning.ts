/**
 * NEW vs RETURNING — one decision, in one place.
 *
 * The dashboard greeted every account with "Karibu tena!" / "Welcome back"
 * (welcome BACK) including a brand-new account that had never created,
 * applied for or downloaded anything — the first words the product ever said
 * to a first-time user told them they had been here before.
 *
 * The inputs are the same ones the dashboard already fetches, so this costs
 * no extra query: an account that has never produced a document, never built
 * a career profile, never logged an application and never downloaded anything
 * has, in fact, never been here.
 *
 * Pure and dependency-free so the rule is testable on its own.
 */

export interface ReturningSignals {
  /** Documents the account owns (CVs + cover letters + cards + letters). */
  docCount: number;
  /** A career profile exists (built by the wizard or the interview). */
  hasCareerProfile: boolean;
  /** Applications logged in the tracker. */
  applicationCount: number;
  /** Downloads recorded against the account. */
  downloadCount: number;
}

/**
 * True when the account has done something that could only happen on a visit
 * that has already occurred. Anything else is a first run.
 */
export function isReturningUser(s: ReturningSignals): boolean {
  return (
    s.docCount > 0 ||
    s.hasCareerProfile ||
    s.applicationCount > 0 ||
    s.downloadCount > 0
  );
}

/**
 * Which greeting key to render. `dashboard.welcome` is "Karibu tena" /
 * "Welcome back"; `dashboard.welcomeFirst` is "Karibu" / "Welcome".
 */
export function dashboardGreetingKey(returning: boolean): "dashboard.welcome" | "dashboard.welcomeFirst" {
  return returning ? "dashboard.welcome" : "dashboard.welcomeFirst";
}
