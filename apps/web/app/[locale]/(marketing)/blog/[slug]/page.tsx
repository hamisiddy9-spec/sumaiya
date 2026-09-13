import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { MarketingNav } from "@/components/ui/marketing-nav";
import { Footer } from "@/components/ui/footer";
import { BLOG_POSTS, getPost } from "@/lib/blog";
import { CreateEntryButton } from "@/components/editor/create-entry-options";
import { alternatesFor } from "@/lib/seo";

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string; locale: string } }): Promise<Metadata> {
  const post = getPost(params.slug);
  if (!post) return { title: "Blog — Sumaiya" };
  return {
    title: `${post.title} — Sumaiya`,
    description: post.excerpt,
    alternates: alternatesFor(`/blog/${post.slug}`, params.locale),
    openGraph: {
      type: "article",
      title: `${post.title} | Sumaiya`,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      publishedTime: post.date,
      images: ["/og-image.png"],
    },
  };
}

export default function BlogPost({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  // BlogPosting structured data — lets the article earn richer search results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    articleSection: post.category,
    author: { "@type": "Organization", name: "Sumaiya" },
    publisher: {
      "@type": "Organization",
      name: "Sumaiya",
      logo: { "@type": "ImageObject", url: "https://sumaiya.app/icon.svg" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://sumaiya.app/blog/${post.slug}` },
  };

  return (
    <div className="min-h-screen bg-cream">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MarketingNav />

      <article className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-espresso transition mb-6">
          <ArrowLeft className="w-4 h-4" /> All posts
        </Link>

        <p className="font-mono text-[11px] uppercase tracking-[1.5px] text-ember-hover mb-3">{post.category}</p>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl text-espresso tracking-tight leading-tight">{post.title}</h1>
        <p className="text-xs text-text-muted mt-3 font-mono">
          {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · {post.readMins} min read
        </p>

        <div className="mt-8 space-y-4">
          {post.body.map((block, i) => {
            if (block.type === "h2") return <h2 key={i} className="font-display font-bold text-xl text-espresso pt-4">{block.text}</h2>;
            if (block.type === "li") return <li key={i} className="text-text-body leading-relaxed ml-5 list-disc">{block.text}</li>;
            return <p key={i} className="text-text-body leading-relaxed">{block.text}</p>;
          })}
        </div>

        <div className="mt-12 bg-espresso rounded-card-lg p-8 text-center">
          <h2 className="font-display font-bold text-xl text-cream mb-2">Put it into practice</h2>
          <p className="text-text-muted text-sm mb-6">Build an ATS-ready CV in minutes — free.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <CreateEntryButton docType="cv"
              className="inline-flex items-center gap-2 bg-ember hover:bg-ember-hover text-cream font-semibold px-7 py-3 rounded-input-lg transition shadow-ember-hard active:shadow-ember-active active:translate-y-[2px]">
              Start my CV <ChevronRight className="w-4 h-4" />
            </CreateEntryButton>
            <Link href="/ats-checker"
              className="inline-flex items-center gap-2 border border-cream/25 text-cream font-semibold px-7 py-3 rounded-input-lg hover:bg-espresso-2 transition">
              Check my CV&apos;s ATS score <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
