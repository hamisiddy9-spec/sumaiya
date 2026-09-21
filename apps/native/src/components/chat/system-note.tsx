import React, { useEffect } from "react";
import { Text } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useMotionReduced, useThemeColors } from "../ui";
import { CHAT_MOTION, chatEnterMs } from "./chat-motion";

/**
 * T3 · The system note (§3.2).
 *
 * Centred, no avatar, one beige pill — the *only* element in the transcript
 * allowed to be centred, which is what keeps "surface" and "person" legible at
 * a glance.
 *
 * It carries the things the app knows and never says: that the conversation is
 * kept on the phone (it has been persisted for 40 turns and the UI was silent
 * about it), that a turn was restored, that the thread was cleared, that a turn
 * is queued, and the editor hand-off both ways. It is the honest replacement for
 * a toast: everything here persists and can be re-read.
 *
 * Arrives at 300 `ease.out` (instant under Reduce Motion) — it must never pop,
 * because a system note that appears suddenly reads as a glitch, not as the app
 * telling you something.
 */
export function SystemNote({ text }: { text: string }) {
  const c = useThemeColors();
  const reduce = useMotionReduced();
  const progress = useSharedValue(reduce ? 1 : 0);

  useEffect(() => {
    if (reduce) {
      progress.value = 1;
      return;
    }
    progress.value = withTiming(1, { duration: chatEnterMs(false, CHAT_MOTION.bubble.enter), easing: Easing.out(Easing.cubic) });
  }, [reduce, progress]);

  const enter = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * CHAT_MOTION.bubble.distance }],
  }));

  return (
    <Animated.View
      style={[
        enter,
        {
          alignSelf: "center",
          maxWidth: "88%",
          backgroundColor: c.border,
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 6,
          marginVertical: 6,
        },
      ]}
      accessibilityRole="text"
    >
      <Text style={{ color: c.textMuted, fontSize: 12, textAlign: "center" }}>{text}</Text>
    </Animated.View>
  );
}
