import React from "react";
import { Pressable, Text, View } from "react-native";
import { Icon } from "../icon";
import { haptics } from "./haptics";
import { useThemeColors } from "./theme";

export function SectionHeader({
  title,
  icon,
  actionLabel,
  onAction,
}: {
  title: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const c = useThemeColors();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {icon ? <Icon name={icon} size={17} color={c.textBody} /> : null}
        <Text style={{ color: c.text, fontSize: 18, fontWeight: "700", letterSpacing: -0.3 }}>
          {title}
        </Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => {
            haptics.selection();
            onAction();
          }}
          style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
        >
          <Text style={{ color: c.accent, fontSize: 13.5, fontWeight: "700" }}>{actionLabel}</Text>
          <Icon name="chevron-right" size={15} color={c.accent} />
        </Pressable>
      ) : null}
    </View>
  );
}
