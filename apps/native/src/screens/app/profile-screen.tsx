import React, { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Notifications from "expo-notifications";
import { useColorScheme } from "nativewind";
import { useAuthContext } from "../../contexts/auth-context";
import { registerForPush } from "../../lib/push";
import { useEntitlements } from "../../lib/entitlements";
import { PremiumSheet } from "../../components/premium-sheet";
import { apiClient } from "../../lib/api-client";
import { APP_VERSION } from "../../lib/app-version";
import { SUPPORT_EMAIL } from "../../lib/app-hosts";
import { useLang } from "../../lib/i18n";
import { dialog } from "../../components/ui";
import { getSecureItem, setSecureItem, offlineStorage } from "@sumaiya/utils";
import { Icon } from "../../components/icon";
import type { ProfileScreenProps } from "../../navigation/types";
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

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const c = useThemeColors();
  const { user, signOut } = useAuthContext();
  const { premium } = useEntitlements();
  const [showPremium, setShowPremium] = useState(false);
  const { colorScheme, setColorScheme } = useColorScheme();
  const { lang, setLang, t } = useLang();

  const [notifications, setNotifications] = useState(false);
  const [busy, setBusy] = useState<"signout" | "delete" | "cache" | null>(null);

  // One reader for Profile, the update prompt and telemetry — a second inline
  // read of the config is how the displayed version drifted from the installed
  // one. See lib/app-version.ts.
  const version = APP_VERSION;
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
      if (perm.granted && user?.id) {
        // Permission was JUST granted via this explicit toggle — the
        // mount-time hook (usePushRegistration) already ran once, possibly
        // before permission existed, and won't retry on its own. Without
        // this, the toggle would show "on" with no token ever registered
        // until the app is fully restarted.
        void registerForPush(user.id);
      }
      if (!perm.granted) {
        setNotifications(false);
        dialog.alert(
          t("Notifications are off", "Arifa zimezimwa"),
          t(
            "Turn on notifications in your phone's Settings so I can send you job matches and updates.",
            "Washa arifa kwenye Mipangilio ya simu yako ili nikutumie ajira zinazokufaa na taarifa.",
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

  const clearCache = async () => {
    haptics.warning();
    // "Your cloud copies are safe" is only true for data that's actually
    // synced. offlineStorage.clearAll() also wipes the sync queue — any edit
    // still waiting to upload (exactly the case the offline-sync fixes above
    // now deliberately keep retrying forever, since it never made it to the
    // server) would be silently discarded, contradicting the dialog's own
    // promise. Check first and say so plainly if that's actually the case.
    let pending = 0;
    try {
      pending = (await offlineStorage.getSyncQueue()).length;
    } catch {
      /* if this fails, fall through with the normal (0-pending) dialog */
    }

    if (pending > 0) {
      dialog.alert(
        t("Unsynced changes will be lost", "Mabadiliko ambayo hayajasawazishwa yatapotea"),
        t(
          `${pending} change${pending === 1 ? "" : "s"} on this device ${pending === 1 ? "hasn't" : "haven't"} finished uploading yet. Clearing offline data now will discard ${pending === 1 ? "it" : "them"} — this is different from your already-synced CVs, which are safe on the server.`,
          `Mabadiliko ${pending} kwenye kifaa hiki hayajamaliza kupakiwa. Kufuta data iliyohifadhiwa sasa kutayafuta — hii ni tofauti na CV zako zilizosawazishwa tayari, ambazo ziko salama kwenye seva.`,
        ),
        [
          { text: t("Cancel", "Ghairi"), style: "cancel" },
          {
            text: t("Clear anyway", "Futa hata hivyo"),
            style: "destructive",
            onPress: () => void doClearCache(),
          },
        ],
      );
      return;
    }

    dialog.alert(t("Clear offline data?", "Futa data iliyohifadhiwa?"), t("Downloaded CVs and cached data will be removed from this device. Your cloud copies are safe.", "CV zilizopakuliwa na data iliyohifadhiwa zitaondolewa kwenye simu hii. Nakala zako za wingu ziko salama."), [
      { text: t("Cancel", "Ghairi"), style: "cancel" },
      { text: t("Clear", "Futa"), style: "destructive", onPress: () => void doClearCache() },
    ]);
  };

  const doClearCache = async () => {
    setBusy("cache");
    try {
      await offlineStorage.clearAll();
      haptics.success();
      dialog.alert(t("Done", "Imekamilika"), t("Offline data cleared.", "Data iliyohifadhiwa imefutwa."));
    } catch {
      haptics.error();
      dialog.alert(t("Couldn't clear", "Imeshindwa kufuta"), t("Try again.", "Jaribu tena."));
    } finally {
      setBusy(null);
    }
  };

  const confirmSignOut = () => {
    haptics.warning();
    dialog.alert(t("Sign out?", "Unataka kutoka?"), t("You can sign back in any time.", "Unaweza kuingia tena wakati wowote."), [
      { text: t("Cancel", "Ghairi"), style: "cancel" },
      {
        text: t("Sign out", "Toka"),
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
    dialog.alert(
      t("Delete your account?", "Ufute akaunti yako?"),
      t("This permanently removes your CVs, cover letters and account data. It can't be undone.", "Hili linaondoa kabisa CV zako, barua za maombi na taarifa za akaunti. Haliwezi kurudishwa."),
      [
        { text: t("Cancel", "Ghairi"), style: "cancel" },
        {
          text: t("Delete everything", "Futa kila kitu"),
          style: "destructive",
          onPress: async () => {
            setBusy("delete");
            try {
              await apiClient.deleteAccount();
              haptics.success();
              await signOut();
            } catch {
              haptics.error();
              dialog.alert(
                t("Couldn't delete", "Imeshindwa kufuta"),
                t(`Contact ${SUPPORT_EMAIL}.`, `Wasiliana na ${SUPPORT_EMAIL}.`),
              );
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
        <ScreenTitle>{t("Profile", "Wasifu")}</ScreenTitle>

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
              {user?.name || user?.email?.split("@")[0] || t("Your account", "Akaunti yako")}
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
            sublabel={t("Skills, experience, goals — I use these", "Ujuzi, uzoefu, malengo — ninatumia haya")}
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
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
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
            sublabel={t("Job matches, sync updates", "Ajira zinazofaa, taarifa za usawazishaji")}
            toggle={{ value: notifications, onValueChange: setNotif }}
          />
        </View>

        {/* Invite */}
        <ListGroupLabel>{t("Share Sumaiya", "Shirikisha Sumaiya")}</ListGroupLabel>
        <View style={groupBox}>
          <ListRow
            first
            last
            icon="gift"
            iconColor={c.accent}
            label={t("Invite a friend", "Mwalike rafiki")}
            sublabel={t("It's free — help someone else get hired", "Ni bure — msaidie mtu mwingine apate ajira")}
            onPress={() => navigation.navigate("HomeTab", { screen: "Invite" })}
            chevron
          />
        </View>

        {/* Premium */}
        {!premium ? (
          <>
            <ListGroupLabel>{t("Sumaiya Premium", "Sumaiya Premium")}</ListGroupLabel>
            <View style={groupBox}>
              <ListRow
                first
                last
                icon="gem"
                iconColor={c.accent}
                label={t("Advanced templates & deep courses", "Miundo ya hali ya juu na kozi za kina")}
                sublabel={t("Everything essential stays free", "Kila kitu muhimu kinabaki bure")}
                onPress={() => setShowPremium(true)}
                chevron
              />
            </View>
          </>
        ) : null}

        {/* Account */}
        <ListGroupLabel>{t("Account", "Akaunti")}</ListGroupLabel>
        <View style={groupBox}>
          <ListRow
            first
            icon="trash-2"
            iconColor={c.warning}
            label={t("Clear offline data", "Futa data iliyohifadhiwa")}
            disabled={busy === "cache"}
            onPress={clearCache}
            chevron
          />
          <ListRow last icon="alert-circle" label={t("Version", "Toleo")} value={version} />
        </View>

        {/* Help & support */}
        <ListGroupLabel>{t("Help & support", "Msaada na usaidizi")}</ListGroupLabel>
        <View style={groupBox}>
          <ListRow
            first
            icon="help-circle"
            iconColor={c.accent}
            label={t("Help & FAQ", "Maswali ya kawaida")}
            sublabel={t("How to scan, score, export and more", "Jinsi ya kupakia, kukagua alama na kupakua")}
            onPress={() => navigation.navigate("HelpFaq")}
            chevron
          />
          {/* PDPA ss.33/38 — access and erasure need a door, not a paragraph. */}
          <ListRow
            icon="sparkles"
            iconColor={c.accent}
            label={t("What Sumaiya knows", "Anachojua Sumaiya")}
            sublabel={t("See, correct or delete what she remembers", "Ona, rekebisha au futa anachokumbuka")}
            onPress={() => navigation.navigate("Memory")}
            chevron
          />
          <ListRow
            icon="shield"
            iconColor={c.accent}
            label={t("Privacy & Terms", "Faragha na Masharti")}
            sublabel={t("How your data is used and protected", "Jinsi data yako inavyotumiwa na kulindwa")}
            onPress={() => navigation.navigate("PrivacyTerms")}
            chevron
          />
          <ListRow
            last
            icon="mail"
            iconColor={c.accent}
            label={t("Contact support", "Wasiliana nasi")}
            sublabel={SUPPORT_EMAIL}
            onPress={() => navigation.navigate("Support")}
            chevron
          />
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
          {t("Sumaiya · Your career, guided", "Sumaiya · Kazi yako, inaongozwa")}{"\n"}{SUPPORT_EMAIL}
        </Text>
      </Animated.View>
      <PremiumSheet visible={showPremium} onClose={() => setShowPremium(false)} feature="general" />
    </Screen>
  );
}
