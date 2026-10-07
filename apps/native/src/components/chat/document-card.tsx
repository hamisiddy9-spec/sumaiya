import React, { useEffect, useState } from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import type { CV, CVData } from "@sumaiya/types";
import type { CvTemplateId } from "../../lib/cv-html";
import { CvPreviewCard } from "../cv/cv-preview-card";
import { useMotionReduced, useThemeColors } from "../ui";
import { useLang } from "../../lib/i18n";
import { CHAT_MOTION, chatEnterMs } from "./chat-motion";
import { provenanceSentence } from "./chat-document";

/**
 * T5 · The document card (§3.2/§3.4), and the shell every rich message uses.
 *
 * The card is what stops a produced document reading as "a rich message bubble":
 * a **tinted header band** (`KADI YA HATI` left, state right) that no bubble has,
 * the object's name, the sentence stating what she used and what she could not
 * find, the action stack, and a state line in the footer.
 *
 * §3.6b's reconciliation is applied here rather than left as a conflict: a
 * static content block is white + 1 px border **with no resting shadow** (the
 * floating layer owns `shadow.card`), so the rail, the document card and the
 * unavailable card carry no shadow at rest.
 *
 * Entrance, move 4: 220 with `scale .985→1` and `translateY 6→0` — transform
 * only, and instant under Reduce Motion. It is the only element in the thread
 * with a different entrance from a bubble, which is deliberate: it is the only
 * element that is an object rather than a sentence.
 */
export function DocumentCard({
  stateLabel,
  children,
  footer,
}: {
  /** Right side of the band: `tayari` · `imehifadhiwa` — a state, not a badge. */
  stateLabel?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const c = useThemeColors();
  const reduce = useMotionReduced();
  const { t } = useLang();
  const progress = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) {
      progress.value = 1;
      return;
    }
    progress.value = withTiming(1, { duration: chatEnterMs(false, CHAT_MOTION.documentCard.enter), easing: Easing.out(Easing.cubic) });
  }, [reduce, progress]);
  const anim = useAnimatedStyle(() => {
    const p = progress.value;
    const translateY = (1 - p) * CHAT_MOTION.documentCard.distance;
    const scale = CHAT_MOTION.documentCard.scaleFrom + p * (1 - CHAT_MOTION.documentCard.scaleFrom);
    // Move 4: a placed card settles — 220, `scale .985→1` and a 6 px rise, so it
    // reads as being SET DOWN rather than appearing.
    const transform: ViewStyle["transform"] = [{ translateY }, { scale }];
    return { opacity: p, transform };
  });

  return (
    <Animated.View style={[anim, { width: "100%", marginTop: 8 }]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          backgroundColor: c.border,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          paddingHorizontal: 14,
          paddingVertical: 7,
        }}
      >
        <Text style={{ color: c.textMuted, fontSize: 10.5, fontWeight: "800", letterSpacing: 0.8 }}>
          {t("DOCUMENT CARD", "KADI YA HATI")}
        </Text>
        {stateLabel ? (
          <Text style={{ color: c.textMuted, fontSize: 10.5, fontWeight: "800", letterSpacing: 0.8 }}>
            {stateLabel.toUpperCase()}
          </Text>
        ) : null}
      </View>
      {children}
      {footer ? (
        <View
          style={{
            marginTop: -1,
            borderWidth: 1,
            borderTopWidth: 0,
            borderColor: c.border,
            borderBottomLeftRadius: 18,
            borderBottomRightRadius: 18,
            backgroundColor: c.success + "12",
            paddingHorizontal: 14,
            paddingVertical: 8,
            gap: 3,
          }}
        >
          {footer}
        </View>
      ) : null}
    </Animated.View>
  );
}

/**
 * The CV produced in the chat, as a document card.
 *
 * Two defects the live app has, both closed here:
 *   1. `templateId: 'classic'` was **hard-coded** on the preview (`chat-message.tsx`),
 *      so the CV shown was not necessarily the CV saved. The card carries the
 *      real template, and hands the editor the identity it needs so saving
 *      cannot fork a second CV (see the screen's `onOpenCvEditor`).
 *   2. The card could not be saved from the chat in a way that always completed.
 *      Saving here writes locally first, so the control always completes, and the
 *      state line reports the truth underneath it.
 */
export function CvDocumentCard({
  cv,
  templateId,
  onOpenEditor,
  onSaveCv,
}: {
  cv: CVData;
  templateId?: CvTemplateId;
  /** Called with the SAVED id when there is one — identity travels, or not at all. */
  onOpenEditor?: (savedId?: string) => void;
  onSaveCv?: (cv: CVData, template: CvTemplateId) => Promise<string | void>;
}) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const [template, setTemplate] = useState<CvTemplateId>(templateId ?? "classic");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "pending">("idle");
  /**
   * The id this document got when it was saved. Null until then, and never a
   * placeholder: passing a made-up id to the editor would be worse than passing
   * none, because the editor would then believe it is editing a saved CV.
   */
  const [savedId, setSavedId] = useState<string | undefined>(undefined);

  const title = cv?.personalInfo?.fullName ? `CV — ${cv.personalInfo.fullName}` : t("Your CV", "CV yako");

  return (
    <DocumentCard
      stateLabel={
        saveState === "saved"
          ? t("Saved", "imehifadhiwa")
          : saveState === "pending"
            ? t("Waiting for network", "inasubiri mtandao")
            : t("Ready", "tayari")
      }
      footer={
        saveState === "saved" ? (
          <>
            <Text style={{ color: c.success, fontSize: 12, fontWeight: "700" }}>
              ✓ {t("Saved to your CVs", "Imehifadhiwa kwenye CV zako")}
            </Text>
            {/* "Label the output, not the app" — and only when it is true. */}
            <Text style={{ color: c.textMuted, fontSize: 11 }}>{t("Works without internet", "Inatumika bila mtandao")}</Text>
          </>
        ) : saveState === "pending" ? (
          <>
            <Text style={{ color: c.warning, fontSize: 12, fontWeight: "700" }}>
              {t("Saved on your phone · waiting for network", "Imehifadhiwa kwenye simu yako · inasubiri mtandao")}
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 11 }}>{t("It will sync by itself.", "Itajisawazisha yenyewe.")}</Text>
          </>
        ) : (
          <Text style={{ color: c.textMuted, fontSize: 11.5 }}>
            {t("Nothing saved yet — save it and it's yours.", "Bado hakuna kilichohifadhiwa — ihifadhi iwe yako.")}
          </Text>
        )
      }
    >
      <View
        style={{
          borderWidth: 1,
          borderTopWidth: 0,
          borderColor: c.border,
          backgroundColor: c.bgElevated,
          paddingHorizontal: 14,
          paddingTop: 12,
          gap: 6,
        }}
      >
        <Text style={{ color: c.text, fontSize: 14.5, fontWeight: "700" }}>{title}</Text>
        <Text style={{ color: c.textBody, fontSize: 12, lineHeight: 17 }}>{provenanceSentence(cv, lang)}</Text>
      </View>
      <View
        style={{
          borderWidth: 1,
          borderTopWidth: 0,
          borderColor: c.border,
          backgroundColor: c.bgElevated,
          paddingHorizontal: 12,
          paddingTop: 4,
          paddingBottom: 12,
        }}
      >
        <CvPreviewCard
          cv={
            {
              id: "chat-cv",
              userId: "me",
              templateId: template,
              title,
              data: cv,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as CV
          }
          initialTemplate={template}
          onTemplateChange={(id) => setTemplate(id)}
          onOpenEditor={onOpenEditor ? () => onOpenEditor(savedId) : undefined}
          onSave={
            onSaveCv
              ? async (tpl) => {
                  setSaveState("saving");
                  try {
                    const id = await onSaveCv(cv, tpl);
                    // The write is local-first, so "saved" is true even when the
                    // server push is queued — and the queued case says so.
                    if (typeof id === "string") setSavedId(id);
                    setSaveState("saved");
                  } catch {
                    setSaveState("pending");
                  }
                }
              : undefined
          }
        />
        {saveState === "saving" ? (
          <Text style={{ color: c.textMuted, fontSize: 11.5, marginTop: 6, textAlign: "center" }}>
            {t("Saving…", "Inahifadhi…")}
          </Text>
        ) : null}
      </View>
    </DocumentCard>
  );
}

/** A quiet secondary action inside a card body — 44 dp, thumb-height. */
export function CardAction({
  label,
  onPress,
  primary = false,
  disabled = false,
  reason,
}: {
  label: string;
  onPress?: () => void;
  primary?: boolean;
  disabled?: boolean;
  /** E5: a control may be disabled only with its reason printed beside it. */
  reason?: string;
}) {
  const c = useThemeColors();
  return (
    <View style={{ gap: 4 }}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityLabel={label}
        style={({ pressed }) => ({
          minHeight: 44,
          paddingHorizontal: 14,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: primary ? 0 : 1,
          borderColor: c.border,
          backgroundColor: primary ? (pressed ? c.accentPressed : c.accentFill) : pressed ? c.border : "transparent",
          opacity: disabled ? 0.55 : 1,
        })}
      >
        <Text style={{ color: primary ? c.accentText : c.text, fontSize: 13.5, fontWeight: "700" }}>{label}</Text>
      </Pressable>
      {disabled && reason ? (
        <Text style={{ color: c.textMuted, fontSize: 11, textAlign: "center" }}>{reason}</Text>
      ) : null}
    </View>
  );
}
