import { MetadataRoute } from "next";
import { TEMPLATES } from "@/types";
import { BLOG_POSTS } from "@/lib/blog";
import { PDF_TOOLS } from "@/lib/pdf-tools";

// Generated from the real data so it never drifts: every template landing page
// and every blog post is listed, not a hand-maintained subset.
//
// lastModified policy (Aug 2026): a fixed date for generated/static pages
// (LAST_CONTENT_PASS — the last time the templates/static content was touched)
// and each blog post's real publish date, so the sitemap stops churning on
// every build. `new Date()` per entry made every URL look freshly updated on
// each deploy, which dilutes the lastmod signal for crawlers.
const LAST_CONTENT_PASS = new Date("2026-08-19");

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sumaiya.app";

  // Single entry type for all lists so `lastModified` is a known optional
  // property (MetadataRoute.Sitemap[number]) everywhere below.
  type SitemapEntry = MetadataRoute.Sitemap[number];

  const staticPages: SitemapEntry[] = [
    { url: baseUrl, priority: 1.0, changeFrequency: "weekly" },
    { url: `${baseUrl}/templates`, priority: 0.9, changeFrequency: "weekly" },
    { url: `${baseUrl}/tools`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/ats-checker`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/snap-to-apply`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${baseUrl}/jobs`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${baseUrl}/assistant`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${baseUrl}/blog`, priority: 0.7, changeFrequency: "weekly" },
    { url: `${baseUrl}/about`, priority: 0.5, changeFrequency: "monthly" },
    { url: `${baseUrl}/contact`, priority: 0.4, changeFrequency: "monthly" },
    { url: `${baseUrl}/privacy`, priority: 0.2, changeFrequency: "yearly" },
    { url: `${baseUrl}/terms`, priority: 0.2, changeFrequency: "yearly" },
    { url: `${baseUrl}/cookies`, priority: 0.2, changeFrequency: "yearly" },
  ];

  const templatePages: SitemapEntry[] = TEMPLATES.map((t) => ({
    url: `${baseUrl}/templates/${t.id}`,
    priority: 0.6,
    changeFrequency: "monthly",
  }));

  const blogPages: SitemapEntry[] = BLOG_POSTS.map((p) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    priority: 0.5,
    changeFrequency: "monthly",
    lastModified: new Date(p.date), // real publish date from the post itself
  }));

  const toolPages: SitemapEntry[] = PDF_TOOLS.map((t) => ({
    url: `${baseUrl}/tools/${t.slug}`,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  return [...staticPages, ...templatePages, ...blogPages, ...toolPages].map((e) => ({
    ...e,
    // Blog posts keep their real publish date; everything else (templates,
    // tools, static pages) gets the fixed last-content-pass date so the
    // sitemap output is stable between builds.
    lastModified: e.lastModified ?? LAST_CONTENT_PASS,
  }));
}
