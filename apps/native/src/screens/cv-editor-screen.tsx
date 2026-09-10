import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { offlineStorage } from "@sumaiya/utils";
import { apiClient } from "../lib/api-client";
import { useOfflineSync } from "../hooks/use-offline-sync";
import { exportCVAsPDF } from "../services/pdf-export";
import { shareCV } from "../services/share";
import type { CV, CVData, Education, Experience, Skill } from "@sumaiya/types";
import { Button, Screen, ScreenTitle, TextField, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";
import { useLang } from "../lib/i18n";
import { CV_TEMPLATES, type CvTemplateId } from "../lib/cv-html";
import { getDefaultTemplate } from "../lib/prefs";
import { CvPreviewCard } from "../components/cv/cv-preview-card";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const uid = () => Math.random().toString(36).slice(2, 10);

function Section({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const c = useThemeColors();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Animated.View
      layout={LinearTransition.springify().damping(20)}
      style={{
        backgroundColor: c.bgElevated,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: c.border,
        marginBottom: 12,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={() => {
          haptics.selection();
          setOpen((o) => !o);
        }}
        style={{ flexDirection: "row", alignItems: "center", gap: 11, padding: 15 }}
      >
        <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: c.accent + "14", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={16} color={c.accent} />
        </View>
        <Text style={{ flex: 1, color: c.text, fontSize: 15.5, fontWeight: "700" }}>{title}</Text>
        <Icon name={open ? "chevron-down" : "chevron-right"} size={18} color={c.textMuted} />
      </Pressable>
      {open ? (
        <Animated.View entering={FadeIn.duration(160)} style={{ paddingHorizontal: 15, paddingBottom: 16, gap: 12 }}>
          {children}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

export function CvEditorScreen({ route, navigation }: { route: any; navigation: any }) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const { templateId, cvId: initialCvId, initialData } = route.params || {};
  const { status, queueOperation } = useOfflineSync();
  const insets = useSafeAreaInsets();
  const [showPreview, setShowPreview] = useState(false);
  const knownTemplate = CV_TEMPLATES.some((x) => x.id === templateId);
  const [template, setTemplate] = useState<CvTemplateId>(
    knownTemplate ? (templateId as CvTemplateId) : "classic",
  );
  // A brand-new CV with no template picked → use the first-run default.
  useEffect(() => {
    if (knownTemplate) return;
    let alive = true;
    getDefaultTemplate().then((id) => { if (alive) setTemplate(id); });
    return () => { alive = false; };
  }, [knownTemplate]);
  const cvIdRef = useRef<string>(initialCvId || uid());

  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dirty, setDirty] = useState(false);
  // We have data up front when it's a new CV or the caller passed the CV's
  // data. Opening an existing CV by id alone means we must fetch it — until
  // then, show a loader instead of an empty form (the old bug: every saved CV
  // opened blank).
  const [loadingCv, setLoadingCv] = useState<boolean>(!!initialCvId && !initialData);

  const emptyData = (src?: Partial<CVData>): Partial<CVData> => ({
    personalInfo: src?.personalInfo || { fullName: "", email: "", phone: "", location: "" },
    summary: src?.summary || "",
    experience: src?.experience || [],
    education: src?.education || [],
    skills: src?.skills || [],
    certifications: src?.certifications || [],
    languages: src?.languages || [],
  });

  const [data, setData] = useState<Partial<CVData>>(() => emptyData(initialData));

  useEffect(() => {
    let cancelled = false;
    if (initialCvId && !initialData) {
      (async () => {
        try {
          // Local cache first (covers a CV made offline / not yet synced),
          // then the server.
          const local = await offlineStorage.getCVOffline(initialCvId).catch(() => null);
          const cv = local ?? (await apiClient.getCV(initialCvId));
          if (!cancelled && cv?.data) {
            setData(emptyData(cv.data as Partial<CVData>));
          }
        } catch {
          if (!cancelled) {
            Alert.alert(t("Couldn't open that CV", "Imeshindwa kufungua CV hiyo"), t("Check your connection and try again.", "Angalia mtandao kisha ujaribu tena."));
          }
        } finally {
          if (!cancelled) setLoadingCv(false);
        }
      })();
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCvId]);

  const [skillInput, setSkillInput] = useState("");

  const patch = (p: Partial<CVData>) => {
    setData((d) => ({ ...d, ...p }));
    setDirty(true);
  };
  const patchPersonal = (k: string, v: string) => {
    setData((d) => ({ ...d, personalInfo: { ...(d.personalInfo as any), [k]: v } }));
    setDirty(true);
  };

  const exp = (data.experience ?? []) as Experience[];
  const edu = (data.education ?? []) as Education[];
  const skills = (data.skills ?? []) as Skill[];

  const syncPill = useMemo(() => {
    if (status?.pendingCount) return { label: t(`${status.pendingCount} to sync`, `${status.pendingCount} kusawazisha`), color: c.warning, icon: "refresh-cw" };
    if (dirty) return { label: t("Unsaved", "Haijahifadhiwa"), color: c.textMuted, icon: "edit" };
    return { label: t("Saved", "Imehifadhiwa"), color: c.success, icon: "check" };
  }, [status?.pendingCount, dirty, c]);

  async function save() {
    if (!data.personalInfo?.fullName?.trim()) {
      haptics.error();
      Alert.alert(t("Add your name", "Weka jina lako"), t("A CV needs at least a full name.", "CV inahitaji angalau jina kamili."));
      return;
    }
    setSaving(true);
    try {
      const cv: CV = {
        id: cvIdRef.current,
        userId: "me",
        templateId: template,
        title: data.personalInfo.fullName || "My CV",
        data: data as CVData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      // Write to the local cache first so the list/home reflect it immediately
      // and it survives being offline, then queue the push to the server.
      await offlineStorage.saveCVOffline(cv).catch(() => {});
      await queueOperation(initialCvId ? "update_cv" : "create_cv", cvIdRef.current, cv);
      haptics.success();
      setDirty(false);
    } catch {
      haptics.error();
      Alert.alert(t("Couldn't save", "Imeshindwa kuhifadhi"), t("It'll retry automatically when you're online.", "Itajaribu tena yenyewe ukipata mtandao."));
    } finally {
      setSaving(false);
    }
  }

  async function exportPdf() {
    setExporting(true);
    try {
      const cv: CV = {
        id: cvIdRef.current,
        userId: "me",
        templateId: template,
        title: data.personalInfo?.fullName || "My CV",
        data: data as CVData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const uri = await exportCVAsPDF(cv, { accent: "#DA4A1C", lang, template });
      haptics.success();
      await shareCV(cv, uri);
    } catch {
      haptics.error();
      Alert.alert(t("Export failed", "Kupakua kumeshindwa"), t("Try again in a moment.", "Jaribu tena baada ya muda."));
    } finally {
      setExporting(false);
    }
  }

  const addExp = () => {
    haptics.light();
    patch({ experience: [...exp, { id: uid(), company: "", title: "", startDate: "", endDate: "", description: "", keyAchievements: [] }] });
  };
  const addEdu = () => {
    haptics.light();
    patch({ education: [...edu, { id: uid(), institution: "", degree: "", field: "", graduationDate: "" }] });
  };
  const addSkill = () => {
    const name = skillInput.trim();
    if (!name) return;
    haptics.light();
    patch({ skills: [...skills, { id: uid(), name, level: "intermediate" }] });
    setSkillInput("");
  };

  if (loadingCv) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator color={c.accent} />
          <Text style={{ color: c.textMuted, fontSize: 13 }}>{t("Opening your CV…", "Inafungua CV yako…")}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      footer={
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Button label={t("Save", "Hifadhi")} onPress={save} loading={saving} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label={t("Export PDF", "Pakua PDF")} variant="secondary" onPress={exportPdf} loading={exporting} />
          </View>
        </View>
      }
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, marginBottom: 16 }}>
        <Pressable
          hitSlop={10}
          onPress={() => {
            if (dirty) {
              Alert.alert(t("Discard changes?", "Utupe mabadiliko?"), t("Your edits aren't saved.", "Mabadiliko yako hayajahifadhiwa."), [
                { text: t("Keep editing", "Endelea kuhariri"), style: "cancel" },
                { text: t("Discard", "Tupa"), style: "destructive", onPress: () => navigation.goBack() },
              ]);
            } else navigation.goBack();
          }}
          style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
        >
          <Icon name="arrow-left" size={18} color={c.accent} />
          <Text style={{ color: c.accent, fontWeight: "700" }}>{t("Back", "Rudi")}</Text>
        </Pressable>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            backgroundColor: syncPill.color + "1f",
            borderRadius: 999,
            paddingHorizontal: 9,
            paddingVertical: 4,
          }}
        >
          <Icon name={syncPill.icon} size={11} color={syncPill.color} />
          <Text style={{ color: syncPill.color, fontSize: 11, fontWeight: "700" }}>{syncPill.label}</Text>
        </View>
      </View>

      <ScreenTitle
        trailing={
          <View style={{ flexDirection: "row", gap: 6 }}>
            <Pressable
              onPress={() => { haptics.selection(); setShowPreview(true); }}
              style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6, paddingHorizontal: 11, borderRadius: 9, backgroundColor: c.accent + "16" }}
            >
              <Icon name="eye" size={14} color={c.accent} />
              <Text style={{ color: c.accent, fontSize: 12.5, fontWeight: "700" }}>{t("Preview", "Onyesho")}</Text>
            </Pressable>
            {initialCvId ? (
              <Pressable
                onPress={() => navigation.navigate("AtsChecker", { cvId: cvIdRef.current })}
                style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6, paddingHorizontal: 11, borderRadius: 9, backgroundColor: c.accent + "16" }}
              >
                <Icon name="shield-check" size={14} color={c.accent} />
                <Text style={{ color: c.accent, fontSize: 12.5, fontWeight: "700" }}>ATS</Text>
              </Pressable>
            ) : null}
          </View>
        }
      >
        {initialCvId ? t("Edit CV", "Hariri CV") : t("New CV", "CV mpya")}
      </ScreenTitle>

      <Modal visible={showPreview} animationType="slide" onRequestClose={() => setShowPreview(false)}>
        <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 40 }}>
          <Pressable
            onPress={() => setShowPreview(false)}
            hitSlop={10}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 14 }}
          >
            <Icon name="arrow-left" size={20} color={c.text} />
            <Text style={{ color: c.text, fontSize: 15, fontWeight: "700" }}>{t("Back to editing", "Rudi kuhariri")}</Text>
          </Pressable>
          <CvPreviewCard
            cv={{ id: cvIdRef.current, userId: "me", templateId: template, title: data.personalInfo?.fullName || "CV", data: data as CVData, createdAt: new Date(), updatedAt: new Date() }}
            initialTemplate={template}
            onTemplateChange={(id) => { setTemplate(id); setDirty(true); }}
          />
        </ScrollView>
      </Modal>

      {/* Personal */}
      <Section title={t("Personal details", "Maelezo binafsi")} icon="user" defaultOpen>
        <TextField label={t("Full name", "Jina kamili")} value={data.personalInfo?.fullName || ""} onChangeText={(t) => patchPersonal("fullName", t)} autoCapitalize="words" />
        <TextField label={t("Headline", "Kichwa cha kazi")} placeholder={t("e.g. Software Engineer", "mf. Mhandisi wa Programu")} value={(data.personalInfo as any)?.headline || ""} onChangeText={(t) => patchPersonal("headline", t)} />
        <TextField label={t("Email", "Barua pepe")} value={data.personalInfo?.email || ""} onChangeText={(t) => patchPersonal("email", t)} keyboardType="email-address" autoCapitalize="none" />
        <TextField label={t("Phone", "Simu")} value={data.personalInfo?.phone || ""} onChangeText={(t) => patchPersonal("phone", t)} keyboardType="phone-pad" />
        <TextField label={t("Location", "Eneo")} value={data.personalInfo?.location || ""} onChangeText={(t) => patchPersonal("location", t)} />
      </Section>

      {/* Summary */}
      <Section title={t("Professional summary", "Muhtasari wa kikazi")} icon="edit" defaultOpen>
        <TextField
          placeholder={t("2–3 sentences on who you are and what you do best.", "Sentensi 2–3 kuhusu wewe na unachofanya vizuri zaidi.")}
          value={data.summary || ""}
          onChangeText={(t) => patch({ summary: t })}
          multiline
          numberOfLines={5}
          inputStyle={{ minHeight: 100, textAlignVertical: "top" }}
        />
      </Section>

      {/* Experience */}
      <Section title={`${t("Experience", "Uzoefu")}${exp.length ? ` · ${exp.length}` : ""}`} icon="briefcase" defaultOpen={exp.length > 0}>
        {exp.map((e, i) => (
          <Animated.View key={e.id} layout={LinearTransition} style={{ gap: 10, borderTopWidth: i ? 1 : 0, borderTopColor: c.border, paddingTop: i ? 14 : 0 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: c.textMuted, fontSize: 11.5, fontWeight: "700", letterSpacing: 0.5 }}>{t("ROLE", "KAZI")} {i + 1}</Text>
              <Pressable hitSlop={8} onPress={() => { haptics.warning(); patch({ experience: exp.filter((x) => x.id !== e.id) }); }}>
                <Icon name="trash-2" size={15} color={c.error} />
              </Pressable>
            </View>
            <TextField label={t("Job title", "Cheo")} value={e.title} onChangeText={(t) => patch({ experience: exp.map((x) => (x.id === e.id ? { ...x, title: t } : x)) })} />
            <TextField label={t("Company", "Kampuni")} value={e.company} onChangeText={(t) => patch({ experience: exp.map((x) => (x.id === e.id ? { ...x, company: t } : x)) })} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}><TextField label={t("Start", "Ilianza")} placeholder="2022-01" value={e.startDate} onChangeText={(t) => patch({ experience: exp.map((x) => (x.id === e.id ? { ...x, startDate: t } : x)) })} /></View>
              <View style={{ flex: 1 }}><TextField label={t("End", "Iliisha")} placeholder={t("Present", "Sasa")} value={e.endDate || ""} onChangeText={(t) => patch({ experience: exp.map((x) => (x.id === e.id ? { ...x, endDate: t } : x)) })} /></View>
            </View>
            <TextField label={t("What you did", "Ulichofanya")} value={e.description} onChangeText={(t) => patch({ experience: exp.map((x) => (x.id === e.id ? { ...x, description: t } : x)) })} multiline numberOfLines={3} inputStyle={{ minHeight: 74, textAlignVertical: "top" }} />
          </Animated.View>
        ))}
        <Button label={t("Add a role", "Ongeza kazi")} variant="ghost" size="sm" leftIcon={<Icon name="plus" size={15} color={c.accent} />} onPress={addExp} />
      </Section>

      {/* Education */}
      <Section title={`${t("Education", "Elimu")}${edu.length ? ` · ${edu.length}` : ""}`} icon="graduation-cap" defaultOpen={edu.length > 0}>
        {edu.map((e, i) => (
          <Animated.View key={e.id} layout={LinearTransition} style={{ gap: 10, borderTopWidth: i ? 1 : 0, borderTopColor: c.border, paddingTop: i ? 14 : 0 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: c.textMuted, fontSize: 11.5, fontWeight: "700", letterSpacing: 0.5 }}>{t("SCHOOL", "SHULE")} {i + 1}</Text>
              <Pressable hitSlop={8} onPress={() => { haptics.warning(); patch({ education: edu.filter((x) => x.id !== e.id) }); }}>
                <Icon name="trash-2" size={15} color={c.error} />
              </Pressable>
            </View>
            <TextField label={t("Institution", "Taasisi")} value={e.institution} onChangeText={(t) => patch({ education: edu.map((x) => (x.id === e.id ? { ...x, institution: t } : x)) })} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}><TextField label={t("Degree", "Shahada")} value={e.degree} onChangeText={(t) => patch({ education: edu.map((x) => (x.id === e.id ? { ...x, degree: t } : x)) })} /></View>
              <View style={{ flex: 1 }}><TextField label={t("Field", "Fani")} value={e.field} onChangeText={(t) => patch({ education: edu.map((x) => (x.id === e.id ? { ...x, field: t } : x)) })} /></View>
            </View>
            <TextField label={t("Graduated", "Ulihitimu")} placeholder="2021-06" value={e.graduationDate} onChangeText={(t) => patch({ education: edu.map((x) => (x.id === e.id ? { ...x, graduationDate: t } : x)) })} />
          </Animated.View>
        ))}
        <Button label={t("Add education", "Ongeza elimu")} variant="ghost" size="sm" leftIcon={<Icon name="plus" size={15} color={c.accent} />} onPress={addEdu} />
      </Section>

      {/* Skills */}
      <Section title={`${t("Skills", "Ujuzi")}${skills.length ? ` · ${skills.length}` : ""}`} icon="star" defaultOpen={skills.length > 0}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
          {skills.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => { haptics.selection(); patch({ skills: skills.filter((x) => x.id !== s.id) }); }}
              style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: c.accent + "14", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 6 }}
            >
              <Text style={{ color: c.accent, fontSize: 12.5, fontWeight: "700" }}>{s.name}</Text>
              <Icon name="x" size={11} color={c.accent} />
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
          <View style={{ flex: 1 }}>
            <TextField placeholder={t("Add a skill", "Ongeza ujuzi")} value={skillInput} onChangeText={setSkillInput} onSubmitEditing={addSkill} returnKeyType="done" />
          </View>
          <Button label="Add" size="sm" fullWidth={false} onPress={addSkill} />
        </View>
      </Section>
    </Screen>
  );
}
