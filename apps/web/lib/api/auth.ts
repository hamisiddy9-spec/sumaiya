import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function parseCookieHeader(
  header: string | null
): { name: string; value: string }[] {
  if (!header) return [];
  return header
    .split(";")
    .map((pair) => {
      const eq = pair.indexOf("=");
      if (eq === -1) return null;
      const name = pair.slice(0, eq).trim();
      if (!name) return null;
      const raw = pair.slice(eq + 1).trim();
      // A malformed percent-escape (e.g. "%E0%A4%A" or a lone "%") makes
      // decodeURIComponent throw URIError — which used to bubble up as a 500
      // on every API route. Keep the raw value instead; the JWT check below
      // will simply fail and the request is treated as unauthenticated.
      let value = raw;
      try {
        value = decodeURIComponent(raw);
      } catch {
        // keep raw — malformed cookie must never crash the API
      }
      return { name, value };
    })
    .filter((c): c is { name: string; value: string } => c !== null);
}

type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

/**
 * Resolves the authenticated user for a Hono API request.
 *
 * Accepts either an `Authorization: Bearer <token>` header or the Supabase
 * session cookie that the browser sends by default. The session cookie is
 * refreshed by middleware before the request reaches the handler, so reading
 * it here is safe. Returns null when neither yields a valid user.
 */
export async function getAuthUser(c: {
  req: { raw: Request };
}): Promise<AuthUser | null> {
  const authHeader = c.req.raw.headers.get("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: { getAll: () => [], setAll: () => {} },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    if (user?.id) return user as AuthUser;
  }

  const cookies = parseCookieHeader(c.req.raw.headers.get("cookie"));
  if (cookies.length === 0) return null;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: { getAll: () => cookies, setAll: () => {} },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? (user as AuthUser) : null;
}

/** Convenience wrapper that returns just the user id (or null). */
export async function getUserId(c: {
  req: { raw: Request };
}): Promise<string | null> {
  const user = await getAuthUser(c);
  return user?.id ?? null;
}
