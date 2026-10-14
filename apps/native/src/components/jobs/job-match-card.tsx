import React from "react";
import { Pressable, Text, View } from "react-native";
import { Card, useThemeColors } from "../ui";
import { useLang } from "../../lib/i18n";
import { FONT, JOBS_SPACING } from "./tokens";
import { bandColor, scoreBand, type MatchView } from "./job-labels";

/**
 * `Kiwango cha Kulingana` — B5's match card, the block the design puts between
 * the advert's header and its responsibilities.
 *
 * Two states, built as two TYPES rather than a nullable score, for the same
 * reason `CvScoreCard` is (`components/home/cv-score-card.tsx`): a caller
 * cannot render a numeral for a listing no engine has scored. `unknown` says
 * WHICH nothing it is, because the honest next step differs —
 *
 *   no-cv      nothing has been scored against yet → build a CV
 *   no-advert  the listing arrived without a description → its terms cannot be
 *              compared, and the way forward is the advert itself
 *
 * THE TWO FINDING ROWS ARE REAL. They are the device engine's own output
 * (`matchJd` in `lib/ats.ts`): the advert terms the CV HAS get the design's
 * `✓`, the terms it does not get the design's `!`. The design's sample lines
 * ("Unao uzoefu wa miaka 3 katika mauzo…", "Inapendekezwa kuongeza cheti cha
 * M-Pesa Merchant Management") are written for one mock listing; printing them
 * on every advert would be the invented progress §10 forbids. A score from the
 * server carries no term lists, and then this card shows the score and its
 * reason and no rows — it never guesses which words overlapped.
 */
export function JobMatchCard({
  view,
  onBuildCv,
}: {
  view: MatchView;
  /** The `no-cv` state's one action. */
  onBuildCv?: () => void;
}) {
  const c = useThemeColors();
  const { t } = useLang();

  const eyebrow = (
    <Text
      style={{
        color: c.text,
        fontSize: 11.5,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        fontFamily: FONT.mono,
      }}
    >
      {t("Match level", "Kiwango cha Kulingana")}
    </Text>
  );

  if (view.state === "unknown") {
    return (
      <Card padded={false} style={{ padding: JOBS_SPACING.cardPad, gap: 10 }}>
        {eyebrow}
        <Text
          style={{ color: c.textMuted, fontSize: 12.5, lineHeight: 19, fontFamily: FONT.regular }}
        >
          {view.why === "no-cv"
            ? t(
                "A match score appears once there is a CV to compare this advert with. Build one and come back — the score is computed on this phone, no account needed.",
                "Alama ya kulingana huonekana mara CV ya kulinganisha na tangazo hili ikiwepo. Jenga moja urudi hapa — alama inahesabiwa kwenye simu hii, hakuna akaunti inayohitajika.",
              )
            : t(
                "This advert arrived without a description, so there is nothing to compare your CV with. Open the advert itself for the details.",
                "Tangazo hili halikuja na maelezo, hivyo hakuna cha kulinganisha na CV yako. Fungua tangazo lenyewe kwa maelezo kamili.",
              )}
        </Text>
        {view.why === "no-cv" && onBuildCv ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Build your CV", "Jenga CV yako")}
            onPress={onBuildCv}
            style={{
              minHeight: JOBS_SPACING.minTarget,
              flexDirection: "row",
              alignItems: "center",
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ color: c.accent, fontSize: 14.5, fontFamily: FONT.bold }}>
              {t("Build your CV →", "Jenga CV yako →")}
            </Text>
          </Pressable>
        ) : null}
      </Card>
    );
  }

  const { match } = view;
  const tone = bandColor(scoreBand(match.score), c);
  const hasFindings = match.matched.length > 0 || match.missing.length > 0;

  return (
    <Card padded={false} style={{ padding: JOBS_SPACING.cardPad, gap: 10 }}>
      {/* `wrap` holds the eyebrow and the numeral together at 200 % text scale
          instead of squeezing the percentage off the edge. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {eyebrow}
        <Text style={{ color: tone, fontSize: 16, fontFamily: FONT.mono }}>{match.score}%</Text>
      </View>

      <Text style={{ color: c.textBody, fontSize: 12.5, lineHeight: 19, fontFamily: FONT.regular }}>
        {match.reason}
      </Text>

      {hasFindings ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: c.border,
            paddingTop: 8,
            gap: 6,
          }}
        >
          {match.matched.length > 0 ? (
            <Finding
              glyph="✓"
              color={c.success}
              text={`${t("Matching skills", "Ujuzi unaolingana")}: ${match.matched.slice(0, 4).join(", ")}.`}
            />
          ) : null}
          {match.missing.length > 0 ? (
            <Finding
              glyph="!"
              color={c.warning}
              text={`${t("Worth adding", "Inapendekezwa kuongeza")}: ${match.missing.slice(0, 4).join(", ")}.`}
            />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

/** One real finding, in the fragment's `✓` / `!` shape. */
function Finding({ glyph, color, text }: { glyph: string; color: string; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6 }}>
      <Text style={{ color, fontSize: 12, lineHeight: 18, fontFamily: FONT.mono }}>{glyph}</Text>
      <Text
        style={{ flex: 1, minWidth: 0, color, fontSize: 12, lineHeight: 18, fontFamily: FONT.regular }}
      >
        {text}
      </Text>
    </View>
  );
}
