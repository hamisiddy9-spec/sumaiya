"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, File, MoreHorizontal, Trash2, AlertCircle, Edit2 } from "lucide-react";
import { format } from "date-fns";
import type { CoverLetter } from "@/lib/db/schema";
import { CreateEntryButton } from "@/components/editor/create-entry-options";

interface Props {
  coverLetters: CoverLetter[];
  lang: "en" | "sw";
}

function useDeleteConfirm(onConfirm: () => void) {
  const [confirming, setConfirming] = useState(false);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  function trigger() {
    if (confirming) {
      if (timer) clearTimeout(timer);
      setConfirming(false);
      onConfirm();
    } else {
      setConfirming(true);
      const t = setTimeout(() => setConfirming(false), 3000);
      setTimer(t);
    }
  }
  return { confirming, trigger };
}

function CLCard({ doc, lang, onDelete }: { doc: CoverLetter; lang: "en" | "sw"; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { confirming, trigger: triggerDelete } = useDeleteConfirm(() => {
    setMenuOpen(false);
    onDelete(doc.id);
  });

  return (
    <div className="group relative bg-card border border-border rounded-card-lg p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      <Link href={`/editor/cover-letter/${doc.id}`} className="block">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
          <File className="w-5 h-5 text-emerald-600" />
        </div>
        <p className="font-semibold text-espresso truncate mb-1 pr-8 text-sm">{doc.title}</p>
        {doc.companyName && (
          <p className="text-xs text-text-body truncate">
            {lang === "sw" ? "Kwa" : "For"} {doc.companyName}
          </p>
        )}
        <p className="text-[11px] text-text-muted mt-3">{format(new Date(doc.updatedAt), "MMM d, yyyy")}</p>
      </Link>

      <button
        onClick={(e) => { e.preventDefault(); setMenuOpen((v) => !v); }}
        className="absolute top-4 right-4 p-1 rounded-lg hover:bg-sand transition"
        aria-label={lang === "sw" ? "Chaguo zaidi" : "More options"}
      >
        <MoreHorizontal className="w-4 h-4 text-text-muted" />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-12 right-4 z-50 bg-card border border-border rounded-xl shadow-card-hover py-1 min-w-[155px]">
            <Link
              href={`/editor/cover-letter/${doc.id}`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-body hover:bg-sand transition"
            >
              <Edit2 className="w-3.5 h-3.5 text-text-muted" /> {lang === "sw" ? "Hariri" : "Open editor"}
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
                ? <><AlertCircle className="w-3.5 h-3.5" /> {lang === "sw" ? "Thibitisha?" : "Confirm delete?"}</>
                : <><Trash2 className="w-3.5 h-3.5" /> {lang === "sw" ? "Futa" : "Delete"}</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function DashboardCoverLetterGrid({ coverLetters, lang }: Props) {
  const [items, setItems] = useState<CoverLetter[]>(coverLetters);

  async function handleDelete(id: string) {
    const prev = items;
    setItems((cur) => cur.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/cover-letter/${id}`, { method: "DELETE" });
      if (!res.ok) setItems(prev);
    } catch {
      setItems(prev);
    }
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
      {/* New Cover Letter card */}
      <CreateEntryButton
        docType="cover-letter"
        lang={lang}
        as="div"
        className="group border-2 border-dashed border-border hover:border-emerald-400 rounded-card-lg hover:bg-emerald-50 transition-colors flex flex-col items-center justify-center gap-3 min-h-[140px] cursor-pointer"
      >
        <div className="w-12 h-12 bg-sand group-hover:bg-emerald-100 rounded-xl flex items-center justify-center transition">
          <Plus className="w-6 h-6 text-text-muted group-hover:text-emerald-600 transition" />
        </div>
        <span className="text-sm font-medium text-text-body group-hover:text-emerald-600 transition">
          {lang === "sw" ? "Barua Mpya ya Maombi" : "New Cover Letter"}
        </span>
      </CreateEntryButton>
      {items.map((doc) => (
        <CLCard key={doc.id} doc={doc} lang={lang} onDelete={handleDelete} />
      ))}
    </div>
  );
}
