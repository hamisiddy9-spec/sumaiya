import React, { useCallback, useEffect, useState } from "react";
import { Image, Linking, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Notifications from "expo-notifications";
import { useColorScheme } from "nativewind";
import { useAuthContext } from "../../contexts/auth-context";
import { openAuth } from "../../navigation/root-nav";
import { isPushAvailable, registerForPush } from "../../lib/push";
import { useEntitlements } from "../../lib/entitlements";
import { PremiumSheet } from "../../components/premium-sheet";
import { apiClient } from "../../lib/api-client";
import { APP_VERSION } from "../../lib/app-version";
import { SUPPORT_EMAIL } from "../../lib/app-hosts";
import { loadProfile } from "../../lib/profile-store";
import { useLang } from "../../lib/i18n";
import { dialog } from "../../components/ui";
import { getSecureItem, setSecureItem, offlineStorage } from "@sumaiya/utils";
import { Icon } from "../../components/icon";
import type { ProfileScreenProps } from "../../navigation/types";
import {
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
  // GUEST MODE: Profile is open to a guest, because language, dark mode,
  // privacy and support have nothing to do with an account. What changes is
  // the ACCOUNT group — there is no session to sign out of and no account to
  // delete, so it offers to create one instead of offering controls that
  // cannot do anything.
  const isGuest = !user;
  const { premium } = useEntitlements();
  const [showPremium, setShowPremium] = useState(false);
  const { colorScheme, setColorScheme } = useColorScheme();
  const { lang, setLang, t } = useLang();

  const [notifications, setNotifications] = useState(false);
  const [busy, setBusy] = useState<"signout" | "delete" | "cache" | null>(null);

  /**
   * The headshot the app asked for, on the screen where the user looks for it.
   *
   * Career Profile asks for a photo and tells them "It shows next to your name
   * and on your CVs" — but this identity card rendered initials and nothing
   * else, so the one screen that shows their name never showed the photo they
   * had picked. The CV got it; the identity block could not. Loaded on focus,
   * not just on mount, so returning from Career Profile after adding the photo
   * shows it immediately instead of after an app restart.
   */
  const [photo, setPhoto] = useState("");
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadProfile()
        .then((p) => {
          if (alive) setPhoto(p.photo || "");
        })
        .catch(() => {
          /* no local profile yet — the initials stand in */
        });
      return () => {
        alive = false;
      };
    }, []),
  );

  // Push can only register a token once app.json carries an Expo/EAS projectId
  // (extra.eas.projectId). Without one `registerForPush` returns false BEFORE it
  // reaches the token call, so asking for the Android notification permission
  // here would show a real system prompt and deliver nothing. The row stays,
  // dimmed, with the reason in plain Swahili — see lib/push.ts.
  const pushReady = isPushAvailable();

  // One reader for Profile, the update prompt and telemetry — a second inline
  // read of the config is how the displayed version drifted from the installed
  // one. See lib/app-version.ts.
  const version = APP_VERSION;
  const dark = colorScheme === "dark";

  useEffect(() => {
    (async () => {
      try {
        if (!pushReady) {
          setNotifications(false);
          return;
        }
        // Reflect the real OS permission, not just a stored flag — the user
        // may have changed it in system settings.
        const perm = await Notifications.getPermissionsAsync();
        const stored = await getSecureItem("notifications");
        setNotifications(perm.granted && stored !== "false");
      } catch {
        /* ignore */
      }
    })();
  }, [pushReady]);

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
    // Never ask for a permission the app cannot use — see pushReady above.
    if (!pushReady) return;
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
    //
    // FOR A GUEST the promise needs the opposite wording entirely: there is no
    // cloud copy of anything, so "your cloud copies are safe" would be the
    // most expensive sentence in the app — it would invite someone to delete
    // the only copy of their CV.
    let pending = 0;
    try {
      pending = (await offlineStorage.getSyncQueue()).length;
    } catch {
      /* if this fails, fall through with the normal (0-pending) dialog */
    }

    if (isGuest) {
      dialog.alert(
        t("Delete the CVs on this phone?", "Ufute CV zilizo kwenye simu hii?"),
        t(
          "These CVs have no account behind them, so this device holds the only copy. Deleting them here deletes them for good. Download the PDFs first if you want to keep them.",
          "CV hizi hazina akaunti nyuma yake, hivyo kifaa hiki kina nakala pekee. Kufuta hapa kunafuta kabisa. Pakua PDF kwanza ikiwa unataka kuzihifadhi.",
        ),
        [
          { text: t("Cancel", "Ghairi"), style: "cancel" },
          { text: t("Delete them", "Zifute"), style: "destructive", onPress: () => void doClearCache() },
        ],
      );
      return;
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
          {/* The photo the user picked in Career Profile, where they look for
              it — the initials are the fallback when there is none (and for a
              user who never added one, the circle is still the control that
              takes them to do it, like the one on that screen). */}
          <Pressable
            onPress={() => {
              haptics.selection();
              navigation.navigate("CareerProfile");
            }}
            accessibilityRole="button"
            accessibilityLabel={
              photo
                ? t("Change your photo", "Badilisha picha yako")
                : t("Add your photo", "Weka picha yako")
            }
            style={{ width: 56, height: 56, borderRadius: 18 }}
          >
            {photo ? (
              <Image
                source={{ uri: photo }}
                accessibilityLabel={t("Your photo", "Picha yako")}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: c.bg,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              />
            ) : isGuest ? (
              // No account, so no initial to show: the circle is the way to the
              // photo, and today it says so.
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: c.accent + "14",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="user-plus" size={22} color={c.accent} />
              </View>
            ) : (
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
            )}
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 17, fontWeight: "700" }} numberOfLines={1}>
              {user?.name || user?.email?.split("@")[0] || t("No account yet", "Bado huna akaunti")}
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 2 }} numberOfLines={2}>
              {user?.email ||
                t(
                  "Your CVs are saved on this phone. A free account keeps them for you.",
                  "CV zako zimehifadhiwa kwenye simu hii. Akaunti ya bure inazihifadhi kwa ajili yako.",
                )}
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
            sublabel={
              isGuest
                ? t(
                    "Job matches and sync updates come with a free account.",
                    "Ajira zinazokufaa na taarifa za usawazishaji huja na akaunti ya bure.",
                  )
                : pushReady
                  ? t("Job matches, sync updates", "Ajira zinazofaa, taarifa za usawazishaji")
                  : t(
                      "Not available yet — this version can't send alerts to your phone.",
                      "Bado haipatikani — toleo hili haliwezi kutuma arifa kwenye simu yako.",
                    )
            }
            value={pushReady && !isGuest ? undefined : t("Not yet", "Bado")}
            toggle={pushReady && !isGuest ? { value: notifications, onValueChange: setNotif } : undefined}
            disabled={!pushReady || isGuest}
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
          {/* A guest has no session to end and no account to delete, so the
              group offers the one account action that is real for them, first,
              and says what it earns. */}
          {isGuest ? (
            <ListRow
              first
              icon="user-plus"
              iconColor={c.accent}
              label={t("Create a free account", "Fungua akaunti bure")}
              sublabel={t(
                "Keep these CVs safe and open them on another phone",
                "Hifadhi CV zako salama na uzifungue kwenye simu nyingine",
              )}
              onPress={() => openAuth()}
              chevron
            />
          ) : null}
          <ListRow
            first={!isGuest}
            icon="trash-2"
            iconColor={c.warning}
            label={t("Clear offline data", "Futa data iliyohifadhiwa")}
            disabled={busy === "cache"}
            onPress={clearCache}
            chevron
          />
          {/* Sign out lives HERE, in Account, not only at the bottom of the
              screen below "Delete account".
              The device sweep reported "a user cannot sign out" from a dump of
              this tab: the AKAAUNTI group held exactly two rows and the bundle
              supposedly never contained "Toka". Both were artifacts — the dump
              is clipped to the viewport (the tree ends at "Msaada na Maswali",
              and scrolling reveals the real button), and the shipped 1.6.24
              bundle does contain "Toka" once as a deduplicated Hermes string.
              The control existed; it was one and a half screens down, under the
              one row nobody taps casually, on a screen where users look for it
              in the first group. On a shared phone that is the difference
              between signing out and handing the phone over signed in, so it
              also moved above the fold and the shadow button at the bottom was
              removed rather than duplicated. */}
          {!isGuest ? (
            <ListRow
              icon="log-out"
              label={t("Sign out", "Toka")}
              sublabel={t("You can sign back in any time", "Unaweza kuingia tena wakati wowote")}
              disabled={busy === "signout"}
              onPress={confirmSignOut}
              chevron
            />
          ) : null}
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
        {/* A guest has no account to delete — and apiClient.deleteAccount()
            without a session is a request that can only fail, so the row is
            hidden rather than offered as a dead end. */}
        {!isGuest ? (
          <>
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
          </>
        ) : null}

        {/* The shadow "Toka" button that used to sit here is gone: sign-out is
            a row in Account now, above the fold, with the same confirm dialog. */}

        <Text style={{ color: c.textMuted, fontSize: 12, textAlign: "center", marginTop: 20, lineHeight: 18 }}>
          {t("Sumaiya · Your career, guided", "Sumaiya · Kazi yako, inaongozwa")}{"\n"}{SUPPORT_EMAIL}
        </Text>
      </Animated.View>
      <PremiumSheet visible={showPremium} onClose={() => setShowPremium(false)} feature="general" />
    </Screen>
  );
}
