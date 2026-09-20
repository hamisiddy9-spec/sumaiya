import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { pickAndCompressPhoto, consumePendingOnboardingPhoto } from "../lib/pick-photo";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { useIsFocused } from "@react-navigation/native";
import { offlineStorage } from "@sumaiya/utils";
import { apiClient } from "../lib/api-client";
import { useOfflineSync } from "../hooks/use-offline-sync";
import { exportCVAsPDF } from "../services/pdf-export";
import { track, FUNNEL_EVENTS } from "../lib/analytics";
import { addEpisode, updateMemory } from "../lib/ai-memory";
import { shareCV } from "../services/share";
import type { CV, CVData, Education, Experience, PersonalInfo, Skill } from "@sumaiya/types";
import type { CvEditorScreenProps } from "../navigation/types";
import { Button, Screen, ScreenTitle, TextField, dialog, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";
import { useLang } from "../lib/i18n";
import { reportError } from "../lib/reporting";
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
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
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

export function CvEditorScreen({ route, navigation }: CvEditorScreenProps) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const { templateId, cvId: initialCvId, initialData } = route.params || {};
  const { status, queueOperation } = useOfflineSync();
  const insets = useSafeAreaInsets();
  const [showPreview, setShowPreview] = useState(false);
  const [accent, setAccent] = useState("#DA4A1C");
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

  /**
   * Unsaved-work guard for EVERY way out of this screen.
   *
   * This used to live only on the in-app "Back" link, so the Android system
   * back gesture — the way most people actually leave a screen — walked
   * straight past it and threw away a CV that had never been saved, with no
   * prompt. `beforeRemove` covers the in-app back link, a swipe-back and any
   * programmatic pop; the BackHandler below covers the hardware key.
   */
  /**
   * Set once the user has actually chosen "Discard", so the two guards below
   * stand down and let the screen go. Without it, the hardware-back path would
   * ask a second time: `goBack()` builds a fresh action, and a fresh action
   * re-triggers `beforeRemove`.
   */
  const leavingRef = useRef(false);

  /** One prompt, shared by every exit path. */
  const confirmDiscard = useCallback(
    (leave: () => void) => {
      leavingRef.current = false;
      dialog.alert(
        t("Discard changes?", "Utupe mabadiliko?"),
        t("Your edits aren't saved.", "Mabadiliko yako hayajahifadhiwa."),
        [
          { text: t("Keep editing", "Endelea kuhariri"), style: "cancel" },
          {
            text: t("Discard", "Tupa"),
            style: "destructive",
            onPress: () => {
              leavingRef.current = true;
              leave();
            },
          },
        ],
      );
    },
    [t],
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (!dirty || leavingRef.current) return;
      e.preventDefault();
      confirmDiscard(() => navigation.dispatch(e.data.action));
    });
    return unsubscribe;
  }, [navigation, dirty, confirmDiscard]);

  /**
   * The Android hardware back key / back gesture.
   *
   * A native-stack never raises `beforeRemove` for it, so the guard above was
   * blind to the single most-used way of leaving a screen: swipe back and an
   * unsaved CV vanished with no prompt. We claim the event here instead — but
   * only while this screen is the focused one, and never while a dialog is
   * already on screen (the dialog's own Modal handles back itself, and must not
   * be short-circuited).
   */
  const focused = useIsFocused();
  useEffect(() => {
    if (!focused) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!dirty || leavingRef.current || dialog.isOpen()) return false;
      haptics.warning();
      confirmDiscard(() => navigation.goBack());
      return true;
    });
    return () => sub.remove();
  }, [focused, dirty, confirmDiscard, navigation]);
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
            dialog.alert(t("Couldn't open that CV", "Imeshindwa kufungua CV hiyo"), t("Check your connection and try again.", "Angalia mtandao kisha ujaribu tena."));
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

  /**
   * Reset the form when the *identity* of what we're editing changes.
   *
   * React Navigation reuses a screen instance when you navigate to the route
   * that is already on top of the stack, so params can change underneath a
   * mounted component and its state survives. That is why tapping "New CV"
   * while a CV was already open showed the previous CV's content instead of a
   * blank form. `nonce` is bumped by every "New CV" entry point, so a fresh
   * tap is always a fresh form; opening a saved CV by id re-enters the loader.
   */
  const openKey = [
    initialCvId ?? "new",
    initialData ? "inline" : "none",
    route.params?.nonce ?? "",
  ].join(":");

  useEffect(() => {
    cvIdRef.current = initialCvId || uid();
    leavingRef.current = false;
    setDirty(false);
    setShowPreview(false);
    setSaving(false);
    setExporting(false);
    if (initialCvId && !initialData) {
      // Filled in by the fetch effect above; show the loader, never stale text.
      setData(emptyData());
      setLoadingCv(true);
    } else {
      setData(emptyData(initialData));
      setLoadingCv(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openKey]);

  const [skillInput, setSkillInput] = useState("");

  const patch = (p: Partial<CVData>) => {
    setData((d) => ({ ...d, ...p }));
    setDirty(true);
  };
  const patchPersonal = (k: keyof PersonalInfo, v: string) => {
    setData((d) => ({ ...d, personalInfo: { ...d.personalInfo, [k]: v } }));
    setDirty(true);
  };

  const [photoBusy, setPhotoBusy] = useState(false);
  const pickPhoto = async () => {
    haptics.light();
    setPhotoBusy(true);
    try {
      // A raw phone photo can be several MB — the CV document (synced,
      // rendered, PDF-exported) needs to stay small, so resize + compress
      // before embedding as base64, same shape web's editor already writes
      // to personalInfo.profilePhoto (mapped to/from web's "photo" field by
      // @sumaiya/utils' cv-shape converter).
      const photo = await pickAndCompressPhoto();
      if (photo) patchPersonal("profilePhoto", photo);
    } catch {
      haptics.error();
      dialog.alert(t("Couldn't use that photo", "Imeshindwa kutumia picha hiyo"), t("Try a different one.", "Jaribu nyingine."));
    } finally {
      setPhotoBusy(false);
    }
  };
  const removePhoto = () => {
    haptics.selection();
    patchPersonal("profilePhoto", "");
  };

  // A photo captured during first-run (before any CV existed to hold it)
  // waits in local storage until the user's first real CV is created — seed
  // it in here, once, only for a genuinely new/blank CV.
  useEffect(() => {
    if (initialCvId || initialData) return;
    let cancelled = false;
    consumePendingOnboardingPhoto().then((photo) => {
      if (!cancelled && photo) patchPersonal("profilePhoto", photo);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      dialog.alert(t("Add your name", "Weka jina lako"), t("A CV needs at least a full name.", "CV inahitaji angalau jina kamili."));
      return;
    }
    setSaving(true);
    const cv: CV = {
      id: cvIdRef.current,
      userId: "me",
      templateId: template,
      title: data.personalInfo.fullName || "My CV",
      data: data as CVData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // The local cache is the write that must not fail: once the CV is in it,
    // the list and home show it and it survives being offline or force-quit.
    // It used to be `.catch(() => {})`-swallowed, which is why a failing save
    // showed a generic "Couldn't save" with no way to tell what broke.
    let storedLocally = false;
    try {
      await offlineStorage.saveCVOffline(cv);
      storedLocally = true;
      track(FUNNEL_EVENTS.cvCreated, { template });
      // Let her learn from real activity, not only from the ATS screen.
      // Rebuilding a CV repeatedly is itself a signal worth noticing.
      updateMemory((m) =>
        addEpisode(m, "cv_rebuilt", `Rebuilt a CV using the ${template} template`),
      ).catch(() => {});
    } catch (error) {
      reportError(error, { scope: "cvEditor.save.local", cvId: cv.id });
    }

    try {
      // Write to the local cache first so the list/home reflect it immediately
      // and it survives being offline, then queue the push to the server.
      await queueOperation(initialCvId ? "update_cv" : "create_cv", cvIdRef.current, cv);
      haptics.success();
      setDirty(false);
    } catch (error) {
      reportError(error, { scope: "cvEditor.save.queue", cvId: cv.id });
      if (storedLocally) {
        // The CV is on the device and will be pushed by the next sync pass —
        // not worth interrupting the user for.
        haptics.success();
        setDirty(false);
      } else {
        // Last resort: the local cache itself is unavailable (SQLite failed to
        // open on this device), so the queue can't help either. Push straight to
        // the server so the CV the user just wrote isn't lost, and only fall
        // through to the error dialog if THAT fails too.
        try {
          if (initialCvId) await apiClient.updateCV(initialCvId, { ...cv });
          else await apiClient.createCV({ ...cv, clientId: cvIdRef.current });
          haptics.success();
          setDirty(false);
        } catch (apiError) {
          reportError(apiError, { scope: "cvEditor.save.server", cvId: cv.id });
          haptics.error();
          dialog.alert(
            t("Couldn't save this CV", "Imeshindwa kuhifadhi CV hii"),
            t(
              "Nothing was written to this device, so your edits are still here and nothing is lost. Try again.",
              "Hakuna kilichoandikwa kwenye kifaa hiki, kwa hivyo mabadiliko yako bado yapo na hakuna kilichopotea. Jaribu tena.",
            ),
            [
              { text: t("Keep editing", "Endelea kuhariri"), style: "cancel" },
              { text: t("Try again", "Jaribu tena"), onPress: () => void save() },
            ],
          );
        }
      }
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
      const uri = await exportCVAsPDF(cv, { accent, lang, template });
      haptics.success();
      track(FUNNEL_EVENTS.cvExported, { template });
      // An export is the moment a CV leaves the app to be sent to someone, so
      // it is the strongest signal we ever get that the person is actively
      // applying. Three of these across different days becomes a fact she can
      // coach from — "actively applying" — without ever being asked.
      updateMemory((m) =>
        addEpisode(m, "cv_exported", `Exported a CV using the ${template} template`),
      ).catch(() => {});
      await shareCV(cv, uri);
    } catch {
      haptics.error();
      dialog.alert(t("Export failed", "Kupakua kumeshindwa"), t("Try again in a moment.", "Jaribu tena baada ya muda."));
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
        <View style={{ flexDirection: "row", gap: 14 }}>
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
          // The unsaved-work prompt lives in the beforeRemove listener above, so
          // this path and the system back gesture behave identically.
          onPress={() => navigation.goBack()}
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
                <Text style={{ color: c.accent, fontSize: 12.5, fontWeight: "700" }}>{t("ATS", "Kagua CV")}</Text>
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
            initialColor={accent}
            onTemplateChange={(id) => { setTemplate(id); setDirty(true); }}
            onColorChange={(hex) => { setAccent(hex); setDirty(true); }}
          />
        </ScrollView>
      </Modal>

      {/* Personal */}
      <Section title={t("Personal details", "Maelezo binafsi")} icon="user" defaultOpen>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 4 }}>
          <Pressable onPress={pickPhoto} disabled={photoBusy} accessibilityRole="button" accessibilityLabel={data.personalInfo?.profilePhoto ? t("Change photo", "Badilisha picha") : t("Add profile photo", "Ongeza picha ya wasifu")} style={{ width: 64, height: 64, borderRadius: 32, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.border }}>
            {photoBusy ? (
              <ActivityIndicator color={c.accent} />
            ) : data.personalInfo?.profilePhoto ? (
              <Image source={{ uri: data.personalInfo.profilePhoto }} style={{ width: 64, height: 64 }} resizeMode="cover" />
            ) : (
              <Icon name="camera" size={22} color={c.textMuted} />
            )}
          </Pressable>
          <View style={{ flex: 1, gap: 4 }}>
            {/* One control, not two. The circle on the left already opens the
                picker; this text link repeated it verbatim ("Badilisha picha"
                over a photo that is itself tappable) — owner: "after adding
                photo the badilisha picha button i dont think is needed". It
                stays only while there is no photo, where the circle alone (a
                bare camera glyph) is not yet a discoverable target. */}
            {!data.personalInfo?.profilePhoto ? (
              <Pressable onPress={pickPhoto} disabled={photoBusy} hitSlop={6} accessibilityRole="button">
                <Text style={{ color: c.accent, fontSize: 13.5, fontWeight: "700" }}>
                  {t("Add profile photo", "Ongeza picha ya wasifu")}
                </Text>
              </Pressable>
            ) : null}
            {data.personalInfo?.profilePhoto ? (
              <Pressable onPress={removePhoto} hitSlop={6} accessibilityRole="button">
                <Text style={{ color: c.textMuted, fontSize: 12.5 }}>{t("Remove", "Ondoa")}</Text>
              </Pressable>
            ) : (
              <Text style={{ color: c.textMuted, fontSize: 12 }}>{t("Optional — only some templates show it.", "Si lazima — kwenye baadhi ya miundo tu.")}</Text>
            )}
          </View>
        </View>
        <TextField label={t("Full name", "Jina kamili")} value={data.personalInfo?.fullName || ""} onChangeText={(t) => patchPersonal("fullName", t)} autoCapitalize="words" />
        <TextField label={t("Headline", "Kichwa cha kazi")} placeholder={t("e.g. Software Engineer", "mf. Mhandisi wa Programu")} value={data.personalInfo?.headline || ""} onChangeText={(t) => patchPersonal("headline", t)} />
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
              <Pressable hitSlop={8} onPress={() => { haptics.warning(); patch({ experience: exp.filter((x) => x.id !== e.id) }); }} accessibilityRole="button" accessibilityLabel={t("Delete role", "Futa kazi")}>
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
              <Pressable hitSlop={8} onPress={() => { haptics.warning(); patch({ education: edu.filter((x) => x.id !== e.id) }); }} accessibilityRole="button" accessibilityLabel={t("Delete school", "Futa shule")}>
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
      <Section title={`${t("Skills", "Ujuzi")}${skills.length ? ` · ${skills.length}` : ""}`} icon="award" defaultOpen={skills.length > 0}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
          {skills.map((s) => (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              accessibilityLabel={`${t("Remove skill", "Ondoa ujuzi")}: ${s.name}`}
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
