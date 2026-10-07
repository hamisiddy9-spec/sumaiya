import React from "react";
import { Pressable, Text, View } from "react-native";
import { Icon } from "../icon";
import { Button } from "./button";
import { useThemeColors } from "./theme";
import { MOTION, Reveal } from "./motion";

/**
 * The empty / not-yet state — two-beat reveal: the icon, title and body settle
 * first, the action arrives a beat later. The hierarchy is the point: here is
 * the situation, then here is what you can do about it.
 *
 * This component used to have NO entrance animation at all, and the reason is
 * worth recording because it explains the shape below. A previous session
 * wrapped it in an `entering` layout animation and the action Button became
 * non-interactive on Fabric — the "buttons do nothing" empty state — so the
 * animation was deleted.
 *
 * `Reveal` animates with a `useAnimatedStyle` driven by a shared value rather
 * than a layout-animation intercept. Nothing is registered with the mounting
 * layer, so the children stay interactive, and the standing "no boom" rule
 * holds: an empty state is a state change like any other, and nothing appears
 * instantly.
 */
export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: {
  icon: string;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const c = useThemeColors();
  return (
    <Reveal>
      <View
        style={{ alignItems: "center", alignSelf: "stretch", paddingVertical: 40, paddingHorizontal: 28 }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            backgroundColor: c.accent + "14",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          <Icon name={icon} size={30} color={c.accent} />
        </View>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: "700", textAlign: "center", letterSpacing: -0.3 }}>
          {title}
        </Text>
        {body ? (
          <Text style={{ color: c.textMuted, fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20, maxWidth: 320 }}>
            {body}
          </Text>
        ) : null}
        {actionLabel && onAction ? (
          <Reveal delayMs={MOTION.dur.fast} style={{ marginTop: 24, alignSelf: "stretch" }}>
            <Button label={actionLabel} onPress={onAction} />
          </Reveal>
        ) : null}
        {secondaryLabel && onSecondary ? (
          <Reveal delayMs={MOTION.dur.base}>
            <Pressable accessibilityRole="button" onPress={onSecondary} hitSlop={8} style={{ marginTop: 16, alignSelf: "center" }}>
              <Text style={{ color: c.accent, fontSize: 14, fontWeight: "700" }}>{secondaryLabel}</Text>
            </Pressable>
          </Reveal>
        ) : null}
      </View>
    </Reveal>
  );
}
