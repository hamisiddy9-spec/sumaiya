import React from "react";
import { Text, View } from "react-native";
import { Card, useThemeColors } from "../ui";
import { Icon } from "../icon";
import { FONT, HOME_SPACING } from "./tokens";

/**
 * One quick-action tile: an icon well, a label, and the sublabel that says what
 * the tile actually does. The sublabels are not decoration — "Ukaguzi wa CV"
 * alone does not tell you whether it scores, fixes or files; "Uchambuzi wa CV"
 * does.
 *
 * TINTS: `primary` is the design's one ember-tinted tile; every other tile has
 * a NEUTRAL well (`surfaceSunken` well, `text` icon). The screen this replaces
 * gave each tile its own colour — including a pine `#12433D` that is not in the
 * palette at all — which is the second palette §1 bans. Stitch tints only the
 * leading tile, and so does this.
 *
 * The well is 44×44 (§8's floor) with a 12 radius, per the design's
 * `w-10 h-10 rounded-xl` scaled up to the guide's tap-target rule.
 */
export function QuickActionTile({
  icon,
  label,
  sublabel,
  primary = false,
  width,
  onPress,
}: {
  icon: string;
  label: string;
  sublabel: string;
  /** The design's leading tile: filled ember well, ember icon. */
  primary?: boolean;
  width: number;
  onPress: () => void;
}) {
  const c = useThemeColors();
  const tint = primary ? c.accent : c.text;

  return (
    <Card
      onPress={onPress}
      padded={false}
      accessibilityLabel={`${label}. ${sublabel}`}
      style={{
        width,
        padding: 14,
        alignItems: "flex-start",
        gap: 10,
        backgroundColor: c.bgElevated,
      }}
    >
      <View
        style={{
          width: HOME_SPACING.minTarget,
          height: HOME_SPACING.minTarget,
          borderRadius: 12,
          backgroundColor: primary ? c.accent + "1f" : c.bgSunken,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={22} color={tint} />
      </View>
      <View style={{ gap: 2 }}>
        {/* No numberOfLines: at 200 % text scale a clamped label is what
            breaks the grid, and a wrapped one only makes the tile taller. */}
        <Text style={{ color: c.text, fontSize: 15.5, lineHeight: 20, fontFamily: FONT.bold }}>{label}</Text>
        <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 17, fontFamily: FONT.regular }}>{sublabel}</Text>
      </View>
    </Card>
  );
}
