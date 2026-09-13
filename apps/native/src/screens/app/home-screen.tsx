import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { CV } from "@sumaiya/types";
import type { JobRecommendation, MobileSignal } from "@sumaiya/api-client";
import { signalAction, signalText } from "../../lib/signal-actions";
import { apiClient } from "../../lib/api-client";
import { useCvs } from "../../hooks/use-cvs";
import { useAuthContext } from "../../contexts/auth-context";
import { useLang, type Lang } from "../../lib/i18n";
import { GUIDES } from "../../lib/guides";
import { relativeDate } from "../../lib/relative-date";
import {
  Card,
  Screen,
  ScreenTitle,
  SectionHeader,
  SkeletonCard,
  Stagger,
  haptics,
  useThemeColors,
} from "../../components/ui";
import { Icon } from "../../components/icon";
import { TemplateGallery } from "../../components/cv/template-gallery";
import { TemplateThumb } from "../../components/cv/template-thumb";
import { ALL_TEMPLATES, ENGINE_TEMPLATES, templateLayout, type CvTemplateId } from "../../lib/cv-html";
import { getDefaultTemplate, setDefaultTemplate } from "../../lib/prefs";
import { SumaiyaMark } from "../../components/sumaiya-mark";
import type { HomeScreenProps } from "../../navigation/types";

// One shared horizontal margin (Screen pads 20 each side) → every block on this
// screen spans exactly the same width. Quick-action cards are sized to fill the
// row with the 12px gutter, so the grid's right edge lines up with everything
// else.
const GUTTER = 12;
const SIDE = 20;

// A few natural variants per time-of-day bucket instead of one fixed phrase
// repeated on every single visit — the same phrase every evening, forever,
// reads robotic rather than like a warm greeting. The pick is stable for the
// whole day (keyed on the date, not random per render) so it never flickers
// between variants on a re-render or a pull-to-refresh within the same day.
const GREETINGS: Record<Lang, string[][]> = {
  sw: [
    ["Habari za asubuhi", "Habari za leo asubuhi"], // < 12:00
    ["Habari za mchana", "Habari za leo"], // < 16:00
    ["Habari za jioni", "Karibu jioni hii"], // < 21:00
    ["Habari za usiku", "Karibu tena"], // >= 21:00
  ],
  en: [
    ["Good morning", "Morning"],
    ["Good afternoon", "Afternoon"],
    ["Good evening", "Evening"],
    ["Good evening", "Welcome back"],
  ],
};

function greeting(lang: Lang): string {
  const h = new Date().getHours();
  const bucket = h < 12 ? 0 : h < 16 ? 1 : h < 21 ? 2 : 3;
  const variants = GREETINGS[lang][bucket];
  const pick = new Date().getDate() % variants.length;
  return variants[pick];
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const c = useThemeColors();
  const { user } = useAuthContext();
  const { t, lang } = useLang();
  const { cvs, loading, error, loadCVs } = useCvs();
  const [refreshing, setRefreshing] = React.useState(false);
  // Live, not a module-level Dimensions.get() snapshot — a foldable's window
  // width changes on fold/unfold without an app restart, and a stale value
  // here would keep laying out phone-width tiles on a now-tablet-width screen.
  const { width: winWidth } = useWindowDimensions();
  const COL_W = (winWidth - SIDE * 2 - GUTTER) / 2;

  // ── TemplateHub ────────────────────────────────────────────────────────────
  // Every design lives here. The dashboard shows one teaser — a single thumb
  // per layout family, so the strip reads as "there are different kinds of
  // design", not as five random swatches — and the full gallery opens from it.
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [defaultTemplate, setDefaultTemplateId] = useState<CvTemplateId | null>(null);
  useEffect(() => {
    let alive = true;
    getDefaultTemplate().then((id) => { if (alive) setDefaultTemplateId(id); });
    return () => { alive = false; };
  }, []);

  const hubTeaser = useMemo(() => {
    const seen = new Set<string>();
    const out: typeof ALL_TEMPLATES = [];
    // Engine templates only, so all five layout families are represented — the
    // original six would otherwise claim a slot and hide a whole family.
    for (const tpl of ENGINE_TEMPLATES) {
      const family = templateLayout(tpl.id);
      if (seen.has(family)) continue;
      seen.add(family);
      out.push(tpl);
      if (out.length === 5) break;
    }
    return out;
  }, []);

  const chooseTemplate = (id: CvTemplateId) => {
    setDefaultTemplateId(id);
    void setDefaultTemplate(id);
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    try {
      await loadCVs?.();
    } finally {
      setRefreshing(false);
    }
  }, [loadCVs]);

  const recent = useMemo(
    () =>
      [...cvs]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3),
    [cvs],
  );

  // Top job matches for the profile — best-effort, silent on failure.
  const [jobRecs, setJobRecs] = useState<JobRecommendation[]>([]);
  useEffect(() => {
    let alive = true;
    apiClient.getJobRecommendations(3).then((r) => { if (alive) setJobRecs(r); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Proactive nudges from Sumaiya (deterministic signal engine, server-side).
  // Refreshed every time the tab regains focus so it reflects the latest state.
  const [signals, setSignals] = useState<MobileSignal[]>([]);
  useFocusEffect(
    React.useCallback(() => {
      let alive = true;
      apiClient.getSignals().then((s) => { if (alive) setSignals(s); }).catch(() => {});
      return () => { alive = false; };
    }, []),
  );
  const topSignal = signals[0] ?? null;

  const rawName = user?.name?.trim();
  const looksLikeDevice = rawName
    ? /^(hisense|samsung|xiaomi|infinix|tecno|itel|oppo|vivo|realme|nokia|huawei|redmi|android|iphone|ipad|roku|tv)\b/i.test(rawName) ||
      /^[a-z0-9]{1,4}$/i.test(rawName)
    : false;
  const name = rawName && !looksLikeDevice ? rawName : user?.email?.split("@")[0] || t("there", "rafiki");

  const quickActions = [
    { icon: "sumaiya", label: t("Ask me", "Niulize"), tint: c.accent, onPress: () => navigation.navigate("SumaiyaTab") },
    { icon: "target", label: t("New openings", "Nafasi mpya"), tint: "#12433D", onPress: () => navigation.navigate("Jobs") },
    { icon: "shield-check", label: t("ATS check", "Ukaguzi wa ATS"), tint: c.success, onPress: () => navigation.navigate("AtsChecker") },
    { icon: "briefcase", label: t("Applications", "Maombi"), tint: c.accent, onPress: () => navigation.navigate("Applications") },
    // Cover letters were only reachable buried inside the job-tailor flow or a
    // chat quick-action seed — no direct entry point at all. This opens the
    // same generator (JobApply) with its cv/letter/both toggle pre-set to
    // "letter" instead of the generic default, so tapping this feels like a
    // purpose-built cover-letter feature, not a detour through job matching.
    { icon: "mail", label: t("Cover letter", "Barua ya maombi"), tint: c.warning, onPress: () => navigation.navigate("JobApply", { want: "letter" }) },
    // Import already has its own dedicated tab — a Home tile duplicated it.
    // Removing it also brings the grid to a clean 6 tiles (2x3/3x2), not 7.
    { icon: "book-open", label: t("Add skills", "Ongeza ujuzi"), tint: c.warning, onPress: () => navigation.navigate("LearningHub") },
  ];

  return (
    <Screen scroll keyboardAvoiding={false} contentContainerStyle={{ gap: 24 }} refreshing={refreshing} onRefresh={onRefresh}>
      <ScreenTitle eyebrow={`${greeting(lang)},`}>{name}</ScreenTitle>

      {/* Primary row — two equal tiles: the count, and the make-a-CV CTA. */}
      <Animated.View entering={FadeInDown.duration(320).delay(60)} style={{ flexDirection: "row", gap: GUTTER }}>
        <Card
          onPress={() => navigation.navigate("CVsTab")}
          accessibilityLabel={t("View my CVs", "Ona CV zangu")}
          style={{ width: COL_W, minHeight: 116, justifyContent: "space-between" }}
        >
          <Icon name="file-text" size={18} color={c.accent} />
          <View>
            <Text style={{ color: c.text, fontSize: 26, fontWeight: "800" }}>{cvs.length}</Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>{t("Your CVs", "CV zako")}</Text>
          </View>
        </Card>

        <Card
          onPress={() => navigation.navigate("CVsTab", { screen: "CvEditor", params: { nonce: String(Date.now()) } })}
          accessibilityLabel={t("New CV", "CV mpya")}
          style={{
            width: COL_W,
            minHeight: 116,
            justifyContent: "space-between",
            backgroundColor: c.accent,
            borderColor: "transparent",
          }}
        >
          <Icon name="plus" size={18} color={c.accentText} />
          <View>
            <Text style={{ color: c.accentText, fontSize: 18, fontWeight: "800" }}>{t("New CV", "CV mpya")}</Text>
            <Text style={{ color: c.accentText, opacity: 0.9, fontSize: 12, fontWeight: "600", marginTop: 1 }}>
              {t("Start from scratch", "Anza upya")} →
            </Text>
          </View>
        </Card>
      </Animated.View>

      {/* TemplateHub — the home for every design. */}
      <Animated.View entering={FadeInDown.duration(320).delay(90)}>
        <SectionHeader title="TemplateHub" />
        <Card
          onPress={() => {
            haptics.selection();
            setGalleryOpen(true);
          }}
          accessibilityLabel={t("Open TemplateHub", "Fungua TemplateHub")}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: "800" }}>
                {t(`${ALL_TEMPLATES.length} designs`, `Miundo ${ALL_TEMPLATES.length}`)}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>
                {t("Free and premium. Pick your look.", "Bure na premium. Chagua muonekano wako.")}
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color={c.textMuted} />
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            {hubTeaser.map((tpl) => (
              <View key={tpl.id} style={{ alignItems: "center", gap: 4 }}>
                <TemplateThumb id={tpl.id} accent={c.accent} width={46} />
                <Text
                  numberOfLines={1}
                  style={{ color: c.textMuted, fontSize: 8.5, fontWeight: "700", maxWidth: 50 }}
                >
                  {lang === "sw" ? tpl.name.sw : tpl.name.en}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </Animated.View>

      {/* Quick actions — a 2-column grid that fills the row exactly. */}
      <Animated.View entering={FadeInDown.duration(320).delay(120)}>
        <SectionHeader title={t("Quick actions", "Shughuli za haraka")} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GUTTER }}>
          {quickActions.map((a, i) => (
            <Stagger key={a.label} index={i} step={45}>
              <Card onPress={a.onPress} style={{ width: COL_W, alignItems: "flex-start", gap: 10 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: a.tint + "1f",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {a.icon === "sumaiya" ? (
                    <SumaiyaMark size={19} color={a.tint} state="static" />
                  ) : (
                    <Icon name={a.icon} size={19} color={a.tint} />
                  )}
                </View>
                <Text style={{ color: c.text, fontSize: 14.5, fontWeight: "700" }}>{a.label}</Text>
              </Card>
            </Stagger>
          ))}
        </View>
      </Animated.View>

      {/* From Sumaiya — a live proactive nudge when the signal engine has one,
          otherwise a free guide rotated daily. Same slot, same treatment. */}
      {(() => {
        const st = topSignal ? signalText(topSignal, lang) : null;
        const act = topSignal ? signalAction(topSignal, lang) : null;
        const freeGuides = GUIDES.filter((g) => g.tier === "free");
        const tip = freeGuides[Math.floor(Date.now() / 86_400_000) % freeGuides.length];

        const onPress = () => {
          if (topSignal && act) {
            (navigation.navigate as (screen: string, params?: Record<string, unknown>) => void)(
              act.target.screen,
              act.target.params,
            );
          } else {
            navigation.navigate("Guide", { id: tip.id });
          }
        };

        return (
          <Animated.View entering={FadeInDown.duration(320).delay(160)}>
            <Card
              onPress={onPress}
              accessibilityLabel={st ? st.title : tip.title[lang]}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                backgroundColor: c.accent + "12",
                borderColor: c.accent + "2a",
              }}
            >
              <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: c.accent + "22", alignItems: "center", justifyContent: "center" }}>
                <SumaiyaMark size={18} state="static" color={c.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" }}>
                  {topSignal ? t("From me", "Kutoka kwangu") : t("A tip from me", "Kidokezo changu")}
                </Text>
                <Text style={{ color: c.text, fontSize: 14, fontWeight: "700", marginTop: 2 }} numberOfLines={2}>
                  {st ? st.title : tip.title[lang]}
                </Text>
                {st ? (
                  <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
                    {st.detail}
                  </Text>
                ) : null}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                {act ? (
                  <Text style={{ color: c.accent, fontSize: 12.5, fontWeight: "800" }}>{act.cta[lang]}</Text>
                ) : null}
                <Icon name="chevron-right" size={18} color={c.accent} />
              </View>
            </Card>
          </Animated.View>
        );
      })()}

      {/* Jobs matched to the profile */}
      {jobRecs.length > 0 ? (
        <Animated.View entering={FadeInDown.duration(320).delay(170)}>
          <SectionHeader
            title={t("New openings", "Nafasi mpya")}
            actionLabel={t("See all", "Ona zote")}
            onAction={() => navigation.navigate("Jobs")}
          />
          <View style={{ gap: 10 }}>
            {jobRecs.slice(0, 2).map((r) => {
              const tone = r.score >= 60 ? c.success : r.score >= 35 ? c.warning : c.textMuted;
              return (
                <Card
                  key={r.jobId}
                  onPress={() => navigation.navigate("Jobs")}
                  accessibilityLabel={r.job.title}
                  style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: c.text, fontSize: 14.5, fontWeight: "700" }} numberOfLines={1}>{r.job.title}</Text>
                    <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                      {[r.job.company, r.job.location].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: tone + "1f", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
                    <Icon name="target" size={11} color={tone} />
                    <Text style={{ color: tone, fontSize: 11.5, fontWeight: "800" }}>{r.score}%</Text>
                  </View>
                </Card>
              );
            })}
          </View>
        </Animated.View>
      ) : null}

      {/* Recent CVs */}
      <Animated.View entering={FadeInDown.duration(320).delay(180)}>
        <SectionHeader
          title={t("Recent", "Za hivi karibuni")}
          actionLabel={cvs.length > 3 ? t("View all", "Ona zote") : undefined}
          onAction={() => navigation.navigate("CVsTab")}
        />

        {loading && cvs.length === 0 ? (
          <View style={{ gap: 10 }}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : error && cvs.length === 0 ? (
          // The CV list screen was fixed to stop claiming "no CVs" when the real
          // problem is an unreachable server — this screen kept the data-loss
          // illusion. On a fresh install, offline, it told a user with CVs on the
          // server that they had none.
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.bgElevated,
            }}
          >
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: c.warning + "14", alignItems: "center", justifyContent: "center" }}>
              <Icon name="alert-circle" size={18} color={c.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 14.5, fontWeight: "700" }}>
                {t("Couldn't load your CVs", "Imeshindwa kupakia CV zako")}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 12.5, marginTop: 2 }} numberOfLines={2}>
                {t(
                  "Your CVs are safe on your account — we just couldn't reach the server.",
                  "CV zako ziko salama kwenye akaunti yako — tumeshindwa kufikia server.",
                )}
              </Text>
            </View>
            <Pressable
              onPress={onRefresh}
              accessibilityRole="button"
              accessibilityLabel={t("Try again", "Jaribu tena")}
              hitSlop={10}
            >
              <Text style={{ color: c.accent, fontSize: 12.5, fontWeight: "800" }}>{t("Try again", "Jaribu tena")}</Text>
            </Pressable>
          </View>
        ) : recent.length === 0 ? (
          // Inline, card-shaped, same width and rhythm as everything else — not a
          // full-screen hero. The "New CV" tile above and the "Import a CV" quick
          // action already carry the CTAs, so this just names the empty state.
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: c.border,
              borderStyle: "dashed",
              backgroundColor: c.bgElevated,
            }}
          >
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: c.accent + "14", alignItems: "center", justifyContent: "center" }}>
              <Icon name="file-text" size={18} color={c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 14.5, fontWeight: "700" }}>
                {t("No CVs yet", "Bado hakuna CV")}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 12.5, marginTop: 2 }} numberOfLines={2}>
                {t("Your CVs will show here once you build or import one.", "CV zako zitaonekana hapa mara utakapotengeneza au kupakia.")}
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {recent.map((cv: CV, i) => (
              <Stagger key={cv.id} index={i}>
                <Card
                  onPress={() =>
                    navigation.navigate("CVsTab", { screen: "CvEditor", params: { templateId: cv.templateId, cvId: cv.id } })
                  }
                  style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
                >
                  <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: c.accent + "14", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="file-text" size={19} color={c.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 15, fontWeight: "700" }} numberOfLines={1}>
                      {cv.title}
                    </Text>
                    <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>
                      {relativeDate(cv.updatedAt, lang)}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={18} color={c.textMuted} />
                </Card>
              </Stagger>
            ))}
          </View>
        )}
      </Animated.View>

      {/* The full gallery: searchable, filterable, virtualised. */}
      <TemplateGallery
        visible={galleryOpen}
        selected={defaultTemplate ?? undefined}
        onSelect={chooseTemplate}
        onClose={() => setGalleryOpen(false)}
      />
    </Screen>
  );
}
