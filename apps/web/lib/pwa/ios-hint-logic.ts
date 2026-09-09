/**
 * iOS "Add to Home Screen" hint decision logic — pure, no DOM.
 *
 * iOS Safari never fires `beforeinstallprompt`, so the install banner never
 * appears on iPhone. This hint explains the Share → Add to Home Screen flow
 * once. It must NEVER show when the app is already installed (standalone) or
 * inside an in-app browser (FB/IG webviews have no install path and would
 * just confuse the user).
 */

/** localStorage key for the hint's dismissal (one-time — stays dismissed). */
export const IOS_HINT_DISMISS_KEY = "th-ios-hint-dismissed";

/**
 * iOS Safari detection, incl. iPadOS 13+ (Macintosh UA + touch capability).
 * Excludes Chrome/Firefox/Opera/Edge on iOS (CriOS/FxiOS/OPiOS/EdgiOS) —
 * those engines fire beforeinstallprompt and use the normal install banner,
 * not this hint.
 */
export function isIOSSafari(ua: string, maxTouchPoints?: number): boolean {
  // Exclusions FIRST: every iOS UA contains "iPhone"/"iPad" regardless of
  // engine, so the plain device check must not run before these.
  if (/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua)) return false;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  if (
    /Macintosh/.test(ua) &&
    typeof maxTouchPoints === "number" &&
    maxTouchPoints > 1 &&
    /Safari/.test(ua)
  ) {
    return true;
  }
  return false;
}

/** In-app browsers (Facebook, Instagram, WhatsApp, LINE, WeChat…) — no install path. */
export function isInAppBrowser(ua: string): boolean {
  return /FBAN|FBAV|Instagram|FB_IAB|FB4A|Line\/|MicroMessenger|Twitter for iPhone|wv;|WebView|Fban\/|Fbios/.test(ua);
}

/**
 * Pure decision: should the one-time iOS install hint render?
 *  - only on iOS Safari (never in-app browsers, never Chrome-on-iOS)
 *  - never when already installed (standalone PWA window)
 *  - never after the user dismissed it (one-time hint — persisted forever)
 */
export function shouldShowIosHint(
  ua: string,
  maxTouchPoints: number,
  standalone: boolean,
  dismissedAt: string | null,
): boolean {
  if (isInAppBrowser(ua)) return false; // FB/IG webviews — no install path
  if (!isIOSSafari(ua, maxTouchPoints)) return false;
  if (standalone) return false; // already installed — nothing to explain
  if (dismissedAt !== null) return false; // one-time hint
  return true;
}
