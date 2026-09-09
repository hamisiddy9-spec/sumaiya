import React, { useEffect } from "react";
import { View, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useThemeColors } from "./theme";

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

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 700 }), withTiming(0.5, { duration: 700 })),
      -1,
      true,
    );
  }, []);

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
