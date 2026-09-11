"use client";

import { useEffect } from "react";
import Link from "next/link";
import posthog from "@/lib/analytics";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    // Surface the crash to PostHog error tracking (no-op if PostHog isn't init).
    try {
      (posthog as unknown as { captureException?: (_e: unknown, _p?: unknown) => void })
        .captureException?.(error, { digest: error.digest });
    } catch {
      /* reporting must never mask the original error */
    }
  }, [error]);

  const sw = typeof document !== "undefined" && document.cookie.includes("lang=sw");

  return (
    <div className="min-h-screen bg-sand flex flex-col items-center justify-center px-4 text-center">
      <Logo className="mb-16" />

      <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
        <AlertTriangle className="w-10 h-10 text-red-400" />
      </div>

      <p className="text-sm font-semibold text-red-500 uppercase tracking-widest mb-3">
        {sw ? "Kuna hitilafu imetokea" : "Something went wrong"}
      </p>
      <h1 className="text-4xl font-display font-extrabold text-espresso mb-4">
        {sw ? "Hitilafu isiyotarajiwa" : "Unexpected error"}
      </h1>
      <p className="text-lg text-text-body max-w-md mb-10">
        {sw
          ? "Tumepata tatizo. Kazi yako imehifadhiwa moja kwa moja — jaribu kupakua upya au rudi nyumbani."
          : "We hit a snag. Your work is auto-saved — try refreshing or go back to your dashboard."}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={reset} size="lg">
          <RefreshCw className="w-4 h-4" /> {sw ? "Jaribu tena" : "Try again"}
        </Button>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 border border-border bg-white text-espresso font-semibold px-6 py-3 rounded-[10px] transition-all duration-150 hover:bg-cream hover:border-[#C6B6A5]"
        >
          {sw ? "Nenda Nyumbani" : "Go to Dashboard"}
        </Link>
      </div>

      {error.digest && (
        <p className="mt-8 text-xs text-text-muted">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
