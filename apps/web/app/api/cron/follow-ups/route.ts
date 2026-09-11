import { NextRequest, NextResponse } from "next/server";
import { db, application, profile, userProfile } from "@/lib/db";
import { and, eq, or, isNull, lte, sql, inArray } from "drizzle-orm";
import { sendFollowUpReminder } from "@/lib/email";
import { sendExpoPush } from "@/lib/push/expo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WEEK_MS = 7 * 86_400_000;

// Daily cron (see vercel.json). Emails a follow-up nudge for any application the
// user marked "applied" 7+ days ago and that we haven't reminded about in the
// last week — the retention loop that turns the tracker from a passive log into
// a reason to come back. Protected by CRON_SECRET (Vercel sends it as a Bearer
// header when the env var is set); the endpoint refuses to run without it.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - WEEK_MS);

  const due = await db
    .select({
      id: application.id,
      userId: application.userId,
      title: application.title,
      company: application.companyName,
      appliedAt: application.appliedAt,
      createdAt: application.createdAt,
    })
    .from(application)
    .where(
      and(
        eq(application.status, "applied"),
        lte(sql`coalesce(${application.appliedAt}, ${application.createdAt})`, cutoff),
        or(isNull(application.followUpRemindedAt), lte(application.followUpRemindedAt, cutoff)),
      ),
    );

  if (!due.length) return NextResponse.json({ reminded: 0, users: 0 });

  // Group by user so each person gets ONE email listing all their stale jobs.
  const byUser = new Map<string, typeof due>();
  for (const a of due) {
    const arr = byUser.get(a.userId) ?? [];
    arr.push(a);
    byUser.set(a.userId, arr);
  }

  let remindedApps = 0;
  let usersEmailed = 0;

  for (const [userId, apps] of byUser) {
    const ids = apps.map((a) => a.id);

    // MARK-BEFORE-SEND (claim): atomically stamp followUpRemindedAt BEFORE any
    // email goes out, restricted to rows still in the "due" state. A concurrent
    // or retried cron run sees 0 claimed rows for these ids and skips them, so
    // two overlapping runs can never double-email a user. If sending then
    // fails, the claim is rolled back so the next run retries — trading a
    // possible duplicate for a guaranteed reminder.
    const claimed = await db
      .update(application)
      .set({ followUpRemindedAt: new Date() })
      .where(
        and(
          inArray(application.id, ids),
          eq(application.status, "applied"),
          or(isNull(application.followUpRemindedAt), lte(application.followUpRemindedAt, cutoff)),
        ),
      )
      .returning({ id: application.id });
    if (!claimed.length) continue; // another run already claimed these

    const [p] = await db.select({ email: profile.email, name: profile.name }).from(profile).where(eq(profile.id, userId)).limit(1);
    if (!p?.email) {
      // No address to send to — roll back the claim so the app stays eligible
      // (harmless daily skip, same as before) instead of being permanently
      // marked reminded.
      await db.update(application).set({ followUpRemindedAt: null }).where(inArray(application.id, ids));
      continue;
    }
    // Respect the user's notification preference (defaults to on).
    const [up] = await db.select({ on: userProfile.emailNotifications, lang: userProfile.lang }).from(userProfile).where(eq(userProfile.id, userId)).limit(1);
    if (up && up.on === false) {
      await db.update(application).set({ followUpRemindedAt: null }).where(inArray(application.id, ids));
      continue;
    }

    const list = apps.map((a) => ({
      title: a.title,
      company: a.company ?? "",
      days: Math.floor((Date.now() - new Date(a.appliedAt ?? a.createdAt).getTime()) / 86_400_000),
    }));

    try {
      await sendFollowUpReminder({ name: p.name ?? "", email: p.email, apps: list });
      usersEmailed++;
      remindedApps += claimed.length;
      // Native nudge alongside the email — best-effort, never blocks the run.
      // The email itself (sendFollowUpReminder above) is still English-only —
      // a larger, separate piece of work (every template in lib/email.ts),
      // not attempted here. The push text is small enough to do properly now
      // that userProfile.lang exists to read.
      const n = list.length;
      const sw = up?.lang === "sw";
      void sendExpoPush(userId, {
        title: sw
          ? (n === 1 ? "Fuatilia ombi lako" : `Maombi ${n} yanahitaji ufuatiliaji`)
          : (n === 1 ? "Follow up on your application" : `${n} applications to follow up`),
        body: sw
          ? (n === 1
              ? `Imepita wiki tangu uombe ${list[0].title}${list[0].company ? " katika " + list[0].company : ""}.`
              : "Ujumbe mfupi wa kufuatilia unaweza kusogeza mbele ombi lililokwama.")
          : (n === 1
              ? `It's been a week since you applied to ${list[0].title}${list[0].company ? " at " + list[0].company : ""}.`
              : "A quick follow-up message can move a stalled application forward."),
        data: { screen: "Applications" },
      }).catch(() => {});
    } catch (err) {
      // Roll the claim back so the next cron tick retries this user's apps.
      console.error("Follow-up email failed; will retry next run:", err);
      await db.update(application).set({ followUpRemindedAt: null }).where(inArray(application.id, ids));
    }
  }

  return NextResponse.json({ reminded: remindedApps, users: usersEmailed });
}
