import { NextResponse } from "next/server";
import { APP_RELEASE } from "@/lib/app-release";

// Public app-update manifest for the NATIVE app (and anyone else who asks).
// The mobile app checks this endpoint on launch: if `version` is newer than
// the installed build it prompts the user to update (see
// mobile/src/components/UpdatePrompt.tsx). No auth, no user data — a plain
// tiny JSON. `url` points at the site's /downloads link which 308-redirects to
// the public releases repo asset, so the manifest never hard-codes GitHub.
// Release cadence: bump lib/app-release.ts after each verified APK publish.
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(APP_RELEASE, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
