import { describe, it, expect } from "vitest";
import {
  classifyDatabaseUrl,
  describeTarget,
  writeDecision,
  REMOTE_WRITE_OPT_IN,
} from "./db-target.mjs";

// The production URL this guard was written against, with the password
// replaced. It is a Supabase pooler with the project ref in the username.
const PROD = "postgresql://postgres.ayczgaddnufdxnhizpcr:pw@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require";

describe("classifyDatabaseUrl", () => {
  it("reads a postgres URL: host, database and project ref", () => {
    expect(classifyDatabaseUrl(PROD)).toEqual({
      kind: "remote",
      host: "aws-1-eu-central-1.pooler.supabase.com",
      database: "postgres",
      project: "ayczgaddnufdxnhizpcr",
    });
  });

  it("treats this machine as local", () => {
    for (const url of [
      "postgresql://postgres:postgres@localhost:5432/sumaiya_dev",
      "postgres://u:p@127.0.0.1/sumaiya",
      "postgresql://u:p@host.docker.internal:5432/db",
    ]) {
      expect(classifyDatabaseUrl(url).kind).toBe("local");
    }
  });

  it("treats anything else as remote — no cloud host is special-cased", () => {
    for (const url of [
      PROD,
      "postgresql://user:pw@ep-cool-branch-12345.eu-central-1.aws.neon.tech/neondb",
      "postgresql://u:p@10.0.0.5:5432/prod",
    ]) {
      expect(classifyDatabaseUrl(url).kind).toBe("remote");
    }
  });

  it("never mistakes a lookalike for a local host", () => {
    // `localhost.evil.com` is not localhost. Prefix matching here would be a
    // way to walk straight past the guard.
    expect(classifyDatabaseUrl("postgresql://u:p@localhost.evil.com/db").kind).toBe("remote");
    expect(classifyDatabaseUrl("postgresql://u:p@127.0.0.1.evil.com/db").kind).toBe("remote");
  });

  it("flags an absent or unreadable URL instead of guessing", () => {
    expect(classifyDatabaseUrl(undefined).kind).toBe("missing");
    expect(classifyDatabaseUrl("").kind).toBe("missing");
    expect(classifyDatabaseUrl("   ").kind).toBe("missing");
    expect(classifyDatabaseUrl("not a url").kind).toBe("unparseable");
  });

  it("does not leak the password into a log line", () => {
    const line = describeTarget(classifyDatabaseUrl(PROD));
    expect(line).toBe("aws-1-eu-central-1.pooler.supabase.com/postgres (project ayczgaddnufdxnhizpcr)");
    expect(line).not.toContain("pw");
  });
});

describe("writeDecision", () => {
  it("allows a local database with no opt-in", () => {
    const d = writeDecision("postgresql://u:p@localhost:5432/dev", {});
    expect(d.allowed).toBe(true);
    expect(d.reason).toBe("local");
  });

  it("BLOCKS production — the whole point of the guard", () => {
    // The failure mode this replaces: `node --env-file=.env.local
    // scripts/migrate-x.mjs`, where .env.local is production and nothing said so.
    const d = writeDecision(PROD, {});
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("remote-blocked");
    expect(d.target.host).toContain("supabase.com");
  });

  it("blocks a remote dev branch too — shared state is still shared state", () => {
    const d = writeDecision("postgresql://u:p@ep-x.neon.tech/neondb", {});
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("remote-blocked");
  });

  it("blocks when DATABASE_URL is missing or unreadable", () => {
    expect(writeDecision(undefined, {}).reason).toBe("no-url");
    expect(writeDecision("nonsense", {}).reason).toBe("unparseable-url");
  });

  it("allows a remote write only on an explicit, exact opt-in", () => {
    const d = writeDecision(PROD, { [REMOTE_WRITE_OPT_IN]: "1" });
    expect(d.allowed).toBe(true);
    expect(d.reason).toBe("remote-opted-in");
  });

  it("treats a near-miss opt-in as NOT opted in", () => {
    // An env var set to "true", "yes", "0" or "" is a mistake, not a decision.
    for (const v of ["true", "yes", "TRUE", "0", "", " 1x", "11"]) {
      expect(writeDecision(PROD, { [REMOTE_WRITE_OPT_IN]: v }).allowed).toBe(false);
    }
    // ...but surrounding whitespace is just a shell quoting artefact.
    expect(writeDecision(PROD, { [REMOTE_WRITE_OPT_IN]: " 1 " }).allowed).toBe(true);
  });

  it("the opt-in cannot be satisfied by an unrelated variable", () => {
    const env = { ALLOW_REMOTE_WRITES: "1", REMOTE_WRITE_OPT_IN: "1", FORCE: "1", NODE_ENV: "development" };
    expect(writeDecision(PROD, env).allowed).toBe(false);
  });
});
