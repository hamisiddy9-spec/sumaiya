"use client";

import { useCallback, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n/translations";
import type { PlanId } from "@/lib/payments/plans";

type Status = "idle" | "submitting" | "pending" | "success" | "error";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120_000;

function formatTzs(amount: number): string {
  return `TSh ${new Intl.NumberFormat("en-US").format(amount)}`;
}

export function CheckoutForm({
  lang,
  plan,
  planLabel,
  priceTzs,
  days,
}: {
  lang: Lang;
  plan: PlanId;
  planLabel: string;
  priceTzs: number;
  days: number;
}) {
  const sw = lang === "sw";
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const poll = useCallback(
    (reference: string, deadline: number) => {
      pollTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/payments/status/${encodeURIComponent(reference)}`);
          const body = await res.json().catch(() => null);
          const state = body?.data?.status as string | undefined;
          if (state === "completed") {
            window.location.href = "/checkout/success";
            return;
          }
          if (state === "failed") {
            setStatus("error");
            setMessage(sw ? "Malipo hayakukamilika. Jaribu tena." : "The payment didn't go through. Please try again.");
            return;
          }
        } catch {
          /* transient — keep polling until the deadline */
        }
        if (Date.now() < deadline) {
          poll(reference, deadline);
        } else {
          setStatus("error");
          setMessage(
            sw
              ? "Hatujapata uthibitisho bado. Ukiwa umelipa, Premium yako itawaka punde — angalia tena baadaye."
              : "We haven't had confirmation yet. If you paid, your Premium will activate shortly — check back in a moment.",
          );
        }
      }, POLL_INTERVAL_MS);
    },
    [sw],
  );

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (status === "submitting" || status === "pending") return;
      setStatus("submitting");
      setMessage("");
      try {
        const res = await fetch("/api/payments/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, phone }),
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          setStatus("error");
          setMessage(body?.error ?? (sw ? "Hitilafu imetokea. Jaribu tena." : "Something went wrong. Please try again."));
          return;
        }
        const reference = body?.data?.reference as string | undefined;
        if (!reference) {
          setStatus("error");
          setMessage(sw ? "Hitilafu imetokea. Jaribu tena." : "Something went wrong. Please try again.");
          return;
        }
        setStatus("pending");
        poll(reference, Date.now() + POLL_TIMEOUT_MS);
      } catch {
        setStatus("error");
        setMessage(sw ? "Imeshindikana kuunganisha. Angalia mtandao wako." : "Couldn't connect. Check your connection and try again.");
      }
    },
    [plan, phone, status, sw, poll],
  );

  if (status === "pending") {
    return (
      <div className="rounded-2xl bg-white border border-black/5 p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-espresso/20 border-t-espresso" />
        <h2 className="font-display font-bold text-lg text-espresso mb-1">
          {sw ? "Angalia simu yako" : "Check your phone"}
        </h2>
        <p className="text-text-muted text-sm">
          {sw
            ? "Tumetuma ombi la malipo. Weka PIN yako kuthibitisha, kisha subiri hapa."
            : "We've sent a payment prompt. Enter your PIN to approve, then wait here."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white border border-black/5 p-6 shadow-sm">
      <div className="flex items-baseline justify-between mb-5">
        <span className="font-display font-bold text-espresso">{planLabel}</span>
        <span className="font-display font-extrabold text-xl text-espresso">
          {formatTzs(priceTzs)}
          <span className="text-text-muted text-sm font-normal">
            {sw ? ` / siku ${days}` : ` / ${days} days`}
          </span>
        </span>
      </div>

      <label htmlFor="phone" className="block text-sm font-semibold text-espresso mb-1.5">
        {sw ? "Namba ya simu" : "Phone number"}
      </label>
      <input
        id="phone"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="0712 345 678"
        className="w-full rounded-xl border border-black/10 px-4 py-3 text-espresso focus:outline-none focus:ring-2 focus:ring-espresso/30"
      />

      {status === "error" && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting" || phone.trim().length < 9}
        className="mt-5 w-full rounded-xl bg-espresso px-4 py-3 font-semibold text-cream transition-opacity disabled:opacity-50"
      >
        {status === "submitting"
          ? sw ? "Ninatuma…" : "Sending…"
          : sw ? `Lipa ${formatTzs(priceTzs)}` : `Pay ${formatTzs(priceTzs)}`}
      </button>

      <p className="mt-3 text-center text-xs text-text-muted">
        {sw
          ? "Malipo salama kwa njia ya simu. Hakuna kadi inayohitajika."
          : "Secure mobile-money payment. No card required."}
      </p>
    </form>
  );
}
