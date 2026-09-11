/**
 * Resolves a push notification's `data` payload into the params for
 * `navRef.navigate("App", ...)`.
 *
 * Two payload shapes exist, both produced by the server's signal engine
 * (apps/web/lib/notify/dispatch-signals.ts's deepLink()):
 *   - `{ screen: "Applications" | "Guide" | ... }` — a screen nested INSIDE
 *     the Home tab's own stack (the original, follow-up-cron-only shape).
 *   - `{ screen: "ProfileTab" | "SumaiyaTab" | ... }` — a sibling TOP-LEVEL
 *     tab, sent once the signal dispatcher started covering all 6 signal
 *     types instead of just follow-ups.
 * Nesting everything under HomeTab unconditionally silently failed to
 * navigate for the second shape — "ProfileTab" isn't a screen inside
 * HomeStackParamList, so React Navigation had nowhere to put it.
 */
const TOP_LEVEL_TABS = new Set(["HomeTab", "CVsTab", "SumaiyaTab", "ProfileTab"]);

export function resolveNotificationTarget(
  screen: string,
  params?: Record<string, unknown>,
): { screen: string; params?: unknown } {
  if (TOP_LEVEL_TABS.has(screen)) {
    return { screen, params };
  }
  return { screen: "HomeTab", params: { screen, params } };
}
