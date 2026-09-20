"use client";

// Job Target Intelligence — paste a job description and see which
// keywords your CV covers vs. misses. No API calls needed.
// Missing keywords can be added to Skills with one click.

import { useState, useMemo, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { AutoTextarea } from "@/components/ui/auto-textarea";
import { extractTerms, getCVTerms, scoreTerms } from "@/lib/job-match";
import { matchTone, matchLabel } from "@/lib/match-ui";
import type { CVData } from "@/types";

interface JobTargetPanelProps {
  data: CVData;
  onAddSkill: (name: string) => void;
  defaultJd?: string;
  onApplySummary?: (summary: string) => void;
  // Apply a whole-CV tailor: the new summary plus rewritten experience
  // descriptions keyed by experience id.
  onApplyTailoredCv?: (summary: string, expDescById: Record<string, string>) => void;
  // Generate a matching cover letter tailored to the pasted job (created from
  // the CV, then opened). Busy state is owned by the editor.
  onGenerateCoverLetter?: (jobDescription: string) => void;
  coverLetterBusy?: boolean;
  accessToken?: string;
  lang?: "en" | "sw";
}

export function JobTargetPanel({ data, onAddSkill, defaultJd, onApplySummary, onApplyTailoredCv, onGenerateCoverLetter, coverLetterBusy, accessToken, lang = "en" }: JobTargetPanelProps) {
  const sw = lang === "sw";
  const [jd, setJd] = useState(defaultJd ?? "");
  const [analyzed, setAnalyzed] = useState(!!defaultJd);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // AI "tailor summary to this job" state (fallback when whole-CV isn't wired)
  const [tailoring, setTailoring] = useState(false);
  const [tailored, setTailored] = useState("");
  const [tailorError, setTailorError] = useState("");

  // AI "tailor the whole CV (summary + experience bullets) to this job" state
  const [tailorCvBusy, setTailorCvBusy] = useState(false);
  const [tailorCvResult, setTailorCvResult] = useState<{ summary: string; experience: { id: string; description: string }[] } | null>(null);
  const [tailorCvError, setTailorCvError] = useState("");
  // Anti-fabrication: claims the AI added that aren't in the user's real CV.
  // Apply all stays disabled until the user confirms they are true.
  const [tailorEvidence, setTailorEvidence] = useState<{ claim: string; location: string }[] | null>(null);
  const [tailorConfirmed, setTailorConfirmed] = useState(false);

  async function handleTailorCv() {
    if (tailorCvBusy || !jd.trim()) return;
    setTailorCvBusy(true); setTailorCvError(""); setTailorCvResult(null); setTailorEvidence(null); setTailorConfirmed(false);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch("/api/ai/tailor-cv", {
        method: "POST", headers,
        body: JSON.stringify({
          jobDescription: jd,
          jobTitle: data.personal.jobTitle || undefined,
          summary: data.summary,
          experience: data.experience.map((e) => ({ id: e.id, position: e.position, company: e.company, description: e.description })),
          lang,
          // Send the full real CV so the server's evidence engine can verify
          // every claim in the rewrite against it — same gate the assistant
          // cockpit applies. Without this the panel bypasses anti-fabrication.
          currentCv: data,
        }),
      });
      const json = await res.json().catch(() => ({})) as { success?: boolean; data?: { summary: string; experience: { id: string; description: string }[] }; evidence?: { unconfirmed?: { claim: string; location: string }[] } | null; error?: string };
      if (!res.ok || !json.success || !json.data) {
        setTailorCvError(json.error || (sw ? "Imeshindwa kuboresha CV sasa. Jaribu tena." : "Couldn't tailor the CV right now. Please try again."));
      } else {
        setTailorCvResult(json.data);
        setTailorEvidence(json.evidence?.unconfirmed ?? null);
      }
    } catch {
      setTailorCvError(sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again.");
    } finally {
      setTailorCvBusy(false);
    }
  }

  // AI-prioritized keyword extraction (must-have vs nice-to-have). When present
  // it replaces the naive token-overlap match; the offline heuristic stays as an
  // instant, always-works fallback.
  type AiKeyword = { term: string; importance: "must" | "nice" };
  const [aiKeywords, setAiKeywords] = useState<AiKeyword[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  async function handleSmartMatch() {
    if (!jd.trim() || aiLoading) return;
    setAiLoading(true); setAiError("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch("/api/ai/jd-keywords", {
        method: "POST", headers,
        body: JSON.stringify({ jobDescription: jd, jobTitle: data.personal.jobTitle || undefined }),
      });
      const json = await res.json().catch(() => ({})) as { success?: boolean; data?: { keywords?: AiKeyword[] }; error?: string };
      if (!res.ok || !json.success || !json.data?.keywords?.length) {
        setAiError(json.error || (sw ? "Imeshindwa kuendesha ulinganishaji. Tunaonyesha ulinganishaji wa haraka." : "Couldn't run the smart match. Showing the quick match instead."));
      } else {
        setAiKeywords(json.data.keywords);
        setAnalyzed(true);
        setDismissed(new Set());
      }
    } catch {
      setAiError(sw ? "Hitilafu ya mtandao. Tunaonyesha ulinganishaji wa haraka." : "Network error. Showing the quick match instead.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleTailor() {
    if (!data.summary.trim() || tailoring) return;
    setTailoring(true); setTailorError(""); setTailored("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch("/api/ai/tailor", {
        method: "POST", headers,
        body: JSON.stringify({
          summary: data.summary,
          jobTitle: data.personal.jobTitle || undefined,
          jobDescription: jd,
        }),
      });
      const json = await res.json().catch(() => ({})) as { success?: boolean; data?: { summary?: string }; error?: string };
      if (!res.ok || !json.success || !json.data?.summary) {
        setTailorError(json.error || (sw ? "Imeshindwa kuboresha sasa. Tafadhali jaribu tena." : "Couldn't tailor right now. Please try again."));
      } else {
        setTailored(json.data.summary);
      }
    } catch {
      setTailorError(sw ? "Hitilafu ya mtandao. Tafadhali jaribu tena." : "Network error. Please try again.");
    } finally {
      setTailoring(false);
    }
  }

  useEffect(() => {
    if (defaultJd) { setJd(defaultJd); setAnalyzed(true); setDismissed(new Set()); }
  }, [defaultJd]);

  const result = useMemo(() => {
    if (!analyzed || !jd.trim()) return null;
    const cvTerms = getCVTerms(data);

    // AI path: prioritized keywords (must-have vs nice-to-have).
    if (aiKeywords && aiKeywords.length) {
      const matched: string[] = [], missMust: string[] = [], missNice: string[] = [];
      for (const k of aiKeywords) {
        const term = k.term.toLowerCase();
        const found = cvTerms.has(term) ||
          [...cvTerms].some(cv => (cv.includes(term) || term.includes(cv)) && Math.min(cv.length, term.length) >= 4);
        if (found) matched.push(k.term);
        else (k.importance === "must" ? missMust : missNice).push(k.term);
      }
      const score = aiKeywords.length ? Math.round((matched.length / aiKeywords.length) * 100) : 0;
      return { ai: true as const, matched, missing: [...missMust, ...missNice], missMust, missNice, score };
    }

    // Offline heuristic fallback.
    const jobTerms = extractTerms(jd).slice(0, 60);
    const s = scoreTerms(jobTerms, cvTerms);
    return { ai: false as const, ...s, missMust: [] as string[], missNice: [] as string[] };
  }, [jd, data, analyzed, aiKeywords]);

  const visibleMissing = result?.missing.filter(t => !dismissed.has(t)).slice(0, 12) ?? [];
  const addedToSkills = new Set(data.skills.map(s => s.name.toLowerCase()));

  // Recommended changes — a prioritized, EXPLAINABLE action plan derived
  // deterministically from the match result + the CV (no AI call). Each item is
  // wired to an existing tool that previews before it changes anything.
  type Rec = { id: string; label: { en: string; sw: string }; cta?: { en: string; sw: string }; action?: () => void; busy?: boolean };
  const recommendations: Rec[] = (() => {
    if (!result) return [];
    const recs: Rec[] = [];
    // 1. Missing skills the job wants (required first when we have that signal).
    const wantedMissing = (result.ai && result.missMust.length ? result.missMust : result.missing)
      .filter(t => !addedToSkills.has(t.toLowerCase()));
    if (wantedMissing.length > 0) {
      const preview = wantedMissing.slice(0, 4).join(", ");
      recs.push({
        id: "skills",
        label: {
          en: `Add ${wantedMissing.length} ${result.ai && result.missMust.length ? "required " : ""}skill${wantedMissing.length > 1 ? "s" : ""} the job asks for — if you truly have ${wantedMissing.length > 1 ? "them" : "it"}: ${preview}${wantedMissing.length > 4 ? "…" : ""}`,
          sw: `Ongeza ujuzi ${wantedMissing.length} kazi inaohitaji — kama kweli unao: ${preview}${wantedMissing.length > 4 ? "…" : ""}`,
        },
        cta: { en: "Add to skills", sw: "Ongeza kwenye ujuzi" },
        action: () => {
          wantedMissing.forEach(t => { if (!addedToSkills.has(t.toLowerCase())) onAddSkill(t); });
          setDismissed(prev => new Set([...prev, ...wantedMissing]));
        },
      });
    }
    // 2. Summary too thin/absent to sell the fit.
    if (data.summary.trim().length < 120 && (onApplyTailoredCv || onApplySummary)) {
      recs.push({
        id: "summary",
        label: { en: "Strengthen your summary to target this role.", sw: "Imarisha muhtasari wako kulenga kazi hii." },
        cta: onApplyTailoredCv ? { en: "Tailor CV", sw: "Boresha CV" } : { en: "Tailor summary", sw: "Boresha muhtasari" },
        action: onApplyTailoredCv ? handleTailorCv : handleTailor,
        busy: onApplyTailoredCv ? tailorCvBusy : tailoring,
      });
    }
    // 3. Experience with no measurable results — the top recruiter signal.
    if (data.experience.length > 0 && !data.experience.some(e => /\d/.test(e.description))) {
      recs.push({
        id: "quantify",
        label: { en: "Add measurable results to your experience (amounts, %, counts).", sw: "Ongeza matokeo yanayopimika kwenye uzoefu (kiasi, %, idadi)." },
        cta: onApplyTailoredCv ? { en: "Tailor experience to this job", sw: "Boresha uzoefu kulenga kazi" } : undefined,
        action: onApplyTailoredCv ? handleTailorCv : undefined,
        busy: tailorCvBusy,
      });
    }
    return recs;
  })();

  return (
    <div className="space-y-4">
      {/* Job Target card — header with icon and role */}
      <div className="bg-card rounded-card p-4 border border-border">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-ember-tint flex items-center justify-center">
            <Icon name="target" className="text-ember" size={16} />
          </div>
          <div>
            <p className="text-xs font-semibold text-espresso">{sw ? "Lengo la Kazi" : "Job Target"}</p>
            <p className="text-[10px] text-text-muted">{sw ? "Weka maelezo ya kazi uone kama CV yako inafaa" : "Paste a job description to analyze fit"}</p>
          </div>
        </div>
        <AutoTextarea
          value={jd}
          onChange={(e) => { setJd(e.target.value); setAnalyzed(false); setAiKeywords(null); setAiError(""); }}
          rows={4}
          maxHeight={220}
          placeholder={sw ? "Bandika maelezo kamili ya kazi hapa..." : "Paste the full job description here..."}
          className="w-full px-3 py-2 text-xs bg-sand-2 border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember min-h-[84px] placeholder:text-text-muted/50"
        />
        <div className="mt-2.5 flex gap-2">
          <Button
            onClick={() => setAnalyzed(true)}
            disabled={!jd.trim()}
            size="sm"
            variant="secondary"
            className="flex-1"
          >
            <Icon name="search" size={14} />
            {sw ? "Linganisha haraka" : "Quick match"}
          </Button>
          <Button
            onClick={handleSmartMatch}
            disabled={!jd.trim() || aiLoading}
            size="sm"
            className="flex-1"
          >
            <Icon name="magic" size={14} />
            {aiLoading ? (sw ? "Inachambua…" : "Analyzing…") : (sw ? "Linganisha" : "Smart match")}
          </Button>
        </div>
        {aiError && <p className="text-[10px] text-gold-text mt-1.5">{aiError}</p>}
      </div>

      {result && (
        <>
          {/* Match score */}
          <div className="bg-card rounded-card p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon name="target" className="text-ember" size={14} />
                <span className="text-xs font-semibold text-text-body">{sw ? "Alama ya Kufanana" : "Match Score"}</span>
                {result.ai && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-ember-tint text-ember-hover uppercase tracking-wide">AI</span>
                )}
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${matchTone(result.score).tintBg} ${matchTone(result.score).text}`}>
                {matchLabel(result.score, sw)}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="font-display text-3xl font-extrabold leading-none text-espresso">{result.score}</span>
              <span className="text-xs font-medium text-text-muted">/100</span>
            </div>
            <div className="w-full h-2 bg-sand rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-[width] duration-[550ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${matchTone(result.score).bar}`}
                style={{ width: `${result.score}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-text-muted">
                {result.matched.length} / {result.matched.length + result.missing.length} {sw ? "maneno muhimu" : "keywords"}
              </span>
              <span className="text-[10px] font-semibold text-text-body">{result.score}%</span>
            </div>
          </div>

          {/* Recommended changes — prioritized, explainable action plan */}
          {recommendations.length > 0 && (
            <div className="bg-card rounded-card p-4 border border-border">
              <p className="text-[11px] font-semibold text-espresso mb-2.5 flex items-center gap-1.5">
                <Icon name="target" size={12} className="text-ember" />
                {sw ? "Mabadiliko yanayopendekezwa" : "Recommended changes"}
              </p>
              <ol className="space-y-2.5">
                {recommendations.map((r, i) => (
                  <li key={r.id} className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-ember-tint text-ember-hover text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-espresso leading-snug">{sw ? r.label.sw : r.label.en}</p>
                      {r.cta && r.action && (
                        <button
                          onClick={r.action}
                          disabled={r.busy}
                          className="mt-1 text-[10px] font-semibold text-ember-hover hover:underline disabled:opacity-50"
                        >
                          {r.busy ? (sw ? "Inafanya…" : "Working…") : (sw ? r.cta.sw : r.cta.en)}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
              <p className="text-[9px] text-text-muted mt-2.5">
                {sw ? "Kila pendekezo hukuonyesha kabla ya kubadilisha chochote." : "Each suggestion previews before it changes anything."}
              </p>
            </div>
          )}

          {/* AI: tailor the WHOLE CV to this job (summary + experience bullets) */}
          {onApplyTailoredCv && (
            <div className="bg-card rounded-card p-4 border border-border">
              <div className="flex items-center gap-2 mb-2.5">
                <Icon name="magic" size={14} className="text-ember" />
                <span className="text-xs font-semibold text-espresso">{sw ? "Boresha CV nzima kulenga kazi hii" : "Tailor my CV to this job"}</span>
              </div>
              {!tailorCvResult ? (
                <>
                  <p className="text-[10px] text-text-muted mb-2.5">
                    {sw
                      ? "Nitaandika upya muhtasari wako na sehemu za uzoefu kuangazia yanayolingana na kazi hii — kwa ukweli, kutoka ulichonacho. Sitabuni kitu."
                      : "I rewrite your summary and experience bullets to match this job — truthfully, from what you already have. I invent nothing."}
                  </p>
                  <Button onClick={handleTailorCv} disabled={tailorCvBusy || !jd.trim()} size="sm" className="w-full">
                    <Icon name="magic" size={14} />
                    {tailorCvBusy ? (sw ? "Inaboresha CV…" : "Tailoring your CV…") : (sw ? "Boresha CV yako" : "Tailor my CV")}
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted">{sw ? "Muhtasari mpya" : "New summary"}</p>
                  <div className="text-[11px] leading-relaxed text-espresso bg-sand-2 border border-border rounded-input px-3 py-2 max-h-40 overflow-y-auto">
                    {tailorCvResult.summary}
                  </div>
                  {tailorCvResult.experience.length > 0 && (
                    <p className="text-[10px] text-pine font-medium flex items-center gap-1">
                      <Icon name="check" size={11} className="text-pine" />
                      {sw
                        ? `Pamoja na sehemu ${tailorCvResult.experience.length} za uzoefu zilizoandikwa upya`
                        : `Plus ${tailorCvResult.experience.length} work ${tailorCvResult.experience.length === 1 ? "entry" : "entries"} rewritten`}
                    </p>
                  )}
                  {tailorEvidence && tailorEvidence.length > 0 && (
                    <div className={`border rounded-input px-3 py-2 space-y-1.5 ${tailorConfirmed ? "border-pine/30 bg-pine-tint/30" : "border-amber-300 bg-amber-50"}`}>
                      <p className="text-[10px] font-semibold text-amber-700 flex items-center gap-1.5">
                        <Icon name="alert-triangle" size={11} className="shrink-0" />
                        {sw ? "Haya hayapo kwenye CV yako — nimeyaongeza mimi. Thibitisha kama ni kweli:" : "These aren't in your CV — I added them. Confirm if true:"}
                      </p>
                      <ul className="space-y-0.5">
                        {tailorEvidence.map((c, i) => (
                          <li key={i} className="text-[11px] text-espresso flex items-start gap-1.5">
                            <span className="text-amber-500 mt-px">•</span>
                            <span>
                              <strong>{c.claim}</strong>{" "}
                              <span className="text-text-muted">({sw ? "katika" : "in"} {c.location})</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                      {!tailorConfirmed && (
                        <button onClick={() => setTailorConfirmed(true)}
                          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-2 rounded-input transition">
                          <Icon name="check" size={13} />
                          {sw ? "Ndiyo, haya ni kweli — endelea" : "Yes, these are true — continue"}
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      disabled={!!(tailorEvidence && tailorEvidence.length > 0 && !tailorConfirmed)}
                      onClick={() => {
                        const map: Record<string, string> = {};
                        for (const e of tailorCvResult.experience) map[e.id] = e.description;
                        onApplyTailoredCv(tailorCvResult.summary, map);
                        setTailorCvResult(null);
                        setTailorEvidence(null);
                        setTailorConfirmed(false);
                      }}
                      size="sm" className="flex-1"
                    >
                      <Icon name="check" size={14} /> {sw ? "Tumia yote" : "Apply all"}
                    </Button>
                    <Button onClick={() => setTailorCvResult(null)} variant="secondary" size="sm" className="flex-1">
                      {sw ? "Acha" : "Discard"}
                    </Button>
                  </div>
                  <button onClick={handleTailorCv} disabled={tailorCvBusy} className="w-full text-[10px] text-text-muted hover:text-ember transition">
                    {tailorCvBusy ? (sw ? "Inatengeneza tena…" : "Regenerating…") : (sw ? "Tengeneza tena" : "Regenerate")}
                  </button>
                </div>
              )}
              {tailorCvError && <p className="text-[10px] text-red-600 mt-2">{tailorCvError}</p>}
            </div>
          )}

          {/* AI: tailor summary only — fallback when whole-CV apply isn't wired */}
          {!onApplyTailoredCv && onApplySummary && (
            <div className="bg-card rounded-card p-4 border border-border">
              <div className="flex items-center gap-2 mb-2.5">
                <Icon name="magic" size={14} className="text-ember" />
                <span className="text-xs font-semibold text-espresso">{sw ? "Boresha muhtasari" : "Tailor summary"}</span>
              </div>
              {!data.summary.trim() ? (
                <p className="text-[10px] text-text-muted">{sw ? "Andika muhtasari wa kitaalamu kwanza, kisha nitaandika upya kulenga kazi hii." : "Write a professional summary first, then I can rewrite it to target this job."}</p>
              ) : (
                <>
                  <p className="text-[10px] text-text-muted mb-2.5">{sw ? "Andika upya muhtasari wako kujumuisha mahitaji muhimu ya kazi hii — kwa ukweli, kutoka ulichonacho." : "Rewrite your summary to weave in this job’s key requirements — truthfully, from what you already have."}</p>
                  {!tailored ? (
                    <Button onClick={handleTailor} disabled={tailoring} size="sm" className="w-full">
                      <Icon name="magic" size={14} />
                      {tailoring ? (sw ? "Inaboresha…" : "Tailoring…") : (sw ? "Boresha kulenga kazi hii" : "Tailor to this job")}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-[11px] leading-relaxed text-espresso bg-sand-2 border border-border rounded-input px-3 py-2 max-h-40 overflow-y-auto">
                        {tailored}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => { onApplySummary(tailored); setTailored(""); }} size="sm" className="flex-1">
                          <Icon name="check" size={14} /> {sw ? "Tumia" : "Apply"}
                        </Button>
                        <Button onClick={() => setTailored("")} variant="secondary" size="sm" className="flex-1">
                          {sw ? "Acha" : "Discard"}
                        </Button>
                      </div>
                      <button onClick={handleTailor} disabled={tailoring} className="w-full text-[10px] text-text-muted hover:text-ember transition">
                        {tailoring ? (sw ? "Inatengeneza tena…" : "Regenerating…") : (sw ? "Tengeneza tena" : "Regenerate")}
                      </button>
                    </div>
                  )}
                  {tailorError && <p className="text-[10px] text-red-600 mt-2">{tailorError}</p>}
                </>
              )}
            </div>
          )}

          {/* Matching cover letter — one tap from optimizing the CV to a
              job-tailored cover letter written from that CV. */}
          {onGenerateCoverLetter && jd.trim() && (
            <div className="bg-card rounded-card p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="mail" size={14} className="text-pine" />
                <span className="text-xs font-semibold text-espresso">{sw ? "Barua ya maombi inayolingana" : "Matching cover letter"}</span>
              </div>
              <p className="text-[10px] text-text-muted mb-2.5">
                {sw ? "Tengeneza barua ya maombi iliyolengwa kwa kazi hii — imeandikwa kutoka kwa CV yako." : "Create a cover letter tailored to this job, written from your CV."}
              </p>
              <Button onClick={() => onGenerateCoverLetter(jd)} disabled={coverLetterBusy} size="sm" className="w-full">
                <Icon name="mail" size={14} />
                {coverLetterBusy ? (sw ? "Inatengeneza…" : "Creating…") : (sw ? "Tengeneza barua inayolingana" : "Generate matching cover letter")}
              </Button>
            </div>
          )}

          {/* Missing keywords */}
          {visibleMissing.length > 0 && (
            <div className="bg-card rounded-card p-4 border border-border">
              <p className="text-[11px] font-semibold text-ember-hover mb-1 flex items-center gap-1.5">
                <Icon name="plus" size={12} className="text-ember" />
                {sw ? "Ongeza maneno haya" : "Add these keywords"} ({result.missing.length})
              </p>
              {result.ai && (result.missMust.length > 0 || result.missNice.length > 0) && (
                <p className="text-[9px] text-text-muted mb-2">
                  {result.missMust.length > 0 && <span className="text-red-600 font-semibold">{result.missMust.length} {sw ? "yanayohitajika" : "required"}</span>}
                  {result.missMust.length > 0 && result.missNice.length > 0 && " · "}
                  {result.missNice.length > 0 && <span>{result.missNice.length} {sw ? "yanayopendelewa" : "preferred"}</span>}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {visibleMissing.map(term => {
                  const alreadySkill = addedToSkills.has(term);
                  const isMust = result.ai && result.missMust.includes(term);
                  return (
                    <div key={term}
                      className={`flex items-center gap-1 rounded-pill px-2 py-0.5 border ${isMust ? "border-red-300 bg-red-50" : "border-ember-tint bg-ember-tint/40"}`}>
                      <span className="text-[10px] font-medium text-espresso">{term}</span>
                      {!alreadySkill && (
                        <button
                          onClick={() => { onAddSkill(term); setDismissed(prev => new Set([...prev, term])); }}
                          title={sw ? "Ongeza kwenye ujuzi" : "Add to skills"}
                          aria-label={sw ? "Ongeza kwenye ujuzi" : "Add to skills"}
                          className="w-6 h-6 -my-1 bg-ember hover:bg-ember-hover rounded-full flex items-center justify-center transition flex-shrink-0 touch-manipulation"
                        >
                          <Icon name="plus" size={10} className="text-cream" />
                        </button>
                      )}
                      <button
                        onClick={() => setDismissed(prev => new Set([...prev, term]))}
                        title={sw ? "Ondoa" : "Dismiss"}
                        aria-label={sw ? "Ondoa" : "Dismiss"}
                        className="w-6 h-6 -my-1 -mr-1 flex items-center justify-center text-text-muted hover:text-espresso transition flex-shrink-0 touch-manipulation"
                      >
                        <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="text-[9px] text-text-muted mt-1.5">{sw ? "Bofya + kuongeza kwenye Ujuzi wako" : "Tap + to add to your Skills section"}</p>
            </div>
          )}

          {/* Matched keywords */}
          {result.matched.length > 0 && (
            <div className="bg-card rounded-card p-4 border border-border">
              <p className="text-[11px] font-semibold text-pine mb-2.5 flex items-center gap-1.5">
                <Icon name="check" size={12} className="text-pine" />
                {sw ? "Yamelingana" : "Matched"} ({result.matched.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {result.matched.slice(0, 15).map(term => (
                  <span key={term}
                    className="text-[10px] bg-pine-tint border border-pine-tint text-pine rounded-pill px-2 py-0.5 font-medium">
                    {term}
                  </span>
                ))}
                {result.matched.length > 15 && (
                  <span className="text-[10px] text-text-muted">+{result.matched.length - 15} {sw ? "zaidi" : "more"}</span>
                )}
              </div>
            </div>
          )}

          {result.missing.length === 0 && (
            <div className="bg-pine-tint border border-pine/20 rounded-card px-4 py-3 text-center">
              <p className="text-xs font-semibold text-pine">{sw ? "Ulinganifu bora!" : "Excellent match!"}</p>
              <p className="text-[10px] text-pine/70 mt-0.5">{sw ? "CV yako ina maneno yote muhimu ya kazi hii." : "Your CV covers all key terms from this job description."}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
