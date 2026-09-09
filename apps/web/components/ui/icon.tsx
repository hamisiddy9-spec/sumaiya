import { cn } from "@/lib/utils";
import { SumaiyaMark } from "@/components/ui/sumaiya-mark";

/** Icon names mapped from the Sumaiya design system. */
export type IconName =
  | "cv" | "mail" | "card" | "letter"
  | "user" | "work" | "edu" | "bolt"
  | "spark" | "target" | "grid" | "gear"
  | "flame" | "search" | "menu" | "download"
  | "globe" | "star" | "check" | "chevron-down"
  | "chevron-right" | "plus" | "text" | "shapes"
  | "image" | "upload" | "undo" | "redo"
  | "layers" | "magic" | "share" | "copy"
  | "trash" | "lock" | "align" | "folder"
  | "badge" | "heart" | "fit" | "comment"
  | "qr" | "swap" | "list" | "clock"
  | "bell" | "globe-lang" | "pdf" | "cursor"
  | "wifi-off" | "briefcase" | "map-pin" | "phone"
  | "alert-triangle" | "x" | "github" | "alert-circle" | "external-link"
  | "mic"

const ICONS: Record<IconName, string> = {
  cv: `<rect x="4" y="3" width="16" height="18" rx="2.5"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/>`,
  mail: `<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7 L12 13 L20.5 7"/>`,
  card: `<rect x="3" y="5" width="18" height="14" rx="2.5"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="7" y1="15" x2="12" y2="15"/>`,
  letter: `<path d="M6 3 h9 l4 4 v14 a1 1 0 0 1 -1 1 H6 a1 1 0 0 1 -1 -1 V4 a1 1 0 0 1 1 -1 Z"/><path d="M15 3 v4 h4"/><line x1="8.5" y1="13" x2="15.5" y2="13"/><line x1="8.5" y1="16.5" x2="13" y2="16.5"/>`,
  user: `<circle cx="12" cy="8" r="3.5"/><path d="M5 20 c0-3.9 3.1-6.5 7-6.5 s7 2.6 7 6.5"/>`,
  work: `<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.5 7 V5.5 a1.5 1.5 0 0 1 1.5-1.5 h4 a1.5 1.5 0 0 1 1.5 1.5 V7"/><line x1="3" y1="12.5" x2="21" y2="12.5"/>`,
  edu: `<path d="M12 4 L22 9 L12 14 L2 9 Z"/><path d="M6 11 v4.5 c0 1.4 2.7 2.5 6 2.5 s6-1.1 6-2.5 V11"/>`,
  bolt: `<path d="M13 3 L5 13 h5 l-1 8 8-10 h-5 Z"/>`,
  spark: `<path d="M12 3 c0.6 4.2 2.8 6.4 7 7 c-4.2 0.6-6.4 2.8-7 7 c-0.6-4.2-2.8-6.4-7-7 c4.2-0.6 6.4-2.8 7-7 Z"/>`,
  target: `<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none"/>`,
  grid: `<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>`,
  gear: `<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5 v2.5 M12 19 v2.5 M2.5 12 h2.5 M19 12 h2.5 M5.2 5.2 l1.8 1.8 M17 17 l1.8 1.8 M18.8 5.2 l-1.8 1.8 M7 17 l-1.8 1.8"/>`,
  flame: `<path d="M12 3 c3 3 5 5.5 5 9 a5 5 0 0 1 -10 0 c0-2 1-3.5 2.5-5 c0.3 1.5 1 2.2 2 2.5 c-0.5-3 0-5 0.5-6.5 Z"/>`,
  search: `<circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="20" y2="20"/>`,
  menu: `<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>`,
  download: `<path d="M12 3 v11 M7.5 10 L12 14.5 L16.5 10 M5 19 h14"/>`,
  globe: `<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12 h17 M12 3.5 c2.5 2.5 2.5 14.5 0 17 c-2.5-2.5-2.5-14.5 0-17"/>`,
  star: `<path d="M12 3.5 l2.6 5.3 5.9 0.8 -4.3 4.1 1 5.8 -5.2-2.7 -5.2 2.7 1-5.8 -4.3-4.1 5.9-0.8 Z"/>`,
  check: `<path d="M4.5 12.5 L9.5 17.5 L19.5 6.5"/>`,
  "chevron-down": `<path d="M6 9.5 L12 15.5 L18 9.5"/>`,
  "chevron-right": `<path d="M9.5 6 L15.5 12 L9.5 18"/>`,
  plus: `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
  text: `<path d="M5 6 V4.5 h14 V6 M12 4.5 V19.5 M9 19.5 h6"/>`,
  shapes: `<rect x="3.5" y="12" width="8" height="8" rx="1.5"/><circle cx="16" cy="8" r="4.5"/>`,
  image: `<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="M4 17 L9.5 12 L14 15.5 L17 13 L20.5 16.5"/>`,
  upload: `<path d="M12 15 V4 M7.5 8.5 L12 4 L16.5 8.5 M4.5 15 v3.5 a1 1 0 0 0 1 1 h13 a1 1 0 0 0 1-1 V15"/>`,
  undo: `<path d="M8 8 H15.5 a4.5 4.5 0 0 1 0 9 H8 M8 8 L11.5 4.5 M8 8 L11.5 11.5"/>`,
  redo: `<path d="M16 8 H8.5 a4.5 4.5 0 0 0 0 9 H16 M16 8 L12.5 4.5 M16 8 L12.5 11.5"/>`,
  layers: `<path d="M12 3.5 L21 8 L12 12.5 L3 8 Z"/><path d="M4 12 L12 16 L20 12 M4 16 L12 20 L20 16"/>`,
  magic: `<path d="M5 19 L15 9 M14 6 L15 4 L16 6 L18 7 L16 8 L15 10 L14 8 L12 7 Z"/><path d="M19.5 13 l0.6 1.4 1.4 0.6 -1.4 0.6 -0.6 1.4 -0.6-1.4 -1.4-0.6 1.4-0.6 Z"/>`,
  share: `<circle cx="6" cy="12" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="M8.2 10.8 L14.8 7.2 M8.2 13.2 L14.8 16.8"/>`,
  mic: `<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11 a6 6 0 0 0 12 0 M12 17 v4 M9 21 h6"/>`,
  copy: `<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8 V6 a2 2 0 0 0-2-2 H6 a2 2 0 0 0-2 2 v8 a2 2 0 0 0 2 2 h2"/>`,
  trash: `<path d="M4.5 7 h15 M9 7 V5 a1 1 0 0 1 1-1 h4 a1 1 0 0 1 1 1 v2 M6.5 7 l1 12 a1 1 0 0 0 1 1 h7 a1 1 0 0 0 1-1 l1-12"/>`,
  lock: `<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5 V7.5 a4 4 0 0 1 8 0 v3"/>`,
  align: `<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="15" y2="12"/><line x1="4" y1="18" x2="18" y2="18"/>`,
  folder: `<path d="M3.5 6.5 a1.5 1.5 0 0 1 1.5-1.5 h4 l2 2.5 h7 a1.5 1.5 0 0 1 1.5 1.5 v8.5 a1.5 1.5 0 0 1-1.5 1.5 H5 a1.5 1.5 0 0 1-1.5-1.5 Z"/>`,
  badge: `<path d="M12 3 l2.5 1.8 3-0.3 1 2.9 2.5 1.6 -1 2.9 1 2.9 -2.5 1.6 -1 2.9 -3-0.3 L12 21 l-2.5-1.8 -3 0.3 -1-2.9 L3 12.6 l1-2.9 -1-2.9 2.5-1.6 1-2.9 3 0.3 Z"/><path d="M9 12 l2 2 4-4.5"/>`,
  heart: `<path d="M12 20 C5 15 3.5 10.5 3.5 8 A4.2 4.2 0 0 1 12 6 A4.2 4.2 0 0 1 20.5 8 C20.5 10.5 19 15 12 20 Z"/>`,
  fit: `<path d="M4 9 V5 a1 1 0 0 1 1-1 h4 M20 9 V5 a1 1 0 0 0-1-1 h-4 M4 15 v4 a1 1 0 0 0 1 1 h4 M20 15 v4 a1 1 0 0 0 1 1 h-4"/>`,
  comment: `<path d="M4.5 5.5 h15 a1.5 1.5 0 0 1 1.5 1.5 v8 a1.5 1.5 0 0 1-1.5 1.5 H10 l-4 3.5 V16.5 H4.5 A1.5 1.5 0 0 1 3 15 V7 A1.5 1.5 0 0 1 4.5 5.5 Z"/>`,
  qr: `<rect x="3.5" y="3.5" width="6" height="6" rx="1"/><rect x="14.5" y="3.5" width="6" height="6" rx="1"/><rect x="3.5" y="14.5" width="6" height="6" rx="1"/><path d="M14.5 14.5 h3 v3 M20.5 14.5 v6 M17.5 20.5 h3 M14.5 20.5 v-0.01"/>`,
  swap: `<path d="M4 8 h13 M13 4 L17 8 L13 12 M20 16 H7 M11 20 L7 16 L11 12"/>`,
  list: `<path d="M8 6 h12 M8 12 h12 M8 18 h12"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/>`,
  clock: `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5 V12 L15 14"/>`,
  bell: `<path d="M6 10 a6 6 0 0 1 12 0 c0 5 2 6 2 6 H4 s2-1 2-6 Z"/><path d="M10 20 a2 2 0 0 0 4 0"/>`,
  "globe-lang": `<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12 h17 M12 3.5 c2.5 2.5 2.5 14.5 0 17 c-2.5-2.5-2.5-14.5 0-17"/>`,
  pdf: `<path d="M6 3 h9 l4 4 v14 a1 1 0 0 1-1 1 H6 a1 1 0 0 1-1-1 V4 a1 1 0 0 1 1-1 Z"/><path d="M15 3 v4 h4"/><path d="M8 17.5 v-4 h1.5 a1.2 1.2 0 0 1 0 2.4 H8 M13 17.5 v-4 h1.2 a1.4 1.4 0 0 1 0 4 Z"/>`,
  cursor: `<path d="M5 3 L13.5 20 L15.5 13 L21 11 Z"/>`,
  "wifi-off": `<path d="M4 8.5 a13 13 0 0 1 5-3 M20 8.5 a13 13 0 0 0-4.5-2.9 M7 12 a8 8 0 0 1 3-2 M17 12 a8 8 0 0 0-2.5-1.6 M9.5 15.5 a4 4 0 0 1 5 0 M12 19 v.01"/>`,
  "alert-triangle": `<path d="M12 4 L21 19.5 H3 Z"/><line x1="12" y1="10" x2="12" y2="15"/><circle cx="12" cy="17.5" r="0.4" fill="currentColor" stroke="none"/>`,
  briefcase: `<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.5 7 V5.5 a1.5 1.5 0 0 1 1.5-1.5 h4 a1.5 1.5 0 0 1 1.5 1.5 V7"/><line x1="3" y1="12.5" x2="21" y2="12.5"/>`,
  "map-pin": `<path d="M12 3 c3.3 0 6 2.7 6 6 0 4-6 10-6 10S6 13 6 9c0-3.3 2.7-6 6-6Z"/><circle cx="12" cy="9" r="2" fill="currentColor" stroke="none"/>`,
  phone: `<path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.9 19.9 0 0 1 3.1 4.2 2 2 0 0 1 5.1 2h3a2 2 0 0 1 2 1.7c.3 1.3.8 2.5 1.5 3.6a2 2 0 0 1-.4 2.3l-1.3 1.3a16 16 0 0 0 6.4 6.4l1.3-1.3a2 2 0 0 1 2.3-.4c1.1.7 2.3 1.2 3.6 1.5a2 2 0 0 1 1.7 2Z"/>`,
  x: `<line x1="5" y1="5" x2="19" y2="19"/><line x1="5" y1="19" x2="19" y2="5"/>`,
  github: `<path d="M12 2 c5.5 0 10 4.5 10 10 0 4.4-2.9 8.1-6.8 9.4 -0.5 0.1 -0.7 -0.2 -0.7 -0.5 v-1.8 c0-0.6 -0.2-1 -0.5 -1.2 1.7 -0.2 3.5 -0.8 3.5 -3.7 0 -0.8 -0.3 -1.5 -0.8 -2 0.1 -0.2 0.3 -1 -0.1 -2 -0.6 -0.2 -2 0.6 -2 0.6 -0.6 -0.2 -1.3 -0.3 -2 -0.3 -0.7 0 -1.4 0.1 -2 0.3 0 0 -1.4 -0.8 -2 -0.6 -0.4 1 -0.2 1.8 -0.1 2 -0.5 0.5 -0.8 1.2 -0.8 2 0 2.9 1.8 3.5 3.5 3.7 -0.2 0.2 -0.4 0.6 -0.5 1.1 -0.4 0.2 -1.5 0.5 -2.2 0.5 -0.7 0 -1.2 -0.2 -1.3 -0.5 -0.1 -0.3 0.5 -1 1.2 -1.3 0.7 -0.3 1.5 -0.1 1.6 0 0.3 0.5 1.1 0.8 2 0.8 1.3 0 2.3 -0.1 2.3 -0.1 0 0.3 0 1.1 0 1.6 0 0.3 -0.2 0.6 -0.7 0.5 C19.9 20.1 22 16.4 22 12 c0 -5.5 -4.5 -10 -10 -10 Z"/>`,
  "alert-circle": `<circle cx="12" cy="12" r="8.5"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="15.5" r="0.4" fill="currentColor" stroke="none"/>`,
  "external-link": `<path d="M18 13 v4 a2 2 0 0 1 -2 2 H5 a2 2 0 0 1 -2 -2 V9 a2 2 0 0 1 2 -2 h4 M15 3 h6 v6 M10 14 L21 3"/>`,
};

interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
}

export function Icon({ name, className, size = 24 }: IconProps) {
  // The AI signal routes through Sumaiya's own mark, not a generic star.
  // Static here; use <SumaiyaMark state="idle|thinking"> directly for motion.
  if (name === "spark") return <SumaiyaMark size={size} state="static" className={cn("shrink-0", className)} />;

  const pathData = ICONS[name];
  if (!pathData) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={name === "pdf" ? 1.3 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: pathData }}
    />
  );
}
