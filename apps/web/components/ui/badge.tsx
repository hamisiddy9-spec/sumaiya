// RF1 — shared Badge primitive. One consistent pill for labels/status across
// every surface, so contrast + spacing can't drift per-page.
//
// Contrast is baked in: the ember variant renders AA-passing text
// (`text-ember-hover` #C13E14, 5.29:1 on white / 4.50:1 on the tint fill) —
// the old `bg-ember-tint text-ember` pattern was 3.59:1 (sub-AA).
// Interactive badges get the shared FOCUS_RING + a 24px minimum hit area.

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FOCUS_RING, TAP_MIN } from "@/lib/ui-tokens";

type BadgeVariant = "ember" | "pine" | "gold" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Smallest size for dense metadata rows; default is the standard label. */
  size?: "sm" | "md";
  icon?: ReactNode;
  /** Render as an interactive control (button/link) — adds focus ring + tap target. */
  interactive?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  ember: "bg-ember-tint text-ember-hover border-ember/15",
  pine: "bg-pine-tint text-pine border-pine/15",
  gold: "bg-gold-tint text-gold-text border-gold/25",
  neutral: "bg-sand text-text-body border-border",
};

const sizes = {
  sm: "text-[11px] px-2 py-0.5 gap-1",
  md: "text-xs px-3 py-1 gap-1.5",
};

export function Badge({
  variant = "ember",
  size = "md",
  icon,
  interactive = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border font-semibold",
        variants[variant],
        sizes[size],
        interactive && cn(FOCUS_RING, TAP_MIN, "cursor-pointer select-none"),
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
