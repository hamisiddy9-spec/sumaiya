import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useAppNavigation } from "../../hooks/use-app-navigation";
import { Icon } from "../../components/icon";
import { Card, EmptyState, Reveal, Screen, Stagger, haptics, useMotionReduced, useThemeColors } from "../../components/ui";
// The shared type ramp. Family names are never written by hand — a string that
// is not a registered cut paints the system font without raising (see
// components/home/tokens.ts and its test).
import { FONT, HOME_SPACING } from "../../components/home";
import { keyboardAvoidingBehavior } from "../../lib/keyboard-avoiding";
import { useLang } from "../../lib/i18n";

/**
 * E1 · Ingiza CV — the Import home.
 *
 * Three ways in, in the design's order and wording: a photo of a paper copy, a
 * file already on the phone, and text copied out of an email or a note. The
 * third one is new — it opens a paste sheet and hands what the user pastes to
 * the chat as THEIR message (`SumaiyaTab` with a `seed`), the same route the
 * Learning Hub uses. No extraction is faked: nothing claims to have read a
 * document that it never read.
 *
 * The screen owns two more real actions that the design's three rows do not
 * cover — the photo library (an image the camera never took: a screenshot, a
 * scan someone sent on WhatsApp) and Photos to PDF (`PdfTools`). Both stay on
 * screen, in the same row language, below the numbered three. A capability is
 * not removed to make the count match a mockup.
 *
 * The permission gate and the live camera below are unchanged: the design
 * covers the landing state of this screen only.
 */

/** One import row: a 48 dp ember-tinted well, a title, one line of body, and an optional mono footnote. */
function ImportRow({
  icon,
  title,
  body,
  note,
  noteColor,
  onPress,
}: {
  icon: string;
  title: string;
  body: string;
  /** The design's `text-[10px] font-mono` line. Omitted on the rows the design does not draw. */
  note?: string;
  noteColor?: string;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <Card
      onPress={onPress}
      padded={false}
      accessibilityLabel={`${title}. ${body}${note ? `. ${note}` : ""}`}
      // `items-start`, not centre: the designed row is a block of text beside
      // the well, and its three lines wrap at 200 % text scale.
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 16,
        padding: 16,
        minHeight: HOME_SPACING.minTarget,
        backgroundColor: c.bgElevated,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: c.accentTint,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={24} color={c.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: c.text, fontSize: 15, lineHeight: 20, fontFamily: FONT.bold }}>{title}</Text>
        <Text style={{ color: c.textBody, fontSize: 13, lineHeight: 19, marginTop: 2, fontFamily: FONT.regular }}>
          {body}
        </Text>
        {note ? (
          <Text
            style={{
              color: noteColor ?? c.textMuted,
              fontSize: 10,
              lineHeight: 15,
              marginTop: 8,
              fontFamily: FONT.mono,
            }}
          >
            {note}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

/**
 * The paste sheet for row 3 — a real input, not a row that goes nowhere.
 * `PromptModal` is a one-line field; a CV is many lines, so this is the
 * screen's own multiline surface (nothing in components/ui is restructured).
 * What the user pastes is sent as their own message to Sumaiya.
 */
function PasteCvSheet({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
}) {
  const c = useThemeColors();
  const { t } = useLang();
  const reduce = useMotionReduced();
  const [value, setValue] = useState("");

  // A fresh sheet every time it opens: a half-pasted draft from last time is
  // not a draft the user asked to keep.
  useEffect(() => {
    if (visible) setValue("");
  }, [visible]);

  const text = value.trim();
  const canSend = text.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      // §4 — the sheet's own transition is off entirely under Reduce Motion.
      animationType={reduce ? "none" : "fade"}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={keyboardAvoidingBehavior()}>
        <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: c.overlay }}>
          <View
            style={{
              backgroundColor: c.bgElevated,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: c.border,
              padding: 20,
            }}
          >
            <Text style={{ color: c.text, fontSize: 18, lineHeight: 24, fontFamily: FONT.bold }}>
              {t("Paste your CV", "Bandika wasifu wako")}
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 13, lineHeight: 19, marginTop: 6, fontFamily: FONT.regular }}>
              {t(
                "Copy the text from an email or notes, then paste it here. Sumaiya reads it straight away.",
                "Nakili maandishi kutoka barua pepe au noti, kisha ubandike hapa. Sumaiya anayasoma papo hapo.",
              )}
            </Text>
            <TextInput
              value={value}
              onChangeText={setValue}
              multiline
              textAlignVertical="top"
              autoFocus
              placeholder={t("Paste the CV text here…", "Bandika maandishi ya wasifu hapa…")}
              placeholderTextColor={c.textMuted}
              selectionColor={c.accent}
              style={{
                minHeight: 140,
                maxHeight: 260,
                marginTop: 14,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 11,
                backgroundColor: c.bg,
                color: c.text,
                fontSize: 15,
                lineHeight: 21,
                fontFamily: FONT.regular,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 8,
                marginTop: 16,
              }}
            >
              {/* §8 — both controls are 48 dp, and neither is a bare word. */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("Cancel", "Ghairi")}
                onPress={onClose}
                style={{
                  minHeight: 48,
                  paddingHorizontal: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: c.textMuted, fontSize: 15, fontFamily: FONT.bold }}>{t("Cancel", "Ghairi")}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSend }}
                accessibilityLabel={t("Send to Sumaiya", "Tuma kwa Sumaiya")}
                disabled={!canSend}
                onPress={() => {
                  if (!canSend) return;
                  haptics.light();
                  onSubmit(text);
                }}
                style={{
                  minHeight: 48,
                  paddingHorizontal: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 12,
                  backgroundColor: canSend ? c.accentFillStrong : c.bgSunken,
                }}
              >
                <Text
                  style={{ color: canSend ? c.accentText : c.textMuted, fontSize: 15, fontFamily: FONT.bold }}
                >
                  {t("Send to Sumaiya", "Tuma kwa Sumaiya")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ScanScreen() {
  const c = useThemeColors();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [live, setLive] = useState(false);
  const [torch, setTorch] = useState(false);
  const [shooting, setShooting] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);

  const shoot = async () => {
    if (!cameraRef.current || shooting) return;
    setShooting(true);
    haptics.medium();
    try {
      const shot = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (shot?.uri) {
        setLive(false);
        setTorch(false);
        navigation.navigate("ScanProcessing", { photoUri: shot.uri });
      }
    } catch {
      haptics.error();
    } finally {
      setShooting(false);
    }
  };

  const pickImage = async () => {
    haptics.light();
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
      });
      if (!res.canceled && res.assets[0]?.uri) {
        setLive(false);
        navigation.navigate("ScanProcessing", { photoUri: res.assets[0].uri });
      }
    } catch {
      haptics.error();
    }
  };

  // Opens Android's system document picker — shows every provider the phone
  // has: local storage, Downloads, Google Drive, OneDrive, etc.
  const pickFile = async () => {
    haptics.light();
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
          "image/*",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (res.canceled || !res.assets?.length) return;
      const f = res.assets[0];
      setLive(false);
      if (f.mimeType?.startsWith("image/")) {
        // an image reads the same as a camera scan
        navigation.navigate("ScanProcessing", { photoUri: f.uri });
        return;
      }
      // PDF / Word / text — real extraction lands with /api/mobile/import.
      // Until then, hand it to Sumaiya so she can still work with it.
      navigation.navigate("SumaiyaTab", {
        attachment: { kind: "document", uri: f.uri, name: f.name, mimeType: f.mimeType },
      });
    } catch {
      haptics.error();
    }
  };

  // Row 3 — the pasted text becomes the user's own message in the chat. The
  // chat already consumes `seed` by sending it (see screens/learning-hub-screen
  // and sumaiya-chat-screen), so the pasted CV is read by the reader that
  // exists rather than by one invented here.
  const submitPaste = (text: string) => {
    setPasteOpen(false);
    if (!text) return;
    navigation.navigate("SumaiyaTab", { seed: text });
  };

  // ── Permission gates ────────────────────────────────────────────────────
  if (permission && !permission.granted) {
    const canAsk = permission.canAskAgain;
    return (
      <Screen scroll={false} keyboardAvoiding={false}>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <EmptyState
            icon="camera"
            title={t("Camera access", "Ruhusa ya kamera")}
            body={
              canAsk
                ? t("I use your camera to read an existing CV. Nothing is stored — the photo is processed and discarded.", "Natumia kamera kusoma CV uliyonayo. Hakuna kinachohifadhiwa — picha inatumika kisha inafutwa.")
                : t("Camera access is off. Enable it in Settings to scan a CV with your camera.", "Ruhusa ya kamera imezimwa. Iwashe kwenye Mipangilio ili kupiga CV kwa kamera.")
            }
            actionLabel={canAsk ? t("Allow camera", "Ruhusu kamera") : t("Open Settings", "Fungua Mipangilio")}
            onAction={async () => {
              haptics.light();
              if (canAsk) await requestPermission();
              else Linking.openSettings();
            }}
            secondaryLabel={t("Choose from gallery instead", "Chagua kutoka kwenye picha badala yake")}
            onSecondary={pickImage}
          />
        </View>
      </Screen>
    );
  }

  // ── Live camera ─────────────────────────────────────────────────────────
  if (live) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" enableTorch={torch} />

        {/* Document frame overlay */}
        <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }} pointerEvents="none">
          <View style={{ width: "82%", aspectRatio: 1 / 1.414 }}>
            {(["tl", "tr", "bl", "br"] as const).map((corner) => (
              <View
                key={corner}
                style={{
                  position: "absolute",
                  width: 34,
                  height: 34,
                  borderColor: "#fff",
                  borderTopWidth: corner[0] === "t" ? 3 : 0,
                  borderBottomWidth: corner[0] === "b" ? 3 : 0,
                  borderLeftWidth: corner[1] === "l" ? 3 : 0,
                  borderRightWidth: corner[1] === "r" ? 3 : 0,
                  top: corner[0] === "t" ? 0 : undefined,
                  bottom: corner[0] === "b" ? 0 : undefined,
                  left: corner[1] === "l" ? 0 : undefined,
                  right: corner[1] === "r" ? 0 : undefined,
                  borderRadius: 6,
                }}
              />
            ))}
          </View>
        </View>

        <Animated.Text
          entering={FadeIn}
          style={{
            position: "absolute",
            top: insets.top + 20,
            alignSelf: "center",
            color: "#fff",
            fontSize: 14,
            fontWeight: "600",
            backgroundColor: "rgba(0,0,0,0.4)",
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          {t("Fit the whole CV inside the frame", "Weka CV nzima ndani ya fremu")}
        </Animated.Text>

        {/* Controls */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingBottom: insets.bottom + 24,
            paddingTop: 20,
            paddingLeft: 28 + insets.left,
            paddingRight: 28 + insets.right,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Close", "Funga")}
            onPress={() => {
              haptics.selection();
              setLive(false);
              setTorch(false);
            }}
            hitSlop={12}
            style={{ width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            <Icon name="x" size={22} color="#fff" />
          </Pressable>

          <Pressable
            onPress={shoot}
            disabled={shooting}
            accessibilityRole="button"
            accessibilityLabel={t("Take photo", "Piga picha")}
            style={{
              width: 74,
              height: 74,
              borderRadius: 37,
              borderWidth: 4,
              borderColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: shooting ? c.textMuted : "#fff" }} />
          </Pressable>

          <Pressable
            onPress={() => {
              haptics.selection();
              setTorch((t) => !t);
            }}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t("Torch", "Mwanga")}
            accessibilityState={{ selected: torch }}
            style={{ width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: torch ? "#fff" : "rgba(255,255,255,0.15)" }}
          >
            <Icon name="zap" size={20} color={torch ? "#000" : "#fff"} />
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Landing: E1 · Ingiza CV ──────────────────────────────────────────────
  // Rows 1–3 are the design's, in its order and its wording. Rows 4–5 are the
  // capabilities the design does not draw, kept in the same language and
  // deliberately un-numbered: the design numbers only its three ways.
  const rows: {
    key: string;
    icon: string;
    title: string;
    body: string;
    note?: string;
    noteColor?: string;
    onPress: () => void;
  }[] = [
    {
      key: "camera",
      icon: "camera",
      title: t("1. Take a photo (Camera)", "1. Piga Picha (Kamera)"),
      body: t(
        "If you have a paper copy, take a photo and the system will read the text.",
        "Ikiwa unayo nakala ngumu ya karatasi, piga picha na mfumo utasoma maandishi.",
      ),
      // NOT "Inafanya kazi bila bando" / "works without data". The photo is read
      // by OCR on the SERVER — POST /api/mobile/ocr, because React Native cannot
      // run tesseract — so this path stops working offline. The design's footnote
      // promised the opposite, and a user who trusts it loses their only shot at
      // their CV on a metered phone. What is true is what they need to know.
      note: t("Needs a connection to read", "Inahitaji mtandao kusomwa"),
      noteColor: c.accent,
      onPress: () => setLive(true),
    },
    {
      key: "file",
      icon: "file-text",
      title: t("2. Choose a file (PDF / Word)", "2. Chagua Faili (PDF / Word)"),
      body: t(
        "Upload a file that is on your phone or in your WhatsApp directly.",
        "Pakia faili iliyopo kwenye simu au WhatsApp yako moja kwa moja.",
      ),
      note: t("PDF, DOCX, TXT up to 15MB", "PDF, DOCX, TXT hadi 15MB"),
      noteColor: c.textMuted,
      onPress: pickFile,
    },
    {
      key: "paste",
      icon: "clipboard-paste",
      title: t("3. Paste text", "3. Bandika Maandishi"),
      body: t(
        "Copy your CV from an email or notes and paste it here right away.",
        "Nakili wasifu wako kutoka barua pepe au noti na ubandike hapa papo hapo.",
      ),
      note: t("The fastest way", "Njia ya haraka zaidi"),
      // The design paints this one `emerald-700`; that is a mockup artefact, not
      // a token (the brief's rule 6), so it is the palette's own success hue.
      noteColor: c.success,
      onPress: () => setPasteOpen(true),
    },
    {
      key: "gallery",
      icon: "image",
      title: t("From your photos", "Kutoka kwenye picha"),
      body: t("A screenshot or saved scan", "Picha ya skrini au skani"),
      onPress: pickImage,
    },
    {
      key: "photos-to-pdf",
      icon: "file-plus",
      title: t("Photos to PDF", "Picha kuwa PDF"),
      body: t("Combine certificates or IDs into one file", "Unganisha vyeti au vitambulisho kuwa faili moja"),
      onPress: () => navigation.navigate("PdfTools"),
    },
  ];

  // Pinned to the bottom of the screen when the rows do not fill it, in flow
  // when they do (the design's `justify-between` + `pt-4 border-t`).
  const footerStyle: ViewStyle = {
    marginTop: "auto",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: c.border,
  };

  return (
    <Screen scroll keyboardAvoiding={false}>
      <Reveal distance={0} style={{ marginTop: 8 }}>
        <Text
          style={{ color: c.text, fontSize: 24, lineHeight: 30, letterSpacing: -0.5, fontFamily: FONT.display }}
        >
          {t("Import your CV", "Ingiza CV Yako")}
        </Text>
        <Text style={{ color: c.textBody, fontSize: 13, lineHeight: 19, marginTop: 6, fontFamily: FONT.regular }}>
          {t(
            "Choose one of the ways to bring your CV onto your phone:",
            "Chagua njia moja wapo ya kuleta wasifu wako kwenye simu:",
          )}
        </Text>
      </Reveal>

      <View style={{ gap: 12, marginTop: 20, marginBottom: 24 }}>
        {rows.map((row, i) => (
          <Stagger key={row.key} index={i}>
            <ImportRow
              icon={row.icon}
              title={row.title}
              body={row.body}
              note={row.note}
              noteColor={row.noteColor}
              onPress={row.onPress}
            />
          </Stagger>
        ))}
      </View>

      <Reveal delayMs={200} style={footerStyle}>
        <Text
          style={{ color: c.textMuted, fontSize: 11.5, lineHeight: 17, textAlign: "center", fontFamily: FONT.mono }}
        >
          {/* NOT the design's "Taarifa zote zinasomwa na kubaki ndani ya simu yako
              tu" / "everything stays only inside your phone". Photos and files ARE
              sent to be read (POST /api/mobile/ocr for a photo, and the chat's
              extraction route for a document), which the privacy policy itself
              records — it lists uploaded files as collected. The claim was false
              and this screen is the wrong place to be loose about it.
              What the code actually does: the upload is read and NOT persisted
              (mobile-ocr.ts holds no insert, no storage, no cache), so the honest
              line is both halves — sent to be read, and not kept. */}
          {t(
            "Photos and files are sent to be read; they are not kept.",
            "Picha na faili hutumwa kusomwa; hazihifadhiwi.",
          )}
        </Text>
      </Reveal>

      <PasteCvSheet visible={pasteOpen} onClose={() => setPasteOpen(false)} onSubmit={submitPaste} />
    </Screen>
  );
}
