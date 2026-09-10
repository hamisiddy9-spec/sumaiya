/**
 * Expo push — the send side. Tokens are registered by the native app
 * (PUT /api/mobile/device-token) and stored in `device_token`; nothing sent
 * them until now.
 *
 * No SDK: Expo's push service is a plain HTTPS POST. We chunk to 100 messages
 * per request (Expo's limit), and prune tokens the receipt reports as
 * `DeviceNotRegistered` so a stale token can't keep failing forever.
 */
import { db, deviceToken } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushMessage {
  title: string;
  body: string;
  /** Deep-link payload — the app's notification handler reads `screen`/`params`. */
  data?: Record<string, unknown>;
}

interface ExpoTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** True if the string is a well-formed Expo push token. */
export function isExpoPushToken(t: string): boolean {
  return /^Expo(nent)?PushToken\[[^\]]+\]$/.test(t) || /^[a-z\d]{8}-[a-z\d]{4}-[a-z\d]{4}-[a-z\d]{4}-[a-z\d]{12}$/i.test(t);
}

/**
 * Send one notification to every device registered for a user. Best-effort:
 * returns the count actually accepted by Expo, never throws. A caller in a
 * cron loop should not have a bad token abort the run.
 */
export async function sendExpoPush(userId: string, msg: PushMessage): Promise<number> {
  let rows: { pushToken: string }[];
  try {
    rows = await db
      .select({ pushToken: deviceToken.pushToken })
      .from(deviceToken)
      .where(eq(deviceToken.userId, userId));
  } catch (err) {
    console.error("[push] token lookup failed:", err);
    return 0;
  }

  const tokens = Array.from(new Set(rows.map((r) => r.pushToken).filter(isExpoPushToken)));
  if (!tokens.length) return 0;

  let accepted = 0;
  const dead: string[] = [];

  for (const group of chunk(tokens, 100)) {
    const payload = group.map((to) => ({
      to,
      title: msg.title,
      body: msg.body,
      sound: "default" as const,
      ...(msg.data ? { data: msg.data } : {}),
    }));

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { data?: ExpoTicket[] };
      const tickets = json.data ?? [];
      tickets.forEach((t, i) => {
        if (t.status === "ok") accepted++;
        else if (t.details?.error === "DeviceNotRegistered") dead.push(group[i]);
      });
    } catch (err) {
      console.error("[push] send chunk failed:", err);
    }
  }

  if (dead.length) {
    try {
      await db.delete(deviceToken).where(inArray(deviceToken.pushToken, dead));
    } catch {
      /* prune is best-effort */
    }
  }

  return accepted;
}
