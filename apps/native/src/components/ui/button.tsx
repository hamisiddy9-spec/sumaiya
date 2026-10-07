import React from "react";
import { ActivityIndicator, Pressable, Text, View, type PressableProps } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { haptics } from "./haptics";
import { useThemeColors } from "./theme";
import { EASE, MOTION, enterDurationMs, useMotionReduced } from "./motion";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "style" | "children"> {
  label: string;
  /**
   * A second line under the label that says what pressing this actually does.
   *
   * Exists because some actions need one line of specificity that a short label
   * cannot carry without turning into a sentence. The alternative — a paragraph
   * elsewhere on the screen explaining the button — reads as an apology for a
   * vague label. Put the specificity in the thing being tapped.
   */
  sublabel?: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Haptic fired on press. Default: "light" for most, "medium" for primary. */
  haptic?: keyof typeof haptics | null;
}

const SIZES: Record<Size, { padY: number; padX: number; text: number; gap: number; minH: number }> = {
  sm: { padY: 8, padX: 14, text: 14, gap: 6, minH: 44 },
  md: { padY: 12, padX: 18, text: 15, gap: 8, minH: 46 },
  lg: { padY: 15, padX: 22, text: 16, gap: 8, minH: 54 },
};

export function Button({
  label,
  sublabel,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  haptic,
  onPress,
  ...rest
}: ButtonProps) {
  const c = useThemeColors();
  const s = SIZES[size];
  const reduceMotion = useMotionReduced();
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const palette = {
    primary: { bg: c.accentFill, bgPressed: c.accentFillPressed, fg: c.accentText, border: "transparent" },
    secondary: { bg: c.bgElevated, bgPressed: c.border, fg: c.text, border: c.borderStrong },
    ghost: { bg: "transparent", bgPressed: c.onAccentMuted, fg: c.accent, border: "transparent" },
    danger: { bg: c.error, bgPressed: c.error, fg: "#fff", border: "transparent" },
  }[variant];

  const bg = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: bg.value === 1 ? palette.bgPressed : palette.bg,
  }));

  return (
    <Animated.View style={[animStyle, fullWidth ? { alignSelf: "stretch" } : { alignSelf: "flex-start" }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={sublabel ? `${label}. ${sublabel}` : label}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        onPressIn={() => {
          scale.value = withTiming(0.97, { duration: 90 });
          bg.value = 1;
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 140 });
          bg.value = 0;
        }}
        onPress={(e) => {
          if (isDisabled) return;
          const h = haptic === null ? null : haptic ?? (variant === "primary" ? "medium" : variant === "danger" ? "warning" : "light");
          if (h) haptics[h]();
          onPress?.(e);
        }}
        {...rest}
      >
        <Animated.View
          style={[
            bgStyle,
            {
              minHeight: s.minH,
              paddingVertical: s.padY,
              paddingHorizontal: s.padX,
              borderRadius: 12,
              borderWidth: palette.border === "transparent" ? 0 : 1.5,
              borderColor: palette.border,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: s.gap,
              opacity: isDisabled ? 0.45 : 1,
            },
          ]}
        >
          {loading ? (
            // The spinner fades in over the label rather than replacing it in the
            // same commit. The label is the only thing announcing what the button
            // does, and on a slow phone an in-flight action can last seconds — a
            // hard swap reads as the button having changed identity.
            <Animated.View entering={FadeIn.duration(enterDurationMs(reduceMotion, MOTION.dur.base)).easing(EASE.out)}>
              <ActivityIndicator color={palette.fg} size="small" />
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeIn.duration(enterDurationMs(reduceMotion, MOTION.dur.base)).easing(EASE.out)}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: s.gap, flexShrink: 1 }}
            >
              {leftIcon ? <View>{leftIcon}</View> : null}
              {sublabel ? (
                // Left-aligned preview, because a second line reads as a
                // sentence rather than a label.
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: palette.fg, fontSize: s.text, fontWeight: "700", letterSpacing: 0.1 }}>
                    {label}
                  </Text>
                  <Text style={{ color: palette.fg, fontSize: 12, lineHeight: 16, opacity: 0.85 }} numberOfLines={2}>
                    {sublabel}
                  </Text>
                </View>
              ) : (
                <Text style={{ color: palette.fg, fontSize: s.text, fontWeight: "700", letterSpacing: 0.1 }}>
                  {label}
                </Text>
              )}
              {rightIcon ? <View>{rightIcon}</View> : null}
            </Animated.View>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
