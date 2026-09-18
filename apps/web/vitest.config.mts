import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));

// Unit tests target the DETERMINISTIC engines (job matching, guardrails) — the
// pure logic the AI features are built on. LLM output itself is non-deterministic
// and is not asserted here; we test the parts that must always behave the same.
export default defineConfig({
  // Next's tsconfig sets `jsx: "preserve"` (it must, or next build fails), which
  // leaves JSX untransformed and makes any test that imports a .tsx component
  // die with "invalid JS syntax". Rendering is the only way to prove what an
  // admin actually SEES on a page whose numbers can each be individually
  // correct while the page still misleads (see
  // components/admin/campaign-funnel-view.test.ts), so tests compile JSX with
  // the automatic runtime. Costs nothing for .ts tests — no .ts file has JSX.
  //
  // Vite 8 transforms with oxc, not esbuild: the `esbuild: { jsx }` option is
  // read but the tsconfig still wins, so the runtime must be set on `oxc`.
  oxc: { jsx: { runtime: "automatic" } },
  resolve: { alias: { "@": dir, "server-only": path.join(dir, "test/server-only-stub.ts"), "client-only": path.join(dir, "test/server-only-stub.ts") } },
  test: {
    include: ["**/*.test.ts"],
    // Stale git worktrees from old background sessions live under .claude/ and
    // carry Expo/mobile test files that don't belong to this (web) project.
    exclude: ["**/node_modules/**", "**/.claude/**", "**/.next/**"],
    environment: "node",
    // Strips provider API keys before any test file loads, so nothing in the
    // suite can reach a real (paid) AI provider — see the file for why.
    setupFiles: [path.join(dir, "test/hermetic-ai-env.ts")],
    pool: "forks",
    maxWorkers: process.env.VITEST_PARALLEL === "1" ? undefined : 1,
    minWorkers: 1,
    // This dev box (7.6GB) OOMs on parallel test files; CI can flip this.
    fileParallelism: process.env.VITEST_PARALLEL === "1",
  },
});
