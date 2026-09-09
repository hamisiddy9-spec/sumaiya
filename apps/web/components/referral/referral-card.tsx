"use client";

// The invite card — word-of-mouth is the growth rail (blueprint Stage 5).
//
// Shown on the dashboard. Loads the caller's stable code + counts; one tap
// copies the link or opens WhatsApp with a prefilled message. Degrades to
// nothing if the endpoint fails — never a broken box on the dashboard.

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Share2, Users } from "lucide-react";

interface Stats {
  code: string;
  url: string;
  joined: number;
  activated: number;
}

export function ReferralCard({ sw = false }: { sw?: boolean }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/referral", { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j?.data && setStats(j.data))
      .catch(() => {});
    return () => ac.abort();
  }, []);

  const ping = useCallback((channel: "whatsapp" | "link" | "copy") => {
    fetch("/api/referral/shared", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel }),
    }).catch(() => {});
  }, []);

  if (!stats) return null;

  const message = sw
    ? `Nimekuwa nikitumia Sumaiya kutengeneza CV yangu na kujiandaa kwa kazi — ni bure. Jaribu: ${stats.url}`
    : `I've been using Sumaiya to build my CV and prep for jobs — it's free. Try it: ${stats.url}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(message)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(stats.url);
      setCopied(true);
      ping("copy");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="bg-surface border border-border rounded-card-lg p-4">
      <div className="flex items-center gap-2 mb-1">
        <Share2 className="w-4 h-4 text-ember" />
        <h3 className="text-sm font-bold text-espresso">
          {sw ? "Mwalike rafiki" : "Invite a friend"}
        </h3>
      </div>
      <p className="text-xs text-text-body mb-3">
        {sw
          ? "Shiriki Sumaiya na mtu anayetafuta kazi. Ni bure kwao pia."
          : "Share Sumaiya with someone job-hunting. It's free for them too."}
      </p>

      <div className="flex items-center gap-1.5">
        <input
          readOnly
          value={stats.url}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 text-xs bg-cream border border-border-input rounded-lg px-2.5 py-2 text-text-body font-mono"
        />
        <button
          onClick={copy}
          aria-label={sw ? "Nakili kiungo" : "Copy link"}
          className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg border border-border-input text-text-body hover:border-ember hover:text-ember-hover transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-pine" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? (sw ? "Imenakiliwa" : "Copied") : (sw ? "Nakili" : "Copy")}
        </button>
      </div>

      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => ping("whatsapp")}
        className="mt-2 w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-lg bg-[#25D366] text-white hover:brightness-95 transition"
      >
        <Share2 className="w-3.5 h-3.5" />
        {sw ? "Tuma kwa WhatsApp" : "Share on WhatsApp"}
      </a>

      {stats.joined > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-text-muted">
          <Users className="w-3.5 h-3.5" />
          <span>
            {sw
              ? `Watu ${stats.joined} wamejiunga · ${stats.activated} wametengeneza CV`
              : `${stats.joined} joined · ${stats.activated} built a CV`}
          </span>
        </div>
      )}
    </div>
  );
}
