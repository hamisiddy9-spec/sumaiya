import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { setSecureItem } from "@sumaiya/utils";
import { useAuthContext } from "../contexts/auth-context";
import { saveProfile, EMPTY_PROFILE, type CareerProfile } from "../lib/profile-store";
import { setDefaultTemplate } from "../lib/prefs";
import { CV_TEMPLATES, type CvTemplateId } from "../lib/cv-html";
import {
  CAREER_FIELDS,
  EXPERIENCE_LEVELS,
  experienceLabel,
  fieldLabels,
  skillsForFields,
} from "../lib/career-fields";
import { TemplateThumb } from "../components/cv/template-thumb";
import { SumaiyaMark } from "../components/sumaiya-mark";
import { Button, ProgressBar, TextField, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";
import { useLang } from "../lib/i18n";

export const FIRST_RUN_KEY = "sumaiya_first_run_done";

interface Props {
  onDone: () => void;
}

type StepId = "intro" | "name" | "fields" | "experience" | "skills" | "recent" | "look";

/** A tappable pill used for every preset choice. */
function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: active ? c.accent : c.border,
        backgroundColor: active ? c.accent + "16" : c.bgElevated,
      }}
    >
      {active ? <Icon name="check" size={13} color={c.accent} /> : null}
      <Text style={{ color: active ? c.accent : c.text, fontSize: 13.5, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

export function FirstRunScreen({ onDone }: Props) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const insets = useSafeAreaInsets();
  const { user } = useAuthContext();

  // ── Prefill from the account (Google gives a name; every path gives an email).
  const rawName = user?.name?.trim() ?? "";
  const looksLikeJunk =
    !rawName ||
    /^(hisense|samsung|xiaomi|infinix|tecno|itel|oppo|vivo|realme|nokia|huawei|redmi|android|iphone|ipad|roku|tv)\b/i.test(rawName) ||
    /^[a-z0-9]{1,4}$/i.test(rawName);
  const prefillName = looksLikeJunk ? "" : rawName;
  const email = user?.email ?? "";

  const [name, setName] = useState(prefillName);
  const [fields, setFields] = useState<string[]>([]);
  const [experience, setExperience] = useState<string>("");
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [recent, setRecent] = useState("");
  const [template, setTemplate] = useState<CvTemplateId>("classic");
  const [saving, setSaving] = useState(false);

  // The name step is skipped entirely when the account already has a real one.
  const STEPS: StepId[] = useMemo(
    () => ["intro", ...(prefillName ? [] : (["name"] as StepId[])), "fields", "experience", "skills", "recent", "look"],
    [prefillName],
  );
  const [i, setI] = useState(0);
  const step = STEPS[i];

  // ── Progress. Everything after "intro" is a slot; the account already filled
  // one (name/email) so we open at ~1/n instead of zero.
  const slots = STEPS.length - 1;
  const filled =
    (prefillName || name.trim() ? 1 : 0) +
    (fields.length ? 1 : 0) +
    (experience ? 1 : 0) +
    (skills.length ? 1 : 0) +
    (recent.trim() ? 1 : 0) +
    1; // "look" always has a default
  const pct = Math.min(1, Math.max(0.12, filled / slots));

  const suggestedSkills = useMemo(() => skillsForFields(fields), [fields]);

  const toggle = (list: string[], set: (v: string[]) => void, id: string, max = 99) => {
    if (list.includes(id)) set(list.filter((x) => x !== id));
    else if (list.length < max) set([...list, id]);
  };

  const addCustomSkill = () => {
    const v = customSkill.trim();
    if (v && !skills.includes(v)) {
      setSkills([...skills, v]);
      setCustomSkill("");
      haptics.selection();
    }
  };

  const canNext =
    step === "intro" ||
    step === "name" ||
    step === "look" ||
    (step === "fields" && fields.length > 0) ||
    (step === "experience" && !!experience) ||
    (step === "skills" && skills.length > 0) ||
    (step === "recent"); // recent is optional-ish

  const back = () => {
    haptics.selection();
    if (i > 0) setI(i - 1);
    else onDone(); // skipping from the very first screen
  };

  const finish = async (skipped: boolean) => {
    if (saving) return;
    setSaving(true);
    haptics.selection();
    try {
      const skillNames = skills.join(", ");
      const expLine = experience ? `${experienceLabel(experience, "en")}. ` : "";
      const next: CareerProfile = {
        ...EMPTY_PROFILE,
        fullName: name.trim() || prefillName,
        email,
        headline: fieldLabels(fields, "en"),
        skills: skillNames,
        experience: (expLine + recent.trim()).trim(),
      };
      const hasSomething = next.fullName || next.headline || next.skills || next.experience;
      if (!skipped || hasSomething) {
        const { updatedAt, ...rest } = next;
        await saveProfile(rest);
      }
      await setDefaultTemplate(template).catch(() => {});
      await setSecureItem(FIRST_RUN_KEY, "true").catch(() => {});
    } finally {
      onDone();
    }
  };

  // ── Step body ───────────────────────────────────────────────────────────────
  const freeTemplates = CV_TEMPLATES.filter((tpl) => tpl.tier === "free");

  const body = (() => {
    switch (step) {
      case "intro":
        return (
          <View style={{ alignItems: "center", gap: 18, marginTop: 12 }}>
            <View style={{ width: 116, height: 116, borderRadius: 36, backgroundColor: c.accent + "14", alignItems: "center", justifyContent: "center" }}>
              <SumaiyaMark size={62} state="idle" color={c.accent} />
            </View>
          </View>
        );
      case "name":
        return (
          <TextField
            label={t("Your name", "Jina lako")}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoFocus
            returnKeyType="next"
            onSubmitEditing={() => canNext && setI(i + 1)}
          />
        );
      case "fields":
        return (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9 }}>
            {CAREER_FIELDS.map((f) => (
              <Chip
                key={f.id}
                label={f.label[lang]}
                active={fields.includes(f.id)}
                onPress={() => toggle(fields, setFields, f.id, 3)}
              />
            ))}
          </View>
        );
      case "experience":
        return (
          <View style={{ gap: 10 }}>
            {EXPERIENCE_LEVELS.map((e) => {
              const active = experience === e.id;
              return (
                <Pressable
                  key={e.id}
                  onPress={() => { haptics.selection(); setExperience(e.id); }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 15,
                    paddingHorizontal: 18,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: active ? c.accent : c.border,
                    backgroundColor: active ? c.accent + "12" : c.bgElevated,
                  }}
                >
                  <Text style={{ color: active ? c.accent : c.text, fontSize: 15.5, fontWeight: "700" }}>
                    {e.label[lang]}
                  </Text>
                  {active ? <Icon name="check" size={18} color={c.accent} /> : null}
                </Pressable>
              );
            })}
          </View>
        );
      case "skills":
        return (
          <View style={{ gap: 14 }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9 }}>
              {suggestedSkills.map((s) => (
                <Chip key={s} label={s} active={skills.includes(s)} onPress={() => toggle(skills, setSkills, s)} />
              ))}
              {skills
                .filter((s) => !suggestedSkills.includes(s))
                .map((s) => (
                  <Chip key={s} label={s} active onPress={() => toggle(skills, setSkills, s)} />
                ))}
            </View>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <TextField
                  placeholder={t("Add another skill", "Ongeza ujuzi mwingine")}
                  value={customSkill}
                  onChangeText={setCustomSkill}
                  returnKeyType="done"
                  onSubmitEditing={addCustomSkill}
                />
              </View>
              <Pressable
                onPress={addCustomSkill}
                style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: c.accent + "16", alignItems: "center", justifyContent: "center" }}
              >
                <Icon name="plus" size={20} color={c.accent} />
              </Pressable>
            </View>
          </View>
        );
      case "recent":
        return (
          <TextField
            value={recent}
            onChangeText={setRecent}
            placeholder={t(
              "Storekeeper at Brookside, 2021–2024. Ran stock, GRNs and a team of 4.",
              "Karani wa Duka, Brookside, 2021–2024. Nilisimamia bidhaa, GRN na timu ya watu 4.",
            )}
            multiline
            numberOfLines={5}
            inputStyle={{ minHeight: 120, textAlignVertical: "top" }}
            autoFocus
          />
        );
      case "look":
        return (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 18, paddingVertical: 6, paddingHorizontal: 2 }}>
            {freeTemplates.map((tpl) => {
              const active = template === tpl.id;
              return (
                <Pressable
                  key={tpl.id}
                  onPress={() => { haptics.selection(); setTemplate(tpl.id); }}
                  style={{ alignItems: "center", gap: 8, width: 116 }}
                >
                  <View style={{ padding: 4, borderRadius: 12, borderWidth: 3, borderColor: active ? c.accent : "transparent" }}>
                    <TemplateThumb id={tpl.id} accent={c.accent} width={104} />
                  </View>
                  <Text style={{ color: active ? c.accent : c.textMuted, fontSize: 12.5, fontWeight: "700" }}>
                    {lang === "sw" ? tpl.name.sw : tpl.name.en}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        );
    }
  })();

  const meta: Record<StepId, { title: { en: string; sw: string }; hint?: { en: string; sw: string } }> = {
    intro: {
      title: { en: "Let's set you up", sw: "Tukuandae" },
      hint: {
        en: "Six quick taps so Sumaiya starts knowing you — no typing your whole history.",
        sw: "Migusiko sita mifupi ili Sumaiya akufahamu — bila kuandika historia yote.",
      },
    },
    name: { title: { en: "What's your name?", sw: "Jina lako ni nani?" } },
    fields: {
      title: { en: "What do you work in?", sw: "Unafanya kazi katika nini?" },
      hint: { en: "Pick up to 3.", sw: "Chagua hadi 3." },
    },
    experience: { title: { en: "How much experience?", sw: "Una uzoefu kiasi gani?" } },
    skills: {
      title: { en: "What are you good at?", sw: "Unafanya nini vizuri?" },
      hint: { en: "Tap the ones that fit, add your own.", sw: "Gusa zinazokufaa, ongeza zako." },
    },
    recent: {
      title: { en: "Your most recent job", sw: "Kazi yako ya karibuni" },
      hint: { en: "Role, employer, years, and what you did. One or two lines.", sw: "Cheo, mwajiri, miaka, na ulichofanya. Mstari mmoja au miwili." },
    },
    look: {
      title: { en: "Pick your look", sw: "Chagua muonekano wako" },
      hint: { en: "You can change this any time.", sw: "Unaweza kubadilisha wakati wowote." },
    },
  };
  const m = meta[step];
  const isLast = i === STEPS.length - 1;
  const isIntro = step === "intro";

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ height: insets.top + 10 }} />

      {/* progress + skip */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, gap: 12 }}>
        <View style={{ flex: 1 }}>
          <ProgressBar value={pct} />
        </View>
        <Pressable onPress={() => finish(true)} hitSlop={10}>
          <Text style={{ color: c.textMuted, fontSize: 13.5, fontWeight: "700" }}>{t("Skip", "Ruka")}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={insets.top + 44}>
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingTop: 28, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View key={step} entering={FadeInRight.duration(260)} exiting={FadeOutLeft.duration(150)}>
            <Text style={{ color: c.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 }}>
              {m.title[lang]}
            </Text>
            {m.hint ? (
              <Text style={{ color: c.textBody, fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 22 }}>
                {m.hint[lang]}
              </Text>
            ) : (
              <View style={{ height: 22 }} />
            )}
            {body}
          </Animated.View>
        </ScrollView>

        {/* sticky footer — the primary button is always reachable above the keyboard */}
        <Animated.View
          entering={FadeIn}
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: insets.bottom + 14,
            borderTopWidth: 1,
            borderTopColor: c.border,
            backgroundColor: c.bg,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          {i > 0 ? (
            <Pressable onPress={back} hitSlop={8} style={{ padding: 10 }}>
              <Icon name="arrow-left" size={20} color={c.textMuted} />
            </Pressable>
          ) : null}
          <View style={{ flex: 1 }}>
            <Button
              label={isLast ? t("Finish", "Maliza") : isIntro ? t("Let's go", "Twende") : t("Continue", "Endelea")}
              size="lg"
              loading={saving}
              disabled={!canNext}
              onPress={() => {
                haptics.selection();
                if (isLast) void finish(false);
                else setI(i + 1);
              }}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
