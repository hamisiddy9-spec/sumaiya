import Link from "next/link";
import { headers } from "next/headers";
import { Mail, MapPin, Clock } from "lucide-react";
import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { MarketingNav } from "@/components/ui/marketing-nav";
import { Footer } from "@/components/ui/footer";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const sw = params.locale !== "en";
  return {
    alternates: alternatesFor("/contact", params.locale),
    title: sw ? "Wasiliana Nasi" : "Contact",
    description: sw
      ? "Pata msaada kuhusu mpango wako wa Sumaiya, upakuaji, au alama ya CV yako. Tunajibu ndani ya saa 24."
      : "Get help with your Sumaiya plan, downloads, or ATS score. We reply within 24 hours.",
  };
}

const contactDetails = (sw: boolean) => [
  {
    icon: Mail,
    label: sw ? "Barua pepe" : "Email",
    content: (
      <a href="mailto:support@templatehub.pro" className="text-espresso font-semibold hover:text-ember transition">
        support@templatehub.pro
      </a>
    ),
  },
  {
    icon: MapPin,
    label: sw ? "Eneo" : "Where we work",
    content: <p className="text-espresso font-semibold">{sw ? "Mtandaoni — duniani kote" : "Online — worldwide"}</p>,
  },
  {
    icon: Clock,
    label: sw ? "Muda wa kujibu" : "Response time",
    content: <p className="text-espresso font-semibold">{sw ? "Ndani ya saa 24" : "Within 24 hours"}</p>,
  },
];

const faqLinks = (sw: boolean) => [
  { href: "/templates", label: sw ? "Naweza kubadilisha muundo wa CV?" : "Can I change my CV design?" },
  { href: "/ats-checker", label: sw ? "CV yangu itapita vichujio vya waajiri?" : "Will my CV pass ATS systems?" },
  { href: "/tools", label: sw ? "Mna zana za PDF bila malipo?" : "Do you have free PDF tools?" },
];

export default async function ContactPage({ params }: { params: { locale: string } }) {
  const sw = (params.locale ?? "sw") === "sw";
  const details = contactDetails(sw);
  const faqs = faqLinks(sw);
  return (
    <div className="min-h-screen bg-sand">
      <MarketingNav />

      <main id="main" tabIndex={-1} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-bold text-ember-hover uppercase tracking-widest mb-3">{sw ? "Msaada" : "Support"}</p>
          <h1 className="font-display font-extrabold tracking-tight text-espresso text-4xl sm:text-5xl mb-4">
            {sw ? "Tuko hapa kukusaidia" : "We're here to help"}
          </h1>
          <p className="text-lg text-text-body max-w-2xl mx-auto">
            {sw
              ? "Una maswali kuhusu mpango wako, upakuaji, au alama ya CV yako? Tuandikie ujumbe na tutakujibu ndani ya saa 24."
              : "Questions about your plan, downloads, or ATS score? Drop us a message and we'll reply within 24 hours."}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <h2 className="font-display font-extrabold tracking-tight text-espresso text-2xl mb-6">
                {sw ? "Wasiliana nasi" : "Get in touch"}
              </h2>
              <div className="space-y-5">
                {details.map(({ icon: Icon, label, content }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-cream rounded-xl flex items-center justify-center flex-shrink-0 border border-border">
                      <Icon className="w-5 h-5 text-ember" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-muted mb-0.5">{label}</p>
                      {content}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-cream rounded-card-lg p-6 border border-border">
              <h3 className="font-display font-extrabold tracking-tight text-espresso mb-3">
                {sw ? "Maswali ya kawaida" : "Common questions"}
              </h3>
              <ul className="space-y-2.5 text-sm text-text-body">
                {faqs.map((link, i) => (
                  <li key={i}>
                    <Link
                      href={link.href}
                      className="text-ember hover:text-ember-hover font-semibold transition"
                    >
                      {link.label} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <ContactForm />
        </div>
      </main>

      <Footer />
    </div>
  );
}
