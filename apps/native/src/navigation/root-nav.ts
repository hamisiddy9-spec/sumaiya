/**
 * The navigation container's ref, held outside the React tree.
 *
 * Guest mode needs two things no screen can do for itself:
 *
 *   - `openAuth()` — anything in the app (a gated screen, the invitation that
 *     follows a download, the account row in Profile) can present the sign-in
 *     screen as a modal over the app. Without this the root stack's Auth screen
 *     would only exist when unauthenticated, which is exactly the arrangement
 *     that made "sign in first" unavoidable.
 *   - `canDismissAuth()` / `dismissAuth()` — and get back out again. A sign-in
 *     screen a guest cannot leave is a wall, not an invitation.
 *
 * It lives in its own module rather than in root-navigator.tsx because screens
 * import it: importing the navigator from a screen would be a cycle
 * (navigator → tabs → screens → navigator).
 */
import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

export const navRef = createNavigationContainerRef<RootStackParamList>();

/** Present sign-in over whatever the user is doing. False when the container
 *  is not ready yet (called too early) — the caller stays where it is. */
export function openAuth(): boolean {
  if (!navRef.isReady()) return false;
  try {
    navRef.navigate("Auth");
    return true;
  } catch {
    return false;
  }
}

/** True when there is something behind the sign-in screen to go back to —
 *  i.e. this is an invitation from inside the app, not the app's only screen. */
export function canDismissAuth(): boolean {
  return navRef.isReady() && navRef.canGoBack();
}

/** Close sign-in and return to the app, leaving the guest's work untouched. */
export function dismissAuth(): boolean {
  if (!canDismissAuth()) return false;
  try {
    navRef.goBack();
    return true;
  } catch {
    return false;
  }
}
