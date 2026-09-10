import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { CV } from "@sumaiya/types";
import { useCvs } from "../../hooks/use-cvs";
import { useAuthContext } from "../../contexts/auth-context";
import { useLang, type Lang } from "../../lib/i18n";
import { GUIDES } from "../../lib/guides";
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

function greeting(lang: Lang): string {
  const h = new Date().getHours();
  if (lang === "sw") {
    if (h < 12) return "Habari za asubuhi";
    if (h < 16) return "Habari za mchana";
    if (h < 19) return "Habari za jioni";
    return "Habari za usiku";
  }
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function relativeDate(d: string | Date, lang: Lang): string {
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  const day = 86_400_000;
  const n = Math.floor(diff / day);
  if (lang === "sw") {
    if (diff < day) return "Leo";
    if (diff < 2 * day) return "Jana";
    if (diff < 7 * day) return `Siku ${n} zilizopita`;
    return date.toLocaleDateString("sw-TZ", { month: "short", day: "numeric" });
  }
  if (diff < day) return "Today";
  if (diff < 2 * day) return "Yesterday";
  if (diff < 7 * day) return `${n} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function HomeScreen({ navigation }: any) {
  const c = useThemeColors();
  const { user } = useAuthContext();
  const { t, lang } = useLang();
  const { cvs, loading, loadCVs } = useCvs();
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

  const rawName = user?.name?.trim();
  // Don't greet someone by a device/brand name a browser auto-filled.
  const looksLikeDevice = rawName ? /^(hisense|samsung|xiaomi|infinix|tecno|itel|oppo|vivo|realme|nokia|huawei|redmi|android|iphone|ipad|roku|tv)\b/i.test(rawName) || /^[a-z0-9]{1,4}$/i.test(rawName) : false;
  const name = rawName && !looksLikeDevice ? rawName : user?.email?.split("@")[0] || t("there", "rafiki");

  const quickActions = [
    { icon: "sumaiya", label: t("Ask Sumaiya", "Uliza Sumaiya"), tint: c.accent, onPress: () => navigation.navigate("SumaiyaTab") },
    { icon: "target", label: t("Tailor to a job", "Lenga kwenye kazi"), tint: "#12433D", onPress: () => navigation.navigate("JobApply") },
    { icon: "shield-check", label: t("ATS check", "Ukaguzi wa ATS"), tint: "#12766A", onPress: () => navigation.navigate("AtsChecker") },
    { icon: "briefcase", label: t("Applications", "Maombi"), tint: c.accent, onPress: () => navigation.navigate("Applications") },
    { icon: "import", label: t("Import a CV", "Pakia CV"), tint: c.accent, onPress: () => navigation.navigate("ImportTab") },
    { icon: "book-open", label: t("Learning", "Kujifunza"), tint: "#96630F", onPress: () => navigation.navigate("LearningHub") },
  ];

  return (
    <Screen
      scroll
      keyboardAvoiding={false}
      contentContainerStyle={{ gap: 22 }}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <ScreenTitle eyebrow={`${greeting(lang)},`}>{name}</ScreenTitle>

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
            {cvs.length === 1 ? t("CV created", "CV imetengenezwa") : t("CVs created", "CV zimetengenezwa")}
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
          <Icon name="plus" size={18} color={c.accentText} />
          <Text style={{ color: c.accentText, fontSize: 19, fontWeight: "700", marginTop: 8 }}>
            {t("New CV", "CV mpya")}
          </Text>
          <Text style={{ color: c.accentText, opacity: 0.9, fontSize: 12, fontWeight: "600" }}>
            {t("Start from scratch", "Anza upya")} →
          </Text>
        </Pressable>
      </Animated.View>

      {/* Quick actions */}
      <Animated.View entering={FadeInDown.duration(320).delay(120)}>
        <SectionHeader title={t("Quick actions", "Vitendo vya haraka")} />
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

      {/* Tip of the day — a free guide, rotated daily */}
      {(() => {
        const freeGuides = GUIDES.filter((g) => g.tier === "free");
        const tip = freeGuides[Math.floor(Date.now() / 86_400_000) % freeGuides.length];
        return (
          <Animated.View entering={FadeInDown.duration(320).delay(160)}>
            <Pressable
              onPress={() => { haptics.light(); navigation.navigate("Guide", { id: tip.id }); }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                borderRadius: 16,
                backgroundColor: c.accent + "12",
                borderWidth: 1,
                borderColor: c.accent + "2a",
              }}
            >
              <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: c.accent + "22", alignItems: "center", justifyContent: "center" }}>
                <Icon name="sparkles" size={18} color={c.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" }}>
                  {t("Tip from Sumaiya", "Kidokezo cha Sumaiya")}
                </Text>
                <Text style={{ color: c.text, fontSize: 14, fontWeight: "700", marginTop: 2 }} numberOfLines={2}>
                  {tip.title[lang]}
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color={c.accent} />
            </Pressable>
          </Animated.View>
        );
      })()}

      {/* Recent CVs */}
      <Animated.View entering={FadeInDown.duration(320).delay(180)}>
        <SectionHeader
          title={t("Recent", "Za hivi karibuni")}
          actionLabel={cvs.length > 3 ? t("View all", "Ona zote") : undefined}
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
            title={t("No CVs yet", "Bado hakuna CV")}
            body={t(
              "Import an existing CV from a photo or a file, or start a new one.",
              "Pakia CV uliyonayo kutoka kwenye picha au faili, au anza mpya.",
            )}
            actionLabel={t("Import a CV", "Pakia CV")}
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
                    {relativeDate(cv.updatedAt, lang)}
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
