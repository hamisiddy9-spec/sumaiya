import Link from "next/link";
import type { Metadata } from "next";
import { MarketingNav } from "@/components/ui/marketing-nav";
import { Footer } from "@/components/ui/footer";
import { BLOG_POSTS } from "@/lib/blog";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const sw = params.locale !== "en";
  return {
    alternates: alternatesFor("/blog", params.locale),
    title: sw ? "Blogu" : "Blog",
    description: sw
      ? "Ushauri wa vitendo kuhusu CV, barua za maombi na kutafuta ajira."
      : "Practical advice on CVs, cover letters and job hunting.",
  };
}

export default function BlogIndex() {
  const posts = [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <div className="min-h-screen bg-cream">
      <MarketingNav />

      <section className="bg-espresso">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 text-center">
          <p className="font-mono text-[11px] text-ember-hover tracking-[0.2em] uppercase mb-4">The blog</p>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-cream mb-4 tracking-tight">
            Get hired, faster
          </h1>
          <p className="text-text-muted max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            Practical advice on CVs, cover letters and job hunting.
          </p>
        </div>
      </section>

      <main id="main" tabIndex={-1} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`}
              className="group flex flex-col bg-card border border-border rounded-card overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
              <div className="h-28 bg-espresso relative flex items-end p-4">
                <div className="absolute inset-0 opacity-[0.12]" style={{ background: "radial-gradient(circle at 70% 30%, #F2A93B 0%, transparent 70%)" }} />
                <span className="relative font-mono text-[10px] uppercase tracking-[1.5px] text-gold">{p.category}</span>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h2 className="font-display font-bold text-espresso leading-snug group-hover:text-ember transition">{p.title}</h2>
                <p className="text-sm text-text-body leading-relaxed mt-2 flex-1">{p.excerpt}</p>
                <p className="text-[11px] text-text-muted mt-4 font-mono">
                  {new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {p.readMins} min read
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
