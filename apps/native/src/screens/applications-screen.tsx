import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useApplications } from "../hooks/use-applications";
import { STATUS_META, type AppStatus } from "../lib/applications-store";
import { useLang } from "../lib/i18n";
import { Button, EmptyState, Screen, ScreenTitle, Stagger, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";

const STATUS_TINT: Record<AppStatus, (c: any) => string> = {
  saved: (c) => c.textMuted,
  applied: (c) => c.accent,
  interview: (c) => c.warning,
  offer: (c) => c.success,
  closed: (c) => c.textMuted,
};

function timeAgo(ts: number, sw: boolean): string {
  const d = Date.now() - ts;
  const day = 86_400_000;
  if (d < day) return sw ? "Leo" : "Today";
  if (d < 2 * day) return sw ? "Jana" : "Yesterday";
  if (d < 7 * day) return `${Math.floor(d / day)}${sw ? " siku" : "d"}`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ApplicationsScreen({ navigation }: any) {
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
          >
            <Icon name="plus" size={20} color={c.accentText} />
          </Pressable>
        }
      >
        {t("Applications", "Maombi")}
      </ScreenTitle>

      {loading && applications.length === 0 ? (
        <Text style={{ color: c.textMuted }}>{t("Loading…", "Inapakia…")}</Text>
      ) : applications.length === 0 ? (
        <EmptyState
          icon="briefcase"
          title={t("Track every job here", "Fuatilia kila kazi hapa")}
          body={t(
            "Add a job you're applying to. Keep the description, your tailored CV, the cover letter and where it stands — all in one place, on your phone.",
            "Ongeza kazi unayoomba. Weka maelezo, CV yako, barua ya maombi na hali yake — mahali pamoja, kwenye simu yako.",
          )}
          actionLabel={t("Add a job", "Ongeza kazi")}
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
