import React, { useEffect } from "react";
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, {
  cancelAnimation,
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

    // Cancel both on unmount. Reanimated keeps a running animation alive after
    // the component that started it unmounts, so an infinite `withRepeat` here
    // continues to queue prop updates for a node that is gone and they land as
    // `RetryableMountingLayerException` inside an unrelated screen transition —
    // measured on this app: ~3 per frame for the whole 340ms root cross-fade
    // while the splash (which renders this mark as "thinking") was leaving.
    return () => {
      cancelAnimation(breath);
      cancelAnimation(dps);
    };
  }, [state, reduce, dps, breath]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.value}deg` }, { scale: breath.value }] as never,
  }));

  // Android rasterises a View to a bitmap to rotate it, so an SVG rendered at
  // its exact layout size turns into a soft, "low-res" blur while spinning.
  // Render the SVG at 3× and scale the bitmap back down — same footprint, but
  // there are enough pixels for the rotation to stay crisp.
  const SS = 3;
  const gid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const grad = `smk${gid}`;
  return (
    <Animated.View style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, style]}>
      <Svg
        width={size * SS}
        height={size * SS}
        viewBox="0 0 24 24"
        style={{ transform: [{ scale: 1 / SS }] }}
      >
        <Defs>
          {/* A shade down each blade — full colour at the tip, easing back
              toward the core. Rotates with the blade (objectBoundingBox). */}
          <LinearGradient id={grad} x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={1} />
            <Stop offset="1" stopColor={color} stopOpacity={0.72} />
          </LinearGradient>
        </Defs>
        <G>
          <Path d={BLADE} fill={`url(#${grad})`} />
          <Path d={BLADE} fill={`url(#${grad})`} opacity={0.94} transform="rotate(120 12 12)" />
          <Path d={BLADE} fill={`url(#${grad})`} opacity={0.88} transform="rotate(240 12 12)" />
        </G>
        <Circle cx={12} cy={12} r={2.1} fill={color} />
      </Svg>
    </Animated.View>
  );
}
