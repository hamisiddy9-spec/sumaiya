import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { getSecureItem, setSecureItem } from "@sumaiya/utils";
import { Icon } from "./icon";
import { Button, EASE, MOTION, enterDurationMs, exitDurationMs, haptics, useMotionReduced, useThemeColors } from "./ui";
import { FONT } from "./home";
import { useLang } from "../lib/i18n";

/**
 * SCREEN G1 — the Premium sheet ("Kifurushi cha Premium"), rebuilt to the
 * approved mockup, and shown whenever someone taps a locked premium design,
 * a deep guide, or the written verdict.
 *
 * The copy has to be TRUE. Premium is genuinely locked (tier === "premium"),
 * genuinely obtainable TODAY — referrals grant 7 days per friend who builds
 * their first CV — and the paid tier is genuinely NOT open, so nothing on this
 * sheet may imply it can be bought right now.
 *
 * ── NO PRICE IS DRAWN ANYWHERE IN THIS FILE ──────────────────────────────────
 * The mockup shows no figure, and the project carries two conflicting ones (an
 * earlier draft's 4,500 / 1,500 against the sales register's 3,000 / 8,000 /
 * 60,000). Typing either would ship a money claim nobody approved, so the sheet
 * draws the STRUCTURE only: what Premium unlocks, the honest locked state, and
 * the mobile-money methods named as methods — never an amount. The figure is
 * the owner's to set.
 *
 * ── WHERE THE MOCKUP AND THE TRUTH DISAGREE, THIS FILE SIDES WITH THE TRUTH ──
 *   • The mockup's subtitle and three benefit rows sell "all the international
 *     designs", "unlimited job-ad review" and "unlimited CV import from photos".
 *     None of the three is a Premium benefit. The whole international registry
 *     (200+ designs) is already FREE, the employer-screening check ("Ukaguzi wa
 *     CV") is FREE and unmetered, and CV-from-photo import is FREE — premium is
 *     exactly two extra designs and the deep guides (lib/cv-html.ts tiers,
 *     lib/guides.ts tiers, lib/entitlements.ts). The rows were rewritten to what
 *     the tier system actually gates.
 *   • The mockup's payment tiles are tappable method pickers. There is no
 *     payment integration on the native side and no amount to charge, so the
 *     methods ship as information, not as a control that does nothing.
 *   • The mockup's "payment code or invite?" box (input + "Tumia") has no server
 *     path — there is no redeem endpoint anywhere in the app (api-client has
 *     getReferral() and nothing that takes a code). An input whose button cannot
 *     apply anything is worse than no input, so the box is omitted.
 *   • The mockup's emerald ticks and its mono surface colours are mockup
 *     artefacts; the status colours come from the tokens (§1/§6) and every
 *     surface from useThemeColors().
 *
 * The route that works today is the CTA: it earns Premium by inviting friends.
 * The waitlist flag is stored locally and is NOT entitlement — see the warning
 * in src/lib/entitlements.ts.
 */
type Feature = "templates" | "courses" | "verdict" | "general";

interface Pair {
  en: string;
  sw: string;
}

/** The mockup's one-line summary, made true per entry point. */
const SUBTITLE: Record<Feature, Pair> = {
  templates: {
    en: "Unlock the Executive and Compact designs.",
    sw: "Fungua miundo ya Kiongozi na Fupi.",
  },
  courses: {
    en: "Unlock the three deep guides.",
    sw: "Fungua miongozo mitatu ya kina.",
  },
  verdict: {
    en: "Unlock the written review of your CV.",
    sw: "Fungua mapitio yaliyoandikwa ya CV yako.",
  },
  general: {
    en: "The extra CV designs, the deep guides and the written review.",
    sw: "Miundo ya ziada ya CV, miongozo ya kina na mapitio yaliyoandikwa.",
  },
};

/**
 * What Premium actually gates, per entry point. Each row is a fact the tier
 * system enforces, not the mockup's claim:
 *
 *   templates  — `executive` (Kiongozi) and `compact` (Fupi) are the only
 *                `tier: "premium"` entries in the registry; every other design
 *                is free.
 *   courses    — three guides carry `tier: "premium"` (pay, changing fields,
 *                LinkedIn); the rest are free.
 *   verdict    — the written review is premium; the score and the checks above
 *                it are computed on the device and stay free.
 */
const UNLOCKS: Record<Feature, Pair[]> = {
  templates: [
    { en: "The Executive and Compact designs", sw: "Miundo ya Kiongozi na Fupi" },
    { en: "Opened in the same editor as the free designs", sw: "Inafunguliwa kwenye kihariri kile kile cha miundo ya bure" },
    { en: "Every other design stays free", sw: "Miundo mingine yote inabaki bure" },
  ],
  courses: [
    { en: "The three deep guides: pay, changing fields, LinkedIn", sw: "Miongozo mitatu ya kina: mshahara, kubadili fani, LinkedIn" },
    { en: "Step by step, written for East Africa", sw: "Hatua kwa hatua, kwa Afrika Mashariki" },
    { en: "The short guides stay free", sw: "Miongozo mifupi inabaki bure" },
  ],
  verdict: [
    { en: "A written review of your CV, in plain language", sw: "Mapitio yaliyoandikwa ya CV yako, kwa lugha rahisi" },
    { en: "Your three highest-impact fixes, ranked", sw: "Marekebisho matatu yenye athari kubwa, yaliyopangwa" },
    { en: "The score and the checks stay free", sw: "Alama inabaki bure, na ukaguzi wa CV pia" },
  ],
  general: [
    { en: "The Executive and Compact designs", sw: "Miundo ya Kiongozi na Fupi" },
    { en: "Three deep guides: pay, changing fields, LinkedIn", sw: "Miongozo mitatu ya kina: mshahara, kubadili fani, LinkedIn" },
    { en: "A written review of your CV", sw: "Mapitio yaliyoandikwa ya CV yako" },
  ],
};

/**
 * The mobile-money methods Premium will be payable by — brand names, identical
 * in both languages, so they are constants and deliberately do NOT go through
 * t() (the i18n guard rejects an identical pair that is not a product name in
 * its shared list). No amount is ever drawn beside them.
 */
const PAYMENT_METHODS = ["M-Pesa", "Airtel Money", "Tigo Pesa", "Halopesa"] as const;

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
  const { t } = useLang();
  const navigation = useNavigation<{ navigate: (a: string, b?: object) => void }>();
  const reduceMotion = useMotionReduced();
  const progress = useSharedValue(0);
  const [mounted, setMounted] = useState(visible);
  const [onList, setOnList] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      getSecureItem(WAITLIST_KEY).then((v) => setOnList(v === "true")).catch(() => {});
      progress.value = withTiming(1, {
        duration: enterDurationMs(reduceMotion, MOTION.dur.slow),
        easing: EASE.out,
      });
    } else if (mounted) {
      progress.value = withTiming(
        0,
        { duration: exitDurationMs(reduceMotion, MOTION.dur.fast), easing: EASE.in },
        (done) => {
          if (done) runOnJS(setMounted)(false);
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheet = useAnimatedStyle(() => ({
    opacity: 0.4 + progress.value * 0.6,
    transform: [{ translateY: (1 - progress.value) * 360 }],
  }));

  if (!mounted) return null;
  const unlocks = UNLOCKS[feature];
  const subtitle = SUBTITLE[feature];

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
          accessibilityViewIsModal
          style={[
            sheet,
            {
              // Explicit width + absolute-pin: a reanimated Animated.View in a
              // Modal collapses its flex children to zero width on Fabric.
              position: "absolute",
              bottom: 0,
              left: 0,
              width,
              maxHeight: Math.min(height - insets.top - 24, 813),
              backgroundColor: c.bg,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingTop: 10,
              paddingBottom: insets.bottom + 16,
              paddingLeft: 20 + insets.left,
              paddingRight: 20 + insets.right,
              borderTopWidth: 1,
              borderColor: c.border,
              overflow: "hidden",
            },
          ]}
        >
          <View
            style={{
              alignSelf: "center",
              width: 36,
              height: 5,
              borderRadius: 2.5,
              backgroundColor: c.borderStrong,
              marginBottom: 14,
            }}
          />

          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={{ gap: 16, paddingBottom: 4 }}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Header: badge · headline · one-line summary ────────────── */}
            <View style={{ alignItems: "center", gap: 4 }}>
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 999,
                  backgroundColor: c.accent,
                }}
              >
                <Text
                  style={{
                    color: c.accentText,
                    fontSize: 10,
                    fontFamily: FONT.mono,
                    letterSpacing: 1.6,
                    textTransform: "uppercase",
                  }}
                >
                  {t("Sumaiya Premium", "Sumaiya Premium")}
                </Text>
              </View>
              <Text
                style={{
                  color: c.text,
                  fontSize: 24,
                  lineHeight: 29,
                  fontFamily: FONT.display,
                  textAlign: "center",
                  marginTop: 4,
                }}
              >
                {t("Improve your profile", "Boresha Wasifu Wako")}
              </Text>
              <Text
                style={{
                  color: c.textBody,
                  fontSize: 12,
                  lineHeight: 18,
                  fontFamily: FONT.regular,
                  textAlign: "center",
                  maxWidth: 260,
                }}
              >
                {t(subtitle.en, subtitle.sw)}
              </Text>
            </View>

            {/* ── What Premium unlocks (honest per entry point) ──────────── */}
            <View style={{ gap: 8 }}>
              {unlocks.map((u) => (
                <View
                  key={u.en}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    padding: 10,
                    borderRadius: 12,
                    backgroundColor: c.bgElevated,
                    borderWidth: 1,
                    borderColor: c.border,
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: c.successTint,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name="check" size={13} color={c.success} />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      color: c.textBody,
                      fontSize: 12.5,
                      lineHeight: 18,
                      fontFamily: FONT.regular,
                    }}
                  >
                    {t(u.en, u.sw)}
                  </Text>
                </View>
              ))}
            </View>

            {/* ── The route that works today ─────────────────────────────── */}
            {earn ? (
              <Button
                label={t("Earn Premium by inviting friends", "Pata Premium kwa kualika marafiki")}
                onPress={() => {
                  onClose();
                  earn();
                }}
              />
            ) : null}

            {/* ── Paying: the methods, named but not open ─────────────────── */}
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  color: c.textMuted,
                  fontSize: 11,
                  fontFamily: FONT.mono,
                  letterSpacing: 1.1,
                  textTransform: "uppercase",
                }}
              >
                {t("Pay by mobile money", "Lipa kwa Simu ya Mkononi")}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 17, fontFamily: FONT.regular }}>
                {t("Paying isn't open yet.", "Malipo bado hayajafunguliwa.")}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {PAYMENT_METHODS.map((m) => (
                  <View
                    key={m}
                    accessibilityRole="text"
                    style={{
                      flexBasis: "46%",
                      flexGrow: 1,
                      minHeight: 44,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 12,
                      backgroundColor: c.bgElevated,
                      borderWidth: 1,
                      borderColor: c.border,
                    }}
                  >
                    <Text style={{ color: c.text, fontSize: 13, fontFamily: FONT.semibold }}>{m}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── The waitlist: the honest state for a tier not yet on sale ── */}
            {onList ? (
              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                  alignItems: "center",
                  minHeight: 44,
                  backgroundColor: c.successTint,
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <Icon name="check-circle" size={16} color={c.success} />
                <Text style={{ flex: 1, color: c.textBody, fontSize: 12.5, lineHeight: 17, fontFamily: FONT.regular }}>
                  {t("We'll tell you when paying opens.", "Tutakujulisha malipo yanapofunguliwa.")}
                </Text>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={join}
                style={{ minHeight: 44, justifyContent: "center", alignSelf: "center", paddingHorizontal: 10 }}
              >
                <Text style={{ color: c.textMuted, fontSize: 12.5, fontFamily: FONT.bold }}>
                  {t("Notify me when paying opens", "Nijulishe malipo yanapofunguliwa")}
                </Text>
              </Pressable>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={{ minHeight: 44, justifyContent: "center", alignSelf: "center", paddingHorizontal: 12 }}
            >
              <Text style={{ color: c.textMuted, fontSize: 13.5, fontFamily: FONT.bold }}>
                {t("Maybe later", "Baadaye")}
              </Text>
            </Pressable>
          </ScrollView>

          {/* ── Footer: the trust line, pinned as the mockup pins it ─────── */}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: c.border,
              paddingTop: 12,
              marginTop: 10,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: c.textMuted,
                fontSize: 11,
                fontFamily: FONT.mono,
                textAlign: "center",
                lineHeight: 16,
              }}
            >
              {t(
                "No hidden charges • No automatic deductions",
                "Bila malipo ya siri • Hakuna makato ya kiotomatiki",
              )}
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
