import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { getGuide } from "../lib/guides";
import { useLang } from "../lib/i18n";
import { Button, Screen, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";
import { FONT } from "../components/home";
import { useEntitlements } from "../lib/entitlements";
import { PremiumSheet } from "../components/premium-sheet";
import type { GuideScreenProps } from "../navigation/types";

export function GuideScreen({ route, navigation }: GuideScreenProps) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const { premium } = useEntitlements();
  const [showPremium, setShowPremium] = useState(false);
  const guide = getGuide(route.params?.id);
  const walled = !!guide && guide.tier === "premium" && !premium;
  const visibleSections = walled ? (guide?.sections.slice(0, 1) ?? []) : (guide?.sections ?? []);

  if (!guide) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10 }}>
          <Icon name="book-open" size={30} color={c.textMuted} />
          <Text style={{ color: c.textMuted }}>{t("Guide not found.", "Mwongozo haukupatikana.")}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll keyboardAvoiding={false} contentContainerStyle={{ paddingBottom: 48 }}>
      <Pressable
        hitSlop={10}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel={t("Back", "Rudi")}
        style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, marginBottom: 16 }}
      >
        <Icon name="arrow-left" size={18} color={c.accent} />
        <Text style={{ color: c.accent, fontWeight: "700" }}>{t("Back", "Rudi")}</Text>
      </Pressable>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Icon name="clock" size={13} color={c.textMuted} />
        {/* The design gives a numeric fact its own voice — mono, like every
            other number in the app (scores, timers, codes). */}
        <Text style={{ color: c.textMuted, fontSize: 12.5, fontFamily: FONT.mono }}>
          {guide.minutes} {t("min read", "dakika")}
        </Text>
      </View>

      <Text style={{ color: c.text, fontSize: 25, fontWeight: "800", letterSpacing: -0.4, lineHeight: 31 }}>
        {guide.title[lang]}
      </Text>
      <Text style={{ color: c.textBody, fontSize: 14.5, lineHeight: 21, marginTop: 8, marginBottom: 24 }}>
        {guide.summary[lang]}
      </Text>

      {visibleSections.map((s, i) => (
        <Animated.View key={i} entering={FadeInDown.duration(280).delay(Math.min(i, 5) * 60)} style={{ marginBottom: 22 }}>
          <Text style={{ color: c.text, fontSize: 16.5, fontWeight: "800", marginBottom: 8 }}>
            {s.heading[lang]}
          </Text>
          <Text style={{ color: c.textBody, fontSize: 14.5, lineHeight: 23 }}>{s.body[lang]}</Text>
        </Animated.View>
      ))}

      {walled ? (
        <View style={{ borderTopWidth: 1, borderTopColor: c.border, paddingTop: 22, gap: 12 }}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: "800" }}>
            {t("The rest of this guide is Premium", "Sehemu iliyobaki ni Premium")}
          </Text>
          <Text style={{ color: c.textBody, fontSize: 13.5, lineHeight: 20 }}>
            {t(
              "The short guides stay free. The deep playbooks — negotiation, changing fields, LinkedIn — come with Premium.",
              "Miongozo mifupi inabaki bure. Miongozo ya kina — majadiliano, kubadili fani, LinkedIn — inakuja na Premium.",
            )}
          </Text>
          <Button label={t("See Premium", "Ona Premium")} onPress={() => setShowPremium(true)} />
        </View>
      ) : null}

      {/* The design's closing prompt, and it does the real thing: it opens the
          chat with this guide already named, so the user does not have to
          re-explain what they were reading. */}
      <View style={{ borderTopWidth: 1, borderTopColor: c.border, paddingTop: 18, marginTop: 4 }}>
        <Button
          label={t("Ask Sumaiya about this guide", "Uliza Sumaiya kuhusu mwongozo huu")}
          variant="secondary"
          onPress={() => {
            haptics.selection();
            navigation.navigate("SumaiyaTab", {
              seed: t(
                `I just read the guide "${guide.title.en}". Help me apply it to my CV and my applications.`,
                `Nimesoma mwongozo "${guide.title.sw}". Nisaidie kuufanyia kazi kwenye CV yangu na kwenye maombi yangu.`,
              ),
            });
          }}
        />
      </View>

      <PremiumSheet visible={showPremium} onClose={() => setShowPremium(false)} feature="courses" />
    </Screen>
  );
}
