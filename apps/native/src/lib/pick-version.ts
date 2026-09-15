/**
 * Pick the first candidate that is actually a version string.
 *
 * Deliberately dependency-free (no expo-* imports) so it is unit-testable at
 * repo root — the same reason `auth-errors.ts` is split out. The bug this
 * exists to prevent is an ORDERING bug, and ordering is precisely what a test
 * can pin.
 */
export function pickVersion(candidates: ReadonlyArray<string | null | undefined>): string {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  // Deliberately NOT a plausible version: a wrong value here should look wrong
  // in the UI and in telemetry, instead of quietly reading like a real release.
  return "0.0.0";
}
