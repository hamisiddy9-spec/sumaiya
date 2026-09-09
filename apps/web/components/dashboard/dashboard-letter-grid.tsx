"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Edit2, MoreHorizontal, Trash2 } from "lucide-react";
import { LETTER_COMPONENTS } from "@/components/templates/letter";
import { ScaledPreview } from "@/components/dashboard/scaled-preview";
import { CreateEntryButton } from "@/components/editor/create-entry-options";
import { LETTER_TYPE_META, createEmptyLetterData } from "@/types";
import type { LetterData, LetterType, LetterTemplateId } from "@/types";
import type { Letter } from "@/lib/db/schema";

interface Props {
  letters: Letter[];
  lang: "en" | "sw";
}

export function DashboardLetterGrid({ letters, lang }: Props) {
  const sw = lang === "sw";
  const [items, setItems] = useState<Letter[]>(letters);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setOpenMenuId(null);
    const prev = items;
    setItems((cur) => cur.filter((l) => l.id !== id));
    try {
      const res = await fetch(`/api/documents/letter/${id}`, { method: "DELETE" });
      if (!res.ok) setItems(prev);
    } catch {
      setItems(prev);
    }
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      <CreateEntryButton
        docType="letter"
        lang={lang}
        as="div"
        className="group border-2 border-dashed border-border hover:border-ember rounded-card-lg hover:bg-ember-tint/40 transition-colors flex flex-col items-center justify-center gap-3 min-h-[220px] cursor-pointer"
      >
        <div className="w-12 h-12 bg-sand group-hover:bg-ember-tint rounded-xl flex items-center justify-center transition">
          <Plus className="w-6 h-6 text-text-muted group-hover:text-ember transition" />
        </div>
        <span className="text-sm font-medium text-text-body group-hover:text-ember transition">
          {sw ? "Barua Rasmi Mpya" : "New Formal Letter"}
        </span>
      </CreateEntryButton>

      {items.map((doc) => {
        const templateId = (
          doc.templateId in LETTER_COMPONENTS ? doc.templateId : "formal"
        ) as LetterTemplateId;
        const Component = LETTER_COMPONENTS[templateId];
        const letterType = (doc.letterType ?? "reference") as LetterType;
        const data = (doc.data ??
          createEmptyLetterData(letterType)) as LetterData;
        const meta = LETTER_TYPE_META[letterType];
        const isMenuOpen = openMenuId === doc.id;

        return (
          <div
            key={doc.id}
            className="group relative rounded-card-lg border border-border bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            <Link
              href={`/editor/letter/${doc.id}`}
              className="block rounded-t-card-lg bg-sand overflow-hidden relative"
            >
              <ScaledPreview designW={794} designH={1123}>
                <Component data={data} primaryColor={doc.primaryColor} />
              </ScaledPreview>

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0 bg-card rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg">
                  <Edit2 className="w-4 h-4 text-text-body" />
                  <span className="text-sm font-semibold text-text-body">{sw ? "Hariri Barua Rasmi" : "Edit Formal Letter"}</span>
                </div>
              </div>
            </Link>

            <div className="p-3 bg-card border-t border-border h-[58px] flex flex-col justify-center relative">
              <p className="font-semibold text-espresso truncate text-sm pr-8">{doc.title}</p>
              <p className="text-xs text-text-muted mt-0.5">
                <span className="capitalize">{meta?.label ?? letterType.replace(/-/g, " ")}</span>
              </p>

              {/* "..." menu button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setOpenMenuId(isMenuOpen ? null : doc.id);
                }}
                className="absolute top-2 right-2 p-1 rounded-lg hover:bg-sand transition"
                aria-label={sw ? "Chaguo zaidi" : "More options"}
              >
                <MoreHorizontal className="w-4 h-4 text-text-muted" />
              </button>

              {isMenuOpen && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => { setOpenMenuId(null); setConfirmId(null); }}
                  />
                  <div className="absolute bottom-full right-0 mb-1 z-50 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[150px]">
                    <button
                      onClick={() => {
                        if (confirmId === doc.id) { handleDelete(doc.id); setConfirmId(null); }
                        else setConfirmId(doc.id);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition ${
                        confirmId === doc.id ? "text-white bg-red-600 hover:bg-red-700" : "text-red-600 hover:bg-red-50"
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      {confirmId === doc.id ? (sw ? "Thibitisha kufuta?" : "Confirm delete?") : (sw ? "Futa" : "Delete")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
