import { headers } from "next/headers";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VoiceIntake } from "@/components/voice/voice-intake";
import { Icon } from "@/components/ui/icon";
import type { Lang } from "@/lib/i18n/translations";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const sw = (await headers()).get("x-lang") !== "en";
  return { title: sw ? "Tengeneza CV kwa kusema — Sumaiya" : "Build your CV by voice — Sumaiya" };
}

export const dynamic = "force-dynamic";

/**
 * Voice intake needs an account, and now says so ON THIS PAGE.
 *
 * WHY IT IS GATED (this is not a paywall — it is where the answers go)
 * The intake's answers become a CV through POST /api/ai/build-cv, which requires
 * a session (it returns 401 without one) because it writes the built document
 * and its facts to the caller's account. A guest has no account to write to.
 *
 * WHY IT NO LONGER REDIRECTS
 * Every other AI surface (/assistant, /snap, /templates, the editor try-pages)
 * opens for a signed-out visitor, so a guest who tapped the dashboard's "Sema
 * CV" tile was bounced to /sign-in with no page of their own — the one
 * inconsistent gate in an otherwise-open guest path
 * (docs/QA-WEB-JOURNEYS-2026-09-20.md D9). A signed-out visitor now gets a 200
 * with the reason, the free path that does work, and a way back to voice after
 * signing in. The guest promise is untouched: /editor/cv/try still builds and
 * downloads a real CV with no account.
 */
export default async function VoicePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const lang = ((await headers()).get("x-lang") ?? "sw") as Lang;
  const sw = lang === "sw";

  if (!user) {
    return (
      <main id="main" tabIndex={-1} className="min-h-screen bg-sand flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg bg-card border border-border rounded-card-lg shadow-card p-6 sm:p-8">
          <div className="w-11 h-11 rounded-xl bg-ember-tint flex items-center justify-center mb-4">
            <Icon name="mic" size={20} className="text-ember" />
          </div>

          <h1 className="text-lg font-bold text-espresso mb-2">
            {sw ? "Kuandika CV kwa sauti kunahitaji akaunti" : "Building a CV by voice needs an account"}
          </h1>

          <p className="text-sm text-text-body leading-relaxed mb-4">
            {sw
              ? "Majibu yako ya sauti yanahifadhiwa moja kwa moja kwenye akaunti yako, na Sumaiya anahitaji akaunti kuandaa CV hiyo. Bila akaunti bado unaweza kuandika CV yako mwenyewe — na kuipakua bure."
              : "Your spoken answers are saved straight into your account, and Sumaiya needs an account to build the CV from them. Without one you can still write your CV yourself — and download it free."}
          </p>

          <ul className="text-sm text-text-body space-y-1.5 mb-6">
            <li className="flex items-start gap-2">
              <Icon name="check" size={14} className="text-pine mt-0.5 flex-shrink-0" />
              <span>
                {sw
                  ? "Bila akaunti: andika CV yako hatua kwa hatua na uipakue (PDF, Word, maandishi)."
                  : "No account: build your CV step by step and download it (PDF, Word, text)."}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="check" size={14} className="text-pine mt-0.5 flex-shrink-0" />
              <span>
                {sw
                  ? "Bila akaunti: zungumza na Sumaiya kwa maandishi, bandika kazi na upate CV lengwa."
                  : "No account: chat with Sumaiya by text, paste a job and get a tailored CV."}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="mic" size={14} className="text-ember mt-0.5 flex-shrink-0" />
              <span>
                {sw
                  ? "Kwa akaunti: sema majibu yako kwa sauti, na CV yako ihifadhiwe kwenye akaunti yako."
                  : "With an account: speak your answers, and your CV is saved to your account."}
              </span>
            </li>
          </ul>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/sign-in?callbackUrl=%2Fvoice&reason=voice"
              className="flex-1 inline-flex items-center justify-center bg-ember hover:bg-ember-hover text-cream text-sm font-semibold px-4 py-2.5 rounded-input-lg transition"
            >
              {sw ? "Ingia kuanza kwa sauti" : "Sign in to use voice"}
            </Link>
            <Link
              href="/editor/cv/try"
              className="flex-1 inline-flex items-center justify-center bg-card border border-border hover:border-text-muted text-espresso text-sm font-semibold px-4 py-2.5 rounded-input-lg transition"
            >
              {sw ? "Anza CV bila akaunti" : "Start a CV without an account"}
            </Link>
          </div>

          <p className="text-xs text-text-muted mt-4 text-center">
            {sw ? "Au " : "Or "}
            <Link href="/assistant" className="font-semibold text-ember-hover hover:underline">
              {sw ? "zungumza na Sumaiya kwa maandishi" : "chat with Sumaiya by text"}
            </Link>
            {sw
              ? " — hapo unakaribishwa bila akaunti."
              : " — open to guests."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main id="main" tabIndex={-1}>
      <VoiceIntake lang={lang} />
    </main>
  );
}
