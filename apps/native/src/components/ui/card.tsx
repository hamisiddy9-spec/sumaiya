import React from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { haptics } from "./haptics";
import { useThemeColors } from "./theme";

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
  /** Spoken label when the whole card is a button (icon/graphic content). */
  accessibilityLabel?: string;
}

export function Card({ children, onPress, style, padded = true, accessibilityLabel }: CardProps) {
  const c = useThemeColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const inner: ViewStyle = {
    backgroundColor: c.bgElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    padding: padded ? 16 : 0,
    ...style,
  };

  if (!onPress) return <View style={inner}>{children}</View>;

  return (
    <Animated.View style={animStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPressIn={() => (scale.value = withTiming(0.98, { duration: 90 }))}
        onPressOut={() => (scale.value = withTiming(1, { duration: 160 }))}
        onPress={() => {
          haptics.light();
          onPress();
        }}
        style={inner}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
