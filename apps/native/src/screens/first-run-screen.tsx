import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { setSecureItem } from "@sumaiya/utils";
import { useAuthContext } from "../contexts/auth-context";
import { saveProfile, EMPTY_PROFILE, type CareerProfile } from "../lib/profile-store";
import { keyboardAvoidingBehavior } from "../lib/keyboard-avoiding";
import { fieldLabels } from "../lib/career-fields";
import { Button, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";
import { FONT } from "../components/home";
import { useLang } from "../lib/i18n";
import { track } from "../lib/telemetry";

export const FIRST_RUN_KEY = "sumaiya_first_run_done";

interface Props {
  onDone: () => void;
}

/** One question per step (design A3), three steps, every one skippable. */
type StepId = "name" | "role" | "country";
const STEPS: StepId[] = ["name", "role", "country"];

/**
 * The four presets the design puts under the role question, each mapped to the
 * app's own career-field id so the answer is a real profile field and not a
 * label that has to be parsed back out of a string.
 */
const ROLE_PRESETS: { id: string; label: { en: string; sw: string } }[] = [
  { id: "finance-accounting", label: { en: "Accounting", sw: "Uhasibu" } },
  { id: "it-software", label: { en: "Technology & IT", sw: "Teknolojia & IT" } },
  { id: "education", label: { en: "Teaching", sw: "Ualimu" } },
  { id: "healthcare", label: { en: "Health", sw: "Afya" } },
];

/** The three areas the design's footer line names, stored as the profile's location. */
const AREA_PRESETS: { id: string; label: { en: string; sw: string } }[] = [
  { id: "tanzania", label: { en: "Tanzania", sw: "Tanzania" } },
  { id: "east-africa", label: { en: "East Africa", sw: "Afrika Mashariki" } },
  { id: "gulf", label: { en: "The Gulf", sw: "Ghuba" } },
];

/** The design's progress row: one dot per step, filled up to where you are. */
function StepDots({ total, current }: { total: number; current: number }) {
  const c = useThemeColors();
  const { t } = useLang();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={t(`Step ${current + 1} of ${total}`, `Hatua ya ${current + 1} Kati ya ${total}`)}
      accessibilityValue={{ min: 1, max: total, now: current + 1 }}
      style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: i <= current ? c.accent : c.border,
          }}
        />
      ))}
    </View>
  );
}

/** A tappable pill for a preset answer. 44 dp — §8's floor, not `hitSlop`. */
function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      style={{
        minHeight: 44,
        paddingHorizontal: 14,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? c.accent + "33" : c.border,
        backgroundColor: active ? c.accentTint : c.bgElevated,
      }}
    >
      <Text style={{ color: active ? c.accent : c.textBody, fontSize: 12.5, fontFamily: FONT.semibold }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** The labelled field the design uses for the question that needs typing. */
function StepField({
  label,
  value,
  onChangeText,
  placeholder,
  autoFocus,
  onSubmitEditing,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
}) {
  const c = useThemeColors();
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <Text style={{ color: c.textBody, fontSize: 12, fontFamily: FONT.semibold, marginBottom: 6 }}>
        {label}
      </Text>
      <View
        style={{
          minHeight: 52,
          justifyContent: "center",
          paddingHorizontal: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: focused ? c.accent : c.border,
          backgroundColor: c.bgSunken,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={c.textMuted}
          selectionColor={c.accent}
          autoFocus={autoFocus}
          returnKeyType="next"
          onSubmitEditing={onSubmitEditing}
          accessibilityLabel={label}
          style={{
            paddingVertical: 14,
            fontSize: 15,
            color: c.text,
            fontFamily: FONT.regular,
          }}
        />
      </View>
    </View>
  );
}

export function FirstRunScreen({ onDone }: Props) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const insets = useSafeAreaInsets();
  const { user } = useAuthContext();

  // ── Prefill from the account (Google gives a name; every path gives an email).
  const rawName = user?.name?.trim() ?? "";
  const looksLikeJunk =
    !rawName ||
    /^(hisense|samsung|xiaomi|infinix|tecno|itel|oppo|vivo|realme|nokia|huawei|redmi|android|iphone|ipad|roku|tv)\b/i.test(rawName) ||
    // A short device-model code (A125, G50, SM-A) almost always has a digit;
    // a short PURE-LETTER string this length is far more likely a real,
    // common Tanzanian first name (Ali, Juma, Zena, Toto, Iddi...) than
    // junk. This used to flag all of those as junk and silently discard a
    // name Google had already given correctly, forcing a real user to
    // retype their own name.
    (/^[a-z0-9]{1,4}$/i.test(rawName) && /\d/.test(rawName));
  const prefillName = looksLikeJunk ? "" : rawName;
  const email = user?.email ?? "";

  const [i, setI] = useState(0);
  const step = STEPS[i] ?? "name";

  const [name, setName] = useState(prefillName);
  const [fieldId, setFieldId] = useState("");
  const [role, setRole] = useState("");
  const [areaId, setAreaId] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Funnel instrumentation ────────────────────────────────────────────────
  // Nothing recorded a first-run before this, so "people probably stall at
  // skills and recent work" was an educated guess and a redesign pass would
  // have been spent on it blind. These events make it a fact: how many installs
  // reach each step, how long each one takes, and — for anyone who never
  // finished — which step they last saw.
  //
  // No PII: step names, positions, counts and durations. Never the name, the
  // role or anything typed into a field.
  const openedAt = useRef(Date.now());
  const stepAt = useRef(Date.now());
  const announced = useRef(false);

  useEffect(() => {
    if (announced.current) return;
    announced.current = true;
    track("firstrun.start", { steps: STEPS.length, prefilled_name: prefillName });
  }, [prefillName]);

  useEffect(() => {
    // Runs after the effect above on mount, so `announced` is already true.
    if (!announced.current) return;
    // `prev_seconds` is the time spent on the step just left.
    track("firstrun.step", { step, i, of: STEPS.length, prev_seconds: spentSeconds() });
    stepAt.current = Date.now();
  }, [step, i]);

  const spentSeconds = () => Math.round((Date.now() - stepAt.current) / 1000);

  // ── Progress. The design's dot row, and the count behind the eyebrow, are
  // both the real position in the real flow — nothing here is decorative.
  const slots = STEPS.length;
  const filled =
    (name.trim() || prefillName ? 1 : 0) +
    (role.trim() || fieldId ? 1 : 0) +
    (areaId ? 1 : 0);

  const isLast = i === STEPS.length - 1;

  const finish = async (skipped: boolean) => {
    if (saving) return;
    // Fired before the save, on purpose: a save that throws must still leave a
    // record that this person reached the end of the wizard.
    track("firstrun.finish", {
      skipped,
      completed: filled,
      of: slots,
      at_step: step,
      seconds: Math.round((Date.now() - openedAt.current) / 1000),
    });
    setSaving(true);
    haptics.selection();
    try {
      const area = AREA_PRESETS.find((a) => a.id === areaId);
      const next: CareerProfile = {
        ...EMPTY_PROFILE,
        fullName: name.trim() || prefillName,
        email,
        // What they typed wins; a preset answers the same question with the
        // app's own label for that field.
        headline: role.trim() || fieldLabels(fieldId ? [fieldId] : [], lang),
        // The design's third question is about the area they are aiming at,
        // which is the profile's `location`.
        location: area ? area.label[lang] : "",
      };
      const hasSomething = next.fullName || next.headline || next.location;
      if (!skipped || hasSomething) {
        const { updatedAt, ...rest } = next;
        await saveProfile(rest);
      }
      await setSecureItem(FIRST_RUN_KEY, "true").catch(() => {});
    } catch {
      // onDone() below still runs either way (finally) — first-run is a
      // one-shot flow and the user should never get stuck here over a rare
      // AsyncStorage fault. This only stops that fault from being an
      // unhandled rejection, since neither call site below catches finish().
    } finally {
      onDone();
    }
  };

  // ── The question on this step ──────────────────────────────────────────────
  const copy: Record<StepId, { eyebrow: string; title: string; body: string; hint?: string }> = useMemo(
    () => ({
      name: {
        eyebrow: t(`Step 1 of ${slots}`, `Hatua ya 1 Kati ya ${slots}`),
        title: t("What's your name?", "Jina lako ni nani?"),
        body: t(
          "Sumaiya will put it on your CV and on your cover letters.",
          "Sumaiya ataitumia kwenye CV yako na kwenye barua za maombi.",
        ),
        hint: t(
          "Next: the field or the role you are aiming for",
          "Hatua inayofuata inalenga fani au cheo unacholenga",
        ),
      },
      role: {
        eyebrow: t(`Step 2 of ${slots}`, `Hatua ya 2 Kati ya ${slots}`),
        // The design's own question, verbatim.
        title: t(
          "What kind of job are you looking for, or what is your field?",
          "Je, unatafuta kazi ya aina gani au fani yako ni ipi?",
        ),
        body: t(
          "Sumaiya will prepare a profile and CV designs that match your profession.",
          "Sumaiya ataandaa wasifu na miundo ya CV inayolingana na taaluma yako.",
        ),
        hint: t(
          "The last step is about the country (Tanzania / East Africa / The Gulf)",
          "Hatua ya mwisho inalenga nchi (Tanzania / Afrika Mashariki / Ghuba)",
        ),
      },
      country: {
        eyebrow: t(`Step 3 of ${slots}`, `Hatua ya 3 Kati ya ${slots}`),
        title: t("Where are you looking for work?", "Unatafuta kazi wapi?"),
        body: t(
          "Sumaiya will aim your CV at employers in that area.",
          "Sumaiya atalenga CV yako kwa waajiri wa eneo hilo.",
        ),
      },
    }),
    [t, slots],
  );
  const m = copy[step];

  const body = (() => {
    switch (step) {
      case "name":
        return (
          <StepField
            label={t("Your name", "Jina lako")}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        );
      case "role":
        return (
          <View style={{ gap: 16 }}>
            <StepField
              label={t("The field or role you are aiming for", "Fani au Cheo unacholenga")}
              value={role}
              onChangeText={setRole}
              placeholder={t("e.g. Marketing Officer", "Mfano: Afisa Masoko (Marketing Officer)")}
              autoFocus
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {ROLE_PRESETS.map((p) => (
                <Chip
                  key={p.id}
                  label={p.label[lang]}
                  active={fieldId === p.id}
                  // One target, not three: the question is singular, and the
                  // design shows exactly one pill selected.
                  onPress={() => setFieldId((cur) => (cur === p.id ? "" : p.id))}
                />
              ))}
            </View>
          </View>
        );
      case "country":
        return (
          <View style={{ gap: 16 }}>
            <Text style={{ color: c.textBody, fontSize: 12, fontFamily: FONT.semibold }}>
              {t("The area you are aiming for", "Eneo unalolenga")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {AREA_PRESETS.map((p) => (
                <Chip
                  key={p.id}
                  label={p.label[lang]}
                  active={areaId === p.id}
                  onPress={() => setAreaId((cur) => (cur === p.id ? "" : p.id))}
                />
              ))}
            </View>
          </View>
        );
    }
  })();

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style="dark" />
      <View style={{ height: insets.top + 10 }} />

      {/* progress + the one way out. The design's exit is always visible on
          every step and always does the same thing: keep whatever is answered
          and go. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 24 + insets.left,
          paddingRight: 24 + insets.right,
        }}
      >
        <StepDots total={STEPS.length} current={i} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Later", "Baadaye")}
          onPress={() => {
            // "Skip" is a legitimate, well-placed exit — but it is also the
            // clearest signal we get that the step it was pressed on was one
            // step too many.
            track("firstrun.leave", { step, i, of: STEPS.length, via: "skip", seconds: spentSeconds() });
            void finish(true);
          }}
          style={{ minHeight: 44, justifyContent: "center", paddingLeft: 12 }}
        >
          <Text style={{ color: c.textMuted, fontSize: 13.5, fontFamily: FONT.semibold }}>
            {t("Later", "Baadaye")}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={keyboardAvoidingBehavior()}
        keyboardVerticalOffset={insets.top + 44}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            gap: 24,
            padding: 24,
            paddingLeft: 24 + insets.left,
            paddingRight: 24 + insets.right,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            key={step}
            entering={FadeInRight.duration(260)}
            exiting={FadeOutLeft.duration(150)}
            style={{ gap: 24 }}
          >
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  color: c.accent,
                  fontSize: 12,
                  fontFamily: FONT.mono,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                {m.eyebrow}
              </Text>
              <Text
                style={{
                  color: c.text,
                  fontSize: 24,
                  lineHeight: 30,
                  fontFamily: FONT.display,
                  letterSpacing: -0.5,
                }}
              >
                {m.title}
              </Text>
              <Text
                style={{
                  color: c.textBody,
                  fontSize: 14,
                  lineHeight: 20,
                  fontFamily: FONT.regular,
                }}
              >
                {m.body}
              </Text>
            </View>

            {body}
          </Animated.View>
        </ScrollView>

        {/* sticky footer — the primary button is always reachable above the
            keyboard, with the line that says what is still to come. */}
        <View
          style={{
            paddingLeft: 24 + insets.left,
            paddingRight: 24 + insets.right,
            paddingTop: 12,
            paddingBottom: insets.bottom + 16,
            gap: 8,
          }}
        >
          <Button
            label={isLast ? t("Finish", "Maliza") : t("Continue", "Endelea")}
            size="lg"
            loading={saving}
            rightIcon={
              isLast ? undefined : <Icon name="chevron-right" size={18} color={c.accentText} />
            }
            onPress={() => {
              haptics.selection();
              if (isLast) void finish(false);
              else setI(i + 1);
            }}
          />
          {m.hint ? (
            <Text
              style={{
                color: c.textMuted,
                fontSize: 11,
                lineHeight: 16,
                textAlign: "center",
                fontFamily: FONT.regular,
              }}
            >
              {m.hint}
            </Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
