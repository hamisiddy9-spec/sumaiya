/**
 * Signal dispatcher — the missing half of the proactive-signal engine.
 *
 * lib/assistant/signals.ts computes deterministic, grounded nudges, but on
 * its own only reaches a user who happens to open the app in that session.
 * This turns due signals into push notifications (native Expo + web push),
 * using the same mark-before-send claim pattern as the older follow-up
 * reminder (app/api/cron/follow-ups), generalized across every signal type.
 *
 * application.followUp is deliberately excluded here — it already has its
 * own dedicated cron with its own claim column (application.followUpRemindedAt)
 * and richer per-app grouping; this dispatcher covers the other six.
 *
 * Identity for the cooldown ledger is coarser than the in-thread signalKey()
 * (type+full trigger): signalKey embeds day-counts that change daily (e.g. a
 * deadline's "in 5d") and would re-notify every single day. notifKey collapses
 * that to `${type}|${jobId ?? applicationId ?? "profile"}` with a fixed
 * per-type cooldown — a real reminder cadence, not spam.
 */
import { db, cv, userProfile, signalNotification, type NewSignalNotification } from "@/lib/db";
import { desc, eq, and } from "drizzle-orm";
import { assembleUserContext } from "@/lib/assistant/context";
import { computeSignals, type Signal, type SignalType } from "@/lib/assistant/signals";
import { sendExpoPush } from "@/lib/push/expo";
import { sendToUser } from "@/lib/push";

const MAX_USERS_PER_RUN = 200;
const MAX_SIGNALS_PER_USER = 2; // don't bury someone in notifications in one run

/** How many days before the SAME nudge (same type + job/application) can re-fire. */
const COOLDOWN_DAYS: Partial<Record<SignalType, number>> = {
  confirmations: 3,
  "cv.tailor": 3,
  "coverLetter.generate": 5,
  "ats.check": 5,
  "career.skillGap": 5,
  "job.newMatch": 3,
};

export function notifKey(s: Signal): string {
  return `${s.type}|${s.jobId ?? s.applicationId ?? "profile"}`;
}

/** Mirrors apps/native/src/lib/signal-actions.ts's routing — kept minimal and duplicated on purpose (native code isn't importable from the web bundle). */
export function deepLink(s: Signal): Record<string, unknown> {
  switch (s.type) {
    case "confirmations":
      return { screen: "ProfileTab", params: { screen: "CareerProfile" } };
    case "cv.tailor":
    case "job.newMatch":
      return { screen: "Jobs" };
    case "coverLetter.generate":
      return { screen: "SumaiyaTab" };
    case "ats.check":
      return { screen: "AtsChecker" };
    case "career.skillGap":
      return { screen: "LearningHub" };
    default:
      return { screen: "HomeMain" };
  }
}

/**
 * The web equivalent of deepLink() — a URL path for the browser's
 * notificationclick handler (public/sw.js reads notification.data.url),
 * not a React-Navigation screen name. Web has no per-signal-type page the
 * way native has separate Jobs/AtsChecker/LearningHub tabs — every one of
 * these (job matches, ATS check, skill gaps, cover-letter drafting,
 * unconfirmed-facts review) is actually surfaced inside the assistant chat
 * (SignalsCard/ConfirmationsCard, mounted on /assistant), so that's the
 * one honest, always-correct destination for every signal type here.
 * Previously this was never set at all — sendToUser() defaults an unset
 * url to "/", so every web push notification opened the bare homepage
 * regardless of what it was actually about.
 */
export function webDeepLink(_s: Signal): string {
  return "/assistant";
}

/** Dispatch due signals for one user. Returns how many notifications went out. */
export async function dispatchSignalsForUser(userId: string, now: Date = new Date()): Promise<number> {
  const ctx = await assembleUserContext(userId);
  const all = computeSignals(ctx, now).filter((s) => s.type !== "application.followUp");
  if (!all.length) return 0;

  // Best-effort — a lookup failure just falls back to English, same as an
  // unset preference. Never let this block the actual notification send.
  let sw = false;
  try {
    const [row] = await db.select({ lang: userProfile.lang }).from(userProfile).where(eq(userProfile.id, userId)).limit(1);
    sw = row?.lang === "sw";
  } catch { /* default English */ }

  let sent = 0;
  for (const s of all) {
    if (sent >= MAX_SIGNALS_PER_USER) break;
    const cooldownDays = COOLDOWN_DAYS[s.type] ?? 3;
    const key = notifKey(s);
    const cutoff = new Date(now.getTime() - cooldownDays * 86_400_000);

    // Cooldown check, then claim. This cron runs once daily on a single
    // process, so the small window between check and write is an accepted
    // trade — the follow-up cron's single-statement conditional claim (via
    // setWhere) isn't available on this drizzle-orm version.
    const [existing] = await db
      .select({ sentAt: signalNotification.sentAt })
      .from(signalNotification)
      .where(and(eq(signalNotification.userId, userId), eq(signalNotification.notifKey, key)))
      .limit(1);
    if (existing && existing.sentAt >= cutoff) continue; // still within cooldown

    await db
      .insert(signalNotification)
      .values({ id: `signotif_${userId.slice(0, 8)}_${Date.now()}_${sent}`, userId, notifKey: key, type: s.type, sentAt: now } satisfies NewSignalNotification)
      .onConflictDoUpdate({
        target: [signalNotification.userId, signalNotification.notifKey],
        set: { sentAt: now, type: s.type },
      });

    // Two different shapes, one for each channel: sendExpoPush reads
    // `data` (a React-Navigation screen/params), sendToUser reads `url` (a
    // browser path) — see webDeepLink's own comment for why they can't
    // share one value. Each send function ignores the field it doesn't use.
    const msg = {
      title: sw ? s.title.sw : s.title.en,
      body: sw ? s.detail.sw : s.detail.en,
      data: deepLink(s),
      url: webDeepLink(s),
    };
    try {
      const [native, web] = await Promise.all([
        sendExpoPush(userId, msg).catch(() => 0),
        sendToUser(userId, msg).catch(() => 0),
      ]);
      if (native + web > 0) sent++;
    } catch (err) {
      console.error(`[signals-dispatch] send failed for ${userId} (${s.type}):`, err);
    }
  }
  return sent;
}

/** Nightly batch for the cron: dispatch for every user who owns a CV. */
export async function dispatchSignalsForAllUsers(): Promise<{ users: number; notified: number; failed: number }> {
  const users = await db
    .selectDistinct({ userId: cv.userId })
    .from(cv)
    .orderBy(desc(cv.userId))
    .limit(MAX_USERS_PER_RUN);

  let notified = 0;
  let failed = 0;
  for (const u of users) {
    try {
      const n = await dispatchSignalsForUser(u.userId);
      if (n > 0) notified++;
    } catch (e) {
      failed++;
      console.error(`[signals-dispatch] failed for ${u.userId}:`, e);
    }
  }
  return { users: users.length, notified, failed };
}
