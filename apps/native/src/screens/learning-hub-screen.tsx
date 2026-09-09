import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { apiClient, ApiError } from "../lib/api-client";
import {
  Button,
  Card,
  EmptyState,
  Screen,
  SkeletonCard,
  Stagger,
  haptics,
  useThemeColors,
} from "../components/ui";
import { Icon } from "../components/icon";

interface Resource {
  id: string;
  title: string;
  platform: string;
  url: string;
  free: boolean;
}

export function LearningHubScreen({ navigation }: { navigation: any }) {
  const c = useThemeColors();
  const [query, setQuery] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResources(await apiClient.getLearningResources());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load courses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (freeOnly && !r.free) return false;
      if (!q) return true;
      return r.title.toLowerCase().includes(q) || r.platform.toLowerCase().includes(q);
    });
  }, [resources, query, freeOnly]);

  return (
    <Screen scroll keyboardAvoiding={false}>
      <Pressable
        hitSlop={10}
        onPress={() => {
          haptics.selection();
          navigation.goBack();
        }}
        style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, marginBottom: 14 }}
      >
        <Icon name="arrow-left" size={18} color={c.accent} />
        <Text style={{ color: c.accent, fontWeight: "700" }}>Back</Text>
      </Pressable>

      <Text style={{ color: c.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 }}>
        Learning hub
      </Text>
      <Text style={{ color: c.textBody, fontSize: 14, marginTop: 6, marginBottom: 18 }}>
        Verified courses to close your skill gaps.
      </Text>

      {/* Search */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: c.bgElevated,
          borderWidth: 1.5,
          borderColor: c.border,
          borderRadius: 12,
          paddingHorizontal: 12,
          marginBottom: 12,
        }}
      >
        <Icon name="search" size={17} color={c.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search courses"
          placeholderTextColor={c.textMuted}
          selectionColor={c.accent}
          style={{ flex: 1, paddingVertical: 12, fontSize: 15, color: c.text }}
        />
      </View>

      <Pressable
        onPress={() => {
          haptics.selection();
          setFreeOnly((v) => !v);
        }}
        style={{
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: freeOnly ? c.accent : c.border,
          backgroundColor: freeOnly ? c.accent + "14" : "transparent",
          marginBottom: 18,
        }}
      >
        {freeOnly ? <Icon name="check" size={13} color={c.accent} /> : null}
        <Text style={{ color: freeOnly ? c.accent : c.textBody, fontWeight: "700", fontSize: 12.5 }}>
          Free only
        </Text>
      </Pressable>

      {loading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : error ? (
        <EmptyState icon="alert-triangle" title="Couldn't load courses" body={error} actionLabel="Retry" onAction={load} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="search" title="Nothing matches" body="Try a different search or turn off the free-only filter." />
      ) : (
        <>
          <Text style={{ color: c.textMuted, fontSize: 12.5, fontWeight: "700", marginBottom: 10 }}>
            {filtered.length} course{filtered.length !== 1 ? "s" : ""}
          </Text>
          {filtered.map((r, i) => (
            <Stagger key={r.id} index={i} step={35}>
              <Card style={{ marginBottom: 10, gap: 10 }}>
                <Text style={{ color: c.text, fontSize: 15.5, fontWeight: "700", lineHeight: 21 }}>
                  {r.title}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ color: c.accent, fontSize: 13, fontWeight: "700" }}>{r.platform}</Text>
                  <View
                    style={{
                      backgroundColor: (r.free ? c.success : c.warning) + "1f",
                      borderRadius: 7,
                      paddingHorizontal: 7,
                      paddingVertical: 3,
                    }}
                  >
                    <Text style={{ color: r.free ? c.success : c.warning, fontSize: 10.5, fontWeight: "700" }}>
                      {r.free ? "FREE" : "PAID"}
                    </Text>
                  </View>
                </View>
                <Button
                  label="Open course"
                  variant="secondary"
                  size="sm"
                  rightIcon={<Icon name="external-link" size={14} color={c.text} />}
                  onPress={() => {
                    haptics.light();
                    Linking.openURL(r.url).catch(() => {});
                  }}
                />
              </Card>
            </Stagger>
          ))}
        </>
      )}
    </Screen>
  );
}
