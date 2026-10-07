import React, { useEffect } from "react";
import { Image, Pressable, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import type { CVData } from "@sumaiya/types";
import { SkillGapCard } from "./skill-gap-card";
import { LearningResources } from "./learning-resources";
import { DocumentCard, CvDocumentCard } from "./document-card";
import { TurnErrorCard } from "./turn-error-card";
import type { CvTemplateId } from "../../lib/cv-html";
import type { ChatMessage, ActionType, Attachment } from "./chat-types";
import { Icon } from "../icon";
import { SumaiyaMark } from "../sumaiya-mark";
import { useMotionReduced } from "../ui/motion";
import { useThemeColors } from "../ui/theme";
import { useLang } from "../../lib/i18n";
import { CHAT_MOTION, chatEnterMs, chatStaggerDelayMs } from "./chat-motion";

interface Props {
  message: ChatMessage;
  onActionPress?: (action: ActionType, data?: Record<string, any>) => void;
  onPreviewAttachment?: (a: Attachment) => void;
  /**
   * Identity travels with the handoff (§3.4 step 2): the template always, and
   * the CV's id when it has one. A chat-built document has no id until it is
   * saved, so the id is passed only when it is real.
   */
  onOpenCvEditor?: (cv: CVData, templateId?: CvTemplateId, cvId?: string) => void;
  onSaveCv?: (cv: CVData, template: CvTemplateId) => Promise<string | void>;
  loading?: boolean;
  /**
   * True on the first bubble of a run of consecutive Sumaiya turns. Her name
   * appears once per run, not once per bubble (T2) — her replies arrive staged
   * 550 ms apart and announcing each one would be a stutter.
   */
  showAttribution?: boolean;
  /** The user's delivery word for this turn (T1). */
  delivery?: "sending" | "sent" | "failed";
  /** The turn failed — the error card hangs off it (T7). */
  onRetry?: () => void;
  retryBusy?: boolean;
  onWriteYourself?: () => void;
  /** Position in the run, for the capped stagger (move 2). */
  index?: number;
}

/** T2's attribution row: a 16 dp mark + `SUMAIYA`. */
function AttributionRow() {
  const c = useThemeColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 7, paddingLeft: 2 }}>
      <SumaiyaMark size={16} color={c.accent} state="static" />
      <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 0.8 }}>SUMAIYA</Text>
    </View>
  );
}

/**
 * T1 · the user's own turn (right, ember fill, radius 18/4) and
 * T2 · Sumaiya's (left, white, 1 px border, radius 18/4).
 *
 * T1 carries the one delivery word the redesign adds (`Inatuma…` · `Imetumwa` ·
 * `Haijatumwa`) — the cheapest possible receipt, and the difference between
 * "did that go?" and knowing. **The words are never removed on failure**: the
 * bubble stays exactly where it is and gains an outline (move 16's sibling rule),
 * because the alternative is a user who pays to type it again.
 *
 * T2 carries the attribution row once per run, and the rich content lives inside
 * the document-card shell so all of it has one visual grammar.
 *
 * Motion (moves 1–2, 16): a Sumaiya bubble enters at 300 `ease.out` with a rise
 * of 12 and a capped stagger of `30 + min(i,3)×40`; the user's own turn has **no
 * entrance at all** — their finger produced it. All of it instant under Reduce
 * Motion, and all of it `opacity + translateY` on one node, which is the cheapest
 * thing a low-end GPU can composite.
 */
export function ChatMessageComponent({
  message,
  onActionPress,
  onPreviewAttachment,
  onOpenCvEditor,
  onSaveCv,
  loading = false,
  showAttribution = false,
  delivery,
  onRetry,
  retryBusy = false,
  onWriteYourself,
  index = 0,
}: Props) {
  const c = useThemeColors();
  const { t } = useLang();
  const reduce = useMotionReduced();
  const isUser = message.author === "user";

  const bubbleBg = isUser ? c.accentFill : c.bgElevated;
  const textColor = isUser ? c.accentText : c.text;

  // Move 3: no entrance for the user's own turn. Move 1+2: 300 with a capped
  // stagger for hers.
  const v = useSharedValue(isUser || reduce ? 1 : 0);
  useEffect(() => {
    if (isUser || reduce) {
      v.value = 1;
      return;
    }
    v.value = 0;
    v.value = withDelay(
      chatStaggerDelayMs(index, false),
      withTiming(1, { duration: chatEnterMs(false, CHAT_MOTION.bubble.enter), easing: Easing.out(Easing.cubic) }),
    );
  }, [isUser, reduce, index, v]);
  const enter = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ translateY: (1 - v.value) * CHAT_MOTION.bubble.distance }],
  }));

  const deliveryWord =
    delivery === "sending"
      ? t("Sending…", "Inatuma…")
      : delivery === "failed"
        ? t("Not sent", "Haijatumwa")
        : delivery === "sent"
          ? t("Sent", "Imetumwa")
          : "";

  const failed = delivery === "failed" || !!message.error;

  return (
    <Animated.View style={[enter, { marginVertical: 6, alignItems: isUser ? "flex-end" : "flex-start", gap: 8 }]}>
      {!isUser && showAttribution ? <AttributionRow /> : null}

      <View
        style={{
          maxWidth: "86%",
          borderRadius: 18,
          borderBottomRightRadius: isUser ? 4 : 18,
          borderBottomLeftRadius: isUser ? 18 : 4,
          paddingHorizontal: 14,
          paddingVertical: 11,
          backgroundColor: bubbleBg,
          borderWidth: isUser ? (failed ? 1.5 : 0) : 1,
          borderColor: failed ? c.error : c.border,
        }}
      >
        {message.attachments?.length ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: message.content ? 8 : 0 }}>
            {message.attachments.map((a) =>
              a.kind === "image" ? (
                <Pressable
                  key={a.id}
                  accessibilityRole="button"
                  accessibilityLabel={t("Preview photo", "Ona picha")}
                  onPress={() => onPreviewAttachment?.(a)}
                >
                  <Image source={{ uri: a.uri }} style={{ width: 108, height: 108, borderRadius: 10 }} />
                </Pressable>
              ) : (
                <Pressable
                  key={a.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${a.name}${a.extractError ? `. ${a.extractError}` : ""}`}
                  onPress={() => onPreviewAttachment?.(a)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 9,
                    paddingVertical: 6,
                    borderRadius: 9,
                    backgroundColor: isUser ? "rgba(255,255,255,0.18)" : c.bg,
                  }}
                >
                  <Icon
                    name={
                      a.extracting ? "refresh-cw"
                      : a.extractError ? "alert-triangle"
                      : a.kind === "link" ? "link"
                      : a.kind === "cv" ? "briefcase"
                      : "file-text"
                    }
                    size={13}
                    color={a.extractError ? (isUser ? c.accentText : c.warning) : isUser ? c.accentText : c.accent}
                  />
                  <Text numberOfLines={1} style={{ color: textColor, fontSize: 12, maxWidth: 150 }}>
                    {a.name}
                  </Text>
                  <Icon name="chevron-right" size={12} color={isUser ? c.accentText : c.textMuted} />
                </Pressable>
              ),
            )}
          </View>
        ) : null}

        {message.content ? (
          <Text style={{ color: textColor, fontSize: 15, lineHeight: 22 }}>{message.content}</Text>
        ) : null}

        {/* T1's delivery word — one word, right-aligned, under the text. */}
        {isUser && (deliveryWord || message.offeredOpener) ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 5, justifyContent: "flex-end" }}>
            {deliveryWord ? (
              <Text style={{ color: failed ? c.error : c.accentText, opacity: failed ? 1 : 0.85, fontSize: 10.5, fontWeight: "700" }}>
                {deliveryWord}
              </Text>
            ) : null}
            {/* Audit F5: a bubble seeded by an offered opener is marked as such —
                putting words in someone's mouth unmarked is not allowed. */}
            {message.offeredOpener ? (
              <Text style={{ color: c.accentText, opacity: 0.85, fontSize: 10.5 }}>
                {t("one of my suggestions, sent as yours", "ombi langu, umelituma kama wako")}
              </Text>
            ) : null}
          </View>
        ) : null}

        {message.sending ? (
          <Text style={{ color: isUser ? c.accentText : c.textMuted, fontSize: 12, marginTop: 4 }}>{t("Sending…", "Inatuma…")}</Text>
        ) : null}
      </View>

      {/* T7 — the failure, attached to the turn it belongs to. */}
      {failed && onRetry ? (
        <TurnErrorCard
          title={t("I couldn't answer this one.", "Sikuweza kujibu ombi hili.")}
          why={
            message.error ??
            t(
              "Reason: the service that lets me think is unreachable right now. It's not your network, and it's not your words — your request arrived, my answer didn't come out.",
              "Sababu: huduma inayoniwezesha kufikiri haipatikani sasa hivi. Si mtandao wako, na si maandishi yako — ombi lako lilifika, jibu langu halikutoka.",
            )
          }
          ruledOut={t("I've kept what you wrote.", "Nimehifadhi ulichoandika.")}
          retryLabel={t("Try this request again", "Jaribu ombi hili tena")}
          onRetry={onRetry}
          busy={retryBusy}
          onSecondary={onWriteYourself}
        />
      ) : null}

      {!isUser ? (
        <>
          {/* T5 — the produced document, in the card shell (§3.4). */}
          {message.type === "cv-ready" && message.data.cv ? (
            <CvDocumentCard
              cv={message.data.cv}
              templateId={message.data.cvTemplateId}
              onOpenEditor={onOpenCvEditor ? (savedId) => onOpenCvEditor(message.data.cv!, message.data.cvTemplateId, savedId) : undefined}
              onSaveCv={onSaveCv}
            />
          ) : null}

          {/* The rich cards keep their own content and gain the one visual
              grammar: both are wrapped in the document-card band. */}
          {message.type === "skill-gap" && message.data.skills ? (
            <DocumentCard stateLabel={t("Skills", "ujuzi")}>
              <View style={{ borderWidth: 1, borderTopWidth: 0, borderColor: c.border, backgroundColor: c.bgElevated, padding: 12 }}>
                <SkillGapCard
                  skills={message.data.skills}
                  onActionPress={(a, d) => onActionPress?.(a, d)}
                  loading={loading}
                />
              </View>
            </DocumentCard>
          ) : null}

          {message.type === "learning" && message.data.resources ? (
            <DocumentCard stateLabel={t("Courses", "kozi")}>
              <View style={{ borderWidth: 1, borderTopWidth: 0, borderColor: c.border, backgroundColor: c.bgElevated, padding: 12 }}>
                <LearningResources resources={message.data.resources} compact={false} />
              </View>
            </DocumentCard>
          ) : null}
        </>
      ) : null}
    </Animated.View>
  );
}
