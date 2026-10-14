import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "dark" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
}

const base =
  "inline-flex items-center justify-center gap-1.5 font-semibold rounded-[10px] transition-all duration-150 btn-press focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";

const variants = {
  // bg-ember-hover (was bg-ember #DA4A1C) — cream text on #C2410C is 4.88:1
  // (AA); on #DA4A1C it was 3.89:1. Hue unchanged, one step darker.
  // Focus: DOUBLE ring — 2px cream (#FBF9F5, 4.88:1 vs the ember fill) hugs
  // the button edge, 4px ember (#DA4A1C, 7:1 vs the white page) shows OUTSIDE
  // the button. A single cream ring was invisible where it sat on the white
  // page; a single ember ring was invisible against the ember fill.
  // NOTE: focus ring classes are declared per-variant (not in base) because
  // CSS source order decides which --tw-shadow wins — the ember ring sorts
  // AFTER the arbitrary cream ring in Tailwind's output and would override it
  // on primary buttons.
  primary:
    "bg-ember-hover text-cream shadow-ember-hard hover:bg-ember active:shadow-ember-active active:translate-y-[2px] focus-visible:shadow-[0_0_0_2px_#FBF9F5,0_0_0_4px_#DA4A1C] focus-visible:border-cream",
  secondary:
    "bg-white text-espresso border border-border-input hover:border-[#C6B6A5] hover:bg-cream focus-visible:shadow-focus-ember focus-visible:border-ember",
  dark:
    "bg-espresso text-cream hover:bg-espresso-2 active:bg-espresso-line focus-visible:shadow-[0_0_0_2px_#FBF9F5,0_0_0_4px_#DA4A1C] focus-visible:border-cream",
  ghost:
    "bg-transparent text-text-body hover:text-espresso hover:bg-sand focus-visible:shadow-focus-ember focus-visible:border-ember",
};

const sizes = {
  sm: "text-xs px-3 py-1.5 rounded-lg",
  md: "text-sm px-4 py-2.5 rounded-[10px]",
  lg: "text-[15px] px-6 py-3 rounded-[12px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, href, disabled, ...props }, ref) => {
    const classes = cn(base, variants[variant], sizes[size], className);
    // When an href is given, render a real anchor so it actually navigates
    // (previously href was spread onto a <button> and silently did nothing).
    if (href) {
      return (
        <a
          href={disabled ? undefined : href}
          aria-disabled={disabled || undefined}
          className={classes}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      );
    }
    return (
      <button ref={ref} disabled={disabled} className={classes} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
