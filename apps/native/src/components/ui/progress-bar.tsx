import React from "react";
import { View, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useThemeColors } from "./theme";

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

  const w = useSharedValue(animated ? clamped : clamped);
  React.useEffect(() => {
    w.value = animated ? withTiming(clamped, { duration: 320 }) : clamped;
  }, [clamped, animated, w]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));

  return (
    <View
      style={[
        { height, borderRadius: 999, backgroundColor: track ?? c.border, overflow: "hidden", width: "100%" },
        style,
      ]}
    >
      <Animated.View style={[fillStyle, { height, borderRadius: 999, backgroundColor: fill }]} />
    </View>
  );
}
