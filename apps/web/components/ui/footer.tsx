"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n/context";
import { PAYMENTS_ENABLED } from "@/lib/features";

const productLinks = [
  { href: "/templates", label: "Looks", labelSw: "Miundo" },
  { href: "/assistant", label: "Sumaiya (AI assistant)", labelSw: "Sumaiya (msaidizi wa AI)" },
  { href: "/editor/cv/try", label: "CV builder", labelSw: "Tengeneza CV" },
  { href: "/editor/cover-letter/try", label: "Cover letters", labelSw: "Barua za maombi" },
  { href: "/ats-checker", label: "ATS Checker", labelSw: "Kagua ATS" },
  { href: "/tools", label: "PDF tools", labelSw: "Zana za PDF" },
  { href: "/jobs", label: "Jobs", labelSw: "Ajira" },
  // Pricing hidden while everything is free (matches the nav — see lib/features.ts).
  ...(PAYMENTS_ENABLED ? [{ href: "/pricing", label: "Pricing", labelSw: "Bei" }] : []),
];

const companyLinks = [
  { href: "/contact", label: "Contact", labelSw: "Wasiliana" },
  { href: "/about", label: "About", labelSw: "Kuhusu" },
  { href: "/blog", label: "Blog", labelSw: "Blogu" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy", labelSw: "Sera ya Faragha" },
  { href: "/terms", label: "Terms of Service", labelSw: "Masharti ya Huduma" },
  { href: "/cookies", label: "Cookie Policy", labelSw: "Sera ya Vidakuzi" },
];

const currentYear = new Date().getFullYear();

export function Footer() {
  const lang = useLang();
  const sw = lang === "sw";

  return (
    <footer className="bg-espresso border-t border-espresso-line/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Logo className="text-cream [&_span]:!text-cream" />
            <p className="mt-3 text-sm text-cream/60 leading-relaxed max-w-xs">
              {sw
                ? "Miundo ya kitaalamu ya CV, barua za maombi, kadi za biashara na barua rasmi, pamoja na msaidizi wa AI unaokusaidia kupata ajira."
                : "Professional CV, cover letter, business card & letter templates, with an AI assistant that helps you get hired."}
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-cream mb-4">{sw ? "Bidhaa" : "Product"}</h3>
            <ul className="flex flex-col gap-2.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/60 hover:text-cream transition-colors duration-150"
                  >
                    {sw ? link.labelSw : link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-cream mb-4">{sw ? "Kampuni" : "Company"}</h3>
            <ul className="flex flex-col gap-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/60 hover:text-cream transition-colors duration-150"
                  >
                    {sw ? link.labelSw : link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-cream mb-4">{sw ? "Kisheria" : "Legal"}</h3>
            <ul className="flex flex-col gap-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/60 hover:text-cream transition-colors duration-150"
                  >
                    {sw ? link.labelSw : link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom row: copyright */}
        <div className="mt-10 pt-8 border-t border-espresso-line/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-cream/50">
            {sw ? "Bure kwa sasa — hakuna malipo." : "Free for now — no payments."}
          </p>
          <p className="text-xs text-cream/40">
            &copy; {currentYear} Sumaiya. {sw ? "Haki zote zimehifadhiwa." : "All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  );
}
