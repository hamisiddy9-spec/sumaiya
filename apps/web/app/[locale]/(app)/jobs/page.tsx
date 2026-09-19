import React from "react";
import { Metadata } from "next";
import { JobFeedClient } from "@/components/jobs/job-feed-client";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "jobs" });
  return {
    title: t("title", "Job Recommendations"),
    description: t(
      "description",
      "Discover personalized job recommendations based on your CV and skills"
    ),
  };
}

export default async function JobsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = (await params).locale;
  const sw = locale === "sw";

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-espresso mb-2">
            {sw ? "Ajira Zilizohusika" : "Recommended Jobs"}
          </h1>
          <p className="text-text-muted">
            {sw
              ? "Tafuta kazi zilizohusika na CV yako na ujuzi wako"
              : "Discover jobs matched to your CV and skills. Use the filters below to refine your search."}
          </p>
        </div>

        {/* Job Feed */}
        <JobFeedClient sw={sw} onSendCV={(jobId) => {
          // Open send-to-recruiter modal for this job
          // This will be integrated in a later task
          console.log("Send CV for job:", jobId);
        }} />
      </div>
    </div>
  );
}
