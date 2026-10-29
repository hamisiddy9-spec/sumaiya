import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { CV } from "@sumaiya/types";
import { isEmptyCv } from "@sumaiya/utils/cv-shape";
import type { JobRecommendation, MobileSignal } from "@sumaiya/api-client";
import { signalAction, signalText } from "../../lib/signal-actions";
import { apiClient } from "../../lib/api-client";
import { useCvs } from "../../hooks/use-cvs";
import { useAuthContext } from "../../contexts/auth-context";
import { openAuth } from "../../navigation/root-nav";
import { useLang } from "../../lib/i18n";
import { GUIDES } from "../../lib/guides";
import { cvErrorCopy } from "../../lib/cv-fetch-error";
import { analyzeCv, atsScore } from "../../lib/ats";
import {
  Card,
  Screen,
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
import { loadProfile, type CareerProfile } from "../../lib/profile-store";
import { recommendNextMoves, type NextMoves } from "../../lib/recommendations";
import { SumaiyaMark } from "../../components/sumaiya-mark";
import type { HomeScreenProps } from "../../navigation/types";
// The greeting lives in lib/greeting.ts so its new-vs-returning rule is
// unit-testable on its own (see __tests__/onboarding-greeting.test.ts).
import { greeting } from "../../lib/greeting";
import { identityFor } from "../../lib/identity";
// Home's own building blocks. They are Home-local on purpose: the greeting
// hierarchy, the section header's tap target, the 44 dp icon wells and the
// status chips are all things the shared components get wrong for THIS screen,
// and those components are used by screens this workstream does not own.
import {
  CvScoreCard,
  HomeGreeting,
  HomeSectionHeader,
  PasteAdvertCard,
  QuickActionTile,
  RecentCvRow,
  cvMetaLine,
  cvStatusLabel,
  cvStatusOf,
  FONT,
  HOME_SPACING,
  type ScoreRow,
} from "../../components/home";

/**
 * The three checklist rows on the CV-score card, each one the REAL pass/fail of
 * a named check from `lib/ats.ts` — the same analyzer the CV-check screen runs
 * on the same CV, so the states shown here and the score behind the
 * `Kagua CV yako` tap can never disagree.
 *
 * The design's three labels are kept; the checks behind them are the ones whose
 * meaning actually matches:
 *
 *   Ufupishaji wa maneno   → desc_length  (descriptions well-sized 60–600)
 *   Maneno muhimu ya kazi  → skills       (8+ skills — the matcher's keywords)
 *   Muundo unaosomeka      → dates        (a machine can read every start date)
 */
const SCORE_ROWS: { id: string; en: string; sw: string }[] = [
  { id: "desc_length", en: "Word conciseness", sw: "Ufupishaji wa maneno" },
  { id: "skills", en: "Job keywords", sw: "Maneno muhimu ya kazi" },
  { id: "dates", en: "Scannable structure", sw: "Muundo unaosomeka" },
];

/** A list's four built states (§8). */
type Phase = "loading" | "ready" | "empty" | "error";

export function HomeScreen({ navigation }: HomeScreenProps) {
  const c = useThemeColors();
  const { user, signOut } = useAuthContext();
  // GUEST MODE: no account, no server calls. This screen is the guest's
  // dashboard — the CV count and the CVs below are read from the device (see
  // hooks/use-cvs), and every request that needs a signed-in token is skipped
  // rather than fired and refused. Nothing here waits on the network for a
  // guest, which is the whole promise for a phone with no data.
  const isGuest = !user;
  const { t, lang } = useLang();
  const sw = lang === "sw";
  const { cvs, loading, error, errorKind, loadCVs } = useCvs();
  // What to say when the list failed — decided by WHY it failed (a refused
  // session is not a dead network), and what the action must actually do.
  const cvError = errorKind ? cvErrorCopy(errorKind) : null;
  const [refreshing, setRefreshing] = React.useState(false);
  // Live, not a module-level Dimensions.get() snapshot — a foldable's window
  // width changes on fold/unfold without an app restart, and a stale value
  // here would keep laying out phone-width tiles on a now-tablet-width screen.
  const { width: winWidth, fontScale } = useWindowDimensions();
  // §8 — "layout holds at 200 % text scale". A fixed two-column grid does not:
  // at 200 % a tile's label wraps to three or four lines and the pair of them
  // runs off the right edge. Past 150 % the grid becomes one column, so every
  // tile gets the full width instead of a squeezed half of it.
  const columns = fontScale >= 1.5 ? 1 : 2;
  const COL_W = (winWidth - HOME_SPACING.side * 2 - HOME_SPACING.gutter * (columns - 1)) / columns;

  // ── TemplateHub ────────────────────────────────────────────────────────────
  // The full gallery (searchable, sectioned, virtualised) opens from hint cards;
  // the picked template becomes the default for new CVs.
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

  // ── The CV the score card describes ────────────────────────────────────────
  // "Wasifu uliotumika hivi karibuni" = the CV updated most recently. The score
  // is computed on the DEVICE from lib/ats.ts — the very same analyzer behind
  // the CV check (`Kagua CV yako`) — so the number on Home and the number on the
  // check screen are one number, not two that drift. Nothing is invented: an
  // empty document is `null` here, and the card says so.
  const topCv: CV | null = recent[0] ?? null;
  const cvCheck = useMemo(() => {
    if (!topCv || isEmptyCv(topCv.data)) return null;
    const checks = analyzeCv(topCv.data, sw);
    return { score: atsScore(checks), checks };
  }, [topCv, sw]);

  const scoreRows = useMemo<ScoreRow[]>(() => {
    if (!cvCheck) return [];
    return SCORE_ROWS.map((row) => {
      const found = cvCheck.checks.find((ch) => ch.id === row.id);
      return { id: row.id, label: sw ? row.sw : row.en, pass: !!found?.pass };
    });
  }, [cvCheck, sw]);

  // ── Job matches, with all three states built (§8) ───────────────────────────
  const [jobRecs, setJobRecs] = useState<JobRecommendation[]>([]);
  const [jobsPhase, setJobsPhase] = useState<Phase>("loading");
  const [jobsNonce, setJobsNonce] = useState(0);
  useEffect(() => {
    let alive = true;
    if (isGuest) {
      // A guest has no profile on a server to match against, so there is
      // nothing to fetch and nothing to fail. The section shows its empty
      // state and the way to the public feed — never a spinner for a request
      // that was never made.
      setJobRecs([]);
      setJobsPhase("empty");
      return () => { alive = false; };
    }
    setJobsPhase("loading");
    apiClient
      .getJobRecommendations(3)
      .then((r) => {
        if (!alive) return;
        const list = Array.isArray(r) ? r : [];
        setJobRecs(list);
        setJobsPhase(list.length ? "ready" : "empty");
      })
      .catch(() => {
        // This used to be `.catch(() => {})` — the section simply vanished,
        // so a failed fetch and "no matches for you" looked identical.
        if (!alive) return;
        setJobRecs([]);
        setJobsPhase("error");
      });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest, jobsNonce]);

  // Proactive nudges from Sumaiya (deterministic signal engine, server-side).
  // Refreshed every time the tab regains focus so it reflects the latest state.
  const [signals, setSignals] = useState<MobileSignal[]>([]);
  useFocusEffect(
    React.useCallback(() => {
      if (isGuest) return;
      let alive = true;
      apiClient.getSignals().then((s) => { if (alive) setSignals(s); }).catch(() => {});
      return () => { alive = false; };
    }, [isGuest]),
  );
  const topSignal = signals[0] ?? null;

  // The AI spine — one "what next" answer built from the Career Profile across
  // templates, skills and a single action. `undefined` = not loaded yet,
  // `null` = profile too sparse for a confident guess (show a nudge instead).
  // Recomputed on focus so a profile edit made on the Profile tab is reflected
  // the moment the user comes back here.
  const [nextMoves, setNextMoves] = useState<NextMoves | null | undefined>(undefined);
  // The profile itself is kept too: the greeting's role chip and the avatar's
  // photo are the user's own facts, and inventing either would be worse than
  // showing neither.
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  useFocusEffect(
    React.useCallback(() => {
      let alive = true;
      loadProfile().then((p) => {
        if (!alive) return;
        setProfile(p);
        setNextMoves(recommendNextMoves(p));
      });
      return () => { alive = false; };
    }, []),
  );

  // ── Rotating hints ─────────────────────────────────────────────────────────
  // One proactive suggestion card that cycles through everything Sumaiya can
  // push — a live signal, the AI spine's next move, the TemplateHub collection,
  // the first-step nudge, and free guides. Shown one at a time with a shuffle
  // control, so the dashboard reads as "what should I do next" without stacking
  // three near-duplicate cards. It sits BELOW the design's two cards: the
  // advert loop and the CV score are the screen's hierarchy, and a rotating
  // suggestion above them would push both off the first screen.
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
          // NOT "Inastahili umakini": the design gives that eyebrow to the CV
          // score card, and the same words on two cards on one screen read as
          // one duplicated block rather than two different things.
          eyebrow: t("Sumaiya suggests", "Sumaiya anapendekeza"),
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
      eyebrow: "Sumaiya",
      title: t("A design that fits your document", "Muundo unaofaa nyaraka yako"),
      detail: t(
        "See each design's real preview, and pick the one that suits your work.",
        "Ona kila muundo jinsi unavyoonekana kweli, na uchague unaofaa kazi yako.",
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

  // Who this is — resolved by the SAME rule Profile uses (lib/identity.ts), so
  // the two screens can never disagree about the name or the face. They did:
  // Home drew the Google account photo while Profile drew initials, for the same
  // person, because Profile never looked at the account photo.
  const id = identityFor({
    profileName: profile?.fullName,
    profilePhoto: profile?.photo,
    authName: user?.name,
    authPhoto: user?.photoUrl,
    email: user?.email,
    fallback: t("there", "rafiki"),
  });
  const name = id.name;
  const role = profile?.headline?.trim() || undefined;
  const photoUri = id.photoUri;

  // NEW vs RETURNING for the greeting. `nextMoves === undefined` means the
  // profile has not loaded yet — treated as "new" on purpose: saying "Karibu"
  // a beat early is harmless, telling a first-timer "welcome back" is not.
  const isReturningUser = nextMoves !== null || cvs.length > 0;

  // The design's four tiles, each wired to a screen that already exists. The
  // screen this replaces also carried Sumaiya, Applications and TemplateHub as
  // tiles — three extra destinations the design does not put here, and the
  // reason the grid read as six unlabelled boxes. Sumaiya is the centre tab,
  // Applications lives one tap inside its own screen, and TemplateHub opens
  // from a hint card.
  const quickActions = useMemo(
    () => [
      {
        key: "build",
        icon: "file-plus",
        label: t("Build your CV", "Jenga CV yako"),
        sublabel: t("Start a new document", "Anza hati mpya"),
        primary: true,
        onPress: () =>
          navigation.navigate("CVsTab", { screen: "CvEditor", params: { nonce: String(Date.now()) } }),
      },
      {
        key: "jobs",
        icon: "briefcase",
        label: t("Find jobs", "Tafuta kazi"),
        sublabel: t("Today's openings", "Nafasi za leo"),
        primary: false,
        onPress: () => navigation.navigate("Jobs"),
      },
      {
        key: "check",
        icon: "shield-check",
        label: t("CV check", "Ukaguzi wa CV"),
        // §6: never "Uchambuzi wa ATS" (swahili-lint-ignore: cited counter-example) — the
        // mechanism is named in Swahili copy only as the outcome
        // ("Ukaguzi wa CV"/"Uchambuzi wa CV").
        sublabel: t("CV analysis", "Uchambuzi wa CV"),
        primary: false,
        onPress: () => {
          if (topCv) navigation.navigate("AtsChecker", { cvId: topCv.id });
          else navigation.navigate("AtsChecker");
        },
      },
      {
        key: "letter",
        icon: "mail",
        label: t("Cover letter", "Barua ya maombi"),
        sublabel: t("Draft it in seconds", "Unda kwa sekunde"),
        primary: false,
        onPress: () => navigation.navigate("JobApply", { want: "letter" }),
      },
    ],
    [navigation, t, topCv],
  );

  const openNewCv = () =>
    navigation.navigate("CVsTab", { screen: "CvEditor", params: { nonce: String(Date.now()) } });

  return (
    <Screen
      scroll
      keyboardAvoiding={false}
      // §5: the 'apple polish' variant is preferred, and its content cadence is
      // a 16 gap (the base variant's 24 is not adopted).
      contentContainerStyle={{ gap: HOME_SPACING.block }}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {/* 1. The greeting, as the hero (§8's hierarchy fix). */}
      <HomeGreeting
        greeting={`${greeting(lang, isReturningUser)},`}
        name={name}
        role={role}
        photoUri={photoUri}
      />

      {/* The way back in, on the FIRST screen. After a data clear the app opens
          straight onto this guest dashboard with no sign-in step, so a returning
          user had only two routes: tap something that is gated and use the gate's
          CTA, or scroll the Profile five groups down. openAuth() presents the auth
          modal over the app, and nothing here is walled off for a real guest. */}
      {isGuest ? (
        <Pressable
          onPress={() => {
            haptics.selection();
            openAuth();
          }}
          accessibilityRole="button"
          accessibilityLabel={t("Sign in", "Ingia")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-start",
            gap: 8,
            minHeight: HOME_SPACING.minTarget,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: c.accent + "14",
            borderWidth: 1,
            borderColor: c.accent + "2e",
          }}
        >
          <Icon name="arrow-right" size={15} color={c.accent} />
          <Text style={{ color: c.accent, fontSize: 13.5, fontFamily: FONT.bold }}>
            {t("Sign in", "Ingia")}
          </Text>
        </Pressable>
      ) : null}

      {/* 2. CARD ONE — the advert loop. First card on the design's Home. */}
      <Reveal delayMs={40}>
        <PasteAdvertCard
          // The app's real paste surface for a job advert: JobApply's posting
          // field, whose own copy is "Bandika tangazo lote". It is the same
          // destination the Jobs screen's empty state uses, and the only place a
          // pasted advert is actually read and acted on.
          onPaste={() => navigation.navigate("JobApply")}
        />
      </Reveal>

      {/* 3. CARD TWO — the CV score. It carries the screen's hierarchy. */}
      <Reveal delayMs={60}>
        {loading && cvs.length === 0 ? (
          // The score is computed from the CV list, so before that list has
          // settled there is no honest answer yet. A skeleton, not the "No score
          // yet" card: flashing "you have nothing" for the length of a load is
          // the same false claim the CV list was fixed to stop making.
          <SkeletonList count={1} label={t("Reading your CVs…", "Inasoma CV zako…")} />
        ) : cvCheck && topCv ? (
          <CvScoreCard
            state="scored"
            cvTitle={topCv.title}
            score={cvCheck.score}
            rows={scoreRows}
            onCheck={() => navigation.navigate("AtsChecker", { cvId: topCv.id })}
          />
        ) : (
          <CvScoreCard
            state="unknown"
            title={t("No score yet", "Bado hakuna alama")}
            body={t(
              "A score only appears once a CV with something in it has been checked. Build or open your CV, then come back.",
              "Alama huonekana tu baada ya CV yenye maudhui kukaguliwa. Jenga au fungua CV yako, kisha urudi hapa.",
            )}
            actionLabel={topCv ? t("Open your CV", "Fungua CV yako") : t("Build your CV", "Jenga CV yako")}
            onAction={
              topCv
                ? () =>
                    navigation.navigate("CVsTab", {
                      screen: "CvEditor",
                      params: { cvId: topCv.id, templateId: topCv.templateId },
                    })
                : openNewCv
            }
          />
        )}
      </Reveal>

      {/* Rotating hint — one proactive suggestion at a time. The shuffle control
          cycles to the next; tapping the card acts on the current one. */}
      {hint ? (
        <Reveal delayMs={80}>
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
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ color: c.textMuted, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", fontFamily: FONT.mono }}>
                  {hint.eyebrow}
                </Text>
                {hints.length > 1 ? (
                  <Text style={{ color: c.textMuted, fontSize: 10, fontFamily: FONT.mono, opacity: 0.7 }}>
                    {hintIndex + 1}/{hints.length}
                  </Text>
                ) : null}
              </View>
              <Text style={{ color: c.text, fontSize: 14, lineHeight: 19, marginTop: 2, fontFamily: FONT.bold }}>
                {hint.title}
              </Text>
              {hint.detail ? (
                <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 17, marginTop: 2, fontFamily: FONT.regular }}>
                  {hint.detail}
                </Text>
              ) : null}
            </View>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              {hints.length > 1 ? (
                <Pressable
                  onPress={shuffleHint}
                  accessibilityRole="button"
                  accessibilityLabel={t("Another suggestion", "Pendekezo lingine")}
                  style={{
                    width: HOME_SPACING.minTarget,
                    height: HOME_SPACING.minTarget,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="refresh-cw" size={18} color={c.textMuted} />
                </Pressable>
              ) : null}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                <Text style={{ color: c.accent, fontSize: 12.5, fontFamily: FONT.bold }}>{hint.cta}</Text>
                <Icon name="chevron-right" size={18} color={c.accent} />
              </View>
            </View>
          </Card>
        </Reveal>
      ) : null}

      {/* 4. Shughuli za haraka — four labeled tiles. */}
      <Reveal delayMs={120}>
        <HomeSectionHeader title={t("Quick actions", "Shughuli za haraka")} meta={t("4 tools", "Zana 4")} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: HOME_SPACING.gutter }}>
          {quickActions.map((a, i) => (
            <Stagger key={a.key} index={i} step={45}>
              <QuickActionTile
                icon={a.icon}
                label={a.label}
                sublabel={a.sublabel}
                primary={a.primary}
                width={COL_W}
                onPress={a.onPress}
              />
            </Stagger>
          ))}
        </View>
      </Reveal>

      {/* 5. Jobs matched to the profile — all three list states built. */}
      <Reveal delayMs={170}>
        <HomeSectionHeader
          title={t("New openings", "Nafasi mpya za kazi")}
          actionLabel={t("See all", "Tazama zote")}
          onAction={() => navigation.navigate("Jobs")}
        />

        {jobsPhase === "loading" ? (
          <SkeletonList count={2} gap={10} label={t("Reading openings…", "Inasoma nafasi za kazi…")} />
        ) : jobsPhase === "error" ? (
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: c.warning + "14", alignItems: "center", justifyContent: "center" }}>
              <Icon name="alert-circle" size={18} color={c.warning} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: c.text, fontSize: 14.5, lineHeight: 19, fontFamily: FONT.bold }}>
                {t("Couldn't load the openings", "Imeshindwa kupakia nafasi za kazi")}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 12.5, lineHeight: 17, marginTop: 2, fontFamily: FONT.regular }}>
                {t("Check your connection, then try again.", "Angalia mtandao wako, kisha ujaribu tena.")}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Try again", "Jaribu tena")}
              onPress={() => setJobsNonce((n) => n + 1)}
              style={{ minHeight: HOME_SPACING.minTarget, justifyContent: "center", paddingLeft: 10 }}
            >
              <Text style={{ color: c.accent, fontSize: 12.5, fontFamily: FONT.bold }}>
                {t("Try again", "Jaribu tena")}
              </Text>
            </Pressable>
          </Card>
        ) : jobsPhase === "empty" || jobRecs.length === 0 ? (
          <Card style={{ gap: 10 }}>
            <Text style={{ color: c.text, fontSize: 14.5, lineHeight: 19, fontFamily: FONT.bold }}>
              {isGuest
                ? t("Openings are open to everyone", "Nafasi za kazi ziko wazi kwa kila mtu")
                : t("No openings matched you yet", "Bado hakuna nafasi zinazolingana na wewe")}
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 12.5, lineHeight: 17, fontFamily: FONT.regular }}>
              {isGuest
                ? t("Browse the live listings — no account needed.", "Pitia nafasi zilizopo — hakuna akaunti inayohitajika.")
                : t("New listings arrive daily. Browse them and pick one to aim your CV at.", "Nafasi mpya huingia kila siku. Zitazame na uchague moja ili kulenga CV yako.")}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Find jobs", "Tafuta kazi")}
              onPress={() => navigation.navigate("Jobs")}
              style={{
                minHeight: HOME_SPACING.minTarget,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                alignSelf: "flex-start",
              }}
            >
              <Text style={{ color: c.accent, fontSize: 14, fontFamily: FONT.bold }}>
                {t("Find jobs", "Tafuta kazi")}
              </Text>
              <Icon name="arrow-right" size={17} color={c.accent} />
            </Pressable>
          </Card>
        ) : (
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
                    <Text style={{ color: c.text, fontSize: 14.5, lineHeight: 19, fontFamily: FONT.bold }}>
                      {r.job.title}
                    </Text>
                    <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 17, marginTop: 2, fontFamily: FONT.regular }}>
                      {[r.job.company, r.job.location].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: tone + "1f", borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3 }}>
                    <Icon name="target" size={11} color={tone} />
                    <Text style={{ color: tone, fontSize: 11.5, fontFamily: FONT.bold }}>{r.score}%</Text>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </Reveal>

      {/* 6. CV za hivi karibuni */}
      <Reveal delayMs={180}>
        <HomeSectionHeader
          title={t("Recent CVs", "CV za hivi karibuni")}
          actionLabel={t("See all", "Tazama zote")}
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
              borderRadius: 20,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.bgElevated,
            }}
          >
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: c.warning + "14", alignItems: "center", justifyContent: "center" }}>
              <Icon name="alert-circle" size={18} color={c.warning} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: c.text, fontSize: 14.5, lineHeight: 19, fontFamily: FONT.bold }}>
                {cvError
                  ? t(cvError.title.en, cvError.title.sw)
                  : t("Couldn't load your CVs", "Imeshindwa kupakia CV zako")}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 12.5, lineHeight: 17, marginTop: 2, fontFamily: FONT.regular }}>
                {cvError
                  ? t(cvError.body.en, cvError.body.sw)
                  : t(
                      "Your CVs are safe on your account — we just couldn't reach the server.",
                      "CV zako ziko salama kwenye akaunti yako — tumeshindwa kufikia server.",
                    )}
              </Text>
            </View>
            <Pressable
              onPress={
                cvError?.actionKind === "signin"
                  ? // A refused session: for someone with an account that means
                    // sign in again. For a guest there is no session to fix —
                    // they never had one — so the honest action is the
                    // invitation, not a sign-out.
                    isGuest
                    ? () => openAuth()
                    : () => void signOut()
                  : onRefresh
              }
              accessibilityRole="button"
              accessibilityLabel={
                cvError ? t(cvError.action.en, cvError.action.sw) : t("Try again", "Jaribu tena")
              }
              style={{ minHeight: HOME_SPACING.minTarget, justifyContent: "center", paddingLeft: 10 }}
            >
              <Text style={{ color: c.accent, fontSize: 12.5, fontFamily: FONT.bold }}>
                {cvError ? t(cvError.action.en, cvError.action.sw) : t("Try again", "Jaribu tena")}
              </Text>
            </Pressable>
          </Reveal>
        ) : recent.length === 0 ? (
          // §8's empty rule is one line AND one action. The two primary tiles
          // that used to carry this CTA are gone (the design's Home does not
          // have them), so the action lives here.
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 16,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: c.border,
              borderStyle: "dashed",
              backgroundColor: c.bgElevated,
            }}
          >
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: c.accent + "14", alignItems: "center", justifyContent: "center" }}>
              <Icon name="file-text" size={18} color={c.accent} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: c.text, fontSize: 14.5, lineHeight: 19, fontFamily: FONT.bold }}>
                {t("No CVs yet", "Bado hakuna CV")}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 12.5, lineHeight: 17, marginTop: 2, fontFamily: FONT.regular }}>
                {t("Your CVs will show here once you build or import one.", "CV zako zitaonekana hapa mara utakapotengeneza au kupakia.")}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Build your CV", "Jenga CV yako")}
              onPress={openNewCv}
              style={{ minHeight: HOME_SPACING.minTarget, justifyContent: "center", paddingLeft: 10 }}
            >
              <Text style={{ color: c.accent, fontSize: 12.5, fontFamily: FONT.bold }}>
                {t("Build your CV", "Jenga CV yako")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {recent.map((cv: CV, i) => {
              // One analyzer run per row: the chip's state and its label are the
              // same answer, asked once.
              const status = cvStatusOf(cv);
              return (
                <Stagger key={cv.id} index={i}>
                  <RecentCvRow
                    title={cv.title}
                    meta={cvMetaLine(cv.updatedAt, lang)}
                    status={status}
                    statusLabel={cvStatusLabel(status, lang)}
                    onPress={() =>
                      navigation.navigate("CVsTab", { screen: "CvEditor", params: { templateId: cv.templateId, cvId: cv.id } })
                    }
                  />
                </Stagger>
              );
            })}
          </View>
        )}
      </Reveal>

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
