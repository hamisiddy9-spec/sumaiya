import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Icon } from "../icon";
import { Button } from "./button";
import { useThemeColors } from "./theme";

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: {
  icon: string;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const c = useThemeColors();
  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      // A single centred column. The action button stretches to the column's
      // own width (28px inset each side) so it stays symmetric under the
      // centred text — no alignSelf/maxWidth fight that left it off-centre.
      style={{ alignItems: "center", alignSelf: "stretch", paddingVertical: 40, paddingHorizontal: 28 }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 22,
          backgroundColor: c.accent + "14",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
        }}
      >
        <Icon name={icon} size={30} color={c.accent} />
      </View>
      <Text style={{ color: c.text, fontSize: 18, fontWeight: "700", textAlign: "center", letterSpacing: -0.3 }}>
        {title}
      </Text>
      {body ? (
        <Text style={{ color: c.textMuted, fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20, maxWidth: 320 }}>
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: 24, alignSelf: "stretch" }}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
      {secondaryLabel && onSecondary ? (
        <Pressable onPress={onSecondary} hitSlop={8} style={{ marginTop: 16, alignSelf: "center" }}>
          <Text style={{ color: c.accent, fontSize: 14, fontWeight: "700" }}>{secondaryLabel}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}
