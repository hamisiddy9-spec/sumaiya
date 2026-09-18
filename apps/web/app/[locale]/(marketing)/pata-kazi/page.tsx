import type { Metadata } from "next";
import Link from "next/link";
import { SumaiyaMark } from "@/components/ui/sumaiya-mark";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const sw = params.locale !== "en";
  return {
    title: sw ? "Pata Kazi — Umetuma Maombi na Hukuitwa?" : "Get Hired — Applied and Never Called Back?",
    description: sw
      ? "Hukuitwa baada ya kutuma maombi? Si wewe — ni CV yako. Sumaiya inakujengea CV inayopita wakaguzi. Bure."
      : "Not getting called back? It's not you — it's your CV. Sumaiya builds a CV that passes screeners. Free.",
    alternates: alternatesFor("/pata-kazi", params.locale),
    openGraph: {
      title: sw ? "Pata Kazi | Sumaiya" : "Get Hired | Sumaiya",
      description: sw
        ? "Umetuma maombi na hukuitwa? Jenga CV inayopita wakaguzi — bure."
        : "Applied and never called back? Build a CV that passes screeners — free.",
      url: "/pata-kazi",
      images: ["/og-image.png"],
    },
  };
}

const STEPS = {
  sw: [
    { title: "Jenga CV yako", desc: "Bure, kwa dakika chache — kwenye simu yako" },
    { title: "Rekebishwa kuendana na kazi unayoomba", desc: "Ili ipite wakaguzi na kumfikia boss" },
    { title: "Pata usaili", desc: "Anza kuitwa na kufanya kazi" },
  ],
  en: [
    { title: "Build your CV", desc: "Free, in minutes — right on your phone" },
    { title: "Tailored to the job you apply for", desc: "So it passes screeners and reaches the boss" },
    { title: "Get the interview", desc: "Start getting called and working" },
  ],
} as const;

export default function PataKaziPage({ params }: { params: { locale: string } }) {
  const sw = (params.locale ?? "sw") === "sw";
  const steps = STEPS[sw ? "sw" : "en"];

  return (
    <div className="min-h-screen bg-sand text-espresso">
      {/* Deliberately no MarketingNav/Footer: this is a focused scan-landing,
          not a website page. Keep the visitor on one decision. */}
      <main className="mx-auto max-w-md px-6 pb-16 pt-8">
        {/* Brand */}
        <div className="mb-6 flex items-center gap-2.5">
          <SumaiyaMark size={27} color="#DA4A1C" state="static" />
          <div>
            <span className="font-display text-xl font-bold">Sumaiya</span>
            <span className="block text-xs text-espresso/55">
              {sw ? "Msaidizi wako wa kazi" : "Your career assistant"}
            </span>
          </div>
        </div>

        {/* Hero */}
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-ember">
          {sw ? "Kwa wanaotafuta kazi" : "For job seekers"}
        </p>
        <h1 className="mb-3 text-center font-display text-3xl font-extrabold leading-tight tracking-tight">
          {sw ? (
            <>Umetuma maombi na <span className="text-ember">hukuitwa?</span></>
          ) : (
            <>Applied and <span className="text-ember">never called back?</span></>
          )}
        </h1>
        <p className="mb-6 text-center text-base leading-relaxed text-espresso/75">
          {sw ? (
            <>Si wewe — <strong className="font-semibold text-espresso">ni CV yako.</strong>{" "}
              Wakaguzi huchuja <strong className="font-semibold text-espresso">8 kati ya 10</strong>{" "}
              CV zinazotumwa, hata kabla boss hajaona profile yako.</>
          ) : (
            <>It&apos;s not you — <strong className="font-semibold text-espresso">it&apos;s your CV.</strong>{" "}
              Screeners filter <strong className="font-semibold text-espresso">8 in 10</strong>{" "}
              CVs sent, before the boss ever sees your profile.</>
          )}
        </p>

        {/* Steps */}
        <ol className="mb-7 space-y-3.5">
          {steps.map((step, i) => (
            <li key={step.title} className="flex items-start gap-3.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-espresso text-sm font-bold text-cream">
                {i + 1}
              </span>
              <div>
                <div className="text-base font-bold">{step.title}</div>
                <div className="mt-0.5 text-sm leading-snug text-espresso/60">{step.desc}</div>
              </div>
            </li>
          ))}
        </ol>

        {/* CTAs */}
        <Link
          href="/"
          className="mb-3 block rounded-2xl bg-ember px-5 py-4 text-center text-lg font-bold text-cream shadow-[0_6px_18px_rgba(218,74,28,0.28)]"
        >
          {sw ? "Tembelea tovuti — Bure" : "Visit the website — Free"}
        </Link>
        <a
          href="/downloads/sumaiya.apk"
          className="mb-3 block rounded-2xl border-2 border-espresso px-5 py-3 text-center text-[15px] font-semibold text-espresso"
        >
          {sw ? "Au pakua App ya bure" : "Or download the free app"}
        </a>
        <p className="text-center text-[13px] leading-snug text-espresso/55">
          {sw ? "Bila kadi. Bila malipo. Simu yako inatosha." : "No card. No cost. Your phone is enough."}
        </p>
      </main>
    </div>
  );
}
