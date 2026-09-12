/**
 * One short course, rendered the same way everywhere it appears.
 *
 * Design rules this card is built to keep:
 * - the thing is named out loud (a unit is "Send me the advert", not "Next")
 * - a unit that opens something says where it opens ("Open the list of jobs")
 * - a unit that only needs a yes is a plain confirmation ("I have looked at them")
 * - the tick means finished; numbers mean not started. Nothing cleverer.
 * - a link is not a step: websites live in `course.resources`, never in `units`,
 *   so nothing here can be "completed" by opening somebody else's website
 */
import React from "react";
import { Pressable, Text, View } from "react-native";
import { Button, ProgressBar, haptics, useThemeColors } from "../ui";
import { Icon } from "../icon";
import { SumaiyaMark } from "../sumaiya-mark";
import { useLang } from "../../lib/i18n";
import { confirmAndOpenUrl } from "../../lib/external-link";
import {
  courseDone,
  courseIsComplete,
  courseTotal,
  type CourseAction,
  type CourseProgress,
  type CourseResource,
  type CourseUnit,
  type ShortCourse,
} from "../../lib/short-course";

interface Props {
  course: ShortCourse;
  progress: CourseProgress;
  onUnit: (unit: CourseUnit, action: CourseAction) => void;
  /** Opens the reading view. Lessons are read, not ticked from the list. */
  onOpenLesson: (unit: CourseUnit) => void;
  onReset: () => void;
}

/**
 * The places to look, kept small and out of the way.
 *
 * Six of these used to be steps 1–6 of the course at the top of the card, which
 * is what made the whole thing read as a wall of links. A chip is enough: the
 * names are recognisable to anyone job-hunting in Tanzania, and the note that
 * explained each one now belongs to the lesson that actually says where to look.
 */
function ResourceChips({ resources }: { resources: CourseResource[] }) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  if (!resources.length) return null;
  return (
    <View style={{ marginLeft: 31, gap: 8 }}>
      <Text style={{ color: c.textMuted, fontSize: 11.5, fontWeight: "800", letterSpacing: 0.3 }}>
        {t("WEBSITES TO LOOK AT", "TOVUTI ZA KUANGALIA")}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
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
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.bg,
            }}
          >
            <Text style={{ color: c.text, fontSize: 12, fontWeight: "700" }}>
              {lang === "sw" ? r.name.sw : r.name.en}
            </Text>
            <Icon name="external-link" size={11} color={c.textMuted} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function CourseCard({ course, progress, onUnit, onOpenLesson, onReset }: Props) {
  const c = useThemeColors();
  const { t } = useLang();
  const done = courseDone(progress, course);
  const total = courseTotal(course);
  const complete = courseIsComplete(progress, course);

  return (
    <View style={{ borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.bgElevated, padding: 14, gap: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <View style={{ backgroundColor: c.success + "1A", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ color: c.success, fontSize: 10.5, fontWeight: "800", letterSpacing: 0.3 }}>{t("FREE", "BURE")}</Text>
        </View>
        <Text style={{ color: c.textMuted, fontSize: 11.5, fontWeight: "700" }}>
          {t(`${total} steps · about ${course.minutes} min`, `Hatua ${total} · dakika ${course.minutes}`)}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
        <SumaiyaMark size={20} state="static" color={c.accent} />
        <Text style={{ flex: 1, color: c.text, fontSize: 16, fontWeight: "800", lineHeight: 22 }}>{t(course.title.en, course.title.sw)}</Text>
      </View>
      <Text style={{ color: c.textBody, fontSize: 12.5, lineHeight: 18, marginTop: -6 }}>{t(course.blurb.en, course.blurb.sw)}</Text>

      <View style={{ gap: 7 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: c.text, fontSize: 13, fontWeight: "700" }}>
            {complete
              ? t("You finished every step", "Umekamilisha hatua zote")
              : t(`You have finished ${done} of ${total}`, `Umekamilisha ${done} kati ya ${total}`)}
          </Text>
          <Text style={{ color: complete ? c.success : c.textMuted, fontSize: 12, fontWeight: "700" }}>
            {Math.round((done / total) * 100)}%
          </Text>
        </View>
        <ProgressBar value={total === 0 ? 0 : done / total} height={6} />
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
                    <Text style={{ color: c.accent, fontSize: 11.5, fontWeight: "800" }}>{i + 1}</Text>
                  )}
                </View>
                <Text style={{ flex: 1, color: c.text, fontSize: 13.5, fontWeight: "700" }}>{t(u.title.en, u.title.sw)}</Text>
              </View>

              {u.kind === "lesson" ? (
                /* Read, don't tick. A lesson gets its own row and its own screen
                   — the task layout (body + CTA) would make it look like just
                   another button, which is exactly how it used to read. */
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
                    padding: 12,
                    marginLeft: 31,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: finished ? c.success + "44" : c.accent + "33",
                    backgroundColor: c.accent + "0A",
                  }}
                >
                  <Icon name="book-open" size={14} color={finished ? c.success : c.accent} />
                  <Text style={{ flex: 1, color: finished ? c.success : c.accent, fontSize: 13, fontWeight: "800" }}>
                    {finished ? t("Read it again", "Soma tena") : t("Read the lesson", "Soma somo")}
                  </Text>
                  <Icon name="chevron-right" size={15} color={finished ? c.success : c.accent} />
                </Pressable>
              ) : u.kind === "link" ? (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={t(u.title.en, u.title.sw)}
                  onPress={() => {
                    haptics.light();
                    onUnit(u, "mark");
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                    marginLeft: 31,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: c.border,
                    backgroundColor: c.bg,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 13, fontWeight: "700" }}>{t(u.body?.en ?? "", u.body?.sw ?? "")}</Text>
                  </View>
                  <Icon name={finished ? "check-circle" : "external-link"} size={15} color={finished ? c.success : c.textMuted} />
                </Pressable>
              ) : (
                <View style={{ marginLeft: 31, gap: 9 }}>
                  {u.body ? (
                    <Text style={{ color: c.textBody, fontSize: 12.5, lineHeight: 18 }}>{t(u.body.en, u.body.sw)}</Text>
                  ) : null}
                  {u.cta ? (
                    <Button size="sm" variant="secondary" label={t(u.cta.en, u.cta.sw)} onPress={() => onUnit(u, u.action ?? "mark")} />
                  ) : null}
                </View>
              )}

              {/* The resource list sits with the step that's about looking at
                  listings, not at the end of the card where it belongs to
                  nothing. */}
              {course.resourcesAfter === u.id && course.resources?.length ? (
                <ResourceChips resources={course.resources} />
              ) : null}
            </View>
          );
        })}
      </View>

      {done > 0 ? (
        <Pressable onPress={() => { haptics.selection(); onReset(); }} style={{ alignSelf: "flex-start" }}>
          <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "700", textDecorationLine: "underline" }}>
            {t("Start over", "Anza upya")}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
