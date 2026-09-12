import { NextRequest, NextResponse } from "next/server";
import { liveRelease } from "@/lib/app-update";

// Public app-update manifest for the NATIVE app (and anyone else who asks).
//
// The app checks this on launch, prompts when the version is newer than the
// installed build (native/src/components/update-prompt.tsx), downloads the APK
// in-app and hands it to the system installer. Resolution lives in
// lib/app-update.ts — GitHub releases are the source of truth.
export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(req: NextRequest) {
  // "stable" unless a build explicitly opts into a testing channel.
  const requested = req.nextUrl.searchParams.get("channel");
  const channel = requested === "test" ? "test" : "stable";
  const body = await liveRelease(channel);
  return NextResponse.json(body, {
    headers: {
      // Short cache: publishing a release must reach users within minutes.
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
