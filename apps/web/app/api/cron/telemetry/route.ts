import { NextRequest, NextResponse } from "next/server";
import { buildTelemetryDigest, renderDigest } from "@/lib/app-telemetry/aggregate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The morning read on how the testers are doing: who opened the app, on which
// build, whether the updater finished, what broke. Protected by CRON_SECRET —
// this is the same data the admin view shows, and app telemetry is internal.
//
// ?hours=168 widens the window (a weekly read); ?lang=en switches the rendered
// summary. The JSON digest is always returned alongside the text so a caller
// can chart it without re-deriving anything.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hoursParam = Number(req.nextUrl.searchParams.get("hours"));
  const hours = Number.isFinite(hoursParam) && hoursParam > 0 ? Math.min(24 * 30, Math.round(hoursParam)) : 24;
  const lang = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "sw";

  try {
    const digest = await buildTelemetryDigest({ hours });
    return NextResponse.json({ digest, text: renderDigest(digest, lang) });
  } catch (err) {
    // A broken analysis must not look like "no users" — say so loudly.
    console.error("[cron/telemetry] digest failed:", err);
    return NextResponse.json(
      { error: "digest failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
