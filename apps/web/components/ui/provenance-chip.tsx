"use client";

// ProvenanceChip — the small "where did this come from" marker the editor
// renders next to an AI-touched span (system blueprint H8). Tapping it opens
// the source detail / "revert to my words" action the parent supplies.
//
// Tone comes from lib/provenance.sourceTone():
//   neutral (sand)  the user's own words
//   info    (pine)  AI, but grounded in their facts
//   action  (ember) an unconfirmed new-fact claim — needs the user to confirm

import { Badge } from "@/components/ui/badge";
import { useLang } from "@/lib/i18n/context";
import {
  sourceLabel,
  sourceTone,
  type SourceKind,
} from "@/lib/provenance";

const TONE_TO_VARIANT = {
  neutral: "neutral",
  info: "pine",
  action: "ember",
} as const;

interface ProvenanceChipProps {
  kind: SourceKind;
  /** Open the source detail popover / trigger "revert to my words". */
  onClick?: () => void;
  className?: string;
}

export function ProvenanceChip({ kind, onClick, className }: ProvenanceChipProps) {
  const lang = useLang();
  const sw = lang === "sw";
  const label = sourceLabel(kind, sw);
  const variant = TONE_TO_VARIANT[sourceTone(kind)];

  if (!onClick) {
    return (
      <Badge variant={variant} size="sm" className={className}>
        {label}
      </Badge>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        sw ? `Chanzo: ${label}. Bofya kwa maelezo` : `Source: ${label}. Tap for detail`
      }
      className={className}
    >
      <Badge variant={variant} size="sm" interactive>
        {label}
      </Badge>
    </button>
  );
}
