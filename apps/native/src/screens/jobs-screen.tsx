import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Animated, { FadeIn } from "react-native-reanimated";
import type { JobListing, JobRecommendation } from "@sumaiya/api-client";
import type { CVData } from "@sumaiya/types";
import { isEmptyCv } from "@sumaiya/utils/cv-shape";
import { apiClient } from "../lib/api-client";
import { useCvs } from "../hooks/use-cvs";
import { useLang } from "../lib/i18n";
import {
  EmptyState,
  Screen,
  ScreenTitle,
  SectionHeader,
  SkeletonList,
  Stagger,
  haptics,
  useThemeColors,
} from "../components/ui";
import { Icon } from "../components/icon";
import { isExpiredListing } from "../lib/job-listing";
import { useAuthContext } from "../contexts/auth-context";
import {
  FONT,
  JOB_FILTERS,
  JOBS_SPACING,
  JobCard,
  matchViewFor,
  matchesFilter,
  matchesQuery,
  type JobFilterKey,
  type MatchView,
} from "../components/jobs";
import type { JobsScreenProps } from "../navigation/types";

/**
 * The feed — B4.
 *
 * The design's screen is four things above the fold: the title with its mono
 * reach line, a real search field, the four filter chips, then the cards. The
 * card itself is four things: the role and where it is, the match score in
 * JetBrains Mono, the reason it matched, and a footer pairing when it was
 * posted with `Tazama Tangazo →`. Everything the card does is open the advert
 * — B5 is where the actions live (tailor, save, apply), which is why this
 * screen no longer carries three buttons per card.
 *
 * WHERE THE MATCH COMES FROM: `matchViewFor` in `components/jobs` and nothing
 * else. It prefers a server score when the recommendation payload has one and
 * falls back to the on-device engine, and it returns a union that cannot
 * express "a number with no reason". A listing nothing has scored gets no
 * badge at all — never a placeholder, never `?? 0`.
 *
 * The filter and search are real: `matchesFilter` reads the listing's own
 * location (an unknown location matches `Zote` only — it is never guessed into
 * a city), and `matchesQuery` searches the three fields the placeholder names.
 */
export function JobsScreen({ navigation }: JobsScreenProps) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const { user } = useAuthContext();
  const { cvs } = useCvs();
  const isGuest = !user;
  const [recs, setRecs] = useState<JobRecommendation[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<JobFilterKey>("all");

  /**
   * The CV the device engine scores adverts against. Newest first, and the
   * first one with real content wins: scoring a job against an empty draft
   * would produce a low number that says nothing about the user, and §10
   * forbids showing a number that is not actionable. No CV at all is a
   * legitimate state (`null`) — the cards then show no match, and B5 says why.
   */
  const cvData: CVData | null = useMemo(() => {
    const withContent = cvs.find((cv) => !isEmptyCv(cv.data));
    return (withContent ?? cvs[0])?.data ?? null;
  }, [cvs]);

  const load = useCallback(async () => {
    try {
      // getJobRecommendations is /api/jobs/recommendations, which 401s with no
      // session — a guest hitting it inside this Promise.all would fail the
      // WHOLE load (including the public /api/jobs feed) and show "Couldn't
      // load jobs" to someone who never asked for a match, just a feed.
      const [r, j] = await Promise.all([
        isGuest ? Promise.resolve<JobRecommendation[]>([]) : apiClient.getJobRecommendations(8),
        apiClient.getJobs(),
      ]);
      // A listing past its own applicationDeadline was still being
      // recommended, and the CTA walked the user straight to a dead advert
      // (confirmed on device: HTTP 410 "Applications closed").
      setRecs(r.filter((rec) => !isExpiredListing(rec.job.applicationDeadline)));
      setJobs(j.filter((job) => !isExpiredListing(job.applicationDeadline)));
      setError(false);
    } catch {
      // An offline/API failure is not an empty feed: without this the screen
      // rendered "No openings right now" — indistinguishable from a genuinely
      // empty list, with no way to tell the user it actually failed.
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [isGuest]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  const recIds = useMemo(() => new Set(recs.map((r) => r.jobId)), [recs]);
  const visible = useCallback(
    (job: JobListing) => matchesFilter(job, filter) && matchesQuery(job, query),
    [filter, query],
  );
  const shownRecs = useMemo(() => recs.filter((r) => visible(r.job)), [recs, visible]);
  const rest = useMemo(
    () => jobs.filter((j) => !recIds.has(j.id)).filter(visible),
    [jobs, recIds, visible],
  );
  const hiddenByFilter = recs.length + jobs.length > 0 && shownRecs.length === 0 && rest.length === 0;

  // The card's own route. A tap on the card body used to do nothing at all.
  // The match travels as params only when it is a real one, so the advert shows
  // the same number the card did — and recomputes it if it arrives without.
  const open = useCallback(
    (job: JobListing, view: MatchView) => {
      haptics.selection();
      navigation.navigate("JobDetail", {
        job,
        score: view.state === "scored" ? view.match.score : undefined,
        reason: view.state === "scored" ? view.match.reason : undefined,
      });
    },
    [navigation],
  );

  return (
    <Screen scroll keyboardAvoiding={false} contentContainerStyle={{ gap: 20 }} refreshing={refreshing} onRefresh={onRefresh}>
      {/* Owner's instruction, verbatim: "toa kwako nafasi za kazi is enough" —
          the "kwako" is gone. It also stops the label promising a
          personalisation the feed does not do (job_recommendation has 0 rows
          for every user). The design's mono line on the right names where the
          feed reaches, which is a fact about the listings, not a promise. */}
      <View style={{ gap: 4 }}>
        <ScreenTitle eyebrow={t("Jobs", "Ajira")}>{t("Openings", "Nafasi za kazi")}</ScreenTitle>
        <Text style={{ color: c.textMuted, fontSize: 12, fontFamily: FONT.mono }}>
          {t("Tanzania • Gulf", "Tanzania • Ghuba")}
        </Text>
      </View>

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
          {/* A real control now, at the design's 44 dp: the app's search used
              to be the phone keyboard against a list the user could not
              narrow. */}
          <View style={{ gap: 12 }}>
            <View style={{ justifyContent: "center" }}>
              <View style={{ position: "absolute", left: 13, zIndex: 1 }} pointerEvents="none">
                <Icon name="search" size={16} color={c.textMuted} />
              </View>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t("Search a role or company...", "Tafuta cheo au kampuni...")}
                placeholderTextColor={c.textMuted}
                accessibilityLabel={t("Search jobs", "Tafuta kazi")}
                returnKeyType="search"
                autoCorrect={false}
                style={{
                  height: JOBS_SPACING.minTarget,
                  backgroundColor: c.bgSunken,
                  borderWidth: 1,
                  borderColor: c.border,
                  borderRadius: 12,
                  paddingLeft: 40,
                  paddingRight: 14,
                  color: c.text,
                  fontSize: 13,
                  fontFamily: FONT.regular,
                }}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: JOBS_SPACING.chipGap, alignItems: "center" }}
              style={{ flexGrow: 0 }}
            >
              {JOB_FILTERS.map((f) => {
                const active = f.key === filter;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => { haptics.selection(); setFilter(f.key); }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={lang === "sw" ? f.sw : f.en}
                    style={{
                      minHeight: 36,
                      justifyContent: "center",
                      paddingHorizontal: 14,
                      borderRadius: 999,
                      backgroundColor: active ? c.accent : c.bgElevated,
                      borderWidth: 1,
                      borderColor: active ? c.accent : c.border,
                    }}
                  >
                    <Text
                      style={{
                        color: active ? c.accentText : c.textBody,
                        fontSize: 12.5,
                        fontWeight: "600",
                      }}
                    >
                      {lang === "sw" ? f.sw : f.en}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {shownRecs.length > 0 ? (
            <Animated.View entering={FadeIn.duration(300)}>
              <SectionHeader title={t("Matched to your profile", "Zinazoendana na wasifu wako")} />
              <View style={{ gap: JOBS_SPACING.cardGap }}>
                {shownRecs.map((r, i) => {
                  const view = matchViewFor(r.job, {
                    lang,
                    cvData,
                    serverScore: r.score,
                    serverReason: r.reason,
                  });
                  return (
                    <Stagger key={r.jobId} index={i}>
                      <JobCard
                        job={r.job}
                        match={view.state === "scored" ? view.match : undefined}
                        onOpen={() => open(r.job, view)}
                      />
                    </Stagger>
                  );
                })}
              </View>
            </Animated.View>
          ) : recs.length === 0 && jobs.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => { haptics.selection(); void onRefresh(); }}
              style={{ flexDirection: "row", gap: 12, alignItems: "center", padding: 16, borderRadius: 14, backgroundColor: c.accentTint, borderWidth: 1, borderColor: c.border }}
            >
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: c.accentTint, alignItems: "center", justifyContent: "center" }}>
                <Icon name="target" size={18} color={c.accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: c.text, fontSize: 14.5, fontWeight: "800" }}>
                  {t("Nothing matched — tap to search again", "Hakuna kilicholingana — gusa kutafuta tena")}
                </Text>
                <Text style={{ color: c.textBody, fontSize: 12.5, lineHeight: 18, marginTop: 2 }}>
                  {t("Finish your profile and I'll match you to the closest openings — with a fit score.", "Kamilisha wasifu wako nami nikuunganishe na nafasi za kazi zinazokufaa zaidi — pamoja na alama ya ulinganifu.")}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                <Text style={{ color: c.accent, fontSize: 12.5, fontWeight: "800" }}>{t("Finish profile", "Kamilisha wasifu")}</Text>
                <Icon name="chevron-right" size={18} color={c.accent} />
              </View>
            </Pressable>
          ) : null}

          {rest.length > 0 ? (
            <View>
              <SectionHeader title={t("All openings", "Nafasi zote za kazi")} />
              <View style={{ gap: JOBS_SPACING.cardGap }}>
                {rest.slice(0, 40).map((j, i) => {
                  const view = matchViewFor(j, { lang, cvData });
                  return (
                    <Stagger key={j.id} index={i}>
                      <JobCard
                        job={j}
                        match={view.state === "scored" ? view.match : undefined}
                        onOpen={() => open(j, view)}
                      />
                    </Stagger>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* A filter that hides everything is a state, not an empty feed: the
              user narrowed it, so the screen says so and offers the way back
              rather than claiming there are no openings in the country. */}
          {hiddenByFilter ? (
            <EmptyState
              icon="briefcase"
              title={t("Nothing matches that filter", "Hakuna kinacholingana na kichujio hicho")}
              body={t("Try another city, or clear the search.", "Jaribu mji mwingine, au futa utafutaji.")}
              actionLabel={t("Show all", "Onyesha zote")}
              onAction={() => { setFilter("all"); setQuery(""); }}
            />
          ) : null}
        </>
      )}
    </Screen>
  );
}
