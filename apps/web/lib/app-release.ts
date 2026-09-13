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
  version: "1.6.11",
  // Site link 308-redirects to the public releases repo asset — the manifest
  // never hard-codes GitHub, so hosting can move without breaking updates.
  // ⚠️ Bump this ONLY after the matching APK is uploaded to a GitHub release on
  // hamisiddy9-spec/sumaiya-releases with the asset named `sumaiya.apk`
  // (that's where /downloads/sumaiya.apk redirects to `latest`).
  //
  // Host is www.templatehub.pro because it is the domain actually attached to
  // this Vercel project. It used to be sumaiya.pro — which is attached to a
  // different project and has no DNS records at all, so every download and
  // every in-app update link 404'd at the DNS layer.
  url: "https://www.templatehub.pro/downloads/sumaiya.apk",
  notes: {
    en: "This version is signed with a real release key, so updates can actually reach you from now on. Because the signature changed, it installs once from scratch: remove the old app first, then install this and sign in again. Also fixed — the app no longer tells you that you are offline when your connection is fine, and sign-in links now open inside the app instead of the browser.",
    sw: "Toleo hili limesainiwa kwa ufunguo halisi wa matoleo, hivyo masasisho yanaweza kukufikia kuanzia sasa. Kwa sababu sahihi imebadilika, linasakinishwa mara moja kuanzia mwanzo: ondoa app ya zamani kwanza, kisha sakinisha hili na uingie tena. Pia imerekebishwa — app haisemi tena kuwa huna mtandao wakati mtandao wako ni mzuri, na viungo vya kuingia sasa vinafunguka ndani ya app badala ya browser.",
  },
};
