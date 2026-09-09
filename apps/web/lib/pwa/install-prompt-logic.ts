/**
 * Pure install-banner decision logic — no React, no DOM. Kept in a .ts module
 * so it is unit-testable in the node vitest environment (the component file
 * itself is .tsx and is not parsed by the test runner).
 */

/** localStorage key holding the install-banner dismissal timestamp. */
export const INSTALL_DISMISS_KEY = "th-install-dismissed";

/** How long a dismissal suppresses the banner before it may re-appear. */
export const INSTALL_DISMISS_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

/**
 * Routes whose bottom area is occupied by a fixed action bar (chat input,
 * editor toolbar, upload CTA…). The install banner must NEVER sit over those —
 * a first tap would hit the banner instead of the button (audit-confirmed
 * click-steal on /assistant). The mobile tab bar covers /dashboard,
 * /templates, /tools, /settings instead, so the banner is raised above it on
 * small screens rather than hidden there.
 */
const INSTALL_BLOCKED_PATHS = [
  /^\/(assistant|import-cv|studio)([/?]|$)/,
  /^\/editor([/?]|$)/,
];

export function isInstallBlockedPath(pathname: string): boolean {
  return INSTALL_BLOCKED_PATHS.some((re) => re.test(pathname));
}

/**
 * Pure decision: should the install banner render right now?
 *
 * @param dismissedAt stored dismissal timestamp (ms since epoch), or null if never dismissed
 * @param now        current epoch ms
 * @param standalone true when the app is already running installed (PWA window)
 */
export function shouldShowInstallBanner(
  pathname: string,
  dismissedAt: string | null,
  now: number,
  standalone: boolean,
): boolean {
  if (isInstallBlockedPath(pathname)) return false;
  if (standalone) return false; // already installed — nothing to offer
  if (dismissedAt === null) return true; // never dismissed
  const t = Number(dismissedAt);
  if (!Number.isFinite(t)) return true; // corrupt value — treat as never dismissed
  return now - t >= INSTALL_DISMISS_MS;
}
