import React, { useEffect, useRef, useState } from "react";
import { BackHandler, Pressable, Text, useWindowDimensions, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { Button, haptics, useThemeColors } from "../components/ui";
import { SumaiyaMark, type SumaiyaMarkState } from "../components/sumaiya-mark";
import { OnboardingArt } from "../components/onboarding-art";
import { PortalTransition } from "../components/portal-transition";
import { useLang, type Lang } from "../lib/i18n";
import { track } from "../lib/telemetry";
import { track as trackActivation, FUNNEL_EVENTS } from "../lib/analytics";

interface Props {
  navigation: unknown;
  onComplete?: () => void;
}

interface SlideData {
  /** Slide 0 renders the live Sumaiya mark; the rest use branded OnboardingArt. */
  mark?: boolean;
  art?: 0 | 1 | 2 | 3;
  title: { en: string; sw: string };
  body: { en: string; sw: string };
}

const SLIDES: SlideData[] = [
  {
    mark: true,
    title: { en: "Meet Sumaiya", sw: "Karibu — mimi ni Sumaiya" },
    body: {
      en: "Your job companion. I write your CV, target it to the job, check it against employer screening, and get you ready for the interview.",
      sw: "Msaidizi wako wa kupata ajira. Ninakuandikia CV, ninailenga kwa ajira, ninaikagua dhidi ya mifumo ya waajiri, na ninakuandaa kwa usaili.",
    },
  },
  {
    art: 1,
    title: { en: "I write it with you", sw: "Ninakuandikia" },
    body: {
      en: "Answer a few questions — or just talk to me, in English or Swahili. I build the whole thing.",
      sw: "Jibu maswali machache — au sema tu nami, kwa Kiswahili au Kiingereza. Ninatengeneza kila kitu.",
    },
  },
  {
    art: 2,
    title: { en: "I target every job", sw: "Ninailenga kila ajira" },
    body: {
      en: "Paste a job and I rewrite your CV to match it — truthfully — so it passes the software that reads it first.",
      sw: "Bandika ajira nami nabadilisha CV yako iendane nayo — kwa ukweli — ipite programu inayoisoma kwanza.",
    },
  },
  {
    art: 3,
    title: { en: "I prep you for the interview", sw: "Ninakuandaa kwa usaili" },
    body: {
      en: "Practice real interview questions with me, then export a clean PDF and apply.",
      sw: "Fanya mazoezi ya maswali halisi ya usaili nami, kisha pakua PDF safi na uombe kazi.",
    },
  },
];

function Dot({ index, scrollX }: { index: number; scrollX: SharedValue<number> }) {
  const c = useThemeColors();
  const { width } = useWindowDimensions();
  const style = useAnimatedStyle(() => {
    const input = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      width: interpolate(scrollX.value, input, [8, 24, 8], "clamp"),
      opacity: interpolate(scrollX.value, input, [0.35, 1, 0.35], "clamp"),
    };
  });
  return <Animated.View style={[style, { height: 8, borderRadius: 4, backgroundColor: c.accent }]} />;
}

function Slide({
  item,
  index,
  scrollX,
  markState,
  artRef,
}: {
  item: SlideData;
  index: number;
  scrollX: SharedValue<number>;
  markState: SumaiyaMarkState;
  artRef?: React.Ref<View>;
}) {
  const c = useThemeColors();
  const { lang } = useLang();
  const { width } = useWindowDimensions();

  const visualStyle = useAnimatedStyle(() => {
    const input = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      transform: [
        { scale: interpolate(scrollX.value, input, [0.6, 1, 0.6], "clamp") },
        { translateY: interpolate(scrollX.value, input, [40, 0, 40], "clamp") },
      ] as never,
      opacity: interpolate(scrollX.value, input, [0, 1, 0], "clamp"),
    };
  });
  const textStyle = useAnimatedStyle(() => {
    const input = [(index - 1) * width, index * width, (index + 1) * width];
    return { opacity: interpolate(scrollX.value, input, [0, 1, 0], "clamp") };
  });

  return (
    <View style={{ width, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 30 }}>
      <Animated.View
        ref={artRef}
        collapsable={false}
        style={[visualStyle, { alignItems: "center", justifyContent: "center" }]}
      >
        {item.mark ? (
          <View
            style={{
              width: 148,
              height: 148,
              borderRadius: 44,
              backgroundColor: c.accent + "14",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SumaiyaMark size={78} state={markState} color={c.accent} />
          </View>
        ) : (
          <OnboardingArt variant={item.art ?? 0} size={168} />
        )}
      </Animated.View>
      <Animated.View style={[textStyle, { alignItems: "center", gap: 12 }]}>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: "800", textAlign: "center", letterSpacing: -0.5 }}>
          {item.title[lang]}
        </Text>
        <Text style={{ color: c.textBody, fontSize: 15.5, textAlign: "center", lineHeight: 23, maxWidth: 320 }}>
          {item.body[lang]}
        </Text>
      </Animated.View>
    </View>
  );
}

/** Stage 1 — the first thing a fresh install shows: a greeting and a language. */
function WelcomeStage({
  markState,
  onPick,
}: {
  markState: SumaiyaMarkState;
  onPick: (l: Lang) => void;
}) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();

  const choices: { lang: Lang; label: string; hint: string }[] = [
    { lang: "sw", label: "Kiswahili", hint: "Endelea kwa Kiswahili" },
    { lang: "en", label: "English", hint: "Continue in English" },
  ];

  return (
    <Animated.View
      entering={FadeIn.duration(360)}
      exiting={FadeOut.duration(220)}
      style={{ flex: 1, backgroundColor: c.bg, paddingHorizontal: 28 }}
    >
      {/* Hero centred in the space above; the language choices sit low and
          centred, width-constrained so they read as a deliberate pair — not
          left-hugging list rows. */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 20 }}>
        <View
          style={{
            width: 128,
            height: 128,
            borderRadius: 40,
            backgroundColor: c.accent + "14",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SumaiyaMark size={72} state={markState} color={c.accent} />
        </View>
        <View style={{ alignItems: "center", gap: 8 }}>
          <Text style={{ color: c.text, fontSize: 29, fontWeight: "800", letterSpacing: -0.6 }}>
            Karibu · Welcome
          </Text>
          <Text style={{ color: c.textBody, fontSize: 15, textAlign: "center", lineHeight: 22, maxWidth: 290 }}>
            Mimi ni Sumaiya. Chagua lugha yako.{"\n"}I'm Sumaiya. Choose your language.
          </Text>
        </View>
      </View>

      <View style={{ width: "100%", maxWidth: 360, alignSelf: "center", gap: 12, paddingBottom: insets.bottom + 52 }}>
        {choices.map((ch, i) => (
          <Animated.View key={ch.lang} entering={FadeInDown.delay(200 + i * 80).duration(360)}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                haptics.selection();
                onPick(ch.lang);
              }}
              style={({ pressed }) => ({
                borderWidth: 1.5,
                borderColor: c.accent,
                backgroundColor: pressed ? c.accent + "12" : "transparent",
                borderRadius: 18,
                paddingVertical: 14,
                paddingHorizontal: 20,
                alignItems: "center",
                gap: 2,
              })}
            >
              <Text style={{ color: c.text, fontSize: 18, fontWeight: "800" }}>{ch.label}</Text>
              <Text style={{ color: c.textMuted, fontSize: 13 }}>{ch.hint}</Text>
            </Pressable>
          </Animated.View>
        ))}
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
  const scrollX = useSharedValue(0);
  const ref = useRef<Animated.ScrollView>(null);
  const [stage, setStage] = useState<Stage>("welcome");
  const [page, setPage] = useState(0);
  // The mark greets in "thinking" (a full sweep) then settles to its idle drift.
  const [markState, setMarkState] = useState<SumaiyaMarkState>("thinking");
  useEffect(() => {
    const id = setTimeout(() => setMarkState("idle"), 1600);
    return () => clearTimeout(id);
  }, []);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

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
  const finish = (via: "skip" | "start" = "skip") => {
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
    collapse.value = withTiming(1, { duration: 320, easing: Easing.in(Easing.cubic) });
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
        <WelcomeStage markState={markState} onPick={pickLanguage} />
      </>
    );
  }

  const isLast = page === SLIDES.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style="dark" />
      {(stage === "slides" || stage === "portal") && (
        <Animated.View
          entering={FadeIn.duration(420)}
          style={[{ flex: 1 }, slidesStyle]}
          pointerEvents={stage === "portal" ? "none" : "auto"}
        >
          <View style={{ height: insets.top + 8 }} />

          <Pressable
            accessibilityRole="button"
            onPress={() => finish("skip")}
            hitSlop={10}
            style={{ alignSelf: "flex-end", paddingHorizontal: 20, paddingVertical: 8 }}
          >
            <Text style={{ color: c.textMuted, fontSize: 14, fontWeight: "700" }}>{t("Skip", "Ruka")}</Text>
          </Pressable>

          <Animated.ScrollView
            ref={ref}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              const settled = Math.round(e.nativeEvent.contentOffset.x / width);
              setPage(settled);
              // Snap to the exact expected offset — the raw contentOffset at rest
              // can land a fraction of a pixel off (e.g. 1007.6 instead of 1008),
              // which leaves the dot interpolation's shared boundary between two
              // dots ambiguous and paints both as partially active (seen on the
              // last slide, where there's no further slide to mask it).
              scrollX.value = settled * width;
            }}
            style={{ flex: 1 }}
          >
            {SLIDES.map((item, i) => (
              <Slide
                key={i}
                item={item}
                index={i}
                scrollX={scrollX}
                markState={markState}
                artRef={(node) => { artRefs.current[i] = node; }}
              />
            ))}
          </Animated.ScrollView>

          <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 20, gap: 22 }}>
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 7 }}>
              {SLIDES.map((_, i) => (
                <Dot key={i} index={i} scrollX={scrollX} />
              ))}
            </View>

            <Animated.View entering={FadeInDown.delay(300)}>
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
            </Animated.View>
          </View>
        </Animated.View>
      )}

      {stage === "portal" && <PortalTransition origin={portalOrigin} onDone={() => onComplete?.()} />}
    </View>
  );
}
