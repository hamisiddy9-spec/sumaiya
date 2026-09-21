import React, { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useIsOnline } from "../lib/connectivity";
import { useAuthContext } from "../contexts/auth-context";
import { useLang } from "../lib/i18n";

/**
 * A thin strip when the device drops offline, and a reconnect hook: the moment
 * connectivity returns, pull the Career Profile back down (any offline edit is
 * pushed by that same call). Mounted once at the app shell.
 *
 * It says nothing about needing the network, and nothing here can block a
 * screen: the strip is `pointerEvents="none"`, which is what makes it safe for
 * a guest on a phone with no data — the CV path keeps working underneath it.
 */
export function ConnectivityGate() {
  const online = useIsOnline();
  const wasOnline = useRef(online);
  const { user } = useAuthContext();
  const { t } = useLang();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (online && !wasOnline.current && user) {
      // syncProfileFromServer only catches its own network call — the
      // AsyncStorage.setItem it does after isn't guarded, so a rare storage
      // fault here would otherwise be an unhandled rejection on every
      // offline-to-online transition. Best-effort background sync either way.
      //
      // Skipped entirely for a guest: there is no server profile to pull, so
      // the only thing that call can do on a guest's phone — on a data bundle
      // they are paying for — is fail.
      void import("../lib/profile-store").then((m) => m.syncProfileFromServer()).catch(() => {});
    }
    wasOnline.current = online;
  }, [online, user]);

  if (online) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(220)}
      exiting={FadeOutUp.duration(180)}
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        paddingTop: insets.top + 4,
        paddingBottom: 6,
        alignItems: "center",
        backgroundColor: "#211A15",
      }}
    >
      <Text style={{ color: "#FAF5EE", fontSize: 12, fontWeight: "700" }}>
        {t("Offline — changes are saved on your phone", "Nje ya mtandao — mabadiliko yamehifadhiwa kwenye simu")}
      </Text>
    </Animated.View>
  );
}
