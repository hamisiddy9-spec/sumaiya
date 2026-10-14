import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useThemeColors } from "../components/ui/theme";
import { EASE, MOTION, staggerDelayMs, useMotionReduced } from "../components/ui/motion";
import { MarkWell } from "../components/mark-well";
import type { SumaiyaMarkState } from "../components/sumaiya-mark";
import { FONT } from "../components/home";
import { useLang } from "../lib/i18n";

/**
 * Beat 1 of the welcoming path — the mark, in the well, with its name.
 *
 * The design (A1 · Mwanzo) is one centred column on the cream surface — the
 * well, the word `Sumaiya`, one line of what this is, and one line at the foot
 * saying what it costs you (nothing, and no network). Nothing else: no spinner,
 * no version string, no bell. The screen used to be its own effect (the mark at
 * 52 in a solid 96 square on `Easing.back(1.6)` with a two-cycle pulse layered
 * on the container *while* the mark breathed inside it); the flow's four wells
 * are gone and `MarkWell` is the ONE container every stage of the cold start
 * puts the mark in — same size, same mark, same tint, so the hand-off to the
 * language stage is the same object still in place rather than a second one
 * arriving.
 *
 * Nothing here waits on the wire. The root navigator renders this while the
 * session and the first-run flag are still being read, and it renders the same
 * frame whether that read takes 40 ms or fails outright — a splash screen that
 * needs a request is a black screen on a phone with no data.
 *
 * The entrance is opacity plus a `MOTION.rise` on the shared decelerate curve —
 * never a scale, because the mark's size is the one thing the path holds
 * constant — and the mark's own single breath does the breathing. Reduce Motion
 * lands both at their resting frame (§3/§4) and `SumaiyaMark` reads the setting
 * itself, so the well is simply the still version of the same object.
 */
export function SplashScreen() {
  const c = useThemeColors();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const reduce = useMotionReduced();
  const well = useSharedValue(0);
  const word = useSharedValue(0);
  // The mark spins up as she "arrives" and settles into her resting drift — the
  // same thinking → idle beat the language stage opens with, so the hand-off to
  // it is the mark already mid-beat rather than a new one starting. §3 pins this
  // entrance at **1600 ms** (the shared brand greeting, identical on Nuru,
  // Faraja and Sumaiya) — the value the language stage already uses.
  const [markState, setMarkState] = useState<SumaiyaMarkState>("thinking");

  useEffect(() => {
    const id = setTimeout(() => setMarkState("idle"), 1600);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    // Reduce Motion: land everything at its resting state immediately. The
    // splash still shows the mark, the word and the lines under it — nothing
    // about the screen depends on having watched it move.
    if (reduce) {
      well.value = 1;
      word.value = 1;
      return;
    }
    well.value = withTiming(1, { duration: MOTION.dur.slow, easing: EASE.out });
    word.value = withDelay(
      staggerDelayMs(1),
      withTiming(1, { duration: MOTION.dur.slow, easing: EASE.out }),
    );
    // Cancel on unmount. Reanimated does not stop a running animation when the
    // component that started it goes away, so the pulse kept ticking against
    // views that no longer existed; each tick is only flushed during a UI event
    // dispatch, which is why they surfaced as a flood of
    // `RetryableMountingLayerException` during the splash → first-screen
    // transition. Measured before this fix: 291 of them in one cold start.
    return () => {
      cancelAnimation(well);
      cancelAnimation(word);
    };
  }, [reduce, well, word]);

  // One origin for everything entering the path: opacity plus a `rise`, never a
  // scale.
  const wellStyle = useAnimatedStyle(() => ({
    opacity: well.value,
    transform: [{ translateY: (1 - well.value) * MOTION.rise }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value,
    transform: [{ translateY: (1 - word.value) * MOTION.rise }],
  }));

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.bg,
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <Animated.View style={wellStyle}>
        <MarkWell state={markState} />
      </Animated.View>

      <Animated.View style={[wordStyle, { alignItems: "center" }]}>
        <Text
          style={{
            marginTop: 32,
            color: c.text,
            fontSize: 24,
            fontFamily: FONT.display,
            letterSpacing: -0.6,
          }}
        >
          Sumaiya
        </Text>
        <Text
          style={{
            marginTop: 8,
            maxWidth: 220,
            color: c.textMuted,
            fontSize: 12,
            lineHeight: 17,
            textAlign: "center",
            fontFamily: FONT.regular,
          }}
        >
          {t(
            "The power of work in your pocket • Tanzania & East Africa",
            "Uwezo wa kazi kiganjani mwako • Tanzania & Afrika Mashariki",
          )}
        </Text>
      </Animated.View>

      {/* The foot of the screen: the cost of the app, in one line. Static, not
          part of the entrance — it is a statement about the product, not a step
          of the greeting — and raised above the gesture bar on devices that
          have one. */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: insets.bottom + 40,
          paddingHorizontal: 32,
        }}
      >
        <Text
          style={{
            color: c.textMuted,
            fontSize: 11,
            fontFamily: FONT.mono,
            textAlign: "center",
            opacity: 0.8,
          }}
        >
          {t("On your device only • Offline", "Kifaa chako tu • Nje ya mtandao")}
        </Text>
      </View>
    </View>
  );
}
