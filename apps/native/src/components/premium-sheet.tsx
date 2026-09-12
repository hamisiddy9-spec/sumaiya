import React, { useEffect, useState } from "react";
import { Modal, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { getSecureItem, setSecureItem } from "@sumaiya/utils";
import { Icon } from "./icon";
import { Button, haptics, useThemeColors } from "./ui";
import { useLang } from "../lib/i18n";

/**
 * Shown when someone taps a premium template / course. Billing isn't wired
 * yet, so this explains what premium is and lets them register interest — the
 * flag is stored locally and surfaces in the profile ("You're on the list").
 * When billing lands, this sheet gets the real CTA.
 */
type Feature = "templates" | "courses" | "verdict" | "general";

const COPY: Record<Feature, { en: string[]; sw: string[] }> = {
  templates: {
    en: ["The Executive and Compact layouts", "More coming every month", "Everything else stays free"],
    sw: ["Miundo ya Executive na Compact", "Mingine inaongezwa kila mwezi", "Kila kitu kingine kinabaki bure"],
  },
  courses: {
    en: ["Deep courses: interview mastery, salary negotiation", "Step-by-step, built for East Africa", "The short guides stay free"],
    sw: ["Kozi za kina: umahiri wa usaili, majadiliano ya mshahara", "Hatua kwa hatua, kwa Afrika Mashariki", "Miongozo mifupi inabaki bure"],
  },
  verdict: {
    en: ["A written verdict on your CV, in plain language", "Your 3 highest-impact fixes, ranked", "The deterministic ATS score stays free"],
    sw: ["Uamuzi ulioandikwa kuhusu CV yako, kwa lugha rahisi", "Marekebisho matatu yenye athari kubwa, yaliyopangwa", "Alama ya ATS ya uhakika inabaki bure"],
  },
  general: {
    en: ["The Executive and Compact templates", "Deep courses: interview mastery, salary negotiation", "Everything essential stays free"],
    sw: ["Miundo ya Executive na Compact", "Kozi za kina: umahiri wa usaili, majadiliano ya mshahara", "Kila kitu muhimu kinabaki bure"],
  },
};

const WAITLIST_KEY = "sumaiya_premium_waitlist";

export function PremiumSheet({
  visible,
  onClose,
  feature,
}: {
  visible: boolean;
  onClose: () => void;
  feature: Feature;
}) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { t, lang } = useLang();
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

  const join = async () => {
    haptics.success();
    setOnList(true);
    await setSecureItem(WAITLIST_KEY, "true").catch(() => {});
  };

  return (
    <Modal transparent visible={mounted} onRequestClose={onClose} animationType="none" statusBarTranslucent>
      <View style={{ width, height }}>
        <Pressable style={{ flex: 1 }} onPress={onClose}>
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

          <View style={{ gap: 9, marginBottom: 18 }}>
            {points.map((p) => (
              <View key={p} style={{ flexDirection: "row", gap: 9, alignItems: "flex-start" }}>
                <Icon name="check" size={15} color={c.success} />
                <Text style={{ flex: 1, color: c.textBody, fontSize: 13.5, lineHeight: 20 }}>{p}</Text>
              </View>
            ))}
          </View>

          {onList ? (
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: c.success + "14", borderRadius: 12, padding: 13, marginBottom: 6 }}>
              <Icon name="check-circle" size={16} color={c.success} />
              <Text style={{ flex: 1, color: c.textBody, fontSize: 13 }}>
                {t("You're on the list — we'll tell you when it opens.", "Uko kwenye orodha — tutakujulisha itakapofunguliwa.")}
              </Text>
            </View>
          ) : (
            <Button label={t("Notify me when it's ready", "Nijulishe itakapokuwa tayari")} onPress={join} />
          )}
          <Pressable onPress={onClose} style={{ alignSelf: "center", paddingVertical: 10 }}>
            <Text style={{ color: c.textMuted, fontSize: 13.5, fontWeight: "700" }}>{t("Maybe later", "Baadaye")}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
