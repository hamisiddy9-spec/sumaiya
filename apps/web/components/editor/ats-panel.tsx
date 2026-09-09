"use client";

// ATS Intelligence Panel — client-side analysis of CV structure.
// No AI calls needed: pure structural heuristics that mirror
// what applicant tracking systems actually check.

import type { CVData } from "@/types";
import { Icon } from "@/components/ui/icon";
import { useState, useEffect, useRef } from "react";
import { analyzeCv, atsScore, type AtsCheck } from "@/lib/ats-score";

interface AtsPanelProps {
  data: CVData;
  documentId?: string;
  accessToken?: string;
  lang?: "en" | "sw";
  /** Lifts the computed score to the parent (e.g. so the cross-sell banner can
   *  gate on it). Called whenever the score changes. */
  onScore?: (score: number) => void;
}

export function AtsPanel({ data, documentId, accessToken, lang = "en", onScore }: AtsPanelProps) {
  const sw = lang === "sw";
  const checks = analyzeCv(data, sw);
  const score = atsScore(checks);
  const [prevScore, setPrevScore] = useState<number | null>(null);
  const savedRef = useRef(false);

  // Surface the live score to the parent.
  useEffect(() => { onScore?.(score); }, [score, onScore]);

  // Save ATS score snapshot when documentId is provided
  useEffect(() => {
    if (!documentId || savedRef.current || !score) return;
    savedRef.current = true;

    // Fetch previous score to show improvement
    (async () => {
      try {
        const headers: Record<string, string> = {};
        if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

        const histRes = await fetch(`/api/ats-history/${documentId}`, { headers });
        const histJson = await histRes.json();
        if (histJson.success && histJson.data?.length > 0) {
          setPrevScore(histJson.data[0].score);
        }

        // Save new snapshot
        await fetch("/api/ats-history", {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId,
            documentType: "cv",
            score,
            checks: checks.map(c => ({ id: c.id, label: c.label, pass: c.pass, severity: c.severity })),
          }),
        });
      } catch {
        // Non-critical — silently fail
      }
    })();
  }, [documentId, score]);

  const statusLabel = score >= 80 ? (sw ? "Tayari" : "Ready") : score >= 55 ? (sw ? "Inahitaji Kazi" : "Needs Work") : (sw ? "Hatari Kubwa" : "High Risk");

  return (
    <div className="space-y-4">
      {/* Score card — pine bg */}
      <div className="bg-pine rounded-card p-5 text-cream">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-semibold uppercase tracking-widest opacity-80">{sw ? "Alama ya ATS" : "ATS Score"}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cream/15 text-cream">
            {statusLabel}
          </span>
        </div>
        <div className="flex items-baseline gap-1 mb-4">
          <span className="font-display text-5xl font-extrabold leading-none text-cream">{score}</span>
          <span className="font-display text-lg font-semibold opacity-60">/100</span>
          {prevScore !== null && prevScore !== score && (
            <span className={`ml-2 text-[11px] font-bold ${score > prevScore ? "text-green-400" : "text-red-400"}`}>
              {score > prevScore ? "↑" : "↓"} {Math.abs(score - prevScore)}
            </span>
          )}
        </div>
        {/* Gold progress bar */}
        <div className="w-full h-2.5 bg-cream/15 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-[550ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ width: `${score}%`, backgroundColor: "#F2A93B" }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] opacity-50">0</span>
          <span className="text-[10px] font-semibold text-gold">{score}%</span>
          <span className="text-[10px] opacity-50">100</span>
        </div>
      </div>

      {/* Check list */}
      <div className="space-y-2">
        {checks.map(c => {
          const isPass = c.severity === "pass";
          const isWarn = c.severity === "warn";
          return (
            <div key={c.id} className="flex items-start gap-2.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isPass ? "bg-pine-tint" : isWarn ? "bg-gold-tint" : "bg-red-50"
                }`}
              >
                {isPass ? (
                  <Icon name="check" className="text-pine" size={12} />
                ) : isWarn ? (
                  <span className="text-[10px] font-bold text-gold-text">!</span>
                ) : (
                  <span className="text-[10px] font-bold text-red-500">x</span>
                )}
              </div>
              <div className="min-w-0">
                <p className={`text-[11px] font-semibold leading-tight ${
                  isPass ? "text-cream" : isWarn ? "text-cream" : "text-red-300"
                }`}>
                  {c.label}
                </p>
                {!c.pass && (
                  <p className="text-[10px] text-cream/60 mt-0.5 leading-tight">{c.tip}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[9px] text-cream/40 leading-relaxed">
        {sw
          ? "Ukaguzi huu unaangalia jinsi CV yako ilivyopangwa. Jinsi inavyofanya kazi hutofautiana kila mfumo."
          : "ATS analysis is based on structural patterns. Actual compatibility varies by system."}
      </p>
    </div>
  );
}
