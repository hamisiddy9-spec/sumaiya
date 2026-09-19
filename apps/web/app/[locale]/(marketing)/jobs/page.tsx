export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { JobsFeed } from "@/components/jobs/jobs-feed";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { job } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Job Listings | Sumaiya",
  description: "Explore job opportunities from top employers. Sign in to match your CV and apply.",
};

export default async function PublicJobsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = (await params).locale;
  const sw = locale === "sw";

  let jobs: (typeof job.$inferSelect)[] = [];
  try {
    jobs = await db.select()
      .from(job)
      .where(eq(job.status, "published"))
      .orderBy(desc(job.createdAt))
      .limit(100);
  } catch {
    jobs = [];
  }

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-espresso mb-2">
            {sw ? "Nafasi za Kazi" : "Job Listings"}
          </h1>
          <p className="text-text-muted mb-6">
            {sw
              ? "Tafuta kazi zilizofungwa na ajira zote. Ingia akaunti yako kukamatia CV yako na kuomba moja kwa moja."
              : "Explore job opportunities from top employers. Sign in to match your CV and apply directly."}
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link href={`/${locale}/auth/signup`}>
              <Button>
                {sw ? "Ingia akaunti / Jiandikishe" : "Sign in or Sign up"}
              </Button>
            </Link>
            <Link href={`/${locale}`}>
              <Button variant="secondary">
                {sw ? "Nyumbani" : "Home"}
              </Button>
            </Link>
          </div>
        </div>

        {/* Jobs Feed (read-only for public) */}
        {jobs.length > 0 ? (
          <JobsFeed
            lang={sw ? "sw" : "en"}
            jobs={jobs.map((j) => ({
              id: j.id,
              title: j.title,
              company: j.company || "Unknown",
              description: j.description || "",
              location: j.location || "",
              category: j.category || "",
              employmentType: j.employmentType || "",
              applyUrl: j.applyUrl || `/${locale}/auth/signup`,
              status: j.status || "published",
              featured: j.featured || false,
              applicationDeadline: j.applicationDeadline?.toISOString() || null,
              sourceName: j.sourceName || "Sumaiya",
              createdAt: j.createdAt?.toISOString() || new Date().toISOString(),
              matchScore: null,
              missing: [],
            }))}
            signedIn={false}
            hasCv={false}
            latestCvId={null}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-text-muted mb-4">
              {sw
                ? "Hakuna nafasi za kazi zinazopatikana sasa. Jaribu baadaye."
                : "No job listings available right now. Please check back later."}
            </p>
          </div>
        )}

        {/* Sign-up CTA */}
        <div className="mt-12 p-6 bg-gradient-to-r from-pine-tint to-sage-tint rounded-lg border border-pine/20">
          <h2 className="text-2xl font-bold text-espresso mb-2">
            {sw ? "Jifanyie haraka" : "Ready to apply?"}
          </h2>
          <p className="text-text-body mb-4">
            {sw
              ? "Jiandikishe na kujenga CV yako katika dakika chache. Kisha hii, unaweza kamatia kazi moja kwa moja."
              : "Sign up and build your CV in minutes. Then, you can apply to jobs directly and get matched with opportunities."}
          </p>
          <Link href={`/${locale}/auth/signup`}>
            <Button size="lg" className="bg-pine hover:bg-pine-hover">
              {sw ? "Jiandikishe Sasa" : "Sign Up Now"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
