/**
 * Route-transition indicator. Rendered by Next.js `loading.tsx` the instant a
 * navigation starts and torn down when the segment is ready.
 *
 * Deliberately NOT a skeleton: most routes here are statically prerendered and
 * arrive in tens of milliseconds, so a layout-shaped skeleton just flashes a
 * wrong-looking page ("blocks that aren't the real page") before the real one.
 * A thin indeterminate bar signals "loading" without pretending to know the
 * destination's shape. Shape-accurate skeletons still live on the few genuinely
 * slow, known-shape routes (dashboard, the editor, the public CV page).
 *
 * Honours prefers-reduced-motion (the bar holds static instead of sweeping).
 */
export function RouteProgress({ label }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" aria-label={label ?? "Loading"}>
      <div className="route-progress" aria-hidden="true">
        <div className="route-progress__bar" />
      </div>
      {label ? <span className="sr-only">{label}</span> : null}
    </div>
  );
}
