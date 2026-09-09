import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "../globals.css";
import { InstallPrompt } from "@/components/install-prompt";
import { SwRegister } from "@/components/sw-register";
import { IosInstallHint } from "@/components/ios-install-hint";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { MetaPixel } from "@/components/meta-pixel";
import { AnalyticsProvider } from "@/lib/analytics/provider";
import { ReferralCatch } from "@/components/referral/referral-catch";

// ─── App root layout (authed / dynamic routes) ────────────────────────────────
// Everything that is NOT public marketing lives here (dashboard, editors, auth,
// admin, assistant, studio…). These routes are inherently dynamic — they read
// the session cookie and per-user data — so keeping `headers()` for the
// language here costs nothing (they were never static). The URL is unchanged
// (route group `(app)` adds no segment); the middleware still sets `x-lang`.

const fontDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "optional",
  adjustFontFallback: true,
});
const fontBody = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "optional",
  adjustFontFallback: true,
});
const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "optional",
  adjustFontFallback: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#211A15",
};

export async function generateMetadata(): Promise<Metadata> {
  const sw = (await headers()).get("x-lang") !== "en";

  const title = sw
    ? "Jukwaa la Kazi lenye AI — Tengeneza CV Bila Malipo | Sumaiya"
    : "Sumaiya — AI Career Platform: CV, Job Match & Interview Prep";
  const description = sw
    ? "Tengeneza CV ya kitaalamu na barua za maombi ya kazi kwa dakika chache ukiwa na Sumaiya, msaidizi wako wa AI — templeti nzuri, upakuaji bila malipo, na kikagua ATS. Lengo moja: kupata ajira."
    : "Meet Sumaiya, your AI career assistant. Create a recruiter-ready CV and cover letters in minutes, run a free ATS check, and get matched to jobs. Free CV & resume builder for East Africa.";
  const keywords = sw
    ? ["tengeneza CV", "kutengeneza CV", "jinsi ya kutengeneza CV", "CV bila malipo", "CV bure", "mfano wa CV", "CV ya kazi", "wasifu", "barua ya maombi ya kazi", "template ya CV", "CV builder", "resume builder", "msaidizi wa CV AI"]
    : ["CV builder", "resume builder", "cover letter", "business card", "professional CV", "AI CV assistant", "ATS checker", "job application"];

  return {
    title: { default: title, template: "%s | Sumaiya" },
    description,
    keywords,
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://sumaiya.pro"),
    verification: { google: "EEvmVYFA7uKRmaktnH0hmFFnLMp6VPYq1Gux5c4g35E" },
    openGraph: {
      type: "website",
      siteName: "Sumaiya",
      title,
      description,
      locale: sw ? "sw_TZ" : "en_US",
      alternateLocale: sw ? ["sw_KE", "en_US"] : ["sw_KE", "sw_TZ"],
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Sumaiya — Professional CV & document builder with an AI assistant",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
    robots: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  };
}

export default async function AppRootLayout({ children }: { children: React.ReactNode }) {
  // Dynamic routes only — headers() is fine here (see header comment).
  const lang = (await headers()).get("x-lang") === "en" ? "en" : "sw";
  return (
    <html lang={lang} className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Sumaiya",
              url: "https://sumaiya.pro",
              description: "Create ATS-optimized CVs, cover letters, business cards and professional letters with an AI assistant that helps you get hired.",
              potentialAction: {
                "@type": "SearchAction",
                target: { "@type": "EntryPoint", urlTemplate: "https://sumaiya.pro/templates?q={search_term_string}" },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Sumaiya",
              url: "https://sumaiya.pro",
              logo: "https://sumaiya.pro/icon.svg",
              sameAs: [],
              description: "Professional document builder with an AI assistant — CVs, cover letters, business cards and formal letters.",
            }),
          }}
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[300] focus:bg-espresso focus:text-cream focus:px-4 focus:py-2 focus:rounded-[10px] focus:text-sm focus:font-semibold"
        >
          {lang === "sw" ? "Ruka hadi maudhui" : "Skip to content"}
        </a>
        {children}
        <ReferralCatch />
        <InstallPrompt />
        <SwRegister />
        <IosInstallHint />
        <Analytics />
        <SpeedInsights />
        <MetaPixel />
        <AnalyticsProvider />
      </body>
    </html>
  );
}
