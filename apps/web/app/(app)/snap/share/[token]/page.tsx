import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { parseSnapShareToken } from "@/lib/api/snap-share";
import type { Lang } from "@/lib/i18n/translations";

// D4 — "Made with Sumaiya" share card. A snap result shared via
// /snap/share/<token> lands here. The token is signed + self-contained and
// carries ONLY the ATS score, a sanitized job title and the language — zero
// CV text, zero names, zero contact details — so this page is PII-free by
// construction (same contract as the public CV view, stricter: nothing to
// strip because nothing sensitive ever ships in the token).
//
// Unlisted by design (noindex) like public CVs — shareable by link, never in
// search. Tokens expire after 90 days; an expired/invalid link gets a warm
// state, never a fabricated card.

export const dynamic = "force-dynamic";

const STRINGS = {
  en: {
    badge: "Made with Sumaiya",
    kicker: "ATS match",
    genericTitle: "My tailored CV",
    sub: "Tailor your CV to any job in 30 seconds — free. No invented facts, just your real experience re-emphasized.",
    cta: "Tailor my CV — free",
    unavailableTitle: "This share link is no longer available",
    unavailableHint: "Share links expire after 90 days. Snap a new result any time — it takes 30 seconds.",
    trySnap: "Tailor my CV — free",
  },
  sw: {
    badge: "Imetengenezwa kwa Sumaiya",
    kicker: "Ulinganifu na Kazi",
    genericTitle: "CV iliyolengwa",
    sub: "Lenga CV yako kwa kazi yoyote kwa sekunde 30 — bure. Hakuna ukweli uliobuniwa, ni uzoefu wako halisi unaosisitizwa.",
    cta: "Lenga CV yako — bure",
    unavailableTitle: "Kiungo hiki cha kushiriki hakipatikani tena",
    unavailableHint: "Viungo vya kushiriki vinaisha baada ya siku 90. Snap matokeo mapya wakati wowote — inachukua sekunde 30.",
    trySnap: "Lenga CV yako — bure",
  },
} as const;

export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  const payload = parseSnapShareToken(params.token);
  const lang = ((await headers()).get("x-lang") ?? "sw") as Lang;
  const sw = lang === "sw";
  const noindex = { index: false, follow: false } as const;
  if (!payload) {
    return { title: "Sumaiya", robots: noindex };
  }
  const title = payload.j ? `${payload.s}% ATS — ${payload.j}` : `${payload.s}% ATS match`;
  const description = sw
    ? `Nimepata ${payload.s}% ya ulinganifu na kazi hii${payload.j ? ` kwa ${payload.j}` : ""} — imetengenezwa bure kwa Sumaiya.`
    : `I hit ${payload.s}% ATS match${payload.j ? ` for ${payload.j}` : ""} — made free with Sumaiya.`;
  return {
    title,
    description,
    robots: noindex,
    openGraph: { title, description, type: "website", images: ["opengraph-image"] },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SnapSharePage({ params }: { params: { token: string } }) {
  const payload = parseSnapShareToken(params.token);
  const lang = ((await headers()).get("x-lang") ?? "sw") as Lang;
  const s = STRINGS[lang];

  return (
    <main id="main" tabIndex={-1} className="min-h-dvh bg-sand flex flex-col">
      <div className="flex-1 w-full max-w-xl mx-auto px-4 py-10 sm:py-16">
        {payload ? (
          <div className="bg-card rounded-card-lg shadow-card border border-border p-6 sm:p-8 text-center">
            <Badge icon={<Sparkles className="w-3.5 h-3.5" />}>{s.badge}</Badge>

            <div className="mt-6 font-display text-espresso">
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">{s.kicker}</p>
              <p className="mt-1 text-7xl sm:text-8xl font-bold text-ember leading-none">{payload.s}%</p>
            </div>

            {payload.j && (
              <h1 className="mt-4 font-display text-espresso text-xl sm:text-2xl font-bold leading-snug">{payload.j}</h1>
            )}
            {!payload.j && (
              <h1 className="mt-4 font-display text-espresso text-xl sm:text-2xl font-bold">{s.genericTitle}</h1>
            )}

            <p className="mt-3 text-sm text-text-body leading-relaxed">{s.sub}</p>

            <Link
              href="/snap"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ember px-5 py-3.5 text-sm font-semibold text-cream shadow-ember-hard transition hover:bg-ember-hover"
            >
              <Target className="w-4.5 h-4.5" />
              {s.cta}
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-card-lg shadow-card border border-border p-6 sm:p-8 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 border border-warning/25 px-3 py-1 text-xs font-semibold text-warning">
              <Sparkles className="w-3.5 h-3.5" />
              {s.badge}
            </span>
            <h1 className="mt-5 font-display text-espresso text-xl sm:text-2xl font-bold">{s.unavailableTitle}</h1>
            <p className="mt-2 text-sm text-text-body">{s.unavailableHint}</p>
            <Link
              href="/snap"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ember px-5 py-3.5 text-sm font-semibold text-cream shadow-ember-hard transition hover:bg-ember-hover"
            >
              <Target className="w-4.5 h-4.5" />
              {s.trySnap}
            </Link>
          </div>
        )}

        <p className="pt-8 text-center text-[11px] uppercase tracking-widest text-text-muted">
          {s.badge} ✦
        </p>
      </div>
    </main>
  );
}
