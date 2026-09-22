import { EMAIL_REDIRECT_TO } from "./supabase";

/**
 * True only for the exact email-confirmation deep link (scheme + host + path),
 * ignoring the query/fragment that carries the tokens. A substring test such
 * as `url.includes("auth/confirm")` would also accept a decoy like
 * "https://evil.example/x?next=auth/confirm".
 */
export function isConfirmDeepLink(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.split(/[#?]/)[0] === EMAIL_REDIRECT_TO;
}
