import React from "react";
import { Text, View } from "react-native";
import { useThemeColors } from "./theme";
import { Reveal } from "./motion";

/**
 * One screen title, everywhere. Every screen was rolling its own <Text> with
 * a different fontSize (24/26/30), letterSpacing (-0.4/-0.5/-0.6) and margin —
 * which read as "not aligned" screen to screen. This is the single source.
 *
 * Fades in via `Reveal` (a shared value), not Reanimated's `entering` — this
 * component sits as the first child on every screen, so an `entering` layout
 * animation here registers with Fabric's mounting layer right where later
 * siblings (a hint card, a loaded list) get inserted or removed. That
 * combination is what crashed Fabric mounting before (`addViewAt … index N,
 * count N-1`; see `Reveal` in `./motion`), so this stays on the same
 * shared-value pattern as everything else in `./motion`. `distance={0}`
 * keeps the original fade-only look — no rise.
 */
export function ScreenTitle({
  children,
  eyebrow,
  trailing,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  trailing?: React.ReactNode;
}) {
  const c = useThemeColors();
  return (
    <Reveal
      distance={0}
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginTop: 8,
        marginBottom: 20,
        gap: 12,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        {eyebrow ? (
          <Text style={{ color: c.textMuted, fontSize: 13, fontWeight: "600", marginBottom: 2 }}>
            {eyebrow}
          </Text>
        ) : null}
        <Text
          style={{ color: c.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 }}
          numberOfLines={1}
        >
          {children}
        </Text>
      </View>
      {trailing ? <View style={{ flexShrink: 0 }}>{trailing}</View> : null}
    </Reveal>
  );
}
