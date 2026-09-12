import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import Animated, { FadeIn } from "react-native-reanimated";
import type { CV } from "@sumaiya/types";
import { cvToHtml, CV_TEMPLATES, type CvTemplateId } from "../../lib/cv-html";
import { useEntitlements } from "../../lib/entitlements";
import { getDefaultTemplate } from "../../lib/prefs";
import { exportCVAsPDF } from "../../services/pdf-export";
import { shareCV } from "../../services/share";
import { Icon } from "../icon";
import { Button, haptics, useThemeColors } from "../ui";
import { useLang } from "../../lib/i18n";
import { PremiumSheet } from "../premium-sheet";
import { TemplateThumb } from "./template-thumb";

const COLORS = ["#DA4A1C", "#12433D", "#211A15", "#7C3AED", "#B57A18", "#059669"];
const PAGE_W = 794;
const PAGE_RATIO = 1123 / 794;

/**
 * The "your CV is ready" moment, in-app.
 *
 *   L1  a real preview (WebView of the exact print HTML) + template + colour
 *   L2  tap the preview → full-screen, scrollable
 *   L3  "Open the full editor" for everything else
 */
export function CvPreviewCard({
  cv,
  initialColor = "#DA4A1C",
  initialTemplate,
  onOpenEditor,
  onTemplateChange,
  onColorChange,
  onSave,
}: {
  cv: CV;
  initialColor?: string;
  initialTemplate?: CvTemplateId;
  onOpenEditor?: () => void;
  onTemplateChange?: (id: CvTemplateId) => void;
  onColorChange?: (hex: string) => void;
  /** When set, shows a "Save to My CVs" button and calls this with the chosen
   *  template. */
  onSave?: (template: CvTemplateId) => Promise<void> | void;
}) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const insets = useSafeAreaInsets();
  const { premium } = useEntitlements();
  const [color, setColor] = useState(initialColor);
  const [template, setTemplate] = useState<CvTemplateId>(initialTemplate ?? "classic");

  // No explicit template? Fall back to the user's first-run choice.
  useEffect(() => {
    if (initialTemplate) return;
    let alive = true;
    getDefaultTemplate().then((id) => { if (alive) setTemplate(id); });
    return () => { alive = false; };
  }, [initialTemplate]);
  const [full, setFull] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [thumbReady, setThumbReady] = useState(false);
  const [dlError, setDlError] = useState(false);

  const html = useMemo(() => cvToHtml(cv, { accent: color, lang, template }), [cv, color, lang, template]);
  const { width: screenW } = useWindowDimensions();
  const thumbW = Math.min(screenW - 64, 300);
  const thumbH = Math.round(thumbW * PAGE_RATIO);

  const pickTemplate = (id: CvTemplateId, locked: boolean) => {
    haptics.selection();
    if (locked) {
      setShowPremium(true);
      return;
    }
    setTemplate(id);
    onTemplateChange?.(id);
  };

  const download = async () => {
    if (downloading) return;
    setDownloading(true);
    setDlError(false);
    haptics.light();
    try {
      const uri = await exportCVAsPDF(cv, { accent: color, lang, template });
      await shareCV(cv, uri);
      haptics.success();
    } catch {
      haptics.error();
      setDlError(true);
    } finally {
      setDownloading(false);
    }
  };

  const templateRow = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingHorizontal: 2, paddingVertical: 2 }}
    >
      {CV_TEMPLATES.map((tpl) => {
        const locked = tpl.tier === "premium" && !premium;
        const active = template === tpl.id;
        return (
          <Pressable
            key={tpl.id}
            onPress={() => pickTemplate(tpl.id, locked)}
            style={{ alignItems: "center", gap: 5, width: 54, opacity: locked ? 0.7 : 1 }}
          >
            <View
              style={{
                padding: 2,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: active ? c.accent : "transparent",
              }}
            >
              <TemplateThumb id={tpl.id} accent={color} width={46} />
              {locked ? (
                <View
                  style={{
                    position: "absolute",
                    right: 3,
                    top: 3,
                    width: 15,
                    height: 15,
                    borderRadius: 8,
                    backgroundColor: "rgba(0,0,0,0.55)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="lock" size={9} color="#fff" />
                </View>
              ) : null}
            </View>
            <Text
              numberOfLines={1}
              style={{ color: active ? c.accent : c.textMuted, fontSize: 10.5, fontWeight: "700" }}
            >
              {lang === "sw" ? tpl.name.sw : tpl.name.en}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  return (
    <View
      style={{
        backgroundColor: c.bgElevated,
        borderWidth: 1,
        borderColor: c.accent + "3a",
        borderRadius: 18,
        padding: 14,
        gap: 12,
      }}
    >
      {/* preview — a real page thumbnail; the viewport meta in cvToHtml scales
          the 794px page down to fit (no zoom hack, which rendered blank on the
          Android WebView). Tap to open the full-screen view. */}
      <Pressable
        onPress={() => {
          haptics.selection();
          setFull(true);
        }}
        style={{
          width: thumbW,
          height: thumbH,
          alignSelf: "center",
          borderRadius: 10,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: "#fff",
        }}
      >
        <WebView
          originWhitelist={["*"]}
          source={{ html }}
          scrollEnabled={false}
          pointerEvents="none"
          onLoadEnd={() => setThumbReady(true)}
          style={{ width: thumbW, height: thumbH, backgroundColor: "#fff", opacity: thumbReady ? 1 : 0 }}
          androidLayerType="software"
        />
        {!thumbReady ? (
          <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
            <Icon name="loader" size={18} color={c.textMuted} />
          </View>
        ) : null}
        <View
          style={{
            position: "absolute",
            right: 8,
            bottom: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: "rgba(0,0,0,0.55)",
            borderRadius: 999,
            paddingHorizontal: 9,
            paddingVertical: 4,
          }}
        >
          <Icon name="maximize-2" size={11} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 10.5, fontWeight: "700" }}>{t("Tap for full screen", "Gusa kwa skrini kamili")}</Text>
        </View>
      </Pressable>

      {/* template */}
      {templateRow}

      {/* colours */}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 10 }}>
        {COLORS.map((col) => (
          <Pressable
            key={col}
            onPress={() => {
              haptics.selection();
              setColor(col);
              onColorChange?.(col);
            }}
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: col,
              // a hairline ring so a near-black swatch is still visible on the
              // dark sheet; thicker ring marks the active one.
              borderWidth: color === col ? 3 : 1,
              borderColor: color === col ? c.accent : c.border,
              transform: [{ scale: color === col ? 1.15 : 1 }],
            }}
          />
        ))}
      </View>

      {onSave ? (
        <Button
          label={saved ? t("Saved to My CVs", "Imehifadhiwa kwenye CV zangu") : t("Save to My CVs", "Hifadhi kwenye CV zangu")}
          onPress={async () => {
            if (saving || saved) return;
            setSaving(true);
            haptics.light();
            try {
              await onSave(template);
              setSaved(true);
              haptics.success();
            } catch {
              haptics.error();
            } finally {
              setSaving(false);
            }
          }}
          loading={saving}
          disabled={saved}
          leftIcon={<Icon name={saved ? "check" : "save"} size={16} color={c.accentText} />}
        />
      ) : null}
      <Button
        label={t("Download PDF", "Pakua PDF")}
        onPress={download}
        loading={downloading}
        variant={onSave ? "secondary" : "primary"}
        leftIcon={<Icon name="download" size={16} color={onSave ? c.text : c.accentText} />}
      />
      {dlError ? (
        <Text style={{ color: c.error, fontSize: 12.5, textAlign: "center" }}>
          {t("Couldn't make the PDF. Try again.", "Imeshindwa kutengeneza PDF. Jaribu tena.")}
        </Text>
      ) : null}
      {onOpenEditor ? (
        <Pressable onPress={onOpenEditor} style={{ alignSelf: "center", paddingVertical: 6 }}>
          <Text style={{ color: c.accent, fontSize: 13.5, fontWeight: "700" }}>
            {t("Open the full editor", "Fungua kihariri kamili")}
          </Text>
        </Pressable>
      ) : null}

      {/* L3 — full screen */}
      <Modal visible={full} animationType="slide" onRequestClose={() => setFull(false)}>
        <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 }}>
            <Pressable onPress={() => setFull(false)} hitSlop={10} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Icon name="arrow-left" size={20} color={c.text} />
              <Text style={{ color: c.text, fontSize: 15, fontWeight: "700" }}>{t("Back", "Rudi")}</Text>
            </Pressable>
          </View>
          <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>{templateRow}</View>
          <Animated.View entering={FadeIn} style={{ flex: 1, backgroundColor: "#fff" }}>
            <WebView originWhitelist={["*"]} source={{ html }} style={{ flex: 1, backgroundColor: "#fff" }} androidLayerType="software" />
          </Animated.View>
          <View style={{ padding: 16, paddingBottom: insets.bottom + 16 }}>
            <Button
              label={t("Download PDF", "Pakua PDF")}
              onPress={download}
              loading={downloading}
              leftIcon={<Icon name="download" size={16} color={c.accentText} />}
            />
          </View>
        </View>
      </Modal>

      <PremiumSheet visible={showPremium} onClose={() => setShowPremium(false)} feature="templates" />
    </View>
  );
}
