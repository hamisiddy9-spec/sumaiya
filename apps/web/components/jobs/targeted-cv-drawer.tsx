"use client";

// Job → Match → Targeted CV drawer — Slice 3 of the career-platform pass.
//
// Deterministic only: it asks the server to build a CV from the user's Career
// Profile reordered around THIS job (lib/targeted-cv), shows the REAL
// before/after match scores from the engine, explains the delta, and — because
// missing requirements are never auto-added — asks the user to confirm they
// have each one before creating the CV. No AI rewording here (that stays in
// /api/ai/tailor-cv behind TRUTH_CONSTRAINT + the evidence gate).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FeedJob } from "@/app/[locale]/(marketing)/jobs/page";
import type { Lang } from "@/lib/i18n/translations";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useModalDialog } from "@/components/ui/use-modal-dialog";
import { matchTone } from "@/lib/match-ui";

interface TargetedCvResult {
  cv: Record<string, unknown>;
  analysis: {
    title: string;
    skills: string[];
    seniority: string;
    employmentType: string;
    keywords: string[];
    requirements: string[];
  };
  before: { score: number; matched: string[]; missing: string[] };
  after: { score: number; matched: string[]; missing: string[] };
  explanation: string[];
  toConfirm: string[];
}

const STRINGS = {
  en: {
    trigger: "Create targeted CV",
    title: "Targeted CV",
    subtitle: "Your profile, reordered around this exact job.",
    loading: "Analyzing this job against your profile…",
    noProfileTitle: "No career profile yet",
    noProfileBody: "Build your Career Profile first — the targeted CV is made from your verified facts, nothing invented.",
    buildProfile: "Build Career Profile",
    jobAsksFor: "This job asks for",
    seniority: "Level",
    employment: "Type",
    scoreBefore: "Your CV now",
    scoreAfter: "Targeted CV",
    match: "MATCH",
    whyImproved: "Why it moved",
    confirmTitle: "Confirm you have each of these",
    confirmHint: "Nothing is added to your CV automatically — you're confirming your profile honestly covers the job's requirements.",
    confirmLabel: "I have: ",
    create: "Create targeted CV",
    creating: "Creating…",
    openInEditor: "Open in editor",
    errorGeneric: "Couldn't analyze this job. Please try again.",
    networkError: "Network error. Please try again.",
    close: "Close",
    allConfirmed: "Confirm all requirements to continue",
  },
  sw: {
    trigger: "Unda CV lengwa",
    title: "CV Lengwa",
    subtitle: "Wasifu wako, umepangwa upya kwa ajili ya kazi hii haswa.",
    loading: "Inachanganua kazi hii dhidi ya wasifu wako…",
    noProfileTitle: "Hakuna wasifu wa kazi bado",
    noProfileBody: "Jenga Wasifu wako wa Kazi kwanza — CV lengwa hujengwa kutoka ukweli wako uliothibitishwa, hakuna kinachobuniwa.",
    buildProfile: "Jenga Wasifu wa Kazi",
    jobAsksFor: "Kazi hii inahitaji",
    seniority: "Ngazi",
    employment: "Aina",
    scoreBefore: "CV yako sasa",
    scoreAfter: "CV Lengwa",
    match: "KUFANANA",
    whyImproved: "Kwa nini ilibadilika",
    confirmTitle: "Thibitisha unazo kila moja",
    confirmHint: "Hakuna kinachoongezwa kwenye CV yako kiotomatiki — unathibitisha tu kwamba wasifu wako unakidhi mahitaji ya kazi kwa uaminifu.",
    confirmLabel: "Nina: ",
    create: "Unda CV lengwa",
    creating: "Inaunda…",
    openInEditor: "Fungua kwenye mhariri",
    errorGeneric: "Imeshindwa kuchanganua kazi hii. Jaribu tena.",
    networkError: "Hitilafu ya mtandao. Jaribu tena.",
    close: "Funga",
    allConfirmed: "Thibitisha mahitaji yote kuendelea",
  },
} as const;

interface Props {
  lang: Lang;
  job: FeedJob;
}

export function TargetedCvDrawer({ lang, job }: Props) {
  const s = STRINGS[lang];
  const sw = lang === "sw";

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  // Escape + focus trap + focus management for the drawer panel.
  useModalDialog(open, () => setOpen(false), panelRef);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TargetedCvResult | null>(null);
  const [confirmed, setConfirmed] = useState<Set<number>>(new Set());
  const [creating, setCreating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch("/api/jobs/targeted-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          jobTitle: job.title,
          company: job.company || undefined,
          jobDescription: job.description || undefined,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        data?: TargetedCvResult;
        error?: string;
      };
      if (res.status === 404) {
        setError("NO_PROFILE");
      } else if (j.success && j.data) {
        setResult(j.data);
        setConfirmed(new Set());
      } else {
        setError(j.error || s.errorGeneric);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(sw ? "Ombi limeisha muda. Jaribu tena." : "Request timed out. Please try again.");
      } else {
        setError(s.networkError);
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [job.title, job.company, job.description, s.errorGeneric, s.networkError, sw]);

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError("");
    void load();
    return () => abortRef.current?.abort();
  }, [open, load]);

  const allConfirmed = useMemo(
    () => !!result && result.toConfirm.length > 0 && confirmed.size >= result.toConfirm.length,
    [result, confirmed],
  );

  const toneBefore = result ? matchTone(result.before.score) : null;
  const toneAfter = result ? matchTone(result.after.score) : null;

  const createCv = async () => {
    if (!result || creating) return;
    setCreating(true);
    setError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          title: `${job.title}${job.company ? ` — ${job.company}` : ""} (Targeted)`,
          data: result.cv,
          status: "draft",
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { success?: boolean; data?: { id?: string }; error?: string };
      if (j.success && j.data?.id) {
        window.location.href = `/editor/cv/${j.data.id}`;
        return;
      }
      setError(j.error || s.errorGeneric);
    } catch {
      setError(s.networkError);
    } finally {
      clearTimeout(timeout);
      setCreating(false);
    }
  };

  const toggleConfirm = (i: number) => {
    setConfirmed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const seniorityLabel = (v: string): string => {
    if (sw) {
      if (v === "junior") return "Junior";
      if (v === "mid") return "Kati";
      if (v === "senior") return "Senior";
      if (v === "lead") return "Kiongozi";
      return "Haijatajwa";
    }
    if (v === "junior") return "Junior";
    if (v === "mid") return "Mid";
    if (v === "senior") return "Senior";
    if (v === "lead") return "Lead";
    return "Unstated";
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        variant="secondary"
        className="shrink-0"
        title={s.trigger}
      >
        <Icon name="target" size={14} />
        {s.trigger}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-espresso/50 backdrop-blur-[2px] p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={s.title}
          onClick={() => setOpen(false)}
        >
          <div
            ref={panelRef}
            tabIndex={-1}
            className="w-full sm:max-w-lg bg-card rounded-t-card sm:rounded-card border border-border shadow-xl max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-border">
              <div className="min-w-0">
                <h2 className="font-display text-lg font-extrabold text-espresso flex items-center gap-2">
                  <Icon name="target" size={16} className="text-ember" />
                  {s.title}
                </h2>
                <p className="text-xs text-text-muted mt-0.5 truncate">{job.title}</p>
                <p className="text-[11px] text-text-muted/70">{s.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={s.close}
                className="shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-lg text-text-muted hover:text-espresso hover:bg-sand transition"
              >
                <Icon name="chevron-right" size={16} className="rotate-90" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-muted">
                  <Icon name="magic" size={22} className="animate-pulse" />
                  <p className="text-xs">{s.loading}</p>
                </div>
              ) : error === "NO_PROFILE" ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-sand flex items-center justify-center mx-auto mb-3">
                    <Icon name="user" className="text-text-muted" size={22} />
                  </div>
                  <p className="text-sm font-semibold text-espresso">{s.noProfileTitle}</p>
                  <p className="text-xs text-text-muted mt-1.5 max-w-sm mx-auto leading-relaxed">
                    {s.noProfileBody}
                  </p>
                  <Button href="/settings" size="sm" className="mt-4">
                    {s.buildProfile}
                    <Icon name="chevron-right" size={14} />
                  </Button>
                </div>
              ) : error ? (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-input px-3 py-2 flex items-start gap-2">
                  <span>⚠</span>
                  <span className="flex-1">{error}</span>
                  <button onClick={() => setError("")} aria-label={s.close}>&times;</button>
                </div>
              ) : result ? (
                <div className="space-y-4">
                  {/* Analysis chips */}
                  {(result.analysis.skills.length > 0 ||
                    result.analysis.seniority !== "unstated" ||
                    result.analysis.employmentType !== "unstated") && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-1.5">
                        {s.jobAsksFor}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.analysis.seniority !== "unstated" && (
                          <span className="text-[10px] font-medium bg-sand text-text-body rounded-pill px-2 py-0.5 border border-border">
                            {s.seniority}: {seniorityLabel(result.analysis.seniority)}
                          </span>
                        )}
                        {result.analysis.employmentType !== "unstated" && (
                          <span className="text-[10px] font-medium bg-sand text-text-body rounded-pill px-2 py-0.5 border border-border">
                            {s.employment}: {result.analysis.employmentType}
                          </span>
                        )}
                        {result.analysis.skills.slice(0, 10).map((sk) => (
                          <span key={sk} className="text-[10px] font-medium bg-ember-tint/40 border border-ember-tint text-espresso rounded-pill px-2 py-0.5">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Before → After */}
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 text-center rounded-card border border-border bg-sand/60 px-3 py-3">
                        <p className="text-[10px] text-text-muted mb-1">{s.scoreBefore}</p>
                        <p className={`font-display text-2xl font-extrabold ${toneBefore?.text ?? "text-text-body"}`}>
                          {result.before.score}
                        </p>
                        <p className="text-[9px] font-semibold text-text-muted">{s.match}</p>
                      </div>
                      <Icon name="swap" size={16} className="text-text-muted shrink-0" />
                      <div className="flex-1 text-center rounded-card border border-ember/30 bg-ember-tint/40 px-3 py-3">
                        <p className="text-[10px] text-text-muted mb-1">{s.scoreAfter}</p>
                        <p className={`font-display text-2xl font-extrabold ${toneAfter?.text ?? "text-ember"}`}>
                          {result.after.score}
                        </p>
                        <p className="text-[9px] font-semibold text-text-muted">{s.match}</p>
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  {result.explanation.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-1.5">
                        {s.whyImproved}
                      </p>
                      <ul className="space-y-1">
                        {result.explanation.map((line, i) => (
                          <li key={i} className="text-xs text-text-body leading-relaxed flex gap-1.5">
                            <span className="text-ember shrink-0">•</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Confirm requirements — ask, don't add */}
                  {result.toConfirm.length > 0 && (
                    <div className="rounded-card border border-gold/40 bg-gold-tint/40 px-3.5 py-3">
                      <p className="text-xs font-bold text-espresso flex items-center gap-1.5">
                        <Icon name="check" size={13} className="text-gold-text" />
                        {s.confirmTitle}
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5 mb-2">{s.confirmHint}</p>
                      <div className="space-y-1.5">
                        {result.toConfirm.map((req, i) => (
                          <label
                            key={i}
                            className="flex items-start gap-2 text-xs text-text-body cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              checked={confirmed.has(i)}
                              onChange={() => toggleConfirm(i)}
                              className="mt-0.5 accent-[#C2410C]"
                            />
                            <span>
                              <span className="font-medium">{s.confirmLabel}</span>
                              {req}
                            </span>
                          </label>
                        ))}
                      </div>
                      {!allConfirmed && (
                        <p className="text-[10px] text-gold-text mt-2">{s.allConfirmed}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            {result && (
              <div className="px-5 py-3.5 border-t border-border flex items-center justify-between gap-3">
                <p className="text-[10px] text-text-muted hidden sm:block">
                  {sw
                    ? "Ukweli wako tu — hakuna kinachobuniwa."
                    : "Your facts only — nothing invented."}
                </p>
                <Button onClick={createCv} disabled={!allConfirmed || creating} size="sm" className="shrink-0">
                  {creating ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="magic" size={13} className="animate-pulse" />
                      {s.creating}
                    </span>
                  ) : (
                    <>
                      <Icon name="plus" size={13} />
                      {s.create}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
