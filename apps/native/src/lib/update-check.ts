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
 * Whether the update prompt should appear for this launch:
 * - the advertised version is genuinely newer than the installed build, AND
 * - the user has not already dismissed THIS exact version ("Baadaye").
 * A dismissed older version never suppresses a NEWER release.
 */
export function shouldShowPrompt(current: string, latest: string, skippedVersion: string | null): boolean {
  if (!isUpdateAvailable(current, latest)) return false;
  if (skippedVersion && skippedVersion === latest) return false;
  return true;
}
