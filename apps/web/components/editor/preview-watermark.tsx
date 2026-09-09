/**
 * Repeated diagonal watermark drawn OVER the on-screen document preview for
 * non-paying users. It must be rendered as a sibling of the element the PDF
 * exporter captures (never inside it), so a real download comes out clean while
 * a screenshot of the preview carries the mark — the standard deterrent against
 * people screenshotting the preview instead of paying for the export.
 *
 * Dormant while `active` is false. Today `isPremium` is hard-coded true (payments
 * off), so nothing shows; the moment real entitlement is wired in, free users
 * get the mark automatically.
 */
export function PreviewWatermark({ active, label = "Sumaiya" }: { active: boolean; label?: string }) {
  if (!active) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none"
    >
      <div
        className="absolute inset-[-40%] flex flex-col justify-around"
        style={{ transform: "rotate(-30deg)" }}
      >
        {Array.from({ length: 12 }).map((_, row) => (
          <div
            key={row}
            className="flex justify-around whitespace-nowrap"
            style={{
              color: "rgba(33,26,21,0.10)",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
            }}
          >
            {Array.from({ length: 6 }).map((_, col) => (
              <span key={col}>{label}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
