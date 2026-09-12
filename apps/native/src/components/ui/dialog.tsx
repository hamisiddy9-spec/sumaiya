import React, { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { haptics } from "./haptics";
import { useThemeColors } from "./theme";
import { Icon } from "../icon";
import { useLang } from "../../lib/i18n";

/**
 * Branded dialog layer — the app's replacement for React Native's `Alert.alert`.
 *
 * Why this exists: `Alert.alert` renders the stock Android dialog (system grey,
 * square corners, ALL-CAPS buttons, the device's own font stack). Every
 * destructive confirmation, every save failure and every sign-out prompt was
 * being handed to the OS instead of the design system, so the app felt
 * third-party at exactly the moments a user is most paying attention. This
 * renders the same content inside the Warm Confidence palette, with the app's
 * own typography, radii, haptics and motion.
 *
 * The public API mirrors `Alert.alert(title, message?, buttons?, options?)`
 * one-for-one, so call sites swap with a single identifier change and nothing
 * else about their logic moves.
 */

export interface DialogButton {
  text: string;
  /** `cancel` dismisses, `destructive` paints in the error colour. */
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

export interface DialogOptions {
  /** false = cannot be dismissed with the hardware back / tapping outside. */
  cancelable?: boolean;
}

interface DialogRequest {
  id: number;
  title: string;
  message?: string;
  buttons?: DialogButton[];
  cancelable: boolean;
}

type Listener = (req: DialogRequest | null) => void;

let listener: Listener | null = null;
const queue: DialogRequest[] = [];
let seq = 0;

function emit() {
  listener?.(queue[0] ?? null);
}

function push(req: DialogRequest) {
  queue.push(req);
  emit();
}

/** The imperative handle. Safe to call from plain modules, not just components. */
export const dialog = {
  alert(title: string, message?: string, buttons?: DialogButton[], options?: DialogOptions) {
    push({
      id: ++seq,
      title,
      message,
      buttons: buttons && buttons.length ? buttons : undefined,
      cancelable: options?.cancelable !== false,
    });
    // A destructive prompt gets the sharper haptic; anything else a light tick.
    if (buttons?.some((b) => b.style === "destructive")) haptics.error();
    else haptics.light();
  },
  /** True while a dialog is on screen. Back-handler arbitration needs this:
   *  a screen must not swallow the hardware back key out from under a prompt
   *  that is already asking the user something. */
  isOpen() {
    return queue.length > 0;
  },
  /** Dismiss the dialog currently on screen (runs no button handler). */
  dismiss() {
    queue.shift();
    emit();
  },
  /** @internal used by DialogHost */
  _subscribe(l: Listener | null) {
    listener = l;
  },
  /** @internal used by DialogHost */
  _pop() {
    queue.shift();
    emit();
  },
};

export function DialogHost() {
  const c = useThemeColors();
  const { t } = useLang();
  const { width, height } = useWindowDimensions();
  const [req, setReq] = useState<DialogRequest | null>(null);
  // Held so the exit animation has something to render after the queue pops.
  const [shown, setShown] = useState<DialogRequest | null>(null);
  const progress = useSharedValue(0);
  const closing = useRef(false);

  useEffect(() => {
    dialog._subscribe((r) => setReq(r));
    return () => dialog._subscribe(null);
  }, []);

  useEffect(() => {
    if (req) {
      closing.current = false;
      setShown(req);
      progress.value = withSpring(1, { damping: 20, stiffness: 240, mass: 0.8 });
    } else if (shown && !closing.current) {
      progress.value = withTiming(0, { duration: 140, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(setShown)(null);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req]);

  /** Close, then fire the handler for the chosen button once we've left screen. */
  function close(btn?: DialogButton) {
    if (!shown) return;
    closing.current = true;
    haptics.selection();
    progress.value = withTiming(0, { duration: 130, easing: Easing.in(Easing.cubic) }, (done) => {
      if (done) {
        runOnJS(setShown)(null);
        runOnJS(dialog._pop)();
      }
    });
    // Run the handler slightly after the dismiss starts so the tap always feels
    // acknowledged even if the handler navigates or blocks.
    if (btn?.onPress) setTimeout(() => btn.onPress?.(), 90);
  }

  function onBack() {
    if (!shown) return;
    if (!shown.cancelable) return;
    const cancel = shown.buttons?.find((b) => b.style === "cancel");
    close(cancel);
  }

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }));
  const card = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.94 + progress.value * 0.06 }],
  }));

  if (!shown) return null;

  const buttons: DialogButton[] = shown.buttons?.length ? shown.buttons : [{ text: t("OK", "Sawa") }];
  const destructive = buttons.some((b) => b.style === "destructive");
  const iconName = destructive ? "alert-triangle" : buttons.length > 1 ? "help-circle" : "alert-circle";
  const iconTint = destructive ? c.error : c.accent;
  const stacked = buttons.length > 2;

  return (
    <Modal transparent visible onRequestClose={onBack} animationType="none" statusBarTranslucent>
      <Animated.View
        style={[
          backdrop,
          {
            width,
            height,
            backgroundColor: c.overlay,
            alignItems: "center",
            justifyContent: "center",
            padding: 28,
          },
        ]}
      >
        <Animated.View
          accessibilityViewIsModal
          accessibilityRole="alert"
          style={[
            card,
            {
              width: "100%",
              maxWidth: 400,
              backgroundColor: c.bgElevated,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: c.border,
              padding: 20,
              shadowColor: "#000",
              shadowOpacity: 0.28,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 10 },
              elevation: 12,
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 13,
                backgroundColor: iconTint + "1f",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={iconName} size={20} color={iconTint} />
            </View>
            <View style={{ flex: 1, paddingTop: 1 }}>
              <Text style={{ color: c.text, fontSize: 17, fontWeight: "800", lineHeight: 22 }}>{shown.title}</Text>
              {shown.message ? (
                <Text style={{ color: c.textBody, fontSize: 14, lineHeight: 20, marginTop: 5 }}>{shown.message}</Text>
              ) : null}
            </View>
          </View>

          {(() => {
            const rows = buttons.map((b, i) => {
              const isLast = i === buttons.length - 1;
              // A single action is the whole footer; in a pair the last one is
              // the affirmative; in a stack everything is a full-width row.
              const filled = stacked || isLast;
              const bg = filled
                ? b.style === "destructive"
                  ? c.error
                  : c.accent
                : b.style === "destructive"
                  ? c.error + "1f"
                  : "transparent";
              const fg = filled
                ? b.style === "destructive"
                  ? c.bg
                  : c.accentText
                : b.style === "destructive"
                  ? c.error
                  : c.textBody;
              return (
                <Pressable
                  key={`${shown.id}-${i}`}
                  accessibilityRole="button"
                  onPress={() => close(b)}
                  style={({ pressed }) => ({
                    // Explicit geometry rather than flex:1 — a lone button has to
                    // span the card on its own, and RNW/RN disagree about what
                    // flex does to a single row child.
                    width: stacked || buttons.length === 1 ? "100%" : undefined,
                    flexGrow: stacked || buttons.length === 1 ? 0 : 1,
                    flexBasis: stacked || buttons.length === 1 ? undefined : 0,
                    paddingVertical: 13,
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: bg,
                    borderWidth: filled ? 0 : 1,
                    // c.border (not c.borderStrong) reads as almost invisible
                    // in dark mode — an unfilled button (e.g. "Cancel" beside
                    // a filled "Sign out") needs the stronger outline the rest
                    // of the design system already uses for secondary buttons.
                    borderColor: c.borderStrong,
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <Text style={{ color: fg, fontSize: 15, fontWeight: filled ? "800" : "700" }} numberOfLines={1}>
                    {b.text}
                  </Text>
                </Pressable>
              );
            });

            // Three or more choices (the "which CV?" picker can hand us a dozen)
            // stack and scroll rather than overflowing the card.
            return stacked ? (
              <ScrollView
                style={{ marginTop: 18, maxHeight: 300 }}
                contentContainerStyle={{ gap: 8 }}
                showsVerticalScrollIndicator={false}
              >
                {rows}
              </ScrollView>
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  alignItems: "stretch",
                  gap: 8,
                  marginTop: 18,
                }}
              >
                {rows}
              </View>
            );
          })()}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
