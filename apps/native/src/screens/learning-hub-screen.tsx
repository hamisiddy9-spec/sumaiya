import React, { useCallback, useMemo, useState } from "react";
import { Linking, Pressable, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Animated, { FadeIn } from "react-native-reanimated";
import type { CVData } from "@sumaiya/types";
import type { JobRecommendation } from "@sumaiya/api-client";
import { apiClient } from "../lib/api-client";
import { useCvs } from "../hooks/use-cvs";
import { loadProfile, saveProfile, type CareerProfile } from "../lib/profile-store";
import { computeSkillGaps, type GapResult, type SkillGap } from "../lib/skill-gaps";
import { getSkillProgress, setSkillState, type SkillState } from "../lib/course-progress";
import { Button, Card, EmptyState, ProgressBar, Screen, SkeletonCard, Stagger, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";
import { SumaiyaMark } from "../components/sumaiya-mark";
import { useLang } from "../lib/i18n";
import { GUIDES } from "../lib/guides";
import { useEntitlements } from "../lib/entitlements";
import type { LearningHubScreenProps } from "../navigation/types";

const PRIORITY_TONE = (c: ReturnType<typeof useThemeColors>) => ({
  high: c.error,
  medium: c.warning,
  low: c.textMuted,
});

function Chips({ items, color }: { items: { en: string; sw: string }[]; color: string }) {
  const c = useThemeColors();
  const { lang } = useLang();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {items.map((s) => (
        <View key={s.en} style={{ backgroundColor: color + "16", borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ color, fontSize: 11, fontWeight: "700" }}>{lang === "sw" ? s.sw : s.en}</Text>
        </View>
      ))}
    </View>
  );
}

function GapCard({
  gap,
  state,
  onLearn,
  onPractise,
  onCanDo,
  onLearning,
}: {
  gap: SkillGap;
  state?: SkillState;
  onLearn: () => void;
  onPractise: () => void;
  onCanDo: () => void;
  onLearning: () => void;
}) {
  const c = useThemeColors();
  const { lang, t } = useLang();
  const tone = PRIORITY_TONE(c)[gap.priority];
  const { area } = gap;
  const co = area.course;
  const priLabel = { high: t("High", "Juu"), medium: t("Medium", "Kati"), low: t("Low", "Chini") }[gap.priority];

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tone }} />
        <Text style={{ color: c.text, fontSize: 15.5, fontWeight: "800", flex: 1 }}>{area.skill[lang]}</Text>
        {state === "can-do" ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Icon name="check-circle" size={14} color={c.success} />
            <Text style={{ color: c.success, fontSize: 11.5, fontWeight: "800" }}>{t("On your CV", "Kwenye CV yako")}</Text>
          </View>
        ) : state === "learning" ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Icon name="book-open" size={13} color={c.accent} />
            <Text style={{ color: c.accent, fontSize: 11.5, fontWeight: "800" }}>{t("Learning", "Ninajifunza")}</Text>
          </View>
        ) : (
          <Text style={{ color: tone, fontSize: 11.5, fontWeight: "800" }}>{priLabel}</Text>
        )}
      </View>

      <Text style={{ color: c.textBody, fontSize: 13, lineHeight: 19 }}>{gap.reason[lang]}</Text>

      {/* the one course */}
      <View style={{ backgroundColor: c.bg, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 12, gap: 8 }}>
        <Text style={{ color: c.text, fontSize: 14, fontWeight: "700" }}>{co.title}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: "700" }}>{co.provider}</Text>
          <View style={{ backgroundColor: c.success + "1f", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ color: c.success, fontSize: 10, fontWeight: "800" }}>{co.free ? t("FREE", "BURE") : t("PAID", "MALIPO")}</Text>
          </View>
          <Text style={{ color: c.textMuted, fontSize: 11.5 }}>~{co.durationWeeks} {t("wks", "wiki")}</Text>
        </View>
        <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 17 }}>
          <Text style={{ fontWeight: "800" }}>{t("Why", "Kwa nini")}: </Text>
          {lang === "sw" ? co.whySw : co.whyEn}
        </Text>
        <Chips items={co.improves} color={c.accent} />
      </View>

      {area.fastPath ? (
        <Pressable onPress={() => Linking.openURL(area.fastPath!.url).catch(() => {})} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Icon name="play-circle" size={14} color={c.accent} />
          <Text style={{ color: c.accent, fontSize: 12.5, fontWeight: "700" }}>{area.fastPath.label[lang]}</Text>
        </Pressable>
      ) : null}

      {/* actions */}
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Button label={t("Learn", "Jifunze")} size="sm" variant="secondary" rightIcon={<Icon name="external-link" size={13} color={c.text} />} onPress={onLearn} />
          </View>
          {area.practice.length ? (
            <View style={{ flex: 1 }}>
              <Button label={t("Practise this skill", "Zoeza ujuzi huu")} size="sm" onPress={onPractise} />
            </View>
          ) : null}
        </View>
        {state !== "can-do" ? (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={onCanDo} style={{ flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 10, borderWidth: 1, borderColor: c.success + "55" }}>
              <Text style={{ color: c.success, fontSize: 12, fontWeight: "800" }}>{t("I can do this — add", "Naweza — ongeza")}</Text>
            </Pressable>
            {state !== "learning" ? (
              <Pressable onPress={onLearning} style={{ flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 10, borderWidth: 1, borderColor: c.border }}>
                <Text style={{ color: c.textBody, fontSize: 12, fontWeight: "700" }}>{t("Mark as learning", "Weka ninajifunza")}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </Card>
  );
}

export function LearningHubScreen({ navigation }: LearningHubScreenProps) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const { premium } = useEntitlements();
  const { cvs } = useCvs();

  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [jobs, setJobs] = useState<JobRecommendation[]>([]);
  const [progress, setProgress] = useState<Record<string, SkillState>>({});
  const [loading, setLoading] = useState(true);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [catalogue, setCatalogue] = useState<{ id: string; title: string; platform: string; url: string; free: boolean }[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  const latestCv: CVData | null = useMemo(() => {
    const sorted = [...cvs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return (sorted[0]?.data as CVData) ?? null;
  }, [cvs]);

  const load = useCallback(async () => {
    try {
      const [p, j, pr] = await Promise.all([loadProfile(), apiClient.getJobRecommendations(10), getSkillProgress()]);
      setProfile(p);
      setJobs(j);
      setProgress(pr);
      setLoadError(false);
    } catch {
      // No catch here used to mean an offline getJobRecommendations() left
      // `profile` at its initial null — which renders the "Finish your
      // profile" prompt below, falsely telling a user with a complete
      // profile that it's incomplete when the real problem was the fetch.
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const result: GapResult | null = useMemo(() => {
    if (!profile) return null;
    return computeSkillGaps({ profile, cv: latestCv, jobs, lang });
  }, [profile, latestCv, jobs, lang]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const addSkillToCv = async (label: string, skillId: string) => {
    haptics.success();
    setProgress((p) => ({ ...p, [skillId]: "can-do" }));
    await setSkillState(skillId, "can-do");
    if (profile) {
      const have = profile.skills.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
      if (!have.some((s) => s.toLowerCase() === label.toLowerCase())) {
        const next = { ...profile, skills: [...have, label].join(", ") };
        const { updatedAt, ...rest } = next;
        await saveProfile(rest);
        setProfile(next);
      }
    }
    flash(t(`Added "${label}" — your match may improve.`, `"${label}" imeongezwa — ulinganifu wako unaweza kupanda.`));
  };

  const markLearning = async (skillId: string) => {
    haptics.selection();
    setProgress((p) => ({ ...p, [skillId]: "learning" }));
    await setSkillState(skillId, "learning");
  };

  const practise = (gap: SkillGap) => {
    const p = gap.area.practice[0];
    if (!p) return;
    const seed = (lang === "sw" ? p.sw : p.en).replace("[job]", result?.target || t("this job", "ajira hii"));
    navigation.navigate("SumaiyaTab", { seed });
  };

  const openExplore = useCallback(async () => {
    setExploreOpen(true);
    if (catalogue.length) return;
    try {
      setCatalogue(await apiClient.getLearningResources());
    } catch {
      /* ignore — curated list is the point anyway */
    }
  }, [catalogue.length]);

  const exploreFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogue.filter((r) => (freeOnly ? r.free : true) && (!q || r.title.toLowerCase().includes(q) || r.platform.toLowerCase().includes(q)));
  }, [catalogue, query, freeOnly]);

  const gaps = (result?.gaps ?? []).filter((g) => progress[g.area.id] !== "can-do").slice(0, 5);
  const strengths = result?.strengths ?? [];

  return (
    <Screen scroll keyboardAvoiding={false} contentContainerStyle={{ gap: 20 }}>
      <Pressable
        hitSlop={10}
        onPress={() => { haptics.selection(); navigation.goBack(); }}
        style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}
      >
        <Icon name="arrow-left" size={18} color={c.accent} />
        <Text style={{ color: c.accent, fontWeight: "700" }}>{t("Back", "Rudi")}</Text>
      </Pressable>

      <View>
        <Text style={{ color: c.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 }}>
          {t("Learning hub", "Kituo cha kujifunza")}
        </Text>
        <Text style={{ color: c.textBody, fontSize: 14, marginTop: 6 }}>
          {t("Build the skills that move your career forward.", "Jenga ujuzi unaosukuma kazi yako mbele.")}
        </Text>
      </View>

      {toast ? (
        <Animated.View entering={FadeIn} style={{ backgroundColor: c.success + "1a", borderRadius: 12, borderWidth: 1, borderColor: c.success + "40", padding: 12, flexDirection: "row", gap: 8, alignItems: "center" }}>
          <Icon name="check-circle" size={16} color={c.success} />
          <Text style={{ color: c.text, fontSize: 12.5, flex: 1 }}>{toast}</Text>
        </Animated.View>
      ) : null}

      {loading ? (
        <View style={{ gap: 10 }}><SkeletonCard /><SkeletonCard /></View>
      ) : (
        <>
          {/* target + readiness */}
          {loadError && !result ? (
            <Pressable
              onPress={() => void load()}
              style={{ flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: c.error + "10", borderWidth: 1, borderColor: c.error + "24", borderRadius: 12, padding: 14 }}
            >
              <Icon name="alert-circle" size={18} color={c.error} />
              <Text style={{ flex: 1, color: c.textBody, fontSize: 12.5, lineHeight: 18 }}>
                {t("Couldn't load your skill gaps. Check your connection and tap to retry.", "Imeshindwa kupakia mapungufu ya ujuzi wako. Angalia mtandao kisha ugusa ili ujaribu tena.")}
              </Text>
            </Pressable>
          ) : result?.target ? (
            <View style={{ backgroundColor: c.bgElevated, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 14, gap: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>
                  {t("Skills for", "Ujuzi wa")} <Text style={{ color: c.text, fontWeight: "800" }}>{result.target}</Text>
                </Text>
                <Text style={{ color: c.text, fontSize: 13, fontWeight: "800" }}>{result.readiness}% {t("ready", "tayari")}</Text>
              </View>
              <ProgressBar
                value={Math.max(0.04, result.readiness / 100)}
                tone={result.readiness >= 60 ? "success" : result.readiness >= 30 ? "warning" : "accent"}
              />
            </View>
          ) : (
            <Pressable
              onPress={() => navigation.navigate("Jobs")}
              style={{ flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: c.accent + "10", borderWidth: 1, borderColor: c.accent + "24", borderRadius: 12, padding: 14 }}
            >
              <SumaiyaMark size={18} state="static" color={c.accent} />
              <Text style={{ flex: 1, color: c.textBody, fontSize: 12.5, lineHeight: 18 }}>
                {t("Finish your profile and Sumaiya will show the exact skills to build for the jobs you want.", "Kamilisha wasifu wako na Sumaiya atakuonyesha ujuzi hasa wa kujenga kwa kazi unazotaka.")}
              </Text>
            </Pressable>
          )}

          {/* YOUR NEXT SKILLS */}
          {gaps.length > 0 ? (
            <View style={{ gap: 12 }}>
              <Text style={{ color: c.textMuted, fontSize: 12.5, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" }}>
                {t("Your next skills", "Ujuzi wako unaofuata")}
              </Text>
              {gaps.map((g, i) => (
                <Stagger key={g.area.id} index={i} step={40}>
                  <GapCard
                    gap={g}
                    state={progress[g.area.id]}
                    onLearn={() => { haptics.light(); Linking.openURL(g.area.course.url).catch(() => {}); }}
                    onPractise={() => practise(g)}
                    onCanDo={() => void addSkillToCv(g.area.skill.en, g.area.id)}
                    onLearning={() => void markLearning(g.area.id)}
                  />
                </Stagger>
              ))}
            </View>
          ) : result ? (
            <View style={{ flexDirection: "row", gap: 10, alignItems: "center", padding: 14, borderRadius: 12, backgroundColor: c.success + "12", borderWidth: 1, borderColor: c.success + "2a" }}>
              <Icon name="check-circle" size={18} color={c.success} />
              <Text style={{ flex: 1, color: c.textBody, fontSize: 12.5 }}>
                {t("You're covering the main skills for your target. Keep an eye on new job matches.", "Unashughulikia ujuzi mkuu kwa lengo lako. Endelea kuangalia ajira mpya zinazolingana.")}
              </Text>
            </View>
          ) : null}

          {/* strengths */}
          {strengths.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>{t("You already show", "Tayari unaonyesha")}:</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {strengths.map((s) => (
                  <View key={s.id} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c.success + "16", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Icon name="check" size={11} color={c.success} />
                    <Text style={{ color: c.success, fontSize: 11.5, fontWeight: "700" }}>{s.skill[lang]}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* GUIDES */}
          <View style={{ gap: 10 }}>
            <Text style={{ color: c.textMuted, fontSize: 12.5, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" }}>
              {t("Guides from Sumaiya", "Miongozo ya Sumaiya")}
            </Text>
            {GUIDES.map((g, i) => {
              const locked = g.tier === "premium" && !premium;
              return (
                <Stagger key={g.id} index={i} step={30}>
                  <Pressable
                    onPress={() => { haptics.selection(); navigation.navigate("Guide", { id: g.id }); }}
                    style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.border }}
                  >
                    <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: c.accent + "16", alignItems: "center", justifyContent: "center" }}>
                      <Icon name={g.icon} size={18} color={c.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontSize: 14.5, fontWeight: "700" }}>{g.title[lang]}</Text>
                      <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>
                        {g.minutes} {t("min", "dakika")}{locked ? ` · ${t("Premium", "Premium")}` : ""}
                      </Text>
                    </View>
                    <Icon name={locked ? "arrow-right" : "chevron-right"} size={16} color={locked ? c.accent : c.textMuted} />
                  </Pressable>
                </Stagger>
              );
            })}
          </View>

          {/* EXPLORE ALL */}
          {!exploreOpen ? (
            <Pressable onPress={openExplore} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: "700" }}>{t("Explore all courses", "Chunguza kozi zote")}</Text>
              <Icon name="chevron-down" size={16} color={c.textMuted} />
            </Pressable>
          ) : (
            <View style={{ gap: 12 }}>
              <Text style={{ color: c.textMuted, fontSize: 12.5, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" }}>
                {t("Explore all courses", "Chunguza kozi zote")}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.bgElevated, borderWidth: 1.5, borderColor: c.border, borderRadius: 12, paddingHorizontal: 12 }}>
                <Icon name="search" size={16} color={c.textMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t("Search courses", "Tafuta kozi")}
                  placeholderTextColor={c.textMuted}
                  selectionColor={c.accent}
                  style={{ flex: 1, paddingVertical: 11, fontSize: 15, color: c.text }}
                />
              </View>
              <Pressable
                onPress={() => { haptics.selection(); setFreeOnly((v) => !v); }}
                style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5, borderColor: freeOnly ? c.accent : c.border, backgroundColor: freeOnly ? c.accent + "14" : "transparent" }}
              >
                {freeOnly ? <Icon name="check" size={13} color={c.accent} /> : null}
                <Text style={{ color: freeOnly ? c.accent : c.textBody, fontWeight: "700", fontSize: 12.5 }}>{t("Free only", "Za bure tu")}</Text>
              </Pressable>
              {exploreFiltered.length === 0 ? (
                <EmptyState icon="search" title={t("Nothing here yet", "Bado hakuna")} body={t("Try a different search.", "Jaribu utafutaji mwingine.")} />
              ) : (
                exploreFiltered.map((r) => (
                  <Card key={r.id} style={{ gap: 8 }}>
                    <Text style={{ color: c.text, fontSize: 14.5, fontWeight: "700" }}>{r.title}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ color: c.accent, fontSize: 12.5, fontWeight: "700" }}>{r.platform}</Text>
                      <View style={{ backgroundColor: (r.free ? c.success : c.warning) + "1f", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ color: r.free ? c.success : c.warning, fontSize: 10, fontWeight: "800" }}>{r.free ? t("FREE", "BURE") : t("PAID", "MALIPO")}</Text>
                      </View>
                    </View>
                    <Button label={t("Open course", "Fungua kozi")} variant="secondary" size="sm" rightIcon={<Icon name="external-link" size={13} color={c.text} />} onPress={() => Linking.openURL(r.url).catch(() => {})} />
                  </Card>
                ))
              )}
            </View>
          )}
        </>
      )}

    </Screen>
  );
}
