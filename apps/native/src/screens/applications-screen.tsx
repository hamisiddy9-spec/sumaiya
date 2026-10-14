import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View, type TextStyle } from "react-native";
import { Icon } from "../components/icon";
import { FONT } from "../components/home/tokens";
import {
  Card,
  EmptyState,
  Screen,
  ScreenTitle,
  SkeletonList,
  Stagger,
  haptics,
  useThemeColors,
} from "../components/ui";
import type { ThemeColors } from "../components/ui/theme";
import type { AppStatus, Application } from "../lib/applications-store";
import { useIsOnline } from "../lib/connectivity";
import { useLang } from "../lib/i18n";
import { useApplications } from "../hooks/use-applications";
import type { ApplicationsScreenProps } from "../navigation/types";
import {
  APPLICATION_STATUS_LABEL,
  PIPELINE_ORDER,
  applicationsTrackedLine,
  daysWaiting,
  lastMovedAt,
  lastMovedLabel,
  needsFollowUp,
  sentAgoLabel,
  sortByLastMovement,
} from "./applications-labels";

/**
 * Screen B7 — `Maombi` / Applications (design fragment: `per_screen/B7.html`).
 *
 * The design is a TRACKER, not a table: a sub-header with the count and one
 * `+ Maombi Mapya` action, a status-filter chip row carrying real counts, then
 * one card per application — role and company, a status chip, and a lane that
 * says when it last MOVED. The list is ordered by that same movement
 * (`last_moved_at`), which is what makes it a tracker: the thing you last heard
 * about is the thing at the top, and an application you have not touched in
 * months sinks, however new it was when you saved it.
 *
 * THE THREE THINGS THE FRAGMENT ASKS FOR THAT THIS DATA CANNOT PRODUCE, resolved
 * honestly rather than mocked up (the brief's rule: implement the honest state
 * and say so):
 *
 *   1. `last_moved_at` is not a column here. `applications-store.ts` stamps
 *      `updatedAt` on every write, so that IS the last movement — see
 *      `lastMovedAt()` in ./applications-labels, which is used for both the
 *      ordering and the `Ilipoguswa mwisho:` line.
 *   2. The card's second line in the fragment is `Ujumbe wa HR: "…"` — a message
 *      from the employer. Nothing in this app receives employer messages, so the
 *      same slot carries the user's OWN notes, labelled as theirs
 *      (`Maelezo yako:`). An HR message that the product never received would be
 *      a fabricated fact about a real employer.
 *   3. The fragment's status set is a six-stage pipeline (Imetumwa, Imeonekana,
 *      Mwito, Mazungumzo, Imekataliwa, Imekubaliwa). The store has five states
 *      and two of the design's are not reachable from it: `Imeonekana` (seen)
 *      and `Mwito` (invited) have no field to derive them from, so neither is
 *      rendered as a chip that could never hold a row. `Imekataliwa`
 *      ("rejected") is not printed for the store's `closed` — `closed` is what
 *      the USER sets when they end an application themselves, and recording a
 *      rejection they never had would be a false history. See
 *      `APPLICATION_STATUS_LABEL` for the exact mapping, per state, with why.
 *
 * The engine is untouched: `useApplications()` (lib/applications-store.ts) still
 * owns the rows, and both existing routes still lead where they led —
 * `ApplicationDetail` to add one, `Jobs` to find one.
 */

/** One lane per status, built from the guide's tokens (§1) — never a raw hex. */
function statusChip(status: AppStatus, c: ThemeColors): { bg: string; fg: string; border: string } {
  switch (status) {
    // Sent and waiting: the amber "needs attention" lane, exactly where the
    // fragment puts its own sent row.
    case "applied":
      return { bg: c.warning + "1f", fg: c.warning, border: c.warning + "33" };
    // Talking to them: ember, the guide's colour for the active thing.
    case "interview":
      return { bg: c.accentTint, fg: c.accent, border: c.accent + "33" };
    case "offer":
      return { bg: c.successTint, fg: c.success, border: c.success + "33" };
    // saved / closed (and anything the store holds that this build does not
    // know): neutral. Not red — see the header note on `Imekataliwa`.
    default:
      return { bg: c.bgSunken, fg: c.textMuted, border: c.border };
  }
}

const MONO: TextStyle = { fontFamily: FONT.mono, fontSize: 11.5, lineHeight: 15 };

/**
 * One card: role + company + status chip, then the movement lane — and, when
 * there is one, the user's own note.
 *
 * The whole card is ONE tap target (`Card`'s own Pressable) that opens the
 * application. The follow-up lane's `Fuatilia →` sits inside it and leads to the
 * same place: this app has no outbound follow-up (no email, no message to an
 * employer), and the place a follow-up actually happens is the record, where the
 * status and the notes live. A link that promised to send something would be the
 * one lie this screen cannot afford.
 */
function ApplicationRow({
  app,
  c,
  lang,
  now,
  onOpen,
}: {
  app: Application;
  c: ThemeColors;
  lang: "en" | "sw";
  now: Date;
  onOpen: () => void;
}) {
  const { t } = useLang();
  // A status this build does not know (an older/newer schema) must not blank a
  // row: it falls back to the neutral chip and the "Saved" word, which is what
  // an unrecognised row is — something on this phone, not a claimed stage.
  const meta = APPLICATION_STATUS_LABEL[app.status] ?? APPLICATION_STATUS_LABEL.saved;
  const chip = statusChip(app.status, c);
  const stale = needsFollowUp(app, now.getTime());
  const notes = app.notes?.trim();

  return (
    <Card
      onPress={onOpen}
      padded={false}
      accessibilityLabel={
        stale
          ? `${app.role}. ${app.company}. ${meta[lang]}. ${sentAgoLabel(daysWaiting(app, now.getTime()), lang)}`
          : `${app.role}. ${app.company}. ${meta[lang]}. ${t("Last moved", "Ilipoguswa mwisho")} ${lastMovedLabel(lastMovedAt(app), lang, now)}`
      }
      style={{ padding: 16, gap: 8, backgroundColor: c.bgElevated }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        {/* Not clamped to one line: §8 holds the layout at 200 % text scale, and
            a single clamped line is what breaks there. */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={2}
            style={{ color: c.text, fontSize: 15, lineHeight: 20, fontFamily: FONT.semibold }}
          >
            {app.role}
          </Text>
          <Text
            numberOfLines={1}
            style={{ color: c.textBody, fontSize: 12.5, lineHeight: 17, marginTop: 2, fontFamily: FONT.regular }}
          >
            {app.company}
          </Text>
        </View>
        <View
          style={{
            flexShrink: 0,
            backgroundColor: chip.bg,
            borderWidth: 1,
            borderColor: chip.border,
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text style={{ ...MONO, color: chip.fg }}>{meta[lang]}</Text>
        </View>
      </View>

      {stale ? (
        /* The follow-up lane. Same slot as the movement lane, amber, and it
           carries the reason the row is worth a second look. */
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            backgroundColor: c.warning + "1f",
            borderWidth: 1,
            borderColor: c.warning + "33",
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 8,
          }}
        >
          <Text style={{ ...MONO, color: c.warning, flexShrink: 1 }}>
            {sentAgoLabel(daysWaiting(app, now.getTime()), lang)}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <Text style={{ ...MONO, color: c.warning, textDecorationLine: "underline" }}>
              {t("Follow up", "Fuatilia")}
            </Text>
            <Icon name="arrow-right" size={12} color={c.warning} />
          </View>
        </View>
      ) : (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            backgroundColor: c.bgSunken,
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 8,
          }}
        >
          {/* The fragment's own words, verbatim. */}
          <Text style={{ ...MONO, color: c.textMuted, flexShrink: 1 }}>
            {t("Last moved:", "Ilipoguswa mwisho:")}
          </Text>
          {/* Ember, no weight: JetBrains Mono ships one cut here, and adding a
              fontWeight to it is how Android fake-bolds. */}
          <Text style={{ ...MONO, color: c.accent, textAlign: "right", flexShrink: 1 }}>
            {lastMovedLabel(lastMovedAt(app), lang, now)}
          </Text>
        </View>
      )}

      {notes ? (
        /* The fragment's `Ujumbe wa HR:` slot — this app's own second line, which
           is the user's note (see the screen header, item 2). */
        <Text
          numberOfLines={2}
          style={{ color: c.textBody, fontSize: 12, lineHeight: 17, fontFamily: FONT.regular }}
        >
          {`${t("Your notes:", "Maelezo yako:")} ${notes}`}
        </Text>
      ) : null}
    </Card>
  );
}

export function ApplicationsScreen({ navigation }: ApplicationsScreenProps) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  // The list is device-only (lib/applications-store.ts — SQLite), so being
  // offline never blocks it. This is read for ONE thing: the footer's sentence,
  // which says where the records are instead of pretending something is broken.
  const online = useIsOnline();
  const { applications, loading, refresh } = useApplications();
  const [filter, setFilter] = useState<AppStatus | "all">("all");
  const [refreshing, setRefreshing] = useState(false);

  // One clock per render pass of this data, so every row's "Jana (Saa 22:15)"
  // agrees with every other row's — and a re-render does not make the labels
  // drift a minute apart.
  const now = useMemo(() => new Date(), [applications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  // Newest movement first — never the creation date (./applications-labels).
  const rows = useMemo(() => {
    const sorted = sortByLastMovement(applications);
    return filter === "all" ? sorted : sorted.filter((a) => a.status === filter);
  }, [applications, filter]);

  // The chip row's counts are counted from the rows in hand, never typed: the
  // fragment's `Yote (4) / Mazungumzo (1) / Mwito (1) / Imetumwa (2)` is what
  // this product's own data produces, in the same order (most advanced first).
  const counts = useMemo(() => {
    const m = new Map<AppStatus, number>();
    for (const a of applications) m.set(a.status, (m.get(a.status) ?? 0) + 1);
    return m;
  }, [applications]);

  const total = applications.length;
  const tracked = applicationsTrackedLine(total, lang);
  const openNew = () => {
    haptics.light();
    navigation.navigate("ApplicationDetail", {});
  };

  return (
    <Screen
      scroll
      keyboardAvoiding={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {/* Sub-header: the title, how many are being tracked, and the fragment's
          `+ Maombi Mapya`. The count pill that used to sit on the icon is gone —
          §10 forbids badges, and the count belongs in the sentence. */}
      <ScreenTitle
        trailing={
          <Pressable
            onPress={openNew}
            accessibilityRole="button"
            accessibilityLabel={t("New application", "Ombi jipya")}
            // §8: 44 dp, not the fragment's ~32.
            style={{
              minHeight: 44,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: c.accentTint,
              borderWidth: 1,
              borderColor: c.accent + "33",
            }}
          >
            <Icon name="plus" size={16} color={c.accent} />
            <Text style={{ color: c.accent, fontSize: 12.5, fontFamily: FONT.semibold }}>
              {t("New application", "Maombi Mapya")}
            </Text>
          </Pressable>
        }
      >
        {t("My applications", "Maombi yako")}
      </ScreenTitle>

      {total > 0 ? (
        <Text
          style={{ color: c.textMuted, fontSize: 13.5, lineHeight: 19, marginTop: -14, marginBottom: 14, fontFamily: FONT.regular }}
        >
          {tracked}
        </Text>
      ) : null}

      {/* Status filter chips — horizontal, live counts, only the statuses the
          data actually holds. */}
      {total > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
          style={{ marginBottom: 16 }}
        >
          <Pressable
            onPress={() => {
              haptics.selection();
              setFilter("all");
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === "all" }}
            style={{
              minHeight: 44,
              justifyContent: "center",
              paddingHorizontal: 16,
              borderRadius: 999,
              backgroundColor: filter === "all" ? c.accentFillStrong : c.bgElevated,
              borderWidth: 1,
              borderColor: filter === "all" ? "transparent" : c.border,
            }}
          >
            <Text
              style={{
                ...MONO,
                color: filter === "all" ? c.accentText : c.textBody,
              }}
            >
              {t(`All (${total})`, `Yote (${total})`)}
            </Text>
          </Pressable>

          {PIPELINE_ORDER.map((s) => {
            const n = counts.get(s) ?? 0;
            // A chip that can never hold a row is a promise the app cannot keep.
            if (n === 0) return null;
            const active = filter === s;
            const meta = APPLICATION_STATUS_LABEL[s];
            return (
              <Pressable
                key={s}
                onPress={() => {
                  haptics.selection();
                  setFilter(active ? "all" : s);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={{
                  minHeight: 44,
                  justifyContent: "center",
                  paddingHorizontal: 16,
                  borderRadius: 999,
                  backgroundColor: active ? c.accentFillStrong : c.bgElevated,
                  borderWidth: 1,
                  borderColor: active ? "transparent" : c.border,
                }}
              >
                <Text style={{ ...MONO, color: active ? c.accentText : c.textBody }}>
                  {`${meta[lang]} (${n})`}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {(loading && total === 0) ? (
        /* "Inasoma rekodi…" — a skeleton with a spoken label, never a blank page
           (§8). This screen is the one list in the app whose read is local, so
           it settles in a frame or two; the skeleton is for a cold SQLite open. */
        <SkeletonList count={3} label={t("Reading your records…", "Inasoma rekodi…")} />
      ) : total === 0 ? (
        /* THE WELCOME, not an apology: nothing is wrong here, there is simply
           nothing to track yet, and the first one is one tap away. Both doors are
           account-free — the form is local, and the feed is public data. */
        <View style={{ flex: 1, justifyContent: "center", paddingBottom: 40 }}>
          <EmptyState
            icon="briefcase"
            title={t("Welcome — your applications live here", "Karibu — maombi yako yanakaa hapa")}
            body={t(
              "Every job you go for gets one place: the role, the company, the letter and where it stands. All of it on this phone, and nothing leaves it unless you choose.",
              "Kila kazi unayoomba inapata mahali pamoja: cheo, kampuni, barua ya maombi na hali yake. Vyote kwenye simu hii, na hakuna kinachotoka bila wewe kuamua.",
            )}
            actionLabel={t("Add your first application", "Ongeza ombi la kwanza")}
            onAction={openNew}
            secondaryLabel={t("Find jobs to apply to", "Tafuta ajira za kuomba")}
            onSecondary={() => {
              haptics.light();
              navigation.navigate("Jobs");
            }}
          />
        </View>
      ) : rows.length === 0 ? (
        <EmptyState
          icon="filter"
          title={t("Nothing in this status", "Hakuna ombi lenye hali hii")}
          body={t(
            "No application on this phone holds that status right now.",
            "Hakuna ombi kwenye simu hii lenye hali hiyo kwa sasa.",
          )}
          actionLabel={t("Show everything", "Onyesha yote")}
          onAction={() => {
            haptics.selection();
            setFilter("all");
          }}
        />
      ) : (
        <View style={{ gap: 12 }}>
          {rows.map((a, i) => (
            <Stagger key={a.id} index={i}>
              <ApplicationRow
                app={a}
                c={c}
                lang={lang}
                now={now}
                onOpen={() => navigation.navigate("ApplicationDetail", { id: a.id })}
              />
            </Stagger>
          ))}
        </View>
      )}

      {/* The fragment's foot: where these records live. `marginTop: auto` keeps
          it at the foot of a short list, in flow under a long one. */}
      <View style={{ marginTop: "auto", paddingTop: 16 }}>
        <View style={{ height: 1, backgroundColor: c.border, marginBottom: 12 }} />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {!online ? <Icon name="wifi-off" size={13} color={c.textMuted} /> : null}
          <Text
            style={{
              ...MONO,
              color: c.textMuted,
              textAlign: "center",
              flexShrink: 1,
            }}
          >
            {online
              ? t("Every record lives in this phone's storage", "Kumbukumbu zote ziko kwenye hifadhi ya simu hii")
              : t("Offline — your records are still on this phone", "Nje ya mtandao — rekodi zako ziko kwenye simu hii")}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
