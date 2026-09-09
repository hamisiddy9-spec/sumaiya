// Web push — own it, no FCM (blueprint Stage 5, from the growth research).
//
// An installed Android/desktop PWA supports the Web Push protocol natively.
// The whole backend is a VAPID keypair + the `web-push` library. This is the
// FREE re-engagement rail behind WhatsApp.
//
// Env: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto: or https:).
// Generate once:  npx web-push generate-vapid-keys
// With no keys set, every function here degrades to a no-op — nothing breaks.

import "server-only";
import { nanoid } from "nanoid";
import { db, webPushSubscription } from "@/lib/db";

export interface PushSubscriptionJSON {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushMessage {
  title: string;
  body: string;
  /** deep link opened on notification click — a path or absolute URL */
  url?: string;
  /** tag: a later push with the same tag replaces the earlier one */
  tag?: string;
}

export function pushConfigured(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function vapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

/** Store (or refresh) a browser PushSubscription for a user. */
export async function saveSubscription(
  userId: string,
  sub: PushSubscriptionJSON,
  userAgent = "",
): Promise<boolean> {
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return false;
  try {
    await db
      .insert(webPushSubscription)
      .values({
        id: nanoid(),
        userId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        userAgent: userAgent.slice(0, 400),
      })
      .onConflictDoUpdate({
        target: webPushSubscription.endpoint,
        set: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth, lastSeenAt: new Date() },
      });
    return true;
  } catch (err) {
    console.error("[push] saveSubscription failed:", err);
    return false;
  }
}

export async function removeSubscription(endpoint: string): Promise<void> {
  try {
    const { eq } = await import("drizzle-orm");
    await db.delete(webPushSubscription).where(eq(webPushSubscription.endpoint, endpoint));
  } catch (err) {
    console.error("[push] removeSubscription failed:", err);
  }
}

/**
 * Send a push to every one of a user's subscriptions. Prunes endpoints the
 * push service reports as gone (404 / 410). Returns how many were delivered.
 */
export async function sendToUser(userId: string, msg: PushMessage): Promise<number> {
  if (!pushConfigured()) return 0;
  let webpush: typeof import("web-push");
  try {
    webpush = await import("web-push");
  } catch {
    console.warn("[push] `web-push` not installed — cannot send.");
    return 0;
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:support@sumaiya.pro",
    process.env.VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string,
  );

  const { eq } = await import("drizzle-orm");
  const subs = await db
    .select()
    .from(webPushSubscription)
    .where(eq(webPushSubscription.userId, userId));

  const payload = JSON.stringify({
    title: msg.title,
    body: msg.body,
    url: msg.url ?? "/",
    tag: msg.tag,
  });

  let delivered = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        delivered += 1;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await removeSubscription(s.endpoint);
        } else {
          console.error("[push] send failed:", status, err);
        }
      }
    }),
  );
  return delivered;
}
