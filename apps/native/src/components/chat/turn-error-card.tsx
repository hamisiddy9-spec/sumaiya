import React, { useEffect } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Icon } from "../icon";
import { useMotionReduced, useThemeColors } from "../ui";
import { useLang } from "../../lib/i18n";
import { CHAT_MOTION, chatEnterMs } from "./chat-motion";

/**
 * T7 · The error, attached to the turn it belongs to (§3.2).
 *
 * Three parts, always, in this order: **what happened** (a heading), **why**
 * (with the cause that is *not* the reason explicitly ruled out — this codebase
 * has a history of blaming the user's connection for our own faults), and
 * **what to do** (controls). Never full-width, never a status code, and — the
 * part that matters most for a metered connection — `Jaribu ombi hili tena`
 * resends *the same turn*, so retrying never costs the user a retype.
 *
 * It sits under the failed turn, right-aligned, because an error that floats to
 * the middle of the transcript loses the thing it is about.
 *
 * Entrance: 300 `ease.out` (instant under Reduce Motion). Nothing pulses, nothing
 * bounces, nothing begs.
 */
export function TurnErrorCard({
  title,
  why,
  ruledOut,
  retryLabel,
  onRetry,
  busy = false,
  secondaryLabel,
  onSecondary,
  footer,
}: {
  /** What happened. Her voice, first person. */
  title: string;
  /** Why, in one or two sentences. */
  why: string;
  /** The wrong cause, ruled out. */
  ruledOut?: string;
  retryLabel?: string;
  onRetry?: () => void;
  busy?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** A last honest sentence (what was kept, what to expect). */
  footer?: string;
}) {
  const c = useThemeColors();
  const { t } = useLang();
  const reduce = useMotionReduced();
  const progress = useSharedValue(reduce ? 1 : 0);

  useEffect(() => {
    if (reduce) {
      progress.value = 1;
      return;
    }
    progress.value = withTiming(1, { duration: chatEnterMs(false, CHAT_MOTION.turnError.enter), easing: Easing.out(Easing.cubic) });
  }, [reduce, progress]);

  const enter = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * CHAT_MOTION.turnError.distance }],
  }));

  return (
    <Animated.View
      style={[
        enter,
        {
          alignSelf: "flex-end",
          maxWidth: "92%",
          backgroundColor: c.bgElevated,
          borderWidth: 1,
          borderColor: c.accentPressed + "59", // rgba(…, .35)
          borderLeftWidth: 3,
          borderLeftColor: c.error,
          borderRadius: 16,
          padding: 13,
          marginTop: 8,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={{ color: c.text, fontSize: 14, fontWeight: "800", lineHeight: 19 }}>{title}</Text>
      <Text style={{ color: c.textBody, fontSize: 13, lineHeight: 19.5, marginTop: 5 }}>{why}</Text>
      {ruledOut ? (
        <Text style={{ color: c.textBody, fontSize: 13, lineHeight: 19.5, marginTop: 5, fontWeight: "600" }}>{ruledOut}</Text>
      ) : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        {onRetry ? (
          <Pressable
            onPress={busy ? undefined : onRetry}
            disabled={busy}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy, busy }}
            hitSlop={6}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 7,
              minHeight: 40,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: pressed ? c.accentPressed : c.accentFill,
              opacity: busy ? 0.7 : 1,
            })}
          >
            {/* Move 17: the label ⇄ spinner swap is in place, at 220. The
                spinner is the platform's own (the same one ui/button.tsx uses
                for its loading state), not a static glyph. */}
            {busy ? <ActivityIndicator size="small" color={c.accentText} /> : <Icon name="refresh-cw" size={14} color={c.accentText} />}
            <Text style={{ color: c.accentText, fontSize: 13.5, fontWeight: "700" }}>
              {retryLabel ?? t("Try this request again", "Jaribu ombi hili tena")}
            </Text>
          </Pressable>
        ) : null}
        {onSecondary ? (
          <Pressable
            onPress={onSecondary}
            accessibilityRole="button"
            hitSlop={6}
            style={({ pressed }) => ({
              minHeight: 40,
              paddingHorizontal: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: c.borderStrong,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? c.border : "transparent",
            })}
          >
            <Text style={{ color: c.text, fontSize: 13.5, fontWeight: "600" }}>
              {secondaryLabel ?? t("Write it myself", "Andika mwenyewe")}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {footer ? <Text style={{ color: c.textMuted, fontSize: 11.5, lineHeight: 16, marginTop: 10 }}>{footer}</Text> : null}
    </Animated.View>
  );
}
