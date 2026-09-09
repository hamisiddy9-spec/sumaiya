export const breakpoints = {
  xs: 360,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export const responsiveGrid = {
  mobileOnly: "grid-cols-1",
  mobileTablet: "grid-cols-1 md:grid-cols-2",
  mobileTabletDesktop: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  mobileDesktopLg: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  responsiveCard: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
} as const;

export const responsiveText = {
  mobileDesktop: "text-sm md:text-base",
  mobileTabletDesktop: "text-sm md:text-base lg:text-lg",
  heroSmall: "text-2xl md:text-4xl lg:text-5xl",
  heroLarge: "text-3xl md:text-5xl lg:text-7xl",
} as const;

export const responsivePadding = {
  sectionMobileDesktop: "px-4 py-8 md:px-8 md:py-12",
  containerMobileDesktop: "px-4 md:px-6 lg:px-8",
  heroMobileDesktop: "px-4 py-16 md:px-8 md:py-24 lg:py-32",
} as const;

export const maxWidthContainers = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  full: "max-w-full",
} as const;

export function useResponsive(breakpoint: keyof typeof breakpoints): boolean {
  if (typeof window === "undefined") return false;
  const size = breakpoints[breakpoint];
  return window.innerWidth >= size;
}
