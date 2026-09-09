interface SkeletonProps {
  variant?: "text" | "card" | "circle" | "rectangle";
  lines?: number;
  className?: string;
}

export function Skeleton({ variant = "text", lines = 1, className = "" }: SkeletonProps) {
  if (variant === "text") {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`h-4 bg-gradient-to-r from-border via-sand-2 to-border dark:from-border dark:via-espresso_line dark:to-border rounded animate-skeleton-shimmer ${
              i === lines - 1 ? "w-3/4" : "w-full"
            }`}
          />
        ))}
      </div>
    );
  }

  if (variant === "circle") {
    return (
      <div className={`w-12 h-12 bg-gradient-to-r from-border via-sand-2 to-border dark:from-border dark:via-espresso_line dark:to-border rounded-full animate-skeleton-shimmer ${className}`} />
    );
  }

  if (variant === "rectangle") {
    return (
      <div className={`h-24 bg-gradient-to-r from-border via-sand-2 to-border dark:from-border dark:via-espresso_line dark:to-border rounded-lg animate-skeleton-shimmer ${className}`} />
    );
  }

  return (
    <div className={`h-32 w-full bg-gradient-to-r from-border via-sand-2 to-border dark:from-border dark:via-espresso_line dark:to-border rounded-lg animate-skeleton-shimmer ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-card dark:bg-card rounded-lg p-6 border border-border dark:border-border space-y-4">
      <Skeleton variant="circle" className="!mb-4" />
      <Skeleton lines={2} />
      <Skeleton variant="rectangle" className="h-12" />
    </div>
  );
}

export function GridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
