"use client";

// Web push — client side (blueprint Stage 5).
//
// Rule from the growth research: NEVER prompt on first load. Call
// requestPushSubscription() only after a value moment (CV exported, first job
// match) and only after your own in-context pre-prompt — the browser's
// permission dialog is one-shot and a hard deny is permanent.

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type PushSupport = "unsupported" | "denied" | "granted" | "prompt";

export function pushSupport(): PushSupport {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission === "granted") return "granted";
  return "prompt";
}

/**
 * Ask permission (if not already granted), subscribe, and POST the subscription
 * to the server. Returns true on success. Safe to call again — idempotent.
 */
export async function requestPushSubscription(): Promise<boolean> {
  if (pushSupport() === "unsupported" || pushSupport() === "denied") return false;

  const keyRes = await fetch("/api/push/vapid-key").then((r) => r.json()).catch(() => null);
  const vapidKey: string | null = keyRes?.data?.key ?? null;
  if (!vapidKey) return false; // server has no VAPID keys configured

  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();
  if (permission !== "granted") return false;

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    }));

  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(json),
  });
  return res.ok;
}

export async function unsubscribePush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
    await sub.unsubscribe();
  } catch {
    /* best effort */
  }
}
