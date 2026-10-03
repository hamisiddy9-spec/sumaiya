import React, { useEffect } from "react";
import { Image, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Icon } from "../icon";
import { haptics, useMotionReduced, useThemeColors } from "../ui";
import { CHAT_MOTION, chatEnterMs, chatExitMs } from "./chat-motion";
import { useLang } from "../../lib/i18n";
import { extractFailureMessage } from "../../lib/attachment-extract";
import type { Attachment } from "./chat-types";

/**
 * Tap a file you sent → this sheet. Shows exactly what Sumaiya received from it:
 * the extracted text, a "still reading" state, or the reason it couldn't be
 * read. Removes the guesswork the user complained about ("I sent a doc but I'm
 * not sure of the content").
 */
export function AttachmentPreviewSheet({
  attachment,
  onClose,
  onRetry,
}: {
  attachment: Attachment | null;
  onClose: () => void;
  /** Re-read this attachment. Shown as a button only when the read failed —
   *  a failed read used to be a dead end. */
  onRetry?: () => void;
}) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { t, lang } = useLang();
  const progress = useSharedValue(0);
  const reduce = useMotionReduced();
  const [mounted, setMounted] = React.useState(!!attachment);

  useEffect(() => {
    if (attachment) {
      setMounted(true);
      // §3.6b: this sheet's entrance was right and its EXIT was off-token (160
      // is not a duration in the system). It is the V1 bottom sheet, so both ends
      // come from the chat motion table: 220 `ease.out` in, 140 `ease.in` out —
      // and `dur.instant` under Reduce Motion.
      progress.value = withTiming(1, { duration: chatEnterMs(reduce, CHAT_MOTION.sheet.panel), easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: chatExitMs(reduce, CHAT_MOTION.sheet.exit), easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachment, reduce]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + progress.value * 0.6,
    transform: [{ translateY: (1 - progress.value) * 380 }],
  }));

  if (!mounted) return null;
  const a = attachment;

  const kindLabel =
    a?.kind === "link" ? t("Job link", "Kiungo cha ajira")
    : a?.kind === "image" ? t("Photo", "Picha")
    : a?.kind === "cv" ? t("Your CV", "CV yako")
    : t("Document", "Faili");

  return (
    <Modal transparent visible={mounted} onRequestClose={onClose} animationType="none" statusBarTranslucent>
      <View style={{ width, height }}>
        <Pressable
          style={{ flex: 1 }}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t("Close", "Funga")}
        >
          <Animated.View style={[backdropStyle, { flex: 1, backgroundColor: c.overlay }]} />
        </Pressable>

        <Animated.View
          style={[
            sheetStyle,
            {
              // Explicit width — a reanimated Animated.View in a Modal collapses
              // its flex children to zero width on the New Architecture without it.
              position: "absolute",
              bottom: 0,
              left: 0,
              width,
              maxHeight: "78%",
              backgroundColor: c.bgElevated,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 8,
              paddingBottom: insets.bottom + 16,
              paddingLeft: 18 + insets.left,
              paddingRight: 18 + insets.right,
              borderTopWidth: 1,
              borderColor: c.border,
            },
          ]}
        >
          <View style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: 14 }} />

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.accent + "1f", alignItems: "center", justifyContent: "center" }}>
              <Icon
                name={a?.kind === "link" ? "link" : a?.kind === "image" ? "image" : a?.kind === "cv" ? "briefcase" : "file-text"}
                size={19}
                color={c.accent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ color: c.text, fontSize: 15.5, fontWeight: "700" }}>{a?.name}</Text>
              <Text style={{ color: c.textMuted, fontSize: 12.5, marginTop: 1 }}>
                {kindLabel}
                {a?.size ? ` · ${(a.size / 1024).toFixed(0)} KB` : ""}
              </Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: c.border, marginVertical: 12 }} />

          {a?.kind === "image" && a.extracting !== true && !a.extractedText && !a.extractError ? (
            <Image source={{ uri: a.uri }} style={{ width: "100%", height: 260, borderRadius: 12, resizeMode: "contain" }} />
          ) : a?.extracting ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 24, justifyContent: "center" }}>
              <Icon name="refresh-cw" size={16} color={c.textMuted} />
              <Text style={{ color: c.textMuted, fontSize: 14 }}>{t("Reading the file…", "Ninasoma faili…")}</Text>
            </View>
          ) : a?.extractError ? (
            <View style={{ backgroundColor: c.warning + "14", borderRadius: 12, padding: 12, gap: 12 }}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Icon name="alert-triangle" size={16} color={c.warning} />
                <Text style={{ flex: 1, color: c.textBody, fontSize: 13.5, lineHeight: 20 }}>
                  {/* The reason, in the user's language. `extractError` holds an
                      English sentence for the transcript; the code is the
                      display source so a Kiswahili user isn't shown English. */}
                  {a.extractErrorCode
                    ? extractFailureMessage(a.extractErrorCode, lang)
                    : a.extractError}
                </Text>
              </View>
              {onRetry ? (
                <Pressable
                  onPress={() => {
                    haptics.selection();
                    onRetry();
                  }}
                  disabled={a.extracting}
                  accessibilityRole="button"
                  accessibilityLabel={t("Try reading it again", "Jaribu kuisoma tena")}
                  style={({ pressed }) => ({
                    alignSelf: "flex-start",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 7,
                    paddingVertical: 9,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    backgroundColor: pressed ? c.accentPressed : c.accentFill,
                    minHeight: 40,
                    opacity: a.extracting ? 0.6 : 1,
                  })}
                >
                  <Icon name="refresh-cw" size={15} color={c.accentText} />
                  <Text style={{ color: c.accentText, fontSize: 14, fontWeight: "700" }}>
                    {a.extracting
                      ? t("Reading…", "Inasoma…")
                      : t("Try again", "Jaribu tena")}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : a?.extractedText ? (
            <>
              <Text style={{ color: c.textMuted, fontSize: 11.5, fontWeight: "700", letterSpacing: 0.4, marginBottom: 8, textTransform: "uppercase" }}>
                {t("What I read", "Nilichosoma")}
              </Text>
              <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ paddingBottom: 8 }}>
                <Text style={{ color: c.textBody, fontSize: 13.5, lineHeight: 20 }}>{a.extractedText}</Text>
              </ScrollView>
            </>
          ) : a?.kind === "link" ? (
            <Text style={{ color: c.textBody, fontSize: 13.5 }}>{a.uri}</Text>
          ) : (
            <Text style={{ color: c.textMuted, fontSize: 13.5, paddingVertical: 16, textAlign: "center" }}>
              {t("Nothing to preview.", "Hakuna cha kuonyesha.")}
            </Text>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              haptics.selection();
              onClose();
            }}
            style={{ marginTop: 16, alignSelf: "center", paddingVertical: 8, paddingHorizontal: 24 }}
          >
            <Text style={{ color: c.accent, fontSize: 14, fontWeight: "700" }}>{t("Done", "Sawa")}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
