import React, { useEffect } from "react";
import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Icon } from "../icon";
import { haptics, useThemeColors } from "../ui";
import { useLang } from "../../lib/i18n";
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
}: {
  attachment: Attachment | null;
  onClose: () => void;
}) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useLang();
  const progress = useSharedValue(0);
  const [mounted, setMounted] = React.useState(!!attachment);

  useEffect(() => {
    if (attachment) {
      setMounted(true);
      progress.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: 160, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachment]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + progress.value * 0.6,
    transform: [{ translateY: (1 - progress.value) * 380 }],
  }));

  if (!mounted) return null;
  const a = attachment;

  const kindLabel =
    a?.kind === "link" ? t("Job link", "Link ya kazi")
    : a?.kind === "image" ? t("Photo", "Picha")
    : a?.kind === "cv" ? t("Your CV", "CV yako")
    : t("Document", "Faili");

  return (
    <Modal transparent visible={mounted} onRequestClose={onClose} animationType="none" statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <Pressable style={{ flex: 1 }} onPress={onClose}>
          <Animated.View style={[backdropStyle, { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }]} />
        </Pressable>

        <Animated.View
          style={[
            sheetStyle,
            {
              maxHeight: "78%",
              backgroundColor: c.bgElevated,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 8,
              paddingBottom: insets.bottom + 16,
              paddingHorizontal: 18,
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
            <View style={{ flexDirection: "row", gap: 10, backgroundColor: c.warning + "14", borderRadius: 12, padding: 12 }}>
              <Icon name="alert-triangle" size={16} color={c.warning} />
              <Text style={{ flex: 1, color: c.textBody, fontSize: 13.5, lineHeight: 20 }}>{a.extractError}</Text>
            </View>
          ) : a?.extractedText ? (
            <>
              <Text style={{ color: c.textMuted, fontSize: 11.5, fontWeight: "700", letterSpacing: 0.4, marginBottom: 8, textTransform: "uppercase" }}>
                {t("What Sumaiya read", "Sumaiya alichosoma")}
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
