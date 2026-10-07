import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
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
import { useLang } from "../lib/i18n";

/**
 * Beat 1 of the welcoming path — the mark, in the well, with its name.
 *
 * This screen used to be its own effect: the mark at 52 in a solid 96 square on
 * `Easing.back(1.6)` (the app's only overshoot) with a two-cycle pulse layered
 * on the container *while* the mark breathed inside it, then the language stage
 * rendered the same mark at 72 in a tinted 128 square, then the slides at 78 in
 * a 148 square. Four sizes, three containers, three curve families, one cold
 * start — which is what made the flow read as several effects in a queue.
 *
 * Now it is the first beat of ONE effect. The mark is `MarkWell`: the same
 * container, the same mark, the same scale the language stage and the slides
 * use. Nothing here scales: the well and the word arrive by opacity and a
 * `MOTION.rise`, on the shared decelerate curve, and the mark's own single
 * breath does the breathing (it is the only scale animation in the frame, so it
 * reads as one object breathing rather than two stacked effects).
 *
 * Cost on a Redmi/Android-Go class phone: two timed shared values, both
 * cancelled on unmount, and a frame callback that stops when the mark settles
 * to `idle`. There is no looping animation left on this screen — the previous
 * container pulse looped twice against a mark that was already breathing.
 */
export function SplashScreen() {
  const c = useThemeColors();
  const { t } = useLang();
  const reduce = useMotionReduced();
  const well = useSharedValue(0);
  const word = useSharedValue(0);
  // The mark spins up as she "arrives" and settles into her resting drift — the
  // same thinking → idle beat the language stage opens with, so the hand-off to
  // it is the mark already mid-beat rather than a new one starting.
  const [markState, setMarkState] = useState<SumaiyaMarkState>("thinking");

  useEffect(() => {
    const id = setTimeout(() => setMarkState("idle"), 1200);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    // Reduce Motion: land everything at its resting state immediately. The
    // splash still shows the mark, the word and the tagline — nothing about the
    // screen depends on having watched it move — and `SumaiyaMark` reads the
    // same setting itself, so the well is simply the resting frame.
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
  // scale — the mark's size is the one thing the path holds constant.
  const wellStyle = useAnimatedStyle(() => ({
    opacity: well.value,
    transform: [{ translateY: (1 - well.value) * MOTION.rise }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value,
    transform: [{ translateY: (1 - word.value) * MOTION.rise }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", gap: 22 }}>
      <Animated.View style={wellStyle}>
        <MarkWell state={markState} />
      </Animated.View>

      <Animated.View style={[wordStyle, { alignItems: "center", gap: 6 }]}>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 }}>
          Sumaiya
        </Text>
        <Text style={{ color: c.textMuted, fontSize: 13, fontWeight: "600" }}>
          {t("Your job companion", "Msaidizi wako wa kupata ajira")}
        </Text>
      </Animated.View>
    </View>
  );
}
