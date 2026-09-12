import { headers } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assembleUserContext } from "@/lib/assistant/context";
import { needsFollowUp } from "@/lib/applications";
import {
  briefHeadline,
  rankMatches,
  shapeFollowUps,
  type BriefMatch,
  type BriefFollowUp,
} from "@/lib/daily-brief";
import { Icon } from "@/components/ui/icon";
import type { Lang } from "@/lib/i18n/translations";

export const metadata: Metadata = { title: "Daily Brief — Sumaiya" };
export const dynamic = "force-dynamic";

export default async function BriefPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const lang = ((await headers()).get("x-lang") ?? "sw") as Lang;
  const sw = lang === "sw";

  // Guests → clear sign-in CTA (this slice is for signed-in users).
  if (!user) {
    return (
      <main id="main" tabIndex={-1} className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-card rounded-card-lg border border-border p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-ember-tint flex items-center justify-center mx-auto mb-3">
            <Icon name="spark" className="text-ember" size={22} />
          </div>
          <h1 className="font-display text-xl font-extrabold text-espresso mb-1">
            {sw ? "Briefi yako ya kila siku" : "Your daily brief"}
          </h1>
          <p className="text-sm text-text-body mb-5">
            {sw
              ? "Ingia ili nikupe nafasi mpya za kazi, maombi ya kufuatilia, na CV tayari kulengwa."
              : "Sign in so I can surface new roles, applications to follow up on, and ready-to-tailor CVs."}
          </p>
          <Link
            href="/sign-in?callbackUrl=/brief"
            className="inline-flex items-center gap-2 bg-ember text-cream font-semibold px-5 py-2.5 rounded-[10px] transition text-sm shadow-ember-hard hover:bg-ember-hover"
          >
            {sw ? "Ingia" : "Sign in"}
          </Link>
        </div>
      </main>
    );
  }

  // ── Assemble the brief from REAL data only ───────────────────────────────
  let brief = {
    headline: "",
    hasProfile: false,
    matches: [] as BriefMatch[],
    followUps: [] as BriefFollowUp[],
    jobsScanned: 0,
    generatedAt: new Date().toISOString(),
  };

  try {
    const ctx = await assembleUserContext(user.id);
    const hasProfile = Boolean(ctx.profile || ctx.activeCv);
    const matches = rankMatches(
      ctx.matchedJobs.map((j) => ({
        jobId: j.id,
        score: j.score,
        reason: j.reason,
        matchedTerms: [],
        job: {
          id: j.id,
          title: j.title,
          company: j.company,
          location: j.location,
          category: j.category,
          employmentType: j.employmentType,
          description: "",
          applyUrl: "",
          sourceName: "",
          applicationDeadline: j.applicationDeadline,
          createdAt: "",
        },
      })),
      3,
    );
    const followUps = shapeFollowUps(
      ctx.applications
        .filter((a) => needsFollowUp({ status: a.status, appliedAt: a.appliedAt, createdAt: a.createdAt ?? a.updatedAt }))
        .map((a) => ({
          id: a.id,
          title: a.title,
          companyName: a.companyName || null,
          status: a.status,
          appliedAt: a.appliedAt,
          createdAt: a.createdAt ?? a.updatedAt,
        })),
    );
    brief = {
      headline: briefHeadline(sw, hasProfile, matches, followUps),
      hasProfile,
      matches,
      followUps,
      jobsScanned: ctx.matchedJobs.length,
      generatedAt: new Date().toISOString(),
    };
  } catch {
    // Non-fatal: a warm, honest empty state — never a raw error.
    brief.headline = sw
      ? "Kuna hitilafu kidogo — jaribu tena baada ya muda."
      : "A small hiccup — please try again shortly.";
  }

  return (
    <main id="main" tabIndex={-1} className="max-w-4xl mx-auto px-4 py-8 lg:py-10 pb-tabbar md:pb-10">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-ember-hover mb-1">
            {sw ? "Briefi ya kila siku" : "Daily brief"}
          </p>
          <h1 className="font-display text-2xl font-extrabold text-espresso leading-tight">
            {brief.headline}
          </h1>
          <p className="text-xs text-text-muted mt-1.5">
            {sw
              ? `Imetengenezwa leo — nafasi ${brief.jobsScanned} zilichunguzwa. Hakuna kinachotumwa bila kibali chako.`
              : `Generated today — ${brief.jobsScanned} roles scanned. Nothing is sent without your approval.`}
          </p>
        </div>
      </div>

      {/* Profile CTA when missing */}
      {!brief.hasProfile && (
        <div className="mb-6 bg-gold-tint border border-gold/25 rounded-card-lg px-5 py-4">
          <p className="text-sm font-semibold text-espresso mb-0.5">
            {sw ? "Jenga Wasifu wako wa Kazi" : "Build your Career Profile"}
          </p>
          <p className="text-xs text-text-body mb-3">
            {sw
              ? "Ninahitaji wasifu wako (au CV) ili nikupe nafasi zinazokufaa kweli."
              : "I need your profile (or a CV) to match you to roles that genuinely fit."}
          </p>
          <Link
            href="/career-interview"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ember-hover hover:text-ember/80"
          >
            {sw ? "Anza hapa →" : "Start here →"}
          </Link>
        </div>
      )}

      {/* New matches */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-espresso mb-3 flex items-center gap-2">
          <Icon name="spark" size={16} className="text-ember" />
          {sw ? "Nafasi mpya zinazokufaa" : "New roles that fit you"}
        </h2>
        {brief.matches.length === 0 ? (
          <div className="bg-card rounded-card border border-border px-5 py-6 text-center">
            <p className="text-sm text-text-body">
              {brief.hasProfile
                ? sw
                  ? "Hakuna nafasi mpya zinazokufaa leo — njoo tena kesho."
                  : "No new roles fit you today — check back tomorrow."
                : sw
                  ? "Tengeneza wasifu ili kuona nafasi zinazokufaa."
                  : "Build your profile to see roles that fit you."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {brief.matches.map((m) => (
              <div key={m.jobId} className="bg-card rounded-card border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-espresso truncate">{m.title}</p>
                    <p className="text-xs text-text-body">
                      {[m.company, m.location].filter(Boolean).join(" · ") || sw ? "Nafasi ya kazi" : "Job role"}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs font-bold text-pine bg-pine-tint rounded-pill px-2.5 py-1">
                    {m.score}%
                  </span>
                </div>
                {m.reason && (
                  <p className="text-[11px] text-text-muted mt-2">{m.reason}</p>
                )}
                <div className="mt-3 flex items-center gap-2.5">
                  {m.actionable && (
                    <Link
                      href={`/snap?job=${encodeURIComponent(m.title)}`}
                      className="inline-flex items-center gap-1.5 bg-ember text-cream text-xs font-semibold px-3.5 py-2 rounded-[10px] transition hover:bg-ember-hover"
                    >
                      {sw ? "Lenga CV yangu" : "Tailor my CV"}
                    </Link>
                  )}
                  <Link
                    href={`/jobs?q=${encodeURIComponent(m.title)}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-ember-hover hover:text-ember/80"
                  >
                    {sw ? "Ona kazi →" : "View job →"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Follow-up nudges */}
      <section>
        <h2 className="text-sm font-bold text-espresso mb-3 flex items-center gap-2">
          <Icon name="mail" size={16} className="text-ember" />
          {sw ? "Maombi ya kufuatilia" : "Applications to follow up on"}
        </h2>
        {brief.followUps.length === 0 ? (
          <div className="bg-card rounded-card border border-border px-5 py-6 text-center">
            <p className="text-sm text-text-body">
              {sw
                ? "Hakuna maombi yanayohitaji kufuatiliwa sasa hivi."
                : "No applications need a follow-up right now."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {brief.followUps.map((f) => (
              <div key={f.applicationId} className="bg-card rounded-card border border-border p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-espresso truncate">{f.title}</p>
                  <p className="text-xs text-text-body">{f.company}</p>
                  <p className="text-[11px] text-text-muted mt-1">
                    {sw ? `Siku ${f.daysWaiting} zimepita` : `${f.daysWaiting} days waiting`}
                  </p>
                </div>
                <Link
                  href={`/applications/${f.applicationId}`}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 bg-card border border-border text-espresso text-xs font-semibold px-3.5 py-2 rounded-[10px] transition hover:border-text-muted"
                >
                  {sw ? "Fuatilia →" : "Follow up →"}
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trust footer */}
      <p className="mt-8 text-[11px] text-text-muted">
        {sw
          ? "Briefi hii inajengwa kutoka kwa data yako halisi pekee — hakuna nafasi au alama inayobuniwa. Kila hatua inahitaji kubofya kwako; Sumaiya haitumi kitu peke yake."
          : "This brief is built from your real data only — no job, match or score is invented. Every action needs your tap; Sumaiya never sends anything on her own."}
      </p>
    </main>
  );
}
