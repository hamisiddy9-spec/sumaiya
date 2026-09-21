/**
 * What a failed guest-CV migration should tell the user, and whether to offer
 * a retry at all.
 *
 * The page had one failure branch that promised a retry the UI never offered —
 * `migrating = false` was reset "to allow a retry" that nothing could trigger.
 * Naively adding a "Try again" button would trade that for the opposite bug the
 * page's own comments warn about: stranding someone on a retry that can never
 * succeed while their session is unusable.
 *
 * So the two decisions are separate here, and both are pure and testable
 * without a DOM.
 */

/**
 * Longest a repeated retry stays honest. Past this the copy stops asking.
 */
export const MAX_MIGRATION_ATTEMPTS = 3;

/**
 * A session the server will keep rejecting: the token is expired, revoked, or
 * not valid yet. Retrying sends the same unusable credential, so it fails
 * identically every time. The caller should re-authenticate and come back
 * rather than offer a button that cannot work.
 *
 * @param status the POST's HTTP status, or null when fetch itself rejected
 *               (offline, DNS, dropped connection) — there is no response to
 *               read, so this is never treated as an unusable session.
 */
export function isUnusableSession(status: number | null): boolean {
  return status === 401 || status === 403;
}

export interface MigrationFailure {
  /** Whether a "try again" affordance should be shown for this state. */
  retryable: boolean;
  message: string;
}

/**
 * @param attempts how many attempts have now failed, including the one being
 *                 reported
 */
export function migrationFailure(
  sw: boolean,
  attempts: number,
  maxAttempts: number = MAX_MIGRATION_ATTEMPTS,
): MigrationFailure {
  if (attempts < maxAttempts) {
    return {
      retryable: true,
      message: sw
        ? "Sikuweza kuhifadhi CV yako. Tafadhali jaribu tena."
        : "Failed to save your CV. Please try again.",
    };
  }

  // Said "try again" enough times that repeating it would be a lie. The draft
  // is genuinely still in localStorage — it is only removed after a 2xx — so
  // say that, instead of pointing them at the same wall again.
  return {
    retryable: false,
    message: sw
      ? "Sikuweza kuhifadhi CV yako. Jaribu tena baadaye — rasimu yako ipo salama kwenye kivinjari hiki."
      : "Failed to save your CV. Try again later — your draft is safe in this browser.",
  };
}
