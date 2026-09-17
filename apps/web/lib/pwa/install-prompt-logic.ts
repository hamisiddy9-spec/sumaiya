/**
 * Pure install-banner decision logic — no React, no DOM. Kept in a .ts module
 * so it is unit-testable in the node vitest environment (the component file
 * itself is .tsx and is not parsed by the test runner).
 */

/** localStorage key holding the install-banner dismissal timestamp. */
export const INSTALL_DISMISS_KEY = "th-install-dismissed";

/** How long a dismissal suppresses the banner before it may re-appear. */
export const INSTALL_DISMISS_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export type DevicePlatform = "android" | "ios" | "desktop";

/**
 * Which device is looking at us.
 *
 * This decides WHICH app we are offering, and getting it wrong is not cosmetic:
 * on Android there is a real native app, so offering a PWA install installs a
 * worse version of our own product and competes with it. On iOS there is no
 * native build, so the home-screen route is the only "app" there is. On desktop
 * there is nothing to install at all.
 *
 * Order matters: iPadOS reports as a Mac, so it is checked before the desktop
 * fallback. Kept pure and UA-only so it can be tested without a browser.
 */
export function classifyDevice(userAgent: string): DevicePlatform {
  const ua = (userAgent ?? "").toLowerCase();
  if (/android/.test(ua)) return "android";
  if (/iphone|ipod/.test(ua)) return "ios";
  // iPadOS 13+ masquerades as desktop Safari; the touch-point check is what the
  // platform itself documents as the way to tell them apart.
  if (/ipad/.test(ua) || (/macintosh/.test(ua) && /mobile/.test(ua))) return "ios";
  return "desktop";
}

/**
 * The PWA install banner is only the right offer where there is no better one.
 * Android has a real app (offer that instead), iOS never fires
 * `beforeinstallprompt` at all (its own hint component handles it), so the
 * banner is left to desktop — the one surface with nothing else to install.
 */
export function shouldOfferPwaInstall(platform: DevicePlatform): boolean {
  return platform === "desktop";
}

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
  // /snap is the Snap-to-Apply entry point and its whole card ends in the one
  // button that matters ("Snap ombi langu"). Confirmed by walking it in a real
  // browser: the banner rendered on top of that CTA, so the tap a first-time
  // visitor is most likely to make hit the banner instead. Same click-steal the
  // /assistant entry was added for.
  /^\/snap([/?]|$)/,
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
 * @param platform   which device is looking, from classifyDevice()
 */
export function shouldShowInstallBanner(
  pathname: string,
  dismissedAt: string | null,
  now: number,
  standalone: boolean,
  platform: DevicePlatform = "desktop",
): boolean {
  if (isInstallBlockedPath(pathname)) return false;
  if (standalone) return false; // already installed — nothing to offer
  // The device gate. Without it the banner fired on any browser that supports
  // PWA install — including desktop, and including Android where we are
  // advertising a worse version of our own product over the real app.
  if (!shouldOfferPwaInstall(platform)) return false;
  if (dismissedAt === null) return true; // never dismissed
  const t = Number(dismissedAt);
  if (!Number.isFinite(t)) return true; // corrupt value — treat as never dismissed
  return now - t >= INSTALL_DISMISS_MS;
}
