import React from "react";
import { Image, Text, View } from "react-native";
import { Reveal, useThemeColors } from "../ui";
import { FONT, HOME_SPACING } from "./tokens";

/**
 * The greeting block, and the hierarchy fix.
 *
 * The design makes the GREETING the hero — `Karibu jioni hii,` at 30/800,
 * leading 1.15 — and the name secondary at 19. What shipped was inverted: the
 * shared `ScreenTitle` renders its `eyebrow` slot at 13/600 and its title at
 * 28/800, and Home passed the greeting as the eyebrow and the name as the
 * title, so the screen's loudest words were the user's own name.
 *
 * This is Home's own greeting rather than a change to `ScreenTitle`, which 20+
 * other screens use and this workstream does not own.
 *
 * The avatar is here because §7 keeps it on Home (and Profile) while removing
 * the version pill and the bell — the pill and bell are absent, and the
 * avatar's green dot is a presence marker, not the notification dot §10 bans.
 * When there is no photo the well shows the name's initial rather than
 * borrowing someone else's image.
 */
export function HomeGreeting({
  greeting,
  name,
  role,
  photoUri,
}: {
  greeting: string;
  name: string;
  /** The Career Profile's headline. Omitted when the profile has none. */
  role?: string;
  photoUri?: string;
}) {
  const c = useThemeColors();
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <Reveal
      distance={0}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: HOME_SPACING.gutter,
        marginTop: 4,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            color: c.text,
            fontSize: 30,
            lineHeight: 34.5, // 1.15, per the design
            letterSpacing: -0.6,
            fontFamily: FONT.display,
          }}
        >
          {greeting}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
          <Text style={{ color: c.textBody, fontSize: 19, lineHeight: 25, letterSpacing: -0.3, fontFamily: FONT.bold }}>
            {name}
          </Text>
          {role ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: c.bgSunken,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 3,
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.success }} />
              <Text style={{ color: c.textMuted, fontSize: 11, fontFamily: FONT.mono }}>{role}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={{ width: 56, height: 56, flexShrink: 0 }}>
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            accessibilityLabel={name}
            style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.bgSunken }}
          />
        ) : (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: c.accent + "14",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: c.accent, fontSize: 22, fontFamily: FONT.display }}>{initial}</Text>
          </View>
        )}
        <View
          style={{
            position: "absolute",
            right: -2,
            bottom: -2,
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: c.bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.success }} />
        </View>
      </View>
    </Reveal>
  );
}
