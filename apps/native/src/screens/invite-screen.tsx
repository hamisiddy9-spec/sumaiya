import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Share, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { apiClient } from "../lib/api-client";
import { useLang } from "../lib/i18n";
import { Screen, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";
import type { InviteScreenProps } from "../navigation/types";

export function InviteScreen({ navigation }: InviteScreenProps) {
  const c = useThemeColors();
  const { t } = useLang();
  const [data, setData] = useState<{ code: string; url: string; joined: number; activated: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiClient
      .getReferral()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const inviteText = (url: string) =>
    t(
      `I'm using Sumaiya to build my CV and find work — it's free. Try it: ${url}`,
      `Natumia Sumaiya kutengeneza CV yangu na kutafuta ajira — ni bure. Ijaribu: ${url}`,
    );

  const share = async () => {
    if (!data) return;
    haptics.light();
    try {
      const res = await Share.share({ message: inviteText(data.url) });
      if (res.action === Share.sharedAction) apiClient.referralShared("link");
    } catch {
      /* dismissed */
    }
  };

  const copy = async () => {
    if (!data) return;
    haptics.selection();
    await Clipboard.setStringAsync(data.url);
    setCopied(true);
    apiClient.referralShared("copy");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Screen scroll keyboardAvoiding={false}>
      <Pressable
        hitSlop={10}
        onPress={() => navigation.goBack()}
        style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, marginBottom: 18 }}
      >
        <Icon name="arrow-left" size={18} color={c.accent} />
        <Text style={{ color: c.accent, fontWeight: "700" }}>{t("Back", "Rudi")}</Text>
      </Pressable>

      <Animated.View entering={FadeInDown.duration(300)} style={{ alignItems: "center", gap: 6, marginBottom: 26 }}>
        <View style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: c.accent + "18", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
          <Icon name="gift" size={26} color={c.accent} />
        </View>
        <Text style={{ color: c.text, fontSize: 24, fontWeight: "800", textAlign: "center", letterSpacing: -0.4 }}>
          {t("Bring a friend", "Mlete rafiki")}
        </Text>
        <Text style={{ color: c.textBody, fontSize: 14.5, textAlign: "center", lineHeight: 21, maxWidth: 300 }}>
          {t(
            "Sumaiya is free. Share it with someone job-hunting — the more people using it, the better it gets for everyone.",
            "Sumaiya ni bure. Mshirikishe mtu anayetafuta ajira — watu wengi wanaotumia, ndivyo inavyokuwa bora kwa wote.",
          )}
        </Text>
      </Animated.View>

      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginTop: 20 }} />
      ) : !data ? (
        <Text style={{ color: c.textMuted, textAlign: "center" }}>
          {t("Sign in to get your invite link.", "Ingia ili upate kiungo chako cha mwaliko.")}
        </Text>
      ) : (
        <Animated.View entering={FadeIn.duration(300)} style={{ gap: 14 }}>
          <Pressable
            onPress={copy}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              padding: 14,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: c.border,
              backgroundColor: c.bgElevated,
            }}
          >
            <Text style={{ flex: 1, color: c.text, fontSize: 13.5, fontWeight: "600" }} numberOfLines={1}>
              {data.url}
            </Text>
            <Icon name={copied ? "check" : "copy"} size={16} color={copied ? c.success : c.accent} />
            <Text style={{ color: copied ? c.success : c.accent, fontSize: 12.5, fontWeight: "700" }}>
              {copied ? t("Copied", "Imenakiliwa") : t("Copy", "Nakili")}
            </Text>
          </Pressable>

          <Pressable
            onPress={share}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 14,
              borderRadius: 14,
              backgroundColor: c.accent,
            }}
          >
            <Icon name="share-2" size={17} color={c.accentText} />
            <Text style={{ color: c.accentText, fontSize: 15, fontWeight: "800" }}>{t("Share invite", "Sambaza mwaliko")}</Text>
          </Pressable>

          {data.joined > 0 ? (
            <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
              <View style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.border }}>
                <Text style={{ color: c.text, fontSize: 22, fontWeight: "800" }}>{data.joined}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>{t("joined", "wamejiunga")}</Text>
              </View>
              <View style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.border }}>
                <Text style={{ color: c.text, fontSize: 22, fontWeight: "800" }}>{data.activated}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>{t("built a CV", "wametengeneza CV")}</Text>
              </View>
            </View>
          ) : null}
        </Animated.View>
      )}
    </Screen>
  );
}
