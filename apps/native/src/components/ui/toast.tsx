import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Icon } from "../icon";
import { haptics } from "./haptics";
import { useMotionReduced } from "./motion";
import { MOTION } from "./motion-tokens";
import { useThemeColors } from "./theme";
import { useTabBarClearance } from "../../navigation/tab-bar-metrics";

/**
 * A quiet confirmation line, in the app's own design system.
 *
 * Why this exists: the web editor has had `showToast()` all along, so an action
 * there says what happened. The native app had only `dialog.alert()` — a modal
 * with a backdrop and an OK button — so the only way to confirm anything was to
 * interrupt the user with a dialog. The owner hit exactly that gap: applying a
 * TemplateHub design closed the gallery and said nothing at all.
 *
 * Motion is the standard's own "Success toast" composite (MOTION-STANDARD §3.5):
 * `FadeIn` 220ms `ease.out` entering, `FadeOut` 140ms `ease.in` leaving, and
 * `dur.instant` (1ms, never 0) under Reduce Motion.
 *
 * Deliberately NOT a Modal. A transparent Modal on Android is its own window and
 * swallows touches for as long as it is mounted — that is the same class of bug
 * as the update pill sitting over the tab bar. This is an absolutely-positioned
 * sibling with `pointerEvents="none"`, so it can never intercept a tap, and it
 * sits above the tab bar by MEASURING the bar rather than guessing its height
 * (large accessibility text grows it).
 */

type Listener = (message: string | null) => void;

let listener: Listener | null = null;
let seq = 0;
let timer: ReturnType<typeof setTimeout> | null = null;

const DEFAULT_DURATION_MS = 2600;

export const toast = {
  /**
   * Show one short line. A second call replaces the first rather than queueing
   * — a toast is feedback, not a notification centre, and a queue would keep
   * stale confirmations on screen after the user has moved on.
   */
  show(message: string, opts?: { durationMs?: number }) {
    if (!message) return;
    seq += 1;
    const id = seq;
    listener?.(message);
    haptics.success();
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      // Only the newest message may clear the screen.
      if (id === seq) listener?.(null);
    }, opts?.durationMs ?? DEFAULT_DURATION_MS);
  },
  /** Drop the current message immediately (e.g. on navigation). */
  hide() {
    seq += 1;
    if (timer) clearTimeout(timer);
    listener?.(null);
  },
  /** @internal used by ToastHost */
  _subscribe(l: Listener | null) {
    listener = l;
  },
};

export function ToastHost() {
  const c = useThemeColors();
  const clearance = useTabBarClearance();
  const reduce = useMotionReduced();
  const [current, setCurrent] = useState<string | null>(null);
  // Held so the exit animation has something left to render.
  const [shown, setShown] = useState<string | null>(null);
  const progress = useSharedValue(0);

  useEffect(() => {
    toast._subscribe((m) => setCurrent(m));
    return () => toast._subscribe(null);
  }, []);

  useEffect(() => {
    if (current) {
      setShown(current);
      progress.value = withTiming(1, {
        duration: reduce ? MOTION.dur.instant : MOTION.dur.base,
        easing: Easing.out(Easing.cubic),
      });
    } else if (shown) {
      progress.value = withTiming(
        0,
        { duration: reduce ? MOTION.dur.instant : MOTION.dur.fast, easing: Easing.in(Easing.cubic) },
        (done) => {
          if (done) runOnJS(setShown)(null);
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const card = useAnimatedStyle(() => ({
    opacity: progress.value,
    // 12px rise, same distance the standard uses for a row arriving — the toast
    // is establishing presence, not travelling.
    transform: [{ translateY: (1 - progress.value) * MOTION.rise }],
  }));

  if (!shown) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { justifyContent: "flex-end" }]} pointerEvents="none">
      <Animated.View
        accessibilityLiveRegion="polite"
        style={[
          card,
          {
            marginHorizontal: 16,
            marginBottom: clearance + 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            backgroundColor: c.bgElevated,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 14,
            shadowColor: "#000",
            shadowOpacity: 0.22,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 8 },
            elevation: 10,
          },
        ]}
      >
        <Icon name="check-circle" size={18} color={c.success} />
        <Text style={{ flex: 1, color: c.text, fontSize: 14, lineHeight: 19, fontWeight: "600" }}>
          {shown}
        </Text>
      </Animated.View>
    </View>
  );
}
