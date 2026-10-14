import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import type { CV, CVData } from "@sumaiya/types";
import { isEmptyCv } from "@sumaiya/utils/cv-shape";
import { useCvs } from "../hooks/use-cvs";
import { useAuthContext } from "../contexts/auth-context";
import { ownerIdFor } from "../lib/local-owner";
import { offerAccountForGate } from "../components/account-gate";
import { cvErrorCopy } from "../lib/cv-fetch-error";
import {
  analyzeCv,
  atsScore,
  atsBreakdown,
  lineFindings,
  matchJd,
  type AtsCheck,
  type LineFinding,
} from "../lib/ats";
import { addEpisodeEvent, updateMemory } from "../lib/ai-memory";
import { useLang, type Lang } from "../lib/i18n";
import { useEntitlements } from "../lib/entitlements";
import { PremiumSheet } from "../components/premium-sheet";
import { apiClient } from "../lib/api-client";
import {
  Button,
  EmptyState,
  ProgressBar,
  Screen,
  ScreenTitle,
  SkeletonList,
  TextField,
  haptics,
  toast,
  useThemeColors,
  type ThemeColors,
} from "../components/ui";
import { Icon } from "../components/icon";
import { SumaiyaMark } from "../components/sumaiya-mark";
import { FONT, HOME_SPACING } from "../components/home";
import type { AtsCheckerScreenProps } from "../navigation/types";

/**
 * B9 · Ukaguzi wa CV — the CV check.
 *
 * WHAT THIS SCREEN IS (design fragment `per_screen/B9.html`): the heading with
 * its one-line promise (`Inapima ubora halisi`), the CV card you can switch
 * (`Badili`), the centred REAL check score, the findings grouped
 * Kikubwa / Wastani / Kidogo with a per-finding `Rekebisha` action, and the
 * `Kagua Tena Upya` button that reports the delta.
 *
 * THE FOUR HONESTY RULES THIS FILE ENFORCES (brief §5 + guide §10 — "never
 * fabricate progress"; "a number may only appear if the app computed it"):
 *
 *   1. A number appears only when a real check produced it. Every figure here —
 *      the score, the pillar scores, the delta, the score the listed fixes
 *      would reach — comes out of `lib/ats.ts` (the same deterministic analyzer
 *      Home's score card runs) or is arithmetic on those results. There is no
 *      placeholder, no default and no sample score anywhere in this file.
 *   2. TWO STATES SHOW NO SCORE AT ALL, and they are the first ones most people
 *      meet — see `checkStateOf`:
 *        `no-cv`            nothing on this device to check;
 *        `nothing-to-check` a CV holding only a name. `lib/ats.ts` is honest but
 *                           useless on an empty document — "8/100, high risk"
 *                           for a name is a fabricated verdict — so this state
 *                           says the CV is still blank instead.
 *   3. The delta is only claimed when the CV was really edited after the check
 *      it is compared with (`checkDelta`). With nothing edited there is nothing
 *      to compare, so no number is shown rather than a "+0" that reads like a
 *      measurement.
 *   4. `ATS` never appears in Swahili copy (guide §6). The Swahili side names
 *      the outcome (`Ukaguzi wa CV`, `mifumo ya kuajiri`); English may say it.
 *
 * WHERE THE DESIGN NEEDED A JUDGEMENT:
 *   - `Rekebisha` sends the reader to the CV in the editor. The editor takes no
 *     "open this section" parameter (navigation/types.ts owns its params, and
 *     this workstream owns one file), so the section is named ON the finding and
 *     carried into the toast that follows the jump — never faked as a deep link.
 *   - Line findings (one weak bullet) are real engine output with a severity of
 *     their own, so they fill the third tier the design names. See `tierOfLine`.
 */

// ── Small colour helper ───────────────────────────────────────────────────────
/**
 * Appends an alpha suffix to a `#RRGGBB` token. `c.border` is an `rgba()` string
 * in dark mode, and `"rgba(...)" + "55"` is an invalid colour — so tokens that
 * are not plain hex are returned untouched instead of silently breaking.
 */
function alpha(color: string, suffix: string): string {
  return color.startsWith("#") && (color.length === 7 || color.length === 4) ? color + suffix : color;
}

// ── The four states of this screen ────────────────────────────────────────────
export type CheckState = "loading" | "failed" | "no-cv" | "nothing-to-check" | "scored";

/**
 * Which of the four screen states to render. Pure, so the honesty rule is
 * testable on its own (see `ats-checker-screen.test.ts`): a score can only ever
 * be produced in `scored`, and `scored` is unreachable without a CV whose data
 * really holds something to measure.
 */
export function checkStateOf(i: {
  cvCount: number;
  loading: boolean;
  failed: boolean;
  cvIsEmpty: boolean;
}): CheckState {
  if (i.cvCount === 0) {
    // A load that has not finished is not "you have nothing" — saying so for
    // the length of a load is the data-loss illusion the CV list was fixed to
    // stop making.
    if (i.loading) return "loading";
    // A refused session or an unreachable server is not an empty account.
    if (i.failed) return "failed";
    return "no-cv";
  }
  return i.cvIsEmpty ? "nothing-to-check" : "scored";
}

// ── Findings: severity tiers and the section each one lives in ────────────────
export type FindingTier = "major" | "medium" | "minor";

/**
 * The three tiers the design names, in the order they are shown:
 *
 *   KIKUBWA  a check that FAILED — its whole weight is lost, and it is the kind
 *            of gap a screening programme drops a CV for.
 *   WASTANI  a check the engine itself calls a warning, or a bullet that reads
 *            passively in the user's experience.
 *   KIDOGO   polish on a single bullet: no measurable number, or a bullet so long
 *            it is skimmed past.
 *
 * No threshold is invented: the engine already carries `severity` (fail | warn)
 * on every check and every line finding, and the tier is exactly that value —
 * with a line finding one step down from a whole check, because one weak bullet
 * is a narrower problem than a section that fails outright.
 */
export function tierOfCheck(severity: AtsCheck["severity"]): FindingTier | null {
  if (severity === "fail") return "major";
  if (severity === "warn") return "medium";
  return null; // a passing check is not a finding
}

export function tierOfLine(severity: LineFinding["severity"]): FindingTier {
  return severity === "fail" ? "medium" : "minor";
}

export const TIER_ORDER: FindingTier[] = ["major", "medium", "minor"];

/** The editor's own section titles (`cv-editor-screen.tsx`), so `Rekebisha`
 *  points at a section the user will actually find in the editor. */
export type CvSection = "personal" | "summary" | "experience" | "education" | "skills";

const SECTION_COPY: Record<CvSection, { en: string; sw: string }> = {
  personal: { en: "Personal details", sw: "Maelezo binafsi" },
  summary: { en: "Professional summary", sw: "Muhtasari wa kikazi" },
  experience: { en: "Experience", sw: "Uzoefu" },
  education: { en: "Education", sw: "Elimu" },
  skills: { en: "Skills", sw: "Ujuzi" },
};

const CHECK_SECTION: Record<string, CvSection> = {
  contact: "personal",
  photo: "personal",
  headline: "personal",
  summary: "summary",
  experience: "experience",
  action_verbs: "experience",
  quantified: "experience",
  desc_length: "experience",
  dates: "experience",
  education: "education",
  skills: "skills",
};

export function sectionForCheck(id: string): CvSection | null {
  return CHECK_SECTION[id] ?? null;
}

export function sectionLabel(section: CvSection, sw: boolean): string {
  return sw ? SECTION_COPY[section].sw : SECTION_COPY[section].en;
}

export interface Finding {
  id: string;
  tier: FindingTier;
  /** What is wrong — the design's card title. */
  what: string;
  /** Where it lives: a real CV section, or the entry a bullet came from. */
  where: string;
  /** The bullet the finding is about (line findings only). */
  line?: string;
  /** What to do about it — the design's body copy. */
  fix: string;
  /** Where `Rekebisha` sends the reader. */
  section: CvSection | null;
}

/**
 * Every finding on this screen, tiered. Both inputs are the engine's own output
 * (`analyzeCv`, `lineFindings`) — nothing is added that the analyzer did not
 * report, and nothing reported is dropped.
 */
export function buildFindings(
  checks: AtsCheck[],
  lines: LineFinding[],
  sw: boolean,
): Finding[] {
  const out: Finding[] = [];
  for (const ch of checks) {
    const tier = tierOfCheck(ch.severity);
    if (!tier) continue;
    const section = sectionForCheck(ch.id);
    out.push({
      id: `check:${ch.id}`,
      tier,
      what: ch.label,
      where: section ? sectionLabel(section, sw) : "",
      fix: ch.fix,
      section,
    });
  }
  for (const f of lines) {
    out.push({
      id: `line:${f.id}`,
      tier: tierOfLine(f.severity),
      what: f.issue,
      where: f.where,
      line: f.line,
      fix: f.fix,
      // A weak bullet is always somewhere in the experience section.
      section: "experience",
    });
  }
  // Kikubwa first; inside a tier the whole-section problems come before the
  // single bullets they describe. `sort` is stable, so the engine's order holds
  // inside each tier.
  const rank: Record<FindingTier, number> = { major: 0, medium: 1, minor: 2 };
  return out.sort((a, b) => rank[a.tier] - rank[b.tier]);
}

/** The findings, grouped into the tiers that actually hold something. */
export function groupFindings(findings: Finding[]): { tier: FindingTier; items: Finding[] }[] {
  return TIER_ORDER.map((tier) => ({ tier, items: findings.filter((f) => f.tier === tier) })).filter(
    (g) => g.items.length > 0,
  );
}

/** How many line findings this screen shows before it summarises the rest. */
const MAX_LINE_FINDINGS = 8;

// ── The score, and the score the listed fixes would reach ─────────────────────
/**
 * What the score becomes if every failing check is fixed. Computed through the
 * engine's own formula (all checks passing) rather than typed as 100, so it can
 * never disagree with `atsScore` if the weights ever change.
 */
export function potentialScore(checks: AtsCheck[]): number {
  return atsScore(checks.map((ch) => (ch.pass ? ch : { ...ch, pass: true })));
}

// ── The delta — only ever a real change, only ever between real checks ────────
export interface CheckRecord {
  /** The score that check produced. */
  score: number;
  /** When the check ran. */
  at: number;
  /** The CV's own `updatedAt` at that moment. */
  editedAt: number;
}

/**
 * The change since the last recorded check, or `null` when there is nothing to
 * compare. A delta describes what CHANGED: if the CV has not been touched since
 * that check, the two numbers describe the same document and no delta is
 * claimed — a fabricated "+0" reads like a measurement that was taken.
 */
export function checkDelta(
  prev: CheckRecord | null,
  next: { score: number; editedAt: number },
): number | null {
  if (!prev) return null;
  if (!(next.editedAt > prev.at)) return null;
  return next.score - prev.score;
}

/** `+8` / `−5`. (A real minus sign, not a hyphen.) */
export function signedPoints(delta: number): string {
  return `${delta > 0 ? "+" : ""}${String(delta).replace("-", "−")}`;
}

// ── The check log (device-local) ──────────────────────────────────────────────
/**
 * The last score recorded per CV, so a later visit can honestly say what
 * changed. Device-local and best-effort: a storage failure means no delta is
 * shown, never a guessed one.
 */
const CHECK_LOG_KEY = "sumaiya_cv_check_log";

async function readCheckLog(): Promise<Record<string, CheckRecord>> {
  try {
    const raw = await AsyncStorage.getItem(CHECK_LOG_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, CheckRecord>) : {};
  } catch {
    return {};
  }
}

async function writeCheckLog(cvId: string, record: CheckRecord): Promise<void> {
  try {
    const log = await readCheckLog();
    log[cvId] = record;
    await AsyncStorage.setItem(CHECK_LOG_KEY, JSON.stringify(log));
  } catch {
    /* best-effort — the screen never claims more than it stored */
  }
}

// ── "Checked leo, Saa 08:30" ──────────────────────────────────────────────────
const MONTHS = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  sw: ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ago", "Sep", "Okt", "Nov", "Des"],
} as const;

function two(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * The day-and-time phrase the design puts under the CV's name
 * (`leo, Saa 08:30`). It describes the moment THIS device ran the check — which
 * is a real event, not the CV's edit time dressed up as a check.
 */
export function checkedAtLabel(at: Date, lang: Lang, now: Date = new Date()): string {
  const clock = `${two(at.getHours())}:${two(at.getMinutes())}`;
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (lang === "sw") {
    if (sameDay(at, now)) return `leo, Saa ${clock}`;
    if (sameDay(at, yesterday)) return `jana, Saa ${clock}`;
    return `${at.getDate()} ${MONTHS.sw[at.getMonth()]}, Saa ${clock}`;
  }
  if (sameDay(at, now)) return `today, ${clock}`;
  if (sameDay(at, yesterday)) return `yesterday, ${clock}`;
  return `${MONTHS.en[at.getMonth()]} ${at.getDate()}, ${clock}`;
}

// ── Pieces of the design ──────────────────────────────────────────────────────
const TIER_CHIP: Record<FindingTier, { en: string; sw: string }> = {
  major: { en: "MAJOR", sw: "KIKUBWA" },
  medium: { en: "MEDIUM", sw: "WASTANI" },
  minor: { en: "MINOR", sw: "KIDOGO" },
};

/** The design's per-tier card: tinted surface, status hairline, and the chip
 *  that names the tier. Status colours come from the tokens (§1/§6) — the
 *  fragment's `rose-*` / `amber-*` are mockup artefacts, not tokens. */
function tierTone(tier: FindingTier, c: ThemeColors) {
  if (tier === "major") {
    return {
      bg: c.errorTint,
      border: alpha(c.error, "66"),
      chipBg: alpha(c.error, "26"),
      chipFg: c.error,
    };
  }
  if (tier === "medium") {
    return {
      bg: alpha(c.warning, "14"),
      border: alpha(c.warning, "66"),
      chipBg: alpha(c.warning, "26"),
      chipFg: c.warning,
    };
  }
  return {
    bg: c.bgSunken,
    border: c.border,
    chipBg: alpha(c.textMuted, "1f"),
    chipFg: c.textMuted,
  };
}

function FindingCard({
  finding,
  index,
  c,
  tierLabel,
  actionLabel,
  whereLabel,
  onFix,
}: {
  finding: Finding;
  index: number;
  c: ThemeColors;
  tierLabel: string;
  actionLabel: string;
  whereLabel: string;
  onFix: () => void;
}) {
  const tone = tierTone(finding.tier, c);
  return (
    <Animated.View
      entering={FadeInDown.duration(220).delay(Math.min(index, 4) * 40)}
      style={{
        padding: 12,
        borderRadius: 16,
        backgroundColor: tone.bg,
        borderWidth: 1,
        borderColor: tone.border,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <View style={{ backgroundColor: tone.chipBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ color: tone.chipFg, fontSize: 10.5, letterSpacing: 0.5, fontFamily: FONT.mono }}>
            {tierLabel}
          </Text>
        </View>
        {/* §8: 44 dp, not the fragment's ~16 dp underlined word. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel}. ${whereLabel}`}
          onPress={onFix}
          style={{
            minHeight: HOME_SPACING.minTarget,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: 6,
          }}
        >
          <Text style={{ color: c.accent, fontSize: 12.5, fontFamily: FONT.bold, textDecorationLine: "underline" }}>
            {actionLabel}
          </Text>
          <Icon name="arrow-right" size={14} color={c.accent} />
        </Pressable>
      </View>

      <Text style={{ color: c.text, fontSize: 13.5, lineHeight: 19, fontFamily: FONT.semibold }}>
        {finding.what}
      </Text>

      {finding.where ? (
        <Text
          style={{
            color: c.textMuted,
            fontSize: 10.5,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            fontFamily: FONT.mono,
          }}
        >
          {finding.where}
        </Text>
      ) : null}

      {finding.line ? (
        <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 17, fontStyle: "italic", fontFamily: FONT.regular }}>
          “{finding.line}”
        </Text>
      ) : null}

      <Text style={{ color: c.textBody, fontSize: 12.5, lineHeight: 18, fontFamily: FONT.regular }}>
        {finding.fix}
      </Text>
    </Animated.View>
  );
}

/**
 * What this page IS, in plain language — the owner's own ask, in the owner's own
 * terms, kept verbatim. It sits below the design's blocks (the score and the
 * findings lead, exactly as the fragment has them) and it is also shown beside
 * the empty states, because someone with no CV yet is the person most likely to
 * be puzzled by this page.
 */
function WhatIsThis({ t }: { t: (en: string, sw: string) => string }) {
  const c = useThemeColors();
  return (
    <View
      style={{
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.bgElevated,
        gap: 6,
      }}
    >
      <Text style={{ color: c.text, fontSize: 14.5, fontFamily: FONT.bold }}>
        {t("What is the ATS check?", "Ukaguzi wa CV ni nini?")}
      </Text>
      <Text style={{ color: c.textBody, fontSize: 13, lineHeight: 19, fontFamily: FONT.regular }}>
        {t(
          "This review compares the wording and layout of your CV with what employers' screening programs use to filter job applications. You get a score, along with the exact things to fix in your CV, such as words to add or layout to change. This is guidance to help you, not a guarantee of being hired. No employer sees the results of this review, and it is not a hiring decision. No one is rejected or accepted for a job because of this review.",
          "Ukaguzi huu unalinganisha maneno na mpangilio wa CV yako na yale ambayo programu za waajiri hutumia kuchuja maombi ya kazi. Utapata alama, pamoja na mambo halisi ya kurekebisha katika CV yako, kama vile maneno ya kuongeza au mpangilio wa kubadilisha. Haya ni maelekezo tu ya kukusaidia, si uhakika wa kuajiliwa. Hakuna mwajiri anayeona matokeo ya ukaguzi huu, wala si uamuzi wa kuajili. Hakuna anayekataliwa au kukubaliwa kazi kwa sababu ya ukaguzi huu.",
        )}
      </Text>
    </View>
  );
}

export function AtsCheckerScreen({ route, navigation }: AtsCheckerScreenProps) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const sw = lang === "sw";
  const { cvs, loading, error, errorKind, loadCVs } = useCvs();
  const { user, signOut } = useAuthContext();
  // Her memory is the OWNER's, not the handset's (lib/ai-memory.ts) — the same
  // owner id the CV store uses, so what she learns from this check follows the
  // person who did it and is never shown to the next person on the device.
  const ownerId = ownerIdFor(user);
  // Same truth as Home: the reason decides the message AND the action.
  const cvError = cvErrorCopy(errorKind ?? "unknown");
  const { premium } = useEntitlements();
  const preselect: string | undefined = route?.params?.cvId;
  const [pickedId, setPickedId] = useState<string | undefined>(preselect);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [jd, setJd] = useState("");
  const [verdict, setVerdict] = useState<string | null>(null);
  const [verdictBusy, setVerdictBusy] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Bumped by `Kagua Tena Upya` — it re-runs the check on the CV in hand.
  const [nonce, setNonce] = useState(0);
  const [checkedAt, setCheckedAt] = useState<Date>(() => new Date());
  const [baseline, setBaseline] = useState<CheckRecord | null>(null);
  const baselineReadFor = useRef<string | null>(null);

  const picked: CV | undefined = useMemo(
    () => cvs.find((x) => x.id === pickedId) ?? cvs[0],
    [cvs, pickedId],
  );

  /**
   * The real check: `analyzeCv` on the CV in hand, the score through the
   * engine's own formula, the pillars, and the line findings. It runs on the
   * device, sends nothing anywhere, and is the only source of every number on
   * this screen.
   */
  const analysis = useMemo(() => {
    if (!picked) return null;
    const checks = analyzeCv(picked.data, sw);
    return {
      score: atsScore(checks),
      potential: potentialScore(checks),
      checks,
      pillars: atsBreakdown(checks, sw),
      lines: lineFindings(picked.data, sw),
    };
    // `nonce` is a dependency on purpose: `Kagua Tena Upya` is a real re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked, sw, nonce]);

  const cvIsEmpty = useMemo(() => isEmptyCv(picked?.data), [picked]);
  const state = checkStateOf({
    cvCount: cvs.length,
    loading,
    failed: !!error,
    cvIsEmpty,
  });

  // The moment this check ran. Driven by the analysis memo's own dependency set,
  // so the label can only ever describe a check that really happened.
  useEffect(() => {
    if (picked) setCheckedAt(new Date());
  }, [picked, sw, nonce]);

  /**
   * Record this check, and read the one before it.
   *
   * The read happens BEFORE the write for a given CV — otherwise the "previous"
   * score would be the check that just ran and the delta could never be
   * anything but zero. The record is kept only for CVs this device really
   * checked, and it is what lets a later visit say honestly what changed.
   */
  useEffect(() => {
    if (!picked || !analysis) return;
    const cvId = picked.id;
    const score = analysis.score;
    const editedAt = new Date(picked.updatedAt).getTime();
    let alive = true;
    (async () => {
      if (baselineReadFor.current !== cvId) {
        const log = await readCheckLog();
        if (!alive) return;
        baselineReadFor.current = cvId;
        setBaseline(log[cvId] ?? null);
      }
      await writeCheckLog(cvId, { score, at: Date.now(), editedAt });
    })();
    return () => {
      alive = false;
    };
  }, [picked, analysis, nonce]);

  const delta = useMemo(() => {
    if (!picked || !analysis) return null;
    return checkDelta(baseline, {
      score: analysis.score,
      editedAt: new Date(picked.updatedAt).getTime(),
    });
  }, [baseline, picked, analysis]);

  const jdMatch = useMemo(() => {
    if (!picked || jd.trim().length < 40) return null;
    return matchJd(picked.data, jd);
  }, [picked, jd]);

  const findings = useMemo(
    () => (analysis ? buildFindings(analysis.checks, analysis.lines.slice(0, MAX_LINE_FINDINGS), sw) : []),
    [analysis, sw],
  );
  const groups = useMemo(() => groupFindings(findings), [findings]);
  const hiddenLines = analysis ? Math.max(0, analysis.lines.length - MAX_LINE_FINDINGS) : 0;

  const openEditor = useCallback(
    (section: CvSection | null) => {
      if (!picked) return;
      navigation.navigate("CVsTab", {
        screen: "CvEditor",
        params: { cvId: picked.id, templateId: picked.templateId },
      });
      // The editor takes no "open this section" parameter, so the section the
      // finding names is carried in words rather than faked as a deep link.
      if (section) {
        toast.show(`${t("Section to fix", "Sehemu ya kurekebisha")}: ${sectionLabel(section, sw)}`);
      }
    },
    [navigation, picked, sw, t],
  );

  const runCheck = useCallback(() => {
    haptics.selection();
    // A real re-run: reload the CV list (so an edit saved in the editor is
    // picked up) and recompute every check. The score can only move because the
    // document did.
    void loadCVs?.();
    setNonce((n) => n + 1);
  }, [loadCVs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadCVs?.();
      setNonce((n) => n + 1);
    } finally {
      setRefreshing(false);
    }
  }, [loadCVs]);

  const runVerdict = async () => {
    // GUEST: the written review is generated on the server, for an account, so
    // it cannot be run without one — and the old order here would have shown
    // the PREMIUM paywall to a guest, which is both a dead end and the wrong
    // ask. The score, the checks and the line findings above are all computed
    // on the device (lib/ats.ts) and stay exactly as they are.
    if (!user) {
      offerAccountForGate("atsVerdict");
      return;
    }
    if (!premium) { setShowPremium(true); return; }
    if (!picked || !analysis || verdictBusy) return;
    setVerdictBusy(true);
    haptics.light();
    try {
      const d: Partial<CVData> = picked.data ?? {};
      const failing = analysis.checks.filter((ch) => !ch.pass).map((ch) => ch.label).join("; ");
      const prompt =
        `${sw ? "Jibu kwa Kiswahili." : "Answer in English."} ` +
        // The verdict is written in Swahili, and naming the mechanism in the
        // prompt invites her to echo it back — the one term the product bans
        // from Swahili copy. Describe the outcome instead, and say so outright.
        `You are Sumaiya reviewing a CV. The employer-screening check scored ${analysis.score}/100. Failing checks: ${failing || "none"}. ` +
        `Summary: "${(d.summary ?? "").slice(0, 400)}". Roles: ${(d.experience ?? []).map((e) => `${e.title} at ${e.company}`).join(", ") || "none"}. ` +
        `Skills: ${(d.skills ?? []).map((s) => s.name).join(", ") || "none"}. ` +
        `Give a short honest verdict (max 90 words) then the 3 highest-impact fixes as a numbered list. Ground everything in what's above — invent nothing. Never write the letters "ATS" in your answer; if you must name those systems, write "mifumo ya kuajiri".`;
      const { message } = await apiClient.sendChatMessage([{ role: "user", content: prompt }]);
      setVerdict(message.trim());
      haptics.success();

      // Let this teach her. The same check failing across successive CVs is a
      // THEME, not a one-off: recording it as an episode is what lets
      // consolidation promote it into a standing fact and coach it up front,
      // instead of rediscovering it from scratch every time.
      const firstFailure = analysis.checks.find((ch) => !ch.pass);
      if (firstFailure) {
        // The topic is a MACHINE key and must not depend on the language in
        // play. It used to be built from `firstFailure.label`, and that label is
        // localized (analyzeCv(data, sw)) — so the same failing check on a
        // Swahili phone produced a different topic than the English phone, and
        // consolidation could never accumulate evidence for either. `ch.id` is
        // the stable identifier; `label` stays for the sentence, where it
        // belongs.
        const topic = `ats_${firstFailure.id.slice(0, 30)}`;
        updateMemory(ownerId, (m) =>
          // NOT internal. This string reaches the user by three routes, which is
          // why the acronym must not be here and why it must be written in the
          // language the person is reading:
          //   1. memory-screen.tsx renders it under "MATUKIO YA HIVI KARIBUNI" /
          //      "RECENT ACTIVITY SHE NOTED", via episodeText();
          //   2. ai-memory.ts renderMemoryBlock() puts it in the chat prompt as
          //      "Recently: - <detail>", so she can paraphrase it back to them;
          //   3. consolidate() promotes it to a Fact `value` (with the event) that
          //      is injected into EVERY later conversation as "Known: - <value>".
          // It is recorded as an event, so the sentence is built in the reader's
          // language instead of being frozen in whatever language wrote it.
          addEpisodeEvent(
            m,
            topic,
            { key: "cv_check_failed", params: { score: analysis.score, check: firstFailure.label } },
            t,
          ),
        ).catch(() => {});
      }
    } catch {
      haptics.error();
      setVerdict(null);
    } finally {
      setVerdictBusy(false);
    }
  };

  const scoreTone = (s: number): "success" | "warning" | "error" =>
    s >= 75 ? "success" : s >= 50 ? "warning" : "error";

  /** The one-line reading of the score, from the score itself. */
  const bandSentence = (s: number): string => {
    if (s >= 85) return t("Your CV is ready for most employers.", "Wasifu wako uko tayari kwa waajiri wengi.");
    if (s >= 70) return t("Your CV is strong — the fixes below make it stronger.", "Wasifu wako una nguvu — marekebisho hapa chini wauongeze zaidi.");
    if (s >= 50) return t("Some things need fixing before your CV reads well.", "Kuna mambo yanahitaji kurekebishwa ili wasifu wako usomwe vizuri.");
    return t("Your CV needs work before you send it.", "Wasifu wako unahitaji kurekebishwa kabla ya kuutumia.");
  };

  const checkedLabel = `${t("Checked", "Ulikaguliwa")} ${checkedAtLabel(checkedAt, lang)}`;

  return (
    <Screen
      scroll
      contentContainerStyle={{ gap: HOME_SPACING.block }}
      refreshing={refreshing}
      onRefresh={onRefresh}
      // The one primary action, in flow above the tab bar (§8 — never a floating
      // overlay). It exists only when a check really ran: "check again" is
      // meaningless with no CV, and a button that does nothing is worse than none.
      footer={
        state === "scored" && analysis ? (
          <View style={{ gap: 8 }}>
            {delta !== null ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {delta !== 0 ? (
                  <View
                    style={{
                      backgroundColor: delta > 0 ? c.successTint : alpha(c.warning, "1f"),
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                    }}
                  >
                    <Text
                      style={{
                        color: delta > 0 ? c.success : c.warning,
                        fontSize: 11,
                        fontFamily: FONT.mono,
                      }}
                    >
                      {signedPoints(delta)}
                    </Text>
                  </View>
                ) : null}
                <Text
                  style={{
                    flexShrink: 1,
                    color: c.textMuted,
                    fontSize: 12,
                    lineHeight: 17,
                    fontFamily: FONT.regular,
                  }}
                >
                  {delta === 0
                    ? t("No change since your last check.", "Hakuna mabadiliko tangu ukaguzi uliopita.")
                    : t("Since your last check.", "Kutoka ukaguzi uliopita.")}
                </Text>
              </View>
            ) : null}
            <Button size="lg" label={t("Check again", "Kagua Tena Upya")} onPress={runCheck} />
          </View>
        ) : undefined
      }
    >
      {/* Title + the design's one-line promise. */}
      <ScreenTitle
        trailing={
          <Text
            style={{
              color: c.textMuted,
              fontSize: 11,
              letterSpacing: 0.4,
              fontFamily: FONT.mono,
            }}
          >
            {t("Measures real quality", "Inapima ubora halisi")}
          </Text>
        }
      >
        {t("ATS check", "Ukaguzi wa CV")}
      </ScreenTitle>

      {state === "loading" ? (
        <SkeletonList count={2} label={t("Reading your CVs…", "Inasoma CV zako…")} />
      ) : state === "failed" ? (
        /* Never claim the user has no CVs when the real problem is that we
           couldn't reach the server — that is indistinguishable from data loss. */
        <EmptyState
          icon="alert-circle"
          title={t(cvError.title.en, cvError.title.sw)}
          body={t(cvError.body.en, cvError.body.sw)}
          actionLabel={t(cvError.action.en, cvError.action.sw)}
          onAction={cvError.actionKind === "signin" ? () => void signOut() : loadCVs}
        />
      ) : state === "no-cv" ? (
        <>
          {/* THE MOST COMMON FIRST VISIT. No score, no findings — just the truth
              and the one action that changes it. */}
          <EmptyState
            icon="file-text"
            title={t("No CV to check yet", "Hakuna CV ya kukagua bado")}
            body={t(
              "The check reads a real CV, so there is nothing to measure yet. Build one, or upload the CV you already have, then come back here.",
              "Ukaguzi husoma CV halisi, hivyo bado hakuna cha kupima. Jenga moja, au pakia CV uliyonayo, kisha urudi hapa.",
            )}
            actionLabel={t("Build your CV", "Jenga CV yako")}
            onAction={() => navigation.navigate("CVsTab", { screen: "CvEditor", params: { nonce: String(Date.now()) } })}
            secondaryLabel={t("Upload a CV", "Pakia CV")}
            onSecondary={() => navigation.navigate("ImportTab")}
          />
          <WhatIsThis t={t} />
        </>
      ) : (
        <>
          {/* ── THE CV BEING CHECKED (design block 1) ─────────────────────── */}
          {picked ? (
            <Animated.View entering={FadeIn.duration(200)} style={{ gap: 8 }}>
              <View
                style={{
                  padding: 12,
                  borderRadius: 16,
                  backgroundColor: c.bgElevated,
                  borderWidth: 1,
                  borderColor: c.border,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: c.accentTint,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: c.accent, fontSize: 12, fontFamily: FONT.mono }}>CV</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  {/* Not clamped to one line: §8 holds the layout at 200 % text
                      scale, and a one-line clamp is what breaks there. */}
                  <Text
                    numberOfLines={2}
                    style={{ color: c.text, fontSize: 13.5, lineHeight: 19, fontFamily: FONT.semibold }}
                  >
                    {picked.title}
                  </Text>
                  <Text style={{ color: c.textMuted, fontSize: 11, lineHeight: 16, fontFamily: FONT.mono }}>
                    {checkedLabel}
                  </Text>
                </View>
                {/* `Badili`, exactly as the design has it. With ONE CV there is
                    nothing to switch to, so it is not shown. */}
                {cvs.length > 1 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: pickerOpen }}
                    accessibilityLabel={t("Choose a different CV", "Chagua CV nyingine")}
                    onPress={() => {
                      haptics.selection();
                      setPickerOpen((v) => !v);
                    }}
                    style={{
                      minHeight: HOME_SPACING.minTarget,
                      justifyContent: "center",
                      paddingHorizontal: 8,
                    }}
                  >
                    <Text style={{ color: c.accent, fontSize: 13, fontFamily: FONT.bold }}>
                      {t("Switch", "Badili")}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {/* The picker the design's single `Badili` control opens: the CV
                  library this device holds, as 44 dp chips. In-line rather than
                  a dialog — the dialog layer paints every row of a 3+ button
                  sheet as a filled primary, which a dozen CVs would turn into a
                  wall of ember. */}
              {pickerOpen && cvs.length > 1 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingRight: 8 }}
                >
                  {cvs.map((cv) => {
                    const active = (picked?.id ?? cvs[0].id) === cv.id;
                    return (
                      <Pressable
                        key={cv.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={cv.title}
                        onPress={() => {
                          haptics.selection();
                          setPickedId(cv.id);
                          setPickerOpen(false);
                        }}
                        style={{
                          minHeight: HOME_SPACING.minTarget,
                          justifyContent: "center",
                          paddingHorizontal: 14,
                          borderRadius: 999,
                          backgroundColor: active ? c.accentFillStrong : c.bgSunken,
                        }}
                      >
                        <Text
                          numberOfLines={1}
                          style={{
                            color: active ? c.accentText : c.textBody,
                            fontSize: 13,
                            fontFamily: active ? FONT.bold : FONT.semibold,
                            maxWidth: 200,
                          }}
                        >
                          {cv.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : null}
            </Animated.View>
          ) : null}

          {state === "nothing-to-check" ? (
            /* ── NOTHING TO CHECK (no score, on purpose) ──────────────────── */
            <View
              style={{
                padding: 16,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: alpha(c.warning, "66"),
                backgroundColor: alpha(c.warning, "12"),
                gap: 8,
              }}
            >
              <Text
                style={{
                  color: c.warning,
                  fontSize: 10.5,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  fontFamily: FONT.mono,
                }}
              >
                {t("Nothing to check yet", "Hakuna cha kukagua bado")}
              </Text>
              <Text style={{ color: c.text, fontSize: 16, lineHeight: 22, fontFamily: FONT.bold }}>
                {t("This CV is still blank", "CV hii bado ni tupu")}
              </Text>
              <Text style={{ color: c.textBody, fontSize: 13.5, lineHeight: 20, fontFamily: FONT.regular }}>
                {t(
                  "A score only appears once there is something on the CV to measure. Right now it holds just your name. Add your contacts, a short summary, one job and a few skills, then check again.",
                  "Alama huonekana tu baada ya maudhui halisi kuwa kwenye CV. Kwa sasa kuna jina lako pekee. Ongeza mawasiliano, muhtasari mfupi, kazi moja na ujuzi kadhaa, kisha ukague tena.",
                )}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("Open the CV", "Fungua CV")}
                onPress={() => openEditor(null)}
                style={{
                  minHeight: HOME_SPACING.minTarget,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  alignSelf: "flex-start",
                }}
              >
                <Text style={{ color: c.accent, fontSize: 15, fontFamily: FONT.bold }}>
                  {t("Open the CV", "Fungua CV")}
                </Text>
                <Icon name="arrow-right" size={18} color={c.accent} />
              </Pressable>
            </View>
          ) : analysis && picked ? (
            <>
              {/* ── THE SCORE (design block 2) ─────────────────────────────── */}
              <Animated.View
                entering={FadeIn.duration(220)}
                style={{
                  padding: 20,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: c.border,
                  backgroundColor: c.bgElevated,
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text
                  style={{
                    color: c.textMuted,
                    fontSize: 11,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    fontFamily: FONT.mono,
                  }}
                >
                  {t("Real check score", "Alama Halisi ya Ukaguzi")}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                  <Text
                    style={{
                      color: c.accent,
                      fontSize: 44,
                      lineHeight: 48,
                      letterSpacing: -0.5,
                      fontFamily: FONT.display,
                    }}
                  >
                    {analysis.score}
                  </Text>
                  <Text style={{ color: c.textMuted, fontSize: 18, marginLeft: 2, fontFamily: FONT.bold }}>
                    /100
                  </Text>
                </View>
                <Text
                  style={{
                    color: c.textBody,
                    fontSize: 13,
                    lineHeight: 19,
                    textAlign: "center",
                    maxWidth: 280,
                    fontFamily: FONT.regular,
                  }}
                >
                  {bandSentence(analysis.score)}
                </Text>
                {findings.length > 0 && analysis.potential > analysis.score ? (
                  <Text
                    style={{
                      color: c.textMuted,
                      fontSize: 12.5,
                      lineHeight: 18,
                      textAlign: "center",
                      maxWidth: 280,
                      fontFamily: FONT.regular,
                    }}
                  >
                    {t(
                      `Fixing every finding below takes this to ${analysis.potential}.`,
                      `Ukieekebisha yote hapa chini, alama yako inafikia ${analysis.potential}.`,
                    )}
                  </Text>
                ) : null}
                {/* The real score as a width, growing from its left edge (§4). */}
                <View style={{ width: "100%", marginTop: 6 }}>
                  <ProgressBar
                    value={analysis.score / 100}
                    height={8}
                    tone={scoreTone(analysis.score)}
                  />
                </View>
              </Animated.View>

              {/* ── THE FINDINGS (design block 3) ──────────────────────────── */}
              <View style={{ gap: 10 }}>
                <Text
                  style={{
                    color: c.textMuted,
                    fontSize: 11.5,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    fontFamily: FONT.mono,
                  }}
                >
                  {t("Check findings", "Matokeo ya Ukaguzi (Findings)")}
                </Text>

                {findings.length === 0 ? (
                  <View
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: c.border,
                      backgroundColor: c.bgElevated,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Icon name="check-circle" size={18} color={c.success} />
                    <Text
                      style={{ flex: 1, color: c.text, fontSize: 13.5, lineHeight: 19, fontFamily: FONT.semibold }}
                    >
                      {t("Every check passes. Nothing to fix.", "Kila ukaguzi umepita. Hakuna cha kurekebisha.")}
                    </Text>
                  </View>
                ) : (
                  groups.map((group) => group.items.map((f, i) => (
                    <FindingCard
                      key={f.id}
                      finding={f}
                      index={i}
                      c={c}
                      tierLabel={sw ? TIER_CHIP[f.tier].sw : TIER_CHIP[f.tier].en}
                      actionLabel={t("Fix", "Rekebisha")}
                      whereLabel={f.where}
                      onFix={() => openEditor(f.section)}
                    />
                  )))
                )}

                {hiddenLines > 0 ? (
                  <Text
                    style={{ color: c.textMuted, fontSize: 11.5, lineHeight: 17, fontFamily: FONT.mono }}
                  >
                    {t(
                      `Lines still to review: ${hiddenLines}`,
                      `Mistari mingine ya kuangalia: ${hiddenLines}`,
                    )}
                  </Text>
                ) : null}
              </View>

              {/* ── The breakdown behind the score ─────────────────────────── */}
              <View style={{ gap: 10 }}>
                <Text style={{ color: c.text, fontSize: 17, letterSpacing: -0.3, fontFamily: FONT.bold }}>
                  {t("Score breakdown", "Mgawanyo wa alama")}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {analysis.pillars.map((p) => (
                    <View
                      key={p.key}
                      style={{
                        width: "47.5%",
                        padding: 12,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: c.border,
                        backgroundColor: c.bgElevated,
                        gap: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: c.textMuted,
                          fontSize: 10.5,
                          letterSpacing: 0.5,
                          textTransform: "uppercase",
                          fontFamily: FONT.mono,
                        }}
                      >
                        {p.label}
                      </Text>
                      <Text
                        style={{
                          color: p.score >= 75 ? c.success : p.score >= 50 ? c.warning : c.error,
                          fontSize: 22,
                          lineHeight: 26,
                          fontFamily: FONT.display,
                        }}
                      >
                        {p.score}
                      </Text>
                      <ProgressBar value={p.score / 100} tone={scoreTone(p.score)} height={4} />
                    </View>
                  ))}
                </View>
              </View>

              {/* ── Sumaiya's verdict — premium ────────────────────────────── */}
              <View
                style={{
                  gap: 8,
                  padding: 14,
                  borderRadius: 16,
                  backgroundColor: c.accent + "0e",
                  borderWidth: 1,
                  borderColor: c.accent + "2a",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                  <SumaiyaMark size={15} state="static" color={c.accent} />
                  <Text style={{ color: c.text, fontSize: 15, fontFamily: FONT.bold, flex: 1 }}>
                    {t("My verdict", "Uamuzi wangu")}
                  </Text>
                  {!premium ? <Icon name="lock" size={13} color={c.textMuted} /> : null}
                </View>
                {verdict ? (
                  <Text style={{ color: c.textBody, fontSize: 13.5, lineHeight: 21, fontFamily: FONT.regular }}>
                    {verdict}
                  </Text>
                ) : (
                  <>
                    <Text style={{ color: c.textMuted, fontSize: 12.5, lineHeight: 18, fontFamily: FONT.regular }}>
                      {t(
                        "A written review — the honest verdict plus your three highest-impact fixes.",
                        "Mapitio yaliyoandikwa — uamuzi wa kweli pamoja na marekebisho matatu yenye athari kubwa.",
                      )}
                    </Text>
                    <Button
                      label={
                        verdictBusy
                          ? t("Reviewing…", "Inapitia…")
                          : premium
                            ? t("Get the verdict", "Pata uamuzi")
                            : t("Unlock with Premium", "Fungua na Premium")
                      }
                      variant="secondary"
                      size="sm"
                      loading={verdictBusy}
                      onPress={runVerdict}
                    />
                  </>
                )}
              </View>

              {/* ── Match against a job ────────────────────────────────────── */}
              <View style={{ gap: 8 }}>
                <Text style={{ color: c.text, fontSize: 17, letterSpacing: -0.3, fontFamily: FONT.bold }}>
                  {t("Match against a job", "Linganisha na ajira")}
                </Text>
                <TextField
                  placeholder={t("Paste the job description here…", "Bandika maelezo ya ajira hapa…")}
                  value={jd}
                  onChangeText={setJd}
                  multiline
                  numberOfLines={5}
                  inputStyle={{ minHeight: 110, textAlignVertical: "top" }}
                />
                {jdMatch ? (
                  <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Text
                        style={{
                          color: jdMatch.score >= 75 ? c.success : jdMatch.score >= 50 ? c.warning : c.error,
                          fontSize: 24,
                          lineHeight: 28,
                          fontFamily: FONT.display,
                        }}
                      >
                        {jdMatch.score}%
                      </Text>
                      <Text
                        style={{ color: c.textMuted, fontSize: 12, lineHeight: 17, flex: 1, fontFamily: FONT.regular }}
                      >
                        {t(
                          "of the job's keywords appear on this CV",
                          "ya maneno muhimu ya ajira yapo kwenye CV hii",
                        )}
                      </Text>
                    </View>
                    <ProgressBar value={jdMatch.score / 100} tone={scoreTone(jdMatch.score)} />
                    {jdMatch.missing.length > 0 ? (
                      <View style={{ gap: 6 }}>
                        <Text
                          style={{ color: c.textMuted, fontSize: 12, fontFamily: FONT.semibold }}
                        >
                          {t(
                            "Missing — add the true ones to your CV:",
                            "Yanakosekana — ongeza ya kweli kwenye CV:",
                          )}
                        </Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                          {jdMatch.missing.map((k) => (
                            <View
                              key={k}
                              style={{
                                paddingVertical: 4,
                                paddingHorizontal: 9,
                                borderRadius: 8,
                                backgroundColor: alpha(c.warning, "1f"),
                              }}
                            >
                              <Text style={{ color: c.warning, fontSize: 12, fontFamily: FONT.semibold }}>{k}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>

              <Button
                label={t("Open this CV in the editor", "Fungua CV hii kwenye kihariri")}
                variant="secondary"
                onPress={() => openEditor(null)}
              />
            </>
          ) : null}

          {/* Plain language, below the design's blocks. */}
          <WhatIsThis t={t} />
        </>
      )}

      <PremiumSheet visible={showPremium} onClose={() => setShowPremium(false)} feature="verdict" />
    </Screen>
  );
}
