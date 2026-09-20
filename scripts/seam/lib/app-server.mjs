/**
 * SEAM TEST — the LOCAL app server.
 *
 * The journey must run against real code, not a mock. This starts `next dev`
 * from `apps/web` on a spare port with the secrets file's env, then WAITS for a
 * real `/api/health` 200 before returning. If the server never comes up the
 * caller gets a specific reason and the seam run exits non-zero — a seam test
 * that silently tests nothing is worse than no test.
 *
 * If something is already listening on the port, that is used instead (so a
 * developer's running dev server is never killed).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(HERE, "..", "..", "..");
const WEB = path.join(REPO, "apps", "web");
const req = createRequire(path.join(WEB, "package.json"));

async function health(port) {
  try {
    const res = await fetch(`http://localhost:${port}/api/health`, {
      signal: AbortSignal.timeout(4000),
    });
    const body = await res.json().catch(() => null);
    return { up: res.status === 200 && body?.ok === true, status: res.status, body };
  } catch (err) {
    return { up: false, error: err.message };
  }
}

/**
 * @returns {Promise<{ok:boolean, port:number, started:boolean, child?:object,
 *                    health?:object, logPath?:string, error?:string}>}
 */
export async function ensureAppServer({ port, env, outDir, waitMs = 120_000 }) {
  const existing = await health(port);
  if (existing.up) return { ok: true, port, started: false, health: existing.body };

  const nextBin = req.resolve("next/dist/bin/next");
  fs.mkdirSync(outDir, { recursive: true });
  const logPath = path.join(outDir, `next-dev-${port}.log`);
  const log = fs.createWriteStream(logPath, { flags: "w" });

  const child = spawn(process.execPath, [nextBin, "dev", "-p", String(port)], {
    cwd: WEB,
    env: { ...process.env, ...env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  child.stdout.pipe(log);
  child.stderr.pipe(log);

  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000));
    if (child.exitCode !== null) {
      return {
        ok: false,
        port,
        started: true,
        child,
        logPath,
        error: `next dev exited early with code ${child.exitCode} — see ${logPath}`,
      };
    }
    const h = await health(port);
    if (h.up) return { ok: true, port, started: true, child, health: h.body, logPath };
  }
  try {
    child.kill();
  } catch {
    /* best effort */
  }
  return {
    ok: false,
    port,
    started: true,
    child,
    logPath,
    error: `next dev did not answer /api/health within ${waitMs}ms — see ${logPath}`,
  };
}

/** The env the app needs. Values are passed straight through; none are printed. */
export function appEnv({ secrets, appUrl, resolveEnv }) {
  const names = [
    "DATABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "CRON_SECRET",
    "DEEPSEEK_API_KEY",
    "NEXT_PUBLIC_POSTHOG_KEY",
    "NEXT_PUBLIC_POSTHOG_HOST",
  ];
  const env = {};
  for (const n of names) {
    const v = resolveEnv(n, secrets);
    if (v) env[n] = v;
  }
  env.NEXT_PUBLIC_APP_URL = appUrl;
  return env;
}
