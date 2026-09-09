import { MetadataRoute } from "next";

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
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sumaiya.pro"}/sitemap.xml`,
  };
}
