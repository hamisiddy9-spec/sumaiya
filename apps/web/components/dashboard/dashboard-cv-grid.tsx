"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Edit2, MoreHorizontal, Trash2, Copy, AlertCircle, Globe, Check, Link2, EyeOff, MessageSquareText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { TEMPLATE_COMPONENTS } from "@/components/templates/registry";
import { TemplateCanvas } from "@/components/templates/template-canvas";
import { resolveFontStack } from "@/lib/fonts";
import { useDeleteConfirm } from "@/components/dashboard/use-delete-confirm";
import { ScaledPreview } from "@/components/dashboard/scaled-preview";
import { TEMPLATES, parseCVData, isTemplateId, type CVData } from "@/types";
import { CreateEntryButton } from "@/components/editor/create-entry-options";
import { analyzeCv, atsScore } from "@/lib/ats-score";

interface CVRecord {
  id: string;
  title: string;
  templateId: string;
  primaryColor: string;
  fontFamily: string;
  data: unknown;
  updatedAt: Date | string;
  isPublic?: boolean;
  publicSlug?: string | null;
}

function templateName(id: string) {
  return TEMPLATES.find((t) => t.id === id)?.name ?? id;
}

function CVCard({ doc, lang, onDelete }: { doc: CVRecord; lang: "en" | "sw"; onDelete: (id: string) => void }) {
  const sw = lang === "sw";
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [isPublic, setIsPublic] = useState(!!doc.isPublic);
  const [publicSlug] = useState(doc.publicSlug ?? null);
  const [copied, setCopied] = useState(false);
  const [unsharing, setUnsharing] = useState(false);

  const publicLink = publicSlug
    ? `${typeof window !== "undefined" ? window.location.origin : "https://sumaiya.app"}/cv/${publicSlug}`
    : "";

  async function handleCopyLink() {
    if (!publicLink) return;
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked — no-op */ }
  }

  async function handleStopSharing() {
    setUnsharing(true);
    try {
      const res = await fetch(`/api/cv/${doc.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: false }),
      });
      if (res.ok) { setIsPublic(false); setMenuOpen(false); }
    } finally {
      setUnsharing(false);
    }
  }

  const Component =
    TEMPLATE_COMPONENTS[isTemplateId(doc.templateId) ? doc.templateId : "nakuru"] ??
    TEMPLATE_COMPONENTS.nakuru;
  const data = parseCVData(doc.data);
  // Live-computed, not read from a saved snapshot — analyzeCv/atsScore are
  // pure and already used by the ATS Checker panel, so every CV gets an
  // at-a-glance score here even if its owner never explicitly ran a check
  // on it. Same score bands as the checker (>=80 ready, >=55 needs work).
  // Defensively wrapped: lib/assistant/signals.ts's own ATS check treats a
  // CV analyzeCv can't handle as "no signal", not a hard failure — a badge
  // on a dashboard card is even less of a place to let one bad CV's data
  // crash the whole grid instead of just quietly not showing a score.
  const ats = useMemo(() => {
    try {
      return atsScore(analyzeCv(data, sw));
    } catch {
      return null;
    }
  }, [data, sw]);

  const { confirming, trigger: triggerDelete } = useDeleteConfirm(() => {
    setMenuOpen(false);
    onDelete(doc.id);
  });

  async function handleDuplicate() {
    setMenuOpen(false);
    setDuplicating(true);
    try {
      const res = await fetch(`/api/cv/${doc.id}/duplicate`, { method: "POST" });
      if (res.ok) {
        const json = await res.json() as { data?: { id: string } };
        if (json.data?.id) router.push(`/editor/cv/${json.data.id}`);
      }
    } finally {
      setDuplicating(false);
    }
  }

  return (
    <div className="group relative rounded-card-lg border border-border bg-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      {/* Preview */}
      <Link
        href={`/editor/cv/${doc.id}`}
        className="block rounded-t-card-lg bg-sand overflow-hidden relative"
      >
        <ScaledPreview designW={794} designH={1123}>
          <TemplateCanvas>
            <Component data={data} primaryColor={doc.primaryColor} fontFamily={resolveFontStack(doc.fontFamily)} />
          </TemplateCanvas>
        </ScaledPreview>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0 bg-card rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg">
            <Edit2 className="w-4 h-4 text-text-body" />
            <span className="text-sm font-semibold text-text-body">{sw ? "Hariri CV" : "Edit CV"}</span>
          </div>
        </div>
        {isPublic && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-pine text-cream text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full shadow-sm">
            <Globe className="w-3 h-3" /> {sw ? "Inaonekana" : "Live"}
          </span>
        )}
        {ats !== null && (
          <span
            className={`absolute top-2 right-2 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full shadow-sm ${
              ats >= 80 ? "bg-pine text-cream" : ats >= 55 ? "bg-gold text-espresso" : "bg-red-500 text-white"
            }`}
          >
            ATS {ats}
          </span>
        )}
      </Link>

      {/* Footer */}
      <div className="px-3 pt-2.5 pb-2 bg-card border-t border-border h-[62px] flex items-center gap-2.5 relative">
        {/* Color swatch */}
        <div className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-black/10" style={{ backgroundColor: doc.primaryColor }} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-espresso truncate text-sm leading-tight">{doc.title}</p>
          <p className="text-[11px] text-text-muted leading-tight mt-0.5">
            {templateName(doc.templateId)} · {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
          </p>
        </div>

        {/* ⋯ menu */}
        <button
          onClick={(e) => { e.preventDefault(); setMenuOpen((v) => !v); }}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-sand transition"
          aria-label={sw ? "Chaguo zaidi" : "More options"}
        >
          <MoreHorizontal className="w-4 h-4 text-text-muted" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setMenuOpen(false); }} />
            <div className="absolute bottom-full right-0 mb-1 z-50 bg-card border border-border rounded-xl shadow-card-hover py-1 min-w-[155px]">
              <Link
                href={`/editor/cv/${doc.id}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-body hover:bg-sand transition"
              >
                <Edit2 className="w-3.5 h-3.5 text-text-muted" /> {sw ? "Fungua kihariri" : "Open editor"}
              </Link>
              <Link
                href={`/interview?cv=${doc.id}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-body hover:bg-sand transition"
              >
                <MessageSquareText className="w-3.5 h-3.5 text-text-muted" /> {sw ? "Jizoeze mahojiano" : "Practice interview"}
              </Link>
              <button
                onClick={handleDuplicate}
                disabled={duplicating}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-body hover:bg-sand transition disabled:opacity-50"
              >
                <Copy className="w-3.5 h-3.5 text-text-muted" />
                {duplicating ? (sw ? "Inanakili…" : "Duplicating…") : (sw ? "Nakili" : "Duplicate")}
              </button>
              {isPublic && (
                <>
                  <div className="h-px bg-sand my-1" />
                  {publicSlug && (
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-body hover:bg-sand transition"
                    >
                      {copied
                        ? <><Check className="w-3.5 h-3.5 text-pine" /> {sw ? "Imenakiliwa" : "Copied"}</>
                        : <><Link2 className="w-3.5 h-3.5 text-text-muted" /> {sw ? "Nakili kiungo" : "Copy link"}</>}
                    </button>
                  )}
                  <button
                    onClick={handleStopSharing}
                    disabled={unsharing}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-body hover:bg-sand transition disabled:opacity-50"
                  >
                    <EyeOff className="w-3.5 h-3.5 text-text-muted" />
                    {unsharing ? (sw ? "Inazima…" : "Stopping…") : (sw ? "Acha kushiriki" : "Stop sharing")}
                  </button>
                </>
              )}
              <div className="h-px bg-sand my-1" />
              <button
                onClick={triggerDelete}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition ${
                  confirming
                    ? "text-white bg-red-600 hover:bg-red-700 rounded-lg mx-1 w-[calc(100%-8px)]"
                    : "text-red-600 hover:bg-red-50"
                }`}
              >
                {confirming ? (
                  <><AlertCircle className="w-3.5 h-3.5" /> {sw ? "Thibitisha kufuta?" : "Confirm delete?"}</>
                ) : (
                  <><Trash2 className="w-3.5 h-3.5" /> {sw ? "Futa" : "Delete"}</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function DashboardCVGrid({ cvs, lang }: { cvs: CVRecord[]; lang: "en" | "sw" }) {
  const [items, setItems] = useState<CVRecord[]>(cvs);

  async function handleDelete(id: string) {
    const prev = items;
    setItems((cur) => cur.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/cv/${id}`, { method: "DELETE" });
      if (!res.ok) setItems(prev);
    } catch {
      setItems(prev);
    }
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {/* New CV card */}
      <CreateEntryButton
        docType="cv"
        lang={lang}
        as="div"
        className="group border-2 border-dashed border-border hover:border-ember rounded-card-lg hover:bg-ember-tint/40 transition-colors flex flex-col items-center justify-center gap-3 min-h-[220px] cursor-pointer"
      >
        <div className="w-12 h-12 bg-sand group-hover:bg-ember-tint rounded-xl flex items-center justify-center transition">
          <Plus className="w-6 h-6 text-text-muted group-hover:text-ember transition" />
        </div>
        <span className="text-sm font-medium text-text-body group-hover:text-ember transition">{lang === "sw" ? "CV Mpya" : "New CV"}</span>
      </CreateEntryButton>

      {items.map((doc) => (
        <CVCard key={doc.id} doc={doc} lang={lang} onDelete={handleDelete} />
      ))}
    </div>
  );
}
