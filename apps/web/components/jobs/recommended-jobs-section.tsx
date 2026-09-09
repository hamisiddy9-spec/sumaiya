import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { Lang } from "@/lib/i18n/translations";
import { getRecommendations } from "@/lib/jobs/recommend";
import { SnapTailorButton } from "@/components/jobs/snap-tailor-button";

interface Props {
  userId: string;
  lang: Lang;
  limit?: number;
}

/**
 * "Jobs zako / Jobs for you" — top matches for the signed-in user's most recent
 * CV, rendered on the dashboard and pinned above the public feed. Server
 * component: reads the cached recommendations (recomputes on-demand when stale).
 * Renders nothing when the user has no CV or no meaningful match — no dead UI.
 */
export async function RecommendedJobsSection({ userId, lang, limit = 3 }: Props) {
  const sw = lang === "sw";
  let recs: Awaited<ReturnType<typeof getRecommendations>> = [];
  try {
    recs = await getRecommendations(userId, limit);
  } catch {
    recs = [];
  }
  if (!recs.length) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="briefcase" size={16} className="text-ember" />
          <h2 className="font-display font-bold text-lg text-espresso">
            {sw ? "Jobs zako" : "Jobs for you"}
          </h2>
        </div>
        <Link href="/jobs" className="flex items-center gap-1 text-sm font-semibold text-ember-hover hover:text-ember/80">
          {sw ? "Ona zote" : "View all"}
          <Icon name="chevron-right" size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {recs.map((r) => (
          <div
            key={r.jobId}
            className="bg-card border border-border rounded-card p-4 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-[11px] font-mono uppercase tracking-wider text-ember-hover">
                  {r.job.company || r.job.sourceName}
                </p>
                <h3 className="font-semibold text-espresso text-sm leading-snug line-clamp-2">
                  {r.job.title}
                </h3>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-pine bg-pine-tint rounded-full px-2 py-0.5">
                {r.score}%
              </span>
            </div>

            <div className="flex items-center gap-2 text-[12px] text-text-muted mb-2">
              {r.job.location && (
                <span className="inline-flex items-center gap-1 min-w-0">
                  <Icon name="map-pin" size={12} className="flex-shrink-0" />
                  <span className="truncate">{r.job.location}</span>
                </span>
              )}
              {r.job.employmentType && (
                <span className="truncate">· {r.job.employmentType}</span>
              )}
            </div>

            <p className="text-[12px] text-text-body mb-3 line-clamp-2 flex-1">{r.reason}</p>

            <div className="flex flex-wrap items-center gap-3">
              <SnapTailorButton
                lang={lang}
                title={r.job.title}
                company={r.job.company}
                description={r.job.description}
              />
              <a
                href={r.job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-ember-hover hover:text-ember/80"
              >
                {sw ? "Omba" : "Apply"}
                <Icon name="chevron-right" size={13} />
              </a>
              <span className="ml-auto text-[11px] text-text-muted">{r.job.sourceName}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
