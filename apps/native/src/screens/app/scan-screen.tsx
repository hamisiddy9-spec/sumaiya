import React, { useRef, useState } from "react";
import { Linking, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useAppNavigation } from "../../hooks/use-app-navigation";
import { Icon } from "../../components/icon";
import { Button, Card, EmptyState, Screen, ScreenTitle, haptics, useThemeColors } from "../../components/ui";

export function ScanScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [live, setLive] = useState(false);
  const [torch, setTorch] = useState(false);
  const [shooting, setShooting] = useState(false);

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
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      setLive(false);
      navigation.navigate("ScanProcessing", { photoUri: res.assets[0].uri });
    }
  };

  // Opens Android's system document picker — shows every provider the phone
  // has: local storage, Downloads, Google Drive, OneDrive, etc.
  const pickFile = async () => {
    haptics.light();
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
  };

  // ── Permission gates ────────────────────────────────────────────────────
  if (permission && !permission.granted) {
    const canAsk = permission.canAskAgain;
    return (
      <Screen scroll={false} keyboardAvoiding={false}>
        <EmptyState
          icon="camera"
          title="Camera access"
          body={
            canAsk
              ? "Sumaiya uses your camera to read an existing CV. Nothing is stored — the photo is processed and discarded."
              : "Camera access is off. Enable it in Settings to scan a CV with your camera."
          }
          actionLabel={canAsk ? "Allow camera" : "Open Settings"}
          onAction={async () => {
            haptics.light();
            if (canAsk) await requestPermission();
            else Linking.openSettings();
          }}
        />
        <View style={{ paddingHorizontal: 20 }}>
          <Button label="Choose from gallery instead" variant="ghost" onPress={pickImage} />
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
          Fit the whole CV inside the frame
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
            paddingHorizontal: 28,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        >
          <Pressable
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
            style={{ width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: torch ? "#fff" : "rgba(255,255,255,0.15)" }}
          >
            <Icon name="zap" size={20} color={torch ? "#000" : "#fff"} />
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Landing ─────────────────────────────────────────────────────────────
  return (
    <Screen scroll keyboardAvoiding={false}>
      <Animated.View entering={FadeInDown.duration(300)}>
        <ScreenTitle>Import your CV</ScreenTitle>
        <Text style={{ color: c.textBody, fontSize: 15, marginBottom: 20 }}>
          From a photo, or a file on your phone or Google Drive.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(300).delay(70)} style={{ gap: 12 }}>
        {[
          { icon: "camera", solid: true, title: "Take a photo", sub: "Best for a printed CV", onPress: () => { haptics.light(); setLive(true); } },
          { icon: "folder-open", solid: false, title: "Import a file", sub: "PDF, Word or image — phone storage, Drive, Downloads…", onPress: pickFile },
          { icon: "image", solid: false, title: "From gallery", sub: "A screenshot or saved scan", onPress: pickImage },
          { icon: "file-text", solid: false, title: "Photos to PDF", sub: "Combine certificates or IDs into one file", onPress: () => { haptics.light(); navigation.navigate("PdfTools"); } },
        ].map((row) => (
          <Card
            key={row.title}
            onPress={row.onPress}
            style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 20 }}
          >
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: row.solid ? c.accent : c.accent + "1a", alignItems: "center", justifyContent: "center" }}>
              <Icon name={row.icon} size={22} color={row.solid ? c.accentText : c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: "700" }}>{row.title}</Text>
              <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 2 }}>{row.sub}</Text>
            </View>
            <Icon name="chevron-right" size={18} color={c.textMuted} />
          </Card>
        ))}
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(300).delay(140)}
        style={{
          flexDirection: "row",
          gap: 10,
          marginTop: 24,
          padding: 14,
          borderRadius: 14,
          backgroundColor: c.warning + "14",
          borderWidth: 1,
          borderColor: c.warning + "33",
        }}
      >
        <Icon name="sparkles" size={16} color={c.warning} />
        <Text style={{ flex: 1, color: c.textBody, fontSize: 12.5, lineHeight: 18 }}>
          A photo or image is read on the spot. A PDF or Word file goes to Sumaiya —
          full text extraction from documents lands in the next update.
        </Text>
      </Animated.View>
    </Screen>
  );
}
