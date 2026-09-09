import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { loadProfile, saveProfile, EMPTY_PROFILE, type CareerProfile } from "../lib/profile-store";
import { useLang } from "../lib/i18n";
import { Button, Screen, ScreenTitle, TextField, haptics, useThemeColors } from "../components/ui";

export function CareerProfileScreen({ navigation }: any) {
  const c = useThemeColors();
  const { t } = useLang();
  const [p, setP] = useState<CareerProfile>(EMPTY_PROFILE);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile().then((v) => { setP(v); setLoaded(true); });
  }, []);

  const set = (k: keyof CareerProfile) => (v: string) => setP((cur) => ({ ...cur, [k]: v }));

  const save = async () => {
    setSaving(true);
    haptics.light();
    try {
      const { updatedAt, ...rest } = p;
      await saveProfile(rest);
      haptics.success();
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return <Screen scroll={false}><Text style={{ color: c.textMuted, padding: 20 }}>{t("Loading…", "Inapakia…")}</Text></Screen>;
  }

  return (
    <Screen scroll keyboardAvoiding contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
      <ScreenTitle>{t("Career profile", "Wasifu wa kazi")}</ScreenTitle>
      <Text style={{ color: c.textBody, fontSize: 13.5, lineHeight: 20, marginBottom: 4 }}>
        {t(
          "Fill this once. Sumaiya reads it so you never have to repeat your history in the chat.",
          "Jaza mara moja. Sumaiya anaisoma ili usirudie historia yako kwenye mazungumzo.",
        )}
      </Text>

      <TextField label={t("Full name", "Jina kamili")} value={p.fullName} onChangeText={set("fullName")} autoCapitalize="words" />
      <TextField label={t("Headline / target role", "Kichwa / cheo lengwa")} value={p.headline} onChangeText={set("headline")} placeholder="Warehouse Supervisor" />
      <TextField label={t("Location", "Eneo")} value={p.location} onChangeText={set("location")} placeholder="Nairobi" />
      <TextField label={t("Phone", "Simu")} value={p.phone} onChangeText={set("phone")} keyboardType="phone-pad" />
      <TextField label={t("Email", "Barua pepe")} value={p.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" />

      <TextField
        label={t("Short summary", "Muhtasari mfupi")}
        value={p.summary} onChangeText={set("summary")}
        multiline numberOfLines={3} inputStyle={{ minHeight: 72, textAlignVertical: "top" }}
        placeholder={t("2–3 sentences about you and your strongest skill.", "Sentensi 2–3 kuhusu wewe na ujuzi wako mkubwa.")}
      />
      <TextField
        label={t("Skills", "Ujuzi")}
        value={p.skills} onChangeText={set("skills")}
        multiline numberOfLines={2} inputStyle={{ minHeight: 56, textAlignVertical: "top" }}
        placeholder={t("Comma-separated: inventory, forklift, POS…", "Tenganisha kwa koma: hesabu ya bidhaa, forklift…")}
      />
      <TextField
        label={t("Work experience", "Uzoefu wa kazi")}
        value={p.experience} onChangeText={set("experience")}
        multiline numberOfLines={5} inputStyle={{ minHeight: 120, textAlignVertical: "top" }}
        placeholder={t("Role, company, years, what you did.", "Cheo, kampuni, miaka, ulichofanya.")}
      />
      <TextField
        label={t("Education", "Elimu")}
        value={p.education} onChangeText={set("education")}
        multiline numberOfLines={2} inputStyle={{ minHeight: 56, textAlignVertical: "top" }}
      />
      <TextField
        label={t("Languages", "Lugha")}
        value={p.languages} onChangeText={set("languages")}
        placeholder={t("English (fluent), Kiswahili (native)", "Kiingereza (ufasaha), Kiswahili (asili)")}
      />
      <TextField
        label={t("Career goals", "Malengo ya kazi")}
        value={p.goals} onChangeText={set("goals")}
        multiline numberOfLines={2} inputStyle={{ minHeight: 56, textAlignVertical: "top" }}
        placeholder={t("What kind of role and where you want to be in 2 years.", "Aina ya kazi na unapotaka kuwa baada ya miaka 2.")}
      />

      <Animated.View entering={FadeIn} style={{ marginTop: 6 }}>
        <Button label={saving ? t("Saving…", "Inahifadhi…") : t("Save profile", "Hifadhi wasifu")} onPress={save} loading={saving} />
      </Animated.View>
    </Screen>
  );
}
