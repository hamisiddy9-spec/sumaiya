import React, { useEffect, useMemo, useState } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { CV } from "@sumaiya/types";
import type { JobRecommendation } from "@sumaiya/api-client";
import { apiClient } from "../../lib/api-client";
import { useCvs } from "../../hooks/use-cvs";
import { useAuthContext } from "../../contexts/auth-context";
import { useLang, type Lang } from "../../lib/i18n";
import { GUIDES } from "../../lib/guides";
import {
  Card,
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
import type { HomeScreenProps } from "../../navigation/types";

// One shared horizontal margin (Screen pads 20 each side) → every block on this
// screen spans exactly the same width. Quick-action cards are sized to fill the
// row with the 12px gutter, so the grid's right edge lines up with everything
// else.
const GUTTER = 12;
const SIDE = 20;
const COL_W = (Dimensions.get("window").width - SIDE * 2 - GUTTER) / 2;

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

export function HomeScreen({ navigation }: HomeScreenProps) {
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

  // Top job matches for the profile — best-effort, silent on failure.
  const [jobRecs, setJobRecs] = useState<JobRecommendation[]>([]);
  useEffect(() => {
    let alive = true;
    apiClient.getJobRecommendations(3).then((r) => { if (alive) setJobRecs(r); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const rawName = user?.name?.trim();
  const looksLikeDevice = rawName
    ? /^(hisense|samsung|xiaomi|infinix|tecno|itel|oppo|vivo|realme|nokia|huawei|redmi|android|iphone|ipad|roku|tv)\b/i.test(rawName) ||
      /^[a-z0-9]{1,4}$/i.test(rawName)
    : false;
  const name = rawName && !looksLikeDevice ? rawName : user?.email?.split("@")[0] || t("there", "rafiki");

  const quickActions = [
    { icon: "sumaiya", label: t("Ask Sumaiya", "Uliza Sumaiya"), tint: c.accent, onPress: () => navigation.navigate("SumaiyaTab") },
    { icon: "target", label: t("Jobs for you", "Kazi kwako"), tint: "#12433D", onPress: () => navigation.navigate("Jobs") },
    { icon: "shield-check", label: t("ATS check", "Ukaguzi wa ATS"), tint: "#12766A", onPress: () => navigation.navigate("AtsChecker") },
    { icon: "briefcase", label: t("Applications", "Maombi"), tint: c.accent, onPress: () => navigation.navigate("Applications") },
    { icon: "import", label: t("Import a CV", "Pakia CV"), tint: c.accent, onPress: () => navigation.navigate("ImportTab") },
    { icon: "book-open", label: t("Learning", "Kujifunza"), tint: "#96630F", onPress: () => navigation.navigate("LearningHub") },
  ];

  return (
    <Screen scroll keyboardAvoiding={false} contentContainerStyle={{ gap: 24 }} refreshing={refreshing} onRefresh={onRefresh}>
      <ScreenTitle eyebrow={`${greeting(lang)},`}>{name}</ScreenTitle>

      {/* Primary row — two equal tiles: the count, and the make-a-CV CTA. */}
      <Animated.View entering={FadeInDown.duration(320).delay(60)} style={{ flexDirection: "row", gap: GUTTER }}>
        <Pressable
          onPress={() => { haptics.light(); navigation.navigate("CVsTab"); }}
          style={{
            width: COL_W,
            minHeight: 116,
            backgroundColor: c.bgElevated,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: c.border,
            padding: 16,
            justifyContent: "space-between",
          }}
        >
          <Icon name="file-text" size={18} color={c.accent} />
          <View>
            <Text style={{ color: c.text, fontSize: 26, fontWeight: "800" }}>{cvs.length}</Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>
              {cvs.length === 1 ? t("CV created", "CV imetengenezwa") : t("CVs created", "CV zimetengenezwa")}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => { haptics.light(); navigation.navigate("CVsTab", { screen: "CvEditor" }); }}
          style={{
            width: COL_W,
            minHeight: 116,
            backgroundColor: c.accent,
            borderRadius: 16,
            padding: 16,
            justifyContent: "space-between",
          }}
        >
          <Icon name="plus" size={18} color={c.accentText} />
          <View>
            <Text style={{ color: c.accentText, fontSize: 18, fontWeight: "800" }}>{t("New CV", "CV mpya")}</Text>
            <Text style={{ color: c.accentText, opacity: 0.9, fontSize: 12, fontWeight: "600", marginTop: 1 }}>
              {t("Start from scratch", "Anza upya")} →
            </Text>
          </View>
        </Pressable>
      </Animated.View>

      {/* Quick actions — a 2-column grid that fills the row exactly. */}
      <Animated.View entering={FadeInDown.duration(320).delay(120)}>
        <SectionHeader title={t("Quick actions", "Vitendo vya haraka")} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GUTTER }}>
          {quickActions.map((a, i) => (
            <Stagger key={a.label} index={i} step={45}>
              <Card onPress={a.onPress} style={{ width: COL_W, alignItems: "flex-start", gap: 10 }}>
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

      {/* Tip of the day — a free guide, rotated daily. */}
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
                <SumaiyaMark size={18} state="static" color={c.accent} />
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

      {/* Jobs matched to the profile */}
      {jobRecs.length > 0 ? (
        <Animated.View entering={FadeInDown.duration(320).delay(170)}>
          <SectionHeader
            title={t("Jobs for you", "Kazi kwako")}
            actionLabel={t("See all", "Ona zote")}
            onAction={() => navigation.navigate("Jobs")}
          />
          <View style={{ gap: 10 }}>
            {jobRecs.slice(0, 2).map((r) => {
              const tone = r.score >= 60 ? c.success : r.score >= 35 ? c.warning : c.textMuted;
              return (
                <Pressable
                  key={r.jobId}
                  onPress={() => { haptics.light(); navigation.navigate("Jobs"); }}
                  style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.bgElevated }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: c.text, fontSize: 14.5, fontWeight: "700" }} numberOfLines={1}>{r.job.title}</Text>
                    <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                      {[r.job.company, r.job.location].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: tone + "1f", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
                    <Icon name="target" size={11} color={tone} />
                    <Text style={{ color: tone, fontSize: 11.5, fontWeight: "800" }}>{r.score}%</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      ) : null}

      {/* Recent CVs */}
      <Animated.View entering={FadeInDown.duration(320).delay(180)}>
        <SectionHeader
          title={t("Recent", "Za hivi karibuni")}
          actionLabel={cvs.length > 3 ? t("View all", "Ona zote") : undefined}
          onAction={() => navigation.navigate("CVsTab")}
        />

        {loading && cvs.length === 0 ? (
          <View style={{ gap: 10 }}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : recent.length === 0 ? (
          // Inline, card-shaped, same width and rhythm as everything else — not a
          // full-screen hero. The "New CV" tile above and the "Import a CV" quick
          // action already carry the CTAs, so this just names the empty state.
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: c.border,
              borderStyle: "dashed",
              backgroundColor: c.bgElevated,
            }}
          >
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: c.accent + "14", alignItems: "center", justifyContent: "center" }}>
              <Icon name="file-text" size={18} color={c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 14.5, fontWeight: "700" }}>
                {t("No CVs yet", "Bado hakuna CV")}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 12.5, marginTop: 2 }} numberOfLines={2}>
                {t("Your CVs will show here once you build or import one.", "CV zako zitaonekana hapa mara utakapotengeneza au kupakia.")}
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {recent.map((cv: CV, i) => (
              <Stagger key={cv.id} index={i}>
                <Card
                  onPress={() =>
                    navigation.navigate("CVsTab", { screen: "CvEditor", params: { templateId: cv.templateId, cvId: cv.id } })
                  }
                  style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
                >
                  <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: c.accent + "14", alignItems: "center", justifyContent: "center" }}>
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
            ))}
          </View>
        )}
      </Animated.View>
    </Screen>
  );
}
