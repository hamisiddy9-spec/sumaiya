import React from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { useThemeColors } from "../ui/theme";
import { useLang } from "../../lib/i18n";
import type { LearningResource } from "./chat-types";

interface LearningResourcesProps {
  resources: LearningResource[];
  onResourcePress?: (resource: LearningResource) => void;
  compact?: boolean;
}

const PLATFORM_EMOJI: Record<string, string> = {
  freecodecamp: "🎓",
  coursera: "📖",
  udemy: "🎯",
  youtube: "📹",
  linkedin: "💼",
  skillshare: "🎨",
  datacamp: "📊",
  pluralsight: "🔧",
  codecademy: "💻",
  edx: "🏫",
};

export function LearningResources({ resources, onResourcePress, compact = false }: LearningResourcesProps) {
  const c = useThemeColors();
  const { t } = useLang();
  if (!resources || resources.length === 0) return null;

  return (
    <View style={{ gap: compact ? 8 : 12 }}>
      {!compact ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 20 }}>📚</Text>
          <Text style={{ color: c.text, fontSize: 15.5, fontWeight: "800" }}>{t("Learning Resources", "Rasilimali za Kujifunza")}</Text>
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        {resources.slice(0, compact ? 3 : resources.length).map((resource) => (
          <LearningResourceCard
            key={resource.id}
            resource={resource}
            onPress={() => {
              onResourcePress?.(resource);
              if (resource.url) Linking.openURL(resource.url).catch(() => {});
            }}
            compact={compact}
          />
        ))}
      </View>

      {compact && resources.length > 3 ? (
        <Pressable style={{ paddingVertical: 8, alignItems: "center" }}>
          <Text style={{ color: c.accent, fontSize: 12.5, fontWeight: "700" }}>
            {t(`+${resources.length - 3} more resources`, `+${resources.length - 3} rasilimali zaidi`)}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

interface LearningResourceCardProps {
  resource: LearningResource;
  onPress: () => void;
  compact?: boolean;
}

function LearningResourceCard({ resource, onPress, compact = false }: LearningResourceCardProps) {
  const c = useThemeColors();
  const { t } = useLang();

  const difficultyTone =
    resource.difficulty === "beginner" ? c.success : resource.difficulty === "advanced" ? c.error : c.warning;
  const difficultyLabel = {
    beginner: t("Beginner", "Mwanzo"),
    intermediate: t("Intermediate", "Kati"),
    advanced: t("Advanced", "Juu"),
  }[resource.difficulty];
  const emoji = PLATFORM_EMOJI[resource.platform.toLowerCase()] ?? "📚";

  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: c.bgElevated,
        borderWidth: 1,
        borderColor: c.border,
        gap: compact ? 0 : 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={compact ? 1 : 2} style={{ color: c.text, fontSize: 13.5, fontWeight: "700" }}>
            {emoji} {resource.name}
          </Text>
          <Text style={{ color: c.textMuted, fontSize: 11.5, marginTop: 2 }}>{resource.platform}</Text>
        </View>
        <View style={{ backgroundColor: difficultyTone + "1f", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ color: difficultyTone, fontSize: 10.5, fontWeight: "800" }}>{difficultyLabel}</Text>
        </View>
      </View>

      {!compact && resource.description ? (
        <Text numberOfLines={2} style={{ color: c.textMuted, fontSize: 12 }}>
          {resource.description}
        </Text>
      ) : null}

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: compact ? 4 : 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ color: c.textMuted, fontSize: 11.5 }}>⏱ {resource.duration}</Text>
          <Text style={{ color: c.textMuted, fontSize: 11.5 }}>⭐ {resource.rating.toFixed(1)}</Text>
        </View>
        <Text style={{ color: c.accent, fontSize: 11.5, fontWeight: "700" }}>{t("Open →", "Fungua →")}</Text>
      </View>
    </Pressable>
  );
}
