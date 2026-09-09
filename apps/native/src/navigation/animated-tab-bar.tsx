import React from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Icon } from "../components/icon";
import { SumaiyaMark } from "../components/sumaiya-mark";
import { haptics } from "../components/ui/haptics";
import { useThemeColors } from "../components/ui/theme";

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
  const progress = useDerivedValue(() => withSpring(focused ? 1 : 0, { damping: 15, stiffness: 180 }));

  const iconStyle = useAnimatedStyle(() => {
    const translateY: number = withTiming(focused ? -2 : 0, { duration: 160 });
    const scale: number = 1 + progress.value * 0.12;
    // reanimated's DefaultStyle transform type rejects a mixed [{translateY},{scale}]
    // literal; the runtime shape is correct.
    return { transform: [{ translateY }, { scale }] as unknown as [] };
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

  return (
    <View
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
        const label =
          typeof options.tabBarLabel === "string"
            ? options.tabBarLabel
            : options.title ?? route.name;

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
