"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Edit2, MoreHorizontal, Trash2, AlertCircle } from "lucide-react";
import { CreateEntryButton } from "@/components/editor/create-entry-options";
import { BUSINESS_CARD_COMPONENTS } from "@/components/templates/business-card";
import { useDeleteConfirm } from "@/components/dashboard/use-delete-confirm";
import { ScaledPreview } from "@/components/dashboard/scaled-preview";
import { BUSINESS_CARD_TEMPLATES, type BusinessCardData } from "@/types";
import type { BusinessCard } from "@/lib/db/schema";

function cardTemplateName(id: string) {
  return BUSINESS_CARD_TEMPLATES.find((t) => t.id === id)?.name ?? id;
}

function BCCard({ doc, lang, onDelete }: { doc: BusinessCard; lang: "en" | "sw"; onDelete: (id: string) => void }) {
  const sw = lang === "sw";
  const [menuOpen, setMenuOpen] = useState(false);
  const Component =
    BUSINESS_CARD_COMPONENTS[doc.templateId as keyof typeof BUSINESS_CARD_COMPONENTS] ??
    BUSINESS_CARD_COMPONENTS.classic;
  const data = (doc.data ?? {}) as BusinessCardData;

  const { confirming, trigger: triggerDelete } = useDeleteConfirm(() => {
    setMenuOpen(false);
    onDelete(doc.id);
  });

  return (
    <div className="group relative rounded-card-lg border border-border bg-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      <Link
        href={`/editor/business-card/${doc.id}`}
        className="block rounded-t-card-lg bg-sand overflow-hidden relative"
      >
        <ScaledPreview designW={350} designH={200}>
          <Component data={data} primaryColor={doc.primaryColor} />
        </ScaledPreview>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0 bg-card rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg">
            <Edit2 className="w-4 h-4 text-text-body" />
            <span className="text-sm font-semibold text-text-body">{sw ? "Hariri Kadi" : "Edit Card"}</span>
          </div>
        </div>
      </Link>

      <div className="px-3 pt-2.5 pb-2 bg-card border-t border-border h-[62px] flex items-center gap-2.5 relative">
        <div className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-black/10" style={{ backgroundColor: doc.primaryColor }} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-espresso truncate text-sm leading-tight">{doc.title}</p>
          <p className="text-[11px] text-text-muted leading-tight mt-0.5">{cardTemplateName(doc.templateId)}</p>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); setMenuOpen((v) => !v); }}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-sand transition"
          aria-label={sw ? "Chaguo zaidi" : "More options"}
        >
          <MoreHorizontal className="w-4 h-4 text-text-muted" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute bottom-full right-0 mb-1 z-50 bg-card border border-border rounded-xl shadow-card-hover py-1 min-w-[155px]">
              <Link
                href={`/editor/business-card/${doc.id}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-body hover:bg-sand transition"
              >
                <Edit2 className="w-3.5 h-3.5 text-text-muted" /> {sw ? "Fungua kihariri" : "Open editor"}
              </Link>
              <div className="h-px bg-sand my-1" />
              <button
                onClick={triggerDelete}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition ${
                  confirming
                    ? "text-white bg-red-600 hover:bg-red-700 rounded-lg mx-1 w-[calc(100%-8px)]"
                    : "text-red-600 hover:bg-red-50"
                }`}
              >
                {confirming
                  ? <><AlertCircle className="w-3.5 h-3.5" /> {sw ? "Thibitisha kufuta?" : "Confirm delete?"}</>
                  : <><Trash2 className="w-3.5 h-3.5" /> {sw ? "Futa" : "Delete"}</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function DashboardBusinessCardGrid({ businessCards, lang }: { businessCards: BusinessCard[]; lang: "en" | "sw" }) {
  const [items, setItems] = useState<BusinessCard[]>(businessCards);

  async function handleDelete(id: string) {
    const prev = items;
    setItems((cur) => cur.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/documents/business-card/${id}`, { method: "DELETE" });
      if (!res.ok) setItems(prev);
    } catch {
      setItems(prev);
    }
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      <CreateEntryButton
        docType="business-card"
        lang={lang}
        as="div"
        className="group border-2 border-dashed border-border hover:border-ember rounded-card-lg hover:bg-ember-tint/40 transition-colors flex flex-col items-center justify-center gap-3 min-h-[150px] cursor-pointer"
      >
        <div className="w-12 h-12 bg-sand group-hover:bg-ember-tint rounded-xl flex items-center justify-center transition">
          <Plus className="w-6 h-6 text-text-muted group-hover:text-ember transition" />
        </div>
        <span className="text-sm font-medium text-text-body group-hover:text-ember transition">{lang === "sw" ? "Kadi Mpya" : "New Business Card"}</span>
      </CreateEntryButton>
      {items.map((doc) => (
        <BCCard key={doc.id} doc={doc} lang={lang} onDelete={handleDelete} />
      ))}
    </div>
  );
}
