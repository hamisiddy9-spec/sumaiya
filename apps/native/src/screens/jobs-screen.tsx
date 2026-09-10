import React, { useCallback, useMemo, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Animated, { FadeIn } from "react-native-reanimated";
import type { JobListing, JobRecommendation } from "@sumaiya/api-client";
import { apiClient } from "../lib/api-client";
import { useLang } from "../lib/i18n";
import { Button, EmptyState, Screen, ScreenTitle, SectionHeader, SkeletonCard, Stagger, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";
import type { JobsScreenProps } from "../navigation/types";

function MatchBadge({ score }: { score: number }) {
  const c = useThemeColors();
  const tone = score >= 60 ? c.success : score >= 35 ? c.warning : c.textMuted;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: tone + "1f", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
      <Icon name="target" size={11} color={tone} />
      <Text style={{ color: tone, fontSize: 11.5, fontWeight: "800" }}>{score}%</Text>
    </View>
  );
}

function JobCard({
  job,
  score,
  reason,
  onTailor,
  onApply,
}: {
  job: JobListing;
  score?: number;
  reason?: string;
  onTailor: () => void;
  onApply: () => void;
}) {
  const c = useThemeColors();
  const { t } = useLang();
  return (
    <View style={{ backgroundColor: c.bgElevated, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 16, gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: c.text, fontSize: 15.5, fontWeight: "800" }} numberOfLines={2}>{job.title}</Text>
          <Text style={{ color: c.textMuted, fontSize: 12.5, marginTop: 2 }} numberOfLines={1}>
            {[job.company, job.location].filter(Boolean).join(" · ")}
          </Text>
        </View>
        {typeof score === "number" ? <MatchBadge score={score} /> : null}
      </View>
      {reason ? <Text style={{ color: c.textBody, fontSize: 12.5 }} numberOfLines={2}>{reason}</Text> : null}
      <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
        <View style={{ flex: 1 }}>
          <Button label={t("Tailor my CV", "Lenga CV yangu")} size="sm" variant="secondary" onPress={onTailor} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label={t("Apply", "Omba")} size="sm" onPress={onApply} />
        </View>
      </View>
    </View>
  );
}

export function JobsScreen({ navigation }: JobsScreenProps) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const [recs, setRecs] = useState<JobRecommendation[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, j] = await Promise.all([apiClient.getJobRecommendations(8), apiClient.getJobs()]);
      setRecs(r);
      setJobs(j);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  const recIds = useMemo(() => new Set(recs.map((r) => r.jobId)), [recs]);
  const rest = useMemo(() => jobs.filter((j) => !recIds.has(j.id)), [jobs, recIds]);

  const tailor = (job: JobListing) => {
    haptics.selection();
    navigation.navigate("JobApply", { jd: `${job.title}\n${job.company}\n\n${job.description}`.slice(0, 6000) });
  };
  const apply = (job: JobListing) => {
    haptics.selection();
    if (job.applyUrl) Linking.openURL(job.applyUrl).catch(() => {});
  };

  return (
    <Screen scroll keyboardAvoiding={false} contentContainerStyle={{ gap: 20 }} refreshing={refreshing} onRefresh={onRefresh}>
      <ScreenTitle eyebrow={t("Jobs", "Kazi")}>{t("Openings for you", "Nafasi kwako")}</ScreenTitle>

      {loading ? (
        <View style={{ gap: 10 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : recs.length === 0 && jobs.length === 0 ? (
        <EmptyState
          icon="briefcase"
          title={t("No openings right now", "Hakuna nafasi kwa sasa")}
          body={t("New listings are pulled in daily. Check back soon, or paste a job link in Sumaiya to tailor your CV to it.", "Nafasi mpya zinaingizwa kila siku. Rudi hivi karibuni, au bandika link ya kazi kwa Sumaiya ulenge CV yako.")}
          actionLabel={t("Ask Sumaiya", "Uliza Sumaiya")}
          onAction={() => navigation.navigate("JobApply")}
        />
      ) : (
        <>
          {recs.length > 0 ? (
            <Animated.View entering={FadeIn.duration(300)}>
              <SectionHeader title={t("Matched to your profile", "Zinazoendana na wasifu wako")} />
              <View style={{ gap: 12 }}>
                {recs.map((r, i) => (
                  <Stagger key={r.jobId} index={i}>
                    <JobCard
                      job={r.job}
                      score={r.score}
                      reason={r.reason}
                      onTailor={() => tailor(r.job)}
                      onApply={() => apply(r.job)}
                    />
                  </Stagger>
                ))}
              </View>
            </Animated.View>
          ) : (
            <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start", padding: 14, borderRadius: 14, backgroundColor: c.accent + "10", borderWidth: 1, borderColor: c.accent + "24" }}>
              <Icon name="target" size={16} color={c.accent} />
              <Text style={{ flex: 1, color: c.textBody, fontSize: 12.5, lineHeight: 18 }}>
                {t("Finish your profile and Sumaiya will match you to the closest openings — with a fit score.", "Kamilisha wasifu wako na Sumaiya atakuunganisha na nafasi zinazokufaa zaidi — pamoja na alama ya ulinganifu.")}
              </Text>
            </View>
          )}

          {rest.length > 0 ? (
            <View>
              <SectionHeader title={t("All openings", "Nafasi zote")} />
              <View style={{ gap: 12 }}>
                {rest.slice(0, 40).map((j, i) => (
                  <Stagger key={j.id} index={i}>
                    <JobCard job={j} onTailor={() => tailor(j)} onApply={() => apply(j)} />
                  </Stagger>
                ))}
              </View>
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}
