"use client";

import { useEffect, useState } from "react";
import { X as XIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n/context";

/**
 * Shown when someone taps a premium template — CV template gallery and the
 * in-editor "Choose a look" picker both use this, matching the native app's
 * PremiumSheet. Billing is globally off right now (`PAYMENTS_ENABLED = false`
 * in lib/features.ts — see marketing-nav.tsx/footer.tsx, which hide the
 * /pricing link entirely), so this explains what premium is and lets someone
 * register interest, stored locally. When billing lands, this gets the real
 * CTA in one place instead of two.
 */
const WAITLIST_KEY = "sumaiya_premium_waitlist";

export function PremiumTemplateModal({ onClose }: { onClose: () => void }) {
  const sw = useLang() === "sw";
  const [onList, setOnList] = useState(false);

  useEffect(() => {
    try {
      setOnList(localStorage.getItem(WAITLIST_KEY) === "true");
    } catch {
      /* private mode etc — default false */
    }
  }, []);

  const join = () => {
    try {
      localStorage.setItem(WAITLIST_KEY, "true");
    } catch {
      /* ignore */
    }
    setOnList(true);
  };

  const bullets = sw
    ? ["Miundo ya rangi maalum · pete ya picha · mistari ya muda", "Mingine inaongezwa kila mwezi", "Kila kitu kingine kinabaki bure"]
    : ["Colour sidebar layouts · photo rings · timelines", "More coming every month", "Everything else stays free"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-card rounded-card-lg shadow-floating max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-espresso flex items-center justify-center">
            <Icon name="lock" size={18} className="text-cream" />
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-espresso p-1" aria-label={sw ? "Funga" : "Close"}>
            <XIcon size={18} />
          </button>
        </div>
        <p className="font-display font-bold text-espresso text-lg mb-1">{sw ? "Templeti ya Premium" : "A premium template"}</p>
        <p className="text-text-body text-sm mb-4">
          {sw
            ? "Malipo bado hayajaanzishwa — jiunge na orodha ya kusubiri na tutakujulisha kwanza."
            : "Billing isn't live yet — join the waitlist and you'll be first to know when it is."}
        </p>
        <ul className="space-y-1.5 mb-5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-text-body">
              <Icon name="check" size={14} className="text-ember mt-0.5 shrink-0" />
              {b}
            </li>
          ))}
        </ul>
        {onList ? (
          <div className="flex items-center gap-2 justify-center text-sm font-semibold text-ember py-2.5">
            <Icon name="check" size={16} />
            {sw ? "Upo kwenye orodha" : "You're on the list"}
          </div>
        ) : (
          <button onClick={join} className="w-full bg-ember text-cream font-semibold text-sm py-2.5 rounded-input-lg hover:bg-ember-hover transition">
            {sw ? "Jiunge na orodha ya kusubiri" : "Join the waitlist"}
          </button>
        )}
      </div>
    </div>
  );
}
