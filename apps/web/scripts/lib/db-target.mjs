/**
 * Which database is this script about to write to?
 *
 * The hazard this exists for: `apps/web/.env.local` points DATABASE_URL at
 * PRODUCTION. Every migration script in this folder documents itself with
 *
 *   node --env-file=.env.local scripts/migrate-<name>.mjs
 *
 * which makes the shortest, most natural way to run a migration also the one
 * that runs it against live user data. Nothing in those scripts said so — the
 * only check was "is DATABASE_URL set", and `.env.local` sets it.
 *
 * So the rule is inverted. A local database is allowed silently. Anything
 * remote is refused unless the caller says ALLOW_REMOTE_WRITE=1. A Neon dev
 * branch or a staging box is remote too, and is deliberately gated as well: it
 * is still shared state, and the point is to make the target a decision rather
 * than a default.
 *
 * This guards against the accident, not the operator. Anyone who means it sets
 * one variable.
 */

/** Hosts that are unambiguously this machine. */
const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "[::1]",
  "0.0.0.0",
  "host.docker.internal",
]);

export const REMOTE_WRITE_OPT_IN = "ALLOW_REMOTE_WRITE";

/**
 * @returns {{ kind: "missing" | "unparseable" | "local" | "remote",
 *             host: string, database: string, project: string }}
 */
export function classifyDatabaseUrl(url) {
  if (typeof url !== "string" || !url.trim()) {
    return { kind: "missing", host: "", database: "", project: "" };
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { kind: "unparseable", host: "", database: "", project: "" };
  }
  const host = parsed.hostname.toLowerCase();
  // Supabase and Neon both carry the project reference in the username
  // (`postgres.<ref>`). Surfacing it means a log line names the project rather
  // than just a region — "which database did that just run against" is the
  // entire point of this module.
  const project = (parsed.username.match(/^[a-z_]*\.([a-z0-9]{8,})$/i) ?? [])[1] ?? "";
  return {
    kind: LOCAL_HOSTS.has(host) ? "local" : "remote",
    host,
    database: parsed.pathname.replace(/^\//, ""),
    project,
  };
}

/**
 * The decision, as a value.
 *
 * Kept separate from the process-exiting wrapper below so the rules are
 * unit-tested rather than only exercised by pointing a real migration at a real
 * database — which is exactly the thing we are trying to stop doing casually.
 *
 * @returns {{ allowed: boolean,
 *             reason: "local" | "remote-opted-in" | "remote-blocked" | "no-url" | "unparseable-url",
 *             target: ReturnType<typeof classifyDatabaseUrl> }}
 */
export function writeDecision(url, env = {}) {
  const target = classifyDatabaseUrl(url);
  if (target.kind === "missing") return { allowed: false, reason: "no-url", target };
  if (target.kind === "unparseable") return { allowed: false, reason: "unparseable-url", target };
  if (target.kind === "local") return { allowed: true, reason: "local", target };
  if (String(env[REMOTE_WRITE_OPT_IN] ?? "").trim() === "1") {
    return { allowed: true, reason: "remote-opted-in", target };
  }
  return { allowed: false, reason: "remote-blocked", target };
}

/** One line naming the target. Never contains credentials. */
export function describeTarget(target) {
  if (!target || !target.host) return "(none)";
  const db = target.database ? `/${target.database}` : "";
  const project = target.project ? ` (project ${target.project})` : "";
  return `${target.host}${db}${project}`;
}

/**
 * Resolve DATABASE_URL for a write, or exit with an explanation.
 *
 * Drop-in replacement for the three-line "is DATABASE_URL set" preamble every
 * migration script used to carry:
 *
 *   const url = guardWrite({ what: "migration 0011_referral_loop" });
 */
export function guardWrite({ what = "this script", env = process.env, url = env.DATABASE_URL } = {}) {
  const decision = writeDecision(url, env);
  const { target } = decision;

  if (decision.allowed) {
    if (decision.reason === "local") {
      console.log(`🔒 ${what}: local database ${describeTarget(target)}`);
    } else {
      // Deliberately loud. This is the branch that can destroy production data.
      console.warn(`⚠️  ${what}: writing to a REMOTE database — ${describeTarget(target)}`);
      console.warn(`⚠️  ${REMOTE_WRITE_OPT_IN}=1 was set explicitly. Confirm it is the one you meant.`);
    }
    return url;
  }

  if (decision.reason === "no-url") {
    console.error("❌ DATABASE_URL is not set. Pass it in the environment, or run with --env-file.");
    process.exit(1);
  }

  if (decision.reason === "unparseable-url") {
    console.error("❌ DATABASE_URL is not a URL this guard can read, so it cannot tell which database it is.");
    console.error("   Refusing to write rather than guess. Fix DATABASE_URL and re-run.");
    process.exit(1);
  }

  console.error(`❌ ${what} refused: this would write to a remote database.`);
  console.error(`   Target: ${describeTarget(target)}`);
  console.error("");
  console.error("   apps/web/.env.local points DATABASE_URL at production, so \"I passed --env-file\"");
  console.error("   is not evidence that this is safe. If this database IS the one you mean:");
  console.error("");
  console.error(`     ${REMOTE_WRITE_OPT_IN}=1 node --env-file=.env.local scripts/…`);
  console.error("");
  console.error("   If you meant to migrate a copy, point DATABASE_URL at a local Postgres instead.");
  process.exit(1);
}
