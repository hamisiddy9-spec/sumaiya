/**
 * SEAM TEST — the LOCAL app server, on an ISOLATED copy of the app source.
 *
 * WHY THE COPY EXISTS (this is not tidiness — it is the fix for a false failure)
 * `next dev` writes its chunk manifests into `apps/web/.next`. Other agents work
 * in this same repo and run `next build` / vitest against that same directory, so
 * chunks get rewritten mid-request: the browser then logs
 *
 *   ChunkLoadError: Loading chunk app/(app)/layout failed
 *   SyntaxError: Invalid or unexpected token
 *   Warning: An error occurred during hydration
 *
 * …the page never hydrates, the autosave effect never runs, the download handler
 * is never wired, and a test that reads those symptoms as product bugs accuses a
 * working feature. That is exactly what happened on the first runs of this suite.
 *
 * So the seam run never shares a build directory: it copies `apps/web` to
 * `<scratch>/app-runtime/apps/web`, junction-links the read-only trees it does
 * not modify (node_modules, packages), and serves from there. The app's code is
 * the working tree's code (copied fresh every run); only its build output is
 * private.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(HERE, "..", "..", "..");
const WEB = path.join(REPO, "apps", "web");
const req = createRequire(path.join(WEB, "package.json"));

/** Directories that must never be shared with another writer. */
const NEVER_COPY = new Set([".next", "node_modules", ".turbo", "coverage", "test-results", "playwright-report", ".vercel"]);
/** A repo-local env file would silently re-point the run at another database. */
const NEVER_COPY_FILES = new Set([".env.local"]);

/**
 * Copy the app source into a scratch tree with its own `.next`.
 * @returns {{runtime:string, webDir:string, files:number, bytes:number, junctioned:string[]}}
 */
export function prepareRuntimeCopy({ outDir, repoRoot = REPO, attempt = 1 }) {
  // A DISTINCT directory per attempt: deleting a tree a still-running dev server
  // holds handles in fails on Windows, and would add a half-state instead of a
  // clean retry.
  const runtime = path.join(outDir, `app-runtime-${attempt}`);
  const webDst = path.join(runtime, "apps", "web");
  // Fresh every attempt: a stale copy would be a stale claim about the tree.
  fs.rmSync(webDst, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  fs.mkdirSync(webDst, { recursive: true });

  let files = 0;
  let bytes = 0;
  fs.cpSync(path.join(repoRoot, "apps", "web"), webDst, {
    recursive: true,
    dereference: false,
    filter: (src) => {
      const base = path.basename(src);
      if (NEVER_COPY.has(base) || NEVER_COPY_FILES.has(base)) return false;
      return true;
    },
  });
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile()) {
        files += 1;
        bytes += fs.statSync(full).size;
      }
    }
  };
  walk(webDst);

  // The copy's tsconfig extends `../../tsconfig.base.json`, so the root files it
  // referenced must exist at the same relative spot.
  for (const f of ["tsconfig.base.json", "package.json"]) {
    const from = path.join(repoRoot, f);
    if (fs.existsSync(from)) fs.copyFileSync(from, path.join(runtime, f));
  }

  // Read-only shares. Nothing in this run writes into them, so a junction is
  // safe and avoids copying hundreds of megabytes.
  const junctioned = [];
  const link = (target, linkPath) => {
    if (fs.existsSync(linkPath) || !fs.existsSync(target)) return;
    fs.symlinkSync(target, linkPath, "junction");
    junctioned.push(`${path.relative(runtime, linkPath)} → ${target}`);
  };
  link(path.join(repoRoot, "node_modules"), path.join(runtime, "node_modules"));
  link(path.join(repoRoot, "packages"), path.join(runtime, "packages"));
  link(path.join(repoRoot, "node_modules"), path.join(webDst, "node_modules"));

  return { runtime, webDir: webDst, files, bytes, junctioned };
}

/** First port at or above `start` that nothing is listening on. */
export async function findFreePort(start) {
  for (let p = start; p < start + 40; p += 1) {
    if (await isBindable(p)) return p;
  }
  return start;
}

/**
 * Ask the OPERATING SYSTEM for a free port.
 *
 * A fixed port is a hidden shared dependency between every run and every agent on
 * the machine — the same class of fault as a shared build directory. A run that
 * dies can also leave the port poisoned for the next one (observed: an orphaned
 * `next dev` holding :3010 with 2.6 GB, which then made the NEXT run fail with
 * EADDRINUSE reported as "exited early with code 0").
 */
export async function askOsForFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

/** Can this process bind the port right now? (Occupied ≠ answering HTTP.) */
export async function isBindable(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => srv.close(() => resolve(true)));
    srv.listen(port, "127.0.0.1");
  });
}

/** Kill a spawned server AND its children (Windows: a plain kill can orphan). */
export function killServerTree(child) {
  if (!child || child.killed) return;
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    }
    child.kill();
  } catch {
    /* best effort — cleanup must never throw */
  }
}

export async function appHealth(port) {
  return health(port);
}

async function health(port) {
  try {
    const res = await fetch(`http://localhost:${port}/api/health`, { signal: AbortSignal.timeout(4000) });
    const body = await res.json().catch(() => null);
    return { up: res.status === 200 && body?.ok === true, status: res.status, body };
  } catch (err) {
    return { up: false, error: err.message };
  }
}

/**
 * Bring up an app server for the run.
 *
 * ORDER MATTERS: probe first, spawn second. A server that is already healthy on
 * the port is REUSED (and the report says so) — never fatal, never duplicated.
 * Only when nothing answers is a dev server spawned, and then on a port that is
 * actually bindable.
 */
export async function ensureAppServer({ port, env, outDir, webDir = WEB, waitMs = 150_000, reuse = true }) {
  const existing = await health(port);
  if (existing.up && reuse) {
    return { ok: true, port, started: false, reused: true, health: existing.body };
  }

  let bindPort = port;
  if (!(await isBindable(bindPort))) {
    bindPort = await findFreePort(port + 1);
    if (!(await isBindable(bindPort))) bindPort = await askOsForFreePort();
  }

  const nextBin = req.resolve("next/dist/bin/next");
  fs.mkdirSync(outDir, { recursive: true });
  const logPath = path.join(outDir, `next-dev-${bindPort}.log`);
  const log = fs.createWriteStream(logPath, { flags: "w" });

  const child = spawn(process.execPath, [nextBin, "dev", "-p", String(bindPort)], {
    cwd: webDir,
    env: { ...process.env, ...env, PORT: String(bindPort) },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  child.stdout.pipe(log);
  child.stderr.pipe(log);

  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000));
    if (child.exitCode !== null) {
      // Name the real cause: "exited early with code 0" hid an EADDRINUSE.
      let tail = "";
      try {
        tail = fs.readFileSync(logPath, "utf8").split(/\r?\n/).filter(Boolean).slice(-4).join(" | ");
      } catch {
        /* log unreadable — the exit code is still the observation */
      }
      const addrInUse = /EADDRINUSE/i.test(tail);
      return {
        ok: false,
        port: bindPort,
        started: true,
        child,
        logPath,
        webDir,
        error: addrInUse
          ? `port ${bindPort} was already in use when the server tried to bind (EADDRINUSE) — a previous run's server is still holding it. Its log: ${tail}`
          : `next dev exited early with code ${child.exitCode} — see ${logPath} (${tail})`,
      };
    }
    const h = await health(bindPort);
    if (h.up) return { ok: true, port: bindPort, started: true, health: h.body, logPath, webDir, child };
  }
  killServerTree(child);
  return {
    ok: false,
    port: bindPort,
    started: true,
    child,
    logPath,
    webDir,
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
