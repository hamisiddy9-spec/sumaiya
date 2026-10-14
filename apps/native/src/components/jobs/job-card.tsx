import React from "react";
import { Text, View } from "react-native";
import type { JobListing } from "@sumaiya/api-client";
import { Card, useThemeColors } from "../ui";
import { useLang } from "../../lib/i18n";
import { FONT, JOBS_SPACING } from "./tokens";
import { bandColor, postedAgo, scoreBand, type JobMatch } from "./job-labels";

/**
 * One card in the Jobs feed — B4.
 *
 * The design's card is exactly four things: the role and where it is, a match
 * score in JetBrains Mono, the one-line reason it matched, and a footer that
 * pairs when it was posted with `Tazama Tangazo →`. The whole card is the
 * control that opens the advert (the tap target is the card, so the footer's
 * arrow is an affordance and not a 12 px button).
 *
 * WHY THE REASON IS NOT OPTIONAL: `match` is ONE value carrying both the score
 * and its reason (`JobMatch`, see `job-labels.ts`), so this component cannot
 * be handed a number without the sentence that explains it. A listing with no
 * score is passed no `match` at all and the card omits the whole match block —
 * brief §5, and the design's own rule: never a placeholder score.
 *
 * The one colour decision: §6 says the fragment's `emerald-*` / `amber-*` are a
 * mockup artefact, not tokens. The score's colour is therefore the app's own
 * band (`scoreBand`) resolved through `useThemeColors()`, so it is identical on
 * Home, in the feed and on the advert, and it flips with `Hali ya giza`.
 */
export function JobCard({
  job,
  match,
  onOpen,
}: {
  job: JobListing;
  /** Absent = no engine could score this listing. Never a placeholder. */
  match?: JobMatch;
  onOpen: () => void;
}) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const where = [job.company, job.location].filter(Boolean).join(" · ");
  const posted = postedAgo(job.createdAt, lang);
  const tone = match ? bandColor(scoreBand(match.score), c) : null;
  // A strong match gets the design's ember-tinted reason block; anything below
  // the app's strong band gets the neutral one. One rule, both themes.
  const strong = match ? match.score >= 60 : false;

  return (
    <Card
      onPress={onOpen}
      padded={false}
      accessibilityLabel={
        [job.title, where, match ? `${match.score}%. ${match.reason}` : null]
          .filter(Boolean)
          .join(". ")
      }
      style={{
        padding: JOBS_SPACING.cardPad,
        gap: 10,
        backgroundColor: c.bgElevated,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          {/* Two lines, not one: §8 holds at 200 % text scale, and a clamped
              line is what breaks there. */}
          <Text
            numberOfLines={2}
            style={{ color: c.text, fontSize: 16.5, lineHeight: 22, fontFamily: FONT.bold }}
          >
            {job.title}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              color: c.textMuted,
              fontSize: 12.5,
              lineHeight: 17,
              marginTop: 3,
              fontFamily: FONT.regular,
            }}
          >
            {where}
          </Text>
        </View>

        {match && tone ? (
          <View
            style={{
              flexShrink: 0,
              backgroundColor: tone + "1f",
              borderWidth: 1,
              borderColor: tone + "40",
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: tone, fontSize: 12.5, fontFamily: FONT.mono }}>
              {match.score}%
            </Text>
          </View>
        ) : null}
      </View>

      {/* `Sababu ya kulingana:` — mandatory beside a score. */}
      {match ? (
        <View
          style={{
            backgroundColor: strong ? c.accentTint : c.bgSunken,
            borderWidth: 1,
            borderColor: strong ? c.accent + "33" : c.border,
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 8,
          }}
        >
          <Text
            style={{
              color: strong ? c.accent : c.textBody,
              fontSize: 12.5,
              lineHeight: 18,
              fontFamily: FONT.regular,
            }}
          >
            <Text style={{ fontFamily: FONT.semibold, color: strong ? c.accent : c.text }}>
              {t("Why it matches", "Sababu ya kulingana")}:{" "}
            </Text>
            {match.reason}
          </Text>
        </View>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          paddingTop: 2,
        }}
      >
        {/* No `createdAt` = the app does not know when it was posted, and this
            line is a fact, not decoration. */}
        {posted ? (
          <Text style={{ color: c.textMuted, fontSize: 11, fontFamily: FONT.mono }}>
            {t("Posted", "Imepostiwa")} {posted}
          </Text>
        ) : (
          <View />
        )}
        <Text style={{ color: c.accent, fontSize: 11.5, fontFamily: FONT.mono }}>
          {t("See the advert →", "Tazama Tangazo →")}
        </Text>
      </View>
    </Card>
  );
}
