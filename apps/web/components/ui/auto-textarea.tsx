"use client";

import { forwardRef, useEffect, useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";

// useLayoutEffect warns during SSR; fall back to useEffect on the server so the
// client still gets flash-free sizing without the console noise.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** Optional pixel cap. Past it the box stops growing and scrolls internally
   *  (useful for a very long pasted job description). Omit for unbounded growth. */
  maxHeight?: number;
};

/**
 * A textarea that grows to fit its content instead of forcing the user to scroll
 * inside a fixed box. Drop-in replacement for <textarea>: keep your className,
 * value/onChange, placeholder, rows (as a min height), etc. Manual resize is
 * disabled since height is managed automatically.
 */
export const AutoTextarea = forwardRef<HTMLTextAreaElement, Props>(function AutoTextarea(
  { value, defaultValue, maxHeight, style, onInput, ...rest },
  forwardedRef,
) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  const setRefs = (el: HTMLTextAreaElement | null) => {
    innerRef.current = el;
    if (typeof forwardedRef === "function") forwardedRef(el);
    else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
  };

  const resize = () => {
    const el = innerRef.current;
    if (!el) return;
    // Reset first so shrinking works, then grow to the content height.
    el.style.height = "auto";
    const target = maxHeight ? Math.min(el.scrollHeight, maxHeight) : el.scrollHeight;
    el.style.height = `${target}px`;
    el.style.overflowY = maxHeight && el.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  // Re-fit whenever the controlled value changes (typing, AI apply, restore…).
  useIsomorphicLayoutEffect(resize, [value, defaultValue, maxHeight]);

  // Width changes (rotate, panel resize) reflow the text, so re-fit on those too.
  // Only react to WIDTH changes — our own height edits would otherwise feed the
  // observer back into an infinite resize loop.
  useIsomorphicLayoutEffect(() => {
    const el = innerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let lastWidth = el.clientWidth;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      if (w !== lastWidth) { lastWidth = w; resize(); }
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <textarea
      ref={setRefs}
      value={value}
      defaultValue={defaultValue}
      onInput={(e) => { resize(); onInput?.(e); }}
      style={{ resize: "none", ...style }}
      {...rest}
    />
  );
});
