import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

// One blade, tip at top, floating clear of the centre — rotated 3× on 120°.
// Shared geometry with components/ui/sumaiya-mark.tsx (the animated variant);
// this is the static lockup used in nav, footer, auth and email.
const BLADE =
  "M12 2.6 C 15.1 5 15.6 8.6 13.5 10.8 C 12.7 11.7 11.3 11.7 10.5 10.8 C 8.4 8.6 8.9 5 12 2.6 Z";

/** The Sumaiya mark: three swept blades around an open core — reads as a spark,
 *  a compass rose, and a person with arms open. Source of truth for the favicon
 *  is public/icon.svg — keep them in sync. */
function Mark({ px }: { px: number }) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      role="img"
      aria-label="Sumaiya"
      className="shrink-0"
    >
      <g fill="#DA4A1C">
        <path d={BLADE} transform="rotate(0 12 12)" />
        <path d={BLADE} transform="rotate(120 12 12)" opacity={0.9} />
        <path d={BLADE} transform="rotate(240 12 12)" opacity={0.8} />
      </g>
      <circle cx="12" cy="12" r="2.1" fill="#FAF5EE" />
    </svg>
  );
}

export function Logo({ className, showWordmark = true, size = "md" }: LogoProps) {
  const box = { sm: 22, md: 30, lg: 40, xl: 48 }[size];
  const textSize = { sm: "text-sm", md: "text-[17px]", lg: "text-2xl", xl: "text-[28px]" }[size];
  const gap = { sm: "gap-2", md: "gap-2.5", lg: "gap-3", xl: "gap-3" }[size];

  return (
    <Link href="/" className={cn("inline-flex items-center", gap, className)}>
      <Mark px={box} />
      {showWordmark && (
        <span
          // color via `currentColor` so a dark-panel parent can override it
          // with `text-cream` (or `[&_span]:!text-cream`); defaults to espresso.
          className={cn("font-display font-extrabold tracking-tight text-espresso leading-none", textSize)}
          style={{ letterSpacing: "-0.4px" }}
        >
          Sumaiya
        </span>
      )}
    </Link>
  );
}
