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
  version: "1.6.5",
  // Site link 308-redirects to the public releases repo asset — the manifest
  // never hard-codes GitHub, so hosting can move without breaking updates.
  // ⚠️ Bump this ONLY after the matching APK is uploaded to a GitHub release on
  // hamisiddy9-spec/sumaiya-releases with the asset named `sumaiya.apk`
  // (that's where /downloads/sumaiya.apk redirects to `latest`).
  url: "https://sumaiya.pro/downloads/sumaiya.apk",
  notes: {
    en: "Sending Sumaiya a file works now. PDFs and Word documents picked from your phone were never actually reaching her — the upload failed before it left the device — which is why every file came back as unreadable. Files now travel a route that works, a second attempt happens automatically if the first is interrupted, a genuine failure states the real reason (a scanned PDF now says so and asks for a photo), and there's a Try again button instead of a dead end. Also fixed: the + menu rows were squashed into a stack, and text on buttons is easier to read.",
    sw: "Kutuma faili kwa Sumaiya sasa kunafanya kazi. PDF na Word unazochagua kwenye simu yako zilikuwa hazimfikii kabisa — kupakia kulishindwa kabla kuondoka kwenye kifaa — ndiyo maana kila faili lilirudi kama lisilosomeka. Sasa faili zinasafiri kwa njia inayofanya kazi, kunajaribu tena kiotomatiki ikiwa kumekatizwa, kushindwa kwa kweli kunaeleza sababu halisi (PDF ya picha sasa inasema hivyo na inakuomba tuma picha), na unapata kitufe cha 'Jaribu tena' badala ya kufungwa. Pia tumerekebisha: safu za menyu ya '+' zilikuwa zimebanwa, na maandishi kwenye vitufe yanaonekana wazi zaidi.",
  },
};
