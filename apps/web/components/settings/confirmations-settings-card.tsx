"use client";

/**
 * Confirmations settings card — Phase 2 trust loop, Settings surface.
 * Fetches the pending needs-confirmation facts (GET /api/profile/confirmations)
 * and renders the SAME ConfirmationsCard used in the assistant; every action
 * writes through the one resolution endpoint, so confirming here is reflected
 * in the assistant and the CV editor too. Renders nothing when all clear.
 */
import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ConfirmationsCard, type PendingConfirmation } from "@/components/assistant/confirmations-card";

interface Props {
  lang: "en" | "sw";
}

export function ConfirmationsSettingsCard({ lang }: Props) {
  const sw = lang === "sw";
  const [items, setItems] = useState<PendingConfirmation[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/profile/confirmations");
      const j = (await res.json().catch(() => ({}))) as { success?: boolean; data?: PendingConfirmation[] };
      if (j.success) setItems(j.data ?? []);
      else setError(sw ? "Imeshindwa kupakia." : "Couldn't load.");
    } catch {
      setError(sw ? "Imeshindwa kupakia." : "Couldn't load.");
    }
  }, [sw]);

  useEffect(() => { void load(); }, [load]);

  if (error) return null; // quiet failure — never block Settings on this
  if (items === null) {
    return (
      <div className="rounded-card-lg border border-border bg-card p-4 flex items-center gap-2 text-sm text-text-muted">
        <Loader2 className="w-4 h-4 animate-spin" />
        {sw ? "Inaangalia taarifa zilizosubiri…" : "Checking pending facts…"}
      </div>
    );
  }
  if (items.length === 0) return null;

  return (
    <div className="rounded-card-lg border border-border bg-card p-5 space-y-3">
      <ConfirmationsCard items={items} sw={sw} onResolved={() => void load()} />
    </div>
  );
}
