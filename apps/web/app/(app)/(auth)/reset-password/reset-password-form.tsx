"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, KeyRound } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/auth-errors";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

type Status = "checking" | "ready" | "expired" | "saving" | "done";

export function ResetPasswordForm({ lang }: { lang: string }) {
  const sw = lang === "sw";
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    // The recovery token was already verified server-side (/api/auth/confirm)
    // before redirecting here, so a session should already be set via
    // cookies. Some recovery links use the implicit flow instead and land
    // with tokens in the URL fragment — onAuthStateChange picks those up too.
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? "ready" : "expired");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && status === "checking")) {
        setStatus("ready");
      }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = {
    title: sw ? "Weka Nywila Mpya" : "Set a new password",
    subtitle: sw
      ? "Hii ndiyo njia pekee ya kuingia kwenye app ya simu kwa akaunti zilizoundwa kwa Google, hadi Google sign-in itakapoongezwa huko."
      : "This is also how you get a password for the mobile app if your account was created with Google — mobile doesn't support Google sign-in yet.",
    password: sw ? "Nywila mpya" : "New password",
    confirm: sw ? "Thibitisha nywila" : "Confirm password",
    submit: sw ? "Hifadhi nywila" : "Save password",
    saving: sw ? "Ninahifadhi…" : "Saving…",
    mismatch: sw ? "Nywila hazifanani" : "Passwords don't match",
    tooShort: sw ? "Nywila iwe na herufi 8 au zaidi" : "Password must be at least 8 characters",
    expiredTitle: sw ? "Kiungo hakitumiki tena" : "This link has expired",
    expiredBody: sw
      ? "Kiungo cha kuweka nywila kimekwisha tumika au muda wake umepita. Omba kingine kwenye programu."
      : "This reset link was already used or has expired. Request a new one from the Forgot Password screen in the app.",
    doneTitle: sw ? "Nywila imewekwa!" : "Password set!",
    doneBody: sw
      ? "Sasa unaweza kuingia kwenye programu ya simu kwa barua pepe na nywila hii."
      : "You can now sign in on the mobile app with your email and this password.",
    goToSignIn: sw ? "Nenda kuingia" : "Go to sign in",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(t.tooShort);
      return;
    }
    if (password !== confirm) {
      setError(t.mismatch);
      return;
    }
    setStatus("saving");
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      // Never `updateError.message` — the SDK answers in English ("Password
      // should be at least 6 characters"), and this page is Swahili for half
      // its users. `code` is passed too, but a 500 drops it, so the message
      // goes along as the fallback signal.
      setError(authErrorMessage(updateError.code, sw, updateError.message));
      setStatus("ready");
      return;
    }
    setStatus("done");
  };

  return (
    <div className="min-h-screen bg-sand flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-card-lg shadow-floating p-8">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>

        {status === "checking" && (
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 className="w-8 h-8 text-ember animate-spin" />
            <p className="text-sm text-text-muted">{sw ? "Inaangalia kiungo…" : "Checking your link…"}</p>
          </div>
        )}

        {status === "expired" && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-ember-tint rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-ember" />
            </div>
            <h1 className="text-xl font-bold text-espresso mb-2">{t.expiredTitle}</h1>
            <p className="text-text-body text-sm">{t.expiredBody}</p>
          </div>
        )}

        {status === "done" && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-ember-tint rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-ember" />
            </div>
            <h1 className="text-xl font-bold text-espresso mb-2">{t.doneTitle}</h1>
            <p className="text-text-body text-sm mb-6">{t.doneBody}</p>
            <Button variant="primary" size="lg" className="w-full" onClick={() => router.push("/sign-in")}>
              {t.goToSignIn}
            </Button>
          </div>
        )}

        {(status === "ready" || status === "saving") && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-bold text-espresso mb-1">{t.title}</h1>
              <p className="text-sm text-text-muted">{t.subtitle}</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-input-lg px-3 py-2">{error}</p>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-espresso">{t.password}</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={status === "saving"}
                autoComplete="new-password"
                minLength={8}
                required
                className="rounded-input border border-border-input px-4 py-2.5 text-espresso focus:outline-none focus:border-ember"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-espresso">{t.confirm}</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={status === "saving"}
                autoComplete="new-password"
                minLength={8}
                required
                className="rounded-input border border-border-input px-4 py-2.5 text-espresso focus:outline-none focus:border-ember"
              />
            </label>

            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={status === "saving"}>
              {status === "saving" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {t.saving}
                </>
              ) : (
                t.submit
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
