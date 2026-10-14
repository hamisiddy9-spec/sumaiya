import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View, type TextStyle } from "react-native";
import { confirmAndOpenUrl } from "../lib/external-link";
import { useFocusEffect } from "@react-navigation/native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import type { CVData } from "@sumaiya/types";
import type { JobRecommendation } from "@sumaiya/api-client";
import { LessonSheet } from "../components/learning/lesson-sheet";
import { SHORT_COURSES } from "../lib/short-courses";
import {
  EMPTY_COURSE,
  courseDone,
  courseIsComplete,
  coursePercent,
  courseTotal,
  getCourseProgress,
  markCourseUnit,
  resetCourse,
  type CourseAction,
  type CourseProgress,
  type CourseResource,
  type CourseUnit,
  type ShortCourse,
} from "../lib/short-course";
import { apiClient } from "../lib/api-client";
import { useCvs } from "../hooks/use-cvs";
import { loadProfile, saveProfile, type CareerProfile } from "../lib/profile-store";
import { computeSkillGaps, type GapResult, type SkillGap } from "../lib/skill-gaps";
import { getSkillProgress, setSkillState, type SkillState } from "../lib/course-progress";
import { Button, Card, EASE, EmptyState, MOTION, ProgressBar, Screen, SkeletonList, Stagger, enterDurationMs, exitDurationMs, haptics, useMotionReduced, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";
import { SumaiyaMark } from "../components/sumaiya-mark";
// The type ramp. §2 gives JetBrains Mono every number in the app, so the course
// counts, the minutes and the progress ratio below all come from here — never a
// literal font-family string.
import { FONT } from "../components/home";
import { useLang } from "../lib/i18n";
import { GUIDES, type Guide } from "../lib/guides";
import { useEntitlements } from "../lib/entitlements";
import { PremiumSheet } from "../components/premium-sheet";
import type { LearningHubScreenProps } from "../navigation/types";

/**
 * B1 — `Kituo cha Mafunzo` (the Learning Hub), rebuilt to the design fragment.
 *
 * The design's spine, in its order:
 *   1. the title with a live course count, and one line saying why to be here
 *   2. `Endelea na Somo` — the course actually in progress, with the real ratio
 *   3. `Kozi Zote Zilizopo` — every course as a row that says FREE or PREMIUM
 *      on the card itself, never behind a tap
 *   4. the closing line: saved on the phone, works offline
 *
 * What the fragment cannot give, and how it is resolved honestly:
 *   • Stitch's copy is `Mafunzo 8` — a mockup number. The count here is
 *     `entries.length`, computed from the catalogue the app really ships.
 *   • Stitch's in-progress card reads `Dakika 8 zimebaki • Moduli 2 ya 4`. Only
 *     the finished unit ids are stored (lib/short-course.ts keeps `done: []`),
 *     so "minutes left" is not knowable — the card shows the course's real
 *     length and the real module position instead of an invented countdown.
 *   • Stitch's locked row says the course is available `kwenye kifurushi cha
 *     mwezi au siku`. There is no monthly or daily package in the product:
 *     Premium is EARNED through referrals and paying is not open yet
 *     (components/premium-sheet.tsx). The locked row therefore says how it is
 *     really unlocked, and no price — the price is undecided — appears anywhere.
 *   • Stitch's free row is `Misingi ya Kuandika Wasifu Imara`, which this app
 *     does not have. The rows are the app's real content: the three short
 *     courses and the eight guides.
 *
 * THE FRAGMENT'S PROGRESS RULES, kept literally:
 *   • a ratio is only ever `done / total` from stored ticks
 *   • a course that has never been started gets NO bar and NO percentage —
 *     neither on the continue card (which only appears for a started course)
 *     nor in an expanded course below
 *
 * The steps of a free course open INSIDE the row (the hub is one sheet deep, per
 * §8). That renderer is local to this file rather than `CourseCard`, which
 * paints a 0 % bar for a course nobody has started and cannot be changed from
 * here.
 */

/** §8 — nothing tappable is ever below this. */
const MIN_TARGET = 44;

/** The design's eyebrow chip: 10.5 mono, uppercase, tinted. */
function StatusChip({ free }: { free: boolean }) {
  const c = useThemeColors();
  const { t } = useLang();
  if (free) {
    return (
      <View style={{ backgroundColor: c.success + "1a", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
        <Text style={{ color: c.success, fontSize: 10.5, fontFamily: FONT.mono, letterSpacing: 0.4 }}>{t("FREE", "BURE")}</Text>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c.warning + "1a", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
      <Icon name="lock" size={11} color={c.warning} />
      {/* `Premium` is the product's own name for the tier, so it is not
          translated — §6 still wants it through t() so the pair is explicit. */}
      <Text style={{ color: c.warning, fontSize: 10.5, fontFamily: FONT.mono, letterSpacing: 0.4, textTransform: "uppercase" }}>
        {t("Premium", "Premium")}
      </Text>
    </View>
  );
}

/** The design's section label: mono, tracked, uppercase. */
function SectionLabel({ children, style }: { children: string; style?: TextStyle }) {
  const c = useThemeColors();
  return (
    <Text style={[{ color: c.textMuted, fontSize: 11.5, letterSpacing: 0.8, textTransform: "uppercase", fontFamily: FONT.mono }, style]}>
      {children}
    </Text>
  );
}

/** A duration. Mono, like every other number in the app. */
function Minutes({ value }: { value: number }) {
  const c = useThemeColors();
  const { t } = useLang();
  return <Text style={{ color: c.textMuted, fontSize: 12, fontFamily: FONT.mono }}>{t(`${value} min`, `Dk ${value}`)}</Text>;
}

type HubFilter = "all" | "free" | "premium";

/**
 * The row that explains free vs premium. A filter over the real catalogue:
 * every count comes from the list itself, so a chip can never lead to an empty
 * screen. (`All / Free / Premium` — cv-list-screen's chip row, same shape.)
 */
const FILTERS: { key: HubFilter; en: string; sw: string }[] = [
  { key: "all", en: "All", sw: "Zote" },
  { key: "free", en: "Free", sw: "Bure" },
  { key: "premium", en: "Premium", sw: "Premium" },
];

function FilterChip({ label, count, active, onPress }: { label: string; count: number; active: boolean; onPress: () => void }) {
  const c = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} ${count}`}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        minHeight: MIN_TARGET,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? c.accentFillStrong : c.border,
        backgroundColor: active ? c.accentFillStrong : c.bgSunken,
      }}
    >
      <Text style={{ color: active ? c.accentText : c.textBody, fontSize: 13, fontFamily: FONT.semibold }}>{label}</Text>
      <Text style={{ color: active ? c.accentText : c.textMuted, fontSize: 11.5, fontFamily: FONT.mono }}>{count}</Text>
    </Pressable>
  );
}

/**
 * One course row. The whole card is the target (§8 wants 44 dp and the design's
 * own pill is 28), and both the FREE/PREMIUM chip and the button label are on
 * the card, so the distinction never needs a tap to discover.
 */
function HubRow({
  free,
  title,
  blurb,
  minutes,
  actionLabel,
  accessibilityLabel,
  expanded,
  onPress,
}: {
  free: boolean;
  title: string;
  blurb: string;
  minutes: number;
  actionLabel: string;
  accessibilityLabel: string;
  expanded?: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    // A locked row recedes — `surface` rather than `surfaceRaised` — which is
    // the design's `bg-surface-raised/80` without reaching for a transparency.
    <Card padded={false} style={{ backgroundColor: free ? c.bgElevated : c.bg }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={expanded === undefined ? undefined : { expanded }}
        onPress={() => {
          haptics.selection();
          onPress();
        }}
        style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, minHeight: MIN_TARGET }}
      >
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <StatusChip free={free} />
            <Minutes value={minutes} />
          </View>
          <Text style={{ color: c.text, fontSize: 14.5, lineHeight: 20, fontFamily: FONT.bold }}>{title}</Text>
          <Text style={{ color: c.textMuted, fontSize: 12.5, lineHeight: 18, fontFamily: FONT.regular }}>{blurb}</Text>
        </View>
        <View
          style={{
            minHeight: MIN_TARGET,
            minWidth: MIN_TARGET,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 16,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: free ? "transparent" : c.bgSunken,
          }}
        >
          <Text style={{ color: free ? c.text : c.textBody, fontSize: 13, fontFamily: FONT.semibold }}>{actionLabel}</Text>
        </View>
      </Pressable>
    </Card>
  );
}

/** Websites worth looking at. Attached to the step that is about listings. */
function ResourceChips({ resources }: { resources: CourseResource[] }) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  return (
    <View style={{ marginLeft: 31, gap: 8 }}>
      <SectionLabel>{t("WEBSITES TO LOOK AT", "TOVUTI ZA KUANGALIA")}</SectionLabel>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {resources.map((r) => (
          <Pressable
            key={r.id}
            accessibilityRole="link"
            accessibilityLabel={`${lang === "sw" ? r.name.sw : r.name.en} — ${t(r.note.en, r.note.sw)}`}
            onPress={() => confirmAndOpenUrl(r.url, t)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              minHeight: MIN_TARGET,
              paddingHorizontal: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.bg,
            }}
          >
            <Text style={{ color: c.text, fontSize: 12.5, fontFamily: FONT.semibold }}>{lang === "sw" ? r.name.sw : r.name.en}</Text>
            <Icon name="external-link" size={12} color={c.textMuted} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/**
 * A free course, opened inside its row: the real steps, the real ticks, and
 * every step still doing what it always did — the lesson opens for real, a task
 * opens its screen, a link opens the site.
 *
 * The progress line appears in one of three true forms, and the bar appears
 * ONLY once a step has been ticked. An untouched course is not 0 % of anything
 * the user has done — it has not been started, and the design says so.
 */
function CourseSteps({
  course,
  progress,
  onUnit,
  onOpenLesson,
  onReset,
}: {
  course: ShortCourse;
  progress: CourseProgress;
  onUnit: (unit: CourseUnit, action: CourseAction) => void;
  onOpenLesson: (unit: CourseUnit) => void;
  onReset: () => void;
}) {
  const c = useThemeColors();
  const { t } = useLang();
  const done = courseDone(progress, course);
  const total = courseTotal(course);
  const started = done > 0;
  const complete = courseIsComplete(progress, course);

  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 7 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <Text style={{ flexShrink: 1, color: c.text, fontSize: 13, lineHeight: 18, fontFamily: FONT.semibold }}>
            {complete
              ? t("You finished every step", "Umekamilisha hatua zote")
              : started
                ? t(`You have finished ${done} of ${total}`, `Umekamilisha ${done} kati ya ${total}`)
                : t(`${total} steps · about ${course.minutes} min`, `Hatua ${total} · dakika ${course.minutes}`)}
          </Text>
          {started ? (
            <Text style={{ color: complete ? c.success : c.textMuted, fontSize: 12, fontFamily: FONT.mono }}>
              {coursePercent(progress, course)}%
            </Text>
          ) : null}
        </View>
        {started ? <ProgressBar value={total === 0 ? 0 : done / total} height={6} /> : null}
      </View>

      <View style={{ gap: 16 }}>
        {course.units.map((u, i) => {
          const finished = progress.done.includes(u.id);
          return (
            <View key={u.id} style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: finished ? c.success + "22" : c.accent + "18",
                  }}
                >
                  {finished ? (
                    <Icon name="check" size={12} color={c.success} />
                  ) : (
                    <Text style={{ color: c.accent, fontSize: 11.5, fontFamily: FONT.mono }}>{i + 1}</Text>
                  )}
                </View>
                <Text style={{ flex: 1, color: c.text, fontSize: 13.5, lineHeight: 19, fontFamily: FONT.semibold }}>
                  {t(u.title.en, u.title.sw)}
                </Text>
              </View>

              {u.kind === "lesson" ? (
                /* Read, don't tick. The lesson's value is on the screen it opens. */
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t(u.title.en, u.title.sw)}
                  onPress={() => {
                    haptics.light();
                    onOpenLesson(u);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 9,
                    minHeight: MIN_TARGET,
                    padding: 12,
                    marginLeft: 31,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: finished ? c.success + "44" : c.accent + "33",
                    backgroundColor: c.accent + "0a",
                  }}
                >
                  <Icon name="book-open" size={14} color={finished ? c.success : c.accent} />
                  <Text style={{ flex: 1, color: finished ? c.success : c.accent, fontSize: 13, fontFamily: FONT.bold }}>
                    {finished ? t("Read it again", "Soma tena") : t("Read the lesson", "Soma somo")}
                  </Text>
                  <Icon name="chevron-right" size={15} color={finished ? c.success : c.accent} />
                </Pressable>
              ) : (
                <View style={{ marginLeft: 31, gap: 9 }}>
                  {u.body ? (
                    <Text style={{ color: c.textBody, fontSize: 12.5, lineHeight: 18, fontFamily: FONT.regular }}>
                      {t(u.body.en, u.body.sw)}
                    </Text>
                  ) : null}
                  {u.cta ? (
                    /* `onUnit` marks the step AND does what the step names — the
                       one door the tasks always used (see runCourseUnit). */
                    <Button
                      size="sm"
                      variant="secondary"
                      label={t(u.cta.en, u.cta.sw)}
                      onPress={() => onUnit(u, u.action ?? "mark")}
                    />
                  ) : null}
                </View>
              )}

              {course.resourcesAfter === u.id && course.resources?.length ? (
                <ResourceChips resources={course.resources} />
              ) : null}
            </View>
          );
        })}
      </View>

      {started ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Start over", "Anza upya")}
          onPress={() => {
            haptics.selection();
            onReset();
          }}
          style={{ alignSelf: "flex-start", minHeight: MIN_TARGET, justifyContent: "center" }}
        >
          <Text style={{ color: c.textMuted, fontSize: 12.5, fontFamily: FONT.semibold, textDecorationLine: "underline" }}>
            {t("Start over", "Anza upya")}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * `Endelea na Somo` — the design's card, filled from real stored progress.
 *
 * It is only rendered for a course that has been started and not finished, so
 * the bar and the ratio on it can only ever describe work the user really did.
 */
function ContinueCard({
  course,
  progress,
  onContinue,
}: {
  course: ShortCourse;
  progress: CourseProgress;
  onContinue: () => void;
}) {
  const c = useThemeColors();
  const { t } = useLang();
  const done = courseDone(progress, course);
  const total = courseTotal(course);
  // The real position: the first step that is not ticked yet.
  const next = course.units.findIndex((u) => !progress.done.includes(u.id));
  const module = next >= 0 ? next + 1 : total;
  const meta = t(`${course.minutes} min · module ${module} of ${total}`, `Dk ${course.minutes} · Moduli ${module} ya ${total}`);

  return (
    <Card style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <SectionLabel style={{ color: c.accent }}>{t("Continue the lesson", "Endelea na Somo")}</SectionLabel>
          <Text style={{ color: c.text, fontSize: 16, lineHeight: 22, fontFamily: FONT.bold }}>{t(course.title.en, course.title.sw)}</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, fontFamily: FONT.mono }}>{meta}</Text>
        </View>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: c.accentTint,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: c.accent, fontSize: 13, fontFamily: FONT.mono }}>{coursePercent(progress, course)}%</Text>
        </View>
      </View>

      <ProgressBar value={total === 0 ? 0 : done / total} height={8} />

      <Button
        label={t("Continue this lesson", "Endelea na Somo Hili")}
        accessibilityLabel={`${t("Continue this lesson", "Endelea na Somo Hili")}. ${meta}`}
        onPress={onContinue}
      />
    </Card>
  );
}

const PRIORITY_TONE = (c: ReturnType<typeof useThemeColors>) => ({
  high: c.error,
  medium: c.warning,
  low: c.textMuted,
});

function Chips({ items, color }: { items: { en: string; sw: string }[]; color: string }) {
  const { lang } = useLang();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {items.map((s) => (
        <View key={s.en} style={{ backgroundColor: color + "16", borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ color, fontSize: 11, fontFamily: FONT.semibold }}>{lang === "sw" ? s.sw : s.en}</Text>
        </View>
      ))}
    </View>
  );
}

function GapCard({
  gap,
  state,
  onLearn,
  onPractise,
  onCanDo,
}: {
  gap: SkillGap;
  state?: SkillState;
  onLearn: () => void;
  onPractise: () => void;
  onCanDo: () => void;
}) {
  const c = useThemeColors();
  const { lang, t } = useLang();
  const tone = PRIORITY_TONE(c)[gap.priority];
  const { area } = gap;
  const co = area.course;
  const priLabel = { high: t("High", "Juu"), medium: t("Medium", "Kati"), low: t("Low", "Chini") }[gap.priority];
  const question = area.practice[0]?.[lang];

  return (
    <Card style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tone }} />
        <Text style={{ color: c.text, fontSize: 15.5, fontFamily: FONT.bold, flex: 1 }}>{area.skill[lang]}</Text>
        {state === "can-do" ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Icon name="check-circle" size={14} color={c.success} />
            <Text style={{ color: c.success, fontSize: 11.5, fontFamily: FONT.bold }}>{t("On your CV", "Kwenye CV yako")}</Text>
          </View>
        ) : state === "learning" ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Icon name="book-open" size={13} color={c.accent} />
            <Text style={{ color: c.accent, fontSize: 11.5, fontFamily: FONT.bold }}>{t("Learning", "Ninajifunza")}</Text>
          </View>
        ) : (
          <Text style={{ color: tone, fontSize: 11.5, fontFamily: FONT.bold }}>{priLabel}</Text>
        )}
      </View>

      {/* ONE explanation. This card used to carry two — `reason` and the
          course's own `why` — saying the same thing in different words, which
          is most of why it read as heavy. The reason wins: it comes from this
          person's actual job matches ("3 of the 5 jobs you match ask for this")
          and the course blurb never could. */}
      <Text style={{ color: c.textBody, fontSize: 13, lineHeight: 19, fontFamily: FONT.regular }}>{gap.reason[lang]}</Text>

      {/* The course, demoted to metadata. It is a link out of the app, so it
          does not get to compete with the free thing that happens right here. */}
      <View style={{ backgroundColor: c.bg, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 12, gap: 7 }}>
        <Text style={{ color: c.text, fontSize: 14, fontFamily: FONT.bold }}>{co.title}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Text style={{ color: c.accent, fontSize: 12, fontFamily: FONT.bold }}>{co.provider}</Text>
          <View style={{ backgroundColor: c.success + "1f", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ color: c.success, fontSize: 10, fontFamily: FONT.mono }}>{t("FREE", "BURE")}</Text>
          </View>
          <Text style={{ color: c.textMuted, fontSize: 11.5, fontFamily: FONT.mono }}>~{co.durationWeeks} {t("wks", "wiki")}</Text>
          <Pressable
            onPress={onLearn}
            hitSlop={8}
            accessibilityRole="link"
            accessibilityLabel={t(`Open ${co.title}`, `Fungua ${co.title}`)}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, minHeight: MIN_TARGET }}
          >
            <Text style={{ color: c.accent, fontSize: 12.5, fontFamily: FONT.bold, textDecorationLine: "underline" }}>
              {t("Learn", "Jifunze")}
            </Text>
            <Icon name="external-link" size={12} color={c.accent} />
          </Pressable>
        </View>
        <Chips items={co.improves} color={c.accent} />
        {area.fastPath ? (
          <Pressable
            onPress={() => confirmAndOpenUrl(area.fastPath!.url, t)}
            hitSlop={8}
            accessibilityRole="link"
            accessibilityLabel={area.fastPath.label[lang]}
            style={{ flexDirection: "row", alignItems: "center", gap: 5, minHeight: MIN_TARGET }}
          >
            <Icon name="play-circle" size={13} color={c.textMuted} />
            <Text style={{ color: c.textMuted, fontSize: 12, fontFamily: FONT.semibold }}>{area.fastPath.label[lang]}</Text>
          </Pressable>
        ) : null}
      </View>

      {state !== "can-do" ? (
        <>
          {/* One thing to do, and it says what it will do. The preview line
              lives inside the button instead of in a paragraph underneath
              labelled "What the button does" — same information, one glance,
              and the label no longer needs an apology. */}
          {area.practice.length ? (
            <Button
              size="sm"
              label={t("Practise this skill", "Fanya mazoezi ya ujuzi huu")}
              sublabel={question ? `“${question}”` : undefined}
              onPress={onPractise}
            />
          ) : null}

          {/* The one thing the app genuinely cannot infer. Tapping either action
              above already means "I'm working on this", so there is no separate
              "Mark as learning" button any more. */}
          <Pressable
            accessibilityRole="button"
            onPress={onCanDo}
            hitSlop={8}
            style={{ alignSelf: "flex-start", minHeight: MIN_TARGET, justifyContent: "center" }}
          >
            <Text style={{ color: c.success, fontSize: 12.5, fontFamily: FONT.semibold, textDecorationLine: "underline" }}>
              {t("I can do this — add", "Naweza — ongeza")}
            </Text>
          </Pressable>
        </>
      ) : null}
    </Card>
  );
}

/** One thing the hub teaches: a short course (step-tracked) or a guide. */
type HubEntry =
  | {
      kind: "course";
      key: string;
      free: true;
      minutes: number;
      title: { en: string; sw: string };
      blurb: { en: string; sw: string };
      course: ShortCourse;
      progress: CourseProgress;
    }
  | {
      kind: "guide";
      key: string;
      free: boolean;
      minutes: number;
      title: { en: string; sw: string };
      blurb: { en: string; sw: string };
      guide: Guide;
    };

export function LearningHubScreen({ navigation }: LearningHubScreenProps) {
  const c = useThemeColors();
  const reduceMotion = useMotionReduced();
  const { t, lang } = useLang();
  const { premium } = useEntitlements();
  const { cvs } = useCvs();

  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [jobs, setJobs] = useState<JobRecommendation[]>([]);
  const [progress, setProgress] = useState<Record<string, SkillState>>({});
  const [loading, setLoading] = useState(true);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [catalogue, setCatalogue] = useState<{ id: string; title: string; platform: string; url: string; free: boolean }[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<HubFilter>("all");
  const [openCourse, setOpenCourse] = useState<string | null>(null);
  const [offering, setOffering] = useState(false);

  // Short-course progress lives on the device, so the hub can say where you
  // stopped instead of starting from zero every visit. Read for every course in
  // the catalogue — a course added to lib/short-courses.ts appears here without
  // this screen being touched.
  const [courseProgress, setCourseProgress] = useState<Record<string, CourseProgress>>({});
  const reloadCourses = useCallback(async () => {
    const pairs = await Promise.all(
      SHORT_COURSES.map(async (course) => [course.id, await getCourseProgress(course.id)] as const),
    );
    setCourseProgress(Object.fromEntries(pairs));
  }, []);
  useFocusEffect(useCallback(() => { void reloadCourses(); }, [reloadCourses]));

  const runCourseUnit = useCallback(
    async (courseId: string, course: ShortCourse, unit: CourseUnit, action: CourseAction) => {
      const next = await markCourseUnit(courseId, course, unit.id);
      setCourseProgress((p) => ({ ...p, [courseId]: next }));
      if (unit.kind === "link" && unit.url) confirmAndOpenUrl(unit.url, t);
      switch (action) {
        case "sumaiya":
          navigation.navigate("SumaiyaTab", {
            seed: unit.seed ? t(unit.seed.en, unit.seed.sw) : undefined,
          });
          break;
        case "cvs": navigation.navigate("CVsTab"); break;
        case "import": navigation.navigate("ImportTab"); break;
        case "ats": navigation.navigate("AtsChecker", {}); break;
        case "profile": navigation.navigate("ProfileTab"); break;
        case "letter": navigation.navigate("JobApply", { want: "letter" }); break;
        case "jobs": navigation.navigate("Jobs"); break;
        case "applications": navigation.navigate("Applications"); break;
        default: break;
      }
    },
    [navigation, t],
  );

  // The lesson being read. Held here rather than inside the step list so there
  // is one sheet on the screen instead of one per course.
  const [lesson, setLesson] = useState<{ courseId: string; course: ShortCourse; unit: CourseUnit } | null>(null);

  const openLesson = useCallback((courseId: string, course: ShortCourse, unit: CourseUnit) => {
    haptics.light();
    setLesson({ courseId, course, unit });
  }, []);

  /**
   * A lesson was finished. The sheet knows nothing about progress, so the tick
   * happens here — through the same door the task units use, which means a
   * lesson's practice step opens exactly where that action already pointed.
   */
  const finishLesson = useCallback(
    (action: CourseAction | null) => {
      const open = lesson;
      setLesson(null);
      if (!open) return;
      void runCourseUnit(open.courseId, open.course, open.unit, action ?? "mark");
    },
    [lesson, runCourseUnit],
  );

  const resetOne = useCallback((key: string) => {
    void resetCourse(key).then((p) => setCourseProgress((s) => ({ ...s, [key]: p })));
  }, []);

  const latestCv: CVData | null = useMemo(() => {
    const sorted = [...cvs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return (sorted[0]?.data as CVData) ?? null;
  }, [cvs]);

  const load = useCallback(async () => {
    try {
      const [p, j, pr] = await Promise.all([loadProfile(), apiClient.getJobRecommendations(10), getSkillProgress()]);
      setProfile(p);
      setJobs(j);
      setProgress(pr);
      setLoadError(false);
    } catch {
      // No catch here used to mean an offline getJobRecommendations() left
      // `profile` at its initial null — which renders the "Finish your
      // profile" prompt below, falsely telling a user with a complete
      // profile that it's incomplete when the real problem was the fetch.
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const result: GapResult | null = useMemo(() => {
    if (!profile) return null;
    return computeSkillGaps({ profile, cv: latestCv, jobs, lang });
  }, [profile, latestCv, jobs, lang]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const addSkillToCv = async (label: string, skillId: string) => {
    haptics.success();
    setProgress((p) => ({ ...p, [skillId]: "can-do" }));
    await setSkillState(skillId, "can-do");
    if (profile) {
      const have = profile.skills.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
      if (!have.some((s) => s.toLowerCase() === label.toLowerCase())) {
        const next = { ...profile, skills: [...have, label].join(", ") };
        const { updatedAt, ...rest } = next;
        await saveProfile(rest);
        setProfile(next);
      }
    }
    flash(t(`Added "${label}" — your match may improve.`, `"${label}" imeongezwa — ulinganifu wako unaweza kupanda.`));
  };

  const markLearning = async (skillId: string) => {
    haptics.selection();
    setProgress((p) => ({ ...p, [skillId]: "learning" }));
    await setSkillState(skillId, "learning");
  };

  const practise = (gap: SkillGap) => {
    const p = gap.area.practice[0];
    if (!p) return;
    const seed = (lang === "sw" ? p.sw : p.en).replace("[job]", result?.target || t("this job", "ajira hii"));
    navigation.navigate("SumaiyaTab", { seed });
  };

  const openExplore = useCallback(async () => {
    setExploreOpen(true);
    if (catalogue.length) return;
    try {
      setCatalogue(await apiClient.getLearningResources());
    } catch {
      /* ignore — curated list is the point anyway */
    }
  }, [catalogue.length]);

  const exploreFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Free is not a filter any more, it's the rule: we never show a paid course,
    // ours or anyone else's. Someone looking for work has no money to spare.
    return catalogue.filter((r) => r.free && (!q || r.title.toLowerCase().includes(q) || r.platform.toLowerCase().includes(q)));
  }, [catalogue, query]);

  // ── The catalogue the design's `Kozi Zote Zilizopo` lists ───────────────────
  // Short courses first (they are step-tracked and offline), then the guides.
  // `free` is not decoration: for a guide it is `tier`, which is the same field
  // the gate itself reads, so the chip and the lock can never disagree.
  const entries = useMemo<HubEntry[]>(
    () => [
      ...SHORT_COURSES.map((course): HubEntry => ({
        kind: "course",
        key: course.id,
        free: true,
        minutes: course.minutes,
        title: course.title,
        blurb: course.blurb,
        course,
        progress: courseProgress[course.id] ?? EMPTY_COURSE,
      })),
      ...GUIDES.map((guide): HubEntry => ({
        kind: "guide",
        key: `guide:${guide.id}`,
        free: guide.tier !== "premium",
        minutes: guide.minutes,
        title: guide.title,
        blurb: guide.summary,
        guide,
      })),
    ],
    [courseProgress],
  );

  const counts = useMemo(
    () => ({
      all: entries.length,
      free: entries.filter((e) => e.free).length,
      premium: entries.filter((e) => !e.free).length,
    }),
    [entries],
  );

  const visible = useMemo(
    () => entries.filter((e) => filter === "all" || (filter === "free") === e.free),
    [entries, filter],
  );

  // The course to resume: started, not finished. The most advanced one wins,
  // because that is the one whose next step is nearest. Nothing started means
  // no card at all — a "continue" for a course nobody began would be a lie, and
  // the design forbids a bar for a course the user has not started.
  const inProgress = useMemo(() => {
    const started = entries.filter(
      (e): e is Extract<HubEntry, { kind: "course" }> => e.kind === "course" && courseDone(e.progress, e.course) > 0 && !courseIsComplete(e.progress, e.course),
    );
    return started.sort((a, b) => coursePercent(b.progress, b.course) - coursePercent(a.progress, a.course))[0] ?? null;
  }, [entries]);

  const resume = useCallback(() => {
    if (!inProgress) return;
    const next = inProgress.course.units.find((u) => !inProgress.progress.done.includes(u.id));
    if (!next) return;
    haptics.light();
    if (next.kind === "lesson") openLesson(inProgress.course.id, inProgress.course, next);
    else void runCourseUnit(inProgress.course.id, inProgress.course, next, next.action ?? "mark");
  }, [inProgress, openLesson, runCourseUnit]);

  const openGuide = useCallback(
    (guide: Guide, locked: boolean) => {
      if (locked) {
        // The real gate: `premium` comes from the server's earned window, the
        // same entitlement the guide screen reads.
        setOffering(true);
        return;
      }
      navigation.navigate("Guide", { id: guide.id });
    },
    [navigation],
  );

  const gaps = (result?.gaps ?? []).filter((g) => progress[g.area.id] !== "can-do").slice(0, 5);
  const strengths = result?.strengths ?? [];

  return (
    <Screen scroll keyboardAvoiding={false} contentContainerStyle={{ gap: 18 }}>
      <Pressable
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => { haptics.selection(); navigation.goBack(); }}
        style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, minHeight: MIN_TARGET }}
      >
        <Icon name="arrow-left" size={18} color={c.accent} />
        <Text style={{ color: c.accent, fontFamily: FONT.bold }}>{t("Back", "Rudi")}</Text>
      </Pressable>

      {/* 1 — the title and the live count. No version pill, no bell (§7). */}
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Text style={{ flexShrink: 1, color: c.text, fontSize: 24, lineHeight: 30, letterSpacing: -0.4, fontFamily: FONT.display }}>
            {t("Learning hub", "Kituo cha Mafunzo")}
          </Text>
          <View style={{ flexShrink: 0, backgroundColor: c.bgSunken, borderWidth: 1, borderColor: c.border, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 }}>
            <Text style={{ color: c.textBody, fontSize: 11.5, fontFamily: FONT.mono }}>
              {t(`Courses ${counts.all}`, `Mafunzo ${counts.all}`)}
            </Text>
          </View>
        </View>
        <Text style={{ color: c.textBody, fontSize: 12.5, lineHeight: 18, fontFamily: FONT.regular }}>
          {t(
            "Learn the skills the market needs and improve your chances of being hired.",
            "Jifunze ujuzi unaohitajika sokoni na uboreshe nafasi yako ya kuajiriwa.",
          )}
        </Text>
      </View>

      {toast ? (
        <Animated.View entering={FadeIn.duration(enterDurationMs(reduceMotion, MOTION.dur.base)).easing(EASE.out)} exiting={FadeOut.duration(exitDurationMs(reduceMotion, MOTION.dur.fast)).easing(EASE.in)} style={{ backgroundColor: c.success + "1a", borderRadius: 12, borderWidth: 1, borderColor: c.success + "40", padding: 12, flexDirection: "row", gap: 8, alignItems: "center" }}>
          <Icon name="check-circle" size={16} color={c.success} />
          <Text style={{ color: c.text, fontSize: 12.5, flex: 1, fontFamily: FONT.regular }}>{toast}</Text>
        </Animated.View>
      ) : null}

      {/* 2 — `Endelea na Somo`. Only ever a course with real stored progress. */}
      {inProgress ? <ContinueCard course={inProgress.course} progress={inProgress.progress} onContinue={resume} /> : null}

      {/* 3 — `Kozi Zote Zilizopo`: every course, free or premium on the card. */}
      <View style={{ gap: 12 }}>
        <SectionLabel>{t("All available courses", "Kozi Zote Zilizopo")}</SectionLabel>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8, alignItems: "center" }} style={{ flexGrow: 0 }}>
          {FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={t(f.en, f.sw)}
              count={counts[f.key]}
              active={filter === f.key}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </ScrollView>

        {visible.length === 0 ? (
          <EmptyState
            icon="search"
            title={t("Nothing here yet", "Bado hakuna")}
            body={t("Try a different filter.", "Jaribu kichujio kingine.")}
          />
        ) : (
          <View style={{ gap: 10 }}>
            {visible.map((e) => {
              if (e.kind === "course") {
                const expanded = openCourse === e.key;
                return (
                  <View key={e.key} style={{ gap: 10 }}>
                    <HubRow
                      free
                      title={t(e.title.en, e.title.sw)}
                      blurb={t(e.blurb.en, e.blurb.sw)}
                      minutes={e.minutes}
                      actionLabel={expanded ? t("Close", "Funga") : t("Read", "Soma")}
                      accessibilityLabel={`${t(e.title.en, e.title.sw)}. ${e.minutes} ${t("min", "dakika")}. ${t("FREE", "BURE")}`}
                      expanded={expanded}
                      onPress={() => setOpenCourse(expanded ? null : e.key)}
                    />
                    {expanded ? (
                      <CourseSteps
                        course={e.course}
                        progress={e.progress}
                        onUnit={(u, a) => void runCourseUnit(e.course.id, e.course, u, a)}
                        onOpenLesson={(u) => openLesson(e.course.id, e.course, u)}
                        onReset={() => resetOne(e.key)}
                      />
                    ) : null}
                  </View>
                );
              }

              const locked = !e.free && !premium;
              return (
                <HubRow
                  key={e.key}
                  free={e.free}
                  title={t(e.title.en, e.title.sw)}
                  // How it is really unlocked. The fragment's copy here names a
                  // monthly or daily package that the product does not sell —
                  // paying is not open yet, and Premium is earned through
                  // referrals (components/premium-sheet.tsx). No price figure
                  // appears anywhere on this screen.
                  blurb={
                    locked
                      ? t(
                          "Available with Premium — earned by inviting friends",
                          "Inapatikana kwa Premium — unaipata kwa kualika marafiki",
                        )
                      : t(e.blurb.en, e.blurb.sw)
                  }
                  minutes={e.minutes}
                  actionLabel={locked ? t("Unlock", "Fungua") : t("Read", "Soma")}
                  accessibilityLabel={`${t(e.title.en, e.title.sw)}. ${e.minutes} ${t("min", "dakika")}. ${locked ? t("Premium", "Premium") : t("FREE", "BURE")}`}
                  onPress={() => openGuide(e.guide, locked)}
                />
              );
            })}
          </View>
        )}

        {/* 4 — the design's closing line. It describes the courses above: the
            short courses and the guides are bundled with the app, so they open
            with no network. */}
        <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <Text style={{ color: c.textMuted, fontSize: 11.5, fontFamily: FONT.mono }}>
            {t("Saved on your phone", "Imehifadhiwa kwenye simu")}
          </Text>
          <Text style={{ color: c.success, fontSize: 11.5, fontFamily: FONT.mono }}>
            {t("Works offline", "Inafanya kazi nje ya mtandao")}
          </Text>
        </View>
      </View>

      {/* ── Below the design's spine: what this person's own job matches say to
          learn next. Kept because it is the reason the hub exists — the design
          fragment simply does not cover it. ───────────────────────────────── */}

      {loading ? (
        <SkeletonList count={2} gap={10} />
      ) : (
        <>
          {/* target + readiness */}
          {loadError && !result ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void load()}
              style={{ flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: c.error + "10", borderWidth: 1, borderColor: c.error + "24", borderRadius: 12, padding: 14, minHeight: MIN_TARGET }}
            >
              <Icon name="alert-circle" size={18} color={c.error} />
              <Text style={{ flex: 1, color: c.textBody, fontSize: 12.5, lineHeight: 18, fontFamily: FONT.regular }}>
                {t("Couldn't load your skill gaps. Check your connection and tap to retry.", "Imeshindwa kupakia mapungufu ya ujuzi wako. Angalia mtandao kisha ugusa ili ujaribu tena.")}
              </Text>
            </Pressable>
          ) : result?.target ? (
            <View style={{ backgroundColor: c.bgElevated, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 14, gap: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <Text style={{ flexShrink: 1, color: c.textMuted, fontSize: 12, fontFamily: FONT.regular }}>
                  {t("Skills for", "Ujuzi wa")} <Text style={{ color: c.text, fontFamily: FONT.bold }}>{result.target}</Text>
                </Text>
                <Text style={{ color: c.text, fontSize: 13, fontFamily: FONT.mono }}>{result.readiness}% {t("ready", "tayari")}</Text>
              </View>
              <ProgressBar
                value={Math.max(0.04, result.readiness / 100)}
                tone={result.readiness >= 60 ? "success" : result.readiness >= 30 ? "warning" : "accent"}
              />
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => { haptics.selection(); navigation.navigate("Jobs"); }}
              style={{ flexDirection: "row", gap: 12, alignItems: "center", backgroundColor: c.accent + "10", borderWidth: 1, borderColor: c.accent + "24", borderRadius: 14, padding: 16, minHeight: MIN_TARGET }}
            >
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: c.accent + "1f", alignItems: "center", justifyContent: "center" }}>
                <SumaiyaMark size={18} state="static" color={c.accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: c.text, fontSize: 14.5, fontFamily: FONT.bold }}>
                  {t("Add your first job to see what to learn", "Ongeza kazi yako ya kwanza uone cha kujifunza")}
                </Text>
                <Text style={{ color: c.textMuted, fontSize: 12.5, lineHeight: 18, marginTop: 2, fontFamily: FONT.regular }}>
                  {t("Finish your profile and I'll show you the exact skills to build for the jobs you want.", "Kamilisha wasifu wako nami nikuonyeshe ujuzi hasa wa kujenga kwa kazi unazotaka.")}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                <Text style={{ color: c.accent, fontSize: 12.5, fontFamily: FONT.bold }}>{t("Find jobs", "Tafuta kazi")}</Text>
                <Icon name="chevron-right" size={18} color={c.accent} />
              </View>
            </Pressable>
          )}

          {/* YOUR NEXT SKILLS */}
          {gaps.length > 0 ? (
            <View style={{ gap: 12 }}>
              <SectionLabel>{t("Your next skills", "Ujuzi wako unaofuata")}</SectionLabel>
              {gaps.map((g, i) => (
                <Stagger key={g.area.id} index={i} step={40}>
                  <GapCard
                    gap={g}
                    state={progress[g.area.id]}
                    onLearn={() => {
                      haptics.light();
                      // Engaging with the skill IS the signal — no second tap
                      // needed to record it.
                      void markLearning(g.area.id);
                      confirmAndOpenUrl(g.area.course.url, t);
                    }}
                    onPractise={() => {
                      void markLearning(g.area.id);
                      practise(g);
                    }}
                    onCanDo={() => void addSkillToCv(g.area.skill.en, g.area.id)}
                  />
                </Stagger>
              ))}
            </View>
          ) : result ? (
            <View style={{ flexDirection: "row", gap: 10, alignItems: "center", padding: 14, borderRadius: 12, backgroundColor: c.success + "12", borderWidth: 1, borderColor: c.success + "2a" }}>
              <Icon name="check-circle" size={18} color={c.success} />
              <Text style={{ flex: 1, color: c.textBody, fontSize: 12.5, fontFamily: FONT.regular }}>
                {t("You're covering the main skills for your target. Keep an eye on new job matches.", "Unashughulikia ujuzi mkuu kwa lengo lako. Endelea kuangalia ajira mpya zinazolingana.")}
              </Text>
            </View>
          ) : null}

          {/* strengths */}
          {strengths.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: c.textMuted, fontSize: 12, fontFamily: FONT.regular }}>{t("You already show", "Tayari unaonyesha")}:</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {strengths.map((s) => (
                  <View key={s.id} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c.success + "16", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Icon name="check" size={11} color={c.success} />
                    <Text style={{ color: c.success, fontSize: 11.5, fontFamily: FONT.semibold }}>{s.skill[lang]}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </>
      )}

      {/* EXPLORE ALL — the server's free catalogue, which is external and has no
          duration or step count, so it keeps its own compact list. */}
      {!exploreOpen ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => void openExplore()}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, minHeight: MIN_TARGET, borderRadius: 14, borderWidth: 1, borderColor: c.border }}
        >
          <Text style={{ color: c.text, fontSize: 14, fontFamily: FONT.bold }}>{t("Explore all courses", "Chunguza kozi zote")}</Text>
          <Icon name="chevron-down" size={16} color={c.textMuted} />
        </Pressable>
      ) : (
        <View style={{ gap: 12 }}>
          <SectionLabel>{t("Explore all courses", "Chunguza kozi zote")}</SectionLabel>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.bgElevated, borderWidth: 1.5, borderColor: c.border, borderRadius: 12, paddingHorizontal: 12 }}>
            <Icon name="search" size={16} color={c.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("Search courses", "Tafuta kozi")}
              placeholderTextColor={c.textMuted}
              selectionColor={c.accent}
              style={{ flex: 1, paddingVertical: 11, fontSize: 15, color: c.text, fontFamily: FONT.regular }}
            />
          </View>
          {exploreFiltered.length === 0 ? (
            <EmptyState icon="search" title={t("Nothing here yet", "Bado hakuna")} body={t("Try a different search.", "Jaribu utafutaji mwingine.")} />
          ) : (
            exploreFiltered.map((r) => (
              <Card key={r.id} style={{ gap: 8 }}>
                <Text style={{ color: c.text, fontSize: 14.5, fontFamily: FONT.bold }}>{r.title}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ color: c.accent, fontSize: 12.5, fontFamily: FONT.bold }}>{r.platform}</Text>
                  <View style={{ backgroundColor: (r.free ? c.success : c.warning) + "1f", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ color: r.free ? c.success : c.warning, fontSize: 10, fontFamily: FONT.mono }}>{r.free ? t("FREE", "BURE") : t("PAID", "INALIPWA")}</Text>
                  </View>
                </View>
                <Button label={t("Open course", "Fungua kozi")} variant="secondary" size="sm" rightIcon={<Icon name="external-link" size={13} color={c.text} />} onPress={() => confirmAndOpenUrl(r.url, t)} />
              </Card>
            ))
          )}
        </View>
      )}

      {/* Ask Sumaiya — learning ties back to the AI, not a separate LMS. */}
      <View style={{ gap: 10 }}>
        <SectionLabel>{t("Ask about your career", "Uliza kuhusu kazi yako")}</SectionLabel>
        <Card
          onPress={() => { haptics.selection(); navigation.navigate("SumaiyaTab"); }}
          accessibilityLabel={t("Ask me anything", "Niulize chochote")}
          style={{ gap: 10 }}
        >
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            {[
              t("What should I learn first?", "Nijifunze nini kwanza?"),
              t("Do I need Excel for this job?", "Je, ninahitaji Excel kwa kazi hii?"),
              t("How can I improve my CV?", "Niboresheje CV yangu?"),
            ].map((q) => (
              <View key={q} style={{ backgroundColor: c.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: c.textBody, fontSize: 12, fontFamily: FONT.regular }}>{q}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <SumaiyaMark size={15} state="static" color={c.accent} />
            <Text style={{ color: c.accent, fontSize: 13, fontFamily: FONT.bold }}>
              {t("Ask me anything", "Niulize chochote")} →
            </Text>
          </View>
        </Card>
      </View>

      {/* Read, then answer, then practise. Mounted once, at screen level. */}
      <LessonSheet unit={lesson?.unit ?? null} onClose={() => setLesson(null)} onComplete={finishLesson} />

      {/* The real paywall for a locked course. Its copy is the true route to
          Premium — earned through referrals, since paying is not open. */}
      <PremiumSheet visible={offering} onClose={() => setOffering(false)} feature="courses" />
    </Screen>
  );
}
