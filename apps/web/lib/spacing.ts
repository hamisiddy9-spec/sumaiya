export const spacingTiers = {
  tight: "p-2 md:p-3",
  compact: "p-3 md:p-4",
  form: "p-4 md:p-6",
  card: "p-6 md:p-8",
  section: "p-8 md:p-12 lg:p-16",
  hero: "py-16 md:py-24 lg:py-32 px-4 md:px-8",
} as const;

export const gapTiers = {
  tight: "gap-2",
  compact: "gap-3",
  normal: "gap-4",
  card: "gap-6",
  section: "gap-8 md:gap-12",
} as const;

export const marginTiers = {
  tight: "mb-2",
  compact: "mb-3",
  normal: "mb-4",
  large: "mb-6",
  xlarge: "mb-8",
  section: "mb-12 md:mb-16",
} as const;

export function getSectionPadding(variant: "hero" | "standard" | "compact"): string {
  switch (variant) {
    case "hero":
      return "py-16 md:py-24 lg:py-32 px-4 md:px-8";
    case "standard":
      return "py-12 md:py-16 px-4 md:px-8";
    case "compact":
      return "py-8 md:py-12 px-4 md:px-6";
    default:
      return "";
  }
}

export function getResponsivePadding(mobile: string, tablet: string, desktop: string): string {
  return `p-${mobile} md:p-${tablet} lg:p-${desktop}`;
}
