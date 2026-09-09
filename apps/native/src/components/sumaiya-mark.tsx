import React, { useEffect } from "react";
import Svg, { Path, Circle, G } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
  useReducedMotion,
} from "react-native-reanimated";

/**
 * The Sumaiya Mark — Sumaiya's own AI signature (shared with web).
 *
 * Three swept blades around an open core — an aperture / bloom that reads as
 * focus and motion, not a generic sparkle. Used wherever the app speaks as
 * Sumaiya (the Sumaiya tab, the chat, AI actions).
 *
 *  - "idle"     slow back-and-forth drift (resting)
 *  - "thinking" continuous rotation (while an AI call is in flight)
 *  - "static"   no motion
 *
 * Respects the OS "reduce motion" setting.
 */
export type SumaiyaMarkState = "idle" | "thinking" | "static";

const BLADE =
  "M12 2.6 C 15.1 5 15.6 8.6 13.5 10.8 C 12.7 11.7 11.3 11.7 10.5 10.8 C 8.4 8.6 8.9 5 12 2.6 Z";

interface Props {
  size?: number;
  state?: SumaiyaMarkState;
  color?: string;
}

export function SumaiyaMark({ size = 20, state = "idle", color = "#7C3AED" }: Props) {
  const spin = useSharedValue(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    cancelAnimation(spin);
    if (reduce || state === "static") {
      spin.value = withTiming(0, { duration: 200 });
      return;
    }
    if (state === "thinking") {
      spin.value = 0;
      spin.value = withRepeat(withTiming(360, { duration: 1500, easing: Easing.linear }), -1);
    } else {
      spin.value = withRepeat(
        withSequence(
          withTiming(14, { duration: 3500, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 3500, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
      );
    }
    return () => cancelAnimation(spin);
  }, [state, reduce, spin]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));

  return (
    <Animated.View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <G>
          <Path d={BLADE} fill={color} />
          <Path d={BLADE} fill={color} opacity={0.9} transform="rotate(120 12 12)" />
          <Path d={BLADE} fill={color} opacity={0.8} transform="rotate(240 12 12)" />
        </G>
        <Circle cx={12} cy={12} r={2.1} fill={color} />
      </Svg>
    </Animated.View>
  );
}
