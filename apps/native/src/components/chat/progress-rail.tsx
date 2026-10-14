import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { Icon } from "../icon";
import { useMotionReduced, useThemeColors } from "../ui";
import { useLang } from "../../lib/i18n";
import type { ChatStep, ChatStepState } from "./chat-progress";
import { finishedSteps, RAIL_HEADER, RAIL_STOP_MIN_DP, receiptLabel, stepRowTone, stepStateChip } from "./chat-progress";
import {
  CHAT_MOTION,
  CHAT_STEP_BEAT_CYCLES,
  CHAT_STEP_BEAT_MS,
  chatEnterMs,
  railBarProgress,
  railElapsedLabel,
} from "./chat-motion";

/**
 * T4 · The progress rail (§3.2/§3.3), the design guide's §9 processing surface,
 * and T9 · its receipt.
 *
 * §9 is the binding shape, and it is reproduced here element for element:
 *
 *   ✦ Sumaiya anaandika…                     4s      Acha
 *   ──────────────────────────────────────────────────────────
 *   ✓ Kuandika CV yako        herufi 2,340 zimekamilika   TAYARI
 *   △ Kuilinganisha na tangazo Inachanganua ujuzi wa…     INAKAGUA
 *   ○ Kuandaa barua ya maombi  Itaundwa kwa Kiswahili…    BAADAYE
 *
 * Why the surface exists: three pulsing dots look identical whether a request is
 * healthy or dead, and on metered data a user who cannot tell re-sends and pays
 * twice. So the rail is:
 *   - a card, not a bubble (full width, 1 px border) so it never reads as
 *     something Sumaiya said;
 *   - a header that says **what is happening in words** (`Sumaiya anaandika…`),
 *     the real elapsed time as a chip, and **`Acha` beside it from the first
 *     second** — at 44 dp, the §8 tap floor. It used to sit at the panel's foot,
 *     under two sentences of reassurance, where a user hunting for it lost the
 *     seconds it was there to save;
 *   - a **step-truthful bar** — `scaleX(finished / total)`, never a fake ramp;
 *   - rows with a real state each, carrying §9's own chips: `TAYARI`,
 *     `INAKAGUA`, `BAADAYE` — and a wash per state (a done row is inset, the
 *     current row takes the ember tint, a pending row stays on the card);
 *   - the design's own vocabulary (`Kuandika CV yako`, `Kuilinganisha na
 *     tangazo`, `Kuandaa barua ya maombi`), built in `chat-progress.ts` from
 *     real events only — a row is never done that did not happen, and a count is
 *     never printed that nobody measured.
 *
 * Motion, all from the table: enter 300 rise 12 (instant reduced); the bar 220
 * ease.out on transform; the current step's glyph a **bounded** 2-cycle 1.05 s
 * beat (never `withRepeat(-1)` — that is a WCAG 2.2.2 Level-A failure; the
 * design's infinitely spinning ✦ is deliberately not copied for the same
 * reason, and the card's own glyph is static). Under Reduce Motion the beat is a
 * static dot and every word is still there.
 */

/** §9's chips, in the palette: done = success, current = ember, pending = muted. */
function chipPalette(state: ChatStepState, c: ReturnType<typeof useThemeColors>) {
  switch (state) {
    case "done":
      return { backgroundColor: c.successTint, color: c.success };
    case "current":
      return { backgroundColor: c.accentTint, color: c.accentFillStrong };
    case "failed":
      return { backgroundColor: c.errorTint, color: c.error };
    default:
      return { backgroundColor: c.bgSunken, color: c.textMuted };
  }
}

/** §9's per-row wash. The design's `#ffffff` pending row is the card (§1 bans white). */
function rowBackground(state: ChatStepState, c: ReturnType<typeof useThemeColors>) {
  switch (stepRowTone(state)) {
    case "well":
      return c.bgSunken;
    case "tint":
      return c.accentTint;
    case "error":
      return c.errorTint;
    default:
      return "transparent";
  }
}

function StepGlyph({ state }: { state: ChatStep["state"] }) {
  const c = useThemeColors();
  const reduce = useMotionReduced();
  // Move 10: the current step's own glyph carries the beat, bounded.
  const v = useSharedValue(1);
  useEffect(() => {
    if (state !== "current" || reduce) {
      v.value = 1;
      return;
    }
    v.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: CHAT_STEP_BEAT_MS / 2, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: CHAT_STEP_BEAT_MS / 2, easing: Easing.inOut(Easing.quad) }),
      ),
      CHAT_STEP_BEAT_CYCLES,
      false,
    );
    return () => {
      // Bounded, but cancel anyway: a node can outlive its usefulness (row
      // removed mid-beat) and this is the N1/N15 defect class.
      v.value = 1;
    };
  }, [state, reduce, v]);
  const pulse = useAnimatedStyle(() => (state === "current" ? { opacity: v.value } : { opacity: 1 }));

  if (state === "done") {
    return (
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: c.success, alignItems: "center", justifyContent: "center" }}>
        <Icon name="check" size={11} color={c.accentText} />
      </View>
    );
  }
  if (state === "failed") {
    return (
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: c.error, alignItems: "center", justifyContent: "center" }}>
        <Icon name="x" size={11} color={c.accentText} />
      </View>
    );
  }
  if (state === "current") {
    return (
      <Animated.View
        style={[
          pulse,
          { width: 18, height: 18, borderRadius: 9, backgroundColor: c.accentFill, alignItems: "center", justifyContent: "center" },
        ]}
      >
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.accentText }} />
      </Animated.View>
    );
  }
  // Pending: a hollow ring — named, and visibly not yet true.
  return <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: c.borderStrong }} />;
}

/** One row of §9: glyph, title, the real result, and the state chip. */
function StepRow({ step }: { step: ChatStep }) {
  const c = useThemeColors();
  const { t } = useLang();
  const chip = stepStateChip(step.state);
  const pending = step.state === "pending";
  const titleColor = step.state === "failed" ? c.error : pending ? c.textMuted : c.text;
  const detailColor = step.state === "failed" ? c.error : step.state === "current" ? c.accentFillStrong : c.textMuted;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: rowBackground(step.state, c),
      }}
    >
      <StepGlyph state={step.state} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          // Two lines, not one: at 200 % text scale a single-line truncate eats
          // the step's own name (§8).
          numberOfLines={2}
          style={{
            color: titleColor,
            fontSize: 13.5,
            fontWeight: step.state === "current" ? "700" : "600",
            opacity: pending ? 0.75 : 1,
          }}
        >
          {t(step.label.en, step.label.sw)}
        </Text>
        {step.detail ? (
          <Text
            numberOfLines={2}
            style={{ color: detailColor, fontSize: 11.5, marginTop: 2, opacity: pending ? 0.75 : 1 }}
          >
            {step.detail}
          </Text>
        ) : null}
      </View>
      <View
        style={{
          backgroundColor: chipPalette(step.state, c).backgroundColor,
          paddingHorizontal: 6,
          paddingVertical: 3,
          borderRadius: 4,
          flexShrink: 0,
        }}
      >
        <Text style={{ fontSize: 10, fontWeight: "800", letterSpacing: 0.5, color: chipPalette(step.state, c).color }}>
          {t(chip.en, chip.sw)}
        </Text>
      </View>
    </View>
  );
}

export function StepRows({ steps }: { steps: ChatStep[] }) {
  return (
    <View style={{ gap: 10 }}>
      {steps.map((s) => (
        <StepRow key={s.id} step={s} />
      ))}
    </View>
  );
}

/** Move 9 — the bar, transform-only. Two of four done is `scaleX(.5)`. */
function StepBar({ finished, total }: { finished: number; total: number }) {
  const c = useThemeColors();
  const reduce = useMotionReduced();
  const p = railBarProgress(finished, total);
  const v = useSharedValue(p);
  useEffect(() => {
    v.value = withTiming(p, { duration: chatEnterMs(reduce, CHAT_MOTION.rail.bar), easing: Easing.out(Easing.cubic) });
  }, [p, reduce, v]);
  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: v.value }] }));
  return (
    <View style={{ height: 4, borderRadius: 2, backgroundColor: c.border, overflow: "hidden", marginTop: 10 }}>
      {/* transform only — never `width`, which relayouts every frame. */}
      <Animated.View
        style={[
          fill,
          {
            height: 4,
            borderRadius: 2,
            backgroundColor: p >= 1 ? c.success : c.accentFill,
            // So the bar grows from its left edge: a centred scaleX would read
            // as a bar that is half over before anything has finished.
            transformOrigin: "left",
          },
        ]}
      />
    </View>
  );
}

export function ProgressRail({
  steps,
  startedAt,
  onStop,
  stopLabel,
}: {
  steps: ChatStep[];
  /** When the turn began — the elapsed label is derived from this, not animated. */
  startedAt: number;
  onStop?: () => void;
  stopLabel?: string;
}) {
  const c = useThemeColors();
  const reduce = useMotionReduced();
  const { t } = useLang();
  const progress = useSharedValue(reduce ? 1 : 0);
  const [seconds, setSeconds] = useState(() => Math.max(0, Math.round((Date.now() - startedAt) / 1000)));

  // Move 6 — enter 300, rise 12. A shared value, not an `entering` layout
  // animation: an `entering` wrapper has already left a child non-interactive
  // on Fabric once (see ui/motion.tsx's Reveal note), and this card holds the
  // stop control.
  useEffect(() => {
    if (reduce) {
      progress.value = 1;
      return;
    }
    progress.value = withTiming(1, { duration: chatEnterMs(false, CHAT_MOTION.rail.enter), easing: Easing.out(Easing.cubic) });
  }, [reduce, progress]);
  const enter = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * CHAT_MOTION.rail.distance }],
  }));

  // Elapsed time: plain text on a 1 s tick. It is the one number that makes a
  // wait feel bounded, and it is deliberately not animated.
  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(Math.max(0, Math.round((Date.now() - startedAt) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const finished = finishedSteps(steps);

  return (
    <Animated.View
      style={[
        enter,
        {
          width: "100%",
          backgroundColor: c.bgElevated,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 20,
          padding: 14,
          marginTop: 6,
        },
      ]}
      accessibilityRole="progressbar"
      // Announced at step boundaries only — the rail re-renders per step, never
      // per token (there are no tokens; nothing streams).
      accessibilityLiveRegion="polite"
      // The chips are words, not decoration: the label carries them too, so a
      // screen reader hears the same state a sighted user reads.
      accessibilityLabel={`${railElapsedLabel(seconds)}. ${steps
        .map((s) => `${t(s.label.en, s.label.sw)} — ${t(stepStateChip(s.state).en, stepStateChip(s.state).sw)}`)
        .join(". ")}`}
    >
      {/* §9's status bar header: what is happening, in words · the real elapsed
          time · `Acha`, 44 dp, from the first second. */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Icon name="sparkles" size={16} color={c.accentFill} />
        <Text style={{ flex: 1, minWidth: 0, color: c.text, fontSize: 14, fontWeight: "700" }}>
          {t(RAIL_HEADER.en, RAIL_HEADER.sw)}
        </Text>
        <View
          style={{ backgroundColor: c.bgSunken, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}
          // The visible chip is the design's bare `4s`; the full sentence
          // (`inaendelea · 4s`) is on the card's accessibility label, so this
          // piece is read once, not twice.
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text style={{ color: c.accentFillStrong, fontSize: 12, fontWeight: "700", letterSpacing: 0.4 }}>
            {`${Math.max(0, Math.floor(seconds))}s`}
          </Text>
        </View>
        {onStop ? (
          <Pressable
            onPress={onStop}
            accessibilityRole="button"
            accessibilityLabel={stopLabel ?? t("Stop", "Acha")}
            hitSlop={6}
            style={({ pressed }) => ({
              // §8: no tap target below 44 dp. This control is the whole reason
              // the surface exists, so it is the design's ember control at the
              // full floor.
              minWidth: 48,
              minHeight: RAIL_STOP_MIN_DP,
              paddingHorizontal: 10,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? c.accentFillPressed : c.accentTint,
            })}
          >
            {({ pressed }) => (
              <Text
                style={{
                  color: pressed ? c.accentText : c.accentFillStrong,
                  fontSize: 13.5,
                  fontWeight: "700",
                }}
              >
                {stopLabel ?? t("Stop", "Acha")}
              </Text>
            )}
          </Pressable>
        ) : null}
      </View>

      <StepBar finished={finished} total={steps.length} />

      <View style={{ marginTop: 12 }}>
        <StepRows steps={steps} />
      </View>

      {/* §9 draws nothing below the rows: `Acha` is in the header now, and the
          two reassurance sentences that used to sit here are gone — one of them
          (`Uko kwenye mtandao wa polepole.`) asserted a slow connection the app
          had never measured (QA-NATIVE-1625 §2.2). */}
    </Animated.View>
  );
}

/**
 * T9 · The receipt — what the rail leaves behind.
 *
 * One collapsed line (`✓ Nilifanya hivi: hatua 3 ▾`), tapping expands the
 * finished steps read-only. It never re-animates on scroll, and it is the
 * reason the rail does not simply vanish and take its evidence with it.
 */
export function ProgressReceipt({ steps, defaultOpen = false }: { steps: ChatStep[]; defaultOpen?: boolean }) {
  const c = useThemeColors();
  const { t } = useLang();
  const [open, setOpen] = useState(defaultOpen);
  if (!steps.length) return null;
  const label = receiptLabel(steps);
  return (
    <Animated.View
      style={{
        alignSelf: "flex-start",
        backgroundColor: c.bgElevated,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 6,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={label}
        onPress={() => setOpen((v) => !v)}
        style={{ flexDirection: "row", alignItems: "center", gap: 8, minHeight: 28 }}
      >
        <Icon name="check" size={13} color={c.success} />
        <Text style={{ color: c.textMuted, fontSize: 12.5, fontWeight: "600" }}>{label}</Text>
        <Icon name={open ? "chevron-up" : "chevron-down"} size={13} color={c.textMuted} />
      </Pressable>
      {open ? (
        <View style={{ marginTop: 10, opacity: 0.9 }}>
          <StepRows steps={steps.map((s) => (s.state === "current" ? { ...s, state: "pending" as const } : s))} />
        </View>
      ) : null}
    </Animated.View>
  );
}
