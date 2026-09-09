import type { Metadata } from "next";
import { LangProvider } from "@/lib/i18n/context";
import type { Lang } from "@/lib/i18n/translations";
import { MarketingAuthProvider } from "@/components/ui/marketing-auth-context";

// Language-aware — this layout wraps the homepage and all marketing pages, so its
// title/description is what Google indexes for them. Swahili by default (the
// audience searches in Swahili), leading with the phrases people actually type.
// The plain string title inherits the root "%s | Sumaiya" template.
// NOTE: lang now comes from the URL `[locale]` segment (params), NOT headers() —
// the middleware rewrites every public path to /[locale]/…, so this layout and
// its children are statically prerendered at build time.
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const sw = params.locale !== "en";
  const title = sw
    ? "Jukwaa la Ajira lenye AI — Tengeneza CV Bila Malipo"
    : "Sumaiya — AI Career Platform: CV, Jobs & Interview Prep";
  const description = sw
    ? "Ongea na msaidizi wa AI kwa Kiswahili au Kiingereza akuandikie CV, barua ya kazi, kadi ya biashara au barua rasmi kwa dakika — bila malipo. Templeti zinazopita ATS, upakuaji wa PDF."
    : "Chat with an AI assistant in English or Swahili to create your CV, cover letter, business card or formal letter in minutes — free. ATS-ready templates, PDF download.";
  const keywords = sw
    ? ["tengeneza CV", "kutengeneza CV", "jinsi ya kutengeneza CV", "CV bila malipo", "msaidizi wa CV AI", "AI ya kutengeneza CV", "barua ya maombi ya kazi", "kadi ya biashara", "barua rasmi", "mfano wa CV", "CV ya kazi", "wasifu", "template ya CV", "CV builder", "resume builder"]
    : ["AI CV assistant", "AI resume writer", "CV", "resume", "cover letter", "business card", "formal letter", "ATS checker", "job application", "get hired"];

  // Absolute og/twitter image URL. Relative URLs in openGraph are resolved
  // against metadataBase, but we spell it out so the <meta> tags are complete
  // regardless of where the page is rendered (crawlers, link unfurlers, etc.).
  const ogImage = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sumaiya.pro"}/og-image.png`;

  return {
    title,
    description,
    keywords,
    openGraph: {
      siteName: "Sumaiya",
      type: "website",
      title,
      description,
      locale: sw ? "sw_TZ" : "en_US",
      // This layout's openGraph replaces the root layout's on marketing pages
      // (Next 14 shallow-merge drops the parent's images array), so the og
      // image MUST be declared here or marketing pages ship without og:image.
      images: [
        {
          url: ogImage,
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
      images: [ogImage],
    },
  };
}

export default function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const lang = (params.locale ?? "sw") as Lang;

  return (
    <LangProvider lang={lang}>
      {/* Signed-in users get the app's bottom tab bar on EVERY marketing page
          (tools, pricing, about, blog, home…), matching the dashboard. The auth
          state is now resolved CLIENT-side (MarketingAuthProvider sniffs the
          session cookie after hydration) so this layout stays static —
          previously it called supabase.auth.getSession() server-side, which
          forced every marketing page to render dynamically per hit. */}
      <MarketingAuthProvider>{children}</MarketingAuthProvider>
    </LangProvider>
  );
}
