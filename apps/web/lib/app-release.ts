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
}

export const APP_RELEASE: AppReleaseManifest = {
  version: "1.6.12",
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
    // Same signing key as 1.6.11, so this is a normal update — do NOT repeat the
    // "remove the old app first" warning that 1.6.11 needed for its key change.
    // The Google caveat is stated plainly: the fix is a Google Cloud entry, not a
    // build, so 1.6.11 is affected identically and the email path is the way in.
    en: "The app now talks to sumaiya.app, and the sign-in button shows when it is working instead of looking frozen. If Continue with Google reports a configuration error, use the email code instead — tap “Use email instead” and we will send you a six-digit code.",
    sw: "App sasa inawasiliana na sumaiya.app, na kitufe cha kuingia kinaonyesha kinapofanya kazi badala ya kuonekana kimeganda. Kama “Endelea na Google” inatoa kosa la mipangilio, tumia msimbo wa barua pepe badala yake — gusa “Tumia barua pepe badala yake” na tutakutumia msimbo wa tarakimu sita.",
  },
};
