export function DashboardSkeleton() {
  const cards = Array.from({ length: 9 });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
  );
}
