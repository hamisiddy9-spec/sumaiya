"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const id = q.replace(/\s+/g, "-").toLowerCase().slice(0, 30);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`faq-${id}`}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-semibold text-espresso">{q}</span>
        <ChevronDown className={`w-5 h-5 text-text-muted flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div id={`faq-${id}`} hidden={!open}>
        {open && <p className="text-text-body text-sm leading-relaxed pb-5">{a}</p>}
      </div>
    </div>
  );
}
