import { useState } from "react";

/**
 * Two-step delete confirmation. The first `trigger()` arms a confirming state;
 * a second `trigger()` within 3 s fires `onConfirm`. Auto-resets after 3 s of
 * inactivity so a half-started delete never lingers.
 */
export function useDeleteConfirm(onConfirm: () => void) {
  const [confirming, setConfirming] = useState(false);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  function trigger() {
    if (confirming) {
      if (timer) clearTimeout(timer);
      setConfirming(false);
      onConfirm();
    } else {
      setConfirming(true);
      const t = setTimeout(() => setConfirming(false), 3000);
      setTimer(t);
    }
  }

  function cancel() {
    if (timer) clearTimeout(timer);
    setConfirming(false);
  }

  return { confirming, trigger, cancel };
}
