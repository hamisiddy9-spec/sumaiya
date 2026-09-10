import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { setSecureItem } from "@sumaiya/utils";
import { saveProfile, type CareerProfile } from "../lib/profile-store";
import { setDefaultTemplate } from "../lib/prefs";
import { CV_TEMPLATES, type CvTemplateId } from "../lib/cv-html";
import { TemplateThumb } from "../components/cv/template-thumb";
import { SumaiyaMark } from "../components/sumaiya-mark";
import { Button, TextField, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";
import { useLang } from "../lib/i18n";

export const FIRST_RUN_KEY = "sumaiya_first_run_done";

type Field = keyof Omit<CareerProfile, "updatedAt">;

interface Props {
  onDone: () => void;
}

export function FirstRunScreen({ onDone }: Props) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [p, setP] = useState<Record<Field, string>>({
    fullName: "", headline: "", location: "", phone: "", email: "",
    summary: "", skills: "", experience: "", education: "", goals: "", languages: "",
  });
  const [template, setTemplate] = useState<CvTemplateId>("classic");
  const [saving, setSaving] = useState(false);

  const set = (k: Field) => (v: string) => setP((cur) => ({ ...cur, [k]: v }));

  const finish = async (skipped: boolean) => {
    if (saving) return;
    setSaving(true);
    haptics.selection();
    try {
      const { fullName, headline, location, phone, email, skills, experience } = p;
      // Save whatever they gave — even a name alone helps Sumaiya.
      if (!skipped || fullName || headline || skills || experience) {
        await saveProfile({
          fullName, headline, location, phone, email, skills, experience,
          summary: "", education: "", goals: "", languages: "",
        });
      }
      await setDefaultTemplate(template).catch(() => {});
      await setSecureItem(FIRST_RUN_KEY, "true").catch(() => {});
    } finally {
      onDone();
    }
  };

  // ── Steps ───────────────────────────────────────────────────────────────
  const steps: {
    title: { en: string; sw: string };
    hint?: { en: string; sw: string };
    body: React.ReactNode;
  }[] = [
    {
      title: { en: "Meet Sumaiya", sw: "Karibu kwa Sumaiya" },
      hint: {
        en: "Six quick questions. I remember your answers so you never repeat them.",
        sw: "Maswali sita mafupi. Nakumbuka majibu yako ili usirudie.",
      },
      body: (
        <View style={{ alignItems: "center", marginTop: 8 }}>
          <View style={{ width: 120, height: 120, borderRadius: 36, backgroundColor: c.accent + "1a", alignItems: "center", justifyContent: "center" }}>
            <SumaiyaMark size={64} state="idle" color={c.accent} />
          </View>
        </View>
      ),
    },
    {
      title: { en: "What's your name?", sw: "Jina lako ni nani?" },
      body: (
        <TextField
          label={t("Full name", "Jina kamili")}
          value={p.fullName}
          onChangeText={set("fullName")}
          autoCapitalize="words"
          autoFocus
        />
      ),
    },
    {
      title: { en: "What job do you want?", sw: "Unataka kazi gani?" },
      hint: { en: "The role you're aiming for — even roughly.", sw: "Cheo unacholenga — hata kwa ukaribu." },
      body: (
        <TextField
          label={t("Target role", "Cheo lengwa")}
          placeholder={t("e.g. Warehouse Supervisor", "mf. Msimamizi wa Ghala")}
          value={p.headline}
          onChangeText={set("headline")}
          autoCapitalize="words"
          autoFocus
        />
      ),
    },
    {
      title: { en: "How do people reach you?", sw: "Watu wanakupataje?" },
      body: (
        <View style={{ gap: 12 }}>
          <TextField label={t("Location", "Eneo")} placeholder="Nairobi" value={p.location} onChangeText={set("location")} />
          <TextField label={t("Phone", "Simu")} value={p.phone} onChangeText={set("phone")} keyboardType="phone-pad" />
          <TextField label={t("Email", "Barua pepe")} value={p.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" />
        </View>
      ),
    },
    {
      title: { en: "Your most recent job", sw: "Kazi yako ya karibuni" },
      hint: { en: "Role, company, years, and what you actually did.", sw: "Cheo, kampuni, miaka, na ulichofanya kweli." },
      body: (
        <TextField
          value={p.experience}
          onChangeText={set("experience")}
          placeholder={t("Storekeeper at Brookside, 2021–2024. Ran stock, GRNs, and a team of 4.", "Karani wa Duka, Brookside, 2021–2024. Nilisimamia bidhaa, GRN, na timu ya watu 4.")}
          multiline
          numberOfLines={5}
          inputStyle={{ minHeight: 120, textAlignVertical: "top" }}
          autoFocus
        />
      ),
    },
    {
      title: { en: "What are you good at?", sw: "Unafanya nini vizuri?" },
      hint: { en: "Skills and tools, separated by commas.", sw: "Ujuzi na zana, tenga kwa koma." },
      body: (
        <TextField
          value={p.skills}
          onChangeText={set("skills")}
          placeholder={t("inventory, forklift, POS, teamwork, Excel", "hesabu ya bidhaa, forklift, POS, kazi ya timu, Excel")}
          multiline
          numberOfLines={3}
          inputStyle={{ minHeight: 72, textAlignVertical: "top" }}
          autoFocus
        />
      ),
    },
    {
      title: { en: "Pick your look", sw: "Chagua muonekano wako" },
      hint: { en: "You can change this any time.", sw: "Unaweza kubadilisha wakati wowote." },
      body: (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 6 }}>
          {CV_TEMPLATES.filter((tpl) => tpl.tier === "free").map((tpl) => {
            const active = template === tpl.id;
            return (
              <Pressable
                key={tpl.id}
                onPress={() => { haptics.selection(); setTemplate(tpl.id); }}
                style={{ alignItems: "center", gap: 6, width: 72 }}
              >
                <View style={{ padding: 3, borderRadius: 8, borderWidth: 2.5, borderColor: active ? c.accent : "transparent" }}>
                  <TemplateThumb id={tpl.id} accent={c.accent} width={62} />
                </View>
                <Text style={{ color: active ? c.accent : c.textMuted, fontSize: 11.5, fontWeight: "700" }}>
                  {lang === "sw" ? tpl.name.sw : tpl.name.en}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ),
    },
  ];

  const isLast = step === steps.length - 1;
  const isIntro = step === 0;
  const cur = steps[step];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ height: insets.top + 8 }} />

      {/* progress + skip */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, gap: 10 }}>
        <View style={{ flex: 1, flexDirection: "row", gap: 5 }}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                backgroundColor: i <= step ? c.accent : c.border,
              }}
            />
          ))}
        </View>
        <Pressable onPress={() => finish(true)} hitSlop={10}>
          <Text style={{ color: c.textMuted, fontSize: 13.5, fontWeight: "700" }}>{t("Skip", "Ruka")}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top + 40}
      >
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 32, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <Animated.View key={step} entering={FadeInRight.duration(280)} exiting={FadeOutLeft.duration(160)}>
            <Text style={{ color: c.text, fontSize: 27, fontWeight: "800", letterSpacing: -0.5 }}>
              {cur.title[lang]}
            </Text>
            {cur.hint ? (
              <Text style={{ color: c.textBody, fontSize: 14.5, lineHeight: 21, marginTop: 8, marginBottom: 22 }}>
                {cur.hint[lang]}
              </Text>
            ) : (
              <View style={{ height: 22 }} />
            )}
            {cur.body}
          </Animated.View>
        </ScrollView>

        <Animated.View entering={FadeIn} style={{ padding: 20, paddingBottom: insets.bottom + 16, gap: 10 }}>
          <Button
            label={isLast ? t("Finish", "Maliza") : isIntro ? t("Let's go", "Twende") : t("Continue", "Endelea")}
            size="lg"
            loading={saving}
            onPress={() => {
              haptics.selection();
              if (isLast) void finish(false);
              else setStep((s) => s + 1);
            }}
          />
          {step > 0 ? (
            <Pressable
              onPress={() => setStep((s) => s - 1)}
              style={{ alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6 }}
            >
              <Icon name="arrow-left" size={13} color={c.textMuted} />
              <Text style={{ color: c.textMuted, fontSize: 13, fontWeight: "700" }}>{t("Back", "Rudi")}</Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
