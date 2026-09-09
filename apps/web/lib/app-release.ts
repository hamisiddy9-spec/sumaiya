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
  version: "1.4.0",
  // Site link 308-redirects to the public releases repo asset — the manifest
  // never hard-codes GitHub, so hosting can move without breaking updates.
  // ⚠️ Bump this ONLY after the matching APK is uploaded to a GitHub release on
  // hamisiddy9-spec/sumaiya-releases with the asset named `sumaiya.apk`
  // (that's where /downloads/sumaiya.apk redirects to `latest`).
  url: "https://sumaiya.pro/downloads/sumaiya.apk",
  notes: {
    en: "New: paste a job description and Sumaiya retunes your CV and writes a matching cover letter. She's a first-class tab now, remembers the whole conversation, knows what you told the web app, and reads her replies aloud. Fixed: the keyboard hiding the chat box, dashboard shortcuts, and the chat's quick-start buttons.",
    sw: "Mpya: bandika maelezo ya kazi na Sumaiya atarekebisha CV yako na kuandika barua ya maombi inayolingana. Sasa ana kichupo chake, anakumbuka mazungumzo yote, anajua uliyoiambia tovuti, na anasoma majibu kwa sauti. Marekebisho: kibodi iliyokuwa ikificha sanduku la mazungumzo, njia za mkato za dashibodi, na vitufe vya kuanza haraka.",
  },
};
