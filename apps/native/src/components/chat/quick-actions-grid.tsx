import React from "react";
import { Pressable, Text, View } from "react-native";
import { useWindowDimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { QuickAction, ActionType } from "./chat-types";
import { Icon } from "../icon";
import { haptics } from "../ui/haptics";
import { useThemeColors } from "../ui/theme";
import { EASE, MOTION, useMotionReduced } from "../ui/motion";
import { chatEnterMs, chatStaggerDelayMs } from "./chat-motion";
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
  const reduce = useMotionReduced();
  // §3.7 / R6: at a large font scale a 2-column grid clips or overlaps. ~20% of
  // Android users run a scale above default, so the grid becomes ONE column
  // rather than pretending the labels still fit — and at the default scale
  // nothing about the layout changes.
  const { fontScale } = useWindowDimensions();
  const oneColumn = fontScale >= 1.3;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {actions.map((a, i) => (
        // §1.9 X2 / §3.8: 280 and 55 were OFF-TOKEN (the tokens are 300 entering
        // and 30 + min(i,3)×40). The chat's own stagger helper is used here, and
        // the cap is 3 so the fourth card does not wait longer than the third.
        <Animated.View
          key={a.id}
          entering={FadeInDown.duration(chatEnterMs(reduce, MOTION.dur.slow)).easing(EASE.out).delay(chatStaggerDelayMs(i, reduce))}
          style={{ width: oneColumn ? "100%" : "47.5%" }}
        >
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
