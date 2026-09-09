import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

function isNewUser(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 60_000;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");
  // A recovery link's whole point is to let the user set a new password —
  // send them to that form regardless of `next` (see app/api/auth/confirm
  // for the matching fix and why: this used to leave the user silently
  // signed in at /dashboard with no way to actually change their password).
  const next = type === "recovery" ? "/reset-password" : searchParams.get("next") ?? "/dashboard";

  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            cookiesToSet.push({ name, value, options: options ?? {} });
          });
        },
      },
    }
  );

  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "signup" | "magiclink" | "recovery" | "invite" | "email_change",
    });
    // An expired or already-used link fails here. Without this guard we'd fall
    // through and redirect to the protected `next` (e.g. /dashboard) with no
    // session — middleware then bounces to /sign-in with no explanation. Send
    // the user to a clear error state instead, matching callback/confirm routes.
    if (error) {
      return NextResponse.redirect(new URL("/sign-in?error=auth_failed", req.url));
    }
    const user = data?.user;
    if (user?.email && user.created_at && isNewUser(user.created_at)) {
      const name = (user.user_metadata as Record<string, string> | undefined)?.name ?? "";
      sendWelcomeEmail({ name, email: user.email }).catch(() => {});
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Auth handler code exchange error:", error.message);
      return NextResponse.redirect(new URL("/sign-in?error=auth_failed", req.url));
    }
  }

  // Only allow same-origin relative paths. Reject protocol-relative ("//host")
  // and backslash ("/\\host") targets, which resolve to an external origin.
  const safeNext = /^\/(?![/\\])/.test(next) ? next : "/dashboard";
  const redirectResponse = NextResponse.redirect(new URL(safeNext, req.url));
  cookiesToSet.forEach(({ name, value, options }) => {
    redirectResponse.cookies.set(name, value, options as Parameters<typeof redirectResponse.cookies.set>[2]);
  });
  return redirectResponse;
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { email?: string; action?: "otp" | "oauth"; callbackURL?: string };

  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            cookiesToSet.push({ name, value, options: options ?? {} });
          });
        },
      },
    }
  );

  if (body.action === "otp" && body.email) {
    const { error } = await supabase.auth.signInWithOtp({
      email: body.email,
      options: { emailRedirectTo: body.callbackURL },
    });
    const res = NextResponse.json({ error: error?.message }, { status: error ? 400 : 200 });
    cookiesToSet.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
    });
    return res;
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
