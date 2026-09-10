import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useThemeColors } from "../components/ui/theme";
import { SumaiyaMark } from "../components/sumaiya-mark";
import { useLang } from "../lib/i18n";

export function SplashScreen() {
  const c = useThemeColors();
  const { t } = useLang();
  const logo = useSharedValue(0);
  const word = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    logo.value = withTiming(1, { duration: 480, easing: Easing.out(Easing.back(1.6)) });
    word.value = withDelay(240, withTiming(1, { duration: 420 }));
    pulse.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
      ),
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logo.value,
    transform: [{ scale: logo.value * pulse.value }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value,
    transform: [{ translateY: (1 - word.value) * 10 }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", gap: 22 }}>
      <Animated.View
        style={[
          logoStyle,
          {
            width: 96,
            height: 96,
            borderRadius: 26,
            backgroundColor: c.accent,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: c.accent,
            shadowOpacity: 0.35,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 10 },
          },
        ]}
      >
        <SumaiyaMark size={52} state="thinking" color="#FAF5EE" />
      </Animated.View>

      <Animated.View style={[wordStyle, { alignItems: "center", gap: 6 }]}>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 }}>
          Sumaiya
        </Text>
        <Text style={{ color: c.textMuted, fontSize: 13, fontWeight: "600" }}>
          {t("Your job companion", "Msaidizi wako wa kupata ajira")}
        </Text>
      </Animated.View>
    </View>
  );
}
