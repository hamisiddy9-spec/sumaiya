import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { MarketingNav } from "@/components/ui/marketing-nav";
import { Footer } from "@/components/ui/footer";
import { DownloadApkButton } from "@/components/marketing/download-apk-button";
import { alternatesFor } from "@/lib/seo";

// Where the signed release APK is served from. Build it with EAS, then drop the
// file at apps/web/public/sumaiya.apk so it is served at /sumaiya.apk. Bump the
// version label when you ship a new build.
const APK_URL = "/sumaiya.apk";
const APK_VERSION = "1.8.2";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const sw = params.locale !== "en";
  return {
    alternates: alternatesFor("/pakua", params.locale),
    title: sw ? "Pakua App" : "Download App",
    description: sw
      ? "Pakua app ya Sumaiya kwa Android — bure. Tengeneza CV, barua za maombi na utafute kazi, kwa Kiswahili."
      : "Download the Sumaiya Android app — free. Build CVs, cover letters and find jobs, in Kiswahili or English.",
  };
}

export default function PakuaPage({ params }: { params: { locale: string } }) {
  const sw = params.locale !== "en";

  const steps = sw
    ? [
        "Bofya **Pakua app** hapo juu. Faili `sumaiya.apk` litaanza kupakuliwa.",
        "Likiisha, **fungua faili** — kutoka kwenye arifa, au folda ya *Downloads*.",
        "Android itaonyesha onyo: *“Kwa usalama, simu imezuia kusakinisha app kutoka chanzo hiki.”* Hii ni **kawaida** kwa app zisizotoka Play Store — si kwamba app ina hatari.",
        "Bofya **Mipangilio (Settings)**, kisha washa **“Ruhusu kutoka chanzo hiki”**.",
        "Rudi nyuma, bofya **Sakinisha (Install)**.",
        "Ikiwa *Play Protect* itaonya, bofya **“Sakinisha hata hivyo” (Install anyway)**.",
        "Fungua **Sumaiya** — anza bure.",
      ]
    : [
        "Tap **Download app** above. The file `sumaiya.apk` will start downloading.",
        "When it finishes, **open the file** — from the notification, or your *Downloads* folder.",
        "Android shows a warning: *“For your security, your phone is blocked from installing apps from this source.”* This is **normal** for apps not yet on the Play Store — it does not mean the app is unsafe.",
        "Tap **Settings**, then turn on **“Allow from this source”**.",
        "Go back and tap **Install**.",
        "If *Play Protect* warns you, tap **“Install anyway”**.",
        "Open **Sumaiya** — start free.",
      ];

  // Render **bold** and *italic* markers without a markdown lib.
  const fmt = (s: string) =>
    s
      .split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/)
      .filter(Boolean)
      .map((part, i) => {
        if (part.startsWith("**")) return <strong key={i} className="font-semibold text-espresso">{part.slice(2, -2)}</strong>;
        if (part.startsWith("`")) return <code key={i} className="font-mono text-[0.9em] bg-espresso/5 px-1 rounded">{part.slice(1, -1)}</code>;
        if (part.startsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;
        return <span key={i}>{part}</span>;
      });

  return (
    <>
      <MarketingNav />
      <main id="main" className="bg-sand min-h-screen">
        <div className="max-w-xl mx-auto px-4 py-16 md:py-20">
          <header className="text-center mb-10">
            <h1 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight text-espresso mb-3">
              {sw ? "Pakua Sumaiya" : "Download Sumaiya"}
            </h1>
            <p className="text-text-muted max-w-md mx-auto">
              {sw
                ? "App ya Android — bure. CV, barua za maombi na kutafuta kazi, mkononi mwako."
                : "The Android app — free. CVs, cover letters and job search, in your pocket."}
            </p>
          </header>

          <div className="flex flex-col items-center gap-3 mb-12">
            <DownloadApkButton
              href={APK_URL}
              label={sw ? "Pakua app — ni bure" : "Download app — free"}
            />
            <p className="text-xs text-text-muted">
              Android · APK · v{APK_VERSION} ·{" "}
              <span>{sw ? "haina gharama" : "no cost"}</span>
            </p>
          </div>

          <section className="rounded-2xl bg-white border border-black/5 p-6 md:p-8 shadow-sm">
            <h2 className="font-display font-bold text-xl text-espresso mb-5">
              {sw ? "Jinsi ya kusakinisha" : "How to install"}
            </h2>
            <ol className="flex flex-col gap-4">
              {steps.map((s, i) => (
                <li key={i} className="flex items-start gap-3.5">
                  <span className="flex-none flex items-center justify-center w-7 h-7 rounded-full bg-gold text-espresso font-display font-extrabold text-sm">
                    {i + 1}
                  </span>
                  <span className="text-[0.97rem] leading-relaxed text-espresso/90 pt-0.5">{fmt(s)}</span>
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-gold-tint border border-gold/30 p-5">
            <ShieldCheck className="h-5 w-5 flex-none text-gold-text mt-0.5" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-espresso/90">
              {sw ? (
                <>
                  <strong className="font-semibold">Kwa nini onyo hili?</strong> Sumaiya bado haijawekwa Play Store,
                  kwa hiyo Android huonya kila app inayopakuliwa moja kwa moja. Si ishara ya hatari — app ni salama,
                  na data yako ni yako. Tutakuwa Play Store hivi karibuni.
                </>
              ) : (
                <>
                  <strong className="font-semibold">Why the warning?</strong> Sumaiya isn&rsquo;t on the Play Store yet,
                  so Android warns about any directly-downloaded app. It&rsquo;s not a sign of danger — the app is safe and
                  your data is yours. We&rsquo;ll be on the Play Store soon.
                </>
              )}
            </p>
          </div>

          <p className="text-center text-sm text-text-muted mt-8">
            {sw ? "Hutaki kupakua? Itumie moja kwa moja kwenye kivinjari — " : "Don’t want to download? Use it right in your browser — "}
            <Link href="/editor/cv/try" className="text-espresso font-semibold underline underline-offset-2">
              {sw ? "tengeneza CV bure" : "build a CV free"}
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
