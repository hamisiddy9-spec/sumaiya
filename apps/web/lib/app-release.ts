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
  version: "1.6.4",
  // Site link 308-redirects to the public releases repo asset — the manifest
  // never hard-codes GitHub, so hosting can move without breaking updates.
  // ⚠️ Bump this ONLY after the matching APK is uploaded to a GitHub release on
  // hamisiddy9-spec/sumaiya-releases with the asset named `sumaiya.apk`
  // (that's where /downloads/sumaiya.apk redirects to `latest`).
  url: "https://sumaiya.pro/downloads/sumaiya.apk",
  notes: {
    en: "Fixed: CVs and edits made offline now sync reliably instead of silently getting lost. Foldable and large-screen devices no longer get locked to portrait. Push notifications and the update screen now show in your language. A blank CV preview now tells you why instead of just looking broken.",
    sw: "Marekebisho: CV na mabadiliko yaliyofanywa nje ya mtandao sasa yanasawazishwa kwa uhakika badala ya kupotea kimya kimya. Vifaa vinavyokunjika na vyenye skrini kubwa havifungiwi tena kwenye mwelekeo wima. Arifa na skrini ya sasisho sasa zinaonyesha kwa lugha yako. Muhtasari mtupu wa CV sasa unaeleza sababu badala ya kuonekana kama hitilafu.",
  },
};
