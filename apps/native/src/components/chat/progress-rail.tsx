import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { Icon } from "../icon";
import { useMotionReduced, useThemeColors } from "../ui";
import { useLang } from "../../lib/i18n";
import type { ChatStep } from "./chat-progress";
import { currentStep, finishedSteps, receiptLabel } from "./chat-progress";
import {
  CHAT_MOTION,
  CHAT_STEP_BEAT_CYCLES,
  CHAT_STEP_BEAT_MS,
  chatEnterMs,
  railBarProgress,
  railElapsedLabel,
} from "./chat-motion";

/**
 * T4 · The progress rail (§3.2/§3.3), and T9 · its receipt.
 *
 * It replaces the bare three-dot bubble. The reason is not aesthetic: on the
 * device tonight a user got no reply and sent `Hi` four times, because three
 * pulsing dots look the same whether the request is healthy or dead — and
 * re-sending on metered data costs them money.
 *
 * What the rail is:
 *   - a card, not a bubble (full width, 1 px border) so it never reads as
 *     something Sumaiya said;
 *   - a **step-truthful bar** — `scaleX(finished / total)`, never a fake ramp;
 *   - up to four rows, past tense when done, with the real result as a sub-line
 *     (`herufi 2,340`), the current one named and moving, the future ones named
 *     but still (a named future step is a plan, not a silence);
 *   - `Acha` from the first second, because interrupting is what saves the
 *     user's bytes;
 *   - elapsed time as **plain text** — never an animated number.
 *
 * Motion, all from the table: enter 300 rise 12 (instant reduced); the bar 220
 * ease.out on transform; the current step's glyph a **bounded** 2-cycle 1.05 s
 * beat (never `withRepeat(-1)` — that is a WCAG 2.2.2 Level-A failure); the
 * collapse to the receipt at 220 with a container layout reflow. Under Reduce
 * Motion the beat is a static dot and every word is still there.
 */

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

export function StepRows({ steps }: { steps: ChatStep[] }) {
  const c = useThemeColors();
  const { t } = useLang();
  return (
    <View style={{ gap: 10 }}>
      {steps.map((s) => (
        <View key={s.id} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
          <View style={{ paddingTop: 1 }}>
            <StepGlyph state={s.state} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                color: s.state === "current" ? c.accentFill : s.state === "failed" ? c.error : c.textMuted,
                fontSize: 13.5,
                fontWeight: s.state === "current" ? "700" : "600",
                opacity: s.state === "pending" ? 0.75 : 1,
              }}
            >
              {t(s.label.en, s.label.sw)}
            </Text>
            {s.detail ? (
              <Text style={{ color: c.textMuted, fontSize: 11.5, marginTop: 2, opacity: s.state === "pending" ? 0.75 : 1 }}>
                {s.detail}
              </Text>
            ) : null}
          </View>
        </View>
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

  const current = currentStep(steps);
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
      accessibilityLabel={`${railElapsedLabel(seconds)}. ${steps.map((s) => t(s.label.en, s.label.sw)).join(". ")}`}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 0.6 }}>SUMAIYA</Text>
        <Text style={{ color: c.textMuted, fontSize: 11.5 }}>{railElapsedLabel(seconds)}</Text>
      </View>

      <StepBar finished={finished} total={steps.length} />

      <View style={{ marginTop: 12 }}>
        <StepRows steps={steps} />
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 }}>
        <Text style={{ flex: 1, color: c.textMuted, fontSize: 11.5, lineHeight: 16 }}>
          {t(
            "You can stop waiting at any time — your words stay.",
            "Unaweza kuacha kusubiri wakati wowote — maneno yako yanabaki.",
          )}
        </Text>
        {onStop ? (
          <Pressable
            onPress={onStop}
            accessibilityRole="button"
            accessibilityLabel={t("Stop", "Acha")}
            hitSlop={8}
            style={({ pressed }) => ({
              minWidth: 72,
              minHeight: 40,
              paddingHorizontal: 18,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? c.accentPressed : c.text,
            })}
          >
            <Text style={{ color: c.accentText, fontSize: 13.5, fontWeight: "700" }}>{stopLabel ?? t("Stop", "Acha")}</Text>
          </Pressable>
        ) : null}
      </View>

      {/* A slow connection is named, never hidden behind a spinner. */}
      {current ? (
        <Text style={{ color: c.textMuted, fontSize: 11.5, marginTop: 10 }}>
          {t(
            "On a slow connection I'll send it without losing what you told me.",
            "Uko kwenye mtandao wa polepole. Nitatuma bila kupoteza ulichoniambia.",
          )}
        </Text>
      ) : null}
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
