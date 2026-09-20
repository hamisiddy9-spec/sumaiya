"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { motion } from "framer-motion";
import { label } from "@/lib/i18n/labels";
import { useModalDialog } from "@/components/ui/use-modal-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateEntryOptionsProps {
  docType: "cv" | "cover-letter" | "business-card" | "letter";
  lang?: "en" | "sw";
  /** Optional template ID — passed through to the editor URL so the chosen template is pre-selected */
  templateId?: string;
  onClose: () => void;
}

interface OptionDef {
  id: "assistant" | "upload" | "profile" | "fresh";
  icon: IconName;
  en: { label: string; hint: string };
  sw: { label: string; hint: string };
}

// CV-only: the conversational builder. Offered first because it's the easiest
// on-ramp — answer a few questions instead of facing a blank form.
const ASSISTANT_OPTION: OptionDef = {
  id: "assistant",
  icon: "magic",
  en: { label: "Chat with me", hint: "Easiest — answer a few questions" },
  sw: { label: "Zungumza nami", hint: "Rahisi zaidi — jibu maswali machache" },
};

const OPTIONS: OptionDef[] = [
  {
    id: "upload",
    icon: "upload",
    en: { label: "Upload Document", hint: "Extract from existing file" },
    sw: { label: "Pakia Hati", hint: "Toa kutoka hati uliyonayo" },
  },
  {
    id: "profile",
    icon: "user",
    en: { label: "Use My Profile", hint: "Pre-filled from saved data" },
    sw: { label: "Tumia Profaili", hint: "Jazwa kiotomatiki" },
  },
  {
    id: "fresh",
    icon: "list",
    en: { label: "Start Fresh", hint: "Blank canvas from scratch" },
    sw: { label: "Anza Tupu", hint: "Hati tupu kuanzia mwanzo" },
  },
];

const DOC_LABELS: Record<string, { en: string; sw: string }> = {
  cv:              { en: "CV / Résumé",   sw: "CV" },
  "cover-letter":  { en: "Cover Letter",  sw: "Barua ya Maombi" },
  "business-card": { en: "Business Card", sw: "Kadi ya Biashara" },
  letter:          { en: "Formal Letter", sw: "Barua Rasmi" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildUrl(base: string, templateId?: string): string {
  if (!templateId) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}template=${encodeURIComponent(templateId)}`;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function CreateEntryOptions({ docType, lang = "en", templateId, onClose }: CreateEntryOptionsProps) {
  const sw = lang === "sw";
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Escape + focus trap + focus management (always-open component: rendered
  // only while the sheet is up).
  useModalDialog(true, onClose, panelRef);

  // The CV builder chat leads the CV flow; other doc types keep the classic three.
  const options = docType === "cv" ? [ASSISTANT_OPTION, ...OPTIONS] : OPTIONS;

  // Upload: CV has a dedicated AI import page; other doc types create a new doc
  // and let the in-editor Profile → Upload handle file import.
  // Template ID is passed through so the chosen template is pre-selected.
  const UPLOAD_PATH = docType === "cv"
    ? `/import-cv${templateId ? `?template=${encodeURIComponent(templateId)}` : ""}`
    : buildUrl(`/editor/${docType}/new`, templateId);
  const NEW_PATH    = buildUrl(`/editor/${docType}/new`, templateId);
  const FRESH_PATH  = buildUrl(`/editor/${docType}/new?fresh=true`, templateId);

  const handleSelect = (id: string) => {
    setSelected(id);
    setTimeout(() => {
      if (id === "assistant") router.push("/assistant");
      if (id === "upload")  router.push(UPLOAD_PATH);
      if (id === "profile") router.push(NEW_PATH);
      if (id === "fresh")   router.push(FRESH_PATH);
      onClose();
    }, 180);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-entry-title"
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="bg-card rounded-card-lg shadow-floating w-full max-w-sm overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-sand/60">
          <div className="flex items-center justify-between">
            <h2 id="create-entry-title" className="text-base font-bold text-espresso">
              {sw ? `Unda ${DOC_LABELS[docType]?.sw || docType}` : `Create ${DOC_LABELS[docType]?.en || docType}`}
            </h2>
            <button
              onClick={onClose}
              aria-label={label(sw, "close")}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-espresso hover:bg-sand transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/>
              </svg>
            </button>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {sw ? "Chagua jinsi ya kuanza" : "Choose how to start"}
          </p>
        </div>

        {/* Options — visual card buttons */}
        <div className="p-4 space-y-2.5">
          {options.map((opt) => {
            const active = selected === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                disabled={selected !== null}
                className={`w-full flex items-center gap-4 rounded-xl border-2 p-3.5 text-left transition-all duration-150
                  ${active
                    ? "border-ember bg-ember/[0.06] scale-[0.98]"
                    : selected !== null
                      ? "border-border opacity-40"
                      : "border-sand/80 hover:border-ember/40 hover:bg-ember/[0.03]"
                  }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors
                  ${active ? "bg-ember text-white" : "bg-ember/[0.1] text-ember"}`}>
                  <Icon name={opt.icon} size={18} />
                </div>
                <div className="min-w-0">
                  <span className="block text-sm font-semibold text-espresso leading-tight">
                    {sw ? opt.sw.label : opt.en.label}
                  </span>
                  <span className="block text-[11px] text-text-muted leading-snug mt-0.5">
                    {sw ? opt.sw.hint : opt.en.hint}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 pt-1 text-center">
          <button
            onClick={onClose}
            className="text-xs text-text-muted hover:text-espresso transition underline underline-offset-2"
          >
            {sw ? "Ghairi" : "Cancel"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Trigger button wrapper ───────────────────────────────────────────────────

interface CreateEntryButtonProps {
  docType: "cv" | "cover-letter" | "business-card" | "letter";
  lang?: "en" | "sw";
  templateId?: string;
  children: ReactNode;
  className?: string;
  as?: "button" | "div";
}

export function CreateEntryButton({
  docType, lang = "en", templateId, children, className = "", as = "button",
}: CreateEntryButtonProps) {
  const [open, setOpen] = useState(false);
  const Tag = as;

  return (
    <>
      <Tag
        onClick={() => setOpen(true)}
        className={className}
        role={as === "div" ? "button" : undefined}
        tabIndex={as === "div" ? 0 : undefined}
        onKeyDown={as === "div" ? (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") setOpen(true); } : undefined}
      >
        {children}
      </Tag>
      {open && (
        <CreateEntryOptions
          docType={docType}
          lang={lang}
          templateId={templateId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
