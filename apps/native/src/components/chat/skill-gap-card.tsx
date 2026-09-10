import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import type { SkillGap, ActionType } from "./chat-types";
import { Icon } from "../icon";
import { SumaiyaMark } from "../sumaiya-mark";
import { haptics } from "../ui/haptics";
import { useThemeColors } from "../ui/theme";

interface Props {
  skills: SkillGap[];
  onActionPress: (action: ActionType, data?: Record<string, any>) => void;
  loading?: boolean;
}

function Row({ skill }: { skill: SkillGap }) {
  const c = useThemeColors();
  const pct = Math.round(skill.current * 100);
  const target = Math.round(skill.required * 100);
  const sev = skill.gap > 0.5 ? c.error : skill.gap > 0.2 ? c.warning : c.success;
  const w = useSharedValue(0);
  w.value = withTiming(pct, { duration: 400 });
  const bar = useAnimatedStyle(() => ({ width: `${w.value}%` }));

  return (
    <View style={{ gap: 5 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: c.text, fontSize: 13.5, fontWeight: "700" }}>{skill.skill}</Text>
        <Text style={{ color: sev, fontSize: 11, fontWeight: "700" }}>
          {pct}% → {target}%
        </Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: c.border, overflow: "hidden" }}>
        <Animated.View style={[bar, { height: 6, borderRadius: 3, backgroundColor: sev }]} />
      </View>
    </View>
  );
}

export function SkillGapCard({ skills, onActionPress, loading = false }: Props) {
  const c = useThemeColors();
  const sorted = useMemo(() => [...(skills ?? [])].sort((a, b) => b.gap - a.gap), [skills]);
  if (!sorted.length) return null;

  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.bgElevated,
        overflow: "hidden",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <Icon name="target" size={16} color={c.accent} />
        <Text style={{ color: c.text, fontSize: 14.5, fontWeight: "700" }}>Your skill gaps</Text>
      </View>

      <View style={{ padding: 14, gap: 12 }}>
        {sorted.map((s, i) => (
          <Row key={`${s.skill}-${i}`} skill={s} />
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingBottom: 14 }}>
        <Pressable
          disabled={loading}
          onPress={() => {
            haptics.light();
            onActionPress("learn", { skills: sorted });
          }}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: c.accent,
            opacity: loading ? 0.5 : 1,
          }}
        >
          <Icon name="briefcase" size={14} color={c.accentText} />
          <Text style={{ color: c.accentText, fontSize: 13, fontWeight: "700" }}>Learn</Text>
        </Pressable>
        <Pressable
          disabled={loading}
          onPress={() => {
            haptics.light();
            onActionPress("practice", { skills: sorted });
          }}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 10,
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: c.border,
            opacity: loading ? 0.5 : 1,
          }}
        >
          <SumaiyaMark size={14} state="static" color={c.text} />
          <Text style={{ color: c.text, fontSize: 13, fontWeight: "700" }}>Practice</Text>
        </Pressable>
      </View>
    </View>
  );
}
