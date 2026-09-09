"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Loader2, AlertCircle } from "lucide-react";

export default function VerifyPage() {
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [msgKey, setMsgKey] = useState<"signing_in" | "timeout" | "incomplete">("signing_in");
  const [sw, setSw] = useState(false);

  useEffect(() => {
    setSw(document.cookie.includes("lang=sw"));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus("error");
      setMsgKey("timeout");
    }, 10000);

    const checkRedirect = setInterval(() => {
      if (!window.location.hash.includes("access_token")) {
        clearInterval(checkRedirect);
        clearTimeout(timer);
        setTimeout(() => {
          setStatus("error");
          setMsgKey("incomplete");
        }, 2000);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      clearInterval(checkRedirect);
    };
  }, []);

  const message = sw
    ? {
        signing_in: "Inakuingiza...",
        timeout: "Kuingia kunachukua muda mrefu kuliko ilivyotarajiwa. Kiungo huenda kimeisha muda au si sahihi.",
        incomplete: "Kuingia hakikuweza kukamilika. Tafadhali jaribu tena.",
      }[msgKey]
    : {
        signing_in: "Signing you in...",
        timeout: "Sign-in is taking longer than expected. The link may have expired or is invalid.",
        incomplete: "Sign-in could not be completed. Please try again.",
      }[msgKey];

  return (
    <div className="min-h-screen bg-sand flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-ember rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-cream" />
          </div>
          <span className="font-display font-extrabold text-2xl tracking-tight text-espresso">
            Sumaiya
          </span>
        </Link>

        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-ember" />
            <span className="text-text-body">{message}</span>
          </div>
        )}

        {status === "error" && (
          <div className="bg-card border border-border rounded-card-lg p-8 shadow-card">
            <div className="w-16 h-16 bg-sand-2 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-ember" />
            </div>
            <h2 className="font-display font-extrabold text-xl tracking-tight text-espresso mb-2">
              {sw ? "Tatizo la kuingia" : "Sign-in issue"}
            </h2>
            <p className="text-text-body mb-6">{message}</p>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2 bg-ember hover:bg-ember-hover text-cream font-semibold px-6 py-3 rounded-input-lg transition"
            >
              {sw ? "Rudi kuingia" : "Back to sign-in"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
