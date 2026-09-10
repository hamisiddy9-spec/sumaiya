import React, { useEffect, useRef, useState } from "react";
import { BackHandler, Dimensions, Pressable, Text, View } from "react-native";
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

const { width } = Dimensions.get("window");

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
      sw: "Msaidizi wako wa kupata ajira. Ninakuandikia CV, ninailenga kwa kazi, ninaikagua dhidi ya mifumo ya waajiri, na ninakuandaa kwa usaili.",
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
    title: { en: "I target every job", sw: "Ninailenga kila kazi" },
    body: {
      en: "Paste a job and I rewrite your CV to match it — truthfully — so it passes the software that reads it first.",
      sw: "Bandika kazi nami nabadilisha CV yako iendane nayo — kwa ukweli — ipite programu inayoisoma kwanza.",
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
}: {
  item: SlideData;
  index: number;
  scrollX: SharedValue<number>;
  markState: SumaiyaMarkState;
}) {
  const c = useThemeColors();
  const { lang } = useLang();

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
      <Animated.View style={[visualStyle, { alignItems: "center", justifyContent: "center" }]}>
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
    // brief "thinking" pulse as she "hears" the choice, then reveal the slides
    setMarkState("thinking");
    setStage("slides");
    setTimeout(() => setMarkState("idle"), 1400);
  };

  const collapse = useSharedValue(0); // 0 = slides at rest, 1 = sucked into the mark
  const finish = () => {
    haptics.selection();
    setMarkState("thinking");
    collapse.value = withTiming(1, { duration: 460, easing: Easing.in(Easing.cubic) });
    setStage("portal");
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
            onPress={finish}
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
            onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
            style={{ flex: 1 }}
          >
            {SLIDES.map((item, i) => (
              <Slide key={i} item={item} index={i} scrollX={scrollX} markState={markState} />
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
                    finish();
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

      {stage === "portal" && <PortalTransition onDone={() => onComplete?.()} />}
    </View>
  );
}
