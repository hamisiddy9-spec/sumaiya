import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Button, Card, Screen, ScreenTitle, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";
import { closingLabel } from "../lib/deadline";
import { isExpiredListing } from "../lib/job-listing";
import { confirmAndOpenUrl } from "../lib/external-link";
import { useLang } from "../lib/i18n";
import type { JobDetailScreenProps } from "../navigation/types";

/**
 * The advert behind a job card.
 *
 * The card used to be a plain View styled exactly like every tappable card in
 * the app: no detail route, no closing date, and a tap that did nothing. The
 * device sweep (Pixel 8 Pro, 1.6.24) found that on the real Jobs screen the
 * only clickable nodes were the two buttons and the tab bar — the card body a
 * user aims at was inert, while the same layout everywhere else in the app
 * opens something.
 *
 * This is the honest half of the fix: the card opens the advert it is showing.
 * Everything the feed already knew and never said lives here — the deadline it
 * filters by, the employment type, the source — plus the full description the
 * card truncates, and the two actions that were previously the card's only
 * working parts.
 */
export function JobDetailScreen({ navigation, route }: JobDetailScreenProps) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const { job, score, reason } = route.params;

  const closing = closingLabel(job.applicationDeadline, lang);
  const closed = isExpiredListing(job.applicationDeadline);

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

  const meta = [job.employmentType, job.category, job.sourceName].filter(Boolean) as string[];

  return (
    <Screen
      scroll
      footer={
        <View style={{ gap: 8 }}>
          <Button label={t("Start an application", "Kuanza ombi")} onPress={startApplication} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button label={t("Tailor my CV", "Lenga CV yako")} variant="secondary" onPress={tailor} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={t("Open the advert", "Fungua tangazo")}
                variant="secondary"
                onPress={() => job.applyUrl && confirmAndOpenUrl(job.applyUrl, t)}
              />
            </View>
          </View>
        </View>
      }
    >
      <Animated.View entering={FadeInDown.duration(280)}>
        <ScreenTitle eyebrow={job.company}>{job.title}</ScreenTitle>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {job.location ? <Chip label={job.location} icon="map-pin" /> : null}
          {meta.map((m) => (
            <Chip key={m} label={m} />
          ))}
        </View>

        {/* The fact the feed already filtered on and never showed. */}
        <Card style={{ marginBottom: 14, gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 13 }}>
            <Icon name="calendar-clock" size={18} color={closed ? c.error : c.accent} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 14.5, fontWeight: "700" }}>
                {t("Closing date", "Mwisho wa maombi")}
              </Text>
              <Text style={{ color: closed ? c.error : c.textBody, fontSize: 13.5, marginTop: 2 }}>
                {closing ?? t("No closing date given", "Hakuna tarehe ya mwisho")}
              </Text>
            </View>
          </View>
          {closed ? (
            <Text style={{ color: c.error, fontSize: 12.5, lineHeight: 18 }}>
              {t(
                "This advert has closed — applications sent now may not be read.",
                "Tangazo hili limefungwa — maombi yaliyotumwa sasa yanaweza kutosomwa.",
              )}
            </Text>
          ) : null}
        </Card>

        {reason ? (
          <Card style={{ marginBottom: 14, gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Icon name="target" size={16} color={c.accent} />
              <Text style={{ color: c.text, fontSize: 14, fontWeight: "700" }}>
                {typeof score === "number"
                  ? t(`Why this matches you — ${score}%`, `Kwa nini inakufaa — ${score}%`)
                  : t("Why this matches you", "Kwa nini inakufaa")}
              </Text>
            </View>
            <Text style={{ color: c.textBody, fontSize: 13.5, lineHeight: 20 }}>{reason}</Text>
          </Card>
        ) : null}

        <Text
          style={{
            color: c.textMuted,
            fontSize: 12,
            fontWeight: "700",
            letterSpacing: 0.3,
            marginBottom: 8,
            textTransform: "uppercase",
          }}
        >
          {t("The advert", "Tangazo")}
        </Text>
        <Text style={{ color: c.textBody, fontSize: 14.5, lineHeight: 22 }}>{job.description}</Text>
      </Animated.View>
    </Screen>
  );
}

function Chip({ label, icon }: { label: string; icon?: string }) {
  const c = useThemeColors();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: c.bgElevated,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
      }}
    >
      {icon ? <Icon name={icon} size={12} color={c.textMuted} /> : null}
      <Text style={{ color: c.textBody, fontSize: 12, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}
