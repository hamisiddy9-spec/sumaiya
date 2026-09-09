import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/email";

function isNewUser(createdAt?: string): boolean {
  return !!createdAt && Date.now() - new Date(createdAt).getTime() < 60_000;
}

// Magic-link confirmation via token_hash (verifyOtp), NOT the PKCE `code` flow.
// PKCE needs a `code_verifier` stored in the exact browser context that started
// sign-in — so if the emailed link opens somewhere else (Gmail's in-app browser,
// a different browser, or an installed PWA), the exchange fails and the user
// bounces back to /sign-in. token_hash verification carries no such requirement,
// so the link works wherever it is opened. Point the Supabase "Magic Link"
// email template at this route: {{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next=/dashboard
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") ?? "email") as EmailOtpType;
  // A recovery link's whole point is to let the user set a new password —
  // land them on that form, not /dashboard, regardless of what `next` (if
  // any) was passed. Was previously falling through to /dashboard, which for
  // a password-reset flow left the user signed in with no way to actually
  // change their password (no such page existed) — reported live as "the
  // reset link opens the website and nothing follows, just the landing page."
  const next = type === "recovery" ? "/reset-password" : url.searchParams.get("next") ?? "/dashboard";

  if (!tokenHash) {
    return NextResponse.redirect(new URL("/sign-in?error=missing_code", url.origin));
  }

  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            cookiesToSet.push({ name, value, options: options ?? {} });
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    console.error("Auth confirm error:", error.message);
    return NextResponse.redirect(new URL("/sign-in?error=auth_failed", url.origin));
  }

  const user = data?.user;
  if (user?.email && user.created_at && isNewUser(user.created_at)) {
    const name = (user.user_metadata as Record<string, string> | undefined)?.name ?? "";
    sendWelcomeEmail({ name, email: user.email }).catch(() => {});
  }

  // Only allow same-origin relative paths. Reject protocol-relative ("//host")
  // and backslash ("/\\host") targets, which resolve to an external origin.
  const safeNext = /^\/(?![/\\])/.test(next) ? next : "/dashboard";
  const redirectResponse = NextResponse.redirect(new URL(safeNext, url.origin));
  cookiesToSet.forEach(({ name, value, options }) => {
    redirectResponse.cookies.set(name, value, options as Parameters<typeof redirectResponse.cookies.set>[2]);
  });
  return redirectResponse;
}
