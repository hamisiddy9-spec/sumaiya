import { NextRequest, NextResponse } from "next/server";
import { ingestJobs } from "@/lib/jobs/ingest";
import { runLifecycle } from "@/lib/jobs/lifecycle";
import { refreshAllRecommendations } from "@/lib/jobs/recommend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Daily cron (see vercel.json). Runs the full jobs pipeline:
//   1. lifecycle pass — expire stale listings (deadline passed / unverified),
//      mark closing-soon ones as expiring
//   2. ingest — pull fresh listings from the job sources, upsert changed
//      content, refresh verification stamps
//   3. recommendations — refresh per-user job matches for everyone with a CV
// Protected by CRON_SECRET (Vercel sends it as a Bearer header when the env
// var is set); the endpoint refuses to run without it.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const lifecycle = await runLifecycle();
    const ingest = await ingestJobs();
    const recommendations = await refreshAllRecommendations();
    return NextResponse.json({ ok: true, lifecycle, ingest, recommendations });
  } catch (e) {
    console.error("[cron/jobs]", e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
