/**
 * Resolving the live native release.
 *
 * The published row wins. A release becomes live when someone puts it in the
 * `app_release` table — that's it. Deliberately NOT "whatever is newest on
 * GitHub" any more: that rule meant every build ever uploaded could interrupt
 * every user mid-task, and it did (a throwaway test release nagged the whole
 * field the moment it went up). Uploading a file is now a no-op for users.
 *
 * GitHub is still where the APK file lives; it is a file host, not a trigger.
 * `latestFromGitHub` remains for tooling (and for backfilling a publish), but
 * nothing user-facing consults it. When the DB is unreachable the checked-in
 * `APP_RELEASE` answers, so the endpoint never goes dark.
 *
 * Kept out of the route file on purpose: a Next.js route may only export the
 * HTTP handlers, and these are worth unit-testing.
 */
import { eq } from "drizzle-orm";
import { APP_RELEASE } from "@/lib/app-release";
import { db, appRelease } from "@/lib/db";

const RELEASES_API =
  "https://api.github.com/repos/hamisiddy9-spec/sumaiya-releases/releases?per_page=20";
const ASSET_NAME = "sumaiya.apk";

export interface LiveRelease {
  version: string;
  url: string;
  size?: number;
  notes: { en: string; sw: string };
}

interface GhAsset {
  name: string;
  browser_download_url: string;
  size: number;
}
interface GhRelease {
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  body: string | null;
  assets: GhAsset[];
}

/** "mobile-v1.6.7" -> "1.6.7". Anything else is not ours to serve. */
export function versionFromTag(tag: string): string | null {
  const m = /^mobile-v(\d+\.\d+\.\d+)$/.exec((tag ?? "").trim());
  return m ? m[1] : null;
}

/** Numeric, segment by segment — "1.6.10" is newer than "1.6.9". */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
}

/**
 * Release notes travel with the release: a body with "SW:" and "EN:" blocks
 * wins. Per language, so a half-translated release still reads properly.
 */
export function notesFromBody(
  body: string | null | undefined,
  fallback: { en: string; sw: string },
): { en: string; sw: string } {
  if (!body) return fallback;
  const sw = /(?:^|\n)\s*sw:\s*([\s\S]*?)(?:\n\s*en:|$)/i.exec(body)?.[1]?.trim();
  const en = /(?:^|\n)\s*en:\s*([\s\S]*?)(?:\n\s*sw:|$)/i.exec(body)?.[1]?.trim();
  if (!sw && !en) return fallback;
  return { en: en || sw || fallback.en, sw: sw || en || fallback.sw };
}

export async function latestFromGitHub(): Promise<LiveRelease | null> {
  const res = await fetch(RELEASES_API, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "sumaiya-app-update" },
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  const releases = (await res.json()) as GhRelease[];
  if (!Array.isArray(releases)) return null;

  const candidates = releases
    .filter((r) => !r.draft && !r.prerelease)
    .map((r) => {
      const version = versionFromTag(r.tag_name);
      // `gh release create file#label` names the asset after the FILE, not the
      // label — a release went out as app-release.apk and got skipped, which
      // silently pinned everyone to the previous build. So: prefer the
      // canonical name, accept any .apk, and let the version tag decide.
      const asset =
        r.assets?.find((a) => a.name === ASSET_NAME) ??
        r.assets?.find((a) => a.name?.toLowerCase().endsWith(".apk"));
      return version && asset ? { version, asset, body: r.body } : null;
    })
    .filter((x): x is { version: string; asset: GhAsset; body: string | null } => x !== null);

  if (!candidates.length) return null;
  candidates.sort((a, b) => compareVersions(b.version, a.version));
  const best = candidates[0];
  return {
    version: best.version,
    url: best.asset.browser_download_url,
    size: best.asset.size,
    notes: notesFromBody(best.body, APP_RELEASE.notes),
  };
}

/**
 * The newest release published on a channel, or null when nothing is published.
 *
 * Picks by VERSION, not by publish order: correcting an older release after a
 * newer one is published must never roll users backwards.
 */
export async function publishedRelease(channel = "stable"): Promise<LiveRelease | null> {
  const rows = await db
    .select({
      version: appRelease.version,
      url: appRelease.apkUrl,
      size: appRelease.sizeBytes,
      notesSw: appRelease.notesSw,
      notesEn: appRelease.notesEn,
    })
    .from(appRelease)
    .where(eq(appRelease.channel, channel))
    .limit(50);

  if (!rows.length) return null;
  const best = rows.reduce((a, b) => (compareVersions(b.version, a.version) > 0 ? b : a));
  return {
    version: best.version,
    url: best.url,
    size: best.size ?? undefined,
    notes: {
      sw: best.notesSw || APP_RELEASE.notes.sw,
      en: best.notesEn || APP_RELEASE.notes.en,
    },
  };
}

/**
 * The manifest the app fetches on launch. Never throws: a database problem must
 * not be able to break updates for everyone.
 */
export async function liveRelease(channel = "stable"): Promise<LiveRelease> {
  const published = await publishedRelease(channel).catch(() => null);
  if (published) return published;
  return { version: APP_RELEASE.version, url: APP_RELEASE.url, notes: APP_RELEASE.notes };
}
