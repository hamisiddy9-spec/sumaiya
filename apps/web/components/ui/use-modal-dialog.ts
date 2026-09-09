"use client";
import { useEffect, useRef } from "react";

/**
 * Modal-dialog a11y: Escape-to-close + Tab focus trap + focus management.
 *
 * Attach a ref to the dialog panel (the element carrying `role="dialog"`,
 * which should also get `aria-modal="true"` and `tabIndex={-1}`) and call this
 * hook with the open state + onClose. While open:
 *   - Escape closes the dialog
 *   - Tab/Shift+Tab cycle inside the dialog (focus never escapes to the page)
 *   - focus moves INTO the dialog on open, and returns to the trigger on close
 *   - background scroll is locked
 */
export function useModalDialog(
  open: boolean,
  onClose: () => void,
  containerRef: React.RefObject<HTMLElement | null>,
) {
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const el = containerRef.current;
    el?.focus?.({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !el) return;
      const focusables = el.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previousFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open, onClose, containerRef]);
}
