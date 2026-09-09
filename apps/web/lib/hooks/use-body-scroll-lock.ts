import { useEffect } from "react";

/**
 * Locks page (body) scroll while `active` is true, then restores the previous
 * value. Use for any overlay that sits over a scrolling page — a modal, drawer
 * or bottom sheet — so touch-scrolling the overlay doesn't chain to and move the
 * page behind it. (Not needed inside the fixed-height editor shells, which don't
 * scroll the body.)
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}
