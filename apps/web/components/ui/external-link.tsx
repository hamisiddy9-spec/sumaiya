"use client";

import { useState } from "react";
import { advertLinkLabel, leaveWarning } from "@/lib/external-link";

/**
 * A link that leaves Sumaiya, with the consent step native already has
 * (`apps/native/src/lib/external-link.ts`).
 *
 * It stays a real anchor — the href is on the element, so middle-click,
 * right-click and "copy link" keep working, and a user with JavaScript off
 * still reaches the employer's site. The first plain click is intercepted and
 * only opens the browser after the user confirms, which is the one behaviour
 * the job cards were missing.
 *
 * `data-external-leaving` marks the armed link so a test can assert the guard
 * is present on every external hand-off in this file's consumers.
 */
export function ExternalLink({
  href,
  sw,
  className,
  children,
}: {
  href: string;
  sw: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);
  const copy = leaveWarning(sw);

  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Modified clicks (new tab, download, …) are the user asking for a browser
    // action explicitly — warning them would be noise.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (!confirming) {
      event.preventDefault();
      setConfirming(true);
    }
  };

  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        data-external-leaving="true"
        className={className}
        aria-haspopup="dialog"
      >
        {children ?? advertLinkLabel(sw)}
      </a>
      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={copy.title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-sm rounded-card bg-card p-5 shadow-floating">
            <p className="text-sm font-bold text-espresso mb-1.5">{copy.title}</p>
            <p className="text-xs text-text-body leading-relaxed mb-4">{copy.body}</p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="text-xs font-semibold px-3 py-2 rounded-input text-text-body hover:bg-sand transition"
              >
                {copy.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  // `href` is re-opened by the browser through the same anchor
                  // the user clicked: we only gate the FIRST click.
                  window.open(href, "_blank", "noopener,noreferrer");
                }}
                className="text-xs font-semibold px-3 py-2 rounded-input bg-ember text-cream hover:bg-ember-hover transition"
              >
                {copy.continueLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
