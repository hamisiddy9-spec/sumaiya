import React, { useEffect, useRef, useState } from "react";
import { BackHandler, Pressable, Text, useWindowDimensions, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { openAuth } from "../navigation/root-nav";
import Animated, {
  cancelAnimation,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  Button,
  EASE,
  MOTION,
  Reveal,
  enterDurationMs,
  exitDurationMs,
  haptics,
  staggerDelayMs,
  useMotionReduced,
  useThemeColors,
} from "../components/ui";
import type { SumaiyaMarkState } from "../components/sumaiya-mark";
import { MarkWell } from "../components/mark-well";
import { PortalTransition } from "../components/portal-transition";
import { Icon } from "../components/icon";
import { activeDotIndex, settlePage } from "../lib/pager";
import { useLang, type Lang } from "../lib/i18n";
import { track } from "../lib/telemetry";
import { track as trackActivation, FUNNEL_EVENTS } from "../lib/analytics";

interface Props {
  navigation: unknown;
  onComplete?: () => void;
}

interface SlideData {
  title: { en: string; sw: string };
  body: { en: string; sw: string };
}

/**
 * Beats 2 and 3 of the welcoming path — the language question, then the slides.
 *
 * Both stages render the SAME object the launch screen handed over: `MarkWell`
 * (one container, one mark size, from `ui/mark-well-tokens`). The slides
 * previously rendered the live mark on slide 0 and a separate `OnboardingArt`
 * scene on the other three — a different drawing system (its own rosette
 * geometry, its own linear loops, a gold core instead of the mark's accent
 * core) appearing mid-flow, which is what "the artwork swaps from the mark to a
 * different system" means on screen. Now every slide carries the mark, and the
 * only thing that differs between slides is the sentence under it.
 */
const SLIDES: SlideData[] = [
  {
    title: { en: "Meet Sumaiya", sw: "Karibu — mimi ni Sumaiya" },
    body: {
      en: "Your job companion. I write your CV, target it to the job, check it against employer screening, and get you ready for the interview.",
      sw: "Msaidizi wako wa kupata ajira. Ninakuandikia CV, ninailenga kwa ajira, ninaikagua dhidi ya mifumo ya waajiri, na ninakuandaa kwa usaili.",
    },
  },
  {
    title: { en: "I write it with you", sw: "Ninakuandikia" },
    body: {
      en: "Answer a few questions — or just talk to me, in English or Swahili. I build the whole thing.",
      sw: "Jibu maswali machache — au sema tu nami, kwa Kiswahili au Kiingereza. Ninatengeneza kila kitu.",
    },
  },
  {
    title: { en: "I target every job", sw: "Ninailenga kila ajira" },
    body: {
      en: "Paste a job and I rewrite your CV to match it — truthfully — so it passes the software that reads it first.",
      sw: "Bandika ajira nami nabadilisha CV yako iendane nayo — kwa ukweli — ipite programu inayoisoma kwanza.",
    },
  },
  {
    title: { en: "I prep you for the interview", sw: "Ninakuandaa kwa usaili" },
    body: {
      en: "Practice real interview questions with me, then export a clean PDF and apply.",
      sw: "Fanya mazoezi ya maswali halisi ya usaili nami, kisha pakua PDF safi na uombe kazi.",
    },
  },
];

/**
 * One dot. Active or not — never part-way.
 *
 * It used to be interpolated from the raw scroll offset (`interpolate(scrollX,
 * [(i-1)W, iW, (i+1)W], [8, 24, 8])`), i.e. a continuous ramp per dot driven by
 * a value four animated nodes shared on every scroll frame. A device capture of
 * the last slide shows what that can paint: TWO dots at full width and full
 * opacity at once, and adding the offset snap to `onMomentumScrollEnd` did not
 * change it (the capture is from a build that already had the snap).
 *
 * Now the dot is told whether it is the page, so exactly one dot is ever active
 * and no two nodes can disagree about which one it is. It costs less, too: the
 * width/opacity ramp runs once per page change instead of on every scroll
 * frame, and the ScrollView no longer needs `onScroll` at all.
 */
function Dot({ active }: { active: boolean }) {
  const c = useThemeColors();
  const reduce = useMotionReduced();
  const progress = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: enterDurationMs(reduce, MOTION.dur.base),
      easing: active ? EASE.out : EASE.in,
    });
    // Same rule as everywhere else on this path: a shared value must not keep
    // animating against a node that has gone away.
    return () => cancelAnimation(progress);
  }, [active, reduce, progress]);
  const style = useAnimatedStyle(() => ({
    width: 8 + progress.value * 16, // 8 → 24
    opacity: 0.35 + progress.value * 0.65, // 0.35 → 1
  }));
  return <Animated.View style={[style, { height: 8, borderRadius: 4, backgroundColor: c.accent }]} />;
}

function Slide({
  item,
  live,
  markState,
  artRef,
}: {
  item: SlideData;
  /** True for the slide currently on screen. Only the live slide's mark turns:
   *  an off-screen mark is `static`, which parks its frame callback. */
  live: boolean;
  markState: SumaiyaMarkState;
  artRef?: React.Ref<View>;
}) {
  const c = useThemeColors();
  const { lang } = useLang();
  const { width } = useWindowDimensions();

  return (
    <View style={{ width, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 30 }}>
      {/* No scroll-linked transform here: the previous version scaled this from
          0.6 → 1.0 and translated it 40px from the raw scroll offset, so the
          mark's on-screen size changed as you swiped, and the standard bans
          scroll-driven reveals on a phone. The visual is static; the stage's
          own entrance is the one beat. */}
      <View ref={artRef} collapsable={false} style={{ alignItems: "center", justifyContent: "center" }}>
        <MarkWell state={live ? markState : "static"} />
      </View>
      <View style={{ alignItems: "center", gap: 12 }}>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: "800", textAlign: "center", letterSpacing: -0.5 }}>
          {item.title[lang]}
        </Text>
        <Text style={{ color: c.textBody, fontSize: 15.5, textAlign: "center", lineHeight: 23, maxWidth: 320 }}>
          {item.body[lang]}
        </Text>
      </View>
    </View>
  );
}

/** Stage 1 — the first thing a fresh install shows: a greeting and a language. */
function WelcomeStage({
  markState,
  onPick,
  onSignIn,
}: {
  markState: SumaiyaMarkState;
  onPick: (l: Lang) => void;
  onSignIn: () => void;
}) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { lang: current } = useLang();
  const reduce = useMotionReduced();

  const choices: { lang: Lang; label: string; hint: string }[] = [
    // The design's own sub-labels. "Lugha msingi" tells a first-time user
    // WHY Kiswahili is listed first (it is the product's primary language), and
    // the English line states what English support actually covers.
    { lang: "sw", label: "Kiswahili", hint: "Lugha msingi · Rahisi na ya asili" },
    { lang: "en", label: "English", hint: "Full English language support" },
  ];

  return (
    <Animated.View
      entering={FadeIn.duration(enterDurationMs(reduce, MOTION.dur.slow)).easing(EASE.out)}
      exiting={FadeOut.duration(exitDurationMs(reduce, MOTION.dur.fast)).easing(EASE.in)}
      style={{ flex: 1, backgroundColor: c.bg, paddingHorizontal: 28 }}
    >
      {/* Hero centred in the space above; the language choices sit low and
          centred, width-constrained so they read as a deliberate pair — not
          left-hugging list rows. The mark is the one the launch screen left
          here: same well, same size, no entrance of its own. */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 20 }}>
        <MarkWell state={markState} />
        <View style={{ alignItems: "center", gap: 8 }}>
          {/* No separator dot. The heading has to stand on its own: one word,
              the app's own greeting, with the bilingual line under it doing the
              explaining. A "·" between two words was a second piece of
              punctuation on a screen whose subject is the mark above it — and
              on a device it reads as a stray dot sitting under the logo. */}
          <Text style={{ color: c.text, fontSize: 29, fontWeight: "800", letterSpacing: -0.6 }}>Karibu</Text>
          <Text style={{ color: c.textBody, fontSize: 15, textAlign: "center", lineHeight: 22, maxWidth: 290 }}>
            Mimi ni Sumaiya. Chagua lugha yako.{"\n"}I'm Sumaiya. Choose your language.
          </Text>
        </View>
      </View>

      <View style={{ width: "100%", maxWidth: 360, alignSelf: "center", gap: 12 }}>
        {choices.map((ch, i) => (
          // `Reveal`, not an `entering` layout animation: this wrapper holds a
          // Pressable, and a layout-animation intercept on a wrapper has already
          // left a Button non-interactive on Fabric once in this app
          // (`empty-state.tsx`). Shared values have no mounting-layer
          // involvement, so the buttons stay tappable. The stagger is capped by
          // `staggerDelayMs`, and collapses to instant under Reduce Motion.
          <Reveal key={ch.lang} delayMs={staggerDelayMs(i)}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                haptics.selection();
                onPick(ch.lang);
              }}
              accessibilityLabel={`${ch.label}. ${ch.hint}`}
              style={({ pressed }) => ({
                // The design's language row: a full-width left-aligned row with a
                // hairline border, and the row in use tinted with a check on the
                // right — not two centred ember-outlined buttons, which read as a
                // pair of primary actions when only one of them is the default.
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderWidth: 1,
                borderColor: current ? c.borderStrong : c.border,
                backgroundColor: current ? c.accentTint : pressed ? c.accentTint : "transparent",
                borderRadius: 16,
                paddingVertical: 14,
                paddingHorizontal: 16,
                minHeight: 56,
              })}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: c.text, fontSize: 17, fontWeight: "800" }}>{ch.label}</Text>
                <Text style={{ color: c.textMuted, fontSize: 13 }}>{ch.hint}</Text>
              </View>
              {current ? <Icon name="check" size={18} color={c.accent} /> : null}
            </Pressable>
          </Reveal>
        ))}
      </View>

      {/* The design puts the sign-in path and the trust note HERE, on the language
          step: a returning user who just cleared their data should not have to
          sit through four slides to find a login, and a first-time user should
          know before choosing that no account is needed to start. */}
      <View style={{ gap: 14, paddingBottom: insets.bottom + 20, alignItems: "center" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ingia / Sign in"
          onPress={() => {
            haptics.selection();
            onSignIn();
          }}
          style={{ paddingVertical: 12, paddingHorizontal: 16, minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ color: c.accent, fontSize: 14, fontWeight: "700" }}>Ingia / Sign in</Text>
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8 }}>
          <Icon name="check-circle" size={14} color={c.textMuted} />
          <Text style={{ color: c.textMuted, fontSize: 12.5, textAlign: "center", flexShrink: 1 }}>
            Huna haja ya akaunti kuanza kuandika CV yako.
          </Text>
        </View>
      </View>

    </Animated.View>
  );
}

type Stage = "welcome" | "slides" | "portal";

export function OnboardingScreen({ onComplete }: Props) {
  const c = useThemeColors();
  const { t, setLang } = useLang();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduce = useMotionReduced();
  const ref = useRef<Animated.ScrollView>(null);
  const [stage, setStage] = useState<Stage>("welcome");
  const [page, setPage] = useState(0);
  // The mark greets in "thinking" (a full sweep) then settles to its idle drift.
  const [markState, setMarkState] = useState<SumaiyaMarkState>("thinking");
  useEffect(() => {
    const id = setTimeout(() => setMarkState("idle"), 1600);
    return () => clearTimeout(id);
  }, []);

  // No `onScroll` handler here on purpose. The carousel used to publish every
  // scroll frame into a shared value that the art transform and the pager both
  // read; nothing on this screen needs the mid-flight offset. The page is what
  // the eye and the indicator both key off, and it only changes when the swipe
  // settles.

  const goTo = (p: number) => {
    haptics.selection();
    ref.current?.scrollTo({ x: p * width, animated: true });
    setPage(p);
    track("onboarding.slide", { i: p, of: SLIDES.length });
  };

  // Android hardware back: step back through the flow instead of killing the
  // app. From slide 1+ → previous slide; from slide 0 → back to the language
  // picker (so it can be re-chosen); from the picker → let the OS exit.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (stage === "portal") return true; // mid-transition, swallow
      if (stage === "slides") {
        if (page > 0) {
          goTo(page - 1);
        } else {
          haptics.selection();
          setStage("welcome");
        }
        return true;
      }
      return false; // welcome → default (exit)
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, page]);

  const pickLanguage = (l: Lang) => {
    setLang(l);
    // Where the funnel actually starts. Nothing was recorded between "installed
    // the app" and "signed in" before this, so every claim about first-run
    // drop-off was an educated guess.
    track("onboarding.start", { lang: l });
    track("onboarding.slide", { i: 0, of: SLIDES.length });
    // brief "thinking" pulse as she "hears" the choice, then reveal the slides
    setMarkState("thinking");
    setStage("slides");
    setTimeout(() => setMarkState("idle"), 1400);
  };

  const collapse = useSharedValue(0); // 0 = slides at rest, 1 = sucked into the mark
  const artRefs = useRef<(View | null)[]>([]);
  // Where the portal's bloom should originate — the actual on-screen centre of
  // whichever slide's art was showing when the user hit Start/Skip, not the
  // screen's geometric centre. Slide art sits above centre (it's grouped with
  // the title/body below it, vertically centred as a pair), so blooming from
  // true centre visibly jumped away from where the art actually was — read as
  // the transition "appearing out of nowhere" rather than growing out of it.
  const [portalOrigin, setPortalOrigin] = useState<{ x: number; y: number } | null>(null);
  const finish = (via: "skip" | "start" | "signin" = "skip") => {
    // The slide someone was on when they left IS the answer to "do the four
    // slides cost us people before they even sign up?" — and it is the cheapest
    // point in the whole funnel to lose someone, because they have no account
    // to abandon yet.
    track("onboarding.done", { via, i: page, of: SLIDES.length });
    // Activation-funnel stage 2: reached whether they read every slide or skipped.
    trackActivation(FUNNEL_EVENTS.onboarded, { via });
    // No haptic here — PortalTransition fires its own opening beat the
    // instant it mounts (this call), so a tap-acknowledgment tick here would
    // double up with it almost simultaneously.
    setMarkState("thinking");
    collapse.value = withTiming(1, { duration: MOTION.dur.screen, easing: EASE.in });
    // Measure *before* mounting the portal. The origin is applied to the
    // flood's static left/top, so committing it a frame late made the field
    // visibly jump position mid-bloom. Collapse already started, so the one
    // frame the measurement costs is invisible; the timeout is the floor in
    // case measureInWindow never calls back (detached node) — without it the
    // portal would never mount and the flow would dead-end here.
    const node = artRefs.current[page];
    let committed = false;
    const commit = (o: { x: number; y: number } | null) => {
      if (committed) return;
      committed = true;
      setPortalOrigin(o);
      setStage("portal");
    };
    if (node) {
      node.measureInWindow((x, y, w, h) => commit({ x: x + w / 2, y: y + h / 2 }));
      setTimeout(() => commit(null), 150);
    } else {
      commit(null);
    }
  };

  const slidesStyle = useAnimatedStyle(() => ({
    opacity: 1 - collapse.value,
    transform: [{ scale: 1 - collapse.value * 0.16 }] as never,
  }));

  if (stage === "welcome") {
    return (
      <>
        <StatusBar style="dark" />
        <WelcomeStage
            markState={markState}
            onPick={pickLanguage}
            onSignIn={() => {
              // Same path the last slide uses: leave the tour, then present
              // the auth modal over the app (openAuth is a no-op until the
              // container is ready, so it retries once rather than failing
              // silently). `finish` runs first so the guest path is intact.
              finish("signin");
              setTimeout(() => {
                if (!openAuth()) setTimeout(() => openAuth(), 600);
              }, 400);
            }}
          />
      </>
    );
  }

  const isLast = page === SLIDES.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style="dark" />
      {(stage === "slides" || stage === "portal") && (
        <Animated.View
          entering={FadeIn.duration(enterDurationMs(reduce, MOTION.dur.slow)).easing(EASE.out)}
          style={[{ flex: 1 }, slidesStyle]}
          pointerEvents={stage === "portal" ? "none" : "auto"}
        >
          <View style={{ height: insets.top + 8 }} />

          <Pressable
            accessibilityRole="button"
            onPress={() => finish("skip")}
            hitSlop={10}
            style={{ alignSelf: "flex-end", paddingLeft: 20 + insets.left, paddingRight: 20 + insets.right, paddingVertical: 8 }}
          >
            <Text style={{ color: c.textMuted, fontSize: 14, fontWeight: "700" }}>{t("Skip", "Ruka")}</Text>
          </Pressable>

          <Animated.ScrollView
            ref={ref}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              // The page is settled from the offset, never the offset itself:
              // the raw contentOffset at rest can land a fraction of a pixel off
              // (e.g. 1007.6 instead of 1008), and anything derived from that
              // fraction is ambiguous at rest. `settlePage` is the one place the
              // division happens, and `lib/pager.test.ts` pins it — including
              // the 1007.6 case.
              setPage(settlePage(e.nativeEvent.contentOffset.x, width));
            }}
            style={{ flex: 1 }}
          >
            {SLIDES.map((item, i) => (
              <Slide
                key={i}
                item={item}
                live={i === page}
                markState={markState}
                artRef={(node) => {
                  artRefs.current[i] = node;
                }}
              />
            ))}
          </Animated.ScrollView>

          <View style={{ paddingLeft: 24 + insets.left, paddingRight: 24 + insets.right, paddingBottom: insets.bottom + 20, gap: 22 }}>
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 7 }}>
              {SLIDES.map((_, i) => (
                <Dot key={i} active={i === activeDotIndex(page, SLIDES.length)} />
              ))}
            </View>

            <Reveal delayMs={MOTION.dur.fast}>
              <Button
                label={isLast ? t("Start", "Anza") : t("Next", "Endelea")}
                size="lg"
                onPress={() => {
                  if (isLast) {
                    finish("start");
                  } else {
                    haptics.selection();
                    goTo(page + 1);
                  }
                }}
              />
            </Reveal>

              {/* A returning user who has just cleared their data should not have
                  to accept the slides and then hunt for a login. Finishing first
                  keeps the guest path intact; the modal then presents over the app.
                  openAuth() is a no-op until the container is ready, so it retries
                  once rather than failing silently. */}
              {isLast ? (
                <Pressable
                  onPress={() => {
                    haptics.selection();
                    finish("signin");
                    setTimeout(() => {
                      if (!openAuth()) setTimeout(() => openAuth(), 600);
                    }, 400);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={t("I already have an account", "Nina akaunti tayari")}
                  style={{ alignSelf: "center", marginTop: 14, paddingVertical: 8, paddingHorizontal: 12 }}
                >
                  <Text style={{ color: c.accent, fontSize: 13.5, fontWeight: "700" }}>
                    {t("I already have an account — sign in", "Nina akaunti tayari — ingia")}
                  </Text>
                </Pressable>
              ) : null}

          </View>
        </Animated.View>
      )}

      {stage === "portal" && <PortalTransition origin={portalOrigin} onDone={() => onComplete?.()} />}
    </View>
  );
}
