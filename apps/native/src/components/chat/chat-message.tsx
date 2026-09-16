import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import type { CV, CVData } from "@sumaiya/types";
import { SkillGapCard } from "./skill-gap-card";
import { LearningResources } from "./learning-resources";
import { SuggestionChips } from "./suggestion-chips";
import { CvPreviewCard } from "../cv/cv-preview-card";
import type { CvTemplateId } from "../../lib/cv-html";
import type { ChatMessage, ActionType, Attachment } from "./chat-types";
import { Icon } from "../icon";
import { useThemeColors } from "../ui/theme";
import { useLang } from "../../lib/i18n";

interface Props {
  message: ChatMessage;
  onActionPress?: (action: ActionType, data?: Record<string, any>) => void;
  onPreviewAttachment?: (a: Attachment) => void;
  onOpenCvEditor?: (cv: CVData) => void;
  onSaveCv?: (cv: CVData, template: CvTemplateId) => Promise<void>;
  loading?: boolean;
}

export function ChatMessageComponent({
  message,
  onActionPress,
  onPreviewAttachment,
  onOpenCvEditor,
  onSaveCv,
  loading = false,
}: Props) {
  const c = useThemeColors();
  const { t } = useLang();
  const isUser = message.author === "user";

  const bubbleBg = isUser ? c.accent : c.bgElevated;
  const textColor = isUser ? c.accentText : c.text;

  return (
    <View style={{ marginVertical: 6, alignItems: isUser ? "flex-end" : "flex-start", gap: 8 }}>
      <View
        style={{
          maxWidth: "86%",
          borderRadius: 18,
          borderBottomRightRadius: isUser ? 4 : 18,
          borderBottomLeftRadius: isUser ? 18 : 4,
          paddingHorizontal: 14,
          paddingVertical: 11,
          backgroundColor: bubbleBg,
          borderWidth: isUser ? 0 : 1,
          borderColor: c.border,
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

        {message.sending ? (
          <Text style={{ color: isUser ? c.accentText : c.textMuted, fontSize: 12, marginTop: 4 }}>{t("Sending…", "Inatuma…")}</Text>
        ) : null}

        {message.error ? (
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center", marginTop: 6 }}>
            <Icon name="alert-circle" size={13} color={c.error} />
            <Text style={{ color: c.error, fontSize: 12 }}>{message.error}</Text>
          </View>
        ) : null}
      </View>

      {!isUser ? (
        <>
          {message.type === "cv-ready" && message.data.cv ? (
            <View style={{ width: "100%" }}>
              <CvPreviewCard
                cv={
                  {
                    id: "chat-cv",
                    userId: "me",
                    templateId: "classic",
                    title: message.data.cv.personalInfo?.fullName || "CV",
                    data: message.data.cv,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  } as CV
                }
                onOpenEditor={onOpenCvEditor ? () => onOpenCvEditor(message.data.cv!) : undefined}
                onSave={onSaveCv ? (tpl) => onSaveCv(message.data.cv!, tpl) : undefined}
              />
            </View>
          ) : null}

          {message.type === "skill-gap" && message.data.skills ? (
            <View style={{ width: "100%" }}>
              <SkillGapCard
                skills={message.data.skills}
                onActionPress={(a, d) => onActionPress?.(a, d)}
                loading={loading}
              />
            </View>
          ) : null}

          {message.type === "learning" && message.data.resources ? (
            <View style={{ width: "100%" }}>
              <LearningResources resources={message.data.resources} compact={false} />
            </View>
          ) : null}

          {message.data.suggestions && message.data.suggestions.length > 0 ? (
            <View style={{ width: "100%" }}>
              <SuggestionChips
                suggestions={message.data.suggestions}
                onSuggestionPress={(a, d) => onActionPress?.(a, d)}
                loading={loading}
              />
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
