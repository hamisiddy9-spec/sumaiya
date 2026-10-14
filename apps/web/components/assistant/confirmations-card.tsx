"use client";

/**
 * ConfirmationsCard — the Phase 2 trust-loop surface inside the assistant.
 * Sumaiya drafted facts (summary, experience descriptions) from the chat; they
 * are stamped needs-confirmation until the user says they're accurate. This
 * card lists them with Confirm / Remove per fact (plus Confirm all), and every
 * action writes through the ONE resolution endpoint (/api/profile/confirmations/resolve)
 * so a confirmation here is reflected in Settings and the CV editor too.
 */
import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";

export interface PendingConfirmation {
  key: string;
  section: string;
  entryId?: string;
  field: string;
  label: { en: string; sw: string };
  value: string;
  source: string;
  updatedAt?: string;
}

export function ConfirmationsCard({
  items,
  sw,
  onResolved,
  resolved = false,
}: {
  items: PendingConfirmation[];
  sw: boolean;
  onResolved?: (keys: string[]) => void;
  resolved?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [resolvedKeys, setResolvedKeys] = useState<string[]>([]);
  const [error, setError] = useState("");

  const remaining = items.filter((i) => !resolvedKeys.includes(i.key));

  const resolve = async (keys: string[], decision: "accept" | "reject") => {
    if (!keys.length || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/profile/confirmations/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys, decision }),
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) throw new Error(json.error || "failed");
      setResolvedKeys((k) => [...k, ...keys]);
      onResolved?.(keys);
    } catch {
      setError(sw ? "Imeshindikana — jaribu tena." : "Couldn't save — please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Fully retired by the parent (restore-time re-check found nothing pending,
  // or the user resolved everything) — show the all-done state, not a shell.
  if (resolved || (!remaining.length && resolvedKeys.length > 0)) {
    return (
      <div className="rounded-2xl border border-success/25 bg-success/10 p-4 text-sm text-success/90 flex items-start gap-2.5">
        <CheckCircle2 className="w-4.5 h-4.5 mt-0.5 shrink-0 text-success" />
        <span>{sw ? "Imethibitishwa — asante! Hakuna taarifa zilizosubiri." : "Confirmed — thank you! Nothing is waiting."}</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-warning/25 bg-warning/10 p-4 space-y-3">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4.5 h-4.5 mt-0.5 shrink-0 text-warning" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-warning/90">
            {sw ? "Niliandika hizi kutokana na mazungumzo yetu — thibitisha kila moja" : "I drafted these from our chat — confirm each is accurate"}
          </p>
          <p className="text-xs text-warning mt-0.5">
            {sw
              ? "Taarifa hizi bado hazijathibitishwa — hazitaonyeshwa kama ukweli uliothibitishwa hadi uzithibitishe."
              : "These are still tentative — they won't count as established facts until you confirm them."}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {remaining.map((item) => (
          <div key={item.key} className="rounded-xl bg-white border border-warning/25/70 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-espresso">{sw ? item.label.sw : item.label.en}</p>
            <p className="text-[12px] text-text-body leading-relaxed line-clamp-3 whitespace-pre-wrap">{item.value}</p>
            <div className="flex items-center gap-2 pt-0.5">
              <button
                onClick={() => resolve([item.key], "accept")}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-lg bg-success hover:bg-success disabled:opacity-50 text-white text-[11px] font-semibold px-2.5 py-1.5 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {sw ? "Ni sahihi" : "It's correct"}
              </button>
              <button
                onClick={() => resolve([item.key], "reject")}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-lg border border-warning/40 text-warning/90 hover:bg-warning/15 disabled:opacity-50 text-[11px] font-semibold px-2.5 py-1.5 transition"
              >
                <XCircle className="w-3.5 h-3.5" />
                {sw ? "Ondoa" : "Remove"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {remaining.length > 1 && (
        <button
          onClick={() => resolve(remaining.map((i) => i.key), "accept")}
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-warning hover:bg-warning disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 transition"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          {sw ? "Thibitisha zote" : "Confirm all"}
        </button>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
