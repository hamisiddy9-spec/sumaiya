import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo";
import LandingPage from "./home-page-client";

/**
 * Why the homepage is a server component wrapping a client one.
 *
 * It was a single `"use client"` file, and a client component cannot export
 * `generateMetadata`. So the homepage was the ONE marketing page that shipped
 * with no canonical and no hreflang at all — verified against production: `/`
 * and `/en` both returned zero `rel="canonical"` and zero `hreflang` tags, while
 * /snap-to-apply, /templates and the rest carried them. Title and description
 * came from the (marketing) layout; the alternates had nowhere to live.
 *
 * For a product whose whole pitch is bilingual, that is the wrong page to leave
 * out: it is the one search engines index first, and without hreflang nothing
 * told them `/` and `/en` are translations rather than duplicates — so the
 * English homepage competed with the Swahili one for the same queries.
 *
 * The page body is unchanged; it moved to ./home-page-client.tsx so that this
 * file can be a server component and declare the alternates.
 */

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  // Only `alternates` is returned deliberately: Next merges page metadata over
  // layout metadata field by field, so the layout's titles, descriptions,
  // keywords and openGraph (which are already localized) survive untouched.
  // Restating them here would be a second source of truth for the same strings.
  return { alternates: alternatesFor("/", params.locale) };
}

export default function Page() {
  return <LandingPage />;
}
