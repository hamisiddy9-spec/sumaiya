import React from "react";
import { Linking, Platform, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Constants from "expo-constants";
import * as Clipboard from "expo-clipboard";
import { useLang } from "../../lib/i18n";
import { Icon } from "../../components/icon";
import { FONT } from "../../components/home";
import { Button, Card, Screen, ScreenTitle, haptics, toast, useThemeColors } from "../../components/ui";
import { SUPPORT_EMAIL } from "../../lib/app-hosts";
import { APP_VERSION } from "../../lib/app-version";
import { deviceLabel } from "../../lib/telemetry";
import { getLogEntries } from "../../lib/log-buffer";
import { reportSheet } from "../../components/report-sheet";
import type { SupportScreenProps } from "../../navigation/types";

/**
 * Support — F5.
 *
 * WHAT THE DESIGN DRAWS AND WHAT IS ACTUALLY BEHIND IT. The fragment leads with
 * a big WhatsApp button. There is no support WhatsApp number anywhere in this
 * app (`lib/app-hosts.ts` carries `SUPPORT_EMAIL` and nothing else), so building
 * that button would mean either a dead control that looks like the fastest way
 * to get help, or a number invented here and printed as our own. The real
 * channels this app HAS are used instead: the in-app report sheet, which posts
 * to `/api/app/report` and lands in `app_report`, and email.
 *
 * The design's reply-time footer says "under 15 minutes". That is a promise
 * about a human being awake and watching, and nothing in this product measures
 * or guarantees it, so the copy says what the app can stand behind.
 *
 * The diagnostics block is real and every line is read at render time: the
 * version and build, the OS, the device, and how many log entries the ring
 * buffer is holding — the same buffer the report sheet ships with a report.
 * `Nakili Zote` copies exactly that, so a user can paste it into their own email
 * without us asking them to read a screen aloud.
 */
export function SupportScreen({ navigation }: SupportScreenProps) {
  const c = useThemeColors();
  const { t } = useLang();

  const version = APP_VERSION;
  const build = String(Constants.expoConfig?.android?.versionCode ?? Constants.expoConfig?.ios?.buildNumber ?? "");
  const logCount = getLogEntries().length;
  const device = deviceLabel();

  const emailUs = () => {
    haptics.light();
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {
      /* no mail client configured — the report sheet needs no client at all */
    });
  };

  const diagnostics = [
    `${t("App", "Programu")}: Sumaiya ${version}${build ? ` (Build ${build})` : ""}`,
    `OS: ${Platform.OS} ${Platform.Version}`,
    device ? `${t("Device", "Kifaa")}: ${device}` : null,
    `${t("Log entries on hand", "Kumbukumbu zilizopo")}: ${logCount}`,
  ]
    .filter(Boolean)
    .join("\n");

  const copyDiagnostics = async () => {
    haptics.selection();
    try {
      await Clipboard.setStringAsync(diagnostics);
      toast.show(t("Diagnostics copied", "Taarifa zimenakiliwa"));
    } catch {
      haptics.error();
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
        accessibilityRole="button"
        accessibilityLabel={t("Back", "Rudi")}
        style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, marginBottom: 16 }}
      >
        <Icon name="arrow-left" size={18} color={c.accent} />
        <Text style={{ color: c.accent, fontWeight: "700" }}>{t("Profile", "Wasifu")}</Text>
      </Pressable>

      <ScreenTitle>{t("Help and contact", "Msaada na Mawasiliano")}</ScreenTitle>
      <Text style={{ color: c.textBody, fontSize: 13.5, lineHeight: 20, marginBottom: 20 }}>
        {t(
          "Need help quickly, or run into a problem? Tell us from inside the app — it arrives with the technical details already attached.",
          "Unahitaji msaada wa haraka, au umekutana na changamoto? Tuambie hapa ndani ya programu — inafika na maelezo ya kiufundi tayari.",
        )}
      </Text>

      {/* The real in-app path: posts to /api/app/report and needs no mail
          client, no account and no WhatsApp number. */}
      <Animated.View entering={FadeInDown.duration(260)} style={{ gap: 10 }}>
        <Button
          label={t("Report a problem", "Wasilisha tatizo")}
          sublabel={t("Sends from the app, with the logs attached", "Inatumwa kutoka hapa, pamoja na kumbukumbu")}
          onPress={() => { haptics.medium(); reportSheet.open("problem"); }}
        />
        <Button
          label={t("Send an idea", "Tuma maoni au wazo")}
          variant="secondary"
          onPress={() => { haptics.selection(); reportSheet.open("idea"); }}
        />
      </Animated.View>

      <Pressable
        accessibilityRole="button"
        onPress={emailUs}
        android_ripple={{ color: c.border }}
        style={[row, { flexDirection: "row", alignItems: "center", gap: 13, padding: 16, marginTop: 18 }]}
      >
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.accentTint, alignItems: "center", justifyContent: "center" }}>
          <Icon name="mail" size={20} color={c.accent} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: c.text, fontSize: 15, fontWeight: "700" }}>{t("Email us", "Tutumie barua pepe")}</Text>
          <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 2 }} numberOfLines={1}>{SUPPORT_EMAIL}</Text>
        </View>
        <Icon name="chevron-right" size={17} color={c.textMuted} />
      </Pressable>

      {/* Diagnostics — every value read at render, nothing typed in. */}
      <Card style={{ marginTop: 22, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: c.textMuted, fontSize: 11, fontFamily: FONT.mono, letterSpacing: 0.5, textTransform: "uppercase" }}>
            {t("Device details", "Taarifa za Kifaa")}
          </Text>
          <Pressable onPress={() => void copyDiagnostics()} accessibilityRole="button" hitSlop={8}>
            <Text style={{ color: c.accent, fontSize: 11.5, fontWeight: "700" }}>{t("Copy all", "Nakili zote")}</Text>
          </Pressable>
        </View>
        {[
          { label: t("App", "Programu"), value: `Sumaiya ${version}${build ? ` (Build ${build})` : ""}` },
          { label: "OS", value: `${Platform.OS} ${Platform.Version}` },
          ...(device ? [{ label: t("Device", "Kifaa"), value: device }] : []),
          { label: t("Log entries", "Kumbukumbu"), value: String(logCount) },
        ].map((r) => (
          <View key={r.label} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
            <Text style={{ color: c.textMuted, fontSize: 11.5, minWidth: 92 }}>{r.label}</Text>
            <Text style={{ flex: 1, color: c.text, fontSize: 12, fontFamily: FONT.mono }}>{r.value}</Text>
          </View>
        ))}
      </Card>

      <Text style={{ color: c.textMuted, fontSize: 12.5, lineHeight: 19, textAlign: "center", marginTop: 18 }}>
        {t(
          "We read every message, in English or Kiswahili.",
          "Tunasoma kila ujumbe, kwa Kiingereza au Kiswahili.",
        )}
      </Text>
    </Screen>
  );
}
