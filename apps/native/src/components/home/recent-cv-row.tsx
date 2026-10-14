import React from "react";
import { Text, View } from "react-native";
import { Card, useThemeColors } from "../ui";
import { Icon } from "../icon";
import { FONT, HOME_SPACING } from "./tokens";
import type { CvStatus } from "./home-labels";

/**
 * One recent-CV row: a 44 dp thumbnail carrying the design's 2 px ember bar
 * along its bottom edge, the title, the meta line, a status chip and a
 * chevron.
 *
 * The thumbnail was 42 dp with no bar and no chip; 44 is §8's floor and the
 * bar is what makes the row read as a document rather than a generic icon
 * well.
 *
 * The title is NOT clamped to one line. The design truncates it, but §8
 * requires the layout to hold at 200 % text scale, and a single clamped line
 * is the thing that breaks there — it wraps to two instead.
 */
export function RecentCvRow({
  title,
  meta,
  status,
  statusLabel,
  onPress,
}: {
  title: string;
  meta: string;
  status: CvStatus;
  statusLabel: string;
  onPress: () => void;
}) {
  const c = useThemeColors();
  const chip =
    status === "draft"
      ? { bg: c.bgSunken, fg: c.textMuted }
      : { bg: c.successTint, fg: c.success };

  return (
    <Card
      onPress={onPress}
      padded={false}
      accessibilityLabel={`${title}. ${meta}. ${statusLabel}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        backgroundColor: c.bgElevated,
      }}
    >
      <View
        style={{
          width: HOME_SPACING.minTarget,
          height: HOME_SPACING.minTarget,
          borderRadius: 12,
          backgroundColor: c.accent + "14",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <Icon name="file-text" size={20} color={c.accent} />
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 2,
            backgroundColor: c.accent,
          }}
        />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{ color: c.text, fontSize: 14.5, lineHeight: 20, fontFamily: FONT.semibold }}
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 17, marginTop: 2, fontFamily: FONT.regular }}>
          {meta}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: chip.bg,
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          {status === "complete" ? <Icon name="check" size={10} color={chip.fg} /> : null}
          <Text style={{ color: chip.fg, fontSize: 10.5, fontFamily: FONT.bold }}>{statusLabel}</Text>
        </View>
        <Icon name="chevron-right" size={18} color={c.textMuted} />
      </View>
    </Card>
  );
}
