/**
 * A lesson, opened and read.
 *
 * This is the piece the Learning Hub was missing. Every other unit walked the
 * person somewhere else — to a website, to another screen — so "doing the
 * course" meant leaving it. A lesson's whole value is on this screen.
 *
 * Reading typography is deliberately guide-screen.tsx's, not the course card's:
 * the card packs 12.5/18 into a scrolling list where the text is a caption for
 * a button, and this is the opposite of that. Someone reading four paragraphs on
 * a 5-inch phone at 40% brightness needs the comfortable scale, and it already
 * existed one file away, so it is reused rather than re-invented.
 *
 * Order is fixed and intentional: read → the one sentence worth keeping → one
 * question → practice. The question sits BEFORE the practice on purpose. Without
 * it a lesson can be dismissed in three seconds and still count as finished;
 * with it, "finished" means something.
 */
import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Button, haptics, useThemeColors } from "../ui";
import { Icon } from "../icon";
import { useLang } from "../../lib/i18n";
import type { CourseAction, CourseUnit } from "../../lib/short-course";

interface Props {
  /** The lesson to open; null when nothing is open. */
  unit: CourseUnit | null;
  onClose: () => void;
  /**
   * The person finished. `action` is the practice step to open, or null when the
   * lesson ends on its own. The caller marks the unit done — this component
   * never touches progress.
   */
  onComplete: (action: CourseAction | null) => void;
}

/** Reading scale, lifted from guide-screen.tsx. */
const BODY = { fontSize: 14.5, lineHeight: 23 } as const;

export function LessonSheet({ unit, onClose, onComplete }: Props) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const { width, height } = useWindowDimensions();

  const [picked, setPicked] = useState<number | null>(null);
  const [wrong, setWrong] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const shown = unit !== null;
  const progress = useSharedValue(0);
  const [mounted, setMounted] = useState(shown);

  // A new lesson starts unanswered — otherwise the previous lesson's answer
  // would still be sitting there when the next one opens.
  useEffect(() => {
    setPicked(null);
    setWrong(0);
    setRevealed(false);
  }, [unit?.id]);

  useEffect(() => {
    if (shown) {
      setMounted(true);
      progress.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: 150 }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheet = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 24 }],
  }));

  if (!mounted || !unit?.lesson) return null;

  const lesson = unit.lesson;
  const paragraphs = lang === "sw" ? lesson.paragraphs.sw : lesson.paragraphs.en;
  const cp = lesson.checkpoint;
  const answeredRight = cp ? picked === cp.answer : true;
  const canFinish = !cp || answeredRight || revealed;
  /** Picked a wrong option and hasn't run out of attempts — show the gentle nudge. */
  const pickedWrong = !!cp && picked !== null && picked !== cp.answer && !revealed;

  const choose = (i: number) => {
    if (!cp || answeredRight || revealed) return;
    setPicked(i);
    if (i === cp.answer) {
      haptics.success();
      return;
    }
    haptics.warning();
    const tries = wrong + 1;
    setWrong(tries);
    // Two honest attempts, then show it. Never leave someone stuck with no way
    // forward — that turns a lesson into a locked door.
    if (tries >= 2) setRevealed(true);
  };

  const finish = () => {
    haptics.success();
    onComplete(unit.action ?? null);
  };

  return (
    <Modal transparent visible={mounted} onRequestClose={onClose} animationType="none" statusBarTranslucent>
      <Animated.View style={[backdrop, { width, height, backgroundColor: c.overlay }]}>
        <Animated.View
          style={[
            sheet,
            {
              flex: 1,
              marginTop: 44,
              backgroundColor: c.bgElevated,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              borderWidth: 1,
              borderColor: c.border,
              overflow: "hidden",
            },
          ]}
        >
          {/* header */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: c.accent, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 }}>
                {t("LESSON", "SOMO")}
              </Text>
              <Text style={{ color: c.text, fontSize: 20, fontWeight: "800", lineHeight: 26 }}>
                {t(unit.title.en, unit.title.sw)}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Close", "Funga")}
              onPress={() => { haptics.light(); onClose(); }}
              hitSlop={10}
              style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: c.bg }}
            >
              <Icon name="x" size={16} color={c.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 28, gap: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {paragraphs.map((p, i) => (
              <Text key={i} style={{ color: c.textBody, ...BODY }}>
                {p}
              </Text>
            ))}

            {lesson.keyPoint ? (
              <View style={{ flexDirection: "row", gap: 10, backgroundColor: c.accent + "12", borderRadius: 12, padding: 13 }}>
                <Icon name="book-open" size={15} color={c.accent} />
                <Text style={{ flex: 1, color: c.text, fontSize: 14.5, lineHeight: 21, fontWeight: "700" }}>
                  {t(lesson.keyPoint.en, lesson.keyPoint.sw)}
                </Text>
              </View>
            ) : null}

            {cp ? (
              <View style={{ gap: 10, marginTop: 4 }}>
                <Text style={{ color: c.text, fontSize: 16.5, fontWeight: "800", lineHeight: 22 }}>
                  {t(cp.question.en, cp.question.sw)}
                </Text>
                {cp.options.map((o, i) => {
                  const isPicked = picked === i;
                  const isRight = revealed && i === cp.answer;
                  const isWrongPick = isPicked && !isRight && i !== cp.answer;
                  const border = isRight ? c.success : isWrongPick ? c.error : isPicked ? c.accent : c.border;
                  return (
                    <Pressable
                      key={i}
                      accessibilityRole="button"
                      accessibilityLabel={t(o.en, o.sw)}
                      disabled={answeredRight || revealed}
                      onPress={() => choose(i)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        padding: 13,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: border,
                        backgroundColor: isRight ? c.success + "14" : isWrongPick ? c.error + "10" : c.bg,
                      }}
                    >
                      <Text style={{ flex: 1, color: c.text, fontSize: 14.5, lineHeight: 21 }}>
                        {t(o.en, o.sw)}
                      </Text>
                      {isRight ? <Icon name="check-circle" size={16} color={c.success} /> : null}
                    </Pressable>
                  );
                })}

                {pickedWrong && wrong < 2 ? (
                  <Text style={{ color: c.textBody, fontSize: 13.5, lineHeight: 20 }}>
                    {t("Not that one. Read the lesson again and pick another.", "Sio hiyo. Soma somo tena kisha chagua lingine.")}
                  </Text>
                ) : null}

                {answeredRight || revealed ? (
                  <View style={{ gap: 6, backgroundColor: c.success + "10", borderRadius: 12, padding: 13 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Icon name="check-circle" size={14} color={c.success} />
                      <Text style={{ color: c.success, fontSize: 12.5, fontWeight: "800" }}>
                        {answeredRight
                          ? t("Right", "Sahihi")
                          : t("The right answer", "Jibu sahihi")}
                      </Text>
                    </View>
                    <Text style={{ color: c.textBody, fontSize: 13.5, lineHeight: 20 }}>
                      {t(cp.why.en, cp.why.sw)}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {canFinish ? (
              <View style={{ marginTop: 6 }}>
                {unit.cta ? (
                  <Button label={t(unit.cta.en, unit.cta.sw)} onPress={finish} />
                ) : (
                  <Button label={t("I've got it", "Nimeelewa")} onPress={finish} />
                )}
              </View>
            ) : null}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
