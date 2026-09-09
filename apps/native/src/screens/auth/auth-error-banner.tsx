import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import { Icon } from "../../components/icon";
import { haptics } from "../../components/ui/haptics";
import { useThemeColors } from "../../components/ui/theme";

export function AuthErrorBanner({
  error,
  onDismiss,
}: {
  error: string | null | undefined;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (error) haptics.error();
  }, [error]);

  const c = useThemeColors();
  if (!error) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOut.duration(150)}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        backgroundColor: c.error + "18",
        borderColor: c.error + "40",
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 18,
      }}
    >
      <Icon name="alert-circle" size={18} color={c.error} />
      <Text style={{ flex: 1, color: c.error, fontSize: 13.5, lineHeight: 19, fontWeight: "500" }}>
        {error}
      </Text>
      <Pressable hitSlop={8} onPress={onDismiss} accessibilityLabel="Dismiss">
        <Icon name="x" size={16} color={c.error} />
      </Pressable>
    </Animated.View>
  );
}
