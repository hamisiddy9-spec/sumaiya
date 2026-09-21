import React, { useEffect, useState } from "react";
import { Modal, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { getSecureItem, setSecureItem } from "@sumaiya/utils";
import { Icon } from "./icon";
import { Button, haptics, useThemeColors } from "./ui";
import { useLang } from "../lib/i18n";

/**
 * Shown when someone taps a premium template / course.
 *
 * The copy has to be TRUE, and it changed the moment the gate became real.
 * Premium is no longer a promise: the premium designs are genuinely locked
 * (tier === "premium"), and Premium is genuinely obtainable TODAY — referrals
 * grant 7 days per friend who builds their first CV.
 *
 * Two things this used to get wrong, both now fixed:
 *   1. It advertised "the Executive and Compact layouts" as the premium
 *      benefit. Neither is premium — `executive-letter` and `compact-letter`
 *      are free LETTER templates, unrelated to the gated set. Naming them sold
 *      a tier with two designs that were already free.
 *   2. It framed waiting as the only route ("notify me when it's ready"),
 *      hiding the one route that works from the one screen a user reaches by
 *      asking for the thing.
 *
 * The waitlist flag is stored locally and is NOT entitlement — see the warning
 * in src/lib/entitlements.ts.
 */
type Feature = "templates" | "courses" | "verdict" | "general";

const COPY: Record<Feature, { en: string[]; sw: string[] }> = {
  templates: {
    en: [
      "The 7 flagship designs — colour sidebars, photo rings, timelines",
      "Earned by inviting friends — 7 days each time one builds a CV",
      "Everything else stays free",
    ],
    sw: [
      "Miundo 7 bora — sidebars za rangi, pete za picha, mistari ya muda",
      "Inapatikana kwa kualika marafiki — siku 7 kila mmoja akijenga CV",
      "Kila kitu kingine kinabaki bure",
    ],
  },
  courses: {
    en: ["Deep courses: interview mastery, salary negotiation", "Step-by-step, built for East Africa", "The short guides stay free"],
    sw: ["Kozi za kina: umahiri wa usaili, majadiliano ya mshahara", "Hatua kwa hatua, kwa Afrika Mashariki", "Miongozo mifupi inabaki bure"],
  },
  verdict: {
    en: ["A written verdict on your CV, in plain language", "Your 3 highest-impact fixes, ranked", "The deterministic ATS score stays free"],
    sw: ["Uamuzi ulioandikwa kuhusu CV yako, kwa lugha rahisi", "Marekebisho matatu yenye athari kubwa, yaliyopangwa", "Alama ya CV yako ya uhakika inabaki bure"],
  },
  general: {
    en: [
      "The 7 flagship designs — colour sidebars, photo rings, timelines",
      "Deep courses: interview mastery, salary negotiation",
      "Everything essential stays free",
    ],
    sw: [
      "Miundo 7 bora — sidebars za rangi, pete za picha, mistari ya muda",
      "Kozi za kina: umahiri wa usaili, majadiliano ya mshahara",
      "Kila kitu muhimu kinabaki bure",
    ],
  },
};

const WAITLIST_KEY = "sumaiya_premium_waitlist";

export function PremiumSheet({
  visible,
  onClose,
  feature,
  onEarn,
}: {
  visible: boolean;
  onClose: () => void;
  feature: Feature;
  /** How to reach the invite loop. Defaults to the Home tab's Invite screen.
   *  Pass `null` to omit the CTA entirely — for a surface outside the tab
   *  navigator (e.g. first-run) where "Invite" is not reachable, showing a
   *  button that cannot navigate would be worse than showing none. */
  onEarn?: (() => void) | null;
}) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { t, lang } = useLang();
  const navigation = useNavigation<{ navigate: (a: string, b?: object) => void }>();
  const progress = useSharedValue(0);
  const [mounted, setMounted] = useState(visible);
  const [onList, setOnList] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      getSecureItem(WAITLIST_KEY).then((v) => setOnList(v === "true")).catch(() => {});
      progress.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: 160, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheet = useAnimatedStyle(() => ({
    opacity: 0.4 + progress.value * 0.6,
    transform: [{ translateY: (1 - progress.value) * 360 }],
  }));

  if (!mounted) return null;
  const points = COPY[feature][lang === "sw" ? "sw" : "en"];

  // The route that works today. Same nested-navigation call profile-screen uses.
  const earn =
    onEarn === null
      ? null
      : onEarn ?? (() => navigation.navigate("HomeTab", { screen: "Invite" }));

  const join = async () => {
    haptics.success();
    setOnList(true);
    await setSecureItem(WAITLIST_KEY, "true").catch(() => {});
  };

  return (
    <Modal transparent visible={mounted} onRequestClose={onClose} animationType="none" statusBarTranslucent>
      <View style={{ width, height }}>
        <Pressable
          style={{ flex: 1 }}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t("Close", "Funga")}
        >
          <Animated.View style={[backdrop, { flex: 1, backgroundColor: c.overlay }]} />
        </Pressable>
        <Animated.View
          style={[
            sheet,
            {
              // Explicit width + absolute-pin: a reanimated Animated.View in a
              // Modal collapses its flex children to zero width on Fabric.
              position: "absolute",
              bottom: 0,
              left: 0,
              width,
              backgroundColor: c.bgElevated,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 10,
              paddingBottom: insets.bottom + 18,
              paddingHorizontal: 20,
              borderTopWidth: 1,
              borderColor: c.border,
            },
          ]}
        >
          <View style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: 16 }} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.accent + "1f", alignItems: "center", justifyContent: "center" }}>
              <Icon name="gem" size={19} color={c.accent} />
            </View>
            <Text style={{ color: c.text, fontSize: 19, fontWeight: "800" }}>{t("Sumaiya Premium", "Sumaiya Premium")}</Text>
          </View>

          <View style={{ gap: 9, marginBottom: 14 }}>
            {points.map((p) => (
              <View key={p} style={{ flexDirection: "row", gap: 9, alignItems: "flex-start" }}>
                <Icon name="check" size={15} color={c.success} />
                <Text style={{ flex: 1, color: c.textBody, fontSize: 13.5, lineHeight: 20 }}>{p}</Text>
              </View>
            ))}
          </View>

          {/* How to actually get it. Paying is not open — saying only that would
              leave the user with no move when there is one. */}
          <Text style={{ color: c.textMuted, fontSize: 12.5, lineHeight: 18, marginBottom: 14 }}>
            {t(
              "Paying isn't open yet — but you don't have to wait. Premium is earned by inviting friends: 7 days each time one of them builds their first CV.",
              "Malipo bado hayajafunguliwa — lakini huna haja ya kusubiri. Premium inapatikana kwa kualika marafiki: siku 7 kila mmoja akijenga CV yake ya kwanza.",
            )}
          </Text>

          {earn && (
            <Button
              label={t("Earn Premium by inviting friends", "Pata Premium kwa kualika marafiki")}
              onPress={() => {
                haptics.light();
                onClose();
                earn();
              }}
            />
          )}

          <View style={{ marginTop: earn ? 10 : 0 }}>
            {onList ? (
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: c.success + "14", borderRadius: 12, padding: 13 }}>
                <Icon name="check-circle" size={16} color={c.success} />
                <Text style={{ flex: 1, color: c.textBody, fontSize: 13 }}>
                  {t("We'll tell you when paying opens.", "Tutakujulisha malipo yanapofunguliwa.")}
                </Text>
              </View>
            ) : (
              <Pressable accessibilityRole="button" onPress={join} style={{ alignSelf: "center", paddingVertical: 8 }}>
                <Text style={{ color: c.textMuted, fontSize: 12.5, fontWeight: "700" }}>
                  {t("Notify me when paying opens", "Nijulishe malipo yanapofunguliwa")}
                </Text>
              </Pressable>
            )}
          </View>

          <Pressable accessibilityRole="button" onPress={onClose} style={{ alignSelf: "center", paddingVertical: 10 }}>
            <Text style={{ color: c.textMuted, fontSize: 13.5, fontWeight: "700" }}>{t("Maybe later", "Baadaye")}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
