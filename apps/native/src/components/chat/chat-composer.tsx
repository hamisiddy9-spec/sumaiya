import React, { useEffect } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { Icon } from "../icon";
import { haptics, useMotionReduced, useThemeColors } from "../ui";
import { useLang } from "../../lib/i18n";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type AttachKind } from "./attach-sheet";
import type { Attachment } from "./chat-types";
import { CHAT_MOTION, chatEnterMs, chatExitMs, chatStaggerDelayMs } from "./chat-motion";

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  onSend: () => void;
  loading: boolean;
  attachments: Attachment[];
  onAttach: (kind: AttachKind) => void;
  onOpenAttach: () => void;
  onRemoveAttachment: (id: string) => void;
  inputRef?: React.RefObject<TextInput | null>;
  /** The stop control that shares the send slot while she is working. */
  onStop?: () => void;
  /**
   * The draft line (§3.1) — one short, always-true sentence, shown only when it
   * has something to say (`Maneno yako yanahifadhiwa.` while the intelligence is
   * off, or while a queued message waits).
   */
  draftNote?: string;
}

/**
 * T1 · The user's own turn's attachment chip, with the two things the audit
 * found missing (A1): **how big it is** and **how far the upload got**. A 3 MB
 * upload on a slow uplink used to be a chip that just sat there.
 */
function Chip({ att, onRemove }: { att: Attachment; onRemove: () => void }) {
  const c = useThemeColors();
  const { t } = useLang();
  const reduce = useMotionReduced();
  const isImg = att.kind === "image";
  const kb = typeof att.size === "number" ? `${Math.max(1, Math.round(att.size / 1024))} KB` : "";
  const pct = typeof att.progress === "number" ? Math.round(att.progress * 100) : undefined;

  // Move 13 — upload progress on `scaleX`, in ≥5% steps, never on `width`.
  const progress = useSharedValue(pct ?? 0);
  useEffect(() => {
    const next = pct === undefined ? 0 : Math.round(pct / CHAT_MOTION.uploadProgress.minStepPct) * CHAT_MOTION.uploadProgress.minStepPct;
    progress.value = withTiming(next / 100, {
      duration: chatEnterMs(reduce, CHAT_MOTION.uploadProgress.step),
      easing: Easing.out(Easing.cubic),
    });
  }, [pct, reduce, progress]);
  const bar = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }));

  return (
    <Animated.View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        paddingVertical: 5,
        paddingLeft: isImg ? 5 : 10,
        paddingRight: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: att.status === "error" ? c.error + "66" : c.border,
        backgroundColor: att.status === "error" ? c.error + "14" : c.bg,
        maxWidth: 240,
      }}
    >
      {isImg ? (
        <Image source={{ uri: att.uri }} style={{ width: 26, height: 26, borderRadius: 6 }} />
      ) : (
        <Icon
          name={att.kind === "link" ? "link" : att.kind === "cv" ? "briefcase" : "file-text"}
          size={15}
          color={att.status === "error" ? c.error : c.accent}
        />
      )}
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text numberOfLines={1} style={{ color: c.textBody, fontSize: 12 }}>
          {att.name}
        </Text>
        {/* A real size, and a real state word — the audit's A1. */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ color: c.textMuted, fontSize: 10.5 }}>
            {[kb, att.extracting ? t("reading…", "ninasoma…") : att.status === "uploading" ? t("sending…", "inatuma…") : ""]
              .filter(Boolean)
              .join(" · ")}
          </Text>
          {att.status === "uploading" && pct !== undefined ? (
            <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: c.border, overflow: "hidden" }}>
              <Animated.View style={[bar, { height: 3, borderRadius: 2, backgroundColor: c.accent, transformOrigin: "left" }]} />
            </View>
          ) : null}
        </View>
      </View>
      <Pressable hitSlop={8} onPress={onRemove} accessibilityRole="button" accessibilityLabel={t("Remove attachment", "Ondoa kiambatisho")}>
        <Icon name="x" size={13} color={c.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

/**
 * The Sumaiya chat composer (§3.1), control by control.
 *
 * The one rule that matters most: **the composer is never blocked.** The field
 * stays editable while she is working (today it is `editable={false}`, which is
 * the single biggest violation of the motion standard's own "motion is never a
 * gate" rule in the product); a message sent mid-turn is queued by the hook
 * rather than refused; and the send slot becomes **stop** — interrupting is what
 * saves the user's bytes.
 *
 * The three states of the one 44 dp slot, and why each looks the way it does:
 *   empty    → a deliberate 1.5 px outline. NOT a faded filled button that looks
 *              nearly-available with no reason given (the audit's C2).
 *   ready    → ember fill. Fill carries primary weight; size never does.
 *   working  → stop, in the same slot, at the same size, with no added height —
 *              but only while the draft is empty, so a user who has typed the
 *              next thought can always tap send (and have it queued).
 *
 * Enter never sends. Most people type a job advert or a paragraph into this box,
 * and losing a half-written message to a stray Return is worse than one extra
 * tap — sending is the button's job alone.
 */
export function ChatComposer({
  value,
  onChangeText,
  onSend,
  loading,
  attachments,
  onAttach,
  onOpenAttach,
  onRemoveAttachment,
  inputRef,
  onStop,
  draftNote,
}: Props) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useLang();
  const reduce = useMotionReduced();

  const hasDraft = value.trim().length > 0 || attachments.length > 0;
  // The slot is stop only when there is nothing of the user's own to send: a
  // cancel in the slot every finger goes to must never eat a message they typed.
  const showStop = loading && !hasDraft && !!onStop;

  // Move 11 — the send ⇄ stop morph: a 220 glyph cross-fade over a 90 fill.
  const glyph = useSharedValue(1);
  useEffect(() => {
    glyph.value = 0;
    glyph.value = withTiming(1, { duration: chatEnterMs(reduce, CHAT_MOTION.sendSlot.glyph), easing: Easing.out(Easing.cubic) });
  }, [showStop, reduce, glyph]);
  const glyphFade = useAnimatedStyle(() => ({ opacity: glyph.value }));
  // The fill cross-fades at `micro` (90 ms) — a colour change in place, felt
  // rather than watched, and the reason the slot never "pops" between states.
  const fill = useSharedValue(hasDraft || showStop ? 1 : 0);
  useEffect(() => {
    fill.value = withTiming(hasDraft || showStop ? 1 : 0, {
      duration: reduce ? 1 : CHAT_MOTION.sendSlot.fill,
      easing: Easing.out(Easing.cubic),
    });
  }, [hasDraft, showStop, reduce, fill]);
  const fillFade = useAnimatedStyle(() => ({ opacity: fill.value }));

  const slotBg = showStop ? c.text : c.accentFill;

  return (
    <View
      style={{
        paddingLeft: 12 + insets.left,
        paddingRight: 12 + insets.right,
        paddingTop: attachments.length ? 8 : 10,
        // Do NOT add insets.bottom here. This composer lives inside a tab
        // screen, and the tab bar (AnimatedTabBar) is the bottom-most element
        // and already pads itself by the safe-area inset — the scene does not
        // extend under it. Adding the inset here too stacked it twice and left
        // ~40dp of dead space between the input and the tab bar (measured:
        // 80px of the 100px gap on a 1.7x/272dpi screen).
        paddingBottom: 10,
        borderTopWidth: 1,
        borderTopColor: c.border,
        backgroundColor: c.bgElevated,
        gap: 8,
      }}
    >
      {attachments.length > 0 && (
        // keyboardShouldPersistTaps: the chips are tappable WHILE the person is
        // typing, and without this the first tap only dismisses the keyboard — the
        // chip appears dead and they tap it again.
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8, paddingRight: 12, alignItems: "center" }} style={{ flexGrow: 0 }}>
          {attachments.map((a, i) => (
            // Move 12 — a chip enters at 300 with a 40 ms stagger and leaves at
            // 140 `ease.in`; both token durations, both instant reduced. The
            // delay lives in the shared value below, never in a layout pass.
            <ChipWithEntrance key={a.id} index={i} reduce={reduce}>
              <Chip att={a} onRemove={() => onRemoveAttachment(a.id)} />
            </ChipWithEntrance>
          ))}
        </ScrollView>
      )}

      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
        {/* 44 dp (was 40) — the iOS hit-region minimum, and the smallest size
            that does not grow the row. */}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            haptics.light();
            onOpenAttach();
          }}
          accessibilityLabel={t("Add photo or file", "Ongeza picha au faili")}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: c.accent + "16",
          }}
        >
          <Icon name="plus" size={21} color={c.accent} />
        </Pressable>

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={t("Message me…", "Niandikie…")}
          placeholderTextColor={c.textMuted}
          selectionColor={c.accent}
          // The field is NEVER disabled. She may be working; the user may still
          // be typing — and on a metered connection the next thought must not be
          // lost to a locked box.
          editable
          multiline
          // Enter must NEVER send (C4 — kept, and the opposite of the web's
          // Enter-to-send; the native behaviour is the right one for this
          // audience).
          submitBehavior="newline"
          returnKeyType="default"
          maxLength={2000}
          style={{
            flex: 1,
            maxHeight: 120,
            minHeight: 44,
            backgroundColor: c.bg,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 22,
            paddingHorizontal: 16,
            paddingTop: 11,
            paddingBottom: 11,
            fontSize: 15,
            color: c.text,
          }}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showStop ? t("Stop", "Acha") : t("Send", "Tuma")}
          onPress={() => {
            haptics.light();
            if (showStop) onStop?.();
            else if (hasDraft) onSend();
          }}
          accessibilityState={{ disabled: !showStop && !hasDraft }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            // The empty state is a deliberate 1.5 px outline, not a faded
            // filled button (the audit's C2): an *empty* affordance.
            borderWidth: 1.5,
            borderColor: c.borderStrong,
          }}
        >
          {/* The fill layer: opacity 0 while the slot is empty, so the outline
              shows; it fades in when there is something to send or to stop. */}
          <Animated.View
            pointerEvents="none"
            style={[
              fillFade,
              { position: "absolute", top: -1.5, left: -1.5, right: -1.5, bottom: -1.5, borderRadius: 22, backgroundColor: slotBg },
            ]}
          />
          <Animated.View style={glyphFade}>
            {showStop ? (
              // A rounded-square glyph: the stop is not an arrow, and it must not
              // be mistakable for one.
              <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: c.accentText }} />
            ) : loading ? (
              <ActivityIndicator size="small" color={c.accentText} />
            ) : (
              <Icon name="arrow-up" size={19} color={hasDraft ? c.accentText : c.textMuted} />
            )}
          </Animated.View>
        </Pressable>
      </View>

      {/* The draft line: below the row, 11.5 px, and shown only when it has
          something true to say. It is the only place a queued message or an
          unavailable intelligence is mentioned at the composer. */}
      {draftNote ? (
        <Text style={{ color: c.textMuted, fontSize: 11.5, paddingHorizontal: 4 }}>{draftNote}</Text>
      ) : null}
    </View>
  );
}

/**
 * Move 12's stagger, expressed once: the nth chip waits `30 + min(n, 3)×40` ms
 * (0 under Reduce Motion) and then enters at 300 `ease.out`. Bounded, so a
 * six-chip row is fully delivered in 150 ms rather than trickling in.
 */
function ChipWithEntrance({ index, reduce, children }: { index: number; reduce: boolean; children: React.ReactNode }) {
  const delay = chatStaggerDelayMs(index, reduce);
  const v = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) {
      v.value = 1;
      return;
    }
    v.value = 0;
    v.value = withDelay(
      delay,
      withTiming(1, { duration: chatEnterMs(false, CHAT_MOTION.attachmentChip.enter), easing: Easing.out(Easing.cubic) }),
    );
  }, [reduce, delay, v]);
  const anim = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ translateY: (1 - v.value) * 6 }],
  }));
  return <Animated.View style={anim}>{children}</Animated.View>;
}
