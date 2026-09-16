import React from "react";
import { Pressable, ScrollView, Text } from "react-native";
import type { SuggestionChip as Chip, ActionType } from "./chat-types";
import { haptics } from "../ui/haptics";
import { useThemeColors } from "../ui/theme";

interface Props {
  suggestions: Chip[];
  onSuggestionPress: (action: ActionType, data?: Record<string, any>) => void;
  loading?: boolean;
}

export function SuggestionChips({ suggestions, onSuggestionPress, loading = false }: Props) {
  const c = useThemeColors();
  if (!suggestions.length) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
      {suggestions.map((s) => (
        <Pressable
          key={s.id}
          disabled={loading}
          accessibilityRole="button"
          onPress={() => {
            haptics.light();
            onSuggestionPress(s.action, s.data);
          }}
          style={{
            borderRadius: 999,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: c.accent + "40",
            backgroundColor: c.accent + "12",
            opacity: loading ? 0.5 : 1,
          }}
        >
          <Text style={{ color: c.accent, fontSize: 13, fontWeight: "700" }}>{s.text}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
