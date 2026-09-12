"use client";

/**
 * Browser-side half of web push. The server side (VAPID key, subscription
 * storage, sendToUser, the service worker's notificationclick handler) was
 * fully built — nothing here ever called it. Notification.requestPermission()
 * and pushManager.subscribe() were never wired to any UI, so
 * webPushSubscription has presumably always been empty and sendToUser()
 * has always delivered to zero recipients on web.
 */

/** Converts the VAPID public key (base64url) to the Uint8Array shape
 *  PushManager.subscribe's applicationServerKey requires. Standard Web Push
 *  API conversion — the key is base64url without padding. Exported for a
 *  direct test — a wrong decode would silently corrupt every subscription's
 *  applicationServerKey. */
export function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export type PushSupport = "unsupported" | "subscribed" | "unsubscribed" | "denied";

export function pushIsSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

/** Current state, without prompting for anything. */
export async function getPushState(): Promise<PushSupport> {
  if (!pushIsSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return sub ? "subscribed" : "unsubscribed";
  } catch {
    return "unsubscribed";
  }
}

/** Requests permission (if needed) and creates + registers a subscription.
 *  Must be called from a direct user gesture (a click handler), not an
 *  effect — browsers require that for the permission prompt. */
export async function subscribeToPush(): Promise<boolean> {
  if (!pushIsSupported()) return false;

  const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (perm !== "granted") return false;

  const keyRes = await fetch("/api/push/vapid-key").then((r) => r.json()).catch(() => null);
  const key: string | null = keyRes?.data?.key ?? null;
  if (!key) return false; // server has no VAPID key configured

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub = existing ?? (await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key) as unknown as BufferSource,
  }));

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });
  return res.ok;
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!pushIsSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    }).catch(() => {});
  } catch {
    /* best-effort */
  }
}
