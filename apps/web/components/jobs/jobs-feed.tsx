"use client";

// Jobs discovery feed — every listing shows how well the signed-in user's CV
// matches it, and "Track this job" spins up an Application (CV attached, score
// stored) in one tap. The wedge into the "middleman" position: useful to a
// seeker before any employer shows up.

import { useState, useMemo } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { TargetedCvDrawer } from "@/components/jobs/targeted-cv-drawer";
import { SnapTailorButton } from "@/components/jobs/snap-tailor-button";
import { matchTone } from "@/lib/match-ui";
import { cleanHtml } from "@/lib/jobs/text";
import type { Lang } from "@/lib/i18n/translations";
import {
  filterJobs, sortJobs, groupByRecency, topLocations, topCategories,
  REMOTE_LOCATION, DEFAULT_FILTERS,
  type FeedJob, type SortMode, type ScoreFilter, type RecencyFilter,
} from "@/lib/jobs/feed-filter";

interface JobsFeedProps {
  lang: Lang;
  jobs: FeedJob[];
  signedIn: boolean;
  hasCv: boolean;
  latestCvId: string | null;
}


function timeAgo(iso: string, sw: boolean): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const days = Math.floor((now - then) / 86_400_000);
  if (days <= 0) return sw ? "Leo" : "Today";
  if (days === 1) return sw ? "Jana" : "Yesterday";
  if (days < 7) return sw ? `Siku ${days} zilizopita` : `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return sw ? `Wiki ${weeks} zilizopita` : `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return sw ? `Miezi ${months} iliyopita` : `${months}mo ago`;
}

/** "Deadline: 25 Aug" — localized-ish short format. */
function deadlineLabel(iso: string, sw: boolean): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.toLocaleString(sw ? "sw-TZ" : "en", { month: "short" });
  const year = d.getFullYear() === new Date().getFullYear() ? "" : ` ${d.getFullYear()}`;
  return `${day} ${month}${year}`;
}

/** True when the listing is closing within EXPIRING_WINDOW_DAYS (3 days). */
function isClosingSoon(j: FeedJob, now = Date.now()): boolean {
  if (j.status === "expiring") return true;
  if (j.applicationDeadline) {
    const ms = new Date(j.applicationDeadline).getTime() - now;
    if (ms >= 0 && ms <= 3 * 86_400_000) return true;
  }
  return false;
}

export function JobsFeed({ lang, jobs, signedIn, hasCv, latestCvId }: JobsFeedProps) {
  const sw = lang === "sw";
  const canScore = signedIn && hasCv;
  const [query, setQuery] = useState(DEFAULT_FILTERS.query);
  const [category, setCategory] = useState(DEFAULT_FILTERS.category);
  const [location, setLocation] = useState(DEFAULT_FILTERS.location);
  const [minScore, setMinScore] = useState<ScoreFilter>(DEFAULT_FILTERS.minScore);
  const [recency, setRecency] = useState<RecencyFilter>(DEFAULT_FILTERS.recency);
  // Guests default to newest; signed-in users with a CV default to best match.
  const [sort, setSort] = useState<SortMode>(canScore ? "match" : "newest");
  const [tracking, setTracking] = useState<string | null>(null);
  const [error, setError] = useState("");

  const categories = useMemo(() => topCategories(jobs), [jobs]);
  const locations = useMemo(() => topLocations(jobs), [jobs]);

  const filtered = useMemo(
    () => filterJobs(jobs, { query, category, location, minScore, recency }),
    [jobs, query, category, location, minScore, recency],
  );

  const sorted = useMemo(() => sortJobs(filtered, sort), [filtered, sort]);

  // Recency bands make the newest-sort scannable; match/closing sorts are flat.
  const groups = useMemo(
    () => (sort === "newest" ? groupByRecency(sorted) : [{ key: "all" as const, jobs: sorted }]),
    [sort, sorted],
  );

  async function trackJob(j: FeedJob) {
    if (tracking) return;
    if (!signedIn) {
      window.location.href = `/sign-in?callbackUrl=${encodeURIComponent("/jobs")}`;
      return;
    }
    if (!hasCv || !latestCvId) {
      window.location.href = "/editor/cv/new";
      return;
    }
    setTracking(j.id);
    setError("");
    try {
      const res = await fetch("/api/applications/from-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvId: latestCvId,
          jobTitle: j.title,
          companyName: j.company || undefined,
          jobDescription: j.description || undefined,
          matchScore: j.matchScore ?? undefined,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        data?: { id?: string };
        error?: string;
      };
      if (json.success && json.data?.id) {
        window.location.href = `/applications/${json.data.id}`;
        return;
      }
      setError(
        json.error ||
          (sw ? "Imeshindwa kuanza kufuatilia. Jaribu tena." : "Couldn't start tracking. Please try again.")
      );
    } catch {
      setError(sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again.");
    } finally {
      setTracking(null);
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-espresso">
          {sw ? "Ajira" : "Jobs"}
        </h1>
        <p className="text-sm text-text-muted mt-1.5 max-w-2xl">
          {signedIn && hasCv
            ? sw
              ? "Kila kazi imepimwa dhidi ya CV yako. Bofya “Fuatilia” kuanzisha ombi lako mara moja."
              : "Every job is scored against your CV. Tap “Track” to start an application instantly."
            : sw
              ? "Vinjari kazi kisha uunganishe CV yako uone jinsi inavyofanana na kila nafasi."
              : "Browse roles, then attach your CV to see how well you match each one."}
        </p>
      </div>

      {/* Sign-in / CV nudge */}
      {(!signedIn || !hasCv) && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 bg-ember-tint/40 border border-ember-tint rounded-card px-4 py-3">
          <div className="flex items-start gap-2.5 flex-1">
            <div className="w-8 h-8 rounded-lg bg-ember-tint flex items-center justify-center shrink-0">
              <Icon name="target" className="text-ember" size={16} />
            </div>
            <p className="text-xs text-espresso leading-relaxed">
              {!signedIn
                ? sw
                  ? "Ingia na uunde CV yako bila malipo ili kuona alama zako za kufanana kwa kila kazi."
                  : "Sign in and build a free CV to unlock your match score on every job."
                : sw
                  ? "Unda CV yako ili kuona jinsi unavyofanana na kila kazi hapa."
                  : "Create a CV to see how well you match each job here."}
            </p>
          </div>
          <Button
            href={!signedIn ? `/sign-in?callbackUrl=${encodeURIComponent("/jobs")}` : "/editor/cv/new"}
            size="sm"
            className="shrink-0"
          >
            {!signedIn ? (sw ? "Ingia" : "Sign in") : sw ? "Unda CV" : "Build a CV"}
            <Icon name="chevron-right" size={14} />
          </Button>
        </div>
      )}

      {/* Search + filters */}
      <div className="mb-5 space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              <Icon name="search" size={16} />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={sw ? "Tafuta jina, kampuni, mji…" : "Search title, company, city…"}
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-card border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember placeholder:text-text-muted/60"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            aria-label={sw ? "Panga" : "Sort"}
            className="sm:w-48 px-3 py-2.5 text-sm bg-card border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember text-text-body"
          >
            <option value="newest">{sw ? "Mpya zaidi" : "Newest"}</option>
            {canScore && <option value="match">{sw ? "Zinazofanana zaidi" : "Best match"}</option>}
            <option value="closing">{sw ? "Zinafungwa karibu" : "Closing soon"}</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {categories.length > 0 && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label={sw ? "Kategoria" : "Category"}
              className="sm:w-52 px-3 py-2.5 text-sm bg-card border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember text-text-body"
            >
              <option value="">{sw ? "Kategoria zote" : "All categories"}</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
          {locations.length > 0 && (
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              aria-label={sw ? "Eneo" : "Location"}
              className="sm:w-52 px-3 py-2.5 text-sm bg-card border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember text-text-body"
            >
              <option value="">{sw ? "Maeneo yote" : "All locations"}</option>
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l === REMOTE_LOCATION ? (sw ? "Kazi za mbali" : "Remote") : l}
                </option>
              ))}
            </select>
          )}
          <select
            value={recency}
            onChange={(e) => setRecency(e.target.value as RecencyFilter)}
            aria-label={sw ? "Muda" : "Posted"}
            className="sm:w-44 px-3 py-2.5 text-sm bg-card border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember text-text-body"
          >
            <option value="any">{sw ? "Muda wowote" : "Any time"}</option>
            <option value="7d">{sw ? "Siku 7 zilizopita" : "Last 7 days"}</option>
            <option value="14d">{sw ? "Siku 14 zilizopita" : "Last 14 days"}</option>
            <option value="30d">{sw ? "Siku 30 zilizopita" : "Last 30 days"}</option>
          </select>
          {canScore && (
            <select
              value={minScore}
              onChange={(e) => setMinScore(e.target.value as ScoreFilter)}
              aria-label={sw ? "Alama ya kufanana" : "Match score"}
              className="sm:w-48 px-3 py-2.5 text-sm bg-card border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember text-text-body"
            >
              <option value="any">{sw ? "Alama yoyote" : "Any match"}</option>
              <option value="50">{sw ? "Alama 50%+" : "50%+ match"}</option>
              <option value="70">{sw ? "Alama 70%+" : "70%+ match"}</option>
              <option value="90">{sw ? "Alama 90%+" : "90%+ match"}</option>
            </select>
          )}
          {(query || category || location || minScore !== "any" || recency !== "any") && (
            <button
              onClick={() => {
                setQuery(DEFAULT_FILTERS.query);
                setCategory(DEFAULT_FILTERS.category);
                setLocation(DEFAULT_FILTERS.location);
                setMinScore(DEFAULT_FILTERS.minScore);
                setRecency(DEFAULT_FILTERS.recency);
              }}
              className="inline-flex items-center px-3 py-2.5 text-sm font-medium text-ember-hover hover:text-ember transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/60 focus-visible:ring-offset-1 focus-visible:ring-offset-cream"
            >
              {sw ? "Ondoa vichujio" : "Clear filters"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-input px-3 py-2">{error}</p>
      )}

      {/* Results count */}
      <p className="text-[11px] text-text-muted mb-3">
        {filtered.length} {filtered.length === 1 ? (sw ? "kazi" : "job") : sw ? "kazi" : "jobs"}
      </p>

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="bg-card rounded-card border border-border px-6 py-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-sand flex items-center justify-center mx-auto mb-3">
            <Icon name="search" className="text-text-muted" size={22} />
          </div>
          <p className="text-sm font-semibold text-espresso">
            {jobs.length === 0
              ? sw ? "Bado hakuna nafasi zilizoorodheshwa." : "No jobs listed yet."
              : sw ? "Hakuna nafasi zinazolingana na utafutaji wako." : "No jobs match your search."}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {jobs.length === 0
              ? sw ? "Rudi hivi karibuni — tunaongeza nafasi mpya." : "Check back soon — we're adding new roles."
              : sw ? "Jaribu neno lingine au ondoa vichujio." : "Try a different term or clear the filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.key} className="space-y-3">
              {sort === "newest" && g.key !== "all" && (
                <h2 className="text-[11px] font-bold uppercase tracking-wide text-text-muted pt-1">
                  {g.key === "today"
                    ? (sw ? "Leo" : "Today")
                    : g.key === "thisWeek"
                      ? (sw ? "Wiki hii" : "This week")
                      : (sw ? "Mapema" : "Earlier")}
                </h2>
              )}
              {g.jobs.map((j) => {
                const tone = j.matchScore !== null ? matchTone(j.matchScore) : null;
                const busy = tracking === j.id;
                // Defensive: legacy rows may still carry raw HTML/entities from
                // before the ingest fix — never render tags as visible text.
                const snippet = cleanHtml(j.description, 4000);
                return (
                  <div key={j.id} className="bg-card rounded-card border border-border p-4 sm:p-5 hover:border-[#C6B6A5] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h2 className="text-[15px] font-bold text-espresso leading-snug">{j.title}</h2>
                          {isClosingSoon(j) && (
                            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide bg-ember/10 text-ember-hover border border-ember/20 rounded-pill px-1.5 py-0.5">
                              {sw ? "INAISHA KARIBU" : "CLOSING SOON"}
                            </span>
                          )}
                          {j.featured && (
                            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide bg-gold/15 text-[#8a5a00] border border-gold/30 rounded-pill px-1.5 py-0.5">
                              ★ {sw ? "IMEPENDENEZWA" : "FEATURED"}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs text-text-muted">
                          {j.company && (
                            <span className="inline-flex items-center gap-1 font-medium text-text-body">
                              <Icon name="briefcase" size={12} /> {j.company}
                            </span>
                          )}
                          {j.location && (
                            <span className="inline-flex items-center gap-1">
                              <Icon name="map-pin" size={12} /> {j.location}
                            </span>
                          )}
                          {j.applicationDeadline && (
                            <span className="inline-flex items-center gap-1 text-ember-hover font-medium">
                              <Icon name="clock" size={12} /> {sw ? "Mwisho:" : "Deadline:"} {deadlineLabel(j.applicationDeadline, sw)}
                            </span>
                          )}
                          <span>{timeAgo(j.createdAt, sw)}</span>
                          {j.sourceName && (
                            <span className="text-[10px] text-text-muted/70">via {j.sourceName}</span>
                          )}
                        </div>
                      </div>

                      {/* Match badge */}
                      {tone && j.matchScore !== null && (
                        <div className="shrink-0 text-center">
                          <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center leading-none ${tone.tintBg} ${tone.text}`}>
                            <span className="font-display text-lg font-extrabold">
                              {j.matchScore}
                            </span>
                            <span className="text-[8px] font-semibold">
                              {sw ? "KUFANANA" : "MATCH"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {(j.category || j.employmentType) && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {j.employmentType && (
                          <span className="text-[10px] font-medium bg-sand text-text-body rounded-pill px-2 py-0.5 border border-border">
                            {j.employmentType}
                          </span>
                        )}
                        {j.category && (
                          <span className="text-[10px] font-medium bg-sand text-text-body rounded-pill px-2 py-0.5 border border-border">
                            {j.category}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Description snippet */}
                    {snippet && (
                      <p className="text-xs text-text-muted mt-2.5 line-clamp-2 leading-relaxed">
                        {snippet.slice(0, 240)}
                        {snippet.length > 240 ? "…" : ""}
                      </p>
                    )}

                    {/* Missing keywords (only when we scored it) */}
                    {j.matchScore !== null && j.missing.length > 0 && (
                      <div className="mt-2.5">
                        <p className="text-[10px] text-text-muted mb-1">
                          {sw ? "Maneno yanayokosekana kwenye CV yako:" : "Missing from your CV:"}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {j.missing.slice(0, 6).map((m) => (
                            <span key={m} className="text-[10px] bg-ember-tint/40 border border-ember-tint text-espresso rounded-pill px-2 py-0.5 font-medium">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3.5 border-t border-border">
                      {/* D2: one tap from the job card → /snap with this REAL JD prefilled. */}
                      <SnapTailorButton lang={lang} title={j.title} company={j.company ?? undefined} description={j.description} />
                      {signedIn && <TargetedCvDrawer lang={lang} job={j} />}
                      <Button onClick={() => trackJob(j)} disabled={busy} size="sm">
                        {busy ? (
                          sw ? "Inaanzisha…" : "Starting…"
                        ) : (
                          <>
                            <Icon name="plus" size={14} />
                            {sw ? "Fuatilia kazi hii" : "Track this job"}
                          </>
                        )}
                      </Button>
                      {j.applyUrl && (
                        <a
                          href={j.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ember-hover hover:text-ember transition-colors px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/60 focus-visible:ring-offset-1 focus-visible:ring-offset-cream"
                        >
                          {sw ? "Omba" : "Apply"}
                          <Icon name="share" size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Footer note */}
      <p className="text-[11px] text-text-muted text-center mt-8">
        {sw
          ? "Unatafuta kuorodhesha kazi? "
          : "Hiring? Want to list a role? "}
        <Link href="/contact" className="text-ember hover:text-ember-hover font-medium">
          {sw ? "Wasiliana nasi" : "Get in touch"}
        </Link>
      </p>
    </main>
  );
}
