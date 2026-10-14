import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db, cv, coverLetter, businessCard, letter, downloadLog, application } from "@/lib/db";
import { needsFollowUp } from "@/lib/applications";
import { assembleUserContext } from "@/lib/assistant/context";
import { safeFirstName } from "@/lib/assistant/safe-name";
import { computeSignals, type Signal } from "@/lib/assistant/signals";
import { eq, desc, sql } from "drizzle-orm";
import Link from "next/link";
import { DashboardCVGrid } from "@/components/dashboard/dashboard-cv-grid";
import { DashboardBusinessCardGrid } from "@/components/dashboard/dashboard-business-card-grid";
import { DashboardLetterGrid } from "@/components/dashboard/dashboard-letter-grid";
import { DashboardCoverLetterGrid } from "@/components/dashboard/dashboard-cover-letter-grid";
import { LetterTypePicker } from "@/components/ui/letter-type-picker";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n/translations";
import type { Lang } from "@/lib/i18n/translations";
import type { CV, CoverLetter, BusinessCard, Letter } from "@/lib/db/schema";
import type { Metadata } from "next";
import { ApplicationsGrid } from "@/components/dashboard/applications-grid";
import { ReferralCard } from "@/components/referral/referral-card";
import { CreateMenu } from "@/components/dashboard/create-menu";
import { CreateEntryButton } from "@/components/editor/create-entry-options";
import { RecommendedJobsSection } from "@/components/jobs/recommended-jobs-section";
import { label } from "@/lib/i18n/labels";
import { accessCopy } from "@/lib/access-copy";
import { subjectForUser } from "@/lib/entitlements-server";
import { isPremiumActive } from "@/lib/entitlements";
import { isReturningUser, dashboardGreetingKey } from "@/lib/dashboard/returning";

export const metadata: Metadata = { title: "Dashboard" };

const TABS = [
  { key: "all",           labelEn: "All",            labelSw: "Yote" },
  { key: "cv",            labelEn: "CVs",            labelSw: "CV" },
  { key: "cover-letter",  labelEn: "Cover Letters",  labelSw: "Barua za Maombi" },
  { key: "business-card", labelEn: "Business Cards", labelSw: "Kadi za Biashara" },
  { key: "letter",        labelEn: "Formal Letters", labelSw: "Barua Rasmi" },
  { key: "applications",  labelEn: "Applications",   labelSw: "Maombi" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// Phase 2 (C): where each proactive signal leads. Confirmations live in
// Settings; ATS fixes live in the CV editor; everything job-shaped goes to
// Sumaiya (she drives the tool with preview→confirm).
function signalHref(sig: Signal, activeCvId?: string): string {
  switch (sig.type) {
    case "confirmations": return "/settings";
    case "application.followUp": return "/dashboard?tab=applications";
    case "ats.check": return activeCvId ? `/editor/cv/${activeCvId}` : "/assistant";
    default: return "/assistant";
  }
}

interface Props {
  searchParams: { tab?: string; error?: string };
}

export default async function DashboardPage({ searchParams }: Props) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?callbackUrl=%2Fdashboard");

  const lang = ((await headers()).get("x-lang") ?? "sw") as Lang;
  const userId = user.id;

  // ── Fetch documents (non-crashing) ──────────────────────────────────────
  let cvs:          CV[]           = [];
  let coverLetters: CoverLetter[]  = [];
  let businessCards: BusinessCard[] = [];
  let letters:      Letter[]       = [];
  let totalDownloads = 0;
  // True totals (the grids above are capped at 20; these keep the count tiles honest).
  let cvCount = 0, clCount = 0, bcCount = 0, letCount = 0;
  let appStatuses: { status: string; appliedAt: Date | null; createdAt: Date }[] = [];
  let dbError = false;
  // THE SPINE: a Career Profile alone (Career Interview / chat-built CV) is
  // enough to power matched jobs — the dashboard shows them for profile-only
  // users too, not just CV owners.
  let hasCareerProfile = false;
  // Real name from the career profile (the fact store) — used by safeFirstName
  // so Sumaiya/the dashboard never greet a smart-TV user as "Hisense".
  let careerProfileFullName = "";

  try {
    const [cvsR, clR, bcR, letR, dlR, cvC, clC, bcC, letC] = await Promise.all([
      db.select().from(cv).where(eq(cv.userId, userId)).orderBy(desc(cv.updatedAt)).limit(20),
      db.select().from(coverLetter).where(eq(coverLetter.userId, userId)).orderBy(desc(coverLetter.updatedAt)).limit(20),
      db.select().from(businessCard).where(eq(businessCard.userId, userId)).orderBy(desc(businessCard.updatedAt)).limit(20),
      db.select().from(letter).where(eq(letter.userId, userId)).orderBy(desc(letter.updatedAt)).limit(20),
      db.select({ count: sql`count(*)` }).from(downloadLog).where(eq(downloadLog.userId, userId)),
      db.select({ count: sql`count(*)` }).from(cv).where(eq(cv.userId, userId)),
      db.select({ count: sql`count(*)` }).from(coverLetter).where(eq(coverLetter.userId, userId)),
      db.select({ count: sql`count(*)` }).from(businessCard).where(eq(businessCard.userId, userId)),
      db.select({ count: sql`count(*)` }).from(letter).where(eq(letter.userId, userId)),
    ]);
    cvs = cvsR; coverLetters = clR; businessCards = bcR; letters = letR;
    totalDownloads = Number(dlR[0]?.count ?? 0);
    cvCount = Number(cvC[0]?.count ?? cvsR.length);
    clCount = Number(clC[0]?.count ?? clR.length);
    bcCount = Number(bcC[0]?.count ?? bcR.length);
    letCount = Number(letC[0]?.count ?? letR.length);
  } catch (err) {
    console.error("[Dashboard] DB fetch failed:", err);
    dbError = true;
  }

  // Isolated from the main fetch: applications is the newest table, so a failure
  // here should only drop the pipeline strip, not blank the whole dashboard.
  try {
    appStatuses = await db.select({ status: application.status, appliedAt: application.appliedAt, createdAt: application.createdAt }).from(application).where(eq(application.userId, userId));
  } catch {
    appStatuses = [];
  }

  // PHASE 2 (B/C): the unified context — the same assembled picture the
  // assistant and cockpit use. The pending-confirmations banner comes from it,
  // the proactive signal section (Phase 2 C) is computed from it, and the
  // career-profile flag comes from it too (it already reads user_profile — no
  // need for the main fetch to query the same row again).
  // Non-fatal: a failure means no banner, no signals, no profile flag.
  let unconfirmedCount = 0;
  // Provenance of each pending fact. The banner used to assert "Sumaiya wrote
  // these from your chat" unconditionally, which is false for a fact derived
  // from a CV (mapper stamps `cv:<id>` prose needs-confirmation) and
  // doubly false for a user who has never chatted.
  let unconfirmedSources: string[] = [];
  let signals: Signal[] = [];
  try {
    const ctx = await assembleUserContext(userId);
    unconfirmedCount = ctx.unconfirmed.length;
    unconfirmedSources = ctx.unconfirmed.map((u) => u.source);
    signals = computeSignals(ctx);
    hasCareerProfile = !!ctx.profile;
    careerProfileFullName = ctx.profile ? String(ctx.profile?.personal?.fullName ?? "") : "";
  } catch {
    unconfirmedCount = 0;
    unconfirmedSources = [];
    signals = [];
  }

  const userName = user.user_metadata?.name ?? user.email?.split("@")[0] ?? "";
  // NO fallback to the raw metadata first word: on smart-TV/embedded browsers
  // that word can be the DEVICE name ("Hisense", "Android TV"…) — the guard
  // returns "" then, and we'd rather show "Welcome!" than "Welcome, Hisense!".
  const firstName = safeFirstName(
    careerProfileFullName,
    userName,
    user.email ?? "",
  );
  const avatarInitial = (firstName || "U")[0]?.toUpperCase() ?? "U";

  const rawTab = searchParams.tab ?? "all";
  const activeTab: TabKey = TABS.some((t) => t.key === rawTab) ? (rawTab as TabKey) : "all";
  const showAll           = activeTab === "all";
  const showCVs           = showAll || activeTab === "cv";
  const showCoverLetters  = showAll || activeTab === "cover-letter";
  const showBusinessCards = showAll || activeTab === "business-card";
  const showLetters       = showAll || activeTab === "letter";
  const showApplications  = activeTab === "applications";

  const createFailed = !!searchParams.error;
  const guestCvNotFound = searchParams.error === "guest-cv-not-found";

  const docCount = cvCount + clCount + bcCount + letCount;

  const sw = lang === "sw";

  // This account's REAL access, from the same source /api/entitlements answers
  // from — the inline banner below used to read "Huduma zote zimefunguliwa"
  // ("everything unlocked") unconditionally, while `template.premium` was false
  // (D2). lib/access-copy.ts owns the wording and never claims full access for a
  // non-Premium account.
  const premium = isPremiumActive((await subjectForUser(userId)).premiumUntil);
  const access = accessCopy(premium, sw);
  const appPipe = appStatuses.reduce((acc, a) => { acc[a.status] = (acc[a.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const followUpCount = appStatuses.filter(needsFollowUp).length;

  // ── NEW vs RETURNING ─────────────────────────────────────────────────────
  // Every input below is already fetched for this page, so telling a first run
  // from a return visit costs nothing extra. See lib/dashboard/returning.ts.
  const isFirstRun = !isReturningUser({
    docCount,
    hasCareerProfile,
    applicationCount: appStatuses.length,
    downloadCount: totalDownloads,
  });
  // "Karibu tena!" (welcome BACK) on a fresh account was the clearest case of
  // the app greeting a new user as a returning one.
  const welcomeKey = dashboardGreetingKey(!isFirstRun);

  const quickCreateItems = [
    {
      href: "/dashboard?tab=cv",
      icon: "cv" as const,
      label: t(lang, "dashboard.myCVs"),
      count: cvCount,
      bgColor: "bg-ember-tint",
      iconColor: "text-ember",
      hoverBorder: "hover:border-ember/30",
    },
    {
      href: "/dashboard?tab=cover-letter",
      icon: "mail" as const,
      label: lang === "sw" ? "Barua za Maombi" : "Cover Letters",
      count: clCount,
      bgColor: "bg-pine-tint",
      iconColor: "text-pine",
      hoverBorder: "hover:border-pine/30",
    },
    {
      href: "/dashboard?tab=business-card",
      icon: "card" as const,
      label: lang === "sw" ? "Kadi za Biashara" : "Business Cards",
      count: bcCount,
      bgColor: "bg-gold-tint",
      iconColor: "text-gold",
      hoverBorder: "hover:border-gold/30",
    },
    {
      href: "/dashboard?tab=letter",
      icon: "letter" as const,
      label: lang === "sw" ? "Barua Rasmi" : "Formal Letters",
      count: letCount,
      bgColor: "bg-purple-tint",
      iconColor: "text-purple-glow",
      hoverBorder: "hover:border-purple-glow/30",
    },
  ];

  return (
    <main id="main" tabIndex={-1} className="min-h-screen bg-sand">

      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-10 pb-tabbar md:pb-10">

        {/* DB load error banner */}
        {dbError && (
          <div className="mb-6 bg-gold-tint border border-gold/25 rounded-card-lg px-5 py-4 flex gap-3 items-start">
            <Icon name="wifi-off" size={20} className="text-gold-text flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-espresso text-sm">
                {lang === "sw" ? "Tatizo la muunganisho" : "Connection issue"}
              </p>
              <p className="text-text-body text-sm mt-0.5">
                {lang === "sw"
                  ? "Hati zako hazipakiwi sasa hivi. Hati zako bado zipo salama — jaribu tena."
                  : "We couldn't load your documents right now — they're still safe. Please try again."}
              </p>
            </div>
            <Link href="/dashboard" className="flex-shrink-0 text-sm font-semibold text-ember-hover hover:text-ember/80 underline">
              {label(lang, "retry")}
            </Link>
          </div>
        )}

        {/* Create-failed / guest-not-found banner */}
        {createFailed && !dbError && (
          <div className="mb-6 bg-gold-tint border border-gold/25 rounded-card-lg px-5 py-4 flex gap-3 items-start">
            <Icon name="wifi-off" size={20} className="text-gold-text flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-espresso text-sm">
                {guestCvNotFound
                  ? (lang === "sw" ? "CV ya mgeni haikupatikana" : "Guest CV not found")
                  : (lang === "sw" ? "Imeshindikana kuunda hati" : "Couldn't create that document")}
              </p>
              <p className="text-text-body text-sm mt-0.5">
                {guestCvNotFound
                  ? (lang === "sw"
                      ? "CV uliyokuwa ukiifanya kazi haikupatikana. Labda tayari umeingia au muda umepita. Anzisha mpya hapa chini."
                      : "We couldn't find the guest CV you were working on. It may have already been migrated or expired. Start a new one below.")
                  : (lang === "sw"
                      ? "Tafadhali jaribu tena kwa kutumia kitufe cha kuunda hapo juu."
                      : "Please try again using one of the create buttons above.")}
              </p>
            </div>
          </div>
        )}

        {/* ── Greeting + actions ── */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* User avatar — pine circle, cream initials */}
            <div className="w-11 h-11 rounded-full bg-pine flex items-center justify-center flex-shrink-0 shadow-card">
              <span className="text-cream font-bold text-sm leading-none">{avatarInitial}</span>
            </div>
            <div>
              <h1 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight text-espresso">
                {t(lang, welcomeKey)}{firstName ? `, ${firstName}` : ""}!
              </h1>
              <p className="text-text-muted text-sm mt-0.5">{t(lang, "dashboard.manage")}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* D2: the flagship, one tap away — primary CTA on the dashboard. */}
            <Link href="/snap">
              <Button variant="primary" size="sm">
                <Icon name="spark" size={14} />
                Snap-to-Apply
              </Button>
            </Link>
            <Link href="/assistant">
              <Button variant="secondary" size="sm">
                <Icon name="spark" size={14} className="text-ember" />
                {lang === "sw" ? "Sumaiya" : "Sumaiya"}
              </Button>
            </Link>
            <Link href="/import-cv">
              <Button variant="secondary" size="sm">
                <Icon name="magic" size={14} />
                {lang === "sw" ? "Ingiza CV" : "Import CV"}
              </Button>
            </Link>
            <Link href="/voice">
              <Button variant="secondary" size="sm">
                <Icon name="mic" size={14} />
                {lang === "sw" ? "Sema CV" : "Voice CV"}
              </Button>
            </Link>
            <CreateMenu lang={lang} />
          </div>
        </div>

        {/* ── Job-search pipeline — the journey, made the hero ──
            Hidden on a first run: an account with nothing in it has no
            pipeline to show, and the card pushed the one action a new user
            needs below two blocks of chrome that describe later stages. */}
        {!dbError && !isFirstRun && (
          <Link href="/dashboard?tab=applications" className="group block mb-8">
            <div className="bg-espresso rounded-card-lg p-5 border border-espresso-line flex items-center justify-between gap-4 hover:border-gold/30 transition-colors">
              <div className="min-w-0">
                <p className="text-[11px] font-mono uppercase tracking-wider text-gold/80 mb-2">
                  {sw ? "Utafutaji wako wa ajira" : "Your job search"}
                </p>
                {appStatuses.length === 0 ? (
                  <p className="text-cream text-sm">
                    {sw ? "Ukishatuma maombi, yafuatilie hapa — toka ‘umetuma’ hadi ‘ofa ya kazi’." : "Once you apply, track it here — from ‘applied’ through to ‘offer’."}
                  </p>
                ) : (
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-cream">
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-display font-extrabold leading-none">{appPipe["applied"] ?? 0}</span>
                      <span className="text-xs text-cream/60">{sw ? "Zimetumwa" : "Applied"}</span>
                    </span>
                    <span className="text-espresso-line">/</span>
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-display font-extrabold leading-none text-gold">{appPipe["interviewing"] ?? 0}</span>
                      <span className="text-xs text-cream/60">{sw ? "Mahojiano" : "Interviewing"}</span>
                    </span>
                    <span className="text-espresso-line">/</span>
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-display font-extrabold leading-none text-ember">{appPipe["offer"] ?? 0}</span>
                      <span className="text-xs text-cream/60">{sw ? "Ofa ya Kazi" : "Offers"}</span>
                    </span>
                  </div>
                )}
                {/* Turns the tracker from a passive log into an active nudge. */}
                {followUpCount > 0 && (
                  <p className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-gold">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                    {sw
                      ? `Maombi ${followUpCount} yanasubiri — wakati wa kufuatilia`
                      : `${followUpCount} ${followUpCount === 1 ? "application needs" : "applications need"} a follow-up`}
                  </p>
                )}
              </div>
              <span className="shrink-0 flex items-center gap-1 text-sm font-semibold text-gold group-hover:translate-x-0.5 transition-transform">
                {appStatuses.length === 0 ? (sw ? "Anza" : "Start") : (sw ? "Fungua" : "Open")}
                <Icon name="chevron-right" size={16} />
              </span>
            </div>
          </Link>
        )}

        {/* ── E3: Your Daily Brief — the career agent's morning read. One tap
            to the honest daily summary: new matching roles (real scores), 
            applications due a follow-up, ready-to-tailor CVs. */}
        {!dbError && !isFirstRun && (
          <Link href="/brief" className="group block mb-8">
            <div className="bg-card border border-border rounded-card-lg p-4 hover:border-ember/40 transition-colors flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="shrink-0 w-10 h-10 rounded-xl bg-ember-tint flex items-center justify-center">
                  <Icon name="spark" size={18} className="text-ember" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-espresso text-sm">
                    {sw ? "Briefi yako ya kila siku" : "Your daily brief"}
                  </p>
                  <p className="text-text-body text-[13px] mt-0.5">
                    {sw
                      ? "Nafasi mpya za kazi zinazokufaa, maombi ya kufuatilia, na CV tayari kulengwa — kila asubuhi."
                      : "New roles that fit you, applications to follow up on, ready-to-tailor CVs — every morning."}
                  </p>
                </div>
              </div>
              <span className="shrink-0 flex items-center gap-1 text-sm font-semibold text-ember group-hover:translate-x-0.5 transition-transform">
                {sw ? "Fungua" : "Open"}
                <Icon name="chevron-right" size={16} />
              </span>
            </div>
          </Link>
        )}

        {/* ── Phase 2 (C): proactive signals — one engine, grounded nudges.
            The same signals drive Sumaiya's proactive opener. Every card
            cites its real trigger; nothing is fabricated urgency. */}
        {!dbError && signals.length > 0 && (
          <div className="mb-8 space-y-3">
            <div className="flex items-center gap-2">
              <Icon name="spark" size={16} className="text-ember" />
              <span className="text-[10px] font-bold text-ember-hover uppercase tracking-[2px]">
                {sw ? "Hatua Zinazofuata" : "Next Steps"}
              </span>
            </div>
            {signals.slice(0, 3).map((sig) => (
              <Link key={sig.type + (sig.jobId ?? sig.applicationId ?? "")} href={signalHref(sig, cvs[0]?.id)} className="group block">
                <div className="bg-card border border-border rounded-card-lg p-4 hover:border-ember/40 transition-colors flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-espresso text-sm">{sw ? sig.title.sw : sig.title.en}</p>
                    <p className="text-text-body text-[13px] mt-0.5">{sw ? sig.detail.sw : sig.detail.en}</p>
                    <p className="text-[10px] text-text-muted mt-1 font-mono truncate">{sig.trigger}</p>
                  </div>
                  <span className="shrink-0 flex items-center gap-1 text-sm font-semibold text-ember-hover group-hover:translate-x-0.5 transition-transform">
                    {sw ? "Endelea" : "Go"}
                    <Icon name="chevron-right" size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── Phase 2 (B): facts awaiting confirmation — surfaced from the
            unified context, linking to the Settings confirm card. */}
        {!dbError && unconfirmedCount > 0 && (
          <Link href="/settings" className="group block mb-8">
            <div className="bg-warning/10 border border-warning/40 rounded-card-lg p-4 flex items-center justify-between gap-4 hover:border-warning/60 transition-colors">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-warning/15 flex items-center justify-center flex-shrink-0">
                  <Icon name="spark" size={18} className="text-warning" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-espresso text-sm">
                    {sw
                      ? `Taarifa ${unconfirmedCount} zinasubiri uthibitisho wako`
                      : `${unconfirmedCount} ${unconfirmedCount === 1 ? "fact" : "facts"} need your confirmation`}
                  </p>
                  <p className="text-text-body text-[13px] mt-0.5">
                    {/* Name the real provenance. "from your chat" was asserted
                        even for facts derived from a CV, and for a user who
                        had never opened the assistant. */}
                    {unconfirmedSources.every((src) => src === "conversation")
                      ? (sw
                          ? "Niliziandika kutokana na mazungumzo yetu — thibitisha ziwe rasmi, au uziondoe."
                          : "I drafted these from our chat — confirm them to make them official, or remove them.")
                      : (sw
                          ? "Zilitokana na taarifa ulizotoa — thibitisha ziwe rasmi, au uziondoe."
                          : "These came from information you provided — confirm them to make them official, or remove them.")}
                  </p>
                </div>
              </div>
              <span className="shrink-0 flex items-center gap-1 text-sm font-semibold text-gold-text group-hover:translate-x-0.5 transition-transform">
                {sw ? "Thibitisha" : "Confirm"}
                <Icon name="chevron-right" size={16} />
              </span>
            </div>
          </Link>
        )}

        {/* ── Pre-application nudge: has a CV, hasn't targeted a job yet ──
            The pipeline hero above only lights up once you've applied. This
            bridges the gap for a first-timer — from "I built a CV" to the
            Snap-to-Apply match + tailored CV that make it land. D2: points to
            /snap (the copy already describes exactly what snap does). */}
        {!dbError && cvCount > 0 && appStatuses.length === 0 && (
          <Link
            href="/snap"
            className="group block mb-8"
          >
            <div className="bg-ember-tint border border-ember/20 rounded-card-lg p-5 flex items-center justify-between gap-4 hover:border-ember/40 transition-colors">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-ember/15 flex items-center justify-center flex-shrink-0">
                  <Icon name="target" size={18} className="text-ember" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-espresso text-sm">
                    {sw ? "CV yako iko tayari — sasa lenga kazi" : "Your CV is ready — now target a job"}
                  </p>
                  <p className="text-text-body text-[13px] mt-0.5">
                    {sw
                      ? "Bandika tangazo la kazi uone alama yako ya kufanana na marekebisho mahususi ya kuiweka mbele."
                      : "Paste a job post to see your match score and the specific fixes that get you shortlisted."}
                  </p>
                </div>
              </div>
              <span className="shrink-0 flex items-center gap-1 text-sm font-semibold text-ember-hover group-hover:translate-x-0.5 transition-transform">
                {sw ? "Lenga kazi" : "Target a job"}
                <Icon name="chevron-right" size={16} />
              </span>
            </div>
          </Link>
        )}

        {/* ── Jobs zako — top matches from the live feed, matched to the CV ── */}
        {!dbError && (cvCount > 0 || hasCareerProfile) && (
          <RecommendedJobsSection userId={userId} lang={lang} limit={3} />
        )}

        {/* ── Start Here (zero docs) / Quick-create row (has docs) ── */}
        {docCount === 0 ? (
          <div className="mb-8 bg-card border border-border rounded-card-lg shadow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="spark" size={16} className="text-ember" />
              <span className="text-[10px] font-bold text-ember-hover uppercase tracking-[2px]">
                {lang === "sw" ? "Kuanza" : "Start Here"}
              </span>
            </div>
            <h2 className="font-display font-bold text-lg text-espresso mb-5">
              {lang === "sw" ? "Unda hati yako ya kwanza — bure, hakuna malipo" : "Build your first document — free, no paywall"}
            </h2>

            {/* Easiest on-ramp for a first-timer: chat with the AI assistant,
                no long form to face. */}
            <Link
              href="/assistant"
              className="group flex items-center gap-3 p-4 mb-3 bg-ember rounded-card hover:bg-ember-hover transition-all duration-200"
            >
              <div className="w-10 h-10 bg-cream/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name="spark" size={20} className="text-cream" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-cream text-sm flex items-center gap-1">
                  {lang === "sw" ? "Unda CV kwa kuzungumza nami" : "Build a CV by chatting with me"}
                  <Icon name="chevron-right" size={12} className="text-cream group-hover:translate-x-0.5 transition-transform" />
                </p>
                <p className="text-xs text-cream/70 mt-0.5">
                  {lang === "sw" ? "Jibu maswali machache — hakuna fomu ndefu" : "Answer a few questions — no long forms"}
                </p>
              </div>
            </Link>

            {/* Fastest on-ramp: already have a CV? Import it and we rebuild it. */}
            <Link
              href="/import-cv"
              className="group flex items-center gap-3 p-4 mb-3 bg-espresso rounded-card border border-espresso-line hover:border-gold/40 transition-all duration-200"
            >
              <div className="w-10 h-10 bg-gold/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name="magic" size={20} className="text-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-cream text-sm flex items-center gap-1">
                  {lang === "sw" ? "Tayari una CV? Ipakie" : "Already have a CV? Import it"}
                  <Icon name="chevron-right" size={12} className="text-gold group-hover:translate-x-0.5 transition-transform" />
                </p>
                <p className="text-xs text-cream/60 mt-0.5">
                  {lang === "sw" ? "Tunaijenga upya kuwa inayoharirika kwa sekunde 30" : "We rebuild it into an editable CV in ~30 seconds"}
                </p>
              </div>
            </Link>

            <div className="relative flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {lang === "sw" ? "au anza mpya" : "or start fresh"}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { docType: "cv" as const,             icon: "cv" as const,  label: lang === "sw" ? "CV" : "CV",             bgColor: "bg-ember-tint",     iconColor: "text-ember" },
                { docType: "cover-letter" as const,   icon: "mail" as const, label: lang === "sw" ? "Barua ya Maombi" : "Cover Letter",  bgColor: "bg-pine-tint",     iconColor: "text-pine" },
                { docType: "business-card" as const,  icon: "card" as const, label: lang === "sw" ? "Kadi ya Biashara" : "Business Card",  bgColor: "bg-gold-tint",     iconColor: "text-gold" },
                { docType: "letter" as const,         icon: "letter" as const, label: lang === "sw" ? "Barua Rasmi" : "Formal Letter", bgColor: "bg-purple-tint", iconColor: "text-purple-glow" },
              ].map(({ docType, icon, label, bgColor, iconColor }) => (
                <CreateEntryButton
                  key={docType}
                  docType={docType}
                  lang={lang}
                  as="div"
                  className="group flex items-center gap-3 p-4 bg-cream border border-border rounded-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon name={icon} size={20} className={iconColor} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-espresso text-sm flex items-center gap-1">
                      {label} <Icon name="chevron-right" size={12} className="text-text-muted group-hover:translate-x-0.5 transition-transform" />
                    </p>
                    <p className="text-xs text-text-body mt-0.5">{lang === "sw" ? "Unda →" : "Create →"}</p>
                  </div>
                </CreateEntryButton>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {quickCreateItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 bg-card border border-border rounded-card p-4 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 ${item.hoverBorder}`}
              >
                <div className={`w-10 h-10 ${item.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon name={item.icon} size={20} className={item.iconColor} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text-muted truncate">{item.label}</p>
                  <p className="text-xl font-bold text-espresso -mt-0.5">{item.count}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── access banner with real usage stats — states what THIS account
            actually has (see lib/access-copy.ts) ── */}
        <div className="bg-pine-tint border border-pine/20 rounded-card-lg px-5 py-3 mb-8 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Icon name="check" size={16} className="text-pine flex-shrink-0" />
          <span className="font-semibold text-espresso text-sm min-w-0">
            {access.title}
          </span>
          <span className="text-xs text-text-body min-w-0 max-w-[60ch]">
            {access.body}
          </span>
          {access.cta && (
            <Link
              href={access.cta.href}
              className="text-xs font-semibold text-ember-hover hover:underline"
            >
              {access.cta.label} →
            </Link>
          )}
          <span className="ml-auto text-[10px] text-text-muted whitespace-nowrap">
            {docCount} {lang === "sw" ? "hati" : "docs"} · {totalDownloads} {lang === "sw" ? "pakuliwa" : "downloads"}
          </span>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-8 border-b border-border overflow-x-auto overflow-y-hidden scrollbar-hide">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={tab.key === "all" ? "/dashboard" : `/dashboard?tab=${tab.key}`}
              className={[
                "px-4 py-2.5 text-sm font-medium rounded-t-lg transition -mb-px border-b-2 whitespace-nowrap",
                activeTab === tab.key
                  ? "border-ember text-ember-hover"
                  : "border-transparent text-text-muted hover:text-espresso hover:border-espresso-line",
              ].join(" ")}
            >
              {lang === "sw" ? tab.labelSw : tab.labelEn}
            </Link>
          ))}
        </div>

        {/* ── CVs ── */}
        {showCVs && (
          <section className="mb-12">
            <h2 className="text-lg font-bold text-espresso mb-5">{t(lang, "dashboard.myCVs")}</h2>
            {cvs.length === 0 ? (
              <EmptyState
                docType="cv"
                btnLabel={lang === "sw" ? "Unda CV" : "Create CV"}
                lang={lang}
              />
            ) : (
              <DashboardCVGrid cvs={cvs} lang={lang} />
            )}
          </section>
        )}

        {/* ── Cover Letters ── */}
        {showCoverLetters && (
          <section className="mb-12">
            <h2 className="text-lg font-bold text-espresso mb-5">{t(lang, "dashboard.myCoverLetters")}</h2>
            {coverLetters.length === 0 ? (
              <EmptyState
                docType="cover-letter"
                btnLabel={lang === "sw" ? "Unda Barua" : "Create cover letter"}
                lang={lang}
              />
            ) : (
              <DashboardCoverLetterGrid coverLetters={coverLetters} lang={lang} />
            )}
          </section>
        )}

        {/* ── Business Cards ── */}
        {showBusinessCards && (
          <section className="mb-12">
            <h2 className="text-lg font-bold text-espresso mb-5">{t(lang, "dashboard.myBusinessCards")}</h2>
            {businessCards.length === 0 ? (
              <EmptyState
                docType="business-card"
                btnLabel={lang === "sw" ? "Unda Kadi" : "Create business card"}
                lang={lang}
              />
            ) : (
              <DashboardBusinessCardGrid businessCards={businessCards} lang={lang} />
            )}
          </section>
        )}

        {/* ── Letters ── */}
        {showLetters && (
          <section className="mb-12">
            <h2 className="text-lg font-bold text-espresso mb-5">{t(lang, "dashboard.myLetters")}</h2>
            {letters.length === 0 ? (
              <div className="py-3">
                <LetterTypePicker className="group inline-flex items-center gap-2 text-sm font-semibold text-ember-hover hover:text-ember/80 transition-colors" />
              </div>
            ) : (
              <DashboardLetterGrid letters={letters} lang={lang} />
            )}
          </section>
        )}

        {/* ── Applications ── */}
        {showApplications && (
          <section className="mb-12">
            <h2 className="text-lg font-bold text-espresso mb-5">
              {lang === "sw" ? "Maombi" : "Applications"}
            </h2>
            <ApplicationsGrid lang={lang} />
          </section>
        )}

        {/* ── Invite loop ── */}
        <section className="mb-12 max-w-md">
          <ReferralCard sw={sw} />
        </section>
      </div>
    </main>
  );
}

function EmptyState({
  docType, btnLabel, lang,
}: {
  docType: "cv" | "cover-letter" | "business-card" | "letter";
  btnLabel: string;
  lang: "en" | "sw";
}) {
  return (
    <div className="py-3">
      <CreateEntryButton
        docType={docType}
        lang={lang}
        className="group inline-flex items-center gap-2 text-sm font-semibold text-ember-hover hover:text-ember/80 transition-colors"
      >
        <Icon name="plus" size={14} /> {btnLabel} <Icon name="chevron-right" size={12} className="group-hover:translate-x-0.5 transition-transform" />
      </CreateEntryButton>
    </div>
  );
}
