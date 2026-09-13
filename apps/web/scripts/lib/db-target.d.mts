/** Types for db-target.mjs — the scripts are plain ESM run by `node`, so the
 *  logic lives in .mjs and the (TS) test needs a declaration to import it. */

export declare const REMOTE_WRITE_OPT_IN: "ALLOW_REMOTE_WRITE";

export type DbTargetKind = "missing" | "unparseable" | "local" | "remote";

export interface DbTarget {
  kind: DbTargetKind;
  host: string;
  database: string;
  project: string;
}

export type DbWriteReason =
  | "local"
  | "remote-opted-in"
  | "remote-blocked"
  | "no-url"
  | "unparseable-url";

export interface DbWriteDecision {
  allowed: boolean;
  reason: DbWriteReason;
  target: DbTarget;
}

export declare function classifyDatabaseUrl(url?: string | null): DbTarget;

export declare function writeDecision(
  url: string | undefined,
  env?: Record<string, string | undefined>,
): DbWriteDecision;

export declare function describeTarget(target: DbTarget): string;

export declare function guardWrite(options?: {
  what?: string;
  env?: Record<string, string | undefined>;
  url?: string;
}): string;
