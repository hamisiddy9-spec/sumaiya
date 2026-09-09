import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useCVs } from "@sumaiya/hooks";
import type { CV } from "@sumaiya/types";
import { apiClient } from "../../lib/api-client";
import { useAuthContext } from "../../contexts/auth-context";
import {
  Card,
  EmptyState,
  Screen,
  ScreenTitle,
  SectionHeader,
  SkeletonCard,
  Stagger,
  haptics,
  useThemeColors,
} from "../../components/ui";
import { Icon } from "../../components/icon";
import { SumaiyaMark } from "../../components/sumaiya-mark";


function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function relativeDate(d: string | Date): string {
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  const day = 86_400_000;
  if (diff < day) return "Today";
  if (diff < 2 * day) return "Yesterday";
  if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function HomeScreen({ navigation }: any) {
  const c = useThemeColors();
  const { user } = useAuthContext();
  const { cvs, loading, loadCVs } = useCVs(apiClient);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    try {
      await loadCVs?.();
    } finally {
      setRefreshing(false);
    }
  }, [loadCVs]);

  const recent = useMemo(
    () =>
      [...cvs]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3),
    [cvs],
  );

  const name = user?.name || user?.email?.split("@")[0] || "there";

  const quickActions = [
    { icon: "sumaiya", label: "Ask Sumaiya", tint: "#7c3aed", onPress: () => navigation.navigate("SumaiyaTab") },
    { icon: "briefcase", label: "Applications", tint: "#c63f13", onPress: () => navigation.navigate("Applications") },
    { icon: "shield-check", label: "ATS check", tint: "#0e9488", onPress: () => navigation.navigate("AtsChecker") },
    { icon: "import", label: "Import a CV", tint: c.accent, onPress: () => navigation.navigate("ImportTab") },
    { icon: "file-text", label: "My CVs", tint: "#4a5568", onPress: () => navigation.navigate("CVsTab") },
    { icon: "book-open", label: "Learning", tint: "#c77a17", onPress: () => navigation.navigate("LearningHub") },
  ];

  return (
    <Screen
      scroll
      keyboardAvoiding={false}
      contentContainerStyle={{ gap: 22 }}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {/* Greeting */}
      <ScreenTitle eyebrow={`${greeting()},`}>{name}</ScreenTitle>

      {/* Stat row */}
      <Animated.View
        entering={FadeInDown.duration(320).delay(60)}
        style={{ flexDirection: "row", alignItems: "stretch", gap: 12 }}
      >
        <Pressable
          onPress={() => { haptics.light(); navigation.navigate("CVsTab"); }}
          style={{
            flex: 1,
            backgroundColor: c.bgElevated,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: c.border,
            padding: 16,
          }}
        >
          <Icon name="file-text" size={18} color={c.accent} />
          <Text style={{ color: c.text, fontSize: 26, fontWeight: "800", marginTop: 8 }}>
            {cvs.length}
          </Text>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>
            {cvs.length === 1 ? "CV created" : "CVs created"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            haptics.light();
            navigation.navigate("CVsTab", { screen: "CvEditor" });
          }}
          style={{
            flex: 1,
            backgroundColor: c.accent,
            borderRadius: 16,
            padding: 16,
            justifyContent: "flex-start",
          }}
        >
          <Icon name="plus" size={18} color="#ffffff" />
          <Text style={{ color: "#ffffff", fontSize: 19, fontWeight: "700", marginTop: 8 }}>
            New CV
          </Text>
          <Text style={{ color: "#ffffff", opacity: 0.9, fontSize: 12, fontWeight: "600" }}>
            Start from scratch →
          </Text>
        </Pressable>
      </Animated.View>

      {/* Quick actions */}
      <Animated.View entering={FadeInDown.duration(320).delay(120)}>
        <SectionHeader title="Quick actions" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {quickActions.map((a, i) => (
            <Stagger key={a.label} index={i} step={45}>
              <Card onPress={a.onPress} style={{ width: 156, alignItems: "flex-start", gap: 10 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: a.tint + "1f",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {a.icon === "sumaiya" ? (
                    <SumaiyaMark size={19} color={a.tint} state="static" />
                  ) : (
                    <Icon name={a.icon} size={19} color={a.tint} />
                  )}
                </View>
                <Text style={{ color: c.text, fontSize: 14.5, fontWeight: "700" }}>{a.label}</Text>
              </Card>
            </Stagger>
          ))}
        </View>
      </Animated.View>

      {/* Recent CVs */}
      <Animated.View entering={FadeInDown.duration(320).delay(180)}>
        <SectionHeader
          title="Recent"
          actionLabel={cvs.length > 3 ? "View all" : undefined}
          onAction={() => navigation.navigate("CVsTab")}
        />

        {loading && cvs.length === 0 ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : recent.length === 0 ? (
          <EmptyState
            icon="file-text"
            title="No CVs yet"
            body="Import an existing CV from a photo or a file, or start a new one."
            actionLabel="Import a CV"
            onAction={() => navigation.navigate("ImportTab")}
          />
        ) : (
          recent.map((cv: CV, i) => (
            <Stagger key={cv.id} index={i}>
              <Card
                onPress={() =>
                  navigation.navigate("CVsTab", {
                    screen: "CvEditor",
                    params: { templateId: cv.templateId, cvId: cv.id },
                  })
                }
                style={{ marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: c.accent + "14",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="file-text" size={19} color={c.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 15, fontWeight: "700" }} numberOfLines={1}>
                    {cv.title}
                  </Text>
                  <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>
                    {relativeDate(cv.updatedAt)}
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color={c.textMuted} />
              </Card>
            </Stagger>
          ))
        )}
      </Animated.View>
    </Screen>
  );
}
