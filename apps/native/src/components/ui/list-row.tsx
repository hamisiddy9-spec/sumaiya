import React from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { Icon } from "../icon";
import { haptics } from "./haptics";
import { useThemeColors } from "./theme";

interface ListRowProps {
  icon?: string;
  iconColor?: string;
  label: string;
  sublabel?: string;
  /** Right-side value text (e.g. "English"). */
  value?: string;
  onPress?: () => void;
  /** Shows a chevron. Auto-true when onPress is set and no toggle/value. */
  chevron?: boolean;
  toggle?: { value: boolean; onValueChange: (v: boolean) => void };
  destructive?: boolean;
  disabled?: boolean;
  /** First / last in a group → rounds the right corners. */
  first?: boolean;
  last?: boolean;
}

export function ListRow({
  icon,
  iconColor,
  label,
  sublabel,
  value,
  onPress,
  chevron,
  toggle,
  destructive,
  disabled,
  first,
  last,
}: ListRowProps) {
  const c = useThemeColors();
  const showChevron = chevron ?? (!!onPress && !toggle && value === undefined);
  const fg = destructive ? c.error : c.text;

  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 13,
        paddingHorizontal: 16,
        paddingVertical: 13,
        backgroundColor: c.bgElevated,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: c.border,
        borderTopLeftRadius: first ? 14 : 0,
        borderTopRightRadius: first ? 14 : 0,
        borderBottomLeftRadius: last ? 14 : 0,
        borderBottomRightRadius: last ? 14 : 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon ? (
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            backgroundColor: (iconColor ?? (destructive ? c.error : c.textBody)) + "1f",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon} size={16} color={iconColor ?? (destructive ? c.error : c.textBody)} />
        </View>
      ) : null}

      <View style={{ flex: 1 }}>
        <Text style={{ color: fg, fontSize: 15, fontWeight: "600" }}>{label}</Text>
        {sublabel ? (
          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 1 }}>{sublabel}</Text>
        ) : null}
      </View>

      {value !== undefined ? (
        <Text style={{ color: c.textMuted, fontSize: 14 }}>{value}</Text>
      ) : null}
      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={(v) => {
            haptics.selection();
            toggle.onValueChange(v);
          }}
          trackColor={{ true: c.accent, false: c.border }}
          thumbColor="#fff"
        />
      ) : null}
      {showChevron ? <Icon name="chevron-right" size={17} color={c.textMuted} /> : null}
    </View>
  );

  if (!onPress || toggle) return content;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        haptics.light();
        onPress();
      }}
      android_ripple={{ color: c.border }}
    >
      {content}
    </Pressable>
  );
}

/** Small caps label above a group of rows. */
export function ListGroupLabel({ children }: { children: string }) {
  const c = useThemeColors();
  return (
    <Text
      style={{
        color: c.textMuted,
        fontSize: 11.5,
        fontWeight: "800",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: 8,
        marginTop: 22,
        marginLeft: 4,
      }}
    >
      {children}
    </Text>
  );
}
