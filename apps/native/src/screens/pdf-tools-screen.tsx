import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useLang } from "../lib/i18n";
import { requestCameraAccess, showCameraRefusal } from "../lib/permissions";
import { A4_H_PT, A4_W_PT } from "../services/pdf-export";
import { Button, Screen, ScreenTitle, dialog, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";

interface Pic {
  uri: string;
  base64: string;
}

export function PdfToolsScreen() {
  const c = useThemeColors();
  const { t } = useLang();
  const [pics, setPics] = useState<Pic[]>([]);
  const [busy, setBusy] = useState(false);

  const add = async (fromCamera: boolean) => {
    haptics.light();
    try {
      // launchCameraAsync doesn't request permission itself (unlike the
      // library picker, which prompts on its own) — this used to call it
      // directly with no permission check and no try/catch at all, so a
      // first-time user tapping Camera before ever granting permission would
      // hit an unhandled rejection with zero feedback.
      if (fromCamera) {
        const access = await requestCameraAccess();
        if (access !== "granted") {
          // Never a silent return. The old code did `if (!perm.granted) return;`
          // — the user tapped Camera, refused, and absolutely nothing happened,
          // with no way to tell the app was waiting on a permission. Now the
          // refusal explains itself and offers the phone's own photo library,
          // which re-enters this same function on the non-camera path.
          showCameraRefusal(access, () => { void add(false); });
          return;
        }
      }
      const opts: ImagePicker.ImagePickerOptions = { quality: 0.7, base64: true };
      const res = fromCamera
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync({ ...opts, allowsMultipleSelection: true, selectionLimit: 20 });
      if (res.canceled) return;
      const next = res.assets
        .filter((a) => a.base64)
        .map((a) => ({ uri: a.uri, base64: a.base64! }));
      // expo-image-picker's `base64` field is nullable by contract even when
      // `base64: true` is requested — seen in practice with multi-select on
      // Android. If every asset came back without it, the picker didn't fail,
      // it just gave us nothing usable: say so instead of a silent no-op.
      if (next.length === 0) {
        haptics.error();
        dialog.alert(t("Couldn't add that photo", "Imeshindwa kuongeza picha hiyo"), t("Try again.", "Jaribu tena."));
        return;
      }
      setPics((p) => [...p, ...next].slice(0, 30));
    } catch {
      haptics.error();
      dialog.alert(t("Couldn't add that photo", "Imeshindwa kuongeza picha hiyo"), t("Try again.", "Jaribu tena."));
    }
  };

  const remove = (i: number) => setPics((p) => p.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) =>
    setPics((p) => {
      const j = i + dir;
      if (j < 0 || j >= p.length) return p;
      const copy = [...p];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const exportPdf = async () => {
    if (pics.length === 0) return;
    setBusy(true);
    haptics.light();
    try {
      const pages = pics
        .map(
          (p) =>
            `<div style="page-break-after:always;display:flex;align-items:center;justify-content:center;height:100vh;">
               <img src="data:image/jpeg;base64,${p.base64}" style="max-width:100%;max-height:100%;object-fit:contain;" />
             </div>`,
        )
        .join("");
      const html = `<html><head><meta name="viewport" content="width=device-width"/><style>*{margin:0;padding:0}</style></head><body>${pages}</body></html>`;
      const { uri } = await Print.printToFileAsync({ html, width: A4_W_PT, height: A4_H_PT });
      haptics.success();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: t("Save or share PDF", "Hifadhi au shiriki PDF") });
      } else {
        dialog.alert(t("PDF ready", "PDF tayari"), uri);
      }
    } catch {
      haptics.error();
      dialog.alert(t("Couldn't make the PDF", "Imeshindwa kutengeneza PDF"), t("Try again.", "Jaribu tena."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll keyboardAvoiding={false} contentContainerStyle={{ gap: 14 }}>
      <ScreenTitle>{t("Photos to PDF", "Picha kuwa PDF")}</ScreenTitle>
      <Text style={{ color: c.textBody, fontSize: 13.5, lineHeight: 20 }}>
        {t(
          "Photograph certificates, IDs or documents and combine them into one PDF to attach to an application.",
          "Piga picha za vyeti, vitambulisho au nyaraka na uziunganishe kuwa PDF moja ya kuambatanisha na ombi.",
        )}
      </Text>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Button label={t("Camera", "Kamera")} variant="secondary" onPress={() => add(true)} leftIcon={<Icon name="camera" size={16} color={c.accent} />} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label={t("Gallery", "Maktaba")} variant="secondary" onPress={() => add(false)} leftIcon={<Icon name="image" size={16} color={c.accent} />} />
        </View>
      </View>

      {pics.length > 0 && (
        <Animated.View entering={FadeIn} style={{ gap: 10 }}>
          {pics.map((p, i) => (
            <Animated.View
              key={p.uri + i}
              entering={FadeInDown.duration(200)}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 12, backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.border }}
            >
              <Image source={{ uri: p.uri }} style={{ width: 44, height: 58, borderRadius: 6, backgroundColor: c.border }} />
              <Text style={{ flex: 1, color: c.textBody, fontSize: 13 }}>{t("Page", "Ukurasa")} {i + 1}</Text>
              <Pressable hitSlop={8} onPress={() => move(i, -1)} disabled={i === 0} accessibilityRole="button" accessibilityLabel={t("Move page up", "Sogeza ukurasa juu")}>
                <Icon name="chevron-up" size={18} color={i === 0 ? c.border : c.textMuted} />
              </Pressable>
              <Pressable hitSlop={8} onPress={() => move(i, 1)} disabled={i === pics.length - 1} accessibilityRole="button" accessibilityLabel={t("Move page down", "Sogeza ukurasa chini")}>
                <Icon name="chevron-down" size={18} color={i === pics.length - 1 ? c.border : c.textMuted} />
              </Pressable>
              <Pressable hitSlop={8} onPress={() => remove(i)} accessibilityRole="button" accessibilityLabel={t("Remove page", "Ondoa ukurasa")}>
                <Icon name="trash-2" size={16} color={c.error} />
              </Pressable>
            </Animated.View>
          ))}
        </Animated.View>
      )}

      {pics.length > 0 && (
        <Button
          label={busy ? t("Making PDF…", "Inatengeneza PDF…") : t(`Export PDF (${pics.length} pages)`, `Toa PDF (kurasa ${pics.length})`)}
          onPress={exportPdf}
          loading={busy}
        />
      )}
    </Screen>
  );
}
