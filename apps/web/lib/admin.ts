// Admin access is an email allowlist. Set ADMIN_EMAILS (comma-separated) in the
// environment to control it; falls back to the known owner accounts so the panel
// works out of the box.
const FALLBACK_ADMINS = ["hamisiddy9@gmail.com", "neemabackup1@gmail.com"];

export function adminEmails(): string[] {
  const env = process.env.ADMIN_EMAILS;
  const list = env
    ? env.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];
  return list.length ? list : FALLBACK_ADMINS;
}

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}
