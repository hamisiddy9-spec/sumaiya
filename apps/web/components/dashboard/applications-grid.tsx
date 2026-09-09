"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import { needsFollowUp, daysWaiting, legalStatusTargets } from "@/lib/applications";
import { Icon } from "@/components/ui/icon";
import { AutoTextarea } from "@/components/ui/auto-textarea";
import { CreateEntryButton } from "@/components/editor/create-entry-options";
import type { Application } from "@/lib/db/schema";
import { label } from "@/lib/i18n/labels";
import { riseClass } from "@/lib/motion";

interface Props {
  lang?: "en" | "sw";
}

const STATUS_LABELS: Record<string, { en: string; sw: string; color: string }> = {
  draft:       { en: "Draft",       sw: "Rasimu",      color: "text-text-muted bg-sand" },
  applied:     { en: "Applied",     sw: "Umetuma",     color: "text-pine bg-pine-tint" },
  interviewing:{ en: "Interviewing",sw: "Mahojiano",   color: "text-gold-text bg-gold-tint" },
  offer:       { en: "Offer",       sw: "Ofa ya Kazi", color: "text-ember-hover bg-ember-tint" },
  rejected:    { en: "Rejected",    sw: "Imekataliwa", color: "text-red-600 bg-red-50" },
  archived:    { en: "Archived",    sw: "Imewekwa Kando", color: "text-text-muted bg-sand-2" },
};

export function ApplicationsGrid({ lang = "en" }: Props) {
  const sw = lang === "sw";
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Application | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    fetchApplications();
  }, []);

  // Deep-link: /dashboard?tab=applications&edit=<id> opens that application for
  // editing (used by "Track this application" so it lands ready to fill in).
  useEffect(() => {
    if (applications.length === 0) return;
    const editId = new URLSearchParams(window.location.search).get("edit");
    if (!editId) return;
    const found = applications.find(a => a.id === editId);
    if (found) {
      setEditing(found);
      router.replace("/dashboard?tab=applications", { scroll: false });
    }
  }, [applications, router]);

  async function fetchApplications() {
    setLoadError(false);
    try {
      const res = await fetch("/api/applications");
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setApplications(json.data);
      } else {
        // A failed request must not masquerade as "No Applications Yet" — that
        // sent people off to re-create applications they already had.
        setLoadError(true);
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  // Add an application manually (so job-search tracking works without going
  // through a CV). Creates an "applied" draft and opens the edit modal to fill in.
  async function createApp() {
    if (saving) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: sw ? "Ombi Jipya" : "New Application", status: "applied" }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setApplications(cur => [json.data, ...cur]);
        setEditing(json.data);
      } else {
        setErrorMsg(sw ? "Imeshindwa kuongeza ombi. Jaribu tena." : "Couldn't add the application. Please try again.");
      }
    } catch {
      setErrorMsg(sw ? "Hitilafu ya mtandao." : "Network error.");
    } finally {
      setSaving(false);
    }
  }

  // Move an application through its pipeline. Optimistic — roll back on failure.
  async function updateStatus(id: string, status: string) {
    const prev = applications;
    setErrorMsg(null);
    setApplications(cur => cur.map(a => (a.id === id ? { ...a, status: status as Application["status"] } : a)));
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json().catch(() => ({}));
      // On failure the dropdown snaps back — say why, so a slow-network revert
      // doesn't look like a random glitch.
      if (!res.ok || !json.success) {
        setApplications(prev);
        setErrorMsg(sw ? "Imeshindwa kubadilisha hali. Jaribu tena." : "Couldn't update the status. Please try again.");
      }
    } catch {
      setApplications(prev);
      setErrorMsg(sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again.");
    }
  }

  // Save the edited details (company, job title, applied date, notes, status).
  async function saveEdit(patch: Record<string, unknown>) {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/applications/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setApplications(cur => cur.map(a => (a.id === editing.id ? { ...a, ...json.data } : a)));
        setEditing(null);
      } else {
        setErrorMsg(sw ? "Imeshindwa kuhifadhi. Jaribu tena." : "Couldn't save. Please try again.");
      }
    } catch {
      // keep the modal open so the user can retry
      setErrorMsg(sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteApp(id: string) {
    const prev = applications;
    setApplications(cur => cur.filter(a => a.id !== id));
    setEditing(null);
    try {
      const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
      if (!res.ok) { setApplications(prev); setErrorMsg(sw ? "Imeshindwa kufuta. Jaribu tena." : "Couldn't delete. Please try again."); }
    } catch {
      setApplications(prev);
      setErrorMsg(sw ? "Imeshindwa kufuta. Jaribu tena." : "Couldn't delete. Please try again.");
    }
  }

  const filtered = filter === "all"
    ? applications
    : filter === "followup"
      ? applications.filter(needsFollowUp)
      : applications.filter(a => a.status === filter);

  const statusCounts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const followUpCount = applications.filter(needsFollowUp).length;

  if (loading) {
    return (
      <div className="space-y-4" role="status" aria-live="polite">
        {/* Filter pills skeleton */}
        <div className="flex flex-wrap items-center gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 w-16 rounded-pill bg-sand-2 motion-safe:animate-pulse" />
          ))}
          <div className="ml-auto h-6 w-14 rounded-pill bg-sand-2 motion-safe:animate-pulse" />
        </div>
        {/* Application cards skeleton — mirrors the real sm:grid-cols-2 layout */}
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-card p-4 shadow-card motion-safe:animate-pulse">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-sand-2 rounded" />
                  <div className="h-3 w-1/2 bg-sand-2 rounded" />
                </div>
                <div className="h-5 w-16 rounded-pill bg-sand-2" />
              </div>
              <div className="h-3 w-1/3 bg-sand-2 rounded mb-3" />
              <div className="flex items-center gap-3">
                <div className="h-3 w-12 bg-sand-2 rounded" />
                <div className="h-3 w-10 bg-sand-2 rounded" />
                <div className="h-3 w-8 bg-sand-2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loadError && applications.length === 0) {
    return (
      <div className="border-2 border-dashed border-border rounded-card-lg p-12 text-center bg-card">
        <Icon name="briefcase" size={40} className="text-text-muted mx-auto mb-3" />
        <h3 className="text-base font-semibold text-espresso mb-1">
          {sw ? "Imeshindwa kupakia maombi" : "Couldn't load your applications"}
        </h3>
        <p className="text-sm text-text-body mb-5">
          {sw ? "Angalia mtandao wako kisha jaribu tena." : "Check your connection and try again."}
        </p>
        <button
          onClick={() => { setLoading(true); fetchApplications(); }}
          className="inline-flex items-center gap-2 bg-ember text-cream font-semibold px-5 py-2.5 rounded-[10px] transition text-sm shadow-ember-hard active:shadow-ember-active active:translate-y-[2px]"
        >
          {sw ? "Jaribu tena" : "Try again"}
        </button>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="border-2 border-dashed border-border rounded-card-lg p-12 text-center bg-card">
        <Icon name="briefcase" size={40} className="text-text-muted mx-auto mb-3" />
        <h3 className="text-base font-semibold text-espresso mb-1">
          {lang === "sw" ? "Hakuna Maombi" : "No Applications Yet"}
        </h3>
        <p className="text-sm text-text-body mb-5">
          {lang === "sw"
            ? "Ongeza ombi wewe mwenyewe, au anza kutoka CV yako."
            : "Add an application yourself, or start from a CV."}
        </p>
        <div className="flex items-center justify-center gap-2.5 flex-wrap">
          <button
            onClick={createApp}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-ember text-cream font-semibold px-5 py-2.5 rounded-[10px] transition text-sm shadow-ember-hard active:shadow-ember-active active:translate-y-[2px] disabled:opacity-60"
          >
            <Icon name="plus" size={14} />
            {lang === "sw" ? "Ongeza ombi" : "Add application"}
          </button>
          <CreateEntryButton
            docType="cv"
            lang={lang}
            as="div"
            className="inline-flex items-center gap-2 bg-card border border-border text-espresso font-semibold px-5 py-2.5 rounded-[10px] transition text-sm hover:border-text-muted"
          >
            <Icon name="cv" size={14} />
            {lang === "sw" ? "Anza kutoka CV" : "Start from a CV"}
          </CreateEntryButton>
        </div>
        {errorMsg && <p className="text-xs text-red-600 mt-3">{errorMsg}</p>}
      </div>
    );
  }

  return (
    <>
    <AnimatePresence>
      {editing && (
        <EditApplicationModal
          key={editing.id}
          app={editing}
          sw={sw}
          saving={saving}
          onSave={saveEdit}
          onDelete={deleteApp}
          onClose={() => setEditing(null)}
        />
      )}
    </AnimatePresence>
    <div className="space-y-4">
      {errorMsg && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-100 rounded-card px-4 py-2.5">
          <p className="text-sm text-red-600">{errorMsg}</p>
          <button onClick={() => setErrorMsg(null)} aria-label={sw ? "Funga" : "Dismiss"} className="text-red-400 hover:text-red-600 transition p-1.5 -m-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 focus-visible:ring-offset-1"><X className="w-4 h-4" /></button>
        </div>
      )}
      {/* Status filter pills + add */}
      <div className="flex flex-wrap items-center gap-1.5">
        {[
          { key: "all", label: lang === "sw" ? "Zote" : "All", count: applications.length },
          ...(followUpCount > 0 ? [{ key: "followup", label: lang === "sw" ? "Fuatilia" : "Follow up", count: followUpCount }] : []),
          { key: "applied", label: lang === "sw" ? "Umetuma" : "Applied", count: statusCounts["applied"] ?? 0 },
          { key: "interviewing", label: lang === "sw" ? "Mahojiano" : "Interviewing", count: statusCounts["interviewing"] ?? 0 },
          { key: "offer", label: lang === "sw" ? "Ofa" : "Offer", count: statusCounts["offer"] ?? 0 },
          { key: "draft", label: lang === "sw" ? "Rasimu" : "Draft", count: statusCounts["draft"] ?? 0 },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-pill transition ${
              filter === s.key
                ? "bg-ember text-cream"
                : "bg-sand text-text-muted hover:bg-sand-2"
            }`}
          >
            {s.label} {s.count > 0 && <span className="opacity-60">({s.count})</span>}
          </button>
        ))}
        <button
          onClick={createApp}
          disabled={saving}
          className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-pill bg-espresso text-cream hover:bg-espresso-2 transition disabled:opacity-60"
        >
          <Icon name="plus" size={12} />
          {lang === "sw" ? "Ongeza" : "Add"}
        </button>
      </div>

      {/* Application cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-sm text-text-muted">
          {lang === "sw" ? "Hakuna maombi katika kichujio hiki" : "No applications in this filter"}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((app, i) => {
            const status = STATUS_LABELS[app.status] ?? STATUS_LABELS.draft;
            return (
              <div
                key={app.id}
                className={`${riseClass(i)} bg-card border border-border rounded-card p-4 shadow-card hover:shadow-card-hover transition`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <Link href={`/applications/${app.id}`} className="min-w-0 flex-1 group">
                    <p className="text-sm font-bold text-espresso truncate group-hover:text-ember transition">{app.title}</p>
                    {app.companyName && (
                      <p className="text-[11px] text-text-body truncate">{app.companyName}</p>
                    )}
                  </Link>
                  <select
                    value={app.status}
                    onChange={(e) => updateStatus(app.id, e.target.value)}
                    aria-label={lang === "sw" ? "Hali ya ombi" : "Application status"}
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-pill whitespace-nowrap border-0 cursor-pointer focus:outline-none focus:ring-[3px] focus:ring-ember-tint ${status.color}`}
                  >
                    {/* Only legal transitions are offered — terminal statuses
                        can't be reversed (mirrors the server's validation). */}
                    {legalStatusTargets(app.status).map((key) => {
                      const v = STATUS_LABELS[key];
                      return <option key={key} value={key}>{lang === "sw" ? v.sw : v.en}</option>;
                    })}
                  </select>
                </div>

                {app.jobTitle && (
                  <p className="text-[10px] text-text-muted mb-2">{app.jobTitle}</p>
                )}

                <div className="flex items-center gap-3 text-[10px] text-text-muted">
                  {app.matchScore !== null && (
                    <span className="font-semibold">
                      {lang === "sw" ? "Ulinganifu" : "Match"}: <span className={app.matchScore >= 70 ? "text-pine" : app.matchScore >= 50 ? "text-gold-text" : "text-red-600"}>{app.matchScore}%</span>
                    </span>
                  )}
                  {app.cvId && <span>CV ✓</span>}
                  {app.coverLetterId && <span>CL ✓</span>}
                </div>

                {app.appliedAt && (
                  <p className="text-[11px] text-text-muted mt-1.5">
                    {lang === "sw" ? "Umetuma" : "Applied"}: {new Date(app.appliedAt).toLocaleDateString()}
                  </p>
                )}

                {/* Derived nudge: a still-open application that's gone quiet for
                    a week is where a polite follow-up helps. */}
                {needsFollowUp(app) && (
                  <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-gold-text bg-gold-tint px-2 py-0.5 rounded-pill">
                    {lang === "sw" ? `Fuatilia · siku ${daysWaiting(app)}` : `Follow up · ${daysWaiting(app)}d`}
                  </span>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border">
                  {app.cvId && (
                    <Link
                      href={`/editor/cv/${app.cvId}`}
                      className="text-[11px] font-medium text-ember-hover hover:underline"
                    >
                      {lang === "sw" ? "CV" : "Open CV"} →
                    </Link>
                  )}
                  {app.coverLetterId && (
                    <Link
                      href={`/editor/cover-letter/${app.coverLetterId}`}
                      className="text-[11px] font-medium text-ember-hover hover:underline"
                    >
                      {lang === "sw" ? "Barua ya Maombi" : "Cover Letter"} →
                    </Link>
                  )}
                  {app.cvId && (
                    <Link
                      href={`/interview?cv=${app.cvId}&app=${app.id}`}
                      className="text-[11px] font-medium text-pine hover:underline"
                    >
                      {lang === "sw" ? "Jizoeze mahojiano" : "Practice interview"} →
                    </Link>
                  )}
                  <Link
                    href={`/applications/${app.id}`}
                    className="text-[11px] font-semibold text-ember-hover hover:underline ml-auto"
                  >
                    {sw ? "Fungua" : "Open"} →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </>
  );
}

function EditApplicationModal({ app, sw, saving, onSave, onDelete, onClose }: {
  app: Application;
  sw: boolean;
  saving: boolean;
  onSave: (patch: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [jobTitle, setJobTitle] = useState(app.jobTitle ?? "");
  const [companyName, setCompanyName] = useState(app.companyName ?? "");
  const [status, setStatus] = useState(app.status);
  const [appliedAt, setAppliedAt] = useState(app.appliedAt ? new Date(app.appliedAt).toISOString().slice(0, 10) : "");
  const [notes, setNotes] = useState(app.notes ?? "");
  const [confirmDel, setConfirmDel] = useState(false);

  // The modal is only mounted while open, so lock page scroll for its lifetime.
  useBodyScrollLock(true);

  // Escape closes the modal (expected dialog behaviour on desktop/keyboard).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const inputCls = "w-full rounded-input-lg border border-border-input bg-sand-2 px-3 py-2 text-sm text-espresso placeholder:text-text-muted focus:outline-none focus:ring-[3px] focus:ring-ember-tint focus:border-ember transition";

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
    >
      <button aria-label={label(sw, "close")} className="absolute inset-0 bg-espresso/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto overscroll-contain bg-card rounded-t-card-lg sm:rounded-card-lg border border-border shadow-floating p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-5"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-espresso">{sw ? "Hariri ombi" : "Edit application"}</h3>
          <button onClick={onClose} aria-label={label(sw, "close")} className="text-text-muted hover:text-espresso transition"><X className="w-[18px] h-[18px]" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-text-body mb-1">{sw ? "Cheo cha kazi" : "Job title"}</label>
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder={sw ? "mf. Meneja wa Mauzo" : "e.g. Sales Manager"} className={inputCls} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-text-body mb-1">{sw ? "Kampuni" : "Company"}</label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={sw ? "mf. Zuri Fintech" : "e.g. Zuri Fintech"} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-text-body mb-1">{sw ? "Hali" : "Status"}</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as Application["status"])} className={inputCls}>
                {legalStatusTargets(status).map((k) => {
                  const v = STATUS_LABELS[k];
                  return <option key={k} value={k}>{sw ? v.sw : v.en}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-body mb-1">{sw ? "Tarehe ya kutuma" : "Applied on"}</label>
              <input type="date" value={appliedAt} onChange={(e) => setAppliedAt(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-text-body mb-1">{sw ? "Maelezo" : "Notes"}</label>
            <AutoTextarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={sw ? "Mtu wa kuwasiliana naye, hatua zinazofuata..." : "Contact person, next steps, reminders…"} className={`${inputCls} min-h-[64px]`} />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-5">
          <button
            onClick={() => onSave({
              jobTitle, companyName, status, notes,
              appliedAt: appliedAt || undefined,
              title: jobTitle ? `${jobTitle}${companyName ? ` @ ${companyName}` : ""}` : app.title,
            })}
            disabled={saving}
            className="flex-1 bg-ember text-cream text-sm font-semibold py-2.5 rounded-input-lg shadow-ember-hard active:shadow-ember-active active:translate-y-[2px] hover:bg-ember-hover disabled:opacity-60 transition"
          >
            {saving ? (sw ? "Inahifadhi…" : "Saving…") : (sw ? "Hifadhi" : "Save")}
          </button>
          {confirmDel ? (
            <button onClick={() => onDelete(app.id)} disabled={saving} className="px-3 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-input-lg disabled:opacity-60 transition">
              {sw ? "Hakika?" : "Sure?"}
            </button>
          ) : (
            <button onClick={() => setConfirmDel(true)} disabled={saving} aria-label={sw ? "Futa" : "Delete"} className="p-2.5 text-red-600 hover:bg-red-50 rounded-input-lg disabled:opacity-60 transition">
              <Icon name="trash" size={18} />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
