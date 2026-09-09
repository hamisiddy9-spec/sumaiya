import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useThemeColors } from "./theme";

/**
 * One screen title, everywhere. Every screen was rolling its own <Text> with
 * a different fontSize (24/26/30), letterSpacing (-0.4/-0.5/-0.6) and margin —
 * which read as "not aligned" screen to screen. This is the single source.
 */
export function ScreenTitle({
  children,
  eyebrow,
  trailing,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  trailing?: React.ReactNode;
}) {
  const c = useThemeColors();
  return (
    <Animated.View
      entering={FadeIn.duration(260)}
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginTop: 8,
        marginBottom: 20,
        gap: 12,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        {eyebrow ? (
          <Text style={{ color: c.textMuted, fontSize: 13, fontWeight: "600", marginBottom: 2 }}>
            {eyebrow}
          </Text>
        ) : null}
        <Text
          style={{ color: c.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 }}
          numberOfLines={1}
        >
          {children}
        </Text>
      </View>
      {trailing ? <View style={{ flexShrink: 0 }}>{trailing}</View> : null}
    </Animated.View>
  );
}
