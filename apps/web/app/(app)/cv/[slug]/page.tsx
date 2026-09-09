import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db, cv } from "@/lib/db";
import { parseCVData, type CVData } from "@/types";
import type { Lang } from "@/lib/i18n/translations";
import { Logo } from "@/components/ui/logo";
import { PublicCvView } from "@/components/public/public-cv-view";

// A shared CV is served fresh from the DB and never cached at a user level.
export const dynamic = "force-dynamic";

interface PublicCvRow {
  data: CVData;
  templateId: string;
  primaryColor: string;
  fontFamily: string;
  publicShowContact: boolean;
}

// Fetch ONLY a CV that its owner has explicitly made public. The query is scoped
// to (public_slug = slug AND is_public = true), so a private CV can never be
// reached by guessing a slug, and toggling share off takes it offline instantly.
async function getPublicCv(slug: string): Promise<PublicCvRow | null> {
  if (!slug) return null;
  try {
    const [row] = await db
      .select({
        data: cv.data,
        templateId: cv.templateId,
        primaryColor: cv.primaryColor,
        fontFamily: cv.fontFamily,
        publicShowContact: cv.publicShowContact,
      })
      .from(cv)
      .where(and(eq(cv.publicSlug, slug), eq(cv.isPublic, true)))
      .limit(1);
    if (!row) return null;
    const data = parseCVData(row.data);
    // Honour the owner's "hide contact" choice — strip EVERY reachable/PII detail
    // from the public copy so a shared link can't leak a phone number, address, or
    // (critically) a referee's contact — that's a third party who never consented
    // to being published. Templates render all of these, so they must be cleared
    // here, server-side, before the data ever reaches the client.
    if (!row.publicShowContact) {
      data.personal = { ...data.personal, email: "", phone: "", location: "", linkedin: "", website: "" };
      data.referees = (data.referees ?? []).map((r) => ({ ...r, email: "", phone: "" }));
    }
    return { ...row, data };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const row = await getPublicCv(params.slug);
  // Unlisted by design: shareable by link, NEVER indexed by search engines, so
  // personal details are not searchable.
  const noindex = { index: false, follow: false } as const;
  if (!row) return { title: "CV", robots: noindex };
  const name = row.data.personal.fullName?.trim() || "CV";
  const title = row.data.personal.jobTitle?.trim() ? `${name} — ${row.data.personal.jobTitle.trim()}` : name;
  return {
    title,
    description: `${name} · CV`,
    robots: noindex,
    openGraph: { title, type: "profile", images: ["opengraph-image"] },
    twitter: { card: "summary_large_image", title },
  };
}

export default async function PublicCvPage({ params }: { params: { slug: string } }) {
  const row = await getPublicCv(params.slug);
  if (!row) notFound();

  const lang = ((await headers()).get("x-lang") ?? "sw") as Lang;
  const sw = lang === "sw";

  return (
    <div className="min-h-dvh bg-sand-2 flex flex-col">
      <main className="flex-1 w-full px-3 sm:px-6 pt-6 sm:pt-10 pb-28">
        <PublicCvView
          data={row.data}
          templateId={row.templateId}
          primaryColor={row.primaryColor}
          fontFamily={row.fontFamily}
          lang={lang}
        />
      </main>

      {/* Viral hook — a tasteful, sticky "made with Sumaiya" bar. Every
          shared CV quietly recruits the next user. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Logo size="sm" />
          <p className="text-xs text-text-body leading-tight min-w-0 flex-1 truncate">
            {sw ? "Imetengenezwa bila malipo na Sumaiya." : "Made free with Sumaiya."}
          </p>
          <Link
            href="/editor/cv/try?ref=cv-share"
            className="ml-auto shrink-0 inline-flex items-center gap-1.5 bg-ember hover:bg-ember-hover text-cream text-sm font-semibold px-4 py-2 rounded-input shadow-ember-hard active:translate-y-[1px] transition-all"
          >
            {sw ? "Tengeneza CV yako" : "Build your CV"}
          </Link>
        </div>
      </div>
    </div>
  );
}
