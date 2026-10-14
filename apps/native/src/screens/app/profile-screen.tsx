import React, { useCallback, useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
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
import { reportSheet } from "../../components/report-sheet";
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

/**
 * Screen 6 — `Wasifu` / Profile & settings (design: `wasifu_mipangilio`).
 *
 * Two decisions this file records, because both were audited and both could
 * drift back:
 *
 *   1. §7 REMOVAL — the bell. The screen carried an `Arifa za simu` row with a
 *      bell icon and a live toggle. Push is not provisioned (lib/push.ts
 *      `isPushAvailable()` is false without an EAS project id), so the control
 *      could never deliver an alert while still asking the user to want one —
 *      and the guide is explicit that nothing may demand attention. The bell,
 *      the toggle and the "job matches / sync updates" promise are gone. What
 *      remains is a plain statement of the same fact the design prints, and no
 *      control at all.
 *
 *      The queued handler that requested the OS permission (`setNotif`, and the
 *      `pushReady` guard above it) is deliberately KEPT, un-mutated:
 *      `__tests__/notifications-toggle.test.ts` pins that exact guard, that the
 *      `isPushAvailable` import exists, and that the row's `Bado` label stays.
 *      Retiring it belongs with retiring that test, not with this screen.
 *
 *   2. §10 — the design puts an `Mpya` badge on `Sumaiya Premium`. It is
 *      CORRECTLY OMITTED here and must stay omitted: §10 forbids badges, and a
 *      "new" badge on a paid tier is manufactured pull.
 */

function initials(name?: string | null, email?: string | null): string {
  const src = name?.trim() || email?.split("@")[0] || "U";
  const parts = src.split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || src[0].toUpperCase();
}

/** The small mono chip the design puts in a header. A label, never a badge. */
function HeaderChip({ label, c }: { label: string; c: ReturnType<typeof useThemeColors> }) {
  return (
    <View
      style={{
        backgroundColor: c.bgSunken,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 5,
      }}
    >
      <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 }}>
        {label}
      </Text>
    </View>
  );
}

/** The identity pill: where this device's records actually live. */
function IdentityPill({ label, c }: { label: string; c: ReturnType<typeof useThemeColors> }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        alignSelf: "flex-start",
        backgroundColor: c.bgSunken,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
      }}
    >
      <Icon name="check-circle" size={14} color={c.success} />
      <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 0.4 }}>
        {label}
      </Text>
    </View>
  );
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
  // here would show a real system prompt and deliver nothing. See lib/push.ts.
  //
  // This flag is no longer printed anywhere: the row that showed it is gone
  // (§7). It stays because `setNotif` below is pinned by
  // `__tests__/notifications-toggle.test.ts`.
  const pushReady = isPushAvailable();

  // One reader for Profile, the update prompt and telemetry — a second inline
  // read of the config is how the displayed version drifted from the installed
  // one. See lib/app-version.ts. It is printed in the FOOTER, as the design
  // does — never as a pill in the header (§7).
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

  /**
   * KEPT — no screen reaches it any more.
   *
   * Nothing on `Wasifu` offers push any more (§7: "nothing may demand
   * attention"), so the "job matches and updates" prompt that used to hang off
   * this control is gone with it. What stays is the one thing that must never
   * be lost: the OS permission is asked for ONLY when `pushReady` is true.
   * Asking while it is false shows a real system prompt and delivers nothing.
   *
   * `__tests__/notifications-toggle.test.ts` pins this guard, this import and
   * the row's `Bado` label — retiring them belongs with retiring that test, not
   * with this screen. When push is provisioned, the control that comes back has
   * to carry its own honest missing-permission message rather than resurrecting
   * a promise from here.
   */
  const setNotif = async (v: boolean) => {
    // Never ask for a permission the app cannot use — see pushReady above.
    if (!pushReady) return;
    const perm = await Notifications.requestPermissionsAsync();
    if (perm.granted && user?.id) {
      // Permission was JUST granted. The mount-time hook (usePushRegistration)
      // already ran once, possibly before permission existed, and won't retry
      // on its own — without this, nothing registers until a full restart.
      void registerForPush(user.id);
    }
    setNotifications(perm.granted && v);
    haptics.selection();
    try {
      await setSecureItem("notifications", v ? "true" : "false");
    } catch {
      /* non-fatal */
    }
  };
  // Referenced so the parked handler above cannot be collected as dead code by
  // a future tidy-up that would also break the guard test.
  void setNotif;
  void notifications;

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
      dialog.alert(t("Couldn't clear", "Imeshindwa kufuta"), t("Nothing was removed. Try again.", "Hakuna kilichoondolewa. Jaribu tena."));
    } finally {
      setBusy(null);
    }
  };

  /**
   * Sign out. The words are the design's: the question, the reassurance that
   * the documents stay on the phone, and the two labels that say what each
   * button does. (§6: the sentence states the situation; it never scolds, and
   * it never promises something the app cannot do.)
   */
  const confirmSignOut = () => {
    haptics.warning();
    dialog.alert(
      t("Do you want to sign out?", "Ungependa kutoka?"),
      t(
        "Your documents and CVs stay safe on this phone.",
        "Hati na CV zako zitabaki salama kwenye simu hii.",
      ),
      [
        { text: t("Stay signed in", "Endelea Kubaki"), style: "cancel" },
        {
          text: t("Sign out of the account", "Toka Kwenye Akaunti"),
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
      ],
    );
  };

  /**
   * Delete account. The consequence is printed ON THE PAGE (ENEO LA HATARI
   * below) exactly as the design prints it; this dialog is the second step —
   * the design's own question — and then it reports the outcome honestly:
   * if the call fails, the account is still there and the next action is to
   * try again or write to support.
   */
  const confirmDelete = () => {
    haptics.warning();
    dialog.alert(
      t("Are you sure you want to delete every record?", "Una uhakika unataka kufuta rekodi zote?"),
      t(
        "This deletes your CVs, cover letters and account data, and it cannot be undone.",
        "Hii inafuta CV zako, barua za maombi na taarifa za akaunti, na haiwezi kurudishwa.",
      ),
      [
        { text: t("Cancel", "Ghairi"), style: "cancel" },
        {
          text: t("Yes, delete everything", "Ndio, Futa Kila Kitu"),
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
                t("The account was not deleted", "Akaunti haijafutwa"),
                t(
                  `Nothing was removed. Try again; if the problem continues, write to ${SUPPORT_EMAIL}.`,
                  `Hakuna kilichoondolewa. Jaribu tena; tatizo likiendelea, andikia ${SUPPORT_EMAIL}.`,
                ),
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
        <ScreenTitle
          trailing={
            <HeaderChip label={isGuest ? t("No account", "Bila akaunti") : t("Personal account", "Akaunti Binafsi")} c={c} />
          }
        >
          {t("Profile", "Wasifu")}
        </ScreenTitle>

        {/* Identity block: the portrait, the name, and the one pill that says
            where these records live. */}
        <View
          style={{
            flexDirection: "column",
            gap: 14,
            backgroundColor: c.bgElevated,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: c.border,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
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
                {user?.name || user?.email?.split("@")[0] || t("Not signed in", "Hujaingia")}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 2 }} numberOfLines={2}>
                {user?.email ||
                  t(
                    "Your CVs are on this phone. Sign in to open them anywhere.",
                    "CV zako ziko kwenye simu hii. Ingia ili kuzifungua mahali popote.",
                  )}
              </Text>
            </View>
          </View>

          <IdentityPill label={t("Saved on this phone", "Imehifadhiwa kwenye simu hii")} c={c} />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(300).delay(70)}>
        {/* ── AKAUNTI ──────────────────────────────────────────────────────
            The design groups the account rows FIRST, and `Toka` belongs here
            with `Wasifu wa kazi` — not three groups down, where a returning
            user on a shared phone had to hunt for it. */}
        <ListGroupLabel>{t("Account", "Akaunti")}</ListGroupLabel>
        <View style={groupBox}>
          <ListRow
            first
            last={!isGuest}
            icon="user"
            iconColor={c.accent}
            label={t("Career profile", "Wasifu wa kazi")}
            sublabel={t(
              "Skills, experience, goals — I use these to write your CV.",
              "Ujuzi, uzoefu, malengo — ninatumia haya kuandika CV yako.",
            )}
            onPress={() => navigation.navigate("CareerProfile")}
            chevron
          />
          {!isGuest ? (
            <ListRow
              last
              icon="log-out"
              label={t("Sign out", "Toka")}
              sublabel={t("Remove access on this device safely", "Ondoa ufikiaji kwenye kifaa hiki kwa usalama")}
              disabled={busy === "signout"}
              onPress={confirmSignOut}
              chevron
            />
          ) : (
            /* A guest has no session to end: the one account action that is
               real for them is the way IN, and it says what it earns. */
            <ListRow
              last
              icon="user-plus"
              iconColor={c.accent}
              label={t("Sign in or create a free account", "Ingia au fungua akaunti bure")}
              sublabel={t("If you already have one, your CVs are waiting for you.", "Kama unayo, CV zako zinakusubiri.")}
              onPress={() => openAuth()}
              chevron
            />
          )}
        </View>

        {/* ── MUONEKANO ──────────────────────────────────────────────────── */}
        <ListGroupLabel>{t("Appearance", "Muonekano")}</ListGroupLabel>
        <View style={groupBox}>
          <ListRow
            first
            icon={dark ? "moon" : "sun"}
            iconColor={c.accent}
            label={t("Dark mode", "Hali ya giza")}
            sublabel={t("A warm espresso that rests your eyes", "Espresso joto ya kulinda macho")}
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
                    // §8: 44 dp. These pills were ~35 (9 + 13.5 pt text + 9),
                    // and the design fills the active one ember — as
                    // `accentFillStrong`, the guide's own emberPressed, so the
                    // 13.5 pt label still clears AA on the fill.
                    style={{
                      flex: 1,
                      minHeight: 44,
                      justifyContent: "center",
                      borderRadius: 999,
                      borderWidth: 1.5,
                      borderColor: active ? "transparent" : c.borderStrong,
                      backgroundColor: active ? c.accentFillStrong : "transparent",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: active ? c.accentText : c.textBody, fontWeight: "700", fontSize: 13.5 }}>
                      {l === "en" ? "English" : "Kiswahili"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── ARIFA ────────────────────────────────────────────────────────
            §7: no bell, no toggle — this release cannot send a remote alert,
            so the row states that and asks for nothing. */}
        <ListGroupLabel>{t("Notifications", "Arifa")}</ListGroupLabel>
        <View style={groupBox}>
          <ListRow
            first
            last
            label={t("Phone notifications", "Arifa za simu")}
            sublabel={t(
              "Not available yet — this release doesn't use remote alerts.",
              "Bado haipatikani — toleo hili halitumii arifa za mbali.",
            )}
            value={t("Not yet", "Bado")}
          />
        </View>

        {/* ── HUDUMA ───────────────────────────────────────────────────────
            The design keeps both service rows in ONE card. The `Mpya` badge
            the design draws on Premium is correctly NOT here (§10 forbids
            badges). */}
        <ListGroupLabel>{t("Services", "Huduma")}</ListGroupLabel>
        <View style={groupBox}>
          <ListRow
            first={!premium}
            last={!premium}
            icon="gift"
            iconColor={c.accent}
            label={t("Invite a friend", "Mwalike rafiki")}
            sublabel={t("It's free — help someone else get hired.", "Ni bure — msaidie mtu mwingine apate ajira.")}
            onPress={() => navigation.navigate("HomeTab", { screen: "Invite" })}
            chevron
          />
          {!premium ? (
            <ListRow
              last
              icon="gem"
              iconColor={c.accent}
              label={t("Sumaiya Premium", "Sumaiya Premium")}
              sublabel={t(
                "Advanced designs and deep courses · Everything essential stays free",
                "Miundo ya hali ya juu na kozi za kina · Kila kitu muhimu kinabaki bure",
              )}
              onPress={() => setShowPremium(true)}
              chevron
            />
          ) : null}
        </View>

        {/* Clear offline data — EXTRA (sanctioned): a real device action the
            design does not model. It sits between the design's own groups so
            ENEO LA HATARI stays last, as the design has it. */}
        <ListGroupLabel>{t("This device", "Kifaa hiki")}</ListGroupLabel>
        <View style={groupBox}>
          <ListRow
            first
            last
            icon="trash-2"
            iconColor={c.warning}
            label={t("Clear offline data", "Futa data iliyohifadhiwa")}
            disabled={busy === "cache"}
            onPress={clearCache}
            chevron
          />
        </View>

        {/* Help & support — not in Stitch, kept because PDPA ss.33/38 access
            and erasure need a door, not a paragraph. */}
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
            icon="mail"
            iconColor={c.accent}
            label={t("Contact support", "Wasiliana nasi")}
            sublabel={SUPPORT_EMAIL}
            onPress={() => navigation.navigate("Support")}
            chevron
          />
          <ListRow
            last
            icon="flag"
            iconColor={c.accent}
            label={t("Report a problem", "Ripoti tatizo")}
            sublabel={t("Send a screenshot and what happened", "Tuma picha ya skrini na kilichotokea")}
            onPress={() => reportSheet.open("problem")}
            chevron
          />
        </View>

        {/* ── ENEO LA HATARI ───────────────────────────────────────────────
            Danger last, tinted and with the consequence printed on the page —
            the design's own treatment, and the one group that must not look
            like the others. A guest has no account to delete, so it is hidden
            rather than offered as a dead end. */}
        {!isGuest ? (
          <>
            <Text
              style={{
                color: c.error,
                fontSize: 11.5,
                fontWeight: "800",
                letterSpacing: 0.8,
                textTransform: "uppercase",
                marginBottom: 8,
                marginTop: 22,
                marginLeft: 4,
              }}
            >
              {t("Danger zone", "Eneo la hatari")}
            </Text>
            <View
              style={{
                backgroundColor: c.errorTint,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: c.error + "33",
                padding: 16,
                gap: 14,
              }}
            >
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Icon name="alert-triangle" size={20} color={c.error} />
                  <Text style={{ color: c.text, fontSize: 17, fontWeight: "800" }}>
                    {t("Delete account", "Futa akaunti")}
                  </Text>
                </View>
                <Text style={{ color: c.textMuted, fontSize: 12.5, lineHeight: 18 }}>
                  {t(
                    "If you delete your account there is no way back. All your CVs and cover letters are deleted completely.",
                    "Ukifuta akaunti yako, hakuna njia ya kurudi. CV zako zote na barua za maombi zitafutwa kabisa.",
                  )}
                </Text>
              </View>
              <Button
                variant="danger"
                label={t("Delete everything", "Futa kila kitu")}
                leftIcon={<Icon name="trash-2" size={20} color={c.accentText} />}
                loading={busy === "delete"}
                onPress={confirmDelete}
              />
            </View>
          </>
        ) : null}

        {/* The footer the design prints: the product line and the installed
            version. No version pill in the header (§7). */}
        <Text style={{ color: c.textMuted, fontSize: 12, textAlign: "center", marginTop: 20, lineHeight: 18 }}>
          {t(`Sumaiya · Your career, guided · v${version}`, `Sumaiya · Kazi yako, inaongozwa · v${version}`)}
          {"\n"}
          {SUPPORT_EMAIL}
        </Text>
      </Animated.View>
      <PremiumSheet visible={showPremium} onClose={() => setShowPremium(false)} feature="general" />
    </Screen>
  );
}
