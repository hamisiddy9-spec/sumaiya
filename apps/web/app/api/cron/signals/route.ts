import { NextRequest, NextResponse } from "next/server";
import { dispatchSignalsForAllUsers } from "@/lib/notify/dispatch-signals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Daily cron (see vercel.json), scheduled after cron/jobs (recommendations
// refresh) and before cron/follow-ups. Turns the five non-follow-up signal
// types (confirmations, cv.tailor, coverLetter.generate, ats.check,
// career.skillGap, job.newMatch) into push notifications — see
// lib/notify/dispatch-signals.ts for the cooldown/claim logic and why
// application.followUp is excluded (it has its own dedicated cron).
// Protected by CRON_SECRET, same as the other cron routes.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await dispatchSignalsForAllUsers();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron/signals]", e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
