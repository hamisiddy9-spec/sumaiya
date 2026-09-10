import React, { useEffect } from "react";
import Svg, { Path, Circle, G } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useFrameCallback,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";

/**
 * The Sumaiya Mark — Sumaiya's own AI signature (shared with web).
 *
 * Three swept blades around an open core — an aperture / bloom that reads as
 * focus and motion, not a generic sparkle. Used wherever the app speaks as
 * Sumaiya (the Sumaiya tab, the chat, AI actions).
 *
 *  - "idle"     slow continuous rotation (resting)
 *  - "thinking" fast continuous rotation + a soft breath (AI call in flight)
 *  - "static"   frozen
 *
 * Rotation is frame-driven (not withRepeat), so speeding up / slowing down is
 * a smooth ramp and the angle never snaps back — no visible "reset". Respects
 * the OS "reduce motion" setting.
 */
export type SumaiyaMarkState = "idle" | "thinking" | "static";

// Degrees per second for each state.
const SPEED: Record<SumaiyaMarkState, number> = { idle: 24, thinking: 260, static: 0 };

const BLADE =
  "M12 2.6 C 15.1 5 15.6 8.6 13.5 10.8 C 12.7 11.7 11.3 11.7 10.5 10.8 C 8.4 8.6 8.9 5 12 2.6 Z";

interface Props {
  size?: number;
  state?: SumaiyaMarkState;
  color?: string;
}

export function SumaiyaMark({ size = 20, state = "idle", color = "#DA4A1C" }: Props) {
  const angle = useSharedValue(0);
  const dps = useSharedValue(SPEED.idle);
  const breath = useSharedValue(1);
  const reduce = useReducedMotion();

  // One continuous integrator. Wrapping at 360° is invisible (360° ≡ 0°), so
  // there is never a jump — the mark just keeps turning.
  const frame = useFrameCallback((f) => {
    "worklet";
    if (dps.value === 0) return;
    const dt = (f.timeSincePreviousFrame ?? 16.7) / 1000;
    let next = angle.value + dps.value * dt;
    if (next >= 360) next -= 360;
    angle.value = next;
  }, false);

  // Only run the per-frame loop while the mark is actually turning. Many static
  // marks (inactive tabs, home cards) would otherwise each hold a frame callback.
  const spinning = !reduce && state !== "static";
  useEffect(() => {
    frame.setActive(spinning);
  }, [spinning, frame]);

  useEffect(() => {
    const target = reduce || state === "static" ? 0 : SPEED[state];
    // Ease the speed between states rather than switching instantly.
    dps.value = withTiming(target, { duration: 520, easing: Easing.inOut(Easing.quad) });

    if (state === "thinking" && !reduce) {
      breath.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 720, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 720, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
    } else {
      breath.value = withTiming(1, { duration: 380 });
    }
  }, [state, reduce, dps, breath]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.value}deg` }, { scale: breath.value }] as never,
  }));

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
