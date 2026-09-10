import React from "react";
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";
import Animated, { FadeIn } from "react-native-reanimated";

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
const ESPRESSO = "#211A15"; // the dark core the blades open around

/** A 3-blade rosette centred on (cx,cy) at a given scale + rotation + fill. */
function Rosette({
  cx,
  cy,
  scale,
  rotate = 0,
  fill,
  opacity = 1,
}: {
  cx: number;
  cy: number;
  scale: number;
  rotate?: number;
  fill: string;
  opacity?: number;
}) {
  // translate to origin, scale, rotate, translate back — around the blade grid's
  // own centre (12,12).
  const t = `translate(${cx} ${cy}) scale(${scale}) rotate(${rotate}) translate(-12 -12)`;
  return (
    <G transform={t} opacity={opacity}>
      <Path d={BLADE} fill={fill} />
      <Path d={BLADE} fill={fill} opacity={0.9} transform="rotate(120 12 12)" />
      <Path d={BLADE} fill={fill} opacity={0.8} transform="rotate(240 12 12)" />
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

  let scene: React.ReactNode;
  switch (variant) {
    // 0 — Meet Sumaiya: one calm bloom, ember→gold, soft halo.
    case 0:
      scene = (
        <>
          <Circle cx={mid} cy={mid} r={54} fill={`url(#${halo})`} />
          <Rosette cx={mid} cy={mid} scale={3.1} rotate={-8} fill={`url(#${emberGold})`} />
          <Circle cx={mid} cy={mid} r={5.5} fill={ESPRESSO} />
        </>
      );
      break;
    // 1 — I write it with you: two blooms overlapping, ember + pine converging.
    case 1:
      scene = (
        <>
          <Circle cx={mid} cy={mid} r={52} fill={`url(#${halo})`} />
          <Rosette cx={mid - 15} cy={mid + 6} scale={2.4} rotate={20} fill={PINE} opacity={0.9} />
          <Rosette cx={mid + 15} cy={mid - 6} scale={2.4} rotate={-20} fill={`url(#${emberGold})`} />
          <Circle cx={mid} cy={mid} r={4.5} fill={ESPRESSO} />
        </>
      );
      break;
    // 2 — I target every job: rings of blades opening outward from the core.
    case 2:
      scene = (
        <>
          <Circle cx={mid} cy={mid} r={54} fill={`url(#${halo})`} />
          <Rosette cx={mid} cy={mid} scale={4.3} rotate={12} fill={EMBER} opacity={0.16} />
          <Rosette cx={mid} cy={mid} scale={3.2} rotate={-6} fill={EMBER} opacity={0.34} />
          <Rosette cx={mid} cy={mid} scale={2.1} rotate={16} fill={`url(#${emberGold})`} />
          <Circle cx={mid} cy={mid} r={4.5} fill={ESPRESSO} />
        </>
      );
      break;
    // 3 — I prep you for the interview: an ascending spiral of blades, gold-forward.
    default:
      scene = (
        <>
          <Circle cx={mid} cy={mid} r={52} fill={`url(#${halo})`} />
          <Rosette cx={mid + 18} cy={mid + 20} scale={1.5} rotate={0} fill={EMBER_DEEP} opacity={0.55} />
          <Rosette cx={mid + 4} cy={mid + 4} scale={2.2} rotate={-14} fill={EMBER} opacity={0.85} />
          <Rosette cx={mid - 14} cy={mid - 16} scale={3.0} rotate={-28} fill={`url(#${goldEmber})`} />
          <Circle cx={mid - 14} cy={mid - 16} r={5} fill={ESPRESSO} />
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
        {/* Soft concentric guide rings — depth under every scene, so the art
            reads as crafted rather than a flat stamp. */}
        <Circle cx={mid} cy={mid} r={46} fill="none" stroke={EMBER} strokeWidth={0.6} opacity={0.12} />
        <Circle cx={mid} cy={mid} r={34} fill="none" stroke={GOLD} strokeWidth={0.6} opacity={0.16} />
        {scene}
      </Svg>
    </Animated.View>
  );
}
