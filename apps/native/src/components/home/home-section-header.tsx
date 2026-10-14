import React from "react";
import { Pressable, Text, View } from "react-native";
import { Icon } from "../icon";
import { haptics, useThemeColors } from "../ui";
import { FONT, HOME_SPACING } from "./tokens";

/**
 * The section header on Home, and the reason it is not the shared one.
 *
 * `components/ui/section-header.tsx` gives its action a 13.5 px label with
 * `hitSlop: 8` — ≈34 dp of real target, under §8's 44 dp floor. That component
 * is used by screens this workstream does not own, so Home carries its own
 * header rather than changing the shared one underneath five other screens.
 *
 * The design's header is a title (18/700, tracking-tight) on the left and
 * either a tracked metric (`Zana 4`) or an action (`Tazama zote`) on the
 * right. The title wraps instead of clamping — §8's rule is that the layout
 * holds at 200 % text scale, and a one-line clamp is what breaks it.
 */
export function HomeSectionHeader({
  title,
  meta,
  actionLabel,
  onAction,
}: {
  title: string;
  /** Tracked metric on the right (`Zana 4`). Ignored when an action is given. */
  meta?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const c = useThemeColors();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: HOME_SPACING.gutter,
        marginBottom: 10,
      }}
    >
      <Text
        style={{
          flexShrink: 1,
          color: c.text,
          fontSize: 18,
          lineHeight: 24,
          letterSpacing: -0.3,
          fontFamily: FONT.bold,
        }}
      >
        {title}
      </Text>

      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={() => {
            haptics.selection();
            onAction();
          }}
          style={{
            minHeight: HOME_SPACING.minTarget,
            justifyContent: "center",
            paddingVertical: 12,
            paddingLeft: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Text style={{ color: c.accent, fontSize: 13.5, fontFamily: FONT.bold }}>{actionLabel}</Text>
            <Icon name="chevron-right" size={15} color={c.accent} />
          </View>
        </Pressable>
      ) : meta ? (
        <Text
          style={{
            flexShrink: 0,
            color: c.textMuted,
            fontSize: 11,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            fontFamily: FONT.mono,
          }}
        >
          {meta}
        </Text>
      ) : null}
    </View>
  );
}
