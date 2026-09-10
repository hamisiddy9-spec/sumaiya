import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { loadProfile, saveProfile, EMPTY_PROFILE, type CareerProfile } from "../lib/profile-store";
import { getDefaultTemplate, setDefaultTemplate } from "../lib/prefs";
import { CV_TEMPLATES, type CvTemplateId } from "../lib/cv-html";
import { TemplateThumb } from "../components/cv/template-thumb";
import { useLang } from "../lib/i18n";
import { Button, Screen, ScreenTitle, TextField, haptics, useThemeColors } from "../components/ui";

export function CareerProfileScreen({ navigation }: any) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const [p, setP] = useState<CareerProfile>(EMPTY_PROFILE);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<CvTemplateId>("classic");

  useEffect(() => {
    loadProfile().then((v) => { setP(v); setLoaded(true); });
    getDefaultTemplate().then(setTemplate);
  }, []);

  const set = (k: keyof CareerProfile) => (v: string) => setP((cur) => ({ ...cur, [k]: v }));

  const save = async () => {
    setSaving(true);
    haptics.light();
    try {
      const { updatedAt, ...rest } = p;
      await saveProfile(rest);
      await setDefaultTemplate(template);
      haptics.success();
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={c.accent} />
        </View>
      </Screen>
    );
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

      <Text style={{ color: c.text, fontSize: 14, fontWeight: "700", marginTop: 10 }}>
        {t("Default CV look", "Muonekano chaguo-msingi wa CV")}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 6 }}>
        {CV_TEMPLATES.filter((tpl) => tpl.tier === "free").map((tpl) => {
          const active = template === tpl.id;
          return (
            <Pressable
              key={tpl.id}
              onPress={() => { haptics.selection(); setTemplate(tpl.id); }}
              style={{ alignItems: "center", gap: 6, width: 70 }}
            >
              <View style={{ padding: 3, borderRadius: 8, borderWidth: 2.5, borderColor: active ? c.accent : "transparent" }}>
                <TemplateThumb id={tpl.id} accent={c.accent} width={60} />
              </View>
              <Text style={{ color: active ? c.accent : c.textMuted, fontSize: 11, fontWeight: "700" }}>
                {lang === "sw" ? tpl.name.sw : tpl.name.en}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Animated.View entering={FadeIn} style={{ marginTop: 6 }}>
        <Button label={saving ? t("Saving…", "Inahifadhi…") : t("Save profile", "Hifadhi wasifu")} onPress={save} loading={saving} />
      </Animated.View>
    </Screen>
  );
}
