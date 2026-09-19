import React, { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Animated, { FadeIn } from "react-native-reanimated";
import type { JobListing, JobRecommendation } from "@sumaiya/api-client";
import { apiClient } from "../lib/api-client";
import { useLang } from "../lib/i18n";
import { Button, EmptyState, Screen, ScreenTitle, SectionHeader, SkeletonCard, Stagger, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";
import { confirmAndOpenUrl } from "../lib/external-link";
import { isExpiredListing } from "../lib/job-listing";
import { reportError } from "../lib/reporting";
import { track } from "../lib/analytics";
import type { JobsScreenProps } from "../navigation/types";

interface FeedJob extends JobListing {
  matchScore?: number;
  matchReason?: string;
}

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
          {/* Tailoring is the app's real value-add over just browsing a
              listing, so it gets the filled primary treatment; opening the
              advert is the secondary action here. */}
          <Button label={t("Tailor my CV", "Lenga CV yangu")} size="sm" onPress={onTailor} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label={t("Open the advert", "Fungua tangazo")} size="sm" variant="secondary" onPress={onApply} />
        </View>
      </View>
    </View>
  );
}

export function JobsScreen({ navigation }: JobsScreenProps) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const [feedJobs, setFeedJobs] = useState<FeedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      // Fetch personalized job feed from the new endpoint
      // Falls back to local data if offline
      const response = await fetch("/api/jobs/feed?limit=20&minScore=50");
      if (!response.ok) {
        // Fall back to old endpoints if feed endpoint not available
        const [r, j] = await Promise.all([apiClient.getJobRecommendations(8), apiClient.getJobs()]);
        const recs = r.filter((rec) => !isExpiredListing(rec.job.applicationDeadline));
        const jobs = j.filter((job) => !isExpiredListing(job.applicationDeadline));

        // Combine: recommendations first, then other jobs
        const combined: FeedJob[] = [
          ...recs.map(rec => ({ ...rec.job, matchScore: rec.score, matchReason: rec.reason })),
          ...jobs.filter(j => !recs.some(r => r.job.id === j.id)),
        ];
        setFeedJobs(combined);
      } else {
        const data = await response.json();
        if (data.data) {
          setFeedJobs(data.data.filter((job: FeedJob) => !isExpiredListing(job.applicationDeadline)));
        }
      }
      setError(false);
      track("jobs_loaded", { count: feedJobs.length });
    } catch (err) {
      setError(true);
      reportError(err);
      track("jobs_load_error");
    } finally {
      setLoading(false);
    }
  }, [feedJobs.length]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  const tailor = (job: JobListing) => {
    haptics.selection();
    track("job_tailor_started", { jobId: job.id });
    navigation.navigate("JobApply", { jd: `${job.title}\n${job.company}\n\n${job.description}`.slice(0, 6000) });
  };
  const apply = (job: JobListing) => {
    if (job.applyUrl) {
      track("job_apply_clicked", { jobId: job.id });
      confirmAndOpenUrl(job.applyUrl, t);
    }
  };

  return (
    <Screen scroll keyboardAvoiding={false} contentContainerStyle={{ gap: 20 }} refreshing={refreshing} onRefresh={onRefresh}>
      <ScreenTitle eyebrow={t("Jobs", "Ajira")}>{t("Personalized for you", "Inaokufaa zaidi")}</ScreenTitle>

      {loading ? (
        <View style={{ gap: 10 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : error && feedJobs.length === 0 ? (
        <EmptyState
          icon="wifi-off"
          title={t("Couldn't load jobs", "Imeshindwa kupakia ajira")}
          body={t("Check your connection and try again.", "Angalia mtandao wako kisha ujaribu tena.")}
          actionLabel={t("Retry", "Jaribu tena")}
          onAction={() => void load()}
        />
      ) : feedJobs.length === 0 ? (
        <EmptyState
          icon="briefcase"
          title={t("No openings right now", "Hakuna nafasi kwa sasa")}
          body={t("New listings are pulled in daily. Check back soon, or paste a job link and I'll tailor your CV to it.", "Nafasi mpya zinaingizwa kila siku. Rudi hivi karibuni, au bandika link ya ajira nikutengenezee CV iliyolengwa.")}
          actionLabel={t("Ask me", "Niulize")}
          onAction={() => navigation.navigate("JobApply")}
        />
      ) : (
        <Animated.View entering={FadeIn.duration(300)} style={{ gap: 12 }}>
          {feedJobs.map((job, i) => (
            <Stagger key={job.id} index={i}>
              <JobCard
                job={job}
                score={job.matchScore}
                reason={job.matchReason}
                onTailor={() => tailor(job)}
                onApply={() => apply(job)}
              />
            </Stagger>
          ))}
        </Animated.View>
      )}
    </Screen>
  );
}
