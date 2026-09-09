import React from "react";
import { Image, Text, View } from "react-native";
import { SkillGapCard } from "./skill-gap-card";
import { LearningResources } from "./learning-resources";
import { SuggestionChips } from "./suggestion-chips";
import type { ChatMessage, ActionType } from "./chat-types";
import { Icon } from "../icon";
import { useThemeColors } from "../ui/theme";

interface Props {
  message: ChatMessage;
  onActionPress?: (action: ActionType, data?: Record<string, any>) => void;
  loading?: boolean;
}

export function ChatMessageComponent({ message, onActionPress, loading = false }: Props) {
  const c = useThemeColors();
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
                <Image key={a.id} source={{ uri: a.uri }} style={{ width: 108, height: 108, borderRadius: 10 }} />
              ) : (
                <View
                  key={a.id}
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
                    name={a.kind === "link" ? "link" : a.kind === "cv" ? "briefcase" : "file-text"}
                    size={13}
                    color={isUser ? c.accentText : c.accent}
                  />
                  <Text numberOfLines={1} style={{ color: textColor, fontSize: 12, maxWidth: 150 }}>
                    {a.name}
                  </Text>
                </View>
              ),
            )}
          </View>
        ) : null}

        {message.content ? (
          <Text style={{ color: textColor, fontSize: 15, lineHeight: 22 }}>{message.content}</Text>
        ) : null}

        {message.sending ? (
          <Text style={{ color: isUser ? c.accentText : c.textMuted, fontSize: 12, marginTop: 4 }}>Sending…</Text>
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
