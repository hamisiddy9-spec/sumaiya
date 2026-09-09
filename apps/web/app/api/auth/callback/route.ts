import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

function isNewUser(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 60_000;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  // Accept EITHER a PKCE `code` (same-browser OAuth / magic link) OR a
  // `token_hash` (magic link opened in a different browser, an in-app webview,
  // or the installed PWA — where the PKCE code_verifier cookie set in the
  // originating context is unavailable). verifyOtp needs no verifier cookie, so
  // handling it here makes sign-in robust regardless of which the email carries.
  if (!code && !token_hash) {
    return NextResponse.redirect(new URL("/sign-in?error=missing_code", requestUrl.origin));
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

  const { data: sessionData, error } = token_hash
    ? await supabase.auth.verifyOtp({
        token_hash,
        type: (type as "signup" | "magiclink" | "recovery" | "invite" | "email_change") ?? "magiclink",
      })
    : await supabase.auth.exchangeCodeForSession(code!);

  if (error) {
    console.error("Auth callback error:", error.message);
    return NextResponse.redirect(new URL("/sign-in?error=auth_failed", requestUrl.origin));
  }

  const user = sessionData?.user;
  if (user?.email && user.created_at && isNewUser(user.created_at)) {
    const name = (user.user_metadata as Record<string, string> | undefined)?.name ?? "";
    sendWelcomeEmail({ name, email: user.email }).catch(() => {});
  }

  // Only allow same-origin relative paths. Reject protocol-relative ("//host")
  // and backslash ("/\\host") targets, which resolve to an external origin.
  const safeNext = /^\/(?![/\\])/.test(next) ? next : "/dashboard";
  const redirectResponse = NextResponse.redirect(new URL(safeNext, requestUrl.origin));
  cookiesToSet.forEach(({ name, value, options }) => {
    redirectResponse.cookies.set(name, value, options as Parameters<typeof redirectResponse.cookies.set>[2]);
  });
  return redirectResponse;
}
