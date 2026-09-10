import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { getGuide } from "../lib/guides";
import { useLang } from "../lib/i18n";
import { Screen, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";

export function GuideScreen({ route, navigation }: any) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const guide = getGuide(route?.params?.id);

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
        style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, marginBottom: 16 }}
      >
        <Icon name="arrow-left" size={18} color={c.accent} />
        <Text style={{ color: c.accent, fontWeight: "700" }}>{t("Guides", "Miongozo")}</Text>
      </Pressable>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Icon name="clock" size={13} color={c.textMuted} />
        <Text style={{ color: c.textMuted, fontSize: 12.5, fontWeight: "600" }}>
          {guide.minutes} {t("min read", "dakika")}
        </Text>
      </View>

      <Text style={{ color: c.text, fontSize: 25, fontWeight: "800", letterSpacing: -0.4, lineHeight: 31 }}>
        {guide.title[lang]}
      </Text>
      <Text style={{ color: c.textBody, fontSize: 14.5, lineHeight: 21, marginTop: 8, marginBottom: 24 }}>
        {guide.summary[lang]}
      </Text>

      {guide.sections.map((s, i) => (
        <Animated.View key={i} entering={FadeInDown.duration(280).delay(Math.min(i, 5) * 60)} style={{ marginBottom: 22 }}>
          <Text style={{ color: c.text, fontSize: 16.5, fontWeight: "800", marginBottom: 8 }}>
            {s.heading[lang]}
          </Text>
          <Text style={{ color: c.textBody, fontSize: 14.5, lineHeight: 23 }}>{s.body[lang]}</Text>
        </Animated.View>
      ))}
    </Screen>
  );
}
