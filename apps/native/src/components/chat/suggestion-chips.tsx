import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { SuggestionChip as Chip, ActionType } from "./chat-types";
import { haptics } from "../ui/haptics";
import { useThemeColors } from "../ui/theme";

interface Props {
  suggestions: Chip[];
  onSuggestionPress: (action: ActionType, data?: Record<string, any>) => void;
}

/**
 * T6 · The suggestion chips (§3.2).
 *
 * Two changes from the chips in the old transcript, both from the pixel review:
 *
 *   1. They are a **docked row above the composer**, not something stacked
 *      inside the transcript. A vision pass measured the running app at roughly
 *      65% conversation / 30% controls, with the chip row repeated verbatim
 *      under two different replies — chips inside the thread read as the user's
 *      own bubbles and wrap into two messy rows on a 390 dp phone.
 *   2. They are neutral-tinted with an ember `›` prefix, so they cannot be
 *      mistaken for a bubble, and they are **capped at three**: a chip names an
 *      outcome (`Lenga kwenye kazi`, `Kagua CV yako`, `Barua ya maombi`) or it
 *      is her speaking (`Ongea nami`) — never a third-party feature label.
 *
 * The row is instant (no per-keystroke motion) and the chips are plain
 * Pressables at 44 dp, which is the touch floor for a row this far down the
 * screen.
 */
export function SuggestionChips({ suggestions, onSuggestionPress }: Props) {
  const c = useThemeColors();
  if (!suggestions.length) return null;
  // Max three, always — the cap is part of the contract, not a layout accident.
  const shown = suggestions.slice(0, 3);

  return (
    <View
      style={{
        backgroundColor: c.bgElevated,
        borderTopWidth: 1,
        borderTopColor: c.border,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingVertical: 8, alignItems: "center" }}
        style={{ flexGrow: 0 }}
        keyboardShouldPersistTaps="handled"
      >
        {shown.map((s) => (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            accessibilityLabel={s.text}
            onPress={() => {
              haptics.light();
              onSuggestionPress(s.action, s.data);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              minHeight: 44,
              borderRadius: 12,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.border + "66",
            }}
          >
            <Text style={{ color: c.accentFill, fontSize: 14, fontWeight: "700" }}>›</Text>
            <Text style={{ color: c.text, fontSize: 12, fontWeight: "700" }}>{s.text}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
