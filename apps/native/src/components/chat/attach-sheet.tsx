import React, { useEffect } from "react";
import { Dimensions, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Icon } from "../icon";
import { haptics, useThemeColors } from "../ui";
import { useLang } from "../../lib/i18n";

export type AttachKind = "camera" | "photo" | "file" | "link" | "myDoc";

interface Row {
  kind: AttachKind;
  icon: string;
  en: string;
  sw: string;
  hintEn: string;
  hintSw: string;
}

const ROWS: Row[] = [
  { kind: "camera", icon: "camera", en: "Take a photo", sw: "Piga picha", hintEn: "A printed CV or a job advert", hintSw: "CV au tangazo la kazi" },
  { kind: "photo", icon: "image", en: "Photo library", sw: "Toka kwenye picha", hintEn: "A screenshot or a saved scan", hintSw: "Picha ya skrini au skani" },
  { kind: "file", icon: "file-text", en: "Upload a file", sw: "Pakia faili", hintEn: "PDF, Word or a text file", hintSw: "PDF, Word au maandishi" },
  { kind: "link", icon: "link", en: "Paste a job link", sw: "Bandika link ya kazi", hintEn: "I'll read the advert for you", hintSw: "Nitasoma tangazo kwa niaba yako" },
  { kind: "myDoc", icon: "briefcase", en: "One of my CVs", sw: "CV yangu niliyonayo", hintEn: "Use it as a starting point", hintSw: "Ianzie hapo" },
];

/**
 * The chat composer's [+] menu. A bottom sheet built on RN Modal — the sheet
 * is a flex child pinned to the bottom (not absolute-positioned), so it always
 * spans the full width on Android. Reanimated slide-up + fade backdrop.
 */
export function AttachSheet({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (kind: AttachKind) => void;
}) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useLang();
  const progress = useSharedValue(0);
  const [mounted, setMounted] = React.useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + progress.value * 0.6,
    transform: [{ translateY: (1 - progress.value) * 360 }],
  }));

  if (!mounted) return null;

  const choose = (kind: AttachKind) => {
    haptics.selection();
    onClose();
    // let the close animation start before the picker takes over
    setTimeout(() => onPick(kind), 140);
  };

  return (
    <Modal transparent visible={mounted} onRequestClose={onClose} animationType="none" statusBarTranslucent>
      <View style={{ width: Dimensions.get("window").width, height: Dimensions.get("window").height }}>
        <Pressable
          style={{ flex: 1 }}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t("Close", "Funga")}
        >
          <Animated.View style={[backdropStyle, { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }]} />
        </Pressable>

        <Animated.View
          style={[
            sheetStyle,
            {
              backgroundColor: c.bgElevated,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 8,
              paddingBottom: insets.bottom + 16,
              paddingHorizontal: 12,
              borderTopWidth: 1,
              borderColor: c.border,
            },
          ]}
        >
          <View style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: 14 }} />
          <Text style={{ color: c.text, fontSize: 15, fontWeight: "700", marginLeft: 8, marginBottom: 6 }}>
            {t("Add to the chat", "Ongeza kwenye mazungumzo")}
          </Text>

          {ROWS.map((r) => (
            <Pressable
              key={r.kind}
              onPress={() => choose(r.kind)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingVertical: 12,
                paddingHorizontal: 8,
                borderRadius: 14,
                backgroundColor: pressed ? c.accent + "14" : "transparent",
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  backgroundColor: c.accent + "1f",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={r.icon} size={20} color={c.accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: c.text, fontSize: 15.5, fontWeight: "600" }}>{t(r.en, r.sw)}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12.5, marginTop: 2 }}>{t(r.hintEn, r.hintSw)}</Text>
              </View>
              <Icon name="chevron-right" size={18} color={c.textMuted} />
            </Pressable>
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
}
