/**
 * Pure app-update decision logic (no RN imports — unit-testable at repo root).
 *
 * The mobile app compares the version it was BUILT with (app.json, rewritten
 * by CI from the mobile-vX.Y.Z tag) against the LATEST version advertised by
 * GET /api/app/update (web's config/app-release.json). Only when the server
 * advertises something strictly NEWER does the UI prompt, and the user's
 * "Baadaye / Later" choice is remembered per version so we never nag twice
 * about the same release.
 */

export interface UpdateManifest {
  version?: string | null;
  url?: string | null;
  notes?: { en?: string | null; sw?: string | null } | null;
  /**
   * Optional FLOOR: the oldest build still supported. Prompts when the
   * installed build is NUMERICALLY BELOW this — see `isBelowFloor`.
   *
   * ⚠️ This does NOT cover a version RESET. A floor of "1.1" does not catch an
   * installed "1.6.11", because 1.6.11 is numerically ABOVE 1.1. For a reset use
   * `lineReset`. Absent/blank means no floor, i.e. exactly the old behaviour.
   */
  minimumVersion?: string | null;
  /**
   * Set when the shipped version line has RESTARTED (e.g. the product restarts
   * numbering at 1.1 while installs are on 1.6.11). Prompts whenever the
   * installed build is not the advertised one, regardless of which is
   * numerically higher — the one case "strictly newer" can never express.
   *
   * Self-terminating: once the user is on the advertised build the comparison
   * is equal and the prompt stops. Absent means no reset, i.e. old behaviour.
   */
  lineReset?: boolean | null;
}

/** "v1.2.3" | "1.2" | "1" → [1,2,3]; junk → null. Never trusts user input. */
export function parseVersion(v: string | null | undefined): number[] | null {
  if (!v) return null;
  const m = /^\s*v?(\d+(?:\.\d+){0,2})\s*$/i.exec(v);
  if (!m) return null;
  return m[1].split(".").map((n) => {
    const x = Number(n);
    return Number.isFinite(x) ? x : 0;
  });
}

/**
 * Compare two version strings as numeric tuples ("1.10.2" > "1.9.9").
 * Missing parts count as 0 ("1.2" == "1.2.0"). Returns -1 | 0 | 1, and 0 for
 * anything unparseable (fail SAFE — never prompt on garbage).
 */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return 0;
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

/** True only when `latest` parses AND is strictly newer than `current`. */
export function isUpdateAvailable(current: string, latest: string): boolean {
  return compareVersions(latest, current) > 0;
}
/**
 * True when the installed build is older than the manifest's floor.
 *
 * Fails SAFE: a blank or unparseable floor is "no floor", so a typo in the
 * manifest can never wall every user behind a prompt they cannot satisfy.
 */
export function isBelowFloor(current: string, minimumVersion?: string | null): boolean {
  if (!minimumVersion) return false;
  const floor = parseVersion(minimumVersion);
  const installed = parseVersion(current);
  if (!floor || !installed) return false;
  return compareVersions(current, minimumVersion) < 0;
}

/**
 * Whether the update prompt should appear for this launch:
 * - the advertised version is genuinely newer than the installed build, AND
 * - the user has not already dismissed THIS exact version ("Baadaye"), AND
 * - we have not already downloaded and handed that version to the installer.
 * A dismissed older version never suppresses a NEWER release.
 *
 * EXCEPTION — a floor (`minimumVersion`) or a declared line reset (`lineReset`)
 * beats the rules above, because "strictly newer" cannot express either:
 *   - `minimumVersion` catches a build that is numerically BELOW the oldest
 *     supported one.
 *   - `lineReset` catches a build that is off the restarted line entirely. This
 *     is the version-reset case: installed 1.6.11, the product restarts at 1.1.
 *     A floor of "1.1" does NOT catch it (1.6.11 > 1.1 numerically — measured),
 *     so the reset needs its own flag rather than a cleverer comparison.
 * Below either, the prompt shows even if that version was previously dismissed;
 * the one rule that still holds is not re-nagging a build already handed to the
 * installer, which is what makes the reset self-terminating.
 *
 * KNOWN LIMITATION while `lineReset` is set: "ahead of the advertised version"
 * is the only signal available for "from the old numbering", so a build that is
 * genuinely ahead of a stale manifest is ALSO prompted, and installing it would
 * be a downgrade. That is unavoidable without carrying the old line's range, and
 * it is harmless in practice as long as the manifest advertises the newest
 * build — which it must anyway. Unset `lineReset` once the fleet has moved.
 *
 * Neither is a lock: the modal stays dismissible. A genuinely blocking update
 * is a different decision and is not this.
 */
export function shouldShowPrompt(
  current: string,
  latest: string,
  skippedVersion: string | null,
  /**
   * The newest version we have already downloaded and passed to the system
   * installer. Being asked to update again the moment you HAVE updated is the
   * single thing that makes an updater feel broken — and it genuinely happens
   * while the manifest still advertises the build the user just installed.
   */
  deliveredVersion?: string | null,
  minimumVersion?: string | null,
  lineReset?: boolean | null,
): boolean {
  const alreadyDelivered =
    !!deliveredVersion && compareVersions(deliveredVersion, latest) >= 0;

  // Below a hard floor, or the version line restarted and this build is not on
  // it. Either way "strictly newer" cannot express it: an installed 1.6.11 must
  // be told to move to a restarted 1.1, even though 1.6.11 is the higher
  // number. `compareVersions` returns 0 for unparseable input, so a junk
  // `latest` can never trigger the reset branch.
  const belowFloor = isBelowFloor(current, minimumVersion);
  // A reset catches builds that are AHEAD of the advertised version — that is
  // exactly the old numbering (1.6.11 against a restarted 1.1). Equal versions
  // are on the line, so it self-terminates. See the known limitation below.
  const offLine = !!lineReset && compareVersions(current, latest) > 0;

  if (belowFloor || offLine) {
    // A floor/reset overrides the dismissal rule — a user who once tapped
    // "Baadaye" on a build that is now off the line must still be told — but
    // never the delivery rule: do not re-nag a build already handed over.
    return !alreadyDelivered;
  }

  if (!isUpdateAvailable(current, latest)) return false;
  if (skippedVersion && skippedVersion === latest) return false;
  if (alreadyDelivered) return false;
  return true;
}
