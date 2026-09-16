import React, { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Constants from "expo-constants";
import { useLang } from "../../lib/i18n";
import { Icon } from "../../components/icon";
import { Button, Screen, ScreenTitle, haptics, useThemeColors } from "../../components/ui";
import { SUPPORT_EMAIL } from "../../lib/app-hosts";
import type { SupportScreenProps } from "../../navigation/types";

export function SupportScreen({ navigation }: SupportScreenProps) {
  const c = useThemeColors();
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const version = Constants.expoConfig?.version ?? "1.0.0";

  const emailUs = () => {
    haptics.light();
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {
      /* no mail client configured — nothing more we can do */
    });
  };

  const reportBug = async () => {
    haptics.medium();
    setBusy(true);
    try {
      const subject = t("Sumaiya bug report", "Ripoti ya hitilafu ya Sumaiya");
      const body = t(
        `Describe what happened and what you expected:\n\n\n\nApp version: ${version}`,
        `Eleza kilichotokea na ulichotarajia:\n\n\n\nToleo la programu: ${version}`,
      );
      await Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    } catch {
      /* non-fatal — user can still read the address below */
    } finally {
      setBusy(false);
    }
  };

  const row = {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.bgElevated,
  };

  return (
    <Screen scroll keyboardAvoiding={false} contentContainerStyle={{ paddingBottom: 48 }}>
      <Pressable
        hitSlop={10}
        onPress={() => navigation.goBack()}
        style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, marginBottom: 16 }}
      >
        <Icon name="arrow-left" size={18} color={c.accent} />
        <Text style={{ color: c.accent, fontWeight: "700" }}>{t("Profile", "Wasifu")}</Text>
      </Pressable>

      <ScreenTitle>{t("Contact support", "Wasiliana nasi")}</ScreenTitle>
      <Text style={{ color: c.textBody, fontSize: 13.5, lineHeight: 20, marginBottom: 20 }}>
        {t(
          "Stuck, found a bug, or have an idea? We read every message — in English or Kiswahili.",
          "Umekwama, umepata hitilafu, au una wazo? Tunasoma kila ujumbe — kwa Kiingereza au Kiswahili.",
        )}
      </Text>

      <Animated.View entering={FadeInDown.duration(260)}>
        <Pressable
          accessibilityRole="button"
          onPress={emailUs}
          android_ripple={{ color: c.border }}
          style={[row, { flexDirection: "row", alignItems: "center", gap: 13, padding: 16 }]}
        >
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.accent + "1f", alignItems: "center", justifyContent: "center" }}>
            <Icon name="mail" size={20} color={c.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 15, fontWeight: "700" }}>{t("Email us", "Tutumie barua pepe")}</Text>
            <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 2 }}>{SUPPORT_EMAIL}</Text>
          </View>
          <Icon name="chevron-right" size={17} color={c.textMuted} />
        </Pressable>
      </Animated.View>

      <View style={{ marginTop: 22, gap: 12 }}>
        <Button
          label={t("Report a bug", "Ripoti hitilafu")}
          sublabel={t(
            "Opens your email app with the details pre-filled",
            "Inafungua programu yako ya barua pepe na maelezo tayari",
          )}
          loading={busy}
          onPress={reportBug}
        />
        <Text style={{ color: c.textMuted, fontSize: 12.5, lineHeight: 19, textAlign: "center" }}>
          {t("Replies usually come within a day.", "Majibu kwa kawaida huja ndani ya siku moja.")}
        </Text>
      </View>
    </Screen>
  );
}
