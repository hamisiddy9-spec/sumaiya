import React, { useEffect, useState } from "react";
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Icon } from "../icon";
import { haptics, useMotionReduced, useThemeColors } from "../ui";
import { useLang } from "../../lib/i18n";
import { CHAT_MOTION, chatEnterMs, chatExitMs } from "./chat-motion";

/**
 * `jobTarget` is the fifth row (§3.5, "Entry, always available"): a door the
 * user can always walk through, so job targeting no longer depends on their
 * words happening to contain `kazi` / `lenga` / `tangazo` (audit J2). It replaces
 * nothing — the chip stays as a second way in.
 */
export type AttachKind = "camera" | "photo" | "file" | "link" | "myDoc" | "jobTarget";

interface Row {
  kind: AttachKind;
  icon: string;
  en: string;
  sw: string;
  hintEn: string;
  hintSw: string;
}

const ROWS: Row[] = [
  { kind: "camera", icon: "camera", en: "Take a photo", sw: "Piga picha", hintEn: "A printed CV or a job advert", hintSw: "CV au tangazo la ajira" },
  { kind: "photo", icon: "image", en: "Photo library", sw: "Picha zako", hintEn: "A screenshot or a saved scan", hintSw: "Picha ya skrini au skani" },
  { kind: "file", icon: "file-text", en: "Upload a file", sw: "Pakia faili", hintEn: "PDF, Word or a text file", hintSw: "PDF, Word au maandishi" },
  { kind: "link", icon: "link", en: "Paste a job link", sw: "Bandika kiungo cha ajira", hintEn: "I'll use it as context, not read the page", hintSw: "Nitatumia kama muktadha, sitasoma ukurasa" },
  { kind: "myDoc", icon: "briefcase", en: "One of my CVs", sw: "Moja ya CV zako", hintEn: "Use it as a starting point", hintSw: "Ianzie hapo" },
  // §3.5: beneath "One of my CVs", and always there — our live listings lead,
  // the user's own advert is one tap away (option A).
  { kind: "jobTarget", icon: "target", en: "Target a job", sw: "Lenga kwenye kazi", hintEn: "Our live listings, or paste your own advert", hintSw: "Kazi zetu za sasa, au bandika tangazo lako" },
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
  const reduce = useMotionReduced();

  // V1 · the bottom sheet, with the entrance the motion standard already
  // specifies (backdrop 220 `ease.out`; panel `translateY 360→0` 220; exit 140
  // `ease.in`). The sheet used to be `if (!visible) return null` — it appeared
  // and vanished on one frame, which is the audit's J3/§3.6b conflict, so it now
  // stays mounted for the length of its own exit.
  const [shown, setShown] = useState(visible);
  const progress = useSharedValue(0);

  // The Android hardware back button. This sheet is NOT a <Modal> (see the note at the
  // top), so nothing dismissed it on back: the press fell through to the navigator and
  // changed screen with the sheet still standing. The two sheets that ARE Modals pass
  // `onRequestClose` and close correctly — this is that same behaviour.
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true; // handled — do not also navigate
    });
    return () => sub.remove();
  }, [visible, onClose]);

  useEffect(() => {
    if (visible) {
      setShown(true);
      progress.value = withTiming(1, {
        duration: chatEnterMs(reduce, CHAT_MOTION.sheet.panel),
        easing: Easing.out(Easing.cubic),
      });
      return;
    }
    progress.value = withTiming(
      0,
      { duration: chatExitMs(reduce, CHAT_MOTION.sheet.exit), easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(setShown)(false);
      },
    );
  }, [visible, reduce, progress]);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }));
  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - progress.value) * 360 }] }));

  if (!shown) return null;

  const choose = (kind: AttachKind) => {
    haptics.selection();
    onClose();
    setTimeout(() => onPick(kind), 160);
  };

  return (
    <View style={[StyleSheet.absoluteFill, { justifyContent: "flex-end", zIndex: 1000, elevation: 1000 }]}>
      <Animated.View style={[StyleSheet.absoluteFill, backdrop]}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t("Close", "Funga")}
        />
      </Animated.View>

      <Animated.View
        style={[
          panel,
          {
          backgroundColor: c.bgElevated,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 8,
          paddingBottom: insets.bottom + 16,
          paddingLeft: 12 + insets.left,
          paddingRight: 12 + insets.right,
          borderTopWidth: 1,
          borderColor: c.border,
          maxHeight: "80%",
          },
        ]}
      >
        <View style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: 14 }} />
        <Text style={{ color: c.text, fontSize: 15, fontWeight: "700", marginLeft: 8, marginBottom: 6 }}>
          {t("Add to the chat", "Ongeza kwenye mazungumzo")}
        </Text>

        <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
          {ROWS.map((r, i) => (
            <View key={r.kind}>
              <Pressable
                onPress={() => choose(r.kind)}
                accessibilityRole="button"
                accessibilityLabel={`${t(r.en, r.sw)}. ${t(r.hintEn, r.hintSw)}`}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? c.accent + "14" : "transparent",
                  borderRadius: 14,
                })}
              >
                {/*
                 * The row layout lives on a plain View, NOT on the Pressable.
                 * With the row style on the Pressable itself, Android's New
                 * Architecture dropped `flexDirection: "row"` and every row
                 * collapsed into a vertical stack — icon over label over
                 * chevron — which is exactly how it shipped. A plain View has
                 * never been observed to lose its flex props, and the Pressable
                 * having a single child means its own direction is irrelevant.
                 */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 13, paddingHorizontal: 8, minHeight: 56 }}>
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
                </View>
              </Pressable>
              {i < ROWS.length - 1 ? (
                <View style={{ height: 1, backgroundColor: c.border, marginLeft: 66 }} />
              ) : null}
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
