import React, { useCallback, useState } from "react";
import { Alert, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useCVs } from "@sumaiya/hooks";
import type { CV } from "@sumaiya/types";
import { apiClient } from "../../lib/api-client";
import {
  Button,
  Card,
  EmptyState,
  Screen,
  ScreenTitle,
  SkeletonCard,
  Stagger,
  haptics,
  useThemeColors,
} from "../../components/ui";
import { Icon } from "../../components/icon";

function relativeDate(d: string | Date): string {
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  const day = 86_400_000;
  if (diff < day) return "Today";
  if (diff < 2 * day) return "Yesterday";
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function CvListScreen({ navigation }: any) {
  const c = useThemeColors();
  const { cvs, loading, deleteCV, loadCVs } = useCVs(apiClient);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    try {
      await loadCVs?.();
    } finally {
      setRefreshing(false);
    }
  }, [loadCVs]);

  const confirmDelete = (id: string, title: string) => {
    haptics.warning();
    Alert.alert("Delete this CV?", `"${title}" will be permanently removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(id);
          try {
            await deleteCV(id);
            haptics.success();
          } catch {
            haptics.error();
            Alert.alert("Couldn't delete", "Something went wrong. Try again.");
          } finally {
            setDeleting(null);
          }
        },
      },
    ]);
  };

  return (
    <Screen scroll keyboardAvoiding={false} refreshing={refreshing} onRefresh={onRefresh}>
      <ScreenTitle
        trailing={
          cvs.length > 0 ? (
            <View style={{ backgroundColor: c.accent, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 4 }}>
              <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "700" }}>{cvs.length}</Text>
            </View>
          ) : undefined
        }
      >
        My CVs
      </ScreenTitle>

      {loading && cvs.length === 0 ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : cvs.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", paddingBottom: 40 }}>
          <EmptyState
            icon="file-text"
            title="Your CVs live here"
            body="Import an existing CV from a photo or a file, or start a new one — it takes a couple of minutes."
            actionLabel="Import a CV"
            onAction={() => navigation.navigate("ImportTab")}
            secondaryLabel="Start a new CV"
            onSecondary={() => navigation.navigate("CvEditor")}
          />
        </View>
      ) : (
        cvs
          .slice()
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .map((cv: CV, i) => (
            <Stagger key={cv.id} index={i}>
              <Card style={{ marginBottom: 12, gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: c.accent + "14",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name="file-text" size={20} color={c.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 15.5, fontWeight: "700" }} numberOfLines={1}>
                      {cv.title}
                    </Text>
                    <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>
                      Updated {relativeDate(cv.updatedAt)}
                    </Text>
                  </View>
                  {cv.isOfflineOnly ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c.warning + "1f", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
                      <Icon name="wifi-off" size={11} color={c.warning} />
                      <Text style={{ color: c.warning, fontSize: 10.5, fontWeight: "700" }}>Offline</Text>
                    </View>
                  ) : null}
                </View>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Edit"
                      variant="secondary"
                      size="sm"
                      leftIcon={<Icon name="edit" size={15} color={c.text} />}
                      onPress={() =>
                        navigation.navigate("CvEditor", { templateId: cv.templateId, cvId: cv.id })
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Delete"
                      variant="ghost"
                      size="sm"
                      loading={deleting === cv.id}
                      leftIcon={<Icon name="trash-2" size={15} color={c.error} />}
                      onPress={() => confirmDelete(cv.id, cv.title)}
                      haptic="warning"
                    />
                  </View>
                </View>
              </Card>
            </Stagger>
          ))
      )}
    </Screen>
  );
}
