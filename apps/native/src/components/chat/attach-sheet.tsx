import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
 * The chat composer's [+] menu.
 *
 * NOT a <Modal> — on the New Architecture an Android Modal's content window
 * doesn't apply `flexDirection: "row"` to nested Pressables, so every row
 * collapsed to a vertical stack (icon over label over chevron). This is a
 * plain absolute-positioned overlay rendered at the chat screen's root, where
 * normal flex layout works. Caller keeps `visible` state and renders it last.
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

  if (!visible) return null;

  const choose = (kind: AttachKind) => {
    haptics.selection();
    onClose();
    setTimeout(() => onPick(kind), 160);
  };

  return (
    <View style={[StyleSheet.absoluteFill, { justifyContent: "flex-end", zIndex: 1000, elevation: 1000 }]}>
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.45)" }]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t("Close", "Funga")}
      />

      <View
        style={{
          backgroundColor: c.bgElevated,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 8,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 12,
          borderTopWidth: 1,
          borderColor: c.border,
          maxHeight: "80%",
        }}
      >
        <View style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: 14 }} />
        <Text style={{ color: c.text, fontSize: 15, fontWeight: "700", marginLeft: 8, marginBottom: 6 }}>
          {t("Add to the chat", "Ongeza kwenye mazungumzo")}
        </Text>

        <ScrollView bounces={false}>
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
                <Text style={{ color: c.text, fontSize: 15.5, fontWeight: "600" }} numberOfLines={1}>
                  {t(r.en, r.sw)}
                </Text>
                <Text style={{ color: c.textMuted, fontSize: 12.5, marginTop: 2 }} numberOfLines={1}>
                  {t(r.hintEn, r.hintSw)}
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color={c.textMuted} />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
