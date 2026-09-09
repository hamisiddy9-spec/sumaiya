import React, { useEffect, useState } from "react";
import { Alert, Linking, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useColorScheme } from "nativewind";
import { useAuthContext } from "../../contexts/auth-context";
import { apiClient } from "../../lib/api-client";
import { useLang } from "../../lib/i18n";
import { getSecureItem, setSecureItem, offlineStorage } from "@sumaiya/utils";
import { Icon } from "../../components/icon";
import {
  Button,
  ListGroupLabel,
  ListRow,
  Screen,
  ScreenTitle,
  haptics,
  useThemeColors,
} from "../../components/ui";

function initials(name?: string | null, email?: string | null): string {
  const src = name?.trim() || email?.split("@")[0] || "U";
  const parts = src.split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || src[0].toUpperCase();
}

export function ProfileScreen({ navigation }: any) {
  const c = useThemeColors();
  const { user, signOut } = useAuthContext();
  const { colorScheme, setColorScheme } = useColorScheme();
  const { lang, setLang, t } = useLang();

  const [notifications, setNotifications] = useState(false);
  const [busy, setBusy] = useState<"signout" | "delete" | "cache" | null>(null);

  const version = Constants.expoConfig?.version ?? "1.0.0";
  const dark = colorScheme === "dark";

  useEffect(() => {
    (async () => {
      try {
        // Reflect the real OS permission, not just a stored flag — the user
        // may have changed it in system settings.
        const perm = await Notifications.getPermissionsAsync();
        const stored = await getSecureItem("notifications");
        setNotifications(perm.granted && stored !== "false");
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const setDark = async (v: boolean) => {
    setColorScheme(v ? "dark" : "light");
    try {
      await setSecureItem("darkMode", v ? "true" : "false");
    } catch {
      /* non-fatal */
    }
  };

  const pickLanguage = (l: "en" | "sw") => {
    haptics.selection();
    setLang(l); // LangProvider persists it and the whole app re-renders
  };

  const setNotif = async (v: boolean) => {
    if (v) {
      const perm = await Notifications.requestPermissionsAsync();
      if (!perm.granted) {
        setNotifications(false);
        Alert.alert(
          t("Notifications are off", "Arifa zimezimwa"),
          t(
            "Turn on notifications for Sumaiya in your phone's Settings to get job matches and updates.",
            "Washa arifa za Sumaiya kwenye Mipangilio ya simu yako ili upate kazi zinazokufaa na taarifa.",
          ),
          [
            { text: t("Not now", "Si sasa"), style: "cancel" },
            { text: t("Open Settings", "Fungua Mipangilio"), onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
    }
    setNotifications(v);
    haptics.selection();
    try {
      await setSecureItem("notifications", v ? "true" : "false");
    } catch {
      /* non-fatal */
    }
  };

  const clearCache = () => {
    haptics.warning();
    Alert.alert("Clear offline data?", "Downloaded CVs and cached data will be removed from this device. Your cloud copies are safe.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          setBusy("cache");
          try {
            await offlineStorage.clearAll();
            haptics.success();
            Alert.alert("Done", "Offline data cleared.");
          } catch {
            haptics.error();
            Alert.alert("Couldn't clear", "Try again.");
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  const confirmSignOut = () => {
    haptics.warning();
    Alert.alert("Sign out?", "You can sign back in any time.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          setBusy("signout");
          try {
            await signOut();
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  const confirmDelete = () => {
    haptics.warning();
    Alert.alert(
      "Delete your account?",
      "This permanently removes your CVs, cover letters and account data. It can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: async () => {
            setBusy("delete");
            try {
              await apiClient.deleteAccount();
              haptics.success();
              await signOut();
            } catch {
              haptics.error();
              Alert.alert("Couldn't delete", "Contact support@sumaiya.pro.");
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  };

  const groupBox = { borderRadius: 14, overflow: "hidden" as const, borderWidth: 1, borderColor: c.border };

  return (
    <Screen scroll keyboardAvoiding={false}>
      <Animated.View entering={FadeInDown.duration(300)}>
        <ScreenTitle>Profile</ScreenTitle>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            backgroundColor: c.bgElevated,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: c.border,
            padding: 16,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              backgroundColor: c.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: c.accentText, fontSize: 20, fontWeight: "800" }}>
              {initials(user?.name, user?.email)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 17, fontWeight: "700" }} numberOfLines={1}>
              {user?.name || user?.email?.split("@")[0] || "Your account"}
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(300).delay(70)}>
        {/* Career profile — the facts Sumaiya reads */}
        <ListGroupLabel>{t("Your details", "Taarifa zako")}</ListGroupLabel>
        <View style={groupBox}>
          <ListRow
            first
            last
            icon="user"
            iconColor={c.accent}
            label={t("Career profile", "Wasifu wa kazi")}
            sublabel={t("Skills, experience, goals — Sumaiya uses these", "Ujuzi, uzoefu, malengo — Sumaiya anatumia haya")}
            onPress={() => navigation.navigate("CareerProfile")}
            chevron
          />
        </View>

        {/* Appearance */}
        <ListGroupLabel>{t("Appearance", "Muonekano")}</ListGroupLabel>
        <View style={groupBox}>
          <ListRow
            first
            icon={dark ? "moon" : "sun"}
            iconColor={c.accent}
            label={t("Dark mode", "Hali ya giza")}
            toggle={{ value: dark, onValueChange: setDark }}
          />
          <View style={{ backgroundColor: c.bgElevated, paddingHorizontal: 16, paddingVertical: 13 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 10 }}>
              <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: c.textBody + "1f", alignItems: "center", justifyContent: "center" }}>
                <Icon name="globe" size={16} color={c.textBody} />
              </View>
              <Text style={{ color: c.text, fontSize: 15, fontWeight: "600" }}>{t("Language", "Lugha")}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["en", "sw"] as const).map((l) => {
                const active = lang === l;
                return (
                  <Pressable
                    key={l}
                    onPress={() => pickLanguage(l)}
                    style={{
                      flex: 1,
                      paddingVertical: 9,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: active ? c.accent : c.border,
                      backgroundColor: active ? c.accent + "14" : "transparent",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: active ? c.accent : c.textBody, fontWeight: "700", fontSize: 13.5 }}>
                      {l === "en" ? "English" : "Kiswahili"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Notifications */}
        <ListGroupLabel>{t("Notifications", "Arifa")}</ListGroupLabel>
        <View style={groupBox}>
          <ListRow
            first
            last
            icon="bell"
            label={t("Push notifications", "Arifa za simu")}
            sublabel={t("Job matches, sync updates", "Kazi zinazofaa, taarifa za usawazishaji")}
            toggle={{ value: notifications, onValueChange: setNotif }}
          />
        </View>

        {/* Account */}
        <ListGroupLabel>{t("Account", "Akaunti")}</ListGroupLabel>
        <View style={groupBox}>
          <ListRow first icon="lock" label={t("Change password", "Badilisha nywila")} onPress={() => navigation.navigate("ChangePassword")} />
          <ListRow
            icon="trash-2"
            iconColor={c.warning}
            label={t("Clear offline data", "Futa data ya nje ya mtandao")}
            disabled={busy === "cache"}
            onPress={clearCache}
            chevron
          />
          <ListRow last icon="alert-circle" label={t("Version", "Toleo")} value={version} />
        </View>

        {/* Danger */}
        <ListGroupLabel>{t("Danger zone", "Eneo la hatari")}</ListGroupLabel>
        <View style={groupBox}>
          <ListRow
            first
            last
            icon="trash-2"
            label={t("Delete account", "Futa akaunti")}
            destructive
            disabled={busy === "delete"}
            onPress={confirmDelete}
          />
        </View>

        <View style={{ marginTop: 26 }}>
          <Button label={t("Sign out", "Toka")} variant="secondary" loading={busy === "signout"} onPress={confirmSignOut} />
        </View>

        <Text style={{ color: c.textMuted, fontSize: 12, textAlign: "center", marginTop: 20, lineHeight: 18 }}>
          Sumaiya · Documents that get you hired{"\n"}support@sumaiya.pro
        </Text>
      </Animated.View>
    </Screen>
  );
}
