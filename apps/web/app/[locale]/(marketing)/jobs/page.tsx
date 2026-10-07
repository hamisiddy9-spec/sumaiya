import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db, job, cv } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import type { Lang } from "@/lib/i18n/translations";
import type { Metadata } from "next";
import { MarketingNav } from "@/components/ui/marketing-nav";
import { Footer } from "@/components/ui/footer";
import { parseCVData } from "@/types";
import { getCVTerms, extractTerms, scoreTerms } from "@/lib/job-match";
import { JobsFeed } from "@/components/jobs/jobs-feed";
import { RecommendedJobsSection } from "@/components/jobs/recommended-jobs-section";
import { liveStatusFilter } from "@/lib/jobs/lifecycle";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const sw = params.locale !== "en";
  return {
    title: sw ? "Ajira — vinjari nafasi, kisha uone ulinganifu wako" : "Jobs — browse openings, then see your match",
    description: sw
      ? "Nafasi nilizokusanya kutoka vyanzo vinavyoaminika. Vinjari bure, na ukishakuwa na CV hapa, uone unavyolingana na kila moja, kisha fungua tangazo kwenye tovuti ya mwajiri."
      : "Openings I've gathered from trusted sources. Browse them free, and once you have a CV here, see how you match each one, then open the advert on the employer's site.",
    alternates: alternatesFor("/jobs", params.locale),
  };
}

export const dynamic = "force-dynamic";

// FeedJob is defined in the pure feed-filter module (single source of truth)
// and re-exported here so the page's props type matches the client's.
import type { FeedJob } from "@/lib/jobs/feed-filter";
import { alternatesFor } from "@/lib/seo";
export type { FeedJob } from "@/lib/jobs/feed-filter";

export default async function JobsPage({ params }: { params: { locale: string } }) {
  const lang = (params.locale ?? "sw") as Lang;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Guard the read: until the 0004_jobs_lifecycle migration runs the new
  // columns won't exist, and the empty-state UI is the documented behaviour —
  // not a 500.
  let jobs: (typeof job.$inferSelect)[] = [];
  try {
    jobs = await db
      .select()
      .from(job)
      .where(liveStatusFilter())
      .orderBy(desc(job.featured), desc(job.createdAt))
      .limit(100);
  } catch {
    jobs = [];
  }

  // If signed in, score each job against the user's most recent CV.
  let cvTermsSet: Set<string> | null = null;
  let latestCvId: string | null = null;
  if (user) {
    const [c] = await db.select({ id: cv.id, data: cv.data }).from(cv).where(eq(cv.userId, user.id)).orderBy(desc(cv.updatedAt)).limit(1);
    if (c) {
      latestCvId = c.id;
      try { cvTermsSet = getCVTerms(parseCVData(c.data)); } catch { cvTermsSet = null; }
    }
  }

  const feed: FeedJob[] = jobs.map((j) => {
    let matchScore: number | null = null;
    let missing: string[] = [];
    if (cvTermsSet && j.description.trim()) {
      const m = scoreTerms(extractTerms(j.description), cvTermsSet);
      matchScore = m.score;
      missing = m.missing.slice(0, 8);
    }
    return {
      id: j.id, title: j.title, company: j.company, location: j.location,
      category: j.category, employmentType: j.employmentType, description: j.description,
      applyUrl: j.applyUrl, status: j.status, featured: j.featured,
      applicationDeadline: j.applicationDeadline?.toISOString() ?? null,
      sourceName: j.sourceName, createdAt: j.createdAt.toISOString(), matchScore, missing,
    };
  });

  // Best matches first for signed-in users; newest first otherwise.
  if (cvTermsSet) feed.sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));

  return (
    <main id="main" tabIndex={-1} className="min-h-screen bg-sand">
      <MarketingNav />
      <div className="max-w-5xl mx-auto px-4 pt-8">
        {user && latestCvId && (
          <RecommendedJobsSection userId={user.id} lang={lang} limit={3} />
        )}
      </div>
      <JobsFeed lang={lang} jobs={feed} signedIn={!!user} hasCv={!!latestCvId} latestCvId={latestCvId} />
      <Footer />
    </main>
  );
}
