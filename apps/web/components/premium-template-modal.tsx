"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X as XIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n/context";

/**
 * Shown when someone taps a premium template — the CV gallery and the
 * in-editor "Choose a look" picker both use this, matching the native app's
 * PremiumSheet.
 *
 * The copy here has to be TRUE, and it changed the moment the gate became real.
 * Premium is no longer a promise: `template.premium` is enforced
 * (lib/entitlements.ts), the 7 flagship designs are genuinely locked, and
 * Premium is genuinely OBTAINABLE today — referrals grant 7 days per friend who
 * builds their first CV (lib/referral.ts, PREMIUM_DAYS_PER_REFERRAL).
 *
 * So this can no longer say "join the waitlist and you'll be first to know".
 * That was accurate when nothing was gated and nothing could be earned; now it
 * would hide the one route that works, from the one screen a user reaches by
 * asking for the thing. The waitlist stays, demoted to what it actually is:
 * interest in PAYING, which is still not open.
 *
 * The waitlist flag is a local convenience only (`sumaiya_premium_waitlist`) and
 * must never be read as entitlement — see the warning in apps/native's
 * src/lib/entitlements.ts.
 */
const WAITLIST_KEY = "sumaiya_premium_waitlist";

/** Where the invite loop actually lives (the ReferralCard on the dashboard).
 *  A guest who taps this is bounced to sign-in by the (app) route guard and
 *  returns — which is the correct funnel, since earning needs an account. */
const INVITE_HREF = "/dashboard";

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
    ? [
        "Miundo 7 bora — sidebars za rangi, pete za picha, mistari ya muda, serif ya kihabari",
        "Kila kitu kingine kinabaki bure — ATS, uandishi wa CV, barua",
      ]
    : [
        "The 7 flagship designs — colour sidebars, photo rings, timelines, editorial serif",
        "Everything else stays free — the ATS check, CV writing, cover letters",
      ];

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
            ? "Hii ni mojawapo ya miundo 7 ya Premium. Malipo bado hayajafunguliwa — lakini huna haja ya kusubiri: Premium inapatikana kwa kualika marafiki, siku 7 kila rafiki anayejenga CV yake ya kwanza."
            : "This is one of the 7 Premium designs. Paying isn't open yet — but you don't have to wait for it: Premium is earned by inviting friends, 7 days each time one of them builds their first CV."}
        </p>
        <ul className="space-y-1.5 mb-5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-text-body">
              <Icon name="check" size={14} className="text-ember mt-0.5 shrink-0" />
              {b}
            </li>
          ))}
        </ul>

        {/* The route that works TODAY. */}
        <Link
          href={INVITE_HREF}
          onClick={onClose}
          className="w-full inline-flex items-center justify-center gap-2 bg-ember text-cream font-semibold text-sm py-2.5 rounded-input-lg hover:bg-ember-hover transition"
        >
          {sw ? "Pata Premium bure kwa kualika marafiki" : "Earn Premium free by inviting friends"}
        </Link>

        {/* And what is honestly still pending. */}
        <div className="mt-3 text-center">
          {onList ? (
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-ember">
              <Icon name="check" size={13} />
              {sw ? "Tutakujulisha malipo yanapofunguliwa" : "We'll tell you when paying opens"}
            </p>
          ) : (
            <button onClick={join} className="text-xs font-semibold text-text-muted hover:text-espresso underline underline-offset-2 transition">
              {sw ? "Au nijulishe malipo yanapofunguliwa" : "Or notify me when paying opens"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
