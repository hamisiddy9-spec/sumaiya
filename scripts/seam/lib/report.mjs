/**
 * SEAM TEST — the report.
 *
 * The doctrine this file enforces:
 *   - NEVER report "works". Report "I ran X and observed Y".
 *   - A step that could not be run is UNVERIFIED or BLOCKED, never a green tick.
 *   - Every assertion is labelled with the EVIDENCE CLASS it came from, because
 *     "the page rendered" and "the row exists in Postgres" are not the same
 *     claim and must never be printed as if they were.
 *
 * Exit status is non-zero if anything FAILED **or** anything is BLOCKED: while
 * part of the journey cannot be verified, a green run would be a lie.
 */

import { createHash } from "node:crypto";

export const EVIDENCE = {
  SERVER: "server-state", // a DB row, a status code, a token response
  BYTES: "real-bytes", // a file we actually downloaded and parsed
  SOURCE: "source-read", // a constant read out of the repo
  UI: "screen-only", // what the screen showed — NEVER sufficient on its own
};

const MARK = {
  PASS: "PASS      ",
  FAIL: "FAIL      ",
  BLOCKED: "BLOCKED   ",
  UNVERIFIED: "UNVERIFIED",
  INFO: "note      ",
};

export class Report {
  constructor() {
    this.results = [];
    this.stepNo = 0;
    this.currentStep = null;
    this.lines = [];
  }

  /** Print a line to stdout immediately AND keep it for the final summary. */
  say(text = "") {
    this.lines.push(text);
    console.log(text);
  }

  step(title) {
    this.stepNo += 1;
    this.currentStep = { no: this.stepNo, title, results: [] };
    this.results.push(this.currentStep);
    this.say("");
    this.say(`── STEP ${this.stepNo}: ${title}`);
  }

  /** A raw observed fact — the thing the assertion is allowed to be about. */
  observed(text) {
    this.say(`   observed  ${text}`);
  }

  /** Assertion outcome. `evidence` says where the claim comes from. */
  check(kind, text, { evidence = EVIDENCE.SERVER, detail } = {}) {
    const entry = { kind, text, evidence, detail, step: this.currentStep?.title ?? "(pre-flight)" };
    if (this.currentStep) this.currentStep.results.push(entry);
    else this.results.push(entry);
    this.say(`   ${MARK[kind] ?? kind}  ${text}  [${evidence}]`);
    if (detail) this.say(`             ${detail}`);
    return kind === "PASS";
  }

  pass(text, opts) {
    return this.check("PASS", text, opts);
  }
  fail(text, opts) {
    return this.check("FAIL", text, opts);
  }
  blocked(text, opts) {
    return this.check("BLOCKED", text, opts);
  }
  unverified(text, opts) {
    return this.check("UNVERIFIED", text, opts);
  }
  info(text, opts) {
    return this.check("INFO", text, opts);
  }

  /** Every non-INFO result, flattened. */
  all() {
    const flat = [];
    for (const s of this.results) {
      if (Array.isArray(s.results)) flat.push(...s.results);
      else flat.push(s);
    }
    return flat;
  }

  count(kind) {
    return this.all().filter((r) => r.kind === kind).length;
  }

  summary() {
    const failed = this.count("FAIL");
    const blocked = this.count("BLOCKED");
    const unverified = this.count("UNVERIFIED");
    const passed = this.count("PASS");

    this.say("");
    this.say("════════════════════════════════════════════════════════════════════");
    this.say(`SEAM SUMMARY: ${passed} passed · ${failed} FAILED · ${blocked} BLOCKED · ${unverified} unverified`);
    this.say("════════════════════════════════════════════════════════════════════");

    if (failed) {
      this.say("");
      this.say("WHAT IS BROKEN RIGHT NOW (assertions the product does not satisfy):");
      for (const r of this.all().filter((x) => x.kind === "FAIL")) {
        this.say(`  FAIL  [${r.step}] ${r.text}`);
        if (r.detail) this.say(`        ${r.detail}`);
      }
    }
    if (blocked) {
      this.say("");
      this.say("BLOCKED — cannot be verified from here, and NOT counted as working:");
      for (const r of this.all().filter((x) => x.kind === "BLOCKED")) {
        this.say(`  BLOCKED  [${r.step}] ${r.text}`);
        if (r.detail) this.say(`           ${r.detail}`);
      }
    }
    if (unverified) {
      this.say("");
      this.say("UNVERIFIED — no assertion was possible:");
      for (const r of this.all().filter((x) => x.kind === "UNVERIFIED")) {
        this.say(`  UNVERIFIED  [${r.step}] ${r.text}`);
      }
    }

    // A seam test is only green when the WHOLE journey was verified. Anything
    // blocked keeps it red on purpose: "we could not check" is not "it works".
    const exitCode = failed + blocked > 0 ? 1 : 0;
    this.say("");
    this.say(
      exitCode === 0
        ? "SEAM: GREEN — the whole journey was exercised and every assertion held."
        : `SEAM: RED — ${failed} broken, ${blocked} unverifiable. This is not a working journey.`,
    );
    return { passed, failed, blocked, unverified, exitCode };
  }
}

export function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}
