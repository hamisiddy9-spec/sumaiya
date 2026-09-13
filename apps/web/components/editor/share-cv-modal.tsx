"use client";

// The "share your CV online" modal. Turns the public link on/off, shows the
// link with one-tap Copy + WhatsApp share, lets the owner hide contact details,
// and reassures on privacy (link-only, never in search). Privacy-first: nothing
// is public until the toggle is switched on here.

import { useRef, useState } from "react";
import { Loader2, Check, Copy, X, Globe, Lock } from "lucide-react";
import { label } from "@/lib/i18n/labels";
import { useModalDialog } from "@/components/ui/use-modal-dialog";

interface Props {
  cvId: string;
  accessToken?: string;
  sw: boolean;
  initialIsPublic: boolean;
  initialSlug: string | null;
  initialShowContact: boolean;
  onClose: () => void;
  onChange?: (s: { isPublic: boolean; slug: string | null; showContact: boolean }) => void;
}

export function ShareCvModal({ cvId, accessToken, sw, initialIsPublic, initialSlug, initialShowContact, onClose, onChange }: Props) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [slug, setSlug] = useState<string | null>(initialSlug);
  const [showContact, setShowContact] = useState(initialShowContact);
  const [busy, setBusy] = useState<null | "toggle" | "contact">(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  // Escape + focus trap + focus management.
  useModalDialog(true, onClose, panelRef);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://sumaiya.app";
  const link = slug ? `${origin}/cv/${slug}` : "";

  async function patch(body: { isPublic?: boolean; showContact?: boolean }, which: "toggle" | "contact") {
    setBusy(which); setError("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch(`/api/cv/${cvId}/share`, { method: "POST", headers, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({})) as { success?: boolean; data?: { isPublic: boolean; publicSlug: string | null; publicShowContact: boolean }; error?: string };
      if (!res.ok || !json.success || !json.data) throw new Error(json.error || "failed");
      setIsPublic(json.data.isPublic);
      setSlug(json.data.publicSlug);
      setShowContact(json.data.publicShowContact);
      onChange?.({ isPublic: json.data.isPublic, slug: json.data.publicSlug, showContact: json.data.publicShowContact });
      return true;
    } catch {
      setError(sw ? "Imeshindwa. Jaribu tena." : "Something went wrong. Try again.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  const copy = async () => {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  const whatsappHref = link
    ? `https://wa.me/?text=${encodeURIComponent((sw ? "Angalia CV yangu: " : "Check out my CV: ") + link)}`
    : "#";

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-cv-title"
        tabIndex={-1}
        className="bg-card w-full sm:max-w-md rounded-t-card-lg sm:rounded-card-lg shadow-floating overflow-hidden max-h-[92vh] overflow-y-auto pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 id="share-cv-title" className="font-display font-bold text-espresso text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-ember" />
            {sw ? "Shiriki CV yako" : "Share your CV"}
          </h2>
          <button onClick={onClose} aria-label={label(sw, "close")} className="text-text-muted hover:text-espresso transition"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Master toggle */}
          <div className="flex items-start justify-between gap-3 bg-sand-2 border border-border rounded-card p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-espresso">{sw ? "Weka mtandaoni kwa kiungo" : "Make it available by link"}</p>
              <p className="text-xs text-text-muted mt-0.5">
                {sw ? "Pata kiungo cha kushiriki WhatsApp au kwa mwajiri." : "Get a link to share on WhatsApp or with an employer."}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={isPublic}
              disabled={busy === "toggle"}
              onClick={() => patch({ isPublic: !isPublic }, "toggle")}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${isPublic ? "bg-ember" : "bg-border-input"}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-card shadow-sm transition ${isPublic ? "translate-x-[22px]" : "translate-x-[2px]"}`}>
                {busy === "toggle" && <Loader2 className="w-3.5 h-3.5 m-[3px] animate-spin text-ember" />}
              </span>
            </button>
          </div>

          {isPublic && link ? (
            <>
              {/* Link + copy */}
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0 flex items-center gap-2 border border-border-input rounded-input bg-sand-2 px-3 py-2.5">
                  <Globe className="w-4 h-4 text-text-muted shrink-0" />
                  <span className="text-sm text-espresso truncate">{link.replace(/^https?:\/\//, "")}</span>
                </div>
                <button onClick={copy} className="shrink-0 inline-flex items-center gap-1.5 bg-espresso hover:bg-espresso-2 text-cream text-sm font-semibold px-3.5 py-2.5 rounded-input transition">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? (sw ? "Imenakiliwa" : "Copied") : (sw ? "Nakili" : "Copy")}
                </button>
              </div>

              {/* WhatsApp share */}
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:brightness-95 text-white text-sm font-semibold py-3 rounded-input transition"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.6 6.3A7.9 7.9 0 0 0 12 4a8 8 0 0 0-6.9 12l-1.1 4 4.1-1.1A8 8 0 1 0 17.6 6.3zM12 18.5a6.5 6.5 0 0 1-3.3-.9l-.24-.14-2.44.64.65-2.38-.16-.25A6.5 6.5 0 1 1 12 18.5zm3.6-4.9c-.2-.1-1.2-.58-1.36-.64-.19-.07-.32-.1-.46.1s-.53.64-.64.77-.23.15-.43.05a5.3 5.3 0 0 1-1.56-.96 5.9 5.9 0 0 1-1.08-1.35c-.11-.2 0-.3.09-.4l.3-.35c.1-.13.13-.22.2-.36a.37.37 0 0 0-.02-.35c-.05-.1-.46-1.1-.63-1.51-.16-.4-.33-.34-.46-.35h-.39a.75.75 0 0 0-.54.25 2.28 2.28 0 0 0-.71 1.7 3.96 3.96 0 0 0 .83 2.1 9.1 9.1 0 0 0 3.48 3.07c.49.21.87.34 1.16.43.49.16.93.14 1.28.08.39-.06 1.2-.49 1.37-.96.17-.47.17-.88.12-.96s-.18-.14-.38-.24z"/></svg>
                {sw ? "Shiriki kwa WhatsApp" : "Share on WhatsApp"}
              </a>

              {/* Show contact toggle */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-xs text-text-body">{sw ? "Onyesha mawasiliano (barua pepe & simu)" : "Show contact details (email & phone)"}</p>
                <button
                  role="switch"
                  aria-checked={showContact}
                  disabled={busy === "contact"}
                  onClick={() => patch({ showContact: !showContact }, "contact")}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${showContact ? "bg-ember" : "bg-border-input"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-card shadow-sm transition ${showContact ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
                </button>
              </div>

              {/* Privacy reassurance */}
              <div className="flex items-start gap-2 text-[11px] text-text-muted bg-pine-tint/40 rounded-input px-3 py-2">
                <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-pine" />
                <span>{sw ? "Kiungo pekee — CV yako haitaonekana kwenye Google." : "Link-only — your CV is never shown in Google search."}</span>
              </div>
            </>
          ) : (
            <p className="text-xs text-text-muted px-1">
              {sw
                ? "Ukiwasha, utapata kiungo maalum cha kushiriki. Ni ya siri hadi utakapowasha."
                : "Turn it on to get a personal share link. It stays private until you switch it on."}
            </p>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
