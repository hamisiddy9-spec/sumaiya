import React from "react";
import { View, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useThemeColors } from "./theme";
import { useMotionReduced } from "./motion";

type Tone = "accent" | "success" | "warning" | "error" | "muted";

/**
 * The one progress bar for the whole app. First-run wizard, Learning-hub
 * readiness, ATS pillars, scan progress — all the same track height, radius
 * and fill treatment so nothing looks bolted on.
 */
export function ProgressBar({
  value,
  tone = "accent",
  height = 6,
  track,
  animated = true,
  style,
}: {
  /** 0–1 */
  value: number;
  tone?: Tone;
  height?: number;
  track?: string;
  animated?: boolean;
  style?: ViewStyle;
}) {
  const c = useThemeColors();
  // Guide §4: "Reduce Motion switches off every mark animation and every beat".
  // A bar that grows is motion, so the preference reaches it here rather than
  // each caller remembering to pass `animated={false}`.
  const reduceMotion = useMotionReduced();
  const animate = animated && !reduceMotion;
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const fill =
    tone === "success"
      ? c.success
      : tone === "warning"
        ? c.warning
        : tone === "error"
          ? c.error
          : tone === "muted"
            ? c.textMuted
            : c.accent;

  // The bar grows from its LEFT edge (guide §4) because it is a width, not a
  // scaleX — a centred scale reads as half-done before anything has finished.
  const w = useSharedValue(clamped);
  React.useEffect(() => {
    w.value = animate ? withTiming(clamped, { duration: 320 }) : clamped;
  }, [clamped, animate, w]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));

  return (
    <View
      style={[
        { height, borderRadius: 999, backgroundColor: track ?? c.bgSunken, overflow: "hidden", width: "100%" },
        style,
      ]}
    >
      <Animated.View style={[fillStyle, { height, borderRadius: 999, backgroundColor: fill }]} />
    </View>
  );
}
