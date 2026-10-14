import React from "react";
import { Pressable, ScrollView, Text } from "react-native";
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
   *  the greeting chips to seed the conversation by id. */
  onSelect?: (action: QuickAction) => void;
  loading?: boolean;
}

/**
 * The assistant's openers, as the design docks them (§9's bottom workspace, and
 * §6's copy): **one horizontal row of pills**, `flex-shrink: 0`, that scrolls
 * sideways on a narrow phone.
 *
 * It used to be a 2-column grid of bordered cards inside the transcript, with a
 * `width: "47.5%"` per cell. The design is explicit that these four are a
 * *docked row above the composer*, alongside the composer — the same slot the
 * reply suggestions already occupy (`suggestion-chips.tsx`) — and a grid of
 * cards in the thread reads as content the user wrote rather than chrome the
 * product offers.
 *
 * Notes on the values:
 *   - the pill is the design's `px-3.5 py-2 rounded-full bg-surface-container`,
 *     mapped to the warm tokens (`bgSunken` is that surface, `#EFEEEA`);
 *   - `minHeight: 44` is §8's tap floor, and it is the one number the design's
 *     `py-2` (~36 dp) does not survive — the guide's floor wins;
 *   - the row scrolls rather than wraps, so a large font scale widens the pills
 *     instead of clipping them (the old grid's one-column fallback existed only
 *     because a 2-column grid cannot wrap gracefully).
 *
 * The export keeps its component name: `sumaiya-chat-screen.tsx` imports
 * `QuickActionsGrid` by path and only another task owns that file.
 */
export function QuickActionsRow({ actions, onActionPress, onSelect, loading = false }: Props) {
  const c = useThemeColors();
  const { lang } = useLang();
  const reduce = useMotionReduced();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
    >
      {actions.map((a, i) => {
        const label = lang === "sw" && a.labelSw ? a.labelSw : a.label;
        return (
          // §1.9 X2 / §3.8: the enter duration and the stagger come from the
          // chat's own motion table (300 entering, 30 + min(i,3)×40), never
          // from an inline number.
          <Animated.View
            key={a.id}
            entering={FadeInDown.duration(chatEnterMs(reduce, MOTION.dur.slow)).easing(EASE.out).delay(chatStaggerDelayMs(i, reduce))}
          >
            <Pressable
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ disabled: loading }}
              onPress={() => {
                haptics.light();
                if (onSelect) onSelect(a);
                else onActionPress?.(a.action, a.data);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 7,
                minHeight: 44,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: c.bgSunken,
                opacity: loading ? 0.5 : 1,
              }}
            >
              <Icon name={a.icon} size={16} color={c.accentFill} />
              <Text style={{ color: c.text, fontSize: 13, fontWeight: "600" }} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

/** The name the chat screen imports. */
export const QuickActionsGrid = QuickActionsRow;
