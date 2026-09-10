import React, { useCallback, useState } from "react";
import { Alert, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import type { CV } from "@sumaiya/types";
import { useCvs } from "../../hooks/use-cvs";
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
import { useLang } from "../../lib/i18n";

function relativeDate(d: string | Date, sw: boolean): string {
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  const day = 86_400_000;
  const n = Math.floor(diff / day);
  if (diff < day) return sw ? "Leo" : "Today";
  if (diff < 2 * day) return sw ? "Jana" : "Yesterday";
  if (diff < 7 * day) return sw ? `Siku ${n} zilizopita` : `${n}d ago`;
  return date.toLocaleDateString(sw ? "sw-TZ" : "en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function CvListScreen({ navigation }: any) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const sw = lang === "sw";
  const { cvs, loading, deleteCV, loadCVs } = useCvs();
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
    Alert.alert(t("Delete this CV?", "Ufute CV hii?"), t(`"${title}" will be permanently removed.`, `"${title}" itafutwa kabisa.`), [
      { text: t("Cancel", "Ghairi"), style: "cancel" },
      {
        text: t("Delete", "Futa"),
        style: "destructive",
        onPress: async () => {
          setDeleting(id);
          try {
            await deleteCV(id);
            haptics.success();
          } catch {
            haptics.error();
            Alert.alert(t("Couldn't delete", "Imeshindwa kufuta"), t("Something went wrong. Try again.", "Kuna hitilafu. Jaribu tena."));
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
              <Text style={{ color: c.accentText, fontSize: 13, fontWeight: "700" }}>{cvs.length}</Text>
            </View>
          ) : undefined
        }
      >
        {t("My CVs", "CV zangu")}
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
            title={t("Your CVs live here", "CV zako zipo hapa")}
            body={t("Import an existing CV from a photo or a file, or start a new one — it takes a couple of minutes.", "Pakia CV uliyonayo kutoka picha au faili, au anza mpya — inachukua dakika chache.")}
            actionLabel={t("Import a CV", "Pakia CV")}
            onAction={() => navigation.navigate("ImportTab")}
            secondaryLabel={t("Start a new CV", "Anza CV mpya")}
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
                      {t("Updated", "Ilibadilishwa")} {relativeDate(cv.updatedAt, sw)}
                    </Text>
                  </View>
                  {cv.isOfflineOnly ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c.warning + "1f", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
                      <Icon name="wifi-off" size={11} color={c.warning} />
                      <Text style={{ color: c.warning, fontSize: 10.5, fontWeight: "700" }}>{t("Offline", "Nje ya mtandao")}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      label={t("Edit", "Hariri")}
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
                      label={t("Delete", "Futa")}
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
