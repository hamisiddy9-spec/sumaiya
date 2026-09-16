import React from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { publishTabBarHeight } from "./tab-bar-metrics";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  interpolateColor,
} from "react-native-reanimated";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Icon } from "../components/icon";
import { SumaiyaMark } from "../components/sumaiya-mark";
import { haptics } from "../components/ui/haptics";
import { useThemeColors } from "../components/ui/theme";
import { useLang } from "../lib/i18n";

const ICONS: Record<string, string> = {
  HomeTab: "home",
  CVsTab: "file-text",
  SumaiyaTab: "sumaiya",
  ImportTab: "import",
  ProfileTab: "user",
};

function TabItem({
  focused,
  label,
  icon,
  onPress,
  onLongPress,
}: {
  focused: boolean;
  label: string;
  icon: string;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const c = useThemeColors();
  const progress = useDerivedValue(() => withSpring(focused ? 1 : 0, { damping: 20, stiffness: 180, mass: 0.8 }));

  // No translateY here. The shade (pillStyle) is absolutely positioned and does
  // NOT move, so lifting only the icon left it visibly off-centre inside its own
  // shade whenever that shade was visible — measured 6.5px high on a 1.7x/272dpi
  // screen (2dp from this lift, the rest being the 3-blade mark's own resting
  // lean). The scale pop is symmetric about the centre, so it stays concentric.
  // Focus is still signalled by the shade, the scale, the colour and the haptic.
  const iconStyle = useAnimatedStyle(() => {
    const scale: number = 1 + progress.value * 0.12;
    return { transform: [{ scale }] as unknown as [] };
  });
  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.7 + progress.value * 0.3 }],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [c.textBody, c.accent]),
  }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 6, gap: 3 }}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
    >
      <View style={{ width: 44, height: 30, alignItems: "center", justifyContent: "center" }}>
        <Animated.View
          style={[
            pillStyle,
            {
              position: "absolute",
              width: 44,
              height: 30,
              borderRadius: 15,
              backgroundColor: c.accent + "1f",
            },
          ]}
        />
        <Animated.View style={iconStyle}>
          {icon === "sumaiya" ? (
            <SumaiyaMark size={22} color={focused ? c.accent : c.textBody} state={focused ? "idle" : "static"} />
          ) : (
            <Icon name={icon} size={22} color={focused ? c.accent : c.textBody} strokeWidth={focused ? 2.5 : 2.1} />
          )}
        </Animated.View>
      </View>
      <Animated.Text style={[labelStyle, { fontSize: 11, fontWeight: focused ? "700" : "600", letterSpacing: 0.1 }]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

export function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useLang();

  // The navigator's static `title` options are English-only, so in Swahili mode
  // the app's primary navigation rendered untranslated. Translate here instead.
  const TAB_LABELS: Record<string, string> = {
    HomeTab: t("Home", "Nyumbani"),
    CVsTab: t("My CVs", "CV zangu"),
    SumaiyaTab: t("Sumaiya", "Sumaiya"),
    ImportTab: t("Import", "Pakia"),
    ProfileTab: t("Profile", "Wasifu"),
  };

  return (
    <View
      // The bar publishes its true height so bottom-anchored floating UI (the
      // update download pill) can clear it instead of guessing — see
      // ./tab-bar-metrics. Measured, because large accessibility text makes the
      // bar taller than any constant.
      onLayout={(e) => publishTabBarHeight(e.nativeEvent.layout.height)}
      style={{
        flexDirection: "row",
        backgroundColor: c.bgElevated,
        borderTopWidth: 1,
        borderTopColor: c.border,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
        paddingTop: 6,
        paddingHorizontal: 6,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        // The tab labels come from the navigator's static `title` options, which
        // are English-only — so in Swahili mode the app's PRIMARY navigation was
        // left untranslated. Translate at the render point instead.
        const label =
          TAB_LABELS[route.name] ??
          (typeof options.tabBarLabel === "string"
            ? options.tabBarLabel
            : options.title ?? route.name);

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            haptics.selection();
            navigation.navigate(route.name as never);
          }
        };
        const onLongPress = () =>
          navigation.emit({ type: "tabLongPress", target: route.key });

        return (
          <TabItem
            key={route.key}
            focused={focused}
            label={String(label)}
            icon={ICONS[route.name] ?? "circle"}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
}
