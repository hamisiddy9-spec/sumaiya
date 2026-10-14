import React, { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { CVData } from "@sumaiya/types";
import { isEmptyCv } from "@sumaiya/utils/cv-shape";
import { Button, Card, Screen, ScreenTitle, haptics, toast, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";
import { closingLabel } from "../lib/deadline";
import { isExpiredListing } from "../lib/job-listing";
import { confirmAndOpenUrl } from "../lib/external-link";
import { createApplication } from "../lib/applications-store";
import { useCvs } from "../hooks/use-cvs";
import { track } from "../lib/telemetry";
import { FUNNEL_EVENTS } from "../lib/analytics";
import { useLang } from "../lib/i18n";
import {
  FONT,
  JOBS_SPACING,
  JobMatchCard,
  advertBullets,
  matchViewFor,
  postedLine,
  salaryView,
} from "../components/jobs";
import type { JobDetailScreenProps } from "../navigation/types";

/**
 * The advert behind a job card — B5.
 *
 * The design's page, top to bottom: back with `Hifadhi` beside it, the role and
 * who is hiring, the mono chips, the match card, the responsibilities, and a
 * footer with the two real actions. That is the whole screen, and every part of
 * it is a fact the app already had: the match is the device engine's own output
 * (`matchJd`, through `matchViewFor`), the responsibilities are the advert's
 * own sentences (advertBullets), the chips are fields on the listing.
 *
 * ONE THING THE DESIGN DRAWS THAT THIS SCREEN MUST NOT: the second chip in the
 * fragment reads `TZS 1,800,000 - 2,500,000`. `JobListing` has no salary field
 * — that is the sample advert's prose, and printing a range the API never
 * returned to a user deciding whether to apply is the invented number §10
 * forbids. The chip row therefore carries the listing's real fields (employment
 * type, category, source) and the closing date the feed already filters by.
 */
export function JobDetailScreen({ navigation, route }: JobDetailScreenProps) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const { cvs } = useCvs();
  const { job, score, reason } = route.params;
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const closing = closingLabel(job.applicationDeadline, lang);
  const closed = isExpiredListing(job.applicationDeadline);

  /** Same source and same rule as the feed: newest CV with real content. */
  const cvData: CVData | null = useMemo(() => {
    const withContent = cvs.find((cv) => !isEmptyCv(cv.data));
    return (withContent ?? cvs[0])?.data ?? null;
  }, [cvs]);

  // The number shown here is the one the card showed when it exists, and the
  // engine's own when it does not — never a default.
  const view = useMemo(
    () => matchViewFor(job, { lang, cvData, serverScore: score, serverReason: reason }),
    [job, lang, cvData, score, reason],
  );

  const duties = useMemo(() => advertBullets(job.description, 40), [job.description]);

  const tailor = () => {
    haptics.selection();
    navigation.navigate("JobApply", {
      jd: `${job.title}\n${job.company}\n\n${job.description}`.slice(0, 6000),
    });
  };

  // Unlike tailor() above, this carries the whole listing — not a sliced jd
  // string — so JobApply's "Keep this as an application" has the company,
  // location and apply link an Application needs, not just the description.
  const startApplication = () => {
    haptics.selection();
    navigation.navigate("JobApply", { job });
  };

  // The design's `Hifadhi`, and the birth path the feed used to carry: a saved
  // job becomes an Application on the phone, no tailoring and no account
  // required (lib/applications-store.ts).
  const save = useCallback(async () => {
    if (saved || saving) return;
    setSaving(true);
    haptics.selection();
    try {
      await createApplication({
        company: job.company,
        role: job.title,
        location: job.location || undefined,
        jobDescription: job.description || undefined,
        jobUrl: job.applyUrl || undefined,
        status: "saved",
      });
      const props = { via: "advert", has_jd: Boolean(job.description), has_cv: Boolean(cvData), guest: false };
      track("application.created", props);
      track(FUNNEL_EVENTS.applicationCreated, props);
      toast.show(t("Saved to your applications", "Imehifadhiwa kwenye maombi yako"));
      setSaved(true);
    } catch {
      haptics.error();
      toast.show(t("Couldn't save", "Imeshindwa kuhifadhi"));
    } finally {
      setSaving(false);
    }
  }, [saved, saving, job, cvData, t]);

  const meta = [job.employmentType, job.category, job.jobLevel].filter(Boolean) as string[];
  // The source's pay, and when it says the advert went up. Both render only
  // when the listing actually carries them.
  const pay = salaryView(job, lang);
  const when = postedLine(job, lang);
  const closingSoon = job.status === "expiring";
  const postedFull = job.postedAt
    ? new Date(job.postedAt).toLocaleDateString(lang === "sw" ? "sw-TZ" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Screen
      scroll
      footer={
        <View style={{ gap: 8 }}>
          {/* The design's primary: the app's real value-add is tailoring the CV
              to this advert, so that is the filled action. */}
          <Button label={t("Build a CV for this job", "Tengeneza CV kwa Kazi Hii")} onPress={tailor} />
          <Button
            label={t("Apply directly (send my existing CV)", "Omba Moja kwa Moja (Tuma Wasifu Uliopo)")}
            variant="secondary"
            onPress={startApplication}
          />
        </View>
      }
    >
      <Animated.View entering={FadeInDown.duration(280)}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Back", "Rudi")}
            onPress={() => { haptics.selection(); navigation.goBack(); }}
            hitSlop={10}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, minHeight: JOBS_SPACING.minTarget }}
          >
            <Icon name="arrow-left" size={16} color={c.textMuted} />
            <Text style={{ color: c.textMuted, fontSize: 12.5 }}>{t("Back", "Rudi")}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: saved }}
            accessibilityLabel={saved ? t("Saved", "Imehifadhiwa") : t("Save this job", "Hifadhi kazi hii")}
            onPress={() => void save()}
            disabled={saved || saving}
            hitSlop={8}
            style={{
              minHeight: JOBS_SPACING.minTarget,
              justifyContent: "center",
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: saved ? c.border : c.accent,
              backgroundColor: saved ? c.bgElevated : undefined,
            }}
          >
            <Text style={{ color: saved ? c.textMuted : c.accent, fontSize: 12, fontFamily: FONT.mono }}>
              {saved ? t("Saved", "Imehifadhiwa") : t("Save", "Hifadhi")}
            </Text>
          </Pressable>
        </View>

        <ScreenTitle eyebrow={job.company}>{job.title}</ScreenTitle>
        <Text style={{ color: c.textBody, fontSize: 13.5, marginTop: 2 }}>
          {[job.company, job.location].filter(Boolean).join(" • ")}
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10, marginBottom: 16 }}>
          {meta.map((m) => (
            <Chip key={m} label={m} />
          ))}
          {/* The pay chip the design draws — now carrying the source's real
              range instead of the fragment's sample advert text. */}
          {pay ? <Chip label={pay.text} /> : null}
          {closing ? (
            <Chip label={`${t("Closes", "Inaisha")} ${closing}`} tone={closed ? c.error : c.accent} />
          ) : null}
          {closingSoon && !closed ? (
            <Chip label={t("Closing soon", "Inaisha hivi karibuni")} tone={c.accent} />
          ) : null}
        </View>

        {/* The facts this screen used to omit entirely: when the advert went up,
            where it came from, and when it was last confirmed live. A seeker
            deciding whether to spend an afternoon on an application reads these
            first, and every one of them was already in the response. */}
        <Card style={{ marginBottom: 16, gap: 8 }}>
          {when ? (
            <Fact
              label={when.fromSource ? t("Posted", "Imechapishwa") : t("Added to Sumaiya", "Imeingizwa Sumaiya")}
              value={postedFull ? `${postedFull} · ${when.ago}` : when.ago}
            />
          ) : null}
          {job.sourceName ? <Fact label={t("Source", "Chanzo")} value={job.sourceName} /> : null}
          {job.lastVerifiedAt ? (
            <Fact
              label={t("Last checked", "Ilithibitishwa")}
              value={new Date(job.lastVerifiedAt).toLocaleDateString(
                lang === "sw" ? "sw-TZ" : "en-GB",
                { day: "numeric", month: "short", year: "numeric" },
              )}
            />
          ) : null}
        </Card>

        {/* The match, with the engine's own term rows. It is one component on
            purpose: score, reason and findings are one claim, and a screen
            cannot print two of them and drop the third. */}
        <View style={{ marginBottom: 16 }}>
          <JobMatchCard view={view} onBuildCv={tailor} />
        </View>

        {closed ? (
          <Card style={{ marginBottom: 14 }}>
            <Text style={{ color: c.error, fontSize: 12.5, lineHeight: 18 }}>
              {t(
                "This advert has closed — applications sent now may not be read.",
                "Tangazo hili limefungwa — maombi yaliyotumwa sasa yanaweza kutosomwa.",
              )}
            </Text>
          </Card>
        ) : null}

        {/* The advert's own words as the design's list. A listing that arrived
            as one paragraph becomes its sentences; one that arrived empty shows
            nothing rather than a placeholder heading over blank space. */}
        {duties.length > 0 ? (
          <View style={{ gap: 8 }}>
            <Text
              style={{
                color: c.text,
                fontSize: 14,
                fontWeight: "600",
                fontFamily: FONT.display,
              }}
            >
              {t("Main responsibilities", "Majukumu Makuu")}:
            </Text>
            <View style={{ gap: 6 }}>
              {duties.map((line, i) => (
                <View key={`${i}-${line.slice(0, 12)}`} style={{ flexDirection: "row", gap: 8 }}>
                  <Text style={{ color: c.textMuted, fontSize: 13.5, lineHeight: 20 }}>•</Text>
                  <Text style={{ flex: 1, color: c.textBody, fontSize: 13.5, lineHeight: 20 }}>{line}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* The real advert, kept as a link rather than a third button: it is how
            a user actually applies to the employer, and dropping it would leave
            the app's own form as the only route. */}
        {job.applyUrl ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => confirmAndOpenUrl(job.applyUrl, t)}
            hitSlop={8}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18, minHeight: JOBS_SPACING.minTarget }}
          >
            <Icon name="external-link" size={15} color={c.accent} />
            <Text style={{ color: c.accent, fontSize: 13, fontWeight: "700" }}>
              {t("Open the advert in your browser", "Fungua tangazo kwenye kivinjari")}
            </Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </Screen>
  );
}

/** One "label — value" row in the advert's facts card. */
function Fact({ label, value }: { label: string; value: string }) {
  const c = useThemeColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
      <Text style={{ color: c.textMuted, fontSize: 11.5, minWidth: 116 }}>{label}</Text>
      <Text style={{ flex: 1, color: c.text, fontSize: 12.5, fontFamily: FONT.mono }}>{value}</Text>
    </View>
  );
}

function Chip({ label, tone }: { label: string; tone?: string }) {
  const c = useThemeColors();
  return (
    <View
      style={{
        backgroundColor: c.bgSunken,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <Text style={{ color: tone ?? c.textMuted, fontSize: 11.5, fontFamily: FONT.mono }}>{label}</Text>
    </View>
  );
}
