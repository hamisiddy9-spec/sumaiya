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
import { useLang } from "../../lib/i18n";
import { GUIDES } from "../../lib/guides";
import { relativeDate } from "../../lib/relative-date";
import { cvErrorCopy } from "../../lib/cv-fetch-error";
import {
  Card,
  Screen,
  ScreenTitle,
  SectionHeader,
  Reveal,
  SkeletonList,
  Stagger,
  haptics,
  toast,
  useThemeColors,
} from "../../components/ui";
import { Icon } from "../../components/icon";
import { TemplateGallery } from "../../components/cv/template-gallery";
import { type CvTemplateId } from "../../lib/cv-html";
import { getDefaultTemplate, setDefaultTemplate } from "../../lib/prefs";
import { loadProfile } from "../../lib/profile-store";
import { recommendNextMoves, type NextMoves } from "../../lib/recommendations";
import { SumaiyaMark } from "../../components/sumaiya-mark";
import type { HomeScreenProps } from "../../navigation/types";
// The greeting lives in lib/greeting.ts so its new-vs-returning rule is
// unit-testable on its own (see __tests__/onboarding-greeting.test.ts).
import { greeting } from "../../lib/greeting";

// One shared horizontal margin (Screen pads 20 each side) → every block on this
// screen spans exactly the same width. Quick-action cards are sized to fill the
// row with the 12px gutter, so the grid's right edge lines up with everything
// else.
const GUTTER = 12;
const SIDE = 20;

export function HomeScreen({ navigation }: HomeScreenProps) {
  const c = useThemeColors();
  const { user, signOut } = useAuthContext();
  const { t, lang } = useLang();
  const { cvs, loading, error, errorKind, loadCVs } = useCvs();
  // What to say when the list failed — decided by WHY it failed (a refused
  // session is not a dead network), and what the action must actually do.
  const cvError = errorKind ? cvErrorCopy(errorKind) : null;
  const [refreshing, setRefreshing] = React.useState(false);
  // Live, not a module-level Dimensions.get() snapshot — a foldable's window
  // width changes on fold/unfold without an app restart, and a stale value
  // here would keep laying out phone-width tiles on a now-tablet-width screen.
  const { width: winWidth } = useWindowDimensions();
  const COL_W = (winWidth - SIDE * 2 - GUTTER) / 2;

  // ── TemplateHub ────────────────────────────────────────────────────────────
  // The full gallery (searchable, sectioned, virtualised) opens from the
  // TemplateHub quick action and from hint cards; the picked template becomes
  // the default for new CVs.
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [defaultTemplate, setDefaultTemplateId] = useState<CvTemplateId | null>(null);
  useEffect(() => {
    let alive = true;
    getDefaultTemplate().then((id) => { if (alive) setDefaultTemplateId(id); });
    return () => { alive = false; };
  }, []);

  const chooseTemplate = (id: CvTemplateId) => {
    setDefaultTemplateId(id);
    void setDefaultTemplate(id);
    // Scoped to the PROFILE, not to a CV: from Home this sets the look new CVs
    // start from. Saying "your CV" here would be a different claim than what
    // the tap actually does.
    toast.show(
      t(
        "This design is now the default look for your profile.",
        "Mtindo huu sasa ndio mtindo wa kawaida wa wasifu wako.",
      ),
    );
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

  // The AI spine — one "what next" answer built from the Career Profile across
  // templates, skills and a single action. `undefined` = not loaded yet,
  // `null` = profile too sparse for a confident guess (show a nudge instead).
  // Recomputed on focus so a profile edit made on the Profile tab is reflected
  // the moment the user comes back here.
  const [nextMoves, setNextMoves] = useState<NextMoves | null | undefined>(undefined);
  useFocusEffect(
    React.useCallback(() => {
      let alive = true;
      loadProfile().then((p) => { if (alive) setNextMoves(recommendNextMoves(p)); });
      return () => { alive = false; };
    }, []),
  );

  // ── Rotating hints ─────────────────────────────────────────────────────────
  // One proactive suggestion card that cycles through everything Sumaiya can
  // push — a live signal, the AI spine's next move, the TemplateHub collection,
  // the first-step nudge, and free guides. Shown one at a time with a shuffle
  // control, so the dashboard reads as "what should I do next" without stacking
  // three near-duplicate cards.
  type Hint = {
    key: string;
    eyebrow: string;
    title: string;
    detail?: string;
    cta: string;
    icon: string;
    onPress: () => void;
  };
  const [hintIndex, setHintIndex] = useState(0);

  const hints = useMemo<Hint[]>(() => {
    const out: Hint[] = [];

    if (topSignal) {
      const st = signalText(topSignal, lang);
      const act = signalAction(topSignal, lang);
      if (st && act) {
        out.push({
          key: "signal",
          eyebrow: t("Worth your attention", "Inastahili umakini"),
          title: st.title,
          detail: st.detail,
          cta: act.cta[lang],
          icon: "sparkles",
          onPress: () =>
            (navigation.navigate as (screen: string, params?: Record<string, unknown>) => void)(
              act.target.screen,
              act.target.params,
            ),
        });
      }
    }

    if (nextMoves) {
      const skills = nextMoves.skills.slice(0, 3).map((s) => s.area.skill[lang]).join(" · ");
      out.push({
        key: "next-move",
        eyebrow: t("Recommended", "Imependekezwa"),
        title: nextMoves.action[lang],
        detail: skills ? `${t("Skills to grow", "Ujuzi wa kukuza")}: ${skills}` : undefined,
        cta: t("See designs", "Ona miundo"),
        icon: "compass",
        onPress: () => {
          haptics.selection();
          setGalleryOpen(true);
        },
      });
    }

    out.push({
      key: "templatehub",
      eyebrow: "TemplateHub",
      title: t("224 designs for every document", "Miundo 224 kwa kila nyaraka"),
      detail: t(
        "Real previews and premium collections, matched to your field.",
        "Miundo halisi na makusanyo ya premium, yanayolingana na uwanja wako.",
      ),
      cta: t("Explore", "Gundua"),
      icon: "layout-grid",
      onPress: () => {
        haptics.selection();
        setGalleryOpen(true);
      },
    });

    const sparse = !topSignal && cvs.length === 0 && jobRecs.length === 0;
    if (sparse) {
      out.push({
        key: "sparse",
        eyebrow: t("Get started", "Anza sasa"),
        title: t("Add your first job to get career advice", "Ongeza kazi yako ya kwanza upate ushauri wa kazi"),
        detail: t(
          "Tell me the role you're aiming for and I'll match jobs, skills and advice to it.",
          "Niambie nafasi ya kazi unayolenga nami nitaoanisha ajira, ujuzi na ushauri nayo.",
        ),
        cta: t("Find jobs", "Tafuta kazi"),
        icon: "compass",
        onPress: () => navigation.navigate("Jobs"),
      });
    }

    for (const tip of GUIDES.filter((g) => g.tier === "free").slice(0, 2)) {
      out.push({
        key: `guide-${tip.id}`,
        eyebrow: t("A tip from me", "Kidokezo changu"),
        title: tip.title[lang],
        detail: tip.summary[lang],
        cta: t("Read the guide", "Soma mwongozo"),
        icon: "help-circle",
        onPress: () => navigation.navigate("Guide", { id: tip.id }),
      });
    }

    return out;
  }, [topSignal, nextMoves, cvs.length, jobRecs.length, lang, t, navigation]);

  const hint = hints[Math.min(hintIndex, Math.max(hints.length - 1, 0))] ?? null;
  const shuffleHint = () => {
    haptics.light();
    if (hints.length > 1) {
      const next = (hintIndex + 1 + Math.floor(Math.random() * (hints.length - 1))) % hints.length;
      setHintIndex(next);
    }
  };

  const rawName = user?.name?.trim();
  const looksLikeDevice = rawName
    ? /^(hisense|samsung|xiaomi|infinix|tecno|itel|oppo|vivo|realme|nokia|huawei|redmi|android|iphone|ipad|roku|tv)\b/i.test(rawName) ||
      /^[a-z0-9]{1,4}$/i.test(rawName)
    : false;
  const name = rawName && !looksLikeDevice ? rawName : user?.email?.split("@")[0] || t("there", "rafiki");

  const quickActions = [
    { icon: "sumaiya", label: t("Career AI", "AI ya kazi"), tint: c.accent, onPress: () => navigation.navigate("SumaiyaTab") },
    { icon: "target", label: t("Find jobs", "Tafuta kazi"), tint: "#12433D", onPress: () => navigation.navigate("Jobs") },
    { icon: "shield-check", label: t("ATS check", "Ukaguzi wa CV"), tint: c.success, onPress: () => navigation.navigate("AtsChecker") },
    { icon: "briefcase", label: t("Applications", "Maombi"), tint: c.accent, onPress: () => navigation.navigate("Applications") },
    // Cover letters were only reachable buried inside the job-tailor flow or a
    // chat quick-action seed — no direct entry point at all. This opens the
    // same generator (JobApply) with its cv/letter/both toggle pre-set to
    // "letter" instead of the generic default, so tapping this feels like a
    // purpose-built cover-letter feature, not a detour through job matching.
    { icon: "mail", label: t("Cover letter", "Barua ya maombi"), tint: c.warning, onPress: () => navigation.navigate("JobApply", { want: "letter" }) },
    // TemplateHub is a first-class surface — the gallery opens straight from here.
    { icon: "layout-grid", label: t("TemplateHub", "TemplateHub"), tint: c.accent, onPress: () => { haptics.selection(); setGalleryOpen(true); } },
  ];

  // NEW vs RETURNING for the greeting. `nextMoves === undefined` means the
  // profile has not loaded yet — treated as "new" on purpose: saying "Karibu"
  // a beat early is harmless, telling a first-timer "welcome back" is not.
  const isReturningUser = nextMoves !== null || cvs.length > 0;

  return (
    <Screen scroll keyboardAvoiding={false} contentContainerStyle={{ gap: 24 }} refreshing={refreshing} onRefresh={onRefresh}>
      <ScreenTitle eyebrow={`${greeting(lang, isReturningUser)},`}>{name}</ScreenTitle>

      {/* Rotating hint — one proactive suggestion at a time. The shuffle control
          cycles to the next; tapping the card acts on the current one. */}
      {hint ? (
        <Animated.View entering={FadeInDown.duration(320).delay(40)}>
          <Card
            onPress={hint.onPress}
            accessibilityLabel={hint.title}
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
              {hint.icon === "sparkles" ? (
                <SumaiyaMark size={18} state="static" color={c.accent} />
              ) : (
                <Icon name={hint.icon} size={18} color={c.accent} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" }}>
                  {hint.eyebrow}
                </Text>
                {hints.length > 1 ? (
                  <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: "600", opacity: 0.7 }}>
                    {hintIndex + 1}/{hints.length}
                  </Text>
                ) : null}
              </View>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: "700", marginTop: 2 }} numberOfLines={2}>
                {hint.title}
              </Text>
              {hint.detail ? (
                <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
                  {hint.detail}
                </Text>
              ) : null}
            </View>
            <View style={{ alignItems: "flex-end", gap: 10 }}>
              {hints.length > 1 ? (
                <Pressable
                  onPress={shuffleHint}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={t("Another suggestion", "Pendekezo lingine")}
                >
                  <Icon name="refresh-cw" size={16} color={c.textMuted} />
                </Pressable>
              ) : null}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                <Text style={{ color: c.accent, fontSize: 12.5, fontWeight: "800" }}>{hint.cta}</Text>
                <Icon name="chevron-right" size={18} color={c.accent} />
              </View>
            </View>
          </Card>
        </Animated.View>
      ) : null}

      {/* Primary row — two equal tiles: the count, and the make-a-CV CTA. */}
      <Animated.View entering={FadeInDown.duration(320).delay(60)} style={{ flexDirection: "row", gap: GUTTER }}>
        <Card
          onPress={() => navigation.navigate("CVsTab")}
          accessibilityLabel={t("View my CVs", "Ona CV zako")}
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
            <Text style={{ color: c.accentText, fontSize: 18, fontWeight: "800" }}>{t("Build your CV", "Jenga CV yako")}</Text>
            <Text style={{ color: c.accentText, opacity: 0.9, fontSize: 12, fontWeight: "600", marginTop: 1 }}>
              {t("Use your profile to start", "Tumia wasifu kuanza")} →
            </Text>
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

      {/* Jobs matched to the profile */}
      {jobRecs.length > 0 ? (
        <Animated.View entering={FadeInDown.duration(320).delay(170)}>
          <SectionHeader
            title={t("New openings", "Nafasi mpya za kazi")}
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
          title={t("Recent CVs", "CV za hivi karibuni")}
          actionLabel={cvs.length > 3 ? t("View all", "Ona zote") : undefined}
          onAction={() => navigation.navigate("CVsTab")}
        />

        {loading && cvs.length === 0 ? (
          <SkeletonList count={2} gap={10} />
        ) : error && cvs.length === 0 ? (
          // The CV list screen was fixed to stop claiming "no CVs" when the real
          // problem is an unreachable server — this screen kept the data-loss
          // illusion. On a fresh install, offline, it told a user with CVs on the
          // server that they had none.
          //
          // Reveal, not a bare View: this is the failure of a load the user is
          // watching, and it used to appear in one frame where the skeletons had
          // been. Nothing an error says is communicated by appearing instantly.
          <Reveal
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
                {cvError
                  ? t(cvError.title.en, cvError.title.sw)
                  : t("Couldn't load your CVs", "Imeshindwa kupakia CV zako")}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 12.5, marginTop: 2 }} numberOfLines={2}>
                {cvError
                  ? t(cvError.body.en, cvError.body.sw)
                  : t(
                      "Your CVs are safe on your account — we just couldn't reach the server.",
                      "CV zako ziko salama kwenye akaunti yako — tumeshindwa kufikia server.",
                    )}
              </Text>
            </View>
            <Pressable
              onPress={cvError?.actionKind === "signin" ? () => void signOut() : onRefresh}
              accessibilityRole="button"
              accessibilityLabel={
                cvError ? t(cvError.action.en, cvError.action.sw) : t("Try again", "Jaribu tena")
              }
              hitSlop={10}
            >
              <Text style={{ color: c.accent, fontSize: 12.5, fontWeight: "800" }}>
                {cvError ? t(cvError.action.en, cvError.action.sw) : t("Try again", "Jaribu tena")}
              </Text>
            </Pressable>
          </Reveal>
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
