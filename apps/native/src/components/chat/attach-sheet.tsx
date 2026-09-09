import React, { useEffect } from "react";
import { Modal, Pressable, Text, View } from "react-native";
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
  { kind: "camera", icon: "camera", en: "Take a photo", sw: "Piga picha", hintEn: "A printed CV or a job advert", hintSw: "CV iliyochapishwa au tangazo la kazi" },
  { kind: "photo", icon: "image", en: "Photo library", sw: "Maktaba ya picha", hintEn: "A screenshot or saved scan", hintSw: "Picha ya skrini au skani" },
  { kind: "file", icon: "file-text", en: "Upload a file", sw: "Pakia faili", hintEn: "PDF, Word or text document", hintSw: "PDF, Word au maandishi" },
  { kind: "link", icon: "link", en: "Paste a job link", sw: "Bandika kiungo cha kazi", hintEn: "We'll read the job description", hintSw: "Tutasoma maelezo ya kazi" },
  { kind: "myDoc", icon: "briefcase", en: "One of my CVs", sw: "Moja ya CV zangu", hintEn: "Use it as a starting point", hintSw: "Itumie kama mwanzo" },
];

/**
 * The chat composer's [+] menu. Custom sheet (no bottom-sheet lib in the
 * project) — reanimated slide-up + fade backdrop, honours the house curve.
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
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 320 }],
  }));

  if (!mounted) return null;

  const choose = (kind: AttachKind) => {
    haptics.selection();
    onClose();
    // let the close animation start before the picker takes over
    setTimeout(() => onPick(kind), 120);
  };

  return (
    <Modal transparent visible={mounted} onRequestClose={onClose} animationType="none" statusBarTranslucent>
      <Pressable style={{ flex: 1 }} onPress={onClose}>
        <Animated.View style={[backdropStyle, { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }]} />
      </Pressable>
      <Animated.View
        style={[
          sheetStyle,
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: c.bgElevated,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            paddingTop: 10,
            paddingBottom: insets.bottom + 14,
            paddingHorizontal: 14,
            borderWidth: 1,
            borderColor: c.border,
          },
        ]}
      >
        <View style={{ alignSelf: "center", width: 38, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: 12 }} />
        <Text style={{ color: c.text, fontSize: 15, fontWeight: "700", marginLeft: 6, marginBottom: 8 }}>
          {t("Add to the chat", "Ongeza kwenye mazungumzo")}
        </Text>
        {ROWS.map((r, i) => (
          <Pressable
            key={r.kind}
            onPress={() => choose(r.kind)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              paddingVertical: 13,
              paddingHorizontal: 8,
              borderRadius: 12,
              backgroundColor: pressed ? c.accent + "12" : "transparent",
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: c.border + "80",
            })}
          >
            <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: c.accent + "16", alignItems: "center", justifyContent: "center" }}>
              <Icon name={r.icon} size={19} color={c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 15, fontWeight: "600" }}>{t(r.en, r.sw)}</Text>
              <Text style={{ color: c.textMuted, fontSize: 12.5, marginTop: 1 }}>{t(r.hintEn, r.hintSw)}</Text>
            </View>
          </Pressable>
        ))}
      </Animated.View>
    </Modal>
  );
}
