import React, { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SumaiyaMark } from "./sumaiya-mark";
import { useThemeColors } from "./ui/theme";

/**
 * The "Anza" moment — the last onboarding screen collapses into the centre of
 * Sumaiya's mark, the mark blooms outward and floods the screen, and we hand
 * off to the app. Entering the product *through* the spinner.
 *
 * onDone fires while the screen is fully covered, so whatever mounts next
 * (sign-in / the app) cross-fades in from behind a solid field of colour
 * instead of snapping in.
 */
const { width, height } = Dimensions.get("window");
const DIAG = Math.hypot(width, height);
const CORE = 132; // starting disc — matches the onboarding mark's plate

export function PortalTransition({ onDone }: { onDone: () => void }) {
  const c = useThemeColors();

  const disc = useSharedValue(CORE / DIAG); // scale of the flooding disc (0..1 of DIAG)
  const markScale = useSharedValue(1);
  const markOpacity = useSharedValue(0);
  const flash = useSharedValue(0);

  useEffect(() => {
    markOpacity.value = withTiming(1, { duration: 160 });
    // a beat of held focus, then the bloom
    markScale.value = withSequence(
      withTiming(0.82, { duration: 220, easing: Easing.in(Easing.quad) }),
      withTiming(2.6, { duration: 620, easing: Easing.in(Easing.cubic) }),
      withTiming(3.4, { duration: 380, easing: Easing.out(Easing.quad) }),
    );
    disc.value = withDelay(
      240,
      withTiming(1, { duration: 640, easing: Easing.in(Easing.cubic) }, (finished) => {
        "worklet";
        if (finished) runOnJS(onDone)();
      }),
    );
    flash.value = withDelay(
      760,
      withSequence(
        withTiming(1, { duration: 180 }),
        withTiming(0, { duration: 520 }),
      ),
    );
  }, [disc, markScale, markOpacity, flash, onDone]);

  const discStyle = useAnimatedStyle(() => ({
    transform: [{ scale: disc.value }],
  }));
  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: markScale.value }],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value * 0.9 }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* the flooding disc */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: width / 2 - DIAG / 2,
            top: height / 2 - DIAG / 2,
            width: DIAG,
            height: DIAG,
            borderRadius: DIAG / 2,
            backgroundColor: c.accent,
          },
          discStyle,
        ]}
      />
      {/* the mark at the centre, blooming */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: width / 2 - 40,
            top: height / 2 - 40,
            width: 80,
            height: 80,
            alignItems: "center",
            justifyContent: "center",
          },
          markStyle,
        ]}
      >
        <SumaiyaMark size={64} state="thinking" color="#FAF5EE" />
      </Animated.View>
      {/* a brief warm flash at full bloom */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#FFF7F0" }, flashStyle]} />
    </View>
  );
}
