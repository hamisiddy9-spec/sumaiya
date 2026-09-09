"use client";

import { cn } from "@/lib/utils";

/**
 * The Sumaiya Mark — Sumaiya's own AI signature.
 *
 * Not a sparkle. Three swept blades around an open core — an aperture / bloom
 * that reads as focus, vision and motion. Used everywhere the product speaks as
 * Sumaiya (nav, the assistant, AI actions in the editor) so the assistant has
 * one recognisable identity instead of a generic star.
 *
 * States:
 *  - "idle"     slow drift + gentle breathing (the default resting state)
 *  - "thinking" continuous rotation + a pulsing core (while an AI call is out)
 *  - "static"   no motion (badges, dense lists, print)
 *
 * Honours prefers-reduced-motion automatically (see globals.css).
 */
export type SumaiyaMarkState = "idle" | "thinking" | "static";

interface Props {
  size?: number;
  state?: SumaiyaMarkState;
  /** Blade colour. Defaults to currentColor so it inherits from text. */
  color?: string;
  className?: string;
  title?: string;
}

// One blade, tip at top (12,2.6), floating clear of the centre. Rotated 3×.
const BLADE =
  "M12 2.6 C 15.1 5 15.6 8.6 13.5 10.8 C 12.7 11.7 11.3 11.7 10.5 10.8 C 8.4 8.6 8.9 5 12 2.6 Z";

export function SumaiyaMark({ size = 20, state = "idle", color = "currentColor", className, title }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn("sumaiya-mark", `sumaiya-mark--${state}`, className)}
    >
      <g className="sumaiya-mark__blades" style={{ color }}>
        <path d={BLADE} fill="currentColor" transform="rotate(0 12 12)" />
        <path d={BLADE} fill="currentColor" transform="rotate(120 12 12)" opacity={0.9} />
        <path d={BLADE} fill="currentColor" transform="rotate(240 12 12)" opacity={0.8} />
      </g>
      <circle className="sumaiya-mark__core" cx="12" cy="12" r="2.1" fill={color} />
    </svg>
  );
}
