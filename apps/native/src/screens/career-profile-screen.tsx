import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { loadProfile, saveProfile, EMPTY_PROFILE, type CareerProfile } from "../lib/profile-store";
import { track, FUNNEL_EVENTS } from "../lib/analytics";
import { pickAndCompressPhoto } from "../lib/pick-photo";
import { Icon } from "../components/icon";
import { getDefaultTemplate, setDefaultTemplate } from "../lib/prefs";
import { CV_TEMPLATES, type CvTemplateId } from "../lib/cv-html";
import { TemplateThumb } from "../components/cv/template-thumb";
import { useLang } from "../lib/i18n";
import { Button, Screen, ScreenTitle, TextField, dialog, haptics, useThemeColors } from "../components/ui";
import type { CareerProfileScreenProps } from "../navigation/types";

export function CareerProfileScreen({ navigation }: CareerProfileScreenProps) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const [p, setP] = useState<CareerProfile>(EMPTY_PROFILE);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<CvTemplateId>("classic");

  // A profile photo is the one field everyone expects to set once and then see
  // everywhere. Compressed on device (400px JPEG — see pick-photo.ts) so the
  // profile stays small enough to sync on a slow connection.
  const [photoBusy, setPhotoBusy] = useState(false);
  const pickPhoto = async () => {
    haptics.light();
    setPhotoBusy(true);
    try {
      const photo = await pickAndCompressPhoto();
      if (photo) setP((s) => ({ ...s, photo }));
    } catch {
      haptics.error();
      dialog.alert(t("Couldn't use that photo", "Imeshindwa kutumia picha hiyo"), t("Try a different one.", "Jaribu nyingine."));
    } finally {
      setPhotoBusy(false);
    }
  };

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
      track(FUNNEL_EVENTS.profileCompleted);
      navigation.goBack();
    } catch {
      // saveProfile's AsyncStorage.setItem can throw (disk full, rare storage
      // faults). This had no catch at all: the button would just silently
      // re-enable with the edits unsaved and no indication anything failed.
      haptics.error();
      dialog.alert(t("Couldn't save", "Imeshindwa kuhifadhi"), t("Try again.", "Jaribu tena."));
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
          "Fill this once. I read it so you never have to repeat your history in the chat.",
          "Jaza mara moja. Naisoma ili usirudie historia yako kwenye mazungumzo.",
        )}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        {/* The photo IS the control. The owner's call: "after adding photo the
            badilisha picha button i dont think is needed" — a user can tap the
            photo itself. So the small camera badge below is the affordance that
            tells them so, and the separate button is gone once a photo exists.
            It stays when there is NO photo: an empty circle with a user glyph
            is not a discoverable target on its own. */}
        <Pressable
          onPress={pickPhoto}
          disabled={photoBusy}
          accessibilityRole="button"
          accessibilityLabel={p.photo ? t("Change photo", "Badilisha picha") : t("Add your photo", "Weka picha yako")}
          style={{ width: 68, height: 68, borderRadius: 34 }}
        >
          {p.photo ? (
            <Image
              source={{ uri: p.photo }}
              style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: c.bg, borderWidth: 1, borderColor: c.border }}
              accessibilityLabel={t("Your photo", "Picha yako")}
            />
          ) : (
            <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: c.accent + "14", alignItems: "center", justifyContent: "center" }}>
              <Icon name="user" size={28} color={c.accent} />
            </View>
          )}
          <View
            style={{
              position: "absolute", right: -2, bottom: -2, width: 24, height: 24, borderRadius: 12,
              backgroundColor: c.accent, alignItems: "center", justifyContent: "center",
              borderWidth: 2, borderColor: c.bg,
            }}
          >
            {photoBusy ? (
              <ActivityIndicator size="small" color={c.accentText} />
            ) : (
              <Icon name="camera" size={13} color={c.accentText} />
            )}
          </View>
        </Pressable>
        <View style={{ flex: 1, gap: 6 }}>
          {!p.photo ? (
            <Button
              size="sm"
              variant="secondary"
              loading={photoBusy}
              label={t("Add your photo", "Weka picha yako")}
              onPress={pickPhoto}
            />
          ) : null}
          {p.photo ? (
            <Pressable onPress={() => { haptics.selection(); setP((s) => ({ ...s, photo: "" })); }}>
              <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "700", textDecorationLine: "underline" }}>
                {t("Remove photo", "Ondoa picha")}
              </Text>
            </Pressable>
          ) : null}
          <Text style={{ color: c.textMuted, fontSize: 11.5, lineHeight: 16 }}>
            {t(
              "It shows next to your name and on your CVs. Photos are compressed on your phone before saving.",
              "Inaonekana kando ya jina lako na kwenye CV zako. Picha husafishwa kwenye simu yako kabla kuhifadhi.",
            )}
          </Text>
        </View>
      </View>

      <TextField label={t("Full name", "Jina kamili")} value={p.fullName} onChangeText={set("fullName")} autoCapitalize="words" />
      <TextField label={t("Headline / target role", "Kichwa / cheo lengwa")} value={p.headline} onChangeText={set("headline")} placeholder={t("e.g. Warehouse Supervisor", "Mfano: Mfanyakazi wa Ghala")} />
      <TextField label={t("Location", "Eneo")} value={p.location} onChangeText={set("location")} placeholder={t("e.g. Dar es Salaam", "Mfano: Dar es Salaam")} />
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
        {t("Default CV look", "Muundo chaguo-msingi wa CV")}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 6, alignItems: "center" }} style={{ flexGrow: 0 }}>
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
