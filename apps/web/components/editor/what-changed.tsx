"use client";

// "What changed" — the diff view for an AI rewrite (blueprint H8). The user
// always sees exactly which words the AI added and which of theirs it dropped,
// before they apply anything.

import { useMemo, useState } from "react";
import { wordDiff, changeRatio } from "@/lib/text-diff";
import { sourceLabel, sourceTone } from "@/lib/provenance";

const TONE_CLS: Record<ReturnType<typeof sourceTone>, string> = {
  neutral: "bg-sand-2 text-text-body border-border",
  info: "bg-pine-tint text-pine border-pine/30",
  action: "bg-ember-tint text-ember-hover border-ember/30",
};

interface Props {
  before: string;
  after: string;
  sw: boolean;
  /** true when this was the local heuristic tidy, not an AI rewrite */
  isLocal?: boolean;
  /** true when the evidence engine flagged an unbacked claim in `after` */
  needsConfirm?: boolean;
}

export function WhatChanged({ before, after, sw, isLocal, needsConfirm }: Props) {
  const [showRemoved, setShowRemoved] = useState(true);
  const parts = useMemo(() => wordDiff(before, after), [before, after]);
  const ratio = useMemo(() => changeRatio(parts), [parts]);

  const kind = isLocal ? "user_written" : needsConfirm ? "ai_suggested" : "ai_tightened";
  const label = sourceLabel(kind, sw);
  const toneCls = TONE_CLS[sourceTone(kind)];

  const summary = isLocal
    ? sw
      ? "Usafi mdogo wa maandishi — hakuna maneno mapya yaliyoongezwa."
      : "Light tidy-up — no new wording added."
    : ratio < 0.25
      ? sw
        ? "Maneno yako mengi yamebaki — mabadiliko madogo tu."
        : "Mostly your words — small edits only."
      : ratio < 0.6
        ? sw
          ? "Maneno yako yameandikwa upya yawe wazi zaidi."
          : "Your wording, rewritten for clarity."
        : sw
          ? "Uandishi mpya kwa kiasi kikubwa — kagua kwa makini."
          : "A substantial rewrite — read it closely.";

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-glow">
          {sw ? "Kimebadilika nini" : "What changed"}
        </p>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${toneCls}`}>
          {label}
        </span>
        {before.trim() && after.trim() && (
          <button
            type="button"
            onClick={() => setShowRemoved((v) => !v)}
            className="ml-auto text-[10px] text-text-muted hover:text-espresso underline decoration-dotted"
          >
            {showRemoved
              ? sw ? "Ficha yaliyoondolewa" : "Hide removed"
              : sw ? "Onyesha yaliyoondolewa" : "Show removed"}
          </button>
        )}
      </div>

      <div className="text-xs leading-relaxed text-espresso bg-ember-tint/20 border border-ember/20 rounded-input px-3 py-2 whitespace-pre-wrap">
        {parts.map((p, i) => {
          if (p.type === "same") return <span key={i}>{p.text}</span>;
          if (p.type === "add")
            return (
              <span key={i} className="bg-pine/15 text-pine rounded-[3px] px-[1px]">
                {p.text}
              </span>
            );
          if (!showRemoved) return null;
          return (
            <span key={i} className="text-text-muted line-through decoration-ember/50">
              {p.text}
            </span>
          );
        })}
      </div>

      <p className="text-[11px] text-text-muted mt-1.5">{summary}</p>
      {needsConfirm && (
        <p className="text-[11px] text-ember-hover mt-1">
          {sw
            ? "Sehemu moja au zaidi ina dai ambalo halijathibitishwa kutoka CV yako — hakikisha ni kweli kabla ya kutumia."
            : "One or more parts make a claim that isn't backed by your CV — check it's true before applying."}
        </p>
      )}
    </div>
  );
}
