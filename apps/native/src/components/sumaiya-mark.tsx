import React, { useEffect } from "react";
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
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
 * States, exactly as the design guide fixes them (§3):
 *  - "idle"      slow drift + gentle breathing   — the RESTING state
 *  - "thinking"   rotation + a pulsing core       — ONLY while an AI call is out
 *  - "static"     frozen
 *
 * Motion (§4):
 *  - The blades are drawn at `BLADE_OPACITY` = 1.0 / 0.9 / 0.8 (§3).
 *  - Nothing here loops forever. Idle's breath and thinking's core pulse are
 *    each a **bounded** beat (`MARK_BREATH_CYCLES` / `MARK_CORE_PULSE_CYCLES`),
 *    well inside the 5 s ceiling WCAG 2.2.2 draws; Reduce Motion switches every
 *    mark animation off and leaves the resting frame.
 *  - Rotation is the mark's identity — a "slow drift" at rest, a "continuous
 *    rotation" while a call is out (§3) — so it is frame-driven rather than a
 *    `withRepeat`: speeding up / slowing down is a smooth ramp and the angle
 *    never snaps back. It is the one motion that runs for as long as its state
 *    is active, and Reduce Motion stops it outright: a mark that visibly keeps
 *    turning is how a user tells a live request from a dead one.
 */
export type SumaiyaMarkState = "idle" | "thinking" | "static";

// Degrees per second for each state.
const SPEED: Record<SumaiyaMarkState, number> = { idle: 24, thinking: 260, static: 0 };

/**
 * §3 — "Three blades at 120°, opacity 1.0 / 0.9 / 0.8". The three numbers live
 * here, so the mark and the onboarding art cannot drift apart, and the value is
 * assertable without a renderer (`mark-well-tokens.test.ts`).
 */
export const BLADE_OPACITY = [1, 0.9, 0.8] as const;

/**
 * §4 — "Nothing repeats forever. Every loop is bounded." The mark's two beats:
 * idle breathes `MARK_BREATH_CYCLES` cycles then rests; thinking pulses its
 * core `MARK_CORE_PULSE_CYCLES` then holds. Both beats finish inside the 5 s
 * auto-motion ceiling WCAG 2.2.2 draws (2×1.8 s and 2×1.3 s).
 */
export const MARK_BREATH_MS = 900;
export const MARK_BREATH_CYCLES = 2;
export const MARK_CORE_PULSE_MS = 650;
export const MARK_CORE_PULSE_CYCLES = 2;

const BLADE =
  "M12 2.6 C 15.1 5 15.6 8.6 13.5 10.8 C 12.7 11.7 11.3 11.7 10.5 10.8 C 8.4 8.6 8.9 5 12 2.6 Z";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  size?: number;
  state?: SumaiyaMarkState;
  color?: string;
}

export function SumaiyaMark({ size = 20, state = "idle", color = "#DA4A1C" }: Props) {
  const angle = useSharedValue(0);
  const dps = useSharedValue(SPEED.idle);
  const breath = useSharedValue(1);
  const core = useSharedValue(1);
  const reduce = useReducedMotion();

  // One continuous integrator. Wrapping at 360° is invisible (360° ≡ 0°), so
  // there is never a jump — the mark just keeps turning. See the header note:
  // this is the mark's one deliberately continuous motion and Reduce Motion
  // stops it.
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

    // §3 — idle is the RESTING state (slow drift + gentle breathing); thinking
    // is the WORKING state (continuous rotation + a pulsing core). Reduce
    // Motion and `static` hold the resting frame. Every loop here is bounded
    // (§4): the beat runs its cycles and stops.
    if (reduce || state === "static") {
      breath.value = withTiming(1, { duration: 380 });
      core.value = withTiming(1, { duration: 380 });
    } else if (state === "idle") {
      core.value = withTiming(1, { duration: 380 });
      breath.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: MARK_BREATH_MS, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: MARK_BREATH_MS, easing: Easing.inOut(Easing.quad) }),
        ),
        MARK_BREATH_CYCLES,
        false,
      );
    } else {
      // thinking
      breath.value = withTiming(1, { duration: 380 });
      core.value = withRepeat(
        withSequence(
          withTiming(0.35, { duration: MARK_CORE_PULSE_MS, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: MARK_CORE_PULSE_MS, easing: Easing.inOut(Easing.quad) }),
        ),
        MARK_CORE_PULSE_CYCLES,
        false,
      );
    }

    // Cancel every animation on unmount and on each state change. Reanimated
    // keeps a running animation alive after the component that started it
    // unmounts, so an uncancelled beat continues to queue prop updates for a
    // node that is gone and they land as `RetryableMountingLayerException`
    // inside an unrelated screen transition — measured on this app: ~3 per
    // frame for the whole 340 ms root cross-fade while the splash (which
    // renders this mark as "thinking") was leaving.
    return () => {
      cancelAnimation(breath);
      cancelAnimation(core);
      cancelAnimation(dps);
    };
  }, [state, reduce, dps, breath, core]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.value}deg` }, { scale: breath.value }] as never,
  }));

  // The core's own pulse (thinking). Kept on the SVG node so the mark's shipped
  // geometry is untouched — the same three blades and the same centre dot the
  // web renders.
  const coreProps = useAnimatedProps(
    () => ({ opacity: core.value }) as unknown as Record<string, unknown>,
  );

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
          <Path d={BLADE} fill={`url(#${grad})`} opacity={BLADE_OPACITY[0]} />
          <Path d={BLADE} fill={`url(#${grad})`} opacity={BLADE_OPACITY[1]} transform="rotate(120 12 12)" />
          <Path d={BLADE} fill={`url(#${grad})`} opacity={BLADE_OPACITY[2]} transform="rotate(240 12 12)" />
        </G>
        <AnimatedCircle cx={12} cy={12} r={2.1} fill={color} animatedProps={coreProps} />
      </Svg>
    </Animated.View>
  );
}
