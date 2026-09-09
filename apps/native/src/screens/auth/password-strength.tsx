import React from "react";
import { Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useThemeColors } from "../../components/ui/theme";

export function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];

export function PasswordStrength({ password }: { password: string }) {
  const c = useThemeColors();
  const score = scorePassword(password);
  const colors = [c.error, c.error, c.warning, c.success, c.success];
  const width = useSharedValue(0);
  width.value = withTiming((score / 4) * 100, { duration: 220 });

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
    backgroundColor: colors[score],
  }));

  if (!password) return null;

  return (
    <View style={{ marginTop: 8, gap: 5 }}>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: c.border, overflow: "hidden" }}>
        <Animated.View style={[barStyle, { height: 4, borderRadius: 2 }]} />
      </View>
      <Text style={{ fontSize: 11.5, color: c.textMuted, fontWeight: "600" }}>
        {LABELS[score]}
      </Text>
    </View>
  );
}
