"use client";

import { useRef, useState, useLayoutEffect } from "react";

/**
 * Renders fixed-size document artwork (designed at designW×designH) scaled to
 * exactly fill whatever width its container gets — so previews sit correctly in
 * any grid cell on any screen size instead of a hard-coded pixel width.
 */
export function ScaledPreview({
  designW,
  designH,
  className,
  children,
}: {
  designW: number;
  designH: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / designW);
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, [designW]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ width: "100%", aspectRatio: `${designW} / ${designH}`, position: "relative", overflow: "hidden" }}
    >
      <div
        style={{
          width: designW,
          height: designH,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          visibility: scale ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
