import React, { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Animated, { FadeIn } from "react-native-reanimated";
import type { JobListing, JobRecommendation } from "@sumaiya/api-client";
import { apiClient } from "../lib/api-client";
import { useLang } from "../lib/i18n";
import { Button, Card, EmptyState, Screen, ScreenTitle, SectionHeader, SkeletonList, Stagger, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";
import { confirmAndOpenUrl } from "../lib/external-link";
import { isExpiredListing } from "../lib/job-listing";
import { closingLabel } from "../lib/deadline";
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
  onOpen,
}: {
  job: JobListing;
  score?: number;
  reason?: string;
  onTailor: () => void;
  onApply: () => void;
  onOpen: () => void;
}) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const closing = closingLabel(job.applicationDeadline, lang);
  return (
    /* The card body is a real control now, not a View that looked like one.
       Measured on the device against 1.6.24: the only clickable nodes on this
       screen were the two buttons and the tab bar, so a user tapping the card
       — the same shape every other tappable card in the app has — got nothing
       back. It opens the advert it is showing, and says so. */
    <Card
      onPress={onOpen}
      accessibilityLabel={`${job.title}. ${t("See the full advert", "Ona tangazo kamili")}`}
      style={{ gap: 10 }}
    >
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
      {/* The deadline decides whether this is worth doing today, and the feed
          has always used it to filter — the card just never said it. */}
      {closing ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Icon name="calendar-clock" size={13} color={c.textMuted} />
          <Text style={{ color: c.textMuted, fontSize: 12 }}>
            {t("Apply by", "Mwisho wa maombi")} — <Text style={{ color: c.textBody, fontWeight: "700" }}>{closing}</Text>
          </Text>
        </View>
      ) : null}
      <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
        <View style={{ flex: 1 }}>
          {/* Tailoring is the app's real value-add over just browsing a
              listing, so it gets the filled primary treatment; opening the
              advert is the secondary action here. */}
          <Button label={t("Tailor my CV", "Lenga CV yako")} size="sm" onPress={onTailor} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label={t("Open the advert", "Fungua tangazo")} size="sm" variant="secondary" onPress={onApply} />
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 2, justifyContent: "flex-end" }}>
        <Text style={{ color: c.accent, fontSize: 12.5, fontWeight: "800" }}>
          {t("See the full advert", "Ona tangazo kamili")}
        </Text>
        <Icon name="chevron-right" size={16} color={c.accent} />
      </View>
    </Card>
  );
}

export function JobsScreen({ navigation }: JobsScreenProps) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const [recs, setRecs] = useState<JobRecommendation[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, j] = await Promise.all([apiClient.getJobRecommendations(8), apiClient.getJobs()]);
      // A listing past its own applicationDeadline was still being
      // recommended, and the CTA walked the user straight to a dead advert
      // (confirmed on device: HTTP 410 "Applications closed").
      setRecs(r.filter((rec) => !isExpiredListing(rec.job.applicationDeadline)));
      setJobs(j.filter((job) => !isExpiredListing(job.applicationDeadline)));
      setError(false);
    } catch {
      // The old code had no catch here at all: an offline/API failure was an
      // unhandled promise rejection, and either way the empty-lists state
      // would render "No openings right now" — indistinguishable from a
      // genuinely empty feed, with no way to tell the user it actually
      // failed or let them retry.
      setError(true);
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
    if (job.applyUrl) confirmAndOpenUrl(job.applyUrl, t);
  };
  // The card's own route. A tap on the card body used to do nothing at all.
  const open = (job: JobListing, score?: number, reason?: string) => {
    navigation.navigate("JobDetail", { job, score, reason });
  };

  return (
    <Screen scroll keyboardAvoiding={false} contentContainerStyle={{ gap: 20 }} refreshing={refreshing} onRefresh={onRefresh}>
      {/* Owner's instruction, verbatim: "toa kwako nafasi za kazi is enough" —
          the "kwako" is gone. It also stops the label promising a personalisation
          the feed does not do (job_recommendation has 0 rows for every user). */}
      <ScreenTitle eyebrow={t("Jobs", "Ajira")}>{t("Openings", "Nafasi za kazi")}</ScreenTitle>

      {loading ? (
        <SkeletonList count={3} gap={10} />
      ) : error && recs.length === 0 && jobs.length === 0 ? (
        <EmptyState
          icon="wifi-off"
          title={t("Couldn't load jobs", "Imeshindwa kupakia ajira")}
          body={t("Check your connection and try again.", "Angalia mtandao wako kisha ujaribu tena.")}
          actionLabel={t("Retry", "Jaribu tena")}
          onAction={() => void load()}
        />
      ) : recs.length === 0 && jobs.length === 0 ? (
        <EmptyState
          icon="briefcase"
          title={t("No openings right now", "Hakuna nafasi za kazi kwa sasa")}
          body={t("New listings are pulled in daily. Check back soon, or paste a job link and I'll tailor your CV to it.", "Nafasi mpya za kazi zinaingizwa kila siku. Rudi hivi karibuni, au bandika kiungo cha ajira nikutengenezee CV iliyolengwa.")}
          actionLabel={t("Ask me", "Niulize")}
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
                      onOpen={() => open(r.job, r.score, r.reason)}
                    />
                  </Stagger>
                ))}
              </View>
            </Animated.View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => { haptics.selection(); navigation.navigate("ProfileTab", { screen: "CareerProfile" }); }}
              style={{ flexDirection: "row", gap: 12, alignItems: "center", padding: 16, borderRadius: 14, backgroundColor: c.accent + "10", borderWidth: 1, borderColor: c.accent + "24" }}
            >
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: c.accent + "1f", alignItems: "center", justifyContent: "center" }}>
                <Icon name="target" size={18} color={c.accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: c.text, fontSize: 14.5, fontWeight: "800" }}>
                  {t("Add your first job to get matched", "Ongeza kazi yako ya kwanza upate ulinganifu")}
                </Text>
                <Text style={{ color: c.textMuted, fontSize: 12.5, lineHeight: 18, marginTop: 2 }}>
                  {t("Finish your profile and I'll match you to the closest openings — with a fit score.", "Kamilisha wasifu wako nami nikuunganishe na nafasi za kazi zinazokufaa zaidi — pamoja na alama ya ulinganifu.")}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                <Text style={{ color: c.accent, fontSize: 12.5, fontWeight: "800" }}>{t("Finish profile", "Kamilisha wasifu")}</Text>
                <Icon name="chevron-right" size={18} color={c.accent} />
              </View>
            </Pressable>
          )}

          {rest.length > 0 ? (
            <View>
              <SectionHeader title={t("All openings", "Nafasi zote za kazi")} />
              <View style={{ gap: 12 }}>
                {rest.slice(0, 40).map((j, i) => (
                  <Stagger key={j.id} index={i}>
                    <JobCard job={j} onTailor={() => tailor(j)} onApply={() => apply(j)} onOpen={() => open(j)} />
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
