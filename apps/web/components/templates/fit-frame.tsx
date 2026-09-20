"use client";

// FitFrame — the ONE fitting/centring mechanism for any A4 sheet (794×1123)
// shown on screen at less than full size.
//
// Why it exists: the sheet is authored at a fixed 794px so the PDF export and
// the preview are the same pixels. Displaying it smaller used to be re-derived
// at every call site — five different scale formulas, each with its own
// `transformOrigin: "top left"` and its own hand-computed wrapper box. Two
// things went wrong that way:
//
//   1. `transformOrigin: top left` INSIDE a wrapper that was not itself centred
//      pins the sheet to the container's left edge and leaves a gap on the
//      right (or, when the column is narrower than the sheet, clips it).
//   2. A wrapper whose width is not exactly `794 × scale` clips a few pixels or
//      detaches from the sheet.
//
// The rule it enforces, in one place:
//
//   box width  = 794 × scale EXACTLY  (so the sheet's scaled pixels == the box)
//   scale      = containerWidth / 794, clamped to [minScale, maxScale]
//   origin     = top left, sheet absolutely positioned at the box's 0,0
//   centring   = `margin: 0 auto` on the box, in a full-width host
//
// `margin: 0 auto` (block box) rather than flex centring on purpose: when a box
// is wider than its container, auto margins resolve to 0 and the box starts at
// the container's left edge. Flex centring instead pushes the overflow off BOTH
// sides, and the left half of an overflowing flex item cannot be reached by
// scrolling — that is how a sheet ends up half-cut with no way to see the rest.

import React, { useLayoutEffect, useRef, useState } from "react";

export const PAGE_W = 794;
export const PAGE_H = 1123;

// No floor by default, on purpose: a "minimum scale" that exceeds the container
// is just the clipping bug again — the old editor floor of 0.28 rendered a 222px
// box inside a 200px column. A thumbnail (a 137dp gallery cell) is MEANT to be
// tiny; showing the whole sheet small beats showing a magnified slice of it.
export const MIN_FIT_SCALE = 0;

/**
 * The fitting rule, as a pure function — testable without a DOM.
 *
 * @param containerW available width in CSS px
 * @param min        smallest scale allowed (legibility floor)
 * @param max        largest scale allowed (1 = the sheet's own size)
 */
export function fitScale(
  containerW: number,
  min: number = MIN_FIT_SCALE,
  max: number = 1,
): number {
  if (!Number.isFinite(containerW) || containerW <= 0) return max;
  return Math.min(max, Math.max(min, containerW / PAGE_W));
}

/** The rendered size of the box a sheet at `scale` needs. */
export function fitBox(scale: number): { width: number; height: number } {
  return { width: Math.round(PAGE_W * scale), height: Math.round(PAGE_H * scale) };
}

export interface FitFrameProps {
  children: React.ReactNode;
  /** Painted over the sheet but OUTSIDE it — e.g. the free-tier watermark, which
   *  must never end up inside the exported element. */
  overlay?: React.ReactNode;
  /** Applied to the SHEET element — this is the PDF/export capture target, so a
   *  caller that needs `id="cv-preview"` gets it here. */
  sheetId?: string;
  sheetClassName?: string;
  /** The sheet element itself (e.g. the html2canvas capture target). */
  sheetRef?: React.Ref<HTMLDivElement>;
  /** Merged onto the sheet's own styles (background, shadow, ring, font). */
  sheetStyle?: React.CSSProperties;
  /** Host (measuring) element overrides: e.g. `{ maxWidth: 380, margin: "0 auto" }`. */
  style?: React.CSSProperties;
  className?: string;
  minScale?: number;
  maxScale?: number;
}

export function FitFrame({
  children,
  overlay,
  sheetId,
  sheetClassName,
  sheetRef,
  sheetStyle,
  style,
  className,
  minScale = MIN_FIT_SCALE,
  maxScale = 1,
}: FitFrameProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(maxScale);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measure = () => {
      const w = host.clientWidth;
      if (w > 0) setScale(fitScale(w, minScale, maxScale));
    };
    measure();
    // Re-fit on rotation, a column resize, a hidden→visible tab switch (the
    // editor's Preview tab is `display:none` until opened, so the first
    // measurement is 0 and only the observer catches the real width).
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, [minScale, maxScale]);

  const box = fitBox(scale);

  return (
    <div ref={hostRef} className={className} style={{ width: "100%", ...style }}>
      <div
        style={{
          width: box.width,
          height: box.height,
          margin: "0 auto",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <div
          id={sheetId}
          ref={sheetRef}
          className={sheetClassName}
          style={{
            width: PAGE_W,
            minHeight: PAGE_H,
            transformOrigin: "top left",
            transform: scale === 1 ? undefined : `scale(${scale})`,
            position: "absolute",
            top: 0,
            left: 0,
            ...sheetStyle,
          }}
        >
          {children}
        </div>
        {overlay}
      </div>
    </div>
  );
}
