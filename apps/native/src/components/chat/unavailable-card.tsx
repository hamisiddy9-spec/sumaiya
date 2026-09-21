import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Icon } from "../icon";
import { useMotionReduced, useThemeColors } from "../ui";
import { useLang } from "../../lib/i18n";
import { CHAT_MOTION, chatEnterMs, chatExitMs } from "./chat-motion";
import { UNAVAILABLE_COPY, WORKS_WITHOUT_A_MODEL, type UnavailableVariant } from "./chat-unavailable";

/**
 * T8 · The intelligence-unavailable card (§3.2/§3.6).
 *
 * A state, not an error page, and a first-class member of the taxonomy: it
 * arrives as a card inside the thread, it is gold (degraded, not broken — the
 * error red stays reserved for a real fault), and it retires itself when the
 * probe recovers, with no toast to dismiss.
 *
 * What it never does: beg, blame, lie, dead-end, or show a word of raw English.
 * What it always does: name the real condition, rule out the wrong cause, and
 * offer at least one control that genuinely works **right now** — the three
 * model-free ones (a deterministic ATS check, the editor, tesseract OCR) or, on
 * a turn that failed mid-flight, `Jaribu ombi hili tena`, which resends the same
 * turn.
 *
 * Motion: 300 rise in, 140 `ease.in` out when it retires itself, instant under
 * Reduce Motion. No pulse, no bounce, no infinite attention — every word stays
 * legible as static text.
 */
export function UnavailableCard({
  variant,
  onOpenAts,
  onOpenEditor,
  onReadPhoto,
  onRetry,
  onWriteYourself,
  retryBusy = false,
  dissolving = false,
  onGone,
}: {
  variant: UnavailableVariant;
  onOpenAts?: () => void;
  onOpenEditor?: () => void;
  onReadPhoto?: () => void;
  onRetry?: () => void;
  onWriteYourself?: () => void;
  retryBusy?: boolean;
  /** The probe recovered — the card leaves by itself. */
  dissolving?: boolean;
  onGone?: () => void;
}) {
  const c = useThemeColors();
  const { t } = useLang();
  const reduce = useMotionReduced();
  const progress = useSharedValue(reduce ? 1 : 0);
  const copy = UNAVAILABLE_COPY[variant];

  useEffect(() => {
    if (reduce) {
      progress.value = dissolving ? 0 : 1;
      if (dissolving) onGone?.();
      return;
    }
    progress.value = withTiming(dissolving ? 0 : 1, {
      duration: dissolving ? chatExitMs(false, CHAT_MOTION.unavailable.exit) : chatEnterMs(false, CHAT_MOTION.unavailable.enter),
      easing: dissolving ? Easing.in(Easing.cubic) : Easing.out(Easing.cubic),
    });
  }, [reduce, dissolving, progress, onGone]);

  const anim = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * CHAT_MOTION.unavailable.distance }],
  }));

  const actions = [
    { id: "ats" as const, onPress: onOpenAts },
    { id: "editor" as const, onPress: onOpenEditor },
    { id: "ocr" as const, onPress: onReadPhoto },
  ].filter((a) => a.onPress);

  return (
    <Animated.View
      style={[
        anim,
        {
          width: "100%",
          backgroundColor: c.bgElevated,
          borderWidth: 1,
          borderColor: c.warning + "59",
          borderRadius: 18,
          padding: 14,
          marginTop: 8,
        },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
    >
      {/* The badge is a state, not a warning colour: gold means degraded. */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ color: c.warning, fontSize: 10.5, fontWeight: "800", letterSpacing: 0.8 }}>
          {t("PARTIAL", "KWA SEHEMU")}
        </Text>
        <Icon name="alert-triangle" size={16} color={c.warning} />
      </View>

      <Text style={{ color: c.text, fontSize: 15, fontWeight: "800", lineHeight: 20 }}>{t(copy.title.en, copy.title.sw)}</Text>
      <Text style={{ color: c.textBody, fontSize: 13, lineHeight: 19.5, marginTop: 5 }}>{t(copy.why.en, copy.why.sw)}</Text>
      {variant === "known" ? (
        <Text style={{ color: c.textBody, fontSize: 13, lineHeight: 19.5, marginTop: 5, fontWeight: "600" }}>
          {t(copy.promise.en, copy.promise.sw)}
        </Text>
      ) : null}

      {actions.length ? (
        <View style={{ marginTop: 12, gap: 2 }}>
          <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 0.6, marginBottom: 4 }}>
            {t("WHAT I CAN DO RIGHT NOW", "NINACHOWEZA KUFANYA SASA HIVI")}
          </Text>
          {actions.map((a) => {
            const item = WORKS_WITHOUT_A_MODEL.find((w) => w.id === a.id)!;
            return (
              <Pressable
                key={a.id}
                onPress={a.onPress}
                accessibilityRole="button"
                accessibilityLabel={`${t(item.label.en, item.label.sw)}. ${t(item.hint.en, item.hint.sw)}`}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 48,
                  paddingHorizontal: 10,
                  borderRadius: 12,
                  backgroundColor: pressed ? c.border : "transparent",
                })}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: c.text, fontSize: 13.5, fontWeight: "700" }}>{t(item.label.en, item.label.sw)}</Text>
                  <Text style={{ color: c.textMuted, fontSize: 11.5, marginTop: 1 }}>{t(item.hint.en, item.hint.sw)}</Text>
                </View>
                <Text style={{ color: c.accentFill, fontSize: 16, fontWeight: "700" }}>›</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {variant === "mid-turn" ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {onRetry ? (
            <Pressable
              onPress={retryBusy ? undefined : onRetry}
              disabled={retryBusy}
              accessibilityRole="button"
              accessibilityState={{ disabled: retryBusy, busy: retryBusy }}
              style={({ pressed }) => ({
                minHeight: 40,
                paddingHorizontal: 14,
                borderRadius: 12,
                justifyContent: "center",
                backgroundColor: pressed ? c.accentPressed : c.accentFill,
                opacity: retryBusy ? 0.7 : 1,
              })}
            >
              <Text style={{ color: c.accentText, fontSize: 13.5, fontWeight: "700" }}>
                {t("Try this request again", "Jaribu ombi hili tena")}
              </Text>
            </Pressable>
          ) : null}
          {onWriteYourself ? (
            <Pressable
              onPress={onWriteYourself}
              accessibilityRole="button"
              style={({ pressed }) => ({
                minHeight: 40,
                paddingHorizontal: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: c.borderStrong,
                justifyContent: "center",
                backgroundColor: pressed ? c.border : "transparent",
              })}
            >
              <Text style={{ color: c.text, fontSize: 13.5, fontWeight: "600" }}>
                {t("Write it myself", "Andika mwenyewe")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* The ruled-out line: what is missing, and what the user has to do about
          it — which is nothing. */}
      <View style={{ flexDirection: "row", gap: 7, marginTop: 12 }}>
        <Icon name="x" size={13} color={c.textMuted} />
        <Text style={{ flex: 1, color: c.textMuted, fontSize: 11.5, lineHeight: 16 }}>
          {t(copy.missing.en, copy.missing.sw)}{" "}
          {variant === "known"
            ? t(
                "This card changes by itself when I'm back — you don't have to ask again.",
                "Kadi hii inajibadilisha yenyewe nikirudi — huna haja ya kuuliza tena.",
              )
            : t(copy.promise.en, copy.promise.sw)}
        </Text>
      </View>
    </Animated.View>
  );
}

/**
 * The gold band for work that was produced **without** a model (§3.6 variant C,
 * rule 4: "label the output, not the app"). It goes on the artifact, and only
 * when the output is degraded — nothing is labelled on the good path.
 */
export function LocalOnlyBand() {
  const c = useThemeColors();
  const { t } = useLang();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        backgroundColor: c.warning + "1f",
        borderBottomWidth: 1,
        borderBottomColor: c.warning + "3d",
        paddingHorizontal: 12,
        paddingVertical: 7,
      }}
      accessibilityRole="text"
    >
      <Text style={{ color: c.warning, fontSize: 10.5, fontWeight: "800", letterSpacing: 0.6 }}>
        ◎ {t("THIS IS A LIGHT TEXT TIDY-UP — NOT AI", "HUU NI USAFI MDOGO WA MAANDISHI — SI AI")}
      </Text>
    </View>
  );
}
