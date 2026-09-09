// One source of truth for how a 0–100 match / ATS score is coloured and
// labelled across the app. Before this, the jobs feed, the Job Target panel and
// the application workspace each had their own thresholds (70 vs 75) and colours
// (ember vs pine), so the same score looked different on different screens.
//
// Bands: strong ≥ 75 (ember), partial ≥ 50 (gold), low < 50 (red). Returns
// Tailwind token classes so callers never hardcode hex.

export interface MatchTone {
  /** strong text/number colour, e.g. the big % */
  text: string;
  /** solid progress-bar fill */
  bar: string;
  /** soft tint background for a badge/pill */
  tintBg: string;
  labelEn: string;
  labelSw: string;
}

export function matchTone(score: number): MatchTone {
  if (score >= 75) return { text: "text-ember", bar: "bg-ember", tintBg: "bg-ember-tint", labelEn: "Strong", labelSw: "Nzuri" };
  if (score >= 50) return { text: "text-gold-text", bar: "bg-gold", tintBg: "bg-gold-tint", labelEn: "Partial", labelSw: "Kiasi" };
  return { text: "text-red-600", bar: "bg-red-500", tintBg: "bg-red-50", labelEn: "Low", labelSw: "Chini" };
}

export function matchLabel(score: number, sw: boolean): string {
  const t = matchTone(score);
  return sw ? t.labelSw : t.labelEn;
}
