"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Scoped boundary for the document editors. A malformed saved document (bad
// jsonb shape) can throw while a template renders; this keeps the user in
// context with a clear recovery path instead of taking over the whole app.
export default function EditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Editor] render error:", error);
  }, [error]);

  const sw = typeof document !== "undefined" && document.cookie.includes("lang=sw");

  return (
    <div className="min-h-screen bg-sand flex flex-col items-center justify-center px-4 text-center">
      <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
        <AlertTriangle className="w-10 h-10 text-red-400" />
      </div>

      <p className="text-sm font-semibold text-red-500 uppercase tracking-widest mb-3">
        {sw ? "Hitilafu ya hati" : "Document error"}
      </p>
      <h1 className="text-4xl font-display font-extrabold text-espresso mb-4">
        {sw ? "Hati hii haikuweza kufunguliwa" : "This document couldn't be opened"}
      </h1>
      <p className="text-lg text-text-body max-w-md mb-10">
        {sw
          ? "Kitu ndani ya hati hii kimeshindwa kupakia. Hati zako nyingine ziko salama — jaribu tena, au rudi nyumbani."
          : "Something in this document failed to load. Your other documents are safe — try again, or head back to your dashboard."}
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
