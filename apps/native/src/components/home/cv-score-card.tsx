import React from "react";
import { Pressable, Text, View } from "react-native";
import { Card, ProgressBar, useThemeColors } from "../ui";
import { Icon } from "../icon";
import { useLang } from "../../lib/i18n";
import { FONT, HOME_SPACING } from "./tokens";

/** One checklist row: the design's label, and the real state of a real check. */
export interface ScoreRow {
  id: string;
  label: string;
  pass: boolean;
}

type ScoredProps = {
  state: "scored";
  /** The CV the score belongs to — `Wasifu uliotumika hivi karibuni`. */
  cvTitle: string;
  /** 0–100, from `lib/ats.ts` on this CV. Never a placeholder. */
  score: number;
  rows: ScoreRow[];
  onCheck: () => void;
};

type UnknownProps = {
  /**
   * Nothing to score yet — no CV, or a CV with nothing in it. This branch is a
   * separate TYPE, not a `score: null` on the scored one, so a caller cannot
   * render a numeral for a CV that has not been checked. §10 forbids fabricating
   * progress; a made-up "47/100" is exactly that.
   */
  state: "unknown";
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
};

export type CvScoreCardProps = ScoredProps | UnknownProps;

/**
 * CARD TWO of the design's Home — the CV-score card, and the card that carries
 * the screen's hierarchy. It was missing in its entirety.
 *
 * TWO COPY DECISIONS, both from the guide and both deliberate:
 *
 *   `Alama ya ATS`  →  `Alama ya ukaguzi`  (swahili-lint-ignore: the design's
 *     banned form, cited here as the counter-example)
 *     §6 BANS "ATS" from Swahili-facing copy. The design wrote the banned form;
 *     the guide's replacement is what ships. (English, which has no such rule,
 *     reads "Check score".)
 *
 *   `Uchambuzi wa ATS` → `Uchambuzi wa CV` on the quick-action tile's sublabel (swahili-lint-ignore)
 *
 * The three checklist rows are the design's three rows. Their STATES are real:
 * each one is the pass/fail of a named check from `lib/ats.ts` — the same
 * analyzer the CV-check screen runs — resolved by the screen and passed in. The
 * chip colours follow §1's status tokens (`success` for `Imekamilika`,
 * `warning` for `Inahitajika`), not the design's ember-for-everything.
 */
export function CvScoreCard(props: CvScoreCardProps) {
  const c = useThemeColors();
  const { t } = useLang();

  const eyebrow = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent }} />
      <Text
        style={{
          color: c.accent,
          fontSize: 10.5,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          fontFamily: FONT.mono,
        }}
      >
        {t("Needs attention", "Inastahili umakini")}
      </Text>
    </View>
  );

  if (props.state === "unknown") {
    return (
      <Card padded={false} style={{ padding: HOME_SPACING.cardPad, gap: 12 }}>
        {eyebrow}
        <Text style={{ color: c.text, fontSize: 18, lineHeight: 24, letterSpacing: -0.3, fontFamily: FONT.bold }}>
          {props.title}
        </Text>
        <Text style={{ color: c.textMuted, fontSize: 13, lineHeight: 19, fontFamily: FONT.regular }}>{props.body}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={props.actionLabel}
          onPress={props.onAction}
          style={{
            minHeight: HOME_SPACING.minTarget,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            alignSelf: "flex-start",
          }}
        >
          <Text style={{ color: c.accent, fontSize: 15, fontFamily: FONT.bold }}>{props.actionLabel}</Text>
          <Icon name="arrow-right" size={18} color={c.accent} />
        </Pressable>
      </Card>
    );
  }

  return (
    <Card padded={false} style={{ padding: HOME_SPACING.cardPad, gap: 14 }}>
      {/* Eyebrow + step chip. `wrap` holds this row together at 200 % text
          scale instead of squeezing `Hatua 1/4` off the edge. */}
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
        <View style={{ backgroundColor: c.bgSunken, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ color: c.textMuted, fontSize: 11, fontFamily: FONT.mono }}>{t("Step 1/4", "Hatua 1/4")}</Text>
        </View>
      </View>

      {/* The CV and its score. Above 150 % text scale the two stack: side by
          side they would fight over one line, and the name would win by
          squeezing the numeral. */}
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <View style={{ flex: 1, minWidth: 140, gap: 2 }}>
          <Text style={{ color: c.textMuted, fontSize: 11, fontFamily: FONT.mono }}>
            {t("Profile used most recently", "Wasifu uliotumika hivi karibuni")}
          </Text>
          <Text style={{ color: c.text, fontSize: 18, lineHeight: 24, letterSpacing: -0.3, fontFamily: FONT.bold }}>
            {props.cvTitle}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text style={{ color: c.accent, fontSize: 32, lineHeight: 34, fontFamily: FONT.display }}>{props.score}</Text>
            <Text style={{ color: c.textMuted, fontSize: 16, fontFamily: FONT.bold, marginLeft: 2 }}>/100</Text>
          </View>
          <Text
            style={{
              color: c.textMuted,
              fontSize: 10,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              fontFamily: FONT.mono,
              marginTop: 4,
            }}
          >
            {t("Check score", "Alama ya ukaguzi")}
          </Text>
        </View>
      </View>

      {/* The real score, from the left edge (§4). */}
      <ProgressBar value={props.score / 100} height={8} />

      <View style={{ gap: 6 }}>
        {props.rows.map((row) => (
          <View
            key={row.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: c.bgSunken,
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: (row.pass ? c.success : c.warning) + "26",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={row.pass ? "check" : "alert-circle"} size={12} color={row.pass ? c.success : c.warning} />
              </View>
              <Text style={{ flexShrink: 1, color: c.text, fontSize: 13.5, lineHeight: 19, fontFamily: FONT.semibold }}>
                {row.label}
              </Text>
            </View>
            <View
              style={{
                flexShrink: 0,
                backgroundColor: row.pass ? c.successTint : c.warning + "1f",
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: row.pass ? c.success : c.warning, fontSize: 10.5, fontFamily: FONT.bold }}>
                {row.pass ? t("Done", "Imekamilika") : t("Needed", "Inahitajika")}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={{ color: c.textMuted, fontSize: 13, lineHeight: 19, fontFamily: FONT.regular }}>
        {t(
          "Your CV may be missing what employers screen for — a quick check shows the exact fixes.",
          "CV yako inaweza kukosa vigezo vya waajiri — ukaguzi wa haraka unaonyesha marekebisho sahihi.",
        )}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("Check your CV", "Kagua CV yako")}
        onPress={props.onCheck}
        style={{
          minHeight: HOME_SPACING.minTarget,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          alignSelf: "flex-start",
        }}
      >
        <Text style={{ color: c.accent, fontSize: 15, fontFamily: FONT.bold }}>{t("Check your CV", "Kagua CV yako")}</Text>
        <Icon name="arrow-right" size={18} color={c.accent} />
      </Pressable>
    </Card>
  );
}
