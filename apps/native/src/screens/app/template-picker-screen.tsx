import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useAppNavigation } from "../../hooks/use-app-navigation";
import { apiClient } from "../../lib/api-client";
import type { Template } from "@sumaiya/types";
import { Button, Screen, SkeletonCard, Stagger, haptics, useThemeColors } from "../../components/ui";
import { Icon } from "../../components/icon";

interface Props {
  route: any;
}

export function TemplatePickerScreen({ route }: Props) {
  const c = useThemeColors();
  const navigation = useAppNavigation();
  const { extractedData } = route.params ?? {};
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiClient.getTemplates("en");
        setTemplates(data);
        // ATS-first ordering — the honest "best match" heuristic we can do
        // client-side without the web scoring engine.
        const first = [...data].sort((a, b) => Number(b.isAtsOptimized) - Number(a.isAtsOptimized))[0];
        if (first) setSelectedId(first.id);
      } catch {
        haptics.error();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const ranked = useMemo(
    () => [...templates].sort((a, b) => Number(b.isAtsOptimized) - Number(a.isAtsOptimized)).slice(0, 12),
    [templates],
  );

  return (
    <Screen
      scroll
      keyboardAvoiding={false}
      footer={
        <Button
          label="Open in editor"
          size="lg"
          disabled={!selectedId}
          onPress={() =>
            navigation.navigate("CVEditor", { templateId: selectedId, initialData: extractedData || {} })
          }
        />
      }
    >
      <Pressable
        onPress={() => {
          haptics.selection();
          navigation.goBack();
        }}
        hitSlop={10}
        style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, marginBottom: 16 }}
      >
        <Icon name="arrow-left" size={18} color={c.accent} />
        <Text style={{ color: c.accent, fontWeight: "700" }}>Back</Text>
      </Pressable>

      <Text style={{ color: c.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 }}>
        Pick a template
      </Text>
      <Text style={{ color: c.textBody, fontSize: 14.5, marginTop: 6, marginBottom: 20 }}>
        You can switch any time — your content stays.
      </Text>

      {loading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : (
        ranked.map((t, i) => {
          const selected = selectedId === t.id;
          return (
            <Stagger key={t.id} index={i} step={40}>
              <Pressable
                onPress={() => {
                  haptics.selection();
                  setSelectedId(t.id);
                }}
                style={{
                  flexDirection: "row",
                  gap: 14,
                  padding: 12,
                  marginBottom: 10,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: selected ? c.accent : c.border,
                  backgroundColor: selected ? c.accent + "0f" : c.bgElevated,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 52,
                    height: 68,
                    borderRadius: 8,
                    overflow: "hidden",
                    backgroundColor: c.border,
                  }}
                >
                  {t.previewUrl ? (
                    <Image source={{ uri: t.previewUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  ) : null}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ color: selected ? c.accent : c.text, fontSize: 15.5, fontWeight: "700" }}>
                    {t.name}
                  </Text>
                  <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 1, textTransform: "capitalize" }}>
                    {t.category}
                  </Text>
                  {t.isAtsOptimized ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        alignSelf: "flex-start",
                        marginTop: 6,
                        backgroundColor: c.success + "1f",
                        borderRadius: 7,
                        paddingHorizontal: 7,
                        paddingVertical: 3,
                      }}
                    >
                      <Icon name="check" size={10} color={c.success} />
                      <Text style={{ color: c.success, fontSize: 10.5, fontWeight: "700" }}>ATS-ready</Text>
                    </View>
                  ) : null}
                </View>

                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: selected ? c.accent : c.borderStrong,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selected ? (
                    <Animated.View
                      entering={FadeIn.duration(150)}
                      style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: c.accent }}
                    />
                  ) : null}
                </View>
              </Pressable>
            </Stagger>
          );
        })
      )}
    </Screen>
  );
}
