import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { getSecureItem, setSecureItem } from "@sumaiya/utils";
import { apiClient } from "./api-client";
import { reportError } from "./reporting";

/**
 * Push registration.
 *
 * Env-gated: does nothing until an EAS `projectId` exists in app config
 * (`extra.eas.projectId`, set by `eas init`). Until then this is a clean no-op
 * — the permission toggle in Profile still works, it just won't send a token.
 *
 * When provisioned: after the user is signed in and has granted notifications,
 * fetch the Expo push token and register it with the backend
 * (/api/mobile/device-token). Re-registers only when the token changes.
 */

// Show notifications while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function projectId(): string | null {
  const id =
    (Constants.expoConfig as { extra?: { eas?: { projectId?: string } } })?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
  return id ?? null;
}

async function deviceId(): Promise<string> {
  let id = await getSecureItem("device_id").catch(() => null);
  if (!id) {
    id = `${Platform.OS}-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
    await setSecureItem("device_id", id).catch(() => {});
  }
  return id;
}

/**
 * Does the actual work: checks permission, sets up the Android channel,
 * fetches an Expo push token and registers it with the backend. Returns
 * true if a token is registered (either just now or already, unchanged) —
 * false if permission isn't granted or no EAS project is provisioned.
 *
 * Exported (not just called from the hook below) so an explicit,
 * user-initiated permission grant — e.g. the Profile notifications toggle,
 * which calls Notifications.requestPermissionsAsync() itself — can trigger
 * a real registration attempt immediately. The hook's own effect only ever
 * runs once per mount; if permission wasn't granted YET at that moment (the
 * common case — a fresh install's permission prompt is easy to dismiss or
 * defer), nothing would otherwise ever retry until the next full app
 * restart, even after the user turns the toggle on.
 */
export async function registerForPush(userId: string): Promise<boolean> {
  const pid = projectId();
  if (!pid || !userId) return false; // not provisioned yet — no-op

  try {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return false;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Sumaiya",
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: "#DA4A1C",
      });
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId: pid })).data;
    const stored = await getSecureItem("push_token").catch(() => null);
    if (token && token !== stored) {
      await apiClient.registerPushToken({
        pushToken: token,
        platform: Platform.OS === "ios" ? "ios" : "android",
        deviceId: await deviceId(),
      });
      await setSecureItem("push_token", token).catch(() => {});
    }
    return !!token;
  } catch (err) {
    reportError(err, { scope: "push.register" });
    return false;
  }
}

/** Call once from a component that has the signed-in user — the passive,
 *  automatic attempt on mount. See registerForPush for the explicit,
 *  user-triggered path (used by the Profile notifications toggle). */
export function usePushRegistration(userId: string | undefined) {
  const done = useRef(false);

  useEffect(() => {
    if (!userId || done.current) return;
    done.current = true;
    void registerForPush(userId);
  }, [userId]);
}
