import { MetadataRoute } from "next";
import { CANONICAL_ORIGIN } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Allow the public guest builders (/editor/<type>/try) — high-intent
      // landing pages — while still blocking the per-user authed editors
      // (/editor/<type>/<id>). A more specific Allow overrides the Disallow.
      allow: ["/", "/editor/cv/try", "/editor/cover-letter/try", "/editor/business-card/try", "/editor/letter/try"],
      disallow: ["/api/", "/dashboard/", "/editor/", "/settings/", "/sign-in", "/verify"],
    },
    // MUST be absolute — the spec requires it and an empty NEXT_PUBLIC_APP_URL had been
    // shipping `Sitemap: /sitemap.xml` (see CANONICAL_ORIGIN for the whole story).
    sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
  };
}
