"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { Loader2, Save, Trash2, AlertTriangle, Check, LogOut, User, Sliders, Contact } from "lucide-react";
import Link from "next/link";
import { AutoTextarea } from "@/components/ui/auto-textarea";
import { CareerProfileCard } from "@/components/settings/career-profile-card";
import { ConfirmationsSettingsCard } from "@/components/settings/confirmations-settings-card";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import type { Lang } from "@/lib/i18n/translations";
import { label } from "@/lib/i18n/labels";
import { getPushState, subscribeToPush, unsubscribeFromPush, type PushSupport } from "@/lib/push-client";

const STRINGS = {
  en: {
    profile: "Profile",
    account: "Account",
    accountDesc: "Your name and sign-in email.",
    preferences: "Preferences",
    preferencesDesc: "Language and notifications.",
    signOut: "Sign out",
    signOutDesc: "Sign out of this device.",
    fullName: "Full Name",
    fullNamePlaceholder: "Your full name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    preferredLanguage: "Preferred Language",
    professionalProfile: "Professional Profile",
    profileHint: "Saved once, used to pre-fill every new CV, cover letter, business card and letter.",
    jobTitle: "Job Title",
    phone: "Phone",
    location: "Location",
    linkedin: "LinkedIn URL",
    website: "Website",
    summary: "Professional Summary",
    emailNotifications: "Email Notifications",
    emailNotificationsDesc: "Receive email updates about your templates and account.",
    pushNotifications: "Push Notifications",
    pushNotificationsDesc: "Get notified in your browser about job matches and updates.",
    pushUnsupported: "Not supported in this browser.",
    pushDenied: "Blocked — enable notifications for this site in your browser settings.",
    analyticsOptOut: "Anonymous Usage Stats",
    analyticsOptOutDesc: "Help improve the product with anonymous usage data (never shared, no personal info).",
    saveChanges: "Save Changes",
    updateSuccess: "Profile updated successfully.",
    updateError: "Failed to update profile.",
    somethingWentWrong: "Something went wrong. Please try again.",
    dangerZone: "Danger Zone",
    dangerZoneDesc: "Once you delete your account, there is no going back. All your CVs and cover letters will be permanently removed.",
    deleteAccount: "Delete Account",
    areYouSure: "Are you sure?",
    deleteConfirmDesc: "This action cannot be undone. All your data will be permanently deleted.",
    yesDelete: "Yes, delete my account",
    cancel: "Cancel",
    deleteError: "Failed to delete account. Please contact support.",
    freePlan: "Free plan",
    freePlanDesc: "Create and edit freely. Downloads require a plan.",
    seePlans: "See plans",
    yourPlan: "Your plan",
    renews: "Renews",
    toCancel: "To cancel, contact ",
    support: "support",
    english: "English",
    kiswahili: "Kiswahili",
    on: "On",
    off: "Off",
  },
  sw: {
    profile: "Wasifu",
    fullName: "Jina Kamili",
    fullNamePlaceholder: "Jina lako kamili",
    email: "Barua pepe",
    emailPlaceholder: "wewe@mfano.com",
    account: "Akaunti",
    accountDesc: "Jina lako na barua pepe ya kuingia.",
    preferences: "Mapendeleo",
    preferencesDesc: "Lugha na arifa.",
    signOut: "Toka",
    signOutDesc: "Toka kwenye kifaa hiki.",
    preferredLanguage: "Lugha Unayopendelea",
    professionalProfile: "Wasifu wa Kazi",
    profileHint: "Huhifadhiwa mara moja, hutumika kujaza kila CV, barua ya maombi, kadi na barua mpya.",
    jobTitle: "Cheo cha Kazi",
    phone: "Simu",
    location: "Mahali",
    linkedin: "Kiungo cha LinkedIn",
    website: "Tovuti",
    summary: "Muhtasari Wako",
    emailNotifications: "Arifa za Barua Pepe",
    emailNotificationsDesc: "Pokea sasisho za barua pepe kuhusu miundo na akaunti yako.",
    pushNotifications: "Arifa za Kivinjari",
    pushNotificationsDesc: "Pata arifa kwenye kivinjari chako kuhusu ajira zinazokufaa na sasisho nyingine.",
    pushUnsupported: "Haipatikani kwenye kivinjari hiki.",
    pushDenied: "Imezuiwa — washa arifa za tovuti hii kwenye mipangilio ya kivinjari chako.",
    analyticsOptOut: "Takwimu za Matumizi bila Kitambulisho",
    analyticsOptOutDesc: "Saidia kuboresha bidhaa kwa takwimu za matumizi zisizojulikana (hazishirikiwi, hakuna taarifa za kibinafsi).",
    saveChanges: "Hifadhi Mabadiliko",
    updateSuccess: "Wasifu umesasishwa.",
    updateError: "Imeshindwa kusasisha wasifu.",
    somethingWentWrong: "Kuna hitilafu. Tafadhali jaribu tena.",
    dangerZone: "Eneo Hatari",
    dangerZoneDesc: "Ukifuta akaunti yako, hakuna njia ya kurudi. CV zako zote na barua za maombi zitafutwa kabisa.",
    deleteAccount: "Futa Akaunti",
    areYouSure: "Una uhakika?",
    deleteConfirmDesc: "Kitendo hiki hakiwezi kutenduliwa. Data yako yote itafutwa kabisa.",
    yesDelete: "Ndiyo, futa akaunti yangu",
    cancel: "Ghairi",
    deleteError: "Imeshindwa kufuta akaunti. Tafadhali wasiliana na msaada.",
    freePlan: "Mpango wa Bure",
    freePlanDesc: "Unda na hariri bila kikomo. Kupakua kunahitaji mpango.",
    seePlans: "Tazama mipango",
    yourPlan: "Mpango wako",
    renews: "Inajirudia",
    toCancel: "Kughairi, wasiliana na ",
    support: "msaada",
    english: "English",
    kiswahili: "Kiswahili",
    on: "Washa",
    off: "Zima",
  },
} as const;

interface Props {
  lang: Lang;
  userId: string;
  initialName: string;
  initialEmail: string;
  planLabel: string;
  userInitial: string;
}

export function SettingsForm({
  lang,
  initialName,
  initialEmail,
  planLabel,
  userInitial,
}: Props) {
  const s = STRINGS[lang];
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const handleSignOut = async () => {
    setSigningOut(true);
    try { await signOut(); router.push("/"); router.refresh(); }
    catch { setSigningOut(false); }
  };
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [preferredLang, setPreferredLang] = useState<"en" | "sw">(lang);
  const [emailNotif, setEmailNotif] = useState(true);
  // Browser push — a distinct, immediate action (permission prompts need a
  // direct user gesture), not batched into the profile Save button below.
  const [pushState, setPushState] = useState<PushSupport | "loading">("loading");
  const [pushBusy, setPushBusy] = useState(false);
  useEffect(() => {
    getPushState().then(setPushState).catch(() => setPushState("unsupported"));
  }, []);
  const togglePush = async () => {
    if (pushBusy || pushState === "unsupported" || pushState === "loading") return;
    setPushBusy(true);
    try {
      if (pushState === "subscribed") {
        await unsubscribeFromPush();
        setPushState("unsubscribed");
      } else {
        const ok = await subscribeToPush();
        setPushState(ok ? "subscribed" : (Notification.permission === "denied" ? "denied" : "unsubscribed"));
      }
    } finally {
      setPushBusy(false);
    }
  };
  const [analyticsOptOut, setAnalyticsOptOut] = useState(false);
  // Shared professional profile (userProfile) — pre-fills every new document.
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [summary, setSummary] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Track whether the saved profile actually loaded. If the fetch failed the
  // fields sit blank, and hitting Save would overwrite a real profile with empty
  // strings — so we block Save until the load succeeds (or is retried).
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load the existing shared profile so the fields aren't blank on open.
  const loadProfile = useCallback(() => {
    let active = true;
    setProfileLoadError(false);
    fetch("/api/profile")
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }: { ok: boolean; j: { success?: boolean; data?: Record<string, unknown> } }) => {
        if (!active) return;
        if (!ok || !j.success) { setProfileLoadError(true); return; }
        const p = j.data ?? {};
        const str = (k: string) => (typeof p[k] === "string" ? (p[k] as string) : "");
        setJobTitle(str("jobTitle"));
        setPhone(str("phone"));
        setLocation(str("location"));
        setLinkedin(str("linkedin"));
        setWebsite(str("website"));
        // The summary lives in TWO places: the legacy top-level column AND the
        // careerProfile (the career spine — the source of truth that the
        // assistant/chat-built CVs populate). Prefer the careerProfile value;
        // it's where the confirmed AI summary actually lives. Without this the
        // field renders EMPTY for chat-built profiles even though the API has
        // the data (live-verified 2026-08).
        const cp = (typeof p.careerProfile === "object" && p.careerProfile !== null ? p.careerProfile : {}) as Record<string, unknown>;
        const cpSummary = typeof cp.summary === "string" ? cp.summary : "";
        setSummary(cpSummary || str("summary"));
        if (typeof p.emailNotifications === "boolean") setEmailNotif(p.emailNotifications);
        if (typeof p.analyticsOptOut === "boolean") setAnalyticsOptOut(p.analyticsOptOut);
        setProfileLoaded(true);
      })
      .catch(() => { if (active) setProfileLoadError(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => loadProfile(), [loadProfile]);

  const handleSave = () => {
    startTransition(async () => {
      try {
        const headers = { "Content-Type": "application/json" };
        // Save the account name/email AND the shared profile in one action.
        // fullName/email are mirrored into the profile so document prefill has them.
        const [userRes, profRes] = await Promise.all([
          fetch("/api/user/update-user", {
            method: "POST", headers,
            body: JSON.stringify({ name, email }),
          }),
          fetch("/api/profile", {
            method: "POST", headers,
            body: JSON.stringify({
              fullName: name,
              ...(email.includes("@") ? { email } : {}),
              // Only write the profile document fields when they actually loaded,
              // so a failed load can't clobber the real values with blanks.
              ...(profileLoaded ? { jobTitle, phone, location, linkedin, website, summary } : {}),
              emailNotifications: emailNotif,
              analyticsOptOut,
              // Persisted so server-composed messages (push notifications
              // from a cron job) can be written in the right language.
              lang: preferredLang,
            }),
          }),
        ]);
        if (userRes.ok && profRes.ok) {
          setMessage({ type: "success", text: s.updateSuccess });
          // Apply the language choice: the whole app reads the `lang` cookie
          // (middleware → x-lang). Set it and refresh so the change takes effect.
          if (preferredLang !== lang) {
            document.cookie = `lang=${preferredLang};path=/;max-age=31536000`;
            router.refresh();
          }
        } else {
          setMessage({ type: "error", text: s.updateError });
        }
      } catch {
        setMessage({ type: "error", text: s.somethingWentWrong });
      }
      setTimeout(() => setMessage(null), 4000);
    });
  };

  const handleDeleteAccount = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/user/delete-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          window.location.href = "/";
        } else {
          setMessage({ type: "error", text: s.deleteError });
        }
      } catch {
        setMessage({ type: "error", text: s.somethingWentWrong });
      }
    });
  };

  return (
    <div className="space-y-8">
      {message && (
        <div
          className={`rounded-input-lg px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Main settings card */}
      <div className="bg-card border border-border rounded-card p-6 space-y-7">

        {/* Avatar + name + email + plan pill row */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-900 text-xl font-bold flex-shrink-0">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-espresso text-lg truncate">{name || "User"}</p>
            <p className="text-text-muted text-sm truncate">{email}</p>
          </div>
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 bg-gold-tint text-gold-text text-xs font-semibold px-3 py-1.5 rounded-pill whitespace-nowrap">
              <Check className="w-3 h-3" />
              {planLabel}
            </span>
          </div>
        </div>

        {/* ── Account ── */}
        <div className="border-t border-border pt-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-espresso"><User className="w-4 h-4 text-text-muted" /> {s.account}</h2>
          <p className="text-xs text-text-muted mt-0.5">{s.accountDesc}</p>
        </div>

        {/* Full Name field */}
        <div>
          <label className="block text-sm font-medium text-text-body mb-1.5" htmlFor="settings-fullname">{s.fullName}</label>
          <input id="settings-fullname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-sand-2 border border-border-input rounded-input text-espresso placeholder:text-text-muted focus:outline-none focus:ring-[3px] focus:ring-ember-tint focus:border-ember transition"
            placeholder={s.fullNamePlaceholder}
          />
        </div>

        {/* Email field */}
        <div>
          <label className="block text-sm font-medium text-text-body mb-1.5" htmlFor="settings-email">{s.email}</label>
          <input id="settings-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="w-full px-4 py-2.5 text-sm bg-sand-2 border border-border-input rounded-input text-espresso placeholder:text-text-muted focus:outline-none focus:ring-[3px] focus:ring-ember-tint focus:border-ember transition"
            placeholder={s.emailPlaceholder}
          />
        </div>

        {/* ── Shared professional profile ── */}
        <div className="border-t border-border pt-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-espresso"><Contact className="w-4 h-4 text-text-muted" /> {s.professionalProfile}</h2>
          <p className="text-xs text-text-muted mt-0.5 mb-4">{s.profileHint}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-body mb-1.5" htmlFor="settings-jobtitle">{s.jobTitle}</label>
              <input id="settings-jobtitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-sand-2 border border-border-input rounded-input text-espresso placeholder:text-text-muted focus:outline-none focus:ring-[3px] focus:ring-ember-tint focus:border-ember transition"
                placeholder="e.g. Software Engineer" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-body mb-1.5" htmlFor="settings-phone">{s.phone}</label>
              <input id="settings-phone" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel"
                className="w-full px-4 py-2.5 text-sm bg-sand-2 border border-border-input rounded-input text-espresso placeholder:text-text-muted focus:outline-none focus:ring-[3px] focus:ring-ember-tint focus:border-ember transition"
                placeholder="e.g. +254 712 345 678" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-body mb-1.5" htmlFor="settings-location">{s.location}</label>
              <input id="settings-location" value={location} onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-sand-2 border border-border-input rounded-input text-espresso placeholder:text-text-muted focus:outline-none focus:ring-[3px] focus:ring-ember-tint focus:border-ember transition"
                placeholder="e.g. Nairobi, Kenya" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-body mb-1.5" htmlFor="settings-linkedin">{s.linkedin}</label>
              <input id="settings-linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-sand-2 border border-border-input rounded-input text-espresso placeholder:text-text-muted focus:outline-none focus:ring-[3px] focus:ring-ember-tint focus:border-ember transition"
                placeholder="https://linkedin.com/in/…" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-body mb-1.5" htmlFor="settings-website">{s.website}</label>
              <input id="settings-website" value={website} onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-sand-2 border border-border-input rounded-input text-espresso placeholder:text-text-muted focus:outline-none focus:ring-[3px] focus:ring-ember-tint focus:border-ember transition"
                placeholder="https://…" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-body mb-1.5" htmlFor="settings-summary">{s.summary}</label>
              <AutoTextarea id="settings-summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={3}
                className="w-full px-4 py-2.5 text-sm bg-sand-2 border border-border-input rounded-input text-espresso placeholder:text-text-muted focus:outline-none focus:ring-[3px] focus:ring-ember-tint focus:border-ember transition min-h-[76px]"
                placeholder="A short professional summary…" />
            </div>
          </div>
        </div>

        {/* ── Career Profile (source of truth) ── */}
        <CareerProfileCard lang={lang} />
        {/* Phase 2 (A): facts awaiting the user's confirmation (AI-drafted prose). */}
        <ConfirmationsSettingsCard lang={lang} />

        {/* ── Preferences ── */}
        <div className="border-t border-border pt-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-espresso"><Sliders className="w-4 h-4 text-text-muted" /> {s.preferences}</h2>
          <p className="text-xs text-text-muted mt-0.5">{s.preferencesDesc}</p>
        </div>

        {/* Preferred Language segmented control */}
        <div>
          <label className="block text-sm font-medium text-text-body mb-1.5">{s.preferredLanguage}</label>
          <div className="flex bg-sand-2 rounded-input-lg p-1 w-fit">
            <button
              type="button"
              onClick={() => setPreferredLang("en")}
              className={`px-5 py-2 text-sm font-medium rounded-input-lg transition ${
                preferredLang === "en"
                  ? "bg-card border border-ember text-ember-hover shadow-sm"
                  : "text-text-body hover:text-espresso"
              }`}
            >
              {s.english}
            </button>
            <button
              type="button"
              onClick={() => setPreferredLang("sw")}
              className={`px-5 py-2 text-sm font-medium rounded-input-lg transition ${
                preferredLang === "sw"
                  ? "bg-card border border-ember text-ember-hover shadow-sm"
                  : "text-text-body hover:text-espresso"
              }`}
            >
              {s.kiswahili}
            </button>
          </div>
        </div>

        {/* Email Notifications toggle */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-text-body">{s.emailNotifications}</label>
              <p className="text-xs text-text-muted mt-0.5">{s.emailNotificationsDesc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={emailNotif}
              aria-label={s.emailNotifications}
              onClick={() => setEmailNotif((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                emailNotif ? "bg-ember" : "bg-border-input"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-card shadow-sm transition ${
                  emailNotif ? "translate-x-[22px]" : "translate-x-[2px]"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Push (browser) notifications toggle — see lib/push-client.ts's
            header comment: the server side of this was fully built and
            never had a client to actually subscribe anyone. */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-text-body">{s.pushNotifications}</label>
              <p className="text-xs text-text-muted mt-0.5">
                {pushState === "unsupported" ? s.pushUnsupported : pushState === "denied" ? s.pushDenied : s.pushNotificationsDesc}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={pushState === "subscribed"}
              aria-label={s.pushNotifications}
              disabled={pushBusy || pushState === "unsupported" || pushState === "denied" || pushState === "loading"}
              onClick={togglePush}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 disabled:opacity-40 ${
                pushState === "subscribed" ? "bg-ember" : "bg-border-input"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-card shadow-sm transition ${
                  pushState === "subscribed" ? "translate-x-[22px]" : "translate-x-[2px]"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Anonymous usage stats toggle (feedback flywheel opt-out) */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-text-body">{s.analyticsOptOut}</label>
              <p className="text-xs text-text-muted mt-0.5">{s.analyticsOptOutDesc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!analyticsOptOut}
              aria-label={s.analyticsOptOut}
              onClick={() => setAnalyticsOptOut((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                !analyticsOptOut ? "bg-ember" : "bg-border-input"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-card shadow-sm transition ${
                  !analyticsOptOut ? "translate-x-[22px]" : "translate-x-[2px]"
                }`}
              />
            </button>
          </div>
        </div>

        {/* If the saved profile failed to load we can't safely save — doing so
            would overwrite it with the blank fields on screen. Offer a retry. */}
        {profileLoadError && (
          <div className="flex items-center gap-2 text-xs text-red-600 mb-1">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{lang === "sw" ? "Imeshindwa kupakia wasifu wako." : "Couldn't load your saved profile."}</span>
            <button onClick={loadProfile} className="font-semibold underline hover:no-underline">
              {label(lang, "retry")}
            </button>
          </div>
        )}

        {/* Save changes button */}
        <button
          onClick={handleSave}
          disabled={isPending || (!profileLoaded && !profileLoadError)}
          className="inline-flex items-center gap-2 bg-espresso hover:bg-espresso-2 text-cream font-semibold px-6 py-2.5 rounded-input-lg transition disabled:opacity-50 active:scale-[0.98]"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {s.saveChanges}
        </button>
      </div>

      {/* Sign out */}
      <div className="bg-card border border-border rounded-card p-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-espresso"><LogOut className="w-4 h-4 text-text-muted" /> {s.signOut}</h2>
          <p className="text-xs text-text-muted mt-0.5">{s.signOutDesc}</p>
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="inline-flex items-center gap-2 border border-border-input text-espresso hover:bg-sand-2 font-semibold px-5 py-2.5 rounded-input-lg transition disabled:opacity-50 active:scale-[0.98] shrink-0"
        >
          {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          {s.signOut}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-card border border-border rounded-card p-6">
        <h2 className="text-lg font-semibold text-ember-hover mb-2">{s.dangerZone}</h2>
        <p className="text-sm text-text-muted mb-4">{s.dangerZoneDesc}</p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 border-2 border-ember/30 text-ember-hover hover:bg-ember-tint font-semibold px-5 py-2.5 rounded-input-lg transition"
          >
            <Trash2 className="w-4 h-4" /> {s.deleteAccount}
          </button>
        ) : (
          <div className="bg-ember-tint border border-ember/30 rounded-input-lg p-4">
            <div className="flex items-center gap-2 text-ember-hover font-semibold mb-2">
              <AlertTriangle className="w-5 h-5" /> {s.areYouSure}
            </div>
            <p className="text-sm text-text-body mb-4">{s.deleteConfirmDesc}</p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={isPending}
                className="inline-flex items-center gap-2 bg-ember hover:bg-ember-hover text-cream font-semibold px-5 py-2 rounded-input-lg transition disabled:opacity-50 active:scale-[0.98]"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {s.yesDelete}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isPending}
                className="px-5 py-2 text-text-body hover:text-espresso font-medium transition"
              >
                {s.cancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
