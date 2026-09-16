import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { QuickAction, ActionType } from "./chat-types";
import { Icon } from "../icon";
import { haptics } from "../ui/haptics";
import { useThemeColors } from "../ui/theme";
import { useLang } from "../../lib/i18n";

interface Props {
  actions: QuickAction[];
  onActionPress?: (action: ActionType, data?: Record<string, any>) => void;
  /** When set, called with the whole action instead of onActionPress — used by
   *  the greeting grid to seed the conversation by id. */
  onSelect?: (action: QuickAction) => void;
  loading?: boolean;
}

export function QuickActionsGrid({ actions, onActionPress, onSelect, loading = false }: Props) {
  const c = useThemeColors();
  const { lang } = useLang();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {actions.map((a, i) => (
        <Animated.View key={a.id} entering={FadeInDown.duration(280).delay(i * 55)} style={{ width: "47.5%" }}>
          <Pressable
            disabled={loading}
            accessibilityRole="button"
            onPress={() => {
              haptics.light();
              if (onSelect) onSelect(a);
              else onActionPress?.(a.action, a.data);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 9,
              paddingVertical: 13,
              paddingHorizontal: 12,
              borderRadius: 13,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.bgElevated,
              opacity: loading ? 0.5 : 1,
            }}
          >
            <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: c.accent + "16", alignItems: "center", justifyContent: "center" }}>
              <Icon name={a.icon} size={15} color={c.accent} />
            </View>
            <Text style={{ flex: 1, color: c.text, fontSize: 13, fontWeight: "700" }} numberOfLines={1}>
              {lang === "sw" && a.labelSw ? a.labelSw : a.label}
            </Text>
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
}
