import React, { useMemo, useRef, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { apiClient } from "../lib/api-client";
import { useOfflineSync } from "../hooks/use-offline-sync";
import { exportCVAsPDF } from "../services/pdf-export";
import { shareCV } from "../services/share";
import type { CV, CVData, Education, Experience, Skill } from "@sumaiya/types";
import { Button, Screen, ScreenTitle, TextField, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";

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
  const { templateId, cvId: initialCvId, initialData } = route.params || {};
  const { status, queueOperation } = useOfflineSync();
  const cvIdRef = useRef<string>(initialCvId || uid());

  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [data, setData] = useState<Partial<CVData>>(() => ({
    personalInfo: initialData?.personalInfo || { fullName: "", email: "", phone: "", location: "" },
    summary: initialData?.summary || "",
    experience: initialData?.experience || [],
    education: initialData?.education || [],
    skills: initialData?.skills || [],
    certifications: initialData?.certifications || [],
    languages: initialData?.languages || [],
  }));

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
    if (status?.pendingCount) return { label: `${status.pendingCount} to sync`, color: c.warning, icon: "refresh-cw" };
    if (dirty) return { label: "Unsaved", color: c.textMuted, icon: "edit" };
    return { label: "Saved", color: c.success, icon: "check" };
  }, [status?.pendingCount, dirty, c]);

  async function save() {
    if (!data.personalInfo?.fullName?.trim()) {
      haptics.error();
      Alert.alert("Add your name", "A CV needs at least a full name.");
      return;
    }
    setSaving(true);
    try {
      const cv: CV = {
        id: cvIdRef.current,
        userId: "me",
        templateId: templateId || "nakuru",
        title: data.personalInfo.fullName || "My CV",
        data: data as CVData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await queueOperation(initialCvId ? "update_cv" : "create_cv", cvIdRef.current, cv);
      haptics.success();
      setDirty(false);
    } catch {
      haptics.error();
      Alert.alert("Couldn't save", "It'll retry automatically when you're online.");
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
        templateId: templateId || "nakuru",
        title: data.personalInfo?.fullName || "My CV",
        data: data as CVData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const uri = await exportCVAsPDF(cv, "template");
      haptics.success();
      await shareCV(cv, uri);
    } catch {
      haptics.error();
      Alert.alert("Export failed", "Try again in a moment.");
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

  return (
    <Screen
      scroll
      footer={
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Button label="Save" onPress={save} loading={saving} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Export PDF" variant="secondary" onPress={exportPdf} loading={exporting} />
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
              Alert.alert("Discard changes?", "Your edits aren't saved.", [
                { text: "Keep editing", style: "cancel" },
                { text: "Discard", style: "destructive", onPress: () => navigation.goBack() },
              ]);
            } else navigation.goBack();
          }}
          style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
        >
          <Icon name="arrow-left" size={18} color={c.accent} />
          <Text style={{ color: c.accent, fontWeight: "700" }}>Back</Text>
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
          initialCvId ? (
            <Pressable
              onPress={() => navigation.navigate("AtsChecker", { cvId: cvIdRef.current })}
              style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6, paddingHorizontal: 11, borderRadius: 9, backgroundColor: c.accent + "16" }}
            >
              <Icon name="shield-check" size={14} color={c.accent} />
              <Text style={{ color: c.accent, fontSize: 12.5, fontWeight: "700" }}>ATS</Text>
            </Pressable>
          ) : undefined
        }
      >
        {initialCvId ? "Edit CV" : "New CV"}
      </ScreenTitle>

      {/* Personal */}
      <Section title="Personal details" icon="user" defaultOpen>
        <TextField label="Full name" value={data.personalInfo?.fullName || ""} onChangeText={(t) => patchPersonal("fullName", t)} autoCapitalize="words" />
        <TextField label="Headline" placeholder="e.g. Software Engineer" value={(data.personalInfo as any)?.headline || ""} onChangeText={(t) => patchPersonal("headline", t)} />
        <TextField label="Email" value={data.personalInfo?.email || ""} onChangeText={(t) => patchPersonal("email", t)} keyboardType="email-address" autoCapitalize="none" />
        <TextField label="Phone" value={data.personalInfo?.phone || ""} onChangeText={(t) => patchPersonal("phone", t)} keyboardType="phone-pad" />
        <TextField label="Location" value={data.personalInfo?.location || ""} onChangeText={(t) => patchPersonal("location", t)} />
      </Section>

      {/* Summary */}
      <Section title="Professional summary" icon="edit" defaultOpen>
        <TextField
          placeholder="2–3 sentences on who you are and what you do best."
          value={data.summary || ""}
          onChangeText={(t) => patch({ summary: t })}
          multiline
          numberOfLines={5}
          inputStyle={{ minHeight: 100, textAlignVertical: "top" }}
        />
      </Section>

      {/* Experience */}
      <Section title={`Experience${exp.length ? ` · ${exp.length}` : ""}`} icon="briefcase" defaultOpen={exp.length > 0}>
        {exp.map((e, i) => (
          <Animated.View key={e.id} layout={LinearTransition} style={{ gap: 10, borderTopWidth: i ? 1 : 0, borderTopColor: c.border, paddingTop: i ? 14 : 0 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: c.textMuted, fontSize: 11.5, fontWeight: "700", letterSpacing: 0.5 }}>ROLE {i + 1}</Text>
              <Pressable hitSlop={8} onPress={() => { haptics.warning(); patch({ experience: exp.filter((x) => x.id !== e.id) }); }}>
                <Icon name="trash-2" size={15} color={c.error} />
              </Pressable>
            </View>
            <TextField label="Job title" value={e.title} onChangeText={(t) => patch({ experience: exp.map((x) => (x.id === e.id ? { ...x, title: t } : x)) })} />
            <TextField label="Company" value={e.company} onChangeText={(t) => patch({ experience: exp.map((x) => (x.id === e.id ? { ...x, company: t } : x)) })} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}><TextField label="Start" placeholder="2022-01" value={e.startDate} onChangeText={(t) => patch({ experience: exp.map((x) => (x.id === e.id ? { ...x, startDate: t } : x)) })} /></View>
              <View style={{ flex: 1 }}><TextField label="End" placeholder="Present" value={e.endDate || ""} onChangeText={(t) => patch({ experience: exp.map((x) => (x.id === e.id ? { ...x, endDate: t } : x)) })} /></View>
            </View>
            <TextField label="What you did" value={e.description} onChangeText={(t) => patch({ experience: exp.map((x) => (x.id === e.id ? { ...x, description: t } : x)) })} multiline numberOfLines={3} inputStyle={{ minHeight: 74, textAlignVertical: "top" }} />
          </Animated.View>
        ))}
        <Button label="Add a role" variant="ghost" size="sm" leftIcon={<Icon name="plus" size={15} color={c.accent} />} onPress={addExp} />
      </Section>

      {/* Education */}
      <Section title={`Education${edu.length ? ` · ${edu.length}` : ""}`} icon="edu" defaultOpen={edu.length > 0}>
        {edu.map((e, i) => (
          <Animated.View key={e.id} layout={LinearTransition} style={{ gap: 10, borderTopWidth: i ? 1 : 0, borderTopColor: c.border, paddingTop: i ? 14 : 0 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: c.textMuted, fontSize: 11.5, fontWeight: "700", letterSpacing: 0.5 }}>SCHOOL {i + 1}</Text>
              <Pressable hitSlop={8} onPress={() => { haptics.warning(); patch({ education: edu.filter((x) => x.id !== e.id) }); }}>
                <Icon name="trash-2" size={15} color={c.error} />
              </Pressable>
            </View>
            <TextField label="Institution" value={e.institution} onChangeText={(t) => patch({ education: edu.map((x) => (x.id === e.id ? { ...x, institution: t } : x)) })} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}><TextField label="Degree" value={e.degree} onChangeText={(t) => patch({ education: edu.map((x) => (x.id === e.id ? { ...x, degree: t } : x)) })} /></View>
              <View style={{ flex: 1 }}><TextField label="Field" value={e.field} onChangeText={(t) => patch({ education: edu.map((x) => (x.id === e.id ? { ...x, field: t } : x)) })} /></View>
            </View>
            <TextField label="Graduated" placeholder="2021-06" value={e.graduationDate} onChangeText={(t) => patch({ education: edu.map((x) => (x.id === e.id ? { ...x, graduationDate: t } : x)) })} />
          </Animated.View>
        ))}
        <Button label="Add education" variant="ghost" size="sm" leftIcon={<Icon name="plus" size={15} color={c.accent} />} onPress={addEdu} />
      </Section>

      {/* Skills */}
      <Section title={`Skills${skills.length ? ` · ${skills.length}` : ""}`} icon="star" defaultOpen={skills.length > 0}>
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
            <TextField placeholder="Add a skill" value={skillInput} onChangeText={setSkillInput} onSubmitEditing={addSkill} returnKeyType="done" />
          </View>
          <Button label="Add" size="sm" fullWidth={false} onPress={addSkill} />
        </View>
      </Section>
    </Screen>
  );
}
