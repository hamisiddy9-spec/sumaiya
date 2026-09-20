import React, { useEffect } from "react";
import { View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  FadeOut,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useThemeColors } from "./theme";
import { MOTION, exitDurationMs, useMotionReduced } from "./motion";
import { useLang } from "../../lib/i18n";

export function Skeleton({
  width,
  height = 16,
  radius = 8,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const c = useThemeColors();
  const opacity = useSharedValue(0.5);
  const reduce = useMotionReduced();

  useEffect(() => {
    // Reduce Motion: a shimmer is decoration, not information — hold one steady
    // tint rather than pulsing. The skeleton still reads as "content is coming".
    if (reduce) {
      opacity.value = 0.7;
      return;
    }
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.5, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    // Cancel on unmount. An uncancelled infinite `withRepeat` keeps queueing
    // prop updates for a node that no longer exists; Reanimated only flushes
    // them when a UI event is dispatched, so each one lands as a
    // `RetryableMountingLayerException` inside an unrelated screen transition
    // (measured: 291 of them in a single cold start, ~3 per frame for the whole
    // 340ms root cross-fade). Stopping the animation at the source is the fix.
    return () => {
      cancelAnimation(opacity);
    };
  }, [reduce, opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        animStyle,
        {
          width: width ?? "100%",
          height,
          borderRadius: radius,
          backgroundColor: c.border,
        },
        style,
      ]}
    />
  );
}

/** A card-shaped skeleton block for list placeholders. */
export function SkeletonCard() {
  const c = useThemeColors();
  return (
    <View
      style={{
        backgroundColor: c.bgElevated,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: c.border,
        padding: 16,
        gap: 10,
        marginBottom: 12,
      }}
    >
      <Skeleton width="55%" height={16} />
      <Skeleton width="30%" height={12} />
      <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
        <Skeleton width="48%" height={32} radius={8} />
        <Skeleton width="48%" height={32} radius={8} />
      </View>
    </View>
  );
}

/**
 * A group of placeholder cards that *leaves* as the real content arrives.
 *
 * The old pattern — `{loading ? <><SkeletonCard/><SkeletonCard/></> : <list/>}`
 * — unmounted the placeholders in the same commit that mounted the list, so the
 * spot the user was watching went blank for a frame and the content appeared
 * into the hole: the classic spinner-to-content snap. Giving the group an
 * `exiting` fade hands the space over instead: the page never shows an empty
 * slot, and the incoming rows stagger into a surface that is already settled.
 *
 * `gap` defaults to 0 because `SkeletonCard` carries its own `marginBottom`; a
 * caller that previously wrapped its skeletons in a `gap` View passes it here so
 * the spacing is unchanged.
 */
export function SkeletonList({ count = 3, gap = 0, label }: { count?: number; gap?: number; label?: string }) {
  const reduce = useMotionReduced();
  const { t } = useLang();
  // Six screens mount this as their whole loading state (home, CV list, jobs,
  // applications, ATS check, learning hub). It rendered pure grey blocks with
  // no words and no accessibility label, so a screen-reader user got silence
  // and a sighted user got an unexplained blank page. One label here covers
  // all six with no per-screen cost; a caller with something more specific to
  // say passes its own.
  const a11yLabel = label ?? t("Loading…", "Inapakia…");
  return (
    <Animated.View
      exiting={FadeOut.duration(exitDurationMs(reduce))}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={a11yLabel}
      accessibilityLiveRegion="polite"
    >
      <View
        style={gap ? { gap } : undefined}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {Array.from({ length: Math.max(0, Math.floor(count)) }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    </Animated.View>
  );
}

