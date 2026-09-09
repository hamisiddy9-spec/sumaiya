"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { CreateEntryOptions } from "@/components/editor/create-entry-options";
import { DOC_TYPES } from "@/lib/doc-types";

/** One "Create" action that offers all four document types and creates any of
 *  them in a single click (`/editor/<type>/new`). Replaces the old "New
 *  Document" button that misleadingly only created a CV. */
export function CreateMenu({ lang }: { lang: "en" | "sw" }) {
  const sw = lang === "sw";
  const [open, setOpen] = useState(false);
  const [createType, setCreateType] = useState<"cv" | "cover-letter" | "business-card" | "letter" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="primary"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Icon name="plus" size={14} />
        {sw ? "Unda Mpya" : "Create New"}
        <Icon name="chevron-down" size={14} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2 w-64 bg-card rounded-card-lg shadow-floating border border-border p-2 z-50"
          >
            {DOC_TYPES.map((d) => (
              <button
                key={d.id}
                onClick={() => { setOpen(false); setCreateType(d.id); }}
                role="menuitem"
                className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-sand focus-visible:bg-sand focus-visible:outline-none transition-colors text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ember-tint text-ember">
                  <Icon name={d.icon} size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-espresso leading-tight">{sw ? d.sw : d.en}</span>
                  <span className="block text-[11px] text-text-muted leading-tight">{sw ? d.blurbSw : d.blurbEn}</span>
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {createType && (
        <CreateEntryOptions
          docType={createType}
          lang={lang}
          onClose={() => setCreateType(null)}
        />
      )}
    </div>
  );
}
