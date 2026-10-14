import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system/legacy";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import type { CV } from "@sumaiya/types";
import { useLang } from "../../lib/i18n";
import { fileNameFromUri, saveToPhone, shouldOfferShare } from "../../services/save-to-device";
import { printPDF, shareCV } from "../../services/share";
import { Icon } from "../icon";
import {
  Button,
  EASE,
  MOTION,
  dialog,
  enterDurationMs,
  exitDurationMs,
  haptics,
  toast,
  useMotionReduced,
  useThemeColors,
} from "../ui";

/**
 * SCREEN 8 — the export / share sheet (Stitch `export_shiriki_modal_sheet`).
 *
 * The design audit's headline finding: this screen did not exist. Guide §5
 * marked it "✓"; the app shipped a button that handed the PDF straight to the
 * OS share sheet (`cv-preview-card.tsx` → `services/share.ts`) with no designed
 * surface at all. This file is that surface, to the mockup's order:
 *
 *   header (close · document title · saved state)
 *   document card (file name · tailored-for · A4 · real size · real language)
 *   four quick-share tiles (WhatsApp · save to phone · email · print)
 *   page-format card (A4 vs US Letter) + attach-cover-letter toggle
 *   privacy block
 *   two pinned CTAs (Share via WhatsApp · Save as PDF to this phone)
 *
 * WHERE THE DESIGN AND THE TRUTH DISAGREE, THIS FILE SIDES WITH THE TRUTH:
 *
 *   • The mockup's privacy sentence claims no data "inayotumwa kwa seva" (is
 *     sent to a server). That is false — the app reports the export, and the
 *     CV itself syncs. PRIVACY_NOTICE says only what actually happens.
 *   • The mockup's WhatsApp tile promises a message "moja kwa moja kwa mwajiri
 *     au namba binafsi" (straight to an employer or a number). There is no
 *     direct-to-number path anywhere in the app; the tile opens the OS share
 *     list, where WhatsApp is the first choice, and its sub-line says so.
 *   • The mockup's hard-coded size and readiness badges are decorations. Here
 *     they are the real byte size of the file being exported (read with
 *     expo-file-system) and the A4 size the print call actually pins.
 *   • The mockup's US Letter option and its "combine CV + letter into one file"
 *     toggle are capabilities this app does not have (A4 is enforced in
 *     `pdf-export.ts`; there is no PDF merge on the native side — no pdf-lib).
 *     Both ship VISIBLY UNAVAILABLE, each with its reason printed beside it,
 *     rather than switching on and doing nothing.
 */

// ── Geometry, straight from the mockup ───────────────────────────────────────
export const SHEET = {
  /**
   * Top-corner radius. `code.html:28` draws the sheet `rounded-t-[32px]`; 32 is
   * also what the sibling paywall sheet was corrected to. (The brief that
   * commissioned this file said "20px"; the mockup and the sibling sheet both
   * say 32, and the guide's "softer card radii" points the same way, so 32 it
   * is — recorded here so it is a decision and not drift.)
   */
  radius: 32,
  /** Side padding — the mockup's gutter, and this app's own sheet convention. */
  padding: 20,
  /** The grab bar: `w-9` wide × 5 dp, per the screen-7 correction ("36 × 5"). */
  gripWidth: 36,
  gripHeight: 5,
  /** Nothing interactive is ever smaller than this (guide §8). */
  tapMin: 44,
} as const;

/** How far the sheet travels on entry. Local because no sheet token exists yet. */
const SHEET_TRAVEL = 360;

// ── Copy and data tables ─────────────────────────────────────────────────────
export interface CopyPair {
  en: string;
  sw: string;
}

export interface QuickShareTile {
  id: "whatsapp" | "save" | "email" | "print";
  icon: string;
  label: CopyPair;
  /** What tapping it ACTUALLY does — never the mockup's larger claim. */
  sub: CopyPair;
  recommended?: boolean;
}

/**
 * The four tiles, each wired to a real service in the component:
 *   whatsapp / email → shareCV  (the OS share list, WhatsApp and mail apps first)
 *   save             → saveToPhone (the Storage Access Framework folder picker)
 *   print            → printPDF  (expo-print's system print window)
 */
export const QUICK_SHARE_TILES: QuickShareTile[] = [
  {
    id: "whatsapp",
    icon: "message-circle",
    label: { en: "Send on WhatsApp", sw: "Tuma WhatsApp" },
    // The mockup says "straight to an employer or a personal number". We cannot
    // do that — there is no WhatsApp deep-link — so the sub-line disclaims it.
    sub: {
      en: "Opens the share list — pick WhatsApp.",
      sw: "Inafungua orodha ya kushiriki — chagua WhatsApp.",
    },
    recommended: true,
  },
  {
    id: "save",
    icon: "download",
    label: { en: "Save to phone", sw: "Pakua kwenye Simu" },
    sub: {
      en: "Pick a folder; the file is saved there.",
      sw: "Chagua folda; faili huhifadhiwa humo.",
    },
  },
  {
    id: "email",
    icon: "mail",
    label: { en: "Send by email", sw: "Tuma kwa Email" },
    sub: {
      en: "Opens the share list — pick your email app.",
      sw: "Inafungua orodha ya kushiriki — chagua barua pepe yako.",
    },
  },
  {
    id: "print",
    icon: "printer",
    label: { en: "Print", sw: "Chapisha Stationery" },
    sub: {
      en: "Opens your phone's print window.",
      sw: "Inafungua kidirisha cha kuchapisha cha simu.",
    },
  },
];

export interface PageFormatOption {
  id: "a4" | "letter";
  label: CopyPair;
  available: boolean;
  /** Printed beside a format that is NOT offered (the app's E5 rule). */
  reason: CopyPair | null;
}

/**
 * A4 only. The mockup offers US Letter; `pdf-export.ts` pins A4 on every print
 * call precisely because expo-print otherwise defaults to Letter (67 CSS px
 * shorter than the 794×1123 page every document is authored at), and
 * `pdf-export.test.ts` guards it. So the Letter option is present — the design
 * asked for it — and visibly unavailable, with its reason.
 */
export const PAGE_FORMATS: PageFormatOption[] = [
  {
    id: "a4",
    label: { en: "A4 (Tanzania standard)", sw: "A4 (Viwango vya Tanzania)" },
    available: true,
    reason: null,
  },
  {
    id: "letter",
    label: { en: "US Letter", sw: "US Letter" },
    available: false,
    reason: {
      en: "Not offered — every document prints A4.",
      sw: "Haitolewi — kila hati huchapishwa A4.",
    },
  },
];

/**
 * The mockup's toggle promises to merge the CV and the cover letter into one
 * file. The native app cannot: it prints one document per call and has no PDF
 * merge (pdf-lib lives only in the web app). So the control ships disabled with
 * its reason, per the repo's E5 rule — a control may be disabled only with the
 * reason printed beside it.
 */
export const COVER_LETTER_TOGGLE = {
  label: { en: "Attach the cover letter", sw: "Ambatisha barua ya maombi" },
  sub: {
    en: "Combine the CV and the letter into one file",
    sw: "Unganisha CV na barua kuwa faili moja",
  },
  available: false,
  reason: {
    en: "Not available yet — each document is saved on its own.",
    sw: "Haipatikani bado — kila hati huhifadhiwa yenyewe.",
  },
} as const;

/**
 * The honest privacy sentence. The mockup claims the app needs no account and
 * sends no data to a server; the first half is false for a signed-in user and
 * the second is false outright (the export is reported to keep the assistant's
 * library in sync). What IS true: the PDF is built on the phone, the file is
 * never uploaded by this step, and sharing hands a copy to whichever app the
 * user picks. That is what this says.
 */
export const PRIVACY_NOTICE = {
  heading: { en: "Privacy (this device only)", sw: "Ulinzi wa Faragha (Kifaa Chako Tu)" },
  body: {
    en: "The PDF is made on this phone. This step never uploads the file to a server — Sumaiya records only that a document was exported, not what is in it. Sharing sends a copy to the app you choose.",
    sw: "PDF inatengenezwa kwenye simu hii. Hatua hii haipaki faili kwenye seva — Sumaiya huripoti tu kwamba hati ilipakuliwa, wala maudhui yake. Kuishiriki kunatuma nakala kwenye programu unayoichagua.",
  },
} as const;

// ── Pure helpers (unit-tested) ───────────────────────────────────────────────

/** The real size of the exported file, or null when it cannot be read. */
export function formatFileSize(bytes: number | null | undefined): string | null {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return null;
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * The language badge. The mockup prints a single badge naming both languages,
 * which is not true of a document rendered in one (the export is rendered with
 * the user's chosen `lang`). This names the language the file is actually
 * written in.
 */
export function documentLanguageBadge(docLang: "en" | "sw"): CopyPair {
  return docLang === "sw"
    ? { en: "Kiswahili", sw: "Kiswahili" }
    : { en: "English", sw: "Kiingereza" };
}

export interface TailoredFor {
  title: string;
  company?: string | null;
}

/**
 * The "tailored for" line. The mockup hard-codes a job; we only say what we
 * know — the real job when the caller has one, otherwise the CV's own headline
 * (a real field), otherwise plainly that this CV was not built for an advert.
 */
export function tailoredLine(
  tailoredFor: TailoredFor | null | undefined,
  headline: string | null | undefined,
): CopyPair {
  const title = (tailoredFor?.title ?? "").trim();
  if (title) {
    const job = [(tailoredFor?.company ?? "").trim(), title].filter(Boolean).join(" ");
    return { en: `Tailored for ${job}`, sw: `Imehaririwa kwa ${job}` };
  }
  const own = (headline ?? "").trim();
  if (own) return { en: own, sw: own };
  return { en: "Not tailored to a specific advert", sw: "Haijalengwa kwa tangazo la kazi maalum" };
}

// ── The sheet ────────────────────────────────────────────────────────────────
export function ExportSheet({
  visible,
  onClose,
  cv,
  pdfUri,
  docLang,
  tailoredFor,
  documentSaved = false,
}: {
  visible: boolean;
  onClose: () => void;
  cv: CV;
  /** The already-printed PDF this sheet acts on. */
  pdfUri: string;
  /** The language the PDF was rendered in — so the badge tells the truth. */
  docLang: "en" | "sw";
  /** The job this CV was tailored for, when the caller knows it. */
  tailoredFor?: TailoredFor | null;
  /** True only when the CV is genuinely in the user's library — the header
   *  shows the "saved" chip only for that, never as decoration. */
  documentSaved?: boolean;
}) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduce = useMotionReduced();

  const progress = useSharedValue(0);
  const [mounted, setMounted] = useState(visible);
  const [busy, setBusy] = useState<string | null>(null);
  /** Real byte size of `pdfUri`, read from the filesystem. Null until known. */
  const [sizeBytes, setSizeBytes] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, {
        duration: enterDurationMs(reduce, MOTION.dur.slow),
        easing: EASE.out,
      });
    } else if (mounted) {
      progress.value = withTiming(
        0,
        { duration: exitDurationMs(reduce, MOTION.dur.fast), easing: EASE.in },
        (done) => {
          if (done) runOnJS(setMounted)(false);
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Read the file's real size. The size the design shows is decorative;
  // this reads the actual bytes, and when the read fails the badge says the
  // size is unknown rather than inventing one.
  useEffect(() => {
    if (!visible || !pdfUri) return;
    let alive = true;
    setSizeBytes(null);
    FileSystem.getInfoAsync(pdfUri)
      .then((info) => {
        const size = (info as { size?: number }).size;
        if (alive && typeof size === "number") setSizeBytes(size);
      })
      .catch(() => {
        /* size stays unknown — the badge is honest about it */
      });
    return () => {
      alive = false;
    };
  }, [visible, pdfUri]);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheet = useAnimatedStyle(() => ({
    opacity: 0.4 + progress.value * 0.6,
    transform: [{ translateY: (1 - progress.value) * SHEET_TRAVEL }],
  }));

  if (!mounted) return null;

  const fileName = pdfUri ? fileNameFromUri(pdfUri) : t("Your CV", "CV yako");
  const sizeLabel = formatFileSize(sizeBytes);
  const badge = documentLanguageBadge(docLang);
  const tailored = tailoredLine(tailoredFor, cv.data?.personalInfo?.headline);
  const docTitle = (cv.title || "").trim() || t("Your CV", "CV yako");

  const doShare = async (tag: string) => {
    if (busy) return;
    setBusy(tag);
    haptics.light();
    try {
      // shareCV owns its own bilingual failure dialogs; it does not throw.
      await shareCV(cv, pdfUri);
    } catch {
      haptics.error();
    } finally {
      setBusy(null);
    }
  };

  const doSave = async (tag: string) => {
    if (busy) return;
    setBusy(tag);
    haptics.light();
    try {
      const outcome = await saveToPhone(pdfUri, fileName);
      if (outcome.status === "saved") {
        haptics.success();
        toast.show(
          t(
            `Saved to your phone as ${fileName}`,
            `Imehifadhiwa kwenye simu yako kama ${fileName}`,
          ),
        );
        return;
      }
      if (shouldOfferShare(outcome)) {
        // Either the folder picker was dismissed or this platform has no SAF.
        // Both cases end at the system share sheet — the platform's own save
        // path — which is the honest next step rather than silence
        // (services/save-to-device.ts's shouldOfferShare exists for exactly
        // this). It also keeps the OS-share fallback working.
        await shareCV(cv, pdfUri);
        return;
      }
    } catch {
      haptics.error();
      dialog.alert(
        t("The file wasn't saved", "Faili halikuhifadhiwa"),
        t(
          "Copying the PDF into your folder did not finish. Try again, or share it directly and save it from there.",
          "Kunakili PDF kwenye folda yako hakukukamilika. Jaribu tena, au ishiriki moja kwa moja na uihifadhi kutoka hapo.",
        ),
      );
    } finally {
      setBusy(null);
    }
  };

  const doPrint = async (tag: string) => {
    if (busy) return;
    setBusy(tag);
    haptics.light();
    try {
      // printPDF owns its own bilingual failure dialog; it does not throw.
      await printPDF(pdfUri);
    } catch {
      haptics.error();
    } finally {
      setBusy(null);
    }
  };

  const runTile = (id: QuickShareTile["id"]) => {
    if (id === "save") return doSave("tile-save");
    if (id === "print") return doPrint("tile-print");
    if (id === "email") return doShare("tile-email");
    return doShare("tile-whatsapp");
  };

  const reasonStyle = { color: c.textMuted, fontSize: 11.5, lineHeight: 16 };
  const cardStyle = {
    backgroundColor: c.bgElevated,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
  } as const;

  return (
    <Modal transparent visible={mounted} onRequestClose={onClose} animationType="none" statusBarTranslucent>
      <View style={{ width, height }}>
        <Pressable
          style={{ flex: 1 }}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t("Close", "Funga")}
        >
          <Animated.View style={[backdrop, { flex: 1, backgroundColor: c.overlay }]} />
        </Pressable>

        <Animated.View
          accessibilityViewIsModal
          style={[
            sheet,
            {
              // Explicit width + absolute pin: a Reanimated Animated.View in a
              // Modal collapses its flex children to zero width on Fabric
              // (the same fix the paywall sheet carries).
              position: "absolute",
              bottom: 0,
              left: 0,
              width,
              maxHeight: Math.min(height - insets.top - 24, 813),
              backgroundColor: c.bg,
              borderTopLeftRadius: SHEET.radius,
              borderTopRightRadius: SHEET.radius,
              paddingTop: 10,
              paddingBottom: insets.bottom + 16,
              paddingLeft: SHEET.padding + insets.left,
              paddingRight: SHEET.padding + insets.right,
              borderTopWidth: 1,
              borderColor: c.border,
              overflow: "hidden",
            },
          ]}
        >
          {/* Grab bar — 36 × 5 (code.html:31, corrected for screen 7). */}
          <View
            style={{
              alignSelf: "center",
              width: SHEET.gripWidth,
              height: SHEET.gripHeight,
              borderRadius: SHEET.gripHeight / 2,
              backgroundColor: c.borderStrong,
              marginBottom: 14,
            }}
          />

          {/* ── Header: close · document title · saved state ─────────────── */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
            <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
              <Text
                style={{ color: c.accent, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" }}
              >
                {t("Work document", "Hati ya Kazi")} · {docTitle}
              </Text>
              <Text style={{ color: c.text, fontSize: 20, fontWeight: "800", lineHeight: 25 }}>
                {t("Download & share the document", "Pakua na shiriki hati")}
              </Text>
              {documentSaved ? (
                <View
                  accessibilityRole="text"
                  accessibilityLabel={t("Saved", "Imehifadhiwa")}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    alignSelf: "flex-start",
                    marginTop: 4,
                    paddingHorizontal: 9,
                    paddingVertical: 3,
                    borderRadius: 999,
                    backgroundColor: c.successTint,
                  }}
                >
                  <Icon name="check-circle" size={12} color={c.success} />
                  <Text style={{ color: c.success, fontSize: 11.5, fontWeight: "700" }}>
                    {t("Saved", "Imehifadhiwa")}
                  </Text>
                </View>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t("Close", "Funga")}
              hitSlop={10}
              style={{
                width: SHEET.tapMin,
                height: SHEET.tapMin,
                borderRadius: SHEET.tapMin / 2,
                backgroundColor: c.bgSunken,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="x" size={18} color={c.textMuted} />
            </Pressable>
          </View>

          {/* ── Scrollable content ───────────────────────────────────────── */}
          <ScrollView
            // flexShrink so the scroll region yields to the pinned CTAs instead
            // of pushing them out of the sheet when the content (or 200% text)
            // is taller than the sheet's max height.
            style={{ flexShrink: 1, marginTop: 14 }}
            contentContainerStyle={{ gap: 14, paddingBottom: 14 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Document card: mini A4 thumbnail + file facts */}
            <View style={[cardStyle, { flexDirection: "row", gap: 12, padding: 12 }]}>
              <View
                style={{
                  width: 56,
                  height: Math.round(56 * (297 / 210)),
                  borderRadius: 4,
                  backgroundColor: c.bg,
                  borderWidth: 1,
                  borderColor: c.border,
                  padding: 7,
                  justifyContent: "space-between",
                }}
              >
                <View style={{ gap: 4 }}>
                  <View style={{ height: 5, width: "60%", borderRadius: 3, backgroundColor: c.accent }} />
                  <View style={{ height: 3, width: "85%", borderRadius: 2, backgroundColor: c.border }} />
                  <View style={{ height: 3, width: "70%", borderRadius: 2, backgroundColor: c.border }} />
                  <View style={{ height: 3, width: "90%", borderRadius: 2, backgroundColor: c.border }} />
                  <View style={{ height: 3, width: "78%", borderRadius: 2, backgroundColor: c.border }} />
                </View>
                <Text style={{ color: c.textMuted, fontSize: 8, fontWeight: "700" }}>A4</Text>
              </View>

              <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Icon name="file-text" size={14} color={c.accent} />
                  <Text numberOfLines={2} style={{ flex: 1, color: c.text, fontSize: 14, fontWeight: "700" }}>
                    {fileName}
                  </Text>
                </View>
                <Text numberOfLines={2} style={{ color: c.textMuted, fontSize: 12, lineHeight: 16 }}>
                  {t(tailored.en, tailored.sw)}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 3 }}>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: c.bgSunken }}>
                    <Text style={{ color: c.text, fontSize: 11, fontWeight: "700" }}>{t("A4 ready", "A4 Tayari")}</Text>
                  </View>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: c.bgSunken }}>
                    <Text style={{ color: c.text, fontSize: 11, fontWeight: "700" }}>
                      {sizeLabel ?? t("Size unknown", "Ukubwa haujulikani")}
                    </Text>
                  </View>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: c.accentTint }}>
                    <Text style={{ color: c.accent, fontSize: 11, fontWeight: "700" }}>{t(badge.en, badge.sw)}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick-share grid */}
            <View style={{ gap: 8 }}>
              <Text
                style={{ color: c.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 1.1, textTransform: "uppercase" }}
              >
                {t("Quick share (send it right away)", "Chaguzi za haraka (shiriki papo hapo)")}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {QUICK_SHARE_TILES.map((tile) => {
                  const on = busy === `tile-${tile.id}`;
                  const label = t(tile.label.en, tile.label.sw);
                  const sub = t(tile.sub.en, tile.sub.sw);
                  return (
                    <Pressable
                      key={tile.id}
                      onPress={() => runTile(tile.id)}
                      disabled={!!busy}
                      accessibilityRole="button"
                      accessibilityLabel={`${label}. ${sub}`}
                      accessibilityState={{ disabled: !!busy, busy: on }}
                      style={{
                        flexBasis: "46%",
                        flexGrow: 1,
                        minHeight: SHEET.tapMin,
                        gap: 8,
                        padding: 12,
                        borderRadius: 14,
                        backgroundColor: c.bgElevated,
                        borderWidth: 1,
                        borderColor: c.border,
                        opacity: busy && !on ? 0.6 : 1,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: c.accentTint,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon name={on ? "loader" : tile.icon} size={18} color={c.accent} />
                        </View>
                        {tile.recommended ? (
                          <Text
                            style={{
                              color: c.success,
                              fontSize: 9.5,
                              fontWeight: "800",
                              letterSpacing: 0.6,
                              textTransform: "uppercase",
                            }}
                          >
                            {t("Recommended", "Inapendekezwa")}
                          </Text>
                        ) : null}
                      </View>
                      <View style={{ gap: 2 }}>
                        <Text style={{ color: c.text, fontSize: 13.5, fontWeight: "800" }}>{label}</Text>
                        <Text style={{ color: c.textMuted, fontSize: 11.5, lineHeight: 15 }}>{sub}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Page format + attach-cover-letter */}
            <View style={[cardStyle, { padding: 14, gap: 10 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ color: c.text, fontSize: 14, fontWeight: "700" }}>
                  {t("Page format", "Muundo wa Ukurasa")}
                </Text>
                <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" }}>
                  {t("Standard size", "Kiwango rasmi")}
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 6, backgroundColor: c.bgSunken, borderRadius: 10, padding: 4 }}>
                {PAGE_FORMATS.map((f) => (
                  <View
                    key={f.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: f.available, disabled: !f.available }}
                    accessibilityLabel={t(f.label.en, f.label.sw)}
                    style={{
                      flex: 1,
                      minHeight: SHEET.tapMin,
                      paddingVertical: 10,
                      paddingHorizontal: 10,
                      borderRadius: 8,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: f.available ? c.bgElevated : "transparent",
                      borderWidth: f.available ? 1 : 0,
                      borderColor: c.border,
                    }}
                  >
                    <Text
                      style={{
                        color: f.available ? c.text : c.textMuted,
                        fontSize: 12,
                        fontWeight: f.available ? "800" : "600",
                        textAlign: "center",
                      }}
                    >
                      {t(f.label.en, f.label.sw)}
                    </Text>
                  </View>
                ))}
              </View>
              {PAGE_FORMATS.filter((f) => !f.available && f.reason).map((f) => (
                <Text key={f.id} style={reasonStyle}>
                  {t(`${f.label.en}: `, `${f.label.sw}: `)}
                  {t(f.reason!.en, f.reason!.sw)}
                </Text>
              ))}

              <View style={{ height: 1, backgroundColor: c.border }} />

              {/* Attach-cover-letter toggle — visibly unavailable, with reason */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: SHEET.tapMin }}>
                <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                  <Text style={{ color: c.text, fontSize: 14, fontWeight: "700" }}>
                    {t(COVER_LETTER_TOGGLE.label.en, COVER_LETTER_TOGGLE.label.sw)}
                  </Text>
                  <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 16 }}>
                    {t(COVER_LETTER_TOGGLE.sub.en, COVER_LETTER_TOGGLE.sub.sw)}
                  </Text>
                </View>
                <View
                  accessibilityRole="switch"
                  accessibilityState={{ disabled: true, checked: false }}
                  accessibilityLabel={t(COVER_LETTER_TOGGLE.label.en, COVER_LETTER_TOGGLE.label.sw)}
                  style={{
                    width: 48,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: c.bgSunken,
                    borderWidth: 1,
                    borderColor: c.border,
                    justifyContent: "center",
                    paddingHorizontal: 2,
                    opacity: 0.55,
                  }}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c.borderStrong }} />
                </View>
              </View>
              <Text style={reasonStyle}>{t(COVER_LETTER_TOGGLE.reason.en, COVER_LETTER_TOGGLE.reason.sw)}</Text>
            </View>

            {/* Privacy block */}
            <View style={{ flexDirection: "row", gap: 10, backgroundColor: c.bgSunken, borderRadius: 14, padding: 14 }}>
              <Icon name="shield-check" size={18} color={c.success} />
              <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
                <Text style={{ color: c.text, fontSize: 13.5, fontWeight: "700" }}>
                  {t(PRIVACY_NOTICE.heading.en, PRIVACY_NOTICE.heading.sw)}
                </Text>
                <Text style={{ color: c.textBody, fontSize: 12.5, lineHeight: 18 }}>
                  {t(PRIVACY_NOTICE.body.en, PRIVACY_NOTICE.body.sw)}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* ── Pinned CTAs ─────────────────────────────────────────────── */}
          <View style={{ gap: 10, paddingTop: 8 }}>
            <Button
              label={t("Share via WhatsApp", "Shiriki kupitia WhatsApp")}
              sublabel={t(
                "Opens the share list — pick WhatsApp.",
                "Inafungua orodha ya kushiriki — chagua WhatsApp.",
              )}
              loading={busy === "cta-share"}
              disabled={!!busy}
              onPress={() => doShare("cta-share")}
              leftIcon={<Icon name="share" size={16} color={c.accentText} />}
            />
            <Button
              label={t("Save as PDF to this phone", "Hifadhi kama PDF kwenye Simu")}
              variant="secondary"
              loading={busy === "cta-save"}
              disabled={!!busy}
              onPress={() => doSave("cta-save")}
              leftIcon={<Icon name="file-down" size={16} color={c.text} />}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
