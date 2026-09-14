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
  version: "1.6.14",
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
    // 1.6.12 and 1.6.13 were built but never announced, so this is the first
    // bump since 1.6.11 that users will actually see. It is a normal update —
    // same signing key throughout, no "remove the old app first" dance.
    //
    // What it says is the one thing true of every version before it: sign-in
    // could not work. 1.6.11 and 1.6.12 shipped without the Supabase anon key
    // in the bundle, so the email code was refused with "Invalid API key" and
    // nobody could get in. Users who gave up should be told the cause was ours
    // and that a retry is worth it now.
    //
    // Deliberately does not promise that the code will arrive: the mailer is
    // configured on the Supabase side, so this build can accept the request
    // while delivery is still being fixed. No "you're all set".
    en: "Sign-in works again. Earlier versions sent your code without the app's key, so it was always refused — update, then ask for a new code.",
    sw: "Kuingia kunafanya kazi tena. Matoleo ya awali yalituma msimbo wako bila ufunguo wa app, hivyo ulikataliwa kila mara — sasisha, kisha omba msimbo mpya.",
  },
};
