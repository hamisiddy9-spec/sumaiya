import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useApplications } from "../hooks/use-applications";
import { STATUS_META, type AppStatus } from "../lib/applications-store";
import { useLang } from "../lib/i18n";
import { Button, EmptyState, Screen, ScreenTitle, SkeletonCard, Stagger, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";
import type { ThemeColors } from "../components/ui/theme";
import type { ApplicationsScreenProps } from "../navigation/types";

const STATUS_TINT: Record<AppStatus, (c: ThemeColors) => string> = {
  saved: (c) => c.textMuted,
  applied: (c) => c.accent,
  interview: (c) => c.warning,
  offer: (c) => c.success,
  closed: (c) => c.textMuted,
};

// Calendar-day diff, not a raw 24h ms diff — a raw diff misreads anything
// near a midnight boundary (e.g. updated 23:00 yesterday, viewed 01:00 today:
// only 2h ago but a different calendar day, so it must read "Jana"/"Yesterday").
function timeAgo(ts: number, sw: boolean): string {
  const date = new Date(ts);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (dayDiff <= 0) return sw ? "Leo" : "Today";
  if (dayDiff === 1) return sw ? "Jana" : "Yesterday";
  if (dayDiff < 7) return `${dayDiff}${sw ? " siku" : "d"}`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ApplicationsScreen({ navigation }: ApplicationsScreenProps) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const sw = lang === "sw";
  const { applications, loading } = useApplications();

  return (
    <Screen scroll keyboardAvoiding={false} contentContainerStyle={{ gap: 14 }}>
      <ScreenTitle
        trailing={
          <Pressable
            onPress={() => { haptics.light(); navigation.navigate("ApplicationDetail", {}); }}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.accent, alignItems: "center", justifyContent: "center" }}
            accessibilityLabel={t("Add application", "Ongeza ombi")}
            hitSlop={8}
          >
            <Icon name="plus" size={20} color={c.accentText} />
          </Pressable>
        }
      >
        {t("Applications", "Maombi")}
      </ScreenTitle>

      {loading && applications.length === 0 ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : applications.length === 0 ? (
        <EmptyState
          icon="briefcase"
          title={t("Track every job here", "Fuatilia kila ajira hapa")}
          body={t(
            "Add a job you're applying to. Keep the description, your tailored CV, the cover letter and where it stands — all in one place, on your phone.",
            "Ongeza ajira unayoomba. Weka maelezo, CV yako, barua ya maombi na hali yake — mahali pamoja, kwenye simu yako.",
          )}
          actionLabel={t("Add a job", "Ongeza ajira")}
          onAction={() => navigation.navigate("ApplicationDetail", {})}
        />
      ) : (
        applications.map((a, i) => {
          const tint = STATUS_TINT[a.status](c);
          return (
            <Stagger key={a.id} index={i}>
              <Pressable
                onPress={() => { haptics.selection(); navigation.navigate("ApplicationDetail", { id: a.id }); }}
                style={{
                  padding: 15, borderRadius: 14, borderWidth: 1, borderColor: c.border,
                  backgroundColor: c.bgElevated, gap: 6,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ flex: 1, color: c.text, fontSize: 15, fontWeight: "700" }} numberOfLines={1}>
                    {a.role}
                  </Text>
                  <Text style={{ color: c.textMuted, fontSize: 11 }}>{timeAgo(a.updatedAt, sw)}</Text>
                </View>
                <Text style={{ color: c.textBody, fontSize: 13 }} numberOfLines={1}>
                  {a.company}{a.location ? ` · ${a.location}` : ""}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
                  <View style={{ paddingVertical: 3, paddingHorizontal: 9, borderRadius: 7, backgroundColor: tint + "22" }}>
                    <Text style={{ color: tint, fontSize: 11, fontWeight: "700" }}>
                      {sw ? STATUS_META[a.status].sw : STATUS_META[a.status].en}
                    </Text>
                  </View>
                  {typeof a.fitScore === "number" && (
                    <Text style={{ color: c.textMuted, fontSize: 11 }}>
                      {t("fit", "ulinganifu")} {a.fitScore}%
                    </Text>
                  )}
                  {a.coverLetter ? <Icon name="mail" size={12} color={c.textMuted} /> : null}
                  {a.cvId ? <Icon name="file-text" size={12} color={c.textMuted} /> : null}
                </View>
              </Pressable>
            </Stagger>
          );
        })
      )}
    </Screen>
  );
}
