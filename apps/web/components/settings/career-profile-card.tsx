"use client";

import { useState, useCallback, useEffect } from "react";
import { Sparkles, Loader2, Check, Briefcase } from "lucide-react";
import { profileSectionCounts } from "@/lib/career-profile/mapper";

// Career Profile card — Task 1 (source of truth, architecture only).
// Shows what career facts the profile holds and offers the opt-in backfill
// bridge from the user's most complete CV. No branding, no new AI path.

interface Props {
  lang: "en" | "sw";
}

const STRINGS = {
  en: {
    title: "Career Profile",
    hint: "One verified profile — the source of truth your CVs are built from.",
    backfill: "Build from my most complete CV",
    backfilling: "Building…",
    interview: "Start Career Interview",
    done: "Profile updated — filled: ",
    empty: "No career profile yet. Build one from your most complete CV.",
    noneFilled: "nothing new (profile already complete)",
    noCv: "No CV found to build from yet.",
    loading: "Loading…",
    sections: {
      experience: "Experience",
      education: "Education",
      skills: "Skills",
      certifications: "Certifications",
      languages: "Languages",
      projects: "Projects",
      achievements: "Achievements",
      volunteer: "Volunteering",
      references: "References",
    },
    error: "Couldn't load your career profile.",
    entries: "entries",
  },
  sw: {
    title: "Wasifu wa Kazi",
    hint: "Wasifu mmoja uliothibitishwa — chanzo cha kweli ambacho CV zako hujengwa kutoka.",
    backfill: "Jenga kutoka CV yako kamili zaidi",
    backfilling: "Inajenga…",
    interview: "Anza Mahojiano ya Kazi",
    done: "Wasifu umesasishwa — umejazwa: ",
    empty: "Hakuna wasifu wa kazi bado. Jenga kutoka CV yako kamili zaidi.",
    noneFilled: "hakuna kitu kipya (wasifu tayari umekamilika)",
    noCv: "Hakuna CV ya kujengea bado.",
    loading: "Ninapakia…",
    sections: {
      experience: "Uzoefu",
      education: "Elimu",
      skills: "Ujuzi",
      certifications: "Vyeti",
      languages: "Lugha",
      projects: "Miradi",
      achievements: "Mafanikio",
      volunteer: "Kujitolea",
      references: "Wadhamini",
    },
    error: "Sikuweza kupakia wasifu wako wa kazi.",
    entries: "vitu",
  },
} as const;

export function CareerProfileCard({ lang }: Props) {
  const s = STRINGS[lang];
  const [counts, setCounts] = useState<Array<{ key: string; count: number }> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [doneMsg, setDoneMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profile");
      const j = await res.json();
      if (j.success && j.data) {
        const cp = j.data.careerProfile ?? j.data.career_profile ?? null;
        setCounts(profileSectionCounts(cp));
      } else {
        setCounts([]);
      }
    } catch {
      setError(s.error);
    } finally {
      setLoading(false);
    }
  }, [s.error]);

  useEffect(() => { void load(); }, [load]);

  const handleBackfill = async () => {
    setBusy(true);
    setError("");
    setDoneMsg("");
    try {
      const res = await fetch("/api/profile/backfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await res.json();
      if (j.success) {
        const filled = (j.backfilled?.filled ?? []) as string[];
        const cp = j.data?.careerProfile ?? null;
        setCounts(profileSectionCounts(cp));
        setDoneMsg(
          filled.length
            ? `${s.done}${filled.join(", ")}`
            : s.noneFilled,
        );
      } else if (j.error === "No CV found to backfill from") {
        setError(s.noCv);
      } else {
        setError(j.error ?? s.error);
      }
    } catch {
      setError(s.error);
    } finally {
      setBusy(false);
    }
  };

  const sectionLabel = (key: string): string =>
    (s.sections as Record<string, string>)[key] ?? key;

  return (
    <div className="border-t border-border pt-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-espresso">
        <Briefcase className="w-4 h-4 text-text-muted" /> {s.title}
      </h2>
      <p className="text-xs text-text-muted mt-0.5 mb-4">{s.hint}</p>

      {loading ? (
        <p className="text-xs text-text-muted animate-pulse">{s.loading}</p>
      ) : error && counts === null ? (
        <p className="text-xs text-red-600 swap-in">{s.error}</p>
      ) : (
        <div className="space-y-3 swap-in">
          {counts && counts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {counts.map((c) => (
                <span
                  key={c.key}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-espresso bg-sand-2 border border-border-input rounded-full px-2.5 py-1"
                >
                  <Check className="w-3 h-3 text-pine" />
                  {sectionLabel(c.key)}: {c.count}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted">{s.empty}</p>
          )}

          <button
            type="button"
            onClick={handleBackfill}
            disabled={busy}
            className="inline-flex items-center gap-2 text-xs font-semibold text-ember-hover hover:text-ember/80 underline decoration-ember/40 hover:decoration-ember/80 underline-offset-2 transition disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {busy ? s.backfilling : s.backfill}
          </button>

          <a
            href="/career-interview"
            className="inline-flex items-center gap-2 text-xs font-semibold text-pine hover:text-pine/80 underline decoration-pine/40 hover:decoration-pine/80 underline-offset-2 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {s.interview}
          </a>

          {doneMsg && (
            <p className="text-xs text-emerald-700 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> {doneMsg}
            </p>
          )}
          {error && counts !== null && (
            <p className="text-xs text-red-600">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
