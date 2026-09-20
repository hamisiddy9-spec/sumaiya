/**
 * Shape-accurate placeholder for the dashboard grid.
 *
 * It rendered pure grey blocks with no text and no accessibility hook — a
 * screen reader announced nothing and a sighted user saw an unexplained blank
 * page while it loaded. The `label` prop carries the words (the caller knows
 * the language: `loading.tsx` reads `x-lang`), and the placeholder itself is
 * hidden from assistive tech so only the one honest sentence is announced.
 */
export function DashboardSkeleton({ label = "Loading…" }: { label?: string }) {
  const cards = Array.from({ length: 9 });

  return (
    <div role="status" aria-live="polite" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {cards.map((_, i) => (
          <div
            key={i}
            className="rounded-card-lg border border-border bg-card overflow-hidden animate-pulse"
          >
            {/* Preview area */}
            <div className="h-48 bg-sand-2 rounded-t-card-lg" />
            {/* Footer */}
            <div className="px-3 pt-2.5 pb-2 bg-card border-t border-border h-[62px] flex flex-col justify-center gap-2">
              <div className="h-4 w-3/4 bg-sand-2 rounded" />
              <div className="h-3 w-1/2 bg-sand-2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
