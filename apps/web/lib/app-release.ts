/**
 * Single source of truth for the LIVE native Android release, served to the
 * app via GET /api/app/update. Bump this AFTER a mobile-vX.Y.Z APK build is
 * verified live on the public releases repo (hamisiddy9-spec/sumaiya-
 * releases): installed users are then prompted to update on next launch.
 * Keep notes short, SW + EN — they render inside the update modal.
 */
export interface AppReleaseManifest {
  version: string;
  url: string;
  notes: { en: string; sw: string };
  /**
   * Optional FLOOR: the oldest installed build still supported. The app prompts
   * when the installed build is NUMERICALLY BELOW this.
   *
   * This is a prompt rule, not release data, which is why it lives in code
   * rather than in the `app_release` table. Leave it unset for a normal release
   * — absent means exactly the old behaviour. Fails safe: an unparseable value
   * is no floor, never a lock.
   */
  minimumVersion?: string;
  /**
   * Set when the shipped version line has RESTARTED.
   *
   * Why it exists: the app prompts only when the manifest advertises a version
   * that is STRICTLY NEWER than the installed build. That is right for normal
   * releases and wrong for a reset — installed 1.6.11, line restarts at 1.1,
   * `1 < 6`, the manifest is never "newer", and the new build reaches nobody.
   *
   * `minimumVersion` cannot express this either: a floor of "1.1" does not catch
   * an installed "1.6.11", because 1.6.11 is numerically ABOVE 1.1 (measured,
   * not assumed — see `isBelowFloor` and its tests). The reset therefore needs
   * its own flag rather than a cleverer comparison.
   *
   * Self-terminating: once installed equals the advertised version the prompt
   * stops. Set it for the reset, then unset it on the release after.
   */
  lineReset?: boolean;
}

export const APP_RELEASE: AppReleaseManifest = {
  version: "1.8.2",
  // Site link 308-redirects to the public releases repo asset — the manifest
  // never hard-codes GitHub, so hosting can move without breaking updates.
  // ⚠️ Bump this ONLY after the matching APK is uploaded to a GitHub release on
  // hamisiddy9-spec/sumaiya-releases with the asset named `sumaiya.apk`
  // (that's where /downloads/sumaiya.apk redirects to `latest`).
  //
  // Host is sumaiya.app because it is the domain actually attached to
  // this Vercel project. It used to be sumaiya.pro — which is attached to a
  // different project and has no DNS records at all, so every download and
  // every in-app update link 404'd at the DNS layer.
  url: "https://sumaiya.app/downloads/sumaiya.apk",
  notes: {
    // What is true of THIS build that was not true of the one it replaces. These
    // notes render inside the update modal, so they say what changed for the
    // person reading them, not what changed in the repo.
    //
    // 1.6.29 is 1.6.28 plus one fix, so the notes carry both: everything below is what
    // a user on any older build gains, and the last line is this version's own change.
    //
    // 1.6.28's line: the document stops being the weak part. Exports were US Letter
    // while every design is authored A4 (so a one-page CV printed as two), pages were
    // software-rasterised, small print printed at 5.7pt, and the gallery showed an
    // identical grey sketch for 224 different designs. Maombi also works without an
    // account now, and is finally measured.
    //
    // 1.6.29's line: on a fresh install with an update pending, the download pill used
    // to float up over the onboarding language choices — the first screen a new user
    // sees — and, being pressable, swallowed the tap meant for the last language. It
    // reserved room for a tab bar that is not on that screen.
    //
    // Deliberately does not promise Premium arrives instantly: it is earned when
    // a friend signs up and builds their first CV, which takes as long as the
    // friend takes. No "you're all set".
    en: "Your CV now comes out A4 — the size employers here expect — and pages render sharp, with the small print readable. The gallery shows each design's real look, and you can save a job and track it from saved to offer without signing in. The update bar no longer covers the choices on the first screen.",
    sw: "CV yako sasa inatoka kama A4 — ukubwa ambao waajiri wanatarajia — na kurasa zinaonekana vizuri, maandishi madogo yanasomeka. Orodha ya miundo inaonyesha kila muundo jinsi unavyoonekana kweli, na unaweza kuhifadhi kazi na kufuatilia kutoka imehifadhiwa hadi ofa bila kuingia. Upau wa kusasisha haufuniki tena chaguo za skrini ya kwanza.",
  },
};
