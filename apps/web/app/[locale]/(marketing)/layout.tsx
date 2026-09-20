import type { Metadata } from "next";
import { LangProvider } from "@/lib/i18n/context";
import type { Lang } from "@/lib/i18n/translations";
import { MarketingAuthProvider } from "@/components/ui/marketing-auth-context";
import { alternatesFor } from "@/lib/seo";

// Language-aware — this layout wraps the homepage and all marketing pages, so its
// title/description is what Google indexes for them. Swahili by default (the
// audience searches in Swahili), leading with the phrases people actually type.
// The plain string title inherits the root "%s | Sumaiya" template.
// NOTE: lang now comes from the URL `[locale]` segment (params), NOT headers() —
// the middleware rewrites every public path to /[locale]/…, so this layout and
// its children are statically prerendered at build time.
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const sw = params.locale !== "en";
  // The description is what a WhatsApp link preview shows, so it is the most
  // forwarded string this product owns — it must not name the mechanism in
  // Swahili. It used to read "Miundo inayopita ATS", which the lint pattern
  // missed (it looks for a preposition before "ATS"; "inayopita ATS" has none).
  const title = sw
    ? "Tengeneza CV Bila Malipo — Kwa Kiswahili"
    : "Sumaiya — write a CV that reaches the employer";
  const description = sw
    ? "Andika CV yako kwa Kiswahili, kwenye simu yako, bila malipo. Bandika tangazo la kazi na Sumaiya anakusaidia kuandika CV inayolingana nalo — kisha pakua PDF yako bila akaunti."
    : "Write your CV in Swahili or English, on your phone, free. Paste the job advert and Sumaiya helps you write the CV that matches it — then download your PDF with no account.";
  const keywords = sw
    ? ["tengeneza CV", "kutengeneza CV", "jinsi ya kutengeneza CV", "CV bila malipo", "msaidizi wa CV AI", "AI ya kutengeneza CV", "barua ya maombi ya kazi", "kadi ya biashara", "barua rasmi", "mfano wa CV", "CV ya kazi", "wasifu", "template ya CV", "CV builder", "resume builder"]
    : ["AI CV assistant", "AI resume writer", "CV", "resume", "cover letter", "business card", "formal letter", "ATS checker", "job application", "get hired"];

  // Absolute og/twitter image URL. Relative URLs in openGraph are resolved
  // against metadataBase, but we spell it out so the <meta> tags are complete
  // regardless of where the page is rendered (crawlers, link unfurlers, etc.).
  const ogImage = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sumaiya.app"}/og-image.png`;

  return {
    title,
    description,
    keywords,
    // The homepage cannot declare this itself — it is a "use client" component,
    // so it cannot export metadata, and it was the one marketing page shipping
    // with no canonical at all. Setting it on this layout covers the homepage,
    // while every other marketing page overrides it with its own path.
    // Only this layout and not the root: the root also wraps /dashboard and
    // /editor, and canonicalising those to "/" would be a lie.
    alternates: alternatesFor("/", params.locale),
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
          alt: "Sumaiya — write a CV that reaches the employer, in Swahili",
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
  // Clamp to a supported locale — a bare non-marketing path like `/editor`
  // falls through here with locale="editor", and an unclamped cast would make
  // `translations[lang]` undefined and 500 the whole marketing tree.
  const lang: Lang = params.locale === "en" ? "en" : "sw";

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
