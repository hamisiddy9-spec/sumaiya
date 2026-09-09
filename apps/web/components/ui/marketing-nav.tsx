"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Icon } from "@/components/ui/icon";
import { SumaiyaMark } from "@/components/ui/sumaiya-mark";
import { Button } from "@/components/ui/button";
import { LangToggle } from "@/components/ui/lang-toggle";
import { useLang } from "@/lib/i18n/context";
import { useMarketingAuthed } from "@/components/ui/marketing-auth-context";
import { translations } from "@/lib/i18n/translations";
import { PAYMENTS_ENABLED } from "@/lib/features";
import { PDF_TOOL_LINKS, pdfToolHref } from "@/lib/pdf-tools-list";
import { cn } from "@/lib/utils";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";

export function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lang = useLang();
  const tr = translations[lang];
  const authed = useMarketingAuthed();
  const dashboardLabel = lang === "sw" ? "Dashibodi" : "Dashboard";

  // Keep the page from scrolling behind the open mobile menu.
  useBodyScrollLock(mobileOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "/templates", label: tr.nav.templates },
    { href: "/assistant", label: "Sumaiya" },
    { href: "/jobs", label: lang === "sw" ? "Ajira" : "Jobs" },
    { href: "/tools", label: tr.nav.tools },
    { href: "/ats-checker", label: lang === "sw" ? "Kagua ATS" : "ATS Checker" },
    { href: "/snap-to-apply", label: lang === "sw" ? "Snap-to-Apply" : "Snap to Apply" },
    // Pricing hidden while everything is free (see lib/features.ts).
    ...(PAYMENTS_ENABLED ? [{ href: "/pricing", label: tr.nav.pricing }] : []),
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-[75]",
        "bg-espresso/90 backdrop-blur-lg",
        "border-b border-espresso-line/40",
        scrolled && "shadow-[0_1px_10px_rgba(0,0,0,0.2)]"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Logo — the rebrand mark, wordmark inverted to cream for the dark nav */}
        <Logo size="sm" className="shrink-0 [&_span]:!text-cream" />

        {/* Center: Nav links (desktop) */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          <Link href="/templates" className="text-sm font-medium text-cream/80 hover:text-cream transition-colors duration-150">
            {tr.nav.templates}
          </Link>

          {/* Sumaiya — the AI assistant / conversational builder, now a first-class
              destination (guest-accessible). Carries the freshness badge. */}
          <Link href="/assistant" className="flex items-center gap-1.5 text-sm font-medium text-cream/80 hover:text-cream transition-colors duration-150 group/sumaiya">
            <SumaiyaMark size={15} state="idle" className="text-gold group-hover/sumaiya:text-gold" />
            Sumaiya
            <span className="text-[9px] font-bold uppercase tracking-wider bg-ember/25 text-ember-tint rounded-full px-1.5 py-0.5">
              {lang === "sw" ? "Mpya" : "New"}
            </span>
          </Link>

          <Link href="/jobs" className="flex items-center gap-1.5 text-sm font-medium text-cream/80 hover:text-cream transition-colors duration-150">
            {lang === "sw" ? "Ajira" : "Jobs"}
          </Link>

          {/* Tools — dropdown of the individual PDF tools (opens on hover/focus) */}
          <div className="relative group">
            <Link
              href="/tools"
              className="flex items-center gap-1 text-sm font-medium text-cream/80 group-hover:text-cream transition-colors duration-150 py-5"
            >
              {tr.nav.tools}
              <ChevronDown className="h-3.5 w-3.5 opacity-70 transition-transform duration-150 group-hover:rotate-180" />
            </Link>
            <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 transition-all duration-150">
              <div className="w-[340px] max-w-[calc(100vw-1.5rem)] bg-card rounded-card-lg shadow-floating border border-border p-2 grid grid-cols-2 gap-1">
                {PDF_TOOL_LINKS.map(({ id, nameKey, Icon: ToolIcon }) => (
                  <Link
                    key={id}
                    href={pdfToolHref(id)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-sand transition-colors"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ember-tint text-ember">
                      <ToolIcon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className="text-[13px] font-medium text-espresso leading-tight">
                      {translations[lang].tools[nameKey]}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link href="/ats-checker" className="flex items-center gap-1.5 text-sm font-medium text-cream/80 hover:text-cream transition-colors duration-150">
            {lang === "sw" ? "Kagua ATS" : "ATS Checker"}
            <span className="text-[9px] font-bold uppercase tracking-wider bg-gold/20 text-gold rounded-full px-1.5 py-0.5">
              {lang === "sw" ? "Bure" : "Free"}
            </span>
          </Link>

          {PAYMENTS_ENABLED && (
            <Link href="/pricing" className="text-sm font-medium text-cream/80 hover:text-cream transition-colors duration-150">
              {tr.nav.pricing}
            </Link>
          )}
        </nav>

        {/* Right: LangToggle + (Dashboard when signed in, else Sign in + CTA) */}
        <div className="hidden lg:flex items-center gap-3">
          <LangToggle />
          {authed ? (
            <Link href="/dashboard">
              <Button variant="primary" size="sm" className="gap-1.5">
                {dashboardLabel}
                <Icon name="chevron-right" size={14} />
              </Button>
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-cream/70 hover:text-cream transition-colors duration-150"
              >
                {tr.nav.signIn}
              </Link>
              <Link href="/editor/cv/try">
                <Button variant="primary" size="sm" className="gap-1.5">
                  {tr.hero.cta}
                  <Icon name="chevron-right" size={14} />
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden flex items-center justify-center w-11 h-11 rounded-lg text-cream/80 hover:text-cream hover:bg-espresso-2 transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? (lang === "sw" ? "Funga menyu" : "Close menu") : (lang === "sw" ? "Fungua menyu" : "Open menu")}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-panel"
        >
          {mobileOpen ? (
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          ) : (
            <Icon name="menu" size={20} />
          )}
        </button>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[65] bg-espresso/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile menu panel — sits BELOW the 4rem-tall header (top-16). When
          closed it must clear both its own height AND that 4rem offset, or its
          bottom (the CTA) peeks over the logo/hamburger. Hence the calc(). */}
      <div
        id="mobile-nav-panel"
        aria-hidden={!mobileOpen}
        className={cn(
          "lg:hidden fixed top-16 left-0 right-0 z-[70]",
          "bg-espresso border-b border-espresso-line/50",
          "shadow-floating",
          // Cap height and scroll internally so the bottom items (Sign in,
          // Sign-up CTA) stay reachable on short viewports where body scroll is
          // locked while the menu is open.
          "max-h-[calc(100dvh-4rem)] overflow-y-auto",
          "transition-transform duration-200 ease-out",
          mobileOpen
            ? "translate-y-0 visible"
            : "-translate-y-[calc(100%_+_4.5rem)] pointer-events-none invisible"
        )}
      >
        <nav className="flex flex-col px-4 py-4 gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm font-medium text-cream/80 hover:text-cream hover:bg-espresso-2 px-3 py-2.5 rounded-lg transition-colors"
            >
              {link.href === "/assistant" && <SumaiyaMark size={15} state="idle" className="text-gold" />}
              {link.label}
              {link.href === "/assistant" && (
                <span className="text-[9px] font-bold uppercase tracking-wider bg-ember/25 text-ember-tint rounded-full px-1.5 py-0.5">
                  {lang === "sw" ? "Mpya" : "New"}
                </span>
              )}
            </Link>
          ))}

          {/* PDF tools — quick grid so they're reachable from every page on mobile */}
          <div className="mt-1 grid grid-cols-2 gap-1 px-1">
            {PDF_TOOL_LINKS.map(({ id, nameKey, Icon: ToolIcon }) => (
              <Link
                key={id}
                href={pdfToolHref(id)}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-cream/70 hover:text-cream hover:bg-espresso-2 px-2.5 py-2 rounded-lg transition-colors"
              >
                <ToolIcon className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.75} />
                <span className="text-[12px] font-medium leading-tight">{translations[lang].tools[nameKey]}</span>
              </Link>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-espresso-line/50 flex flex-col gap-3">
            <div className="flex justify-start px-1">
              <LangToggle />
            </div>
            {authed ? (
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                <Button variant="primary" size="md" className="w-full gap-1.5">
                  {dashboardLabel}
                  <Icon name="chevron-right" size={16} />
                </Button>
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-cream/70 hover:text-cream px-3 py-2 rounded-lg transition-colors"
                >
                  {tr.nav.signIn}
                </Link>
                <Link href="/editor/cv/try" onClick={() => setMobileOpen(false)}>
                  <Button variant="primary" size="md" className="w-full gap-1.5">
                    {tr.hero.cta}
                    <Icon name="chevron-right" size={16} />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
