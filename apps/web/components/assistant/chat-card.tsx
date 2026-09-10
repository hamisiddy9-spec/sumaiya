"use client";

// The "simple by default, deep on tap" wrapper for Sumaiya's result cards.
//
//   L1  a one-line result + the ONE action that matters (always visible)
//   L2  tap the card → it expands to the full detail
//   L3  a control inside the detail opens a fullscreen editor / customiser
//       (that's the child card's own navigation — not handled here)
//
// A user who isn't tech-savvy reads one line, taps one button, done. A curious
// user taps the card. Research (next-billion-user + AI-app onboarding): never
// dump the whole decision tree; surface it one layer at a time.

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function ChatCard({
  icon,
  tone = "neutral",
  summary,
  action,
  children,
  defaultOpen = false,
}: {
  icon: ReactNode;
  /** ember = needs attention, pine = good, neutral = info */
  tone?: "neutral" | "pine" | "ember";
  /** the one-line L1 result */
  summary: ReactNode;
  /** the single primary action shown on L1 (optional) */
  action?: { label: string; onClick: () => void; busy?: boolean };
  /** the full detail, revealed on L2 */
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const ring =
    tone === "ember" ? "border-ember/30" : tone === "pine" ? "border-pine/30" : "border-border";
  const iconWrap =
    tone === "ember" ? "bg-ember-tint text-ember" : tone === "pine" ? "bg-pine-tint text-pine" : "bg-sand-2 text-espresso";

  return (
    <div className={`bg-card border ${ring} rounded-card-lg shadow-sm overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-sand-2/40 transition"
      >
        <span className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${iconWrap}`}>
          {icon}
        </span>
        <span className="flex-1 min-w-0 text-sm text-espresso font-medium leading-snug">{summary}</span>
        <ChevronDown
          className={`w-4 h-4 text-text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {action && (
        <div className="px-3.5 pb-3.5 -mt-1">
          <button
            onClick={action.onClick}
            disabled={action.busy}
            className="w-full bg-ember text-cream font-semibold text-sm rounded-pill py-2.5 hover:bg-ember-hover disabled:opacity-60 transition"
          >
            {action.busy ? "…" : action.label}
          </button>
        </div>
      )}

      {open && <div className="border-t border-border px-3.5 py-3.5">{children}</div>}
    </div>
  );
}
