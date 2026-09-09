"use client";

/**
 * TrackUpdateCard — Phase 2 (E) application lifecycle inside the assistant.
 * A preview of an application status change (e.g. applied → interviewing,
 * → offer/rejected) that the user confirms before it writes, via the SAME
 * PATCH /api/applications/:id the dashboard tracker uses.
 */
import { useState } from "react";
import { Loader2, Briefcase } from "lucide-react";

const STATUS_LABELS: Record<string, { en: string; sw: string }> = {
  draft: { en: "Draft", sw: "Rasimu" },
  applied: { en: "Applied", sw: "Umetuma" },
  interviewing: { en: "Interviewing", sw: "Mahojiano" },
  offer: { en: "Offer", sw: "Ofa" },
  rejected: { en: "Rejected", sw: "Imekataliwa" },
  archived: { en: "Archived", sw: "Imehifadhiwa" },
};

export function TrackUpdateCard({
  title,
  currentStatus,
  nextStatus,
  sw,
  onConfirm,
}: {
  title?: string;
  currentStatus?: string;
  nextStatus: string;
  sw: boolean;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const label = STATUS_LABELS[nextStatus] ?? { en: nextStatus, sw: nextStatus };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
      <div className="flex items-start gap-2.5">
        <Briefcase className="w-4.5 h-4.5 mt-0.5 shrink-0 text-ember" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-espresso">{title || (sw ? "Ombi lako" : "Your application")}</p>
          <p className="text-[12px] text-text-body mt-0.5">
            {sw
              ? `${currentStatus ? `${STATUS_LABELS[currentStatus]?.sw ?? currentStatus} → ` : ""}${label.sw}`
              : `${currentStatus ? `${STATUS_LABELS[currentStatus]?.en ?? currentStatus} → ` : ""}${label.en}`}
          </p>
        </div>
      </div>
      <button
        onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }}
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-ember hover:bg-ember-hover disabled:opacity-50 text-cream text-xs font-semibold px-3 py-2 transition"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
        {sw ? `Weka: ${label.sw}` : `Set: ${label.en}`}
      </button>
    </div>
  );
}
