"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, LayoutGrid, Plus, Wrench, Sparkles } from "lucide-react";
import { useLang } from "@/lib/i18n/context";
import { Icon } from "@/components/ui/icon";
import { DOC_TYPES } from "@/lib/doc-types";
import { CreateEntryOptions } from "@/components/editor/create-entry-options";
import { label } from "@/lib/i18n/labels";

/**
 * App-like fixed bottom navigation for the mobile PWA. Hidden on the editor and
 * studio routes, which run full-screen with their own bottom chrome.
 *
 * Five equal-width slots (all flex-1) so the bar is symmetric and the primary
 * "Create" action sits in the dead centre.
 *
 * The Create sheet now has TWO levels:
 * 1. Pick a document type (CV, Cover Letter, Business Card, Formal Letter)
 * 2. Pick how to start (Use Profile, Upload, Fresh) via CreateEntryOptions
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const lang = useLang();
  const sw = lang === "sw";
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<
    "cv" | "cover-letter" | "business-card" | "letter" | null
  >(null);

  // Lock body scroll while the create sheet is open.
  useBodyScrollLock(createOpen);

  const TABS = [
    {
      href: "/dashboard",
      label: sw ? "Nyumbani" : "Home",
      icon: LayoutDashboard,
      match: (p: string) => p === "/dashboard",
    },
    {
      href: "/templates",
      label: sw ? "Templeti" : "Templates",
      icon: LayoutGrid,
      match: (p: string) => p.startsWith("/templates"),
    },
    { label: sw ? "Unda" : "Create", icon: Plus, primary: true, match: () => false },
    {
      href: "/tools",
      label: sw ? "Zana" : "Tools",
      icon: Wrench,
      match: (p: string) => p.startsWith("/tools"),
    },
    // Sumaiya, the AI assistant — a core destination now. Settings still lives
    // in the top-bar account menu (avatar) on every dashboard route.
    {
      href: "/assistant",
      label: "Sumaiya",
      icon: Sparkles,
      match: (p: string) => p.startsWith("/assistant"),
    },
  ];

  if (/^\/(editor|studio)(\/|$)/.test(pathname)) return null;

  const handleClose = () => {
    setCreateOpen(false);
    setSelectedType(null);
  };

  return (
    <>
      {/* ── Create sheet ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {createOpen && (
          <motion.div
            className="md:hidden fixed inset-0 z-[60]"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop — hidden when CreateEntryOptions modal is visible (it has its own) */}
            {!selectedType && (
              <button
                aria-label={label(sw, "close")}
                className="absolute inset-0 bg-espresso/50 backdrop-blur-sm"
                onClick={handleClose}
              />
            )}

            {selectedType ? (
              // Step 2 — show Upload / Use Profile / Fresh for the chosen type
              <CreateEntryOptions
                docType={selectedType}
                lang={lang}
                onClose={handleClose}
              />
            ) : (
              // Step 1 — pick a document type
              <motion.div
                className="absolute inset-x-0 bottom-0 bg-card rounded-t-card-lg border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-floating"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
                <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3 px-1">
                  {sw ? "Unda hati mpya" : "Create a new document"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DOC_TYPES.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedType(d.id)}
                      className="flex items-center gap-2.5 rounded-card border border-border bg-card p-3 hover:border-ember/40 active:bg-sand transition-colors text-left"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ember-tint text-ember">
                        <Icon name={d.icon} size={18} />
                      </span>
                      <span className="text-sm font-semibold text-espresso leading-tight">
                        {sw ? d.sw : d.en}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom tab bar ────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-espresso border-t border-espresso-line safe-bottom-nav">
        <div className="flex items-end justify-around px-1 pt-1.5">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            const TabIcon = tab.icon;

            if (tab.primary) {
              return (
                <button
                  key="create"
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  aria-label={tab.label}
                  aria-haspopup="dialog"
                  className="flex flex-1 flex-col items-center justify-end gap-1"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ember text-cream shadow-[0_2px_0_#A8330F] active:shadow-[0_1px_0_#A8330F] active:translate-y-[1px] transition">
                    <TabIcon className="h-5 w-5" strokeWidth={2.4} />
                  </span>
                  <span className="text-[10px] font-medium text-cream/70">
                    {tab.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href!}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                className={`flex flex-1 flex-col items-center justify-end gap-1 py-1.5 transition ${
                  active ? "text-gold" : "text-cream/55"
                }`}
              >
                <TabIcon
                  className="h-[22px] w-[22px]"
                  strokeWidth={active ? 2.2 : 1.75}
                />
                <span
                  className={`text-[10px] ${active ? "font-semibold" : "font-medium"}`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
