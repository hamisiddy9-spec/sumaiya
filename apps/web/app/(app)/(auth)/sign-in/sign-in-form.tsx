"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Loader2, KeyRound } from "lucide-react";
import { signIn, getSession } from "@/lib/auth-client";
import { authErrorMessage, googleSignInErrorMessage } from "@/lib/auth-errors";
import posthog from "@/lib/analytics";
import { Logo } from "@/components/ui/logo";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { EMAIL_OTP_DIGITS, normalizeEmailOtp, isCompleteEmailOtp, emailOtpPlaceholder } from "@sumaiya/utils/auth-code";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function MagicLinkSent({ email, onReset, sw }: { email: string; onReset: () => void; sw: boolean }) {
  const COOLDOWN = 60;
  const [seconds, setSeconds] = useState(COOLDOWN);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 bg-ember-tint rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail className="w-8 h-8 text-ember" />
      </div>
      <h2 className="text-xl font-bold text-espresso mb-2">{sw ? "Angalia barua pepe yako" : "Check your inbox"}</h2>
      <p className="text-text-body text-sm">
        {sw ? "Tumetuma kiungo cha kuingia kwa" : "We sent a sign-in link to"} <strong className="text-espresso">{email}</strong>.
      </p>
      <p className="text-xs text-text-muted mt-1 mb-6">
        {sw
          ? "Inaweza kuchukua sekunde chache. Angalia folda ya spam kama haijafika."
          : "It may take a few seconds. Check your spam folder if it doesn't arrive."}
      </p>
      {seconds > 0 ? (
        <p className="text-sm text-text-muted">
          {sw ? "Tuma tena baada ya" : "Resend available in"}{" "}
          <span className="font-semibold tabular-nums text-espresso">{seconds}s</span>
        </p>
      ) : (
        <button
          className="text-sm text-ember-hover font-semibold hover:underline"
          onClick={onReset}
        >
          {sw ? "Tuma kiungo tena" : "Resend link"}
        </button>
      )}
    </div>
  );
}

function SignInForm({ lang }: { lang: string }) {
  const sw = lang === "sw";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "code-sent" | "error">("idle");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState(false);
  const [googleErrorMessage, setGoogleErrorMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [hasDraft, setHasDraft] = useState(false);
  // "code" = email a code the user types here (stays inside an
  // installed PWA); "link" = classic magic link (fine in a normal browser).
  const [mode, setMode] = useState<"link" | "code">("link");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl");
  const errorParam = searchParams.get("error");
  // Why the user was sent here (e.g. "voice" — an AI route that needs a
  // session). Rendering the reason is what turns a silent bounce into an
  // answer.
  const reason = searchParams.get("reason");

  useEffect(() => {
    setHasDraft(!!localStorage.getItem("sumaiya-guest-cv"));
    // Installed PWA → default to the code flow. A tapped magic link opens the
    // system browser and the session lands there, never back in the app.
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (standalone) setMode("code");
  }, []);

  // If a draft exists and no explicit destination was given, send the user to
  // migrate-guest after sign-in so their work is saved automatically.
  const callbackUrl = hasDraft && !rawCallbackUrl ? "/migrate-guest" : (rawCallbackUrl ?? "/dashboard");

  // bfcache guard: when a logged-in user hits Back, browsers (esp. Safari/Firefox/
  // Opera) restore this page from the back-forward cache WITHOUT re-running the
  // server component — so they see a stale sign-in screen despite being logged in.
  // Re-check the session on mount and on every `pageshow` (fired on bfcache restore)
  // and bounce them to their destination if a session is present.
  useEffect(() => {
    let done = false;
    const dest = callbackUrl || "/dashboard";
    const check = async () => {
      if (done) return;
      try {
        const { data } = await getSession();
        if (data.session) {
          done = true;
          window.location.replace(dest);
        }
      } catch {
        /* offline / transient — leave the form usable */
      }
    };
    check();
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) check(); };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [callbackUrl]);

  const callbackErrorMsg =
    errorParam === "auth_failed"
      ? (sw
          ? "Kiungo chako cha kuingia kimeisha muda au kimetumika tayari. Tafadhali omba kingine hapa chini."
          : "Your sign-in link has expired or was already used. Please request a new one below.")
      : errorParam === "missing_code"
      ? (sw
          ? "Kiungo hicho cha kuingia hakikuwa sahihi. Tafadhali omba kingine hapa chini."
          : "That sign-in link was invalid. Please request a new one below.")
      : "";
  const supabaseCallbackURL = `${typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=${encodeURIComponent(callbackUrl)}`;

  const errorMessages: Record<string, string> = sw
    ? {
        "expired": "Kiungo chako cha kuingia kimeisha muda. Tafadhali omba kingine.",
        "invalid": "Kiungo hiki cha kuingia si sahihi. Tafadhali omba kingine.",
        "access_denied": "Kuingia kumeghairiwa. Tafadhali jaribu tena.",
        "server_error": "Kuna hitilafu imetokea kwetu. Tafadhali jaribu tena.",
      }
    : {
        "expired": "Your sign-in link has expired. Please request a new one.",
        "invalid": "This sign-in link is invalid. Please request a new one.",
        "access_denied": "Sign-in was cancelled. Please try again.",
        "server_error": "Something went wrong on our end. Please try again.",
      };
  const errorDisplay = (errorParam && !callbackErrorMsg) ? (errorMessages[errorParam] ?? (sw ? "Kuingia kumeshindikana. Tafadhali jaribu tena." : "Sign-in failed. Please try again.")) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    posthog.capture('sign_in_triggered', { source: 'sign_in_page', method: 'email' });

    try {
      const result =
        mode === "code"
          ? await signIn.emailCode({ email })
          : await signIn.magicLink({ email, callbackURL: supabaseCallbackURL });
      if (result.error) {
        // Map Supabase auth error codes to LOCALIZED messages — never leak the
        // raw SDK string (e.g. "Email rate limit exceeded.") into the UI.
        setErrorMsg(authErrorMessage(result.error.code, sw, result.error.message));
        setStatus("error");
      } else {
        setStatus(mode === "code" ? "code-sent" : "sent");
      }
    } catch {
      setErrorMsg(sw ? "Hitilafu ya mtandao. Tafadhali jaribu tena." : "Network error. Please try again.");
      setStatus("error");
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = normalizeEmailOtp(code);
    if (!isCompleteEmailOtp(token)) return;
    setVerifying(true);
    setErrorMsg("");
    try {
      const result = await signIn.verifyEmailCode({ email, token });
      if (result.error || !result.data?.session) {
        setErrorMsg(
          sw
            ? "Msimbo si sahihi au umeisha muda. Angalia tena au omba mpya."
            : "That code is wrong or expired. Check it, or request a new one.",
        );
        setVerifying(false);
        return;
      }
      posthog.capture("sign_in_completed", { method: "otp", isNew: false });
      window.location.replace(callbackUrl || "/dashboard");
    } catch {
      setErrorMsg(sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Try again.");
      setVerifying(false);
    }
  };

  const handleGoogle = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    setGoogleError(false);
    setGoogleErrorMessage("");
    posthog.capture('sign_in_triggered', { source: 'sign_in_page', method: 'google' });
    // Google Identity Services mints the ID token in THIS browser and Supabase
    // only verifies it — no Supabase-hosted client secret, no OAuth redirect.
    const result = await signIn.google();
    if (result.error) {
      setGoogleLoading(false);
      setGoogleError(true);
      setGoogleErrorMessage(googleSignInErrorMessage(result.error.code, sw));
      return;
    }
    posthog.capture("sign_in_completed", { method: "google", isNew: false });
    window.location.replace(callbackUrl || "/dashboard");
  };

  return (
    <div className="min-h-screen bg-sand flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid md:grid-cols-5 rounded-card-lg shadow-floating overflow-hidden">
        {/* Left panel — brand + value props */}
        <div className="md:col-span-2 bg-espresso p-8 md:p-10 flex flex-col justify-between gap-10">
          <Logo size="xl" className="[&_span]:!text-cream" />
          <div className="space-y-5">
            <h2 className="font-display text-cream text-2xl leading-tight font-extrabold">
              {sw ? "Kila kitu unachohitaji kupata ajira" : "Everything you need to get hired"}
            </h2>
            <ul className="space-y-3 text-cream/80 text-sm">
              <li className="flex items-start gap-2.5"><Icon name="check" size={16} className="text-gold mt-0.5 shrink-0" /> {sw ? "Miundo yanayopitishwa na mifumo ya kuajiri" : "ATS-friendly designs"}</li>
              <li className="flex items-start gap-2.5"><Icon name="check" size={16} className="text-gold mt-0.5 shrink-0" /> {sw ? "Tengeneza na pakua PDF bila malipo" : "Build & download a polished PDF — free"}</li>
              <li className="flex items-start gap-2.5"><Icon name="check" size={16} className="text-gold mt-0.5 shrink-0" /> {sw ? "Msaada wa kuandika muhtasari na uzoefu" : "Writing help for your summary & experience"}</li>
              <li className="flex items-start gap-2.5"><Icon name="check" size={16} className="text-gold mt-0.5 shrink-0" /> {sw ? "Inapatikana kwa Kiingereza na Kiswahili" : "Available in English & Swahili"}</li>
            </ul>
          </div>
        </div>

        {/* Right panel — sign-in form */}
        <div className="md:col-span-3 bg-card p-8 md:p-10">
          {status === "code-sent" ? (
            <form onSubmit={handleVerifyCode} className="py-4">
              <div className="w-16 h-16 bg-ember-tint rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-ember" />
              </div>
              <h2 className="text-xl font-bold text-espresso mb-2 text-center">
                {sw ? "Weka msimbo" : "Enter your code"}
              </h2>
              <p className="text-text-body text-sm text-center mb-6">
                {sw ? `Tumetuma msimbo wa tarakimu ${EMAIL_OTP_DIGITS} kwa` : `We sent a ${EMAIL_OTP_DIGITS}-digit code to`}{" "}
                <strong className="text-espresso">{email}</strong>.
              </p>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={EMAIL_OTP_DIGITS}
                value={code}
                onChange={(e) => setCode(normalizeEmailOtp(e.target.value))}
                placeholder={emailOtpPlaceholder()}
                className="w-full text-center tracking-[0.5em] text-2xl font-semibold rounded-input-lg border border-border-input bg-sand-2 px-4 py-3 text-espresso placeholder:text-text-muted placeholder:tracking-[0.3em] focus:outline-none focus:ring-[3px] focus:ring-ember-tint focus:border-ember transition"
              />
              {errorMsg && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-input-lg px-3 py-2 mt-3">{errorMsg}</p>
              )}
              <Button type="submit" variant="primary" className="w-full mt-4" disabled={verifying || !isCompleteEmailOtp(code)}>
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : sw ? "Ingia" : "Sign in"}
              </Button>
              <button
                type="button"
                onClick={() => { setStatus("idle"); setCode(""); setErrorMsg(""); }}
                className="block mx-auto mt-4 text-sm text-ember-hover font-semibold hover:underline"
              >
                {sw ? "Tumia barua pepe nyingine" : "Use a different email"}
              </button>
            </form>
          ) : status === "sent" ? (
            <MagicLinkSent email={email} onReset={() => setStatus("idle")} sw={sw} />
          ) : (
            <>
              <h2 className="font-display text-2xl font-extrabold text-espresso mb-1">
                {sw ? "Ingia Sumaiya" : "Sign in to Sumaiya"}
              </h2>
              <p className="text-text-body text-sm mb-6">
                {mode === "code"
                  ? (sw ? `Hakuna nywila — tutakutumia msimbo wa tarakimu ${EMAIL_OTP_DIGITS} kwa barua pepe.` : `No password — we'll email you a ${EMAIL_OTP_DIGITS}-digit code.`)
                  : (sw ? "Hakuna nywila — tutakutumia kiungo cha kuingia." : "No password needed — we'll send you a magic link.")}
              </p>

              {/* The one gate left in an otherwise-open guest path: /voice (and
                  the other AI routes that need a session) redirect here. It
                  used to land a signed-out visitor on a bare sign-in screen
                  with no explanation of what they had asked for — and no way
                  to do the thing they actually wanted without an account. */}
              {reason === "voice" && (
                <div className="mb-6 flex items-start gap-3 bg-sand-2 border border-border rounded-card-lg px-4 py-3">
                  <Icon name="mic" size={16} className="text-ember mt-0.5 shrink-0" />
                  <p className="text-sm text-text-body">
                    <strong className="text-espresso">
                      {sw ? "Kuandika CV kwa sauti kunahitaji akaunti." : "Building a CV by voice needs an account."}
                    </strong>{" "}
                    {sw
                      ? "Lakini unaweza kuanza CV yako bila akaunti — na kuipakua bure."
                      : "But you can start your CV with no account — and download it free."}{" "}
                    <Link href="/editor/cv/try" className="font-semibold text-ember-hover hover:underline">
                      {sw ? "Anza bila akaunti" : "Start without an account"}
                    </Link>
                  </p>
                </div>
              )}

              {hasDraft && (
                <div className="mb-6 flex items-start gap-3 bg-ember-tint border border-ember/15 rounded-card-lg px-4 py-3">
                  <Icon name="cv" size={16} className="text-ember mt-0.5 shrink-0" />
                  <p className="text-sm text-ember-hover">
                    <strong>{sw ? "Una rasimu ya CV ambayo haijahifadhiwa." : "You have an unsaved CV draft."}</strong> {sw ? "Ingia ili kuihifadhi kwenye akaunti yako moja kwa moja." : "Sign in to save it to your account automatically."}
                  </p>
                </div>
              )}

              {callbackErrorMsg && status !== "error" && (
                <p className="text-sm text-warning/90 bg-warning/10 border border-warning/25 rounded-card-lg px-3 py-2.5 mb-6">
                  {callbackErrorMsg}
                </p>
              )}

              <button
                type="button"
                disabled={googleLoading}
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 bg-white border border-border hover:border-[#C6B6A5] hover:bg-cream disabled:opacity-60 disabled:cursor-not-allowed text-espresso font-medium py-3 rounded-input-lg transition mb-6"
              >
                {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon className="w-5 h-5" />}
                {googleLoading ? (sw ? "Inasubiri Google..." : "Waiting for Google...") : (sw ? "Endelea na Google" : "Continue with Google")}
              </button>
              {googleError && (
                <p className="text-sm text-warning bg-warning/10 border border-warning/25 rounded-input-lg px-3 py-2 -mt-4 mb-6">
                  {googleErrorMessage || (sw ? "Kuingia kwa Google kumeshindikana." : "Google sign-in failed.")}
                </p>
              )}

              <div className="flex items-center gap-3 mb-6">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{sw ? "AU" : "OR"}</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {errorDisplay && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-input-lg px-3 py-2">{errorDisplay}</p>
                )}
                <div>
                  <label htmlFor="signin-email" className="block text-sm font-medium text-espresso mb-1.5">{sw ? "Barua pepe" : "Email address"}</label>
                  <input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-input-lg border border-border-input bg-sand-2 px-4 py-3 text-sm text-espresso placeholder:text-text-muted focus:outline-none focus:ring-[3px] focus:ring-ember-tint focus:border-ember transition"
                  />
                </div>
                {status === "error" && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-input-lg px-3 py-2">{errorMsg}</p>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    sw ? "Endelea na barua pepe" : "Continue with email"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => { setMode((m) => (m === "code" ? "link" : "code")); setStatus("idle"); setErrorMsg(""); }}
                  className="block mx-auto text-xs text-text-muted hover:text-espresso"
                >
                  {mode === "code"
                    ? (sw ? "Ungependa kiungo cha barua pepe badala yake?" : "Prefer a link by email instead?")
                    : (sw ? `Ungependa msimbo wa tarakimu ${EMAIL_OTP_DIGITS} badala yake?` : `Prefer a ${EMAIL_OTP_DIGITS}-digit code instead?`)}
                </button>
              </form>

              <p className="text-center text-sm mt-6">
                {hasDraft ? (
                  <span className="inline-flex items-start gap-1.5 text-xs text-text-body bg-ember-tint/40 border border-ember-tint rounded-card px-3 py-2 text-left">
                    <Mail className="w-3.5 h-3.5 text-ember shrink-0 mt-0.5" />
                    {sw
                      ? "Tuna kazi iliyohifadhiwa kwenye kifaa hiki. Ingia kwa barua pepe moja — tutaileta kwenye akaunti yako moja kwa moja."
                      : "We found work saved on this device. Sign in with one email — we'll bring it to your account automatically."}
                  </span>
                ) : null}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function SignInFormWrapper({ lang }: { lang: string }) {
  return (
    <Suspense>
      <SignInForm lang={lang} />
    </Suspense>
  );
}
