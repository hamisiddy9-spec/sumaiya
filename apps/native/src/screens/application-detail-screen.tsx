import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Share, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import type { CV } from "@sumaiya/types";
import { apiClient } from "../lib/api-client";
import { useCvs } from "../hooks/use-cvs";
import {
  createApplication, getApplication, updateApplication, deleteApplication,
  STATUS_ORDER, STATUS_META, type AppStatus, type Application,
} from "../lib/applications-store";
import { matchJd } from "../lib/ats";
import { useLang } from "../lib/i18n";
import { Button, Screen, ScreenTitle, TextField, dialog, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";
import { SumaiyaMark } from "../components/sumaiya-mark";
import type { ApplicationDetailScreenProps } from "../navigation/types";

export function ApplicationDetailScreen({ route, navigation }: ApplicationDetailScreenProps) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const sw = lang === "sw";
  const id: string | undefined = route?.params?.id;
  const isNew = !id;

  const { cvs } = useCvs();
  const [loaded, setLoaded] = useState(isNew);
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jd, setJd] = useState("");
  const [status, setStatus] = useState<AppStatus>("saved");
  const [cvId, setCvId] = useState<string | undefined>();
  const [coverLetter, setCoverLetter] = useState("");
  const [notes, setNotes] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const a = await getApplication(id!);
      if (a) {
        setRole(a.role); setCompany(a.company); setLocation(a.location ?? "");
        setJobUrl(a.jobUrl ?? ""); setJd(a.jobDescription ?? ""); setStatus(a.status);
        setCvId(a.cvId); setCoverLetter(a.coverLetter ?? ""); setNotes(a.notes ?? "");
      }
      setLoaded(true);
    })();
  }, [id]);

  const linkedCv: CV | undefined = useMemo(() => cvs.find((x) => x.id === cvId), [cvs, cvId]);
  const fitScore = useMemo(() => {
    if (!linkedCv || jd.trim().length < 40) return undefined;
    return matchJd(linkedCv.data, jd).score;
  }, [linkedCv, jd]);

  const canSave = role.trim().length > 0 && company.trim().length > 0;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    haptics.light();
    const payload: Partial<Application> = {
      role: role.trim(), company: company.trim(), location: location.trim() || undefined,
      jobUrl: jobUrl.trim() || undefined, jobDescription: jd.trim() || undefined,
      status, cvId, coverLetter: coverLetter.trim() || undefined, notes: notes.trim() || undefined,
      fitScore,
    };
    try {
      if (isNew) await createApplication({ company: payload.company!, role: payload.role!, ...payload });
      else await updateApplication(id!, payload);
      haptics.success();
      navigation.goBack();
    } catch {
      haptics.error();
      dialog.alert(t("Couldn't save", "Imeshindwa kuhifadhi"), t("Try again.", "Jaribu tena."));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    haptics.warning();
    dialog.alert(
      t("Delete this application?", "Ufute ombi hili?"),
      t("This removes it from your phone. It can't be undone.", "Hili linaliondoa kwenye simu yako. Haliwezi kurudishwa."),
      [
        { text: t("Cancel", "Ghairi"), style: "cancel" },
        {
          text: t("Delete", "Futa"), style: "destructive",
          onPress: async () => { await deleteApplication(id!); haptics.success(); navigation.goBack(); },
        },
      ],
    );
  };

  const draftCoverLetter = async () => {
    if (!role.trim() || !company.trim()) {
      dialog.alert(t("Add the role and company first", "Ongeza cheo na kampuni kwanza"));
      return;
    }
    setDrafting(true);
    haptics.light();
    try {
      const cvBlock = linkedCv
        ? `\n\nMy CV summary: ${linkedCv.data.summary ?? ""}\nSkills: ${linkedCv.data.skills.map((s) => s.name).join(", ")}\nMost recent role: ${linkedCv.data.experience[0]?.title ?? ""} at ${linkedCv.data.experience[0]?.company ?? ""}`
        : "";
      const prompt =
        `Write a concise, professional cover letter (max 200 words) for the role of "${role}" at "${company}". ` +
        `${sw ? "Write it in Kiswahili." : "Write it in English."} ` +
        `Ground it only in real facts.${jd.trim() ? `\n\nJob description:\n${jd.trim().slice(0, 1500)}` : ""}${cvBlock}\n\n` +
        `Return only the letter body, no placeholders like [Your Name].`;
      const { message } = await apiClient.sendChatMessage([{ role: "user", content: prompt }]);
      setCoverLetter(message.trim());
      haptics.success();
    } catch {
      haptics.error();
      dialog.alert(t("Couldn't draft", "Imeshindwa kuandika"), t("Check your connection and try again.", "Angalia mtandao kisha ujaribu tena."));
    } finally {
      setDrafting(false);
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
    <Screen scroll keyboardAvoiding contentContainerStyle={{ gap: 14, paddingBottom: 40 }}>
      <ScreenTitle>{isNew ? t("New application", "Ombi jipya") : role || t("Application", "Ombi")}</ScreenTitle>

      <TextField label={t("Role / job title", "Cheo / jina la kazi")} value={role} onChangeText={setRole} placeholder="Warehouse Supervisor" />
      <TextField label={t("Company", "Kampuni")} value={company} onChangeText={setCompany} placeholder="Brookside" />
      <TextField label={t("Location", "Eneo")} value={location} onChangeText={setLocation} placeholder="Nairobi" />
      <TextField label={t("Job link (optional)", "Kiungo cha ajira (si lazima)")} value={jobUrl} onChangeText={setJobUrl} autoCapitalize="none" keyboardType="url" />

      {/* Status */}
      <View style={{ gap: 6 }}>
        <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "700" }}>{t("STATUS", "HALI")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
          {STATUS_ORDER.map((s) => {
            const active = status === s;
            return (
              <Pressable
                key={s}
                onPress={() => { haptics.selection(); setStatus(s); }}
                style={{
                  paddingVertical: 7, paddingHorizontal: 12, borderRadius: 9, borderWidth: 1.5,
                  borderColor: active ? c.accent : c.border, backgroundColor: active ? c.accent + "14" : "transparent",
                }}
              >
                <Text style={{ color: active ? c.accent : c.textBody, fontSize: 12.5, fontWeight: "700" }}>
                  {sw ? STATUS_META[s].sw : STATUS_META[s].en}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* JD */}
      <TextField
        label={t("Job description", "Maelezo ya ajira")}
        value={jd}
        onChangeText={setJd}
        multiline
        numberOfLines={5}
        inputStyle={{ minHeight: 110, textAlignVertical: "top" }}
        placeholder={t("Paste it here — used for the fit score and the cover letter.", "Bandika hapa — inatumika kwa ulinganifu na barua.")}
      />

      {/* CV link + fit */}
      <View style={{ gap: 6 }}>
        <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "700" }}>{t("TAILORED CV", "CV ILIYOSAWAZISHWA")}</Text>
        {cvs.length === 0 ? (
          <Text style={{ color: c.textMuted, fontSize: 12 }}>{t("No CVs yet.", "Hakuna CV bado.")}</Text>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
            {cvs.map((cv) => {
              const active = cvId === cv.id;
              return (
                <Pressable
                  key={cv.id}
                  onPress={() => { haptics.selection(); setCvId(active ? undefined : cv.id); }}
                  style={{
                    paddingVertical: 7, paddingHorizontal: 12, borderRadius: 9, borderWidth: 1.5,
                    borderColor: active ? c.accent : c.border, backgroundColor: active ? c.accent + "14" : "transparent",
                  }}
                >
                  <Text style={{ color: active ? c.accent : c.textBody, fontSize: 12.5, fontWeight: "700" }} numberOfLines={1}>
                    {cv.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
        {typeof fitScore === "number" && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ color: fitScore >= 60 ? c.success : c.warning, fontSize: 18, fontWeight: "800" }}>{fitScore}%</Text>
            <Text style={{ color: c.textMuted, fontSize: 12, flex: 1 }}>
              {t("keyword match with the job description", "ulinganifu wa maneno na maelezo ya ajira")}
            </Text>
            {linkedCv && (
              <Pressable onPress={() => navigation.navigate("AtsChecker", { cvId: linkedCv.id })}>
                <Text style={{ color: c.accent, fontSize: 12, fontWeight: "700" }}>{t("Details", "Zaidi")}</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Cover letter */}
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ flex: 1, color: c.textMuted, fontSize: 12, fontWeight: "700" }}>{t("COVER LETTER", "BARUA YA MAOMBI")}</Text>
          <Pressable onPress={draftCoverLetter} disabled={drafting} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <SumaiyaMark size={13} state="static" color={c.accent} />
            <Text style={{ color: c.accent, fontSize: 12.5, fontWeight: "700" }}>
              {drafting ? t("Drafting…", "Inaandika…") : t("Draft with Sumaiya", "Andika na Sumaiya")}
            </Text>
          </Pressable>
        </View>
        <TextField
          value={coverLetter}
          onChangeText={setCoverLetter}
          multiline
          numberOfLines={8}
          inputStyle={{ minHeight: 160, textAlignVertical: "top" }}
          placeholder={t("Write it, or let Sumaiya draft it from the job + your CV.", "Iandike, au acha Sumaiya aiandike kutoka ajira + CV yako.")}
        />
        {coverLetter.trim().length > 0 && (
          <Pressable
            onPress={() => Share.share({ message: coverLetter })}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" }}
          >
            <Icon name="share-2" size={13} color={c.textMuted} />
            <Text style={{ color: c.textMuted, fontSize: 12.5 }}>{t("Share / copy", "Shiriki / nakili")}</Text>
          </Pressable>
        )}
      </View>

      <TextField
        label={t("Notes", "Maelezo")}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        inputStyle={{ minHeight: 70, textAlignVertical: "top" }}
        placeholder={t("Recruiter name, deadline, follow-up date…", "Jina la mwajiri, tarehe ya mwisho, tarehe ya kufuatilia…")}
      />

      <Animated.View entering={FadeIn} style={{ gap: 10, marginTop: 6 }}>
        <Button label={saving ? t("Saving…", "Inahifadhi…") : t("Save", "Hifadhi")} onPress={save} loading={saving} disabled={!canSave} />
        {!isNew && (
          <Button label={t("Delete", "Futa")} variant="ghost" onPress={confirmDelete} />
        )}
      </Animated.View>
    </Screen>
  );
}
