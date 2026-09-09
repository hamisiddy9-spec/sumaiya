/**
 * Proactive signal engine — Phase 2 (C). Sumaiya moves first.
 *
 * computeSignals(context) turns the unified context into ranked, typed nudges.
 * Every signal is:
 *   - DETERMINISTIC (pure, fully testable — no AI, no invented urgency)
 *   - GROUNDED (carries the real trigger: a deadline date, an ATS score, a
 *     stale application id, a confirmation count)
 *   - RESOLVABLE (carries the tool id that fixes it, or a destination)
 *
 * The same engine feeds the assistant's proactive opener, the dashboard
 * signal section, and any notification surface — one truth everywhere.
 */
import type { UnifiedContext, ContextApplication, ContextJob } from "./context";
import { analyzeCv, atsScore } from "@/lib/ats-score";

export type SignalType =
  | "cv.tailor"
  | "coverLetter.generate"
  | "confirmations"
  | "ats.check"
  | "career.skillGap"
  | "application.followUp";

export interface Signal {
  type: SignalType;
  /** The tool id that resolves this signal (from the assistant tool catalog). */
  tool: string;
  /** Rank — higher first. 100 = urgent, 0 = informational. */
  priority: number;
  title: { en: string; sw: string };
  detail: { en: string; sw: string };
  /** The real, grounded trigger — every signal must cite its state. */
  trigger: string;
  jobId?: string;
  applicationId?: string;
  confirmations?: number;
}

/**
 * Stable identity for a signal instance — used to dedupe across turns: a
 * signal already shown this thread must never be offered again. type alone is
 * NOT unique (two jobs can both trigger cv.tailor); the trigger string carries
 * the grounded state (deadline, application id, score, count), so type+trigger
 * is the natural key. Client and server must use the SAME key — the client
 * records the keys it rendered and sends them back; the server filters.
 */
export function signalKey(s: Pick<Signal, "type" | "trigger">): string {
  return `${s.type}|${s.trigger}`;
}

/**
 * Restrain the signal engine: drop nudges the user has already seen this
 * thread (keys from signalKey) — a nudge must never repeat. Pure + testable.
 */
export function filterSeenSignals(signals: Signal[], seenKeys: string[]): Signal[] {
  if (!seenKeys?.length) return signals;
  const seen = new Set(seenKeys);
  return signals.filter((s) => !seen.has(signalKey(s)));
}

export const SIGNAL_THRESHOLDS = {
  /** Days before an application deadline that makes tailoring urgent. */
  deadlineDays: 14,
  /** Matched-job score at/above which a cover letter is worth offering. */
  coverLetterMinScore: 70,
  /** Matched-job score below which a skill-gap check is the honest next step. */
  skillGapMaxScore: 69,
  /** Matched-job score at/above which a skill-gap check is not noise. */
  skillGapMinScore: 40,
  /** Active CV ATS score below which an ATS check is offered. */
  atsMinScore: 70,
  /** Days an application can sit in "applied" before a follow-up is useful. */
  followUpDays: 7,
} as const;

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** An application is "for" a job when title + company match (jobs aren't FK-linked to applications). */
function appliedFor(apps: ContextApplication[], job: ContextJob): boolean {
  const key = norm(`${job.title}|${job.company}`);
  return apps.some((a) => norm(`${a.jobTitle}|${a.companyName}`) === key);
}

function daysUntil(deadline: Date | string, now: Date): number {
  return (new Date(deadline).getTime() - now.getTime()) / 86_400_000;
}

function staleDays(app: ContextApplication, now: Date): number {
  const ref = app.appliedAt ?? app.createdAt;
  if (!ref) return 0;
  return Math.max(0, Math.floor((now.getTime() - new Date(ref).getTime()) / 86_400_000));
}

/**
 * Compute proactive nudges from the unified context. Deterministic, pure.
 * Order: confirmations → deadline tailoring → stale follow-up → cover letter
 * → ATS → skill gap; returned sorted by priority desc.
 */
export function computeSignals(context: UnifiedContext, now: Date = new Date()): Signal[] {
  const signals: Signal[] = [];
  const jobs = context.matchedJobs;

  // 1. Trust loop — AI-drafted facts awaiting confirmation (highest priority:
  //    Sumaiya can't move first on a profile she doesn't trust).
  if (context.unconfirmed.length) {
    signals.push({
      type: "confirmations",
      tool: "confirmations",
      priority: 100,
      title: {
        en: "Facts need your confirmation",
        sw: "Taarifa zinasubiri uthibitisho",
      },
      detail: {
        en: `Sumaiya drafted ${context.unconfirmed.length} ${context.unconfirmed.length === 1 ? "fact" : "facts"} from your chat — confirm each to make them official.`,
        sw: `Sumaiya alikwambia taarifa ${context.unconfirmed.length} kutokana na mazungumzo — thibitisha kila moja ziwe rasmi.`,
      },
      trigger: `${context.unconfirmed.length} needs-confirmation facts`,
      confirmations: context.unconfirmed.length,
    });
  }

  // 2. Deadline + untailored CV — a matched job closes soon and the CV hasn't
  //    been tailored for it (no application on file for that job).
  for (const job of jobs) {
    if (!job.applicationDeadline) continue;
    if (appliedFor(context.applications, job)) continue;
    const d = daysUntil(job.applicationDeadline, now);
    if (d < 0 || d > SIGNAL_THRESHOLDS.deadlineDays) continue;
    signals.push({
      type: "cv.tailor",
      tool: "cv.tailor",
      priority: 90,
      jobId: job.id,
      title: { en: `Deadline approaching — tailor your CV`, sw: `Tarehe inakaribia — tengeneza CV yako` },
      detail: {
        en: `"${job.title}" at ${job.company} closes ${new Date(job.applicationDeadline).toLocaleDateString("en-GB")} (${Math.ceil(d)} day${Math.ceil(d) === 1 ? "" : "s"}). Your CV isn't tailored for it yet.`,
        sw: `"${job.title}" katika ${job.company} inafunga ${new Date(job.applicationDeadline).toLocaleDateString("sw-TZ")} (siku ${Math.ceil(d)}). CV yako bado haijalengwa kwa kazi hii.`,
      },
      trigger: `applicationDeadline ${job.applicationDeadline} (in ${Math.ceil(d)}d)`,
    });
  }

  // 3. Stale application — sat in "applied" with no status change for a week.
  for (const app of context.applications) {
    if (app.status !== "applied") continue;
    const days = staleDays(app, now);
    if (days < SIGNAL_THRESHOLDS.followUpDays) continue;
    signals.push({
      type: "application.followUp",
      tool: "application.followUp",
      priority: 80,
      applicationId: app.id,
      title: { en: "Time to follow up", sw: "Wakati wa kufuatilia" },
      detail: {
        en: `"${app.title}" has had no response for ${days} days — a polite follow-up to ${app.companyName || "the employer"} is worth sending.`,
        sw: `"${app.title}" haijapata majibu kwa siku ${days} — barua ya kufuatilia kwa ${app.companyName || "mwajiri"} inafaa.`,
      },
      trigger: `status "applied" for ${days} days`,
    });
  }

  // 4. Strong matched job, not applied yet → offer the cover letter.
  for (const job of jobs) {
    if (appliedFor(context.applications, job)) continue;
    if (job.score < SIGNAL_THRESHOLDS.coverLetterMinScore) continue;
    signals.push({
      type: "coverLetter.generate",
      tool: "coverLetter.generate",
      priority: 70,
      jobId: job.id,
      title: { en: `Strong match — write a cover letter`, sw: `Mechi nzuri — andika barua ya maombi` },
      detail: {
        en: `You match "${job.title}" at ${job.company} at ${job.score}% — a tailored cover letter would strengthen the application.`,
        sw: `Unaendana na "${job.title}" katika ${job.company} kwa ${job.score}% — barua ya maombi itaimarisha ombi lako.`,
      },
      trigger: `match score ${job.score}% ≥ ${SIGNAL_THRESHOLDS.coverLetterMinScore}%`,
    });
  }

  // 5. Active CV ATS score below threshold → offer the ATS check + fixes.
  if (context.activeCv) {
    try {
      const checks = analyzeCv(context.activeCv.data, false);
      const score = atsScore(checks);
      if (score < SIGNAL_THRESHOLDS.atsMinScore) {
        signals.push({
          type: "ats.check",
          tool: "ats.check",
          priority: 60,
          title: { en: "Your CV may miss ATS filters", sw: "CV yako inaweza kukosa vichujio vya ATS" },
          detail: {
            en: `"${context.activeCv.title}" scores ${score}/100 on ATS readability — a quick check shows the exact fixes.`,
            sw: `"${context.activeCv.title}" ina alama ${score}/100 kwenye ATS — ukaguzi wa haraka unaonyesha marekebisho sahihi.`,
          },
          trigger: `ATS score ${score}/100 < ${SIGNAL_THRESHOLDS.atsMinScore}`,
        });
      }
    } catch { /* a CV that can't be analyzed produces no signal */ }
  }

  // 6. Matched job with a real (but not strong) score → skill-gap check.
  for (const job of jobs) {
    if (appliedFor(context.applications, job)) continue;
    if (job.score < SIGNAL_THRESHOLDS.skillGapMinScore || job.score >= SIGNAL_THRESHOLDS.skillGapMaxScore) continue;
    signals.push({
      type: "career.skillGap",
      tool: "career.skillGap",
      priority: 50,
      jobId: job.id,
      title: { en: "Close the gap for this role", sw: "Funga pengo la kazi hii" },
      detail: {
        en: `You match "${job.title}" at ${job.company} at ${job.score}% — see exactly which skills it expects that you're missing.`,
        sw: `Unaendana na "${job.title}" katika ${job.company} kwa ${job.score}% — ona ujuzi gani unaokosekana.`,
      },
      trigger: `match score ${job.score}% in [${SIGNAL_THRESHOLDS.skillGapMinScore}..${SIGNAL_THRESHOLDS.skillGapMaxScore})`,
    });
  }

  return signals.sort((a, b) => b.priority - a.priority);
}
