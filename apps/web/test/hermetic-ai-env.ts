// Keep the test run off the network — for every test file, by construction.
//
// `providerOrder()` reads process.env at CALL time, so a developer box with a
// real provider key exported (this one has OPENAI_API_KEY) turns every
// generative-executor test into a live HTTPS request to a paid provider. That
// is what happened here: `lib/assistant/run-tool.test.ts` — a test whose whole
// point is "no AI provider in CI → ai_unavailable" — was reaching out to
// api.openai.com, paying ~0.7–1.2s per test, and then tripping vitest's 5s
// timeout as soon as the box was under load. The assertion was correct; the
// environment was never pinned, so the test passed for the wrong reason and
// went red for a reason that had nothing to do with the code.
//
// A second leak made it worse: `lib/api/ai-provider.test.ts` set
// `process.env.OPENROUTER_API_KEY="***"` and restored process.env by
// reassignment on the LAST line of each test. With `pool: forks, maxWorkers: 1,
// fileParallelism: false` the same process runs many files in sequence, so a
// key invented by one test file (or left behind when an assertion threw before
// the restore) was visible to every file after it. File order decided behaviour.
//
// So: strip the provider env once per test file, before the module under test
// runs. Tests that need to exercise provider selection still can — they call
// `vi.stubEnv()` and `vi.unstubAllEnvs()`, which is scoped and cannot leak.
//
// Anything that reads a provider key now has to opt in explicitly, and
// `lib/api/ai-provider.test.ts` asserts that the baseline really is clean so
// this cannot silently regress.

import { afterAll } from "vitest";

/** Every env var `providerOrder()` / the model resolvers can act on. */
export const AI_PROVIDER_ENV_KEYS = [
  "LITELLM_BASE_URL",
  "LITELLM_API_KEY",
  "DEEPSEEK_API_KEY",
  "DEEPSEEK_MODEL",
  "DEEPSEEK_MODEL_DEEP",
  "OPENROUTER_API_KEY",
  "OPENROUTER_MODEL_FREE",
  "OPENROUTER_MODEL_PAID",
  "OPENROUTER_MODEL_DEEP",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
] as const;

const saved = new Map<string, string | undefined>();
for (const key of AI_PROVIDER_ENV_KEYS) {
  saved.set(key, process.env[key]);
  delete process.env[key];
}

// Setup files run per test file. Vitest isolates files, so this restore is
// belt-and-braces rather than load-bearing — but an env that is cleaned up
// deterministically is one less thing that depends on how the pool is
// configured today.
afterAll(() => {
  for (const [key, value] of saved) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
