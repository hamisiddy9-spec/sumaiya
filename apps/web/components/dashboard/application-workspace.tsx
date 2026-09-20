"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, FileText, Mail, Loader2, Check, Trash2, ExternalLink, Sparkles, Target, Circle, CheckCircle2 } from "lucide-react";
import { AutoTextarea } from "@/components/ui/auto-textarea";
import { Badge } from "@/components/ui/badge";
import { extractTerms, scoreTerms } from "@/lib/job-match";
import { matchTone } from "@/lib/match-ui";
import { classifyRequirements, requirementSummary, type RequirementEvidence } from "@/lib/requirement-evidence";
import { getCoverLetterForCv } from "@/lib/template-families";
import { buildCopilotState } from "@/lib/application-copilot";
import { OutcomeCheck } from "@/components/dashboard/outcome-check";

type Lang = "en" | "sw";

interface AppData {
  id: string;
  title: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  jobDescriptionUrl: string;
  status: string;
  notes: string;
  appliedAt: string | null;
  createdAt: string;
  cvId: string | null;
  coverLetterId: string | null;
}

interface Props {
  lang?: Lang;
  app: AppData;
  linkedCv: { id: string; title: string; templateId: string; primaryColor: string } | null;
  linkedCl: { id: string; title: string } | null;
  atsScore: number | null;
  /** Keyword set of the linked CV, for scoring against this job's description. */
  cvTerms: string[];
  /** M2 — the snap-time match breakdown persisted with the application (REAL parsed data). */
  snapBreakdown: { requirements: string[]; matched: string[]; missing: string[] } | null;
  myCvs: { id: string; title: string }[];
}

// Pipeline the user moves a job through, plus two terminal outcomes.
const STAGES = ["draft", "applied", "interviewing", "offer"] as const;
const LABELS: Record<string, { en: string; sw: string }> = {
  draft: { en: "Draft", sw: "Rasimu" },
  applied: { en: "Applied", sw: "Umetuma" },
  interviewing: { en: "Interviewing", sw: "Mahojiano" },
  offer: { en: "Offer", sw: "Ofa ya Kazi" },
  rejected: { en: "Rejected", sw: "Imekataliwa" },
  archived: { en: "Archived", sw: "Imewekwa Kando" },
};

function daysSince(iso: string | null): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.floor((Date.now() - t) / 86_400_000);
}

export function ApplicationWorkspace({ lang = "en", app, linkedCv, linkedCl, atsScore, cvTerms, snapBreakdown, myCvs }: Props) {
  const sw = lang === "sw";
  const router = useRouter();

  const [jobTitle, setJobTitle] = useState(app.jobTitle);
  const [companyName, setCompanyName] = useState(app.companyName);
  const [status, setStatus] = useState(app.status);
  const [jobDescription, setJobDescription] = useState(app.jobDescription);
  const [jdUrl, setJdUrl] = useState(app.jobDescriptionUrl);
  const [notes, setNotes] = useState(app.notes);
  const [cvId, setCvId] = useState(app.cvId);
  const [coverLetterId, setCoverLetterId] = useState(app.coverLetterId);
  const [clTitle, setClTitle] = useState(linkedCl?.title ?? null);

  const [savedFlash, setSavedFlash] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [generatingCl, setGeneratingCl] = useState(false);
  const [clError, setClError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const flashRef = useRef<ReturnType<typeof setTimeout>>();
  // Application Copilot: has the user started interview prep for THIS job?
  // Local marker — /interview?app=<id> is the entry; no schema change.
  const [interviewStarted, setInterviewStarted] = useState(false);
  useEffect(() => {
    try {
      setInterviewStarted(localStorage.getItem(`copilot-interview-${app.id}`) === "1");
    } catch { /* non-fatal */ }
  }, [app.id]);

  // AI-prioritized keyword match (must-have vs nice-to-have) for THIS job.
  // Upgrades the instant offline heuristic when the user asks for it.
  type AiKw = { term: string; importance: "must" | "nice" };
  const [aiKw, setAiKw] = useState<AiKw[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // Returns whether the save actually landed, so optimistic callers can roll
  // back. A failed save used to swallow its error and flash nothing — the field
  // looked saved but wasn't. Now it surfaces a "couldn't save" indicator.
  const patch = useCallback(async (body: Record<string, unknown>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSaveError(false);
        setSavedFlash(true);
        if (flashRef.current) clearTimeout(flashRef.current);
        flashRef.current = setTimeout(() => setSavedFlash(false), 1800);
        return true;
      }
      setSaveError(true);
      return false;
    } catch {
      setSaveError(true);
      return false;
    }
  }, [app.id]);

  const changeStatus = async (next: string) => {
    const prev = status;
    setStatus(next); // optimistic
    // Stamp appliedAt the first time a job is marked "applied", so the
    // follow-up clock starts from the real submit date.
    const body: Record<string, unknown> = { status: next };
    if (next === "applied" && !app.appliedAt) body.appliedAt = new Date().toISOString();
    const ok = await patch(body);
    if (!ok) setStatus(prev); // roll back so the UI never lies about the stage
  };

  const generateCoverLetter = async () => {
    if (!cvId || generatingCl) return;
    setGeneratingCl(true);
    setClError("");
    try {
      const senderTitle = jobTitle || "";
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sw ? `Barua ya ${companyName || jobTitle || "Maombi"}` : `Cover Letter — ${companyName || jobTitle || "Application"}`,
          cvId,
          // Match the cover letter to the linked CV's look (template family +
          // accent) so the pair reads as one set — only when the loaded CV is
          // still the attached one.
          ...(linkedCv && linkedCv.id === cvId
            ? {
                templateId: getCoverLetterForCv(linkedCv.templateId),
                // Only forward a valid 6-hex accent; the API rejects anything else.
                ...(/^#[0-9A-Fa-f]{6}$/.test(linkedCv.primaryColor) ? { primaryColor: linkedCv.primaryColor } : {}),
              }
            : {}),
          // Body paragraphs ONLY — the template supplies the salutation and the
          // "Sincerely, <sender>" signature (from the profile), so a greeting or
          // sign-off here would duplicate them.
          content: sw
            ? `Naandika kuonyesha nia yangu ya nafasi ya ${senderTitle}${companyName ? ` katika ${companyName}` : ""}. Nina hamu ya kujadili jinsi ujuzi na uzoefu wangu unavyolingana na mahitaji ya timu yenu.`
            : `I am writing to express my interest in the ${senderTitle} position${companyName ? ` at ${companyName}` : ""}. I look forward to discussing how my skills and experience align with your team's needs.`,
          jobTitle: senderTitle || undefined,
        }),
      });
      const json = await res.json().catch(() => ({})) as { success?: boolean; data?: { id?: string; title?: string } };
      if (json.success && json.data?.id) {
        setCoverLetterId(json.data.id);
        setClTitle(json.data.title ?? null);
        await patch({ coverLetterId: json.data.id });
        router.push(`/editor/cover-letter/${json.data.id}?fromApp=${app.id}`);
      } else {
        setClError(sw ? "Imeshindwa kutengeneza barua. Jaribu tena." : "Couldn't create the letter. Please try again.");
      }
    } catch {
      setClError(sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again.");
    } finally {
      setGeneratingCl(false);
    }
  };

  const attachCv = async (id: string) => {
    setCvId(id);
    // Only reload (to pull the new ATS score) once the attach actually saved —
    // refreshing before the PATCH landed raced the server and could show a
    // stale/blank score.
    const ok = await patch({ cvId: id });
    if (ok) router.refresh();
  };

  const deleteApp = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/applications/${app.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard?tab=applications");
        return;
      }
      setDeleteError(sw ? "Imeshindwa kufuta. Jaribu tena." : "Couldn't delete. Please try again.");
      setDeleting(false);
    } catch {
      setDeleteError(sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again.");
      setDeleting(false);
    }
  };

  const days = daysSince(app.appliedAt ?? app.createdAt);
  const needsFollowUp = status === "applied" && days >= 7;

  // Per-job match: how well the linked CV covers THIS job's description. Recomputes
  // live as the JD is edited; the score is persisted to matchScore on JD blur.
  const match = useMemo(() => {
    if (!cvId || !cvTerms.length || !jobDescription.trim()) return null;
    return scoreTerms(extractTerms(jobDescription), new Set(cvTerms));
  }, [cvId, cvTerms, jobDescription]);

  async function handleSmartMatch() {
    if (!jobDescription.trim() || aiLoading) return;
    setAiLoading(true); setAiError("");
    try {
      const res = await fetch("/api/ai/jd-keywords", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, jobTitle: jobTitle || undefined }),
      });
      const json = await res.json().catch(() => ({})) as { success?: boolean; data?: { keywords?: AiKw[] }; error?: string };
      if (!res.ok || !json.success || !json.data?.keywords?.length) {
        setAiError(json.error || (sw ? "Imeshindwa kuendesha ulinganishaji. Tunaonyesha ulinganishaji wa haraka." : "Couldn't run the smart match. Showing the quick match instead."));
      } else {
        setAiKw(json.data.keywords);
      }
    } catch {
      setAiError(sw ? "Hitilafu ya mtandao. Tunaonyesha ulinganishaji wa haraka." : "Network error. Showing the quick match instead.");
    } finally {
      setAiLoading(false);
    }
  }

  // AI-prioritized result: match the CV's terms against the AI keywords (with the
  // same fuzzy containment the editor's Job Target panel uses).
  const aiMatch = useMemo(() => {
    if (!aiKw?.length || !cvTerms.length) return null;
    const cv = new Set(cvTerms);
    const matched: string[] = [], missMust: string[] = [], missNice: string[] = [];
    for (const k of aiKw) {
      const term = k.term.toLowerCase();
      const found = cv.has(term) || [...cv].some((c) => (c.includes(term) || term.includes(c)) && Math.min(c.length, term.length) >= 4);
      if (found) matched.push(k.term);
      else (k.importance === "must" ? missMust : missNice).push(k.term);
    }
    const score = Math.round((matched.length / aiKw.length) * 100);
    return { matched, missMust, missNice, missing: [...missMust, ...missNice], score };
  }, [aiKw, cvTerms]);

  // Prefer the AI result once computed; fall back to the instant heuristic.
  const shown = aiMatch ?? match;
  const matchColor = (s: number) => matchTone(s).text;
  const matchBar = (s: number) => matchTone(s).bar;

  // M2 — per-requirement evidence from the persisted snap breakdown. Derived
  // deterministically from REAL data (requirements + matched lists the user
  // already saw at snap time) — never re-parsed, never invented.
  const snapEvidence: RequirementEvidence[] = useMemo(() => {
    if (!snapBreakdown || snapBreakdown.requirements.length === 0) return [];
    return classifyRequirements(snapBreakdown.requirements, snapBreakdown.matched);
  }, [snapBreakdown]);
  const snapSummary = requirementSummary(snapEvidence);
  const EVIDENCE_LABELS: Record<RequirementEvidence["status"], { en: string; sw: string; cls: string }> = {
    detected: { en: "Detected", sw: "Imepatikana", cls: "text-pine bg-pine-tint" },
    partial: { en: "Partial", sw: "Kiasi", cls: "text-gold-text bg-gold-tint" },
    missing: { en: "Missing", sw: "Inakosekana", cls: "text-red-700 bg-red-50" },
  };

  // Application Copilot readiness — derived from real records, never guessed.
  const copilot = buildCopilotState({
    cvAttached: !!cvId,
    coverLetterAttached: !!coverLetterId,
    interviewStarted,
    submitted: status !== "draft",
  });

  const markInterviewStarted = () => {
    setInterviewStarted(true);
    try { localStorage.setItem(`copilot-interview-${app.id}`, "1"); } catch { /* non-fatal */ }
  };

  const inputCls = "w-full px-3 py-2 text-sm bg-sand-2 border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember";
  const cardCls = "bg-card border border-border rounded-card-lg p-4";

  return (
    <div className="min-h-screen bg-sand pb-tabbar md:pb-0">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <Link href="/dashboard?tab=applications" className="inline-flex items-center gap-1.5 text-sm text-text-body hover:text-espresso transition">
            <ChevronLeft className="w-5 h-5" /> {sw ? "Maombi" : "Applications"}
          </Link>
          {saveError ? (
            <span className="text-xs text-red-600 flex items-center gap-1">
              {sw ? "Haikuhifadhiwa — angalia mtandao" : "Not saved — check your connection"}
            </span>
          ) : (
            <span className={`text-xs text-pine flex items-center gap-1 transition-opacity ${savedFlash ? "opacity-100" : "opacity-0"}`}>
              <Check className="w-3.5 h-3.5" /> {sw ? "Imehifadhiwa" : "Saved"}
            </span>
          )}
        </div>

        {/* Header: job + company */}
        <div className={`${cardCls} mb-4`}>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">{sw ? "Cheo cha kazi" : "Job title"}</label>
          <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} onBlur={() => patch({ jobTitle })}
            placeholder={sw ? "mf. Mhandisi wa Programu" : "e.g. Software Engineer"}
            className={`${inputCls} text-base font-semibold mb-3`} />
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">{sw ? "Kampuni" : "Company"}</label>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} onBlur={() => patch({ companyName })}
            placeholder={sw ? "mf. Safaricom" : "e.g. Safaricom"} className={inputCls} />
        </div>

        {/* Application Copilot — readiness checklist */}
        <div className={`${cardCls} mb-4 border-ember/30`}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-ember" />
            <span className="text-sm font-bold text-espresso">{sw ? "Copilot ya Maombi" : "Application Copilot"}</span>
            <Badge size="sm" variant={copilot.ready ? "pine" : "ember"} className="ml-auto">
              {copilot.doneCount}/{copilot.total}
            </Badge>
          </div>
          <p className="text-xs text-text-muted mb-3">
            {sw
              ? "Hatua za kukusaidia kutuma ombi bora — kila kitu katika nafasi moja."
              : "Your checklist to land this job — everything in one place."}
          </p>
          <div className="w-full h-1.5 bg-sand rounded-full overflow-hidden mb-3">
            <div className={`h-full rounded-full transition-[width] duration-500 ${copilot.ready ? "bg-pine" : "bg-ember"}`} style={{ width: `${copilot.percent}%` }} />
          </div>
          <div className="space-y-2">
            {/* CV */}
            <div className="flex items-center gap-2.5">
              {copilot.steps[0].done
                ? <CheckCircle2 className="w-4.5 h-4.5 text-pine shrink-0" />
                : <Circle className="w-4.5 h-4.5 text-text-muted shrink-0" />}
              <span className={`text-xs font-medium ${copilot.steps[0].done ? "text-text-muted line-through" : "text-espresso"}`}>
                {sw ? "CV imeambatishwa na kulengwa" : "CV attached and tailored"}
              </span>
              <span className="ml-auto">
                {cvId ? (
                  <Link href={`/editor/cv/${cvId}?fromApp=${app.id}`} className="text-[11px] font-semibold text-ember-hover hover:underline">
                    {sw ? "Fungua →" : "Open →"}
                  </Link>
                ) : (
                  <a href="#copilot-cv" className="text-[11px] font-semibold text-ember-hover hover:underline">
                    {sw ? "Ambatisha →" : "Attach →"}
                  </a>
                )}
              </span>
            </div>
            {/* Cover letter */}
            <div className="flex items-center gap-2.5">
              {copilot.steps[1].done
                ? <CheckCircle2 className="w-4.5 h-4.5 text-pine shrink-0" />
                : <Circle className="w-4.5 h-4.5 text-text-muted shrink-0" />}
              <span className={`text-xs font-medium ${copilot.steps[1].done ? "text-text-muted line-through" : "text-espresso"}`}>
                {sw ? "Barua ya maombi" : "Cover letter"}
              </span>
              <span className="ml-auto">
                {coverLetterId ? (
                  <Link href={`/editor/cover-letter/${coverLetterId}?fromApp=${app.id}`} className="text-[11px] font-semibold text-ember-hover hover:underline">
                    {sw ? "Fungua →" : "Open →"}
                  </Link>
                ) : (
                  <button onClick={generateCoverLetter} disabled={!cvId || generatingCl}
                    className="text-[11px] font-semibold text-ember-hover hover:underline disabled:opacity-50 disabled:no-underline"
                    title={!cvId ? (sw ? "Ambatisha CV kwanza" : "Attach a CV first") : undefined}>
                    {generatingCl ? (sw ? "Inatengeneza…" : "Generating…") : (sw ? "Tengeneza →" : "Generate →")}
                  </button>
                )}
              </span>
            </div>
            {/* Interview prep */}
            <div className="flex items-center gap-2.5">
              {copilot.steps[2].done
                ? <CheckCircle2 className="w-4.5 h-4.5 text-pine shrink-0" />
                : <Circle className="w-4.5 h-4.5 text-text-muted shrink-0" />}
              <span className={`text-xs font-medium ${copilot.steps[2].done ? "text-text-muted line-through" : "text-espresso"}`}>
                {sw ? "Maandalizi ya mahojiano" : "Interview prep"}
              </span>
              <span className="ml-auto">
                <Link href={`/interview?app=${app.id}`} onClick={markInterviewStarted}
                  className="text-[11px] font-semibold text-ember-hover hover:underline">
                  {copilot.steps[2].done ? (sw ? "Rudia →" : "Review →") : (sw ? "Anza →" : "Start →")}
                </Link>
              </span>
            </div>
            {/* Submit */}
            <div className="flex items-center gap-2.5">
              {copilot.steps[3].done
                ? <CheckCircle2 className="w-4.5 h-4.5 text-pine shrink-0" />
                : <Circle className="w-4.5 h-4.5 text-text-muted shrink-0" />}
              <span className={`text-xs font-medium ${copilot.steps[3].done ? "text-text-muted line-through" : "text-espresso"}`}>
                {sw ? "Tuma ombi" : "Submit application"}
              </span>
              <span className="ml-auto">
                {status === "draft" ? (
                  <button onClick={() => changeStatus("applied")}
                    className="text-[11px] font-semibold text-ember-hover hover:underline">
                    {sw ? "Tuma →" : "Submit →"}
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold text-pine">
                    <Check className="w-3.5 h-3.5 inline mr-0.5" />
                    {sw ? LABELS[status]?.sw ?? status : LABELS[status]?.en ?? status}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Status pipeline */}
        <div className={`${cardCls} mb-4`}>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2.5">{sw ? "Hatua" : "Stage"}</label>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map((s) => {
              const active = status === s;
              return (
                <button key={s} onClick={() => changeStatus(s)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-pill border transition ${active ? "bg-ember text-cream border-ember shadow-ember-hard" : "border-border-input text-text-body hover:border-ember hover:text-ember-hover"}`}>
                  {sw ? LABELS[s].sw : LABELS[s].en}
                </button>
              );
            })}
            <span className="w-px bg-border mx-1 self-stretch" />
            {(["rejected", "archived"] as const).map((s) => {
              const active = status === s;
              return (
                <button key={s} onClick={() => changeStatus(s)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-pill border transition ${active ? "bg-espresso text-cream border-espresso" : "border-border-input text-text-muted hover:text-espresso"}`}>
                  {sw ? LABELS[s].sw : LABELS[s].en}
                </button>
              );
            })}
          </div>
        </div>

        {/* Follow-up nudge */}
        {/* The get-hired feedback loop — one-tap outcome capture. */}
        <OutcomeCheck
          applicationId={app.id}
          companyName={app.companyName}
          status={status}
          appliedAt={app.appliedAt}
          createdAt={app.createdAt}
          sw={sw}
          onStageChange={setStatus}
        />

        {needsFollowUp && (
          <div className="bg-gold-tint border border-gold/30 rounded-card-lg p-4 mb-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-gold-text" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-espresso">
                {sw ? `Ulituma maombi siku ${days} zilizopita` : `You applied ${days} days ago`}
              </p>
              <p className="text-xs text-text-body mt-0.5">
                {sw ? "Ni wakati mzuri wa kufuatilia. Tuma barua pepe ya heshima kuuliza hali ya maombi yako." : "It's a good time to follow up — a short, polite email asking about your application's status often helps."}
              </p>
              <button onClick={() => changeStatus("interviewing")} className="text-xs font-semibold text-gold-text hover:underline mt-2">
                {sw ? "Nimefuatilia →" : "I've followed up →"}
              </button>
            </div>
          </div>
        )}

        {/* Per-job match — how well the linked CV fits THIS job's description */}
        {cvId && (
          shown ? (
            <div className={`${cardCls} mb-4`}>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-ember" />
                <span className="text-sm font-bold text-espresso">{sw ? "Ulinganifu na kazi hii" : "Match to this job"}</span>
                {aiMatch && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-ember-tint text-ember-hover uppercase tracking-wide">AI</span>}
                <Link href={`/editor/cv/${cvId}?fromApp=${app.id}`} className="ml-auto text-[11px] font-semibold text-ember-hover hover:underline">
                  {sw ? "Lenga CV yako →" : "Tailor my CV →"}
                </Link>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-3xl font-display font-extrabold leading-none ${matchColor(shown.score)}`}>{shown.score}%</span>
                <span className="text-xs text-text-body">
                  {sw ? `CV yako inaendana na ${shown.matched.length} kati ya vigezo ${shown.matched.length + shown.missing.length} vya kazi hii.` : `Your CV covers ${shown.matched.length} of ${shown.matched.length + shown.missing.length} keywords from this job.`}
                </span>
              </div>
              <div className="w-full h-2 bg-sand rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-[width] duration-500 ${matchBar(shown.score)}`} style={{ width: `${shown.score}%` }} />
              </div>
              {shown.missing.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    {sw ? "Vinavyokosekana kwenye CV" : "Missing from your CV"}
                    {aiMatch && aiMatch.missMust.length > 0 && (
                      <span className="ml-1.5 text-red-600 normal-case">· {aiMatch.missMust.length} {sw ? "yanayohitajika" : "required"}</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {shown.missing.slice(0, 12).map((term) => {
                      const isMust = aiMatch?.missMust.includes(term);
                      return (
                        <span key={term} className={`text-[11px] font-medium rounded-pill px-2 py-0.5 border ${isMust ? "text-red-700 bg-red-50 border-red-300" : "text-espresso bg-red-50 border-red-200/60"}`}>{term}</span>
                      );
                    })}
                    {shown.missing.length > 12 && <span className="text-[11px] text-text-muted px-1 py-0.5">+{shown.missing.length - 12}</span>}
                  </div>
                  <p className="text-[11px] text-text-muted mt-2">{sw ? "Ongeza zinazokuhusu kwa uhalisia kwenye CV yako ili kupita ATS ya kazi hii." : "Add the ones that genuinely apply to you — it's how you get past this job's ATS filter."}</p>
                </div>
              )}
              {/* M2 — per-requirement evidence from the snap (persisted, REAL data) */}
              {snapEvidence.length > 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    {sw ? "Mahitaji ya kazi — ushahidi" : "Job requirements — evidence"}
                    {snapSummary.missing + snapSummary.partial > 0 && (
                      <span className="ml-1.5 normal-case">
                        · {snapSummary.missing + snapSummary.partial} {sw ? "yanahitaji kazi" : "to strengthen"}
                      </span>
                    )}
                  </p>
                  <ul className="space-y-1.5">
                    {snapEvidence.map((ev) => {
                      const lbl = EVIDENCE_LABELS[ev.status];
                      return (
                        <li key={ev.requirement} className="flex items-start gap-2 text-xs">
                          <span className={`shrink-0 mt-px text-[10px] font-bold px-1.5 py-0.5 rounded-pill ${lbl.cls}`}>
                            {sw ? lbl.sw : lbl.en}
                          </span>
                          <span className="font-medium text-espresso leading-snug">{ev.requirement}</span>
                          {ev.missingTerms.length > 0 && (
                            <span className="text-text-muted leading-snug truncate">— {ev.missingTerms.join(", ")}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {/* Real learning resources for the concrete gaps (deterministic KB — never invented) */}
                  {snapEvidence.some((ev) => ev.resources.length > 0) && (
                    <div className="mt-2.5 rounded-input bg-gold-tint/50 border border-gold/20 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gold-text mb-1">
                        {sw ? "Njia za kujifunza (rasilimali halisi)" : "Ways to close the gap (real resources)"}
                      </p>
                      <ul className="space-y-1">
                        {snapEvidence
                          .filter((ev) => ev.resources.length > 0)
                          .slice(0, 2)
                          .flatMap((ev) =>
                            ev.resources.slice(0, 2).map((r) => ({
                              key: `${ev.requirement}-${r.url}`,
                              ev,
                              r,
                            })),
                          )
                          .slice(0, 3)
                          .map(({ key, ev, r }) => (
                            <li key={key} className="text-[11px] leading-snug">
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-ember-hover hover:text-ember font-semibold underline underline-offset-2"
                              >
                                {r.title}
                              </a>
                              <span className="text-text-muted"> · {r.provider}{r.free ? "" : " · $"} </span>
                              <span className="text-text-muted">({ev.missingTerms.slice(0, 2).join(", ")})</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-[11px] text-text-muted mt-2">
                    {sw
                      ? "Ushahidi huu unatokana na ulinganishaji halisi wa snap yako — hatujabuni chochote."
                      : "Evidence from your original snap match — nothing invented."}
                  </p>
                </div>
              )}
              {/* Upgrade the instant heuristic to an AI-prioritised match */}
              {!aiMatch && (
                <button onClick={handleSmartMatch} disabled={aiLoading}
                  className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-ember-hover hover:text-ember disabled:opacity-50 transition">
                  <Sparkles className="w-3.5 h-3.5" />
                  {aiLoading ? (sw ? "Inachambua…" : "Analyzing…") : (sw ? "Linganisha" : "Smart match")}
                </button>
              )}
              {aiError && <p className="text-[11px] text-gold-text mt-1.5">{aiError}</p>}
            </div>
          ) : jobDescription.trim() ? null : (
            <div className={`${cardCls} mb-4 border-dashed`}>
              <p className="text-xs text-text-body flex items-center gap-2">
                <Target className="w-4 h-4 text-text-muted flex-shrink-0" />
                {sw ? "Bandika maelezo ya kazi hapa chini ili uone jinsi CV yako inavyoendana na kazi hii mahususi." : "Add the job description below to see how well your CV fits this specific role."}
              </p>
            </div>
          )
        )}

        {/* Documents: CV + cover letter */}
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          {/* CV */}
          <div id="copilot-cv" className={cardCls}>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-ember" />
              <span className="text-sm font-bold text-espresso">CV</span>
              {atsScore !== null && (
                <span className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-pill ${atsScore >= 70 ? "text-pine bg-pine-tint" : atsScore >= 50 ? "text-gold-text bg-gold-tint" : "text-red-600 bg-red-50"}`}>
                  ATS {atsScore}
                </span>
              )}
            </div>
            {cvId && linkedCv ? (
              <>
                <p className="text-sm text-espresso font-medium truncate">{linkedCv.title}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link href={`/editor/cv/${cvId}?fromApp=${app.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-cream bg-ember-hover hover:bg-ember px-3 py-1.5 rounded-input transition">
                    <ExternalLink className="w-3.5 h-3.5" /> {sw ? "Fungua CV" : "Open CV"}
                  </Link>
                </div>
              </>
            ) : (
              <div>
                <p className="text-xs text-text-muted mb-2">{sw ? "Hakuna CV iliyoambatishwa." : "No CV attached yet."}</p>
                {myCvs.length > 0 ? (
                  <select onChange={(e) => e.target.value && attachCv(e.target.value)} defaultValue=""
                    className={`${inputCls} text-xs`}>
                    <option value="" disabled>{sw ? "Ambatisha CV…" : "Attach a CV…"}</option>
                    {myCvs.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                ) : (
                  <Link href="/editor/cv/new" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ember-hover hover:underline">
                    <Sparkles className="w-3.5 h-3.5" /> {sw ? "Tengeneza CV" : "Create a CV"}
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Cover letter */}
          <div className={cardCls}>
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-4 h-4 text-ember" />
              <span className="text-sm font-bold text-espresso">{sw ? "Barua ya Maombi" : "Cover Letter"}</span>
            </div>
            {coverLetterId ? (
              <>
                <p className="text-sm text-espresso font-medium truncate">{clTitle || (sw ? "Barua ya maombi" : "Cover letter")}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link href={`/editor/cover-letter/${coverLetterId}?fromApp=${app.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-cream bg-ember-hover hover:bg-ember px-3 py-1.5 rounded-input transition">
                    <ExternalLink className="w-3.5 h-3.5" /> {sw ? "Fungua" : "Open"}
                  </Link>
                </div>
              </>
            ) : (
              <div>
                <p className="text-xs text-text-muted mb-2">{sw ? "Hakuna barua ya maombi bado." : "No cover letter yet."}</p>
                <button onClick={generateCoverLetter} disabled={!cvId || generatingCl}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-ember-hover hover:underline disabled:opacity-50 disabled:no-underline"
                  title={!cvId ? (sw ? "Ambatisha CV kwanza" : "Attach a CV first") : undefined}>
                  {generatingCl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {sw ? "Tengeneza barua inayolingana" : "Generate a matching letter"}
                </button>
                {clError && <p className="text-[11px] text-red-600 mt-1.5">{clError}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Job description */}
        <div className={`${cardCls} mb-4`}>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">{sw ? "Maelezo ya kazi" : "Job description"}</label>
          <AutoTextarea value={jobDescription} onChange={(e) => { setJobDescription(e.target.value); setAiKw(null); setAiError(""); }} onBlur={() => patch({ jobDescription, matchScore: (aiMatch ?? match)?.score ?? null })}
            maxHeight={320} rows={3} placeholder={sw ? "Bandika maelezo ya kazi hapa — hutumika kulenga CV yako." : "Paste the job description here — used to tailor your CV."}
            className={`${inputCls} min-h-[72px]`} />
          <input value={jdUrl} onChange={(e) => setJdUrl(e.target.value)} onBlur={() => patch({ jobDescriptionUrl: jdUrl })}
            placeholder={sw ? "Kiungo cha tangazo la kazi (si lazima)" : "Link to the job posting (optional)"}
            className={`${inputCls} mt-2 text-xs`} />
        </div>

        {/* Notes */}
        <div className={`${cardCls} mb-4`}>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">{sw ? "Maelezo yako" : "Notes"}</label>
          <AutoTextarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => patch({ notes })}
            rows={3} placeholder={sw ? "Mtu wa kuwasiliana naye, hatua zinazofuata, tarehe za mahojiano…" : "Contact person, next steps, interview dates…"}
            className={`${inputCls} min-h-[72px]`} />
        </div>

        {/* Delete */}
        <div className="flex flex-col items-end gap-1.5">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-body">{sw ? "Una uhakika?" : "Are you sure?"}</span>
              <button onClick={deleteApp} disabled={deleting} className="inline-flex items-center gap-1.5 text-xs font-semibold text-cream bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-input transition disabled:opacity-50">
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} {sw ? "Futa" : "Delete"}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-text-muted hover:text-espresso">{sw ? "Ghairi" : "Cancel"}</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-red-600 transition">
              <Trash2 className="w-3.5 h-3.5" /> {sw ? "Futa ombi hili" : "Delete this application"}
            </button>
          )}
          {deleteError && <p className="text-[11px] text-red-600">{deleteError}</p>}
        </div>
      </div>
    </div>
  );
}
