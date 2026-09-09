import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));

// Unit tests target the DETERMINISTIC engines (job matching, guardrails) — the
// pure logic the AI features are built on. LLM output itself is non-deterministic
// and is not asserted here; we test the parts that must always behave the same.
export default defineConfig({
  resolve: { alias: { "@": dir, "server-only": path.join(dir, "test/server-only-stub.ts"), "client-only": path.join(dir, "test/server-only-stub.ts") } },
  test: {
    include: ["**/*.test.ts"],
    // Stale git worktrees from old background sessions live under .claude/ and
    // carry Expo/mobile test files that don't belong to this (web) project.
    exclude: ["**/node_modules/**", "**/.claude/**", "**/.next/**"],
    environment: "node",
    pool: "forks",
    maxWorkers: process.env.VITEST_PARALLEL === "1" ? undefined : 1,
    minWorkers: 1,
    // This dev box (7.6GB) OOMs on parallel test files; CI can flip this.
    fileParallelism: process.env.VITEST_PARALLEL === "1",
  },
});
