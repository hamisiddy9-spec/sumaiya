"use client";

// SmartFit engine — wraps template output in an A4-fixed container.
// Uses a 3-tier compression strategy before resorting to scaling,
// so content shrinks gracefully rather than uniformly.
//
// Tier 1 (overflow ≤ 8%): reduce spacing via CSS custom props
// Tier 2 (overflow 8-22%): clamp descriptions + reduce spacing
// Tier 3 (overflow > 22%): scale (max 0.84) + show "CV too long" warning

import { useEffect, useRef, useState, createContext, useContext } from "react";

const PAGE_W = 794;
const PAGE_H = 1123;

// Context lets sections read fit state and adapt their own rendering
export interface FitContextValue {
  descriptionClamp: number;   // max lines for experience/summary descriptions
  spacingFactor: number;      // 0.7–1.0 multiplier sections can apply to gaps
}
export const FitContext = createContext<FitContextValue>({
  descriptionClamp: 4,
  spacingFactor: 1,
});
export function useFit() { return useContext(FitContext); }

function deriveState(overflowRatio: number): {
  scale: number;
  ctx: FitContextValue;
  warn: boolean;
} {
  if (overflowRatio <= 1.0) {
    return { scale: 1, ctx: { descriptionClamp: 4, spacingFactor: 1 }, warn: false };
  }
  if (overflowRatio <= 1.08) {
    // Tier 1 — tighten spacing only
    return { scale: 1, ctx: { descriptionClamp: 4, spacingFactor: 0.78 }, warn: false };
  }
  if (overflowRatio <= 1.22) {
    // Tier 2 — clamp descriptions + tighter spacing
    return { scale: 1, ctx: { descriptionClamp: 2, spacingFactor: 0.65 }, warn: false };
  }
  // Tier 3 — scale (last resort), max compression 0.84
  const scale = Math.max(0.84, PAGE_H / (overflowRatio * PAGE_H));
  return { scale, ctx: { descriptionClamp: 2, spacingFactor: 0.6 }, warn: scale < 0.88 };
}

export function AutoFitPage({ children }: { children: React.ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [fitResult, setFitResult] = useState(() => deriveState(1));

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const measure = () => {
      // Temporarily reset scale so measurement is accurate
      el.style.transform = "";
      const h = el.scrollHeight;
      const result = deriveState(h / PAGE_H);
      setFitResult(result);
      if (result.scale < 1) {
        el.style.transform = `scale(${result.scale})`;
        el.style.transformOrigin = "top left";
      }
    };

    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <FitContext.Provider value={fitResult.ctx}>
      <div style={{ width: PAGE_W, height: PAGE_H, overflow: "hidden", position: "relative" }}>
        <div ref={innerRef} style={{ width: PAGE_W }}>
          {children}
        </div>
        {fitResult.warn && (
          <div style={{
            position: "absolute", bottom: 10, right: 10,
            backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5",
            borderRadius: 6, padding: "3px 8px",
            fontSize: 8.5, color: "#DC2626", fontFamily: "system-ui, sans-serif",
            pointerEvents: "none",
          }}>
            ⚠ CV too long — remove some content
          </div>
        )}
      </div>
    </FitContext.Provider>
  );
}
