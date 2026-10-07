import React from "react";
import { View } from "react-native";
import { SumaiyaMark, type SumaiyaMarkState } from "./sumaiya-mark";
import { useThemeColors } from "./ui/theme";
import { MARK_WELL, wellBackground } from "./ui/mark-well-tokens";

/**
 * The one container the welcoming path puts the mark in.
 *
 * Rendered by the launch, the language stage and every onboarding slide, so the
 * mark is the same object at the same size on the same surface from the first
 * frame of the cold start to the last slide — the only thing that changes is
 * what is written under it. The geometry is not written here: it comes from
 * `ui/mark-well-tokens`, which a test guards (see `mark-well-tokens.test.ts`).
 *
 * Every hero uses the SAME live `SumaiyaMark` (never a static illustration of
 * it), and the mark's own `state` is what carries meaning: `thinking` while she
 * "hears" you, `idle` at rest, `static` when the hero is off-screen — a
 * `static` mark parks its frame callback (`sumaiya-mark.tsx`), so exactly one
 * mark on the slides is ever turning.
 *
 * Reduce Motion needs nothing here: `SumaiyaMark` reads the OS setting itself
 * (no spin, no breath) and the well is static geometry, so under Reduce Motion
 * the well is simply the resting frame of the same object.
 */
export function MarkWell({
  state = "idle",
  /** Ink for the mark. Defaults to the accent — the design system's well
   *  foreground (`.well{color:var(--ember)}`). The portal overrides it with
   *  `accentText` because it rides on top of the accent flood, where accent ink
   *  would be invisible. */
  markColor,
}: {
  state?: SumaiyaMarkState;
  markColor?: string;
}) {
  const c = useThemeColors();
  return (
    <View
      style={{
        width: MARK_WELL.size,
        height: MARK_WELL.size,
        borderRadius: MARK_WELL.radius,
        backgroundColor: wellBackground(c.accent),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <SumaiyaMark size={MARK_WELL.mark} state={state} color={markColor ?? c.accent} />
    </View>
  );
}
