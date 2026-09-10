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

/** Call once from a component that has the signed-in user. */
export function usePushRegistration(userId: string | undefined) {
  const done = useRef(false);

  useEffect(() => {
    if (!userId || done.current) return;
    const pid = projectId();
    if (!pid) return; // not provisioned yet — no-op

    done.current = true;
    (async () => {
      try {
        const perm = await Notifications.getPermissionsAsync();
        if (!perm.granted) return; // user hasn't opted in; the Profile toggle asks

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
      } catch (err) {
        reportError(err, { scope: "push.register" });
        done.current = false; // allow a retry next mount
      }
    })();
  }, [userId]);
}
