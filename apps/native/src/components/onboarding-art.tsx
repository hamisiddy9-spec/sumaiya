import React, { useEffect } from "react";
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

/**
 * Branded onboarding art — no stock icons.
 *
 * Every scene is built from ONE piece of DNA: the Sumaiya blade (the same path
 * as the animated mark). Each slide arranges it differently — a single bloom, a
 * pair converging, rings opening outward, an ascent — with the brand palette
 * mixing through SVG gradients. Cohesive family, four distinct expressions.
 */

// The blade — identical geometry to components/sumaiya-mark.tsx, on a 24×24 grid.
const BLADE =
  "M12 2.6 C 15.1 5 15.6 8.6 13.5 10.8 C 12.7 11.7 11.3 11.7 10.5 10.8 C 8.4 8.6 8.9 5 12 2.6 Z";

const EMBER = "#DA4A1C";
const EMBER_DEEP = "#A8330F";
const PINE = "#12433D";
const GOLD = "#F2A93B";

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * A 3-blade rosette centred on (cx,cy) at a given scale + rotation + fill.
 *
 * Each rosette spins on its own — a slow, continuous drift added on top of
 * its base `rotate` — rather than the whole scene rotating as one flat image.
 * `speed` and `phase` are per-instance so a scene with several rosettes reads
 * as independent living blades, not one wheel.
 */
function Rosette({
  cx,
  cy,
  scale,
  rotate = 0,
  fill,
  opacity = 1,
  speed = 10,
  phase = 0,
  reduce,
}: {
  cx: number;
  cy: number;
  scale: number;
  rotate?: number;
  fill: string;
  opacity?: number;
  /** Degrees per second of continuous self-rotation. */
  speed?: number;
  /** 0..1 starting offset into the spin cycle, so instances don't sync up. */
  phase?: number;
  reduce: boolean;
}) {
  const spin = useSharedValue(phase);
  useEffect(() => {
    if (reduce) return;
    // "Just a little" faster than the original 4–11 s per turn — one knob, so
    // the whole scene speeds up together and the phases stay staggered.
    const duration = (360 / (speed * 1.25)) * 1000;
    // withRepeat(withTiming(phase + 1, ...)) resets spin.value back to the
    // ORIGINAL `phase` at the start of every lap. The angle itself doesn't
    // jump (phase and phase+1 land on the same rotation mod 360°), but this
    // was reported live as "a little tiny cycle between them" — a visible
    // catch at each loop boundary. Animating many turns per lap (with a
    // proportionally longer duration — linear easing keeps the per-frame
    // motion identical either way) instead of one just pushes the reset out
    // to roughly once every ~45min at the slowest configured speed, well
    // past any realistic time on this screen — same safe withRepeat/
    // withTiming APIs already proven crash-free here, no new animation
    // pattern introduced.
    const TURNS_PER_LAP = 200;
    spin.value = withRepeat(
      withTiming(phase + TURNS_PER_LAP, { duration: duration * TURNS_PER_LAP, easing: Easing.linear }),
      -1,
    );
  }, [reduce, spin, speed, phase]);

  // Rotation only, shaped exactly like the logo's live spin: an array of
  // transform objects. Never build the transform as a string — Reanimated's
  // transform processor iterates it and ends up calling a JS function on the UI
  // runtime, which hard-crashes the app ("CppException: Tried to synchronously
  // call a Remote Function"). Position and scale are static SVG transforms in
  // the JSX below, applied in the same order as before.
  const animatedProps = useAnimatedProps(() => {
    const live = rotate + (spin.value % 1) * 360;
    return {
      transform: [{ rotate: `${live}deg` }],
    } as unknown as Record<string, unknown>;
  });

  return (
    <G transform={`translate(${cx} ${cy}) scale(${scale})`} opacity={opacity}>
      <AnimatedG animatedProps={animatedProps}>
        <G transform="translate(-12 -12)">
          <Path d={BLADE} fill={fill} />
          <Path d={BLADE} fill={fill} opacity={0.94} transform="rotate(120 12 12)" />
          <Path d={BLADE} fill={fill} opacity={0.88} transform="rotate(240 12 12)" />
          {/* The logo's own centre dot (sumaiya-mark r=2.1 in the same 24x24
              blade grid). It used to be added per scene at (mid, mid), so any
              rosette offset from the scene centre rendered as bare blades. */}
          <Circle cx={12} cy={12} r={2.1} fill={GOLD} />
        </G>
      </AnimatedG>
    </G>
  );
}

interface Props {
  variant: 0 | 1 | 2 | 3;
  size?: number;
}

export function OnboardingArt({ variant, size = 148 }: Props) {
  const V = 120; // viewBox units
  const mid = V / 2;
  // Unique gradient ids per instance — RN-SVG resolves url(#id) globally, so
  // four scenes on one screen would otherwise all paint with scene 0's stops.
  const uid = `oa${variant}`;
  const halo = `${uid}-halo`;
  const emberGold = `${uid}-eg`;
  const goldEmber = `${uid}-ge`;

  // Slide 0 gets the live, spinning SumaiyaMark; these scenes previously only
  // had a one-time fade-in (or, briefly, the whole scene rotating as a flat
  // image), so each rosette now drifts independently — matching the mark's
  // living quality without the "one wheel" look.
  const reduce = useReducedMotion();

  let scene: React.ReactNode;
  switch (variant) {
    // 0 — Meet Sumaiya: one calm bloom, ember→gold, soft halo.
    case 0:
      scene = (
        <>
          <Circle cx={mid} cy={mid} r={54} fill={`url(#${halo})`} />
          <Rosette cx={mid} cy={mid} scale={3.1} rotate={-8} fill={`url(#${emberGold})`} speed={8} reduce={reduce} />
          <Circle cx={mid} cy={mid} r={5.5} fill={GOLD} />
        </>
      );
      break;
    // 1 — I write it with you: two blooms overlapping, ember + pine converging.
    case 1:
      scene = (
        <>
          <Circle cx={mid} cy={mid} r={52} fill={`url(#${halo})`} />
          <Rosette cx={mid - 15} cy={mid + 6} scale={2.4} rotate={20} fill={PINE} opacity={0.9} speed={7} phase={0.15} reduce={reduce} />
          <Rosette cx={mid + 15} cy={mid - 6} scale={2.4} rotate={-20} fill={`url(#${emberGold})`} speed={9} phase={0.55} reduce={reduce} />
          <Circle cx={mid} cy={mid} r={4.5} fill={GOLD} />
        </>
      );
      break;
    // 2 — I target every job: rings of blades opening outward from the core.
    case 2:
      scene = (
        <>
          <Circle cx={mid} cy={mid} r={54} fill={`url(#${halo})`} />
          <Rosette cx={mid} cy={mid} scale={4.3} rotate={12} fill={EMBER} opacity={0.16} speed={4} phase={0.05} reduce={reduce} />
          <Rosette cx={mid} cy={mid} scale={3.2} rotate={-6} fill={EMBER} opacity={0.34} speed={6} phase={0.4} reduce={reduce} />
          <Rosette cx={mid} cy={mid} scale={2.1} rotate={16} fill={`url(#${emberGold})`} speed={9} phase={0.75} reduce={reduce} />
          <Circle cx={mid} cy={mid} r={4.5} fill={GOLD} />
        </>
      );
      break;
    // 3 — I prep you for the interview: an ascending spiral of blades, gold-forward.
    default:
      scene = (
        <>
          <Circle cx={mid} cy={mid} r={52} fill={`url(#${halo})`} />
          <Rosette cx={mid + 18} cy={mid + 20} scale={1.5} rotate={0} fill={EMBER_DEEP} opacity={0.55} speed={11} phase={0.2} reduce={reduce} />
          <Rosette cx={mid + 4} cy={mid + 4} scale={2.2} rotate={-14} fill={EMBER} opacity={0.85} speed={8} phase={0.6} reduce={reduce} />
          <Rosette cx={mid - 14} cy={mid - 16} scale={3.0} rotate={-28} fill={`url(#${goldEmber})`} speed={6} phase={0.9} reduce={reduce} />
          <Circle cx={mid - 14} cy={mid - 16} r={5} fill={GOLD} />
        </>
      );
  }

  // Supersample: render 2× and scale the bitmap down so the art stays crisp
  // while the slide's scale/opacity transforms rasterise it on Android.
  const SS = 2;

  return (
    <Animated.View
      entering={FadeIn.duration(420)}
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
    >
      <Svg width={size * SS} height={size * SS} viewBox={`0 0 ${V} ${V}`} style={{ transform: [{ scale: 1 / SS }] }}>
        <Defs>
          <RadialGradient id={halo} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={EMBER} stopOpacity={0.16} />
            <Stop offset="0.7" stopColor={EMBER} stopOpacity={0.05} />
            <Stop offset="1" stopColor={EMBER} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id={emberGold} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={EMBER_DEEP} />
            <Stop offset="0.55" stopColor={EMBER} />
            <Stop offset="1" stopColor={GOLD} />
          </LinearGradient>
          <LinearGradient id={goldEmber} x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={EMBER} />
            <Stop offset="1" stopColor={GOLD} />
          </LinearGradient>
        </Defs>
        {scene}
      </Svg>
    </Animated.View>
  );
}
