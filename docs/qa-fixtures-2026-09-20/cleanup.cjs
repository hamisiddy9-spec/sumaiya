// CLEANUP + RESIDUAL COUNTS. Deletes everything this QA run created for the
// throwaway test user, then re-counts to prove it is gone. Leaves the one real
// user alone. Prints counts only — never the key.
const fs = require("fs");
const path = require("path");
const { connect } = require("./db.cjs");
const EMAIL = process.argv[2] || "qa-io-matrix-1@sumaiya-seam.invalid";

const TABLES = ["cv", "cover_letter", "letter", "business_card", "download_log", "document_version",
  "application", "ats_score_snapshot", "ai_usage", "user_profile", "tool_invocation", "provenance",
  "app_event", "job_recommendation", "outcome_event", "signal_notification", "device_token",
  "web_push_subscription", "referral_claim", "referral_code", "eval_sample"];

(async () => {
  const c = await connect();
  const { rows } = await c.query("select id from auth.users where email = $1", [EMAIL]);
  const uid = rows.length ? rows[0].id : null;
  console.log("test user:", EMAIL, "| auth.users row present:", !!uid);
  if (!uid) { console.log("nothing to clean"); await c.end(); return; }

  const before = {};
  for (const t of TABLES) {
    try {
      const r = await c.query(`select count(*)::int as n from ${t} where user_id = $1`, [uid]);
      if (r.rows[0].n) before[t] = r.rows[0].n;
    } catch (e) { /* table may not have user_id */ }
  }
  console.log("BEFORE:", JSON.stringify(before));

  // delete in FK-safe order, then the auth user (cascade handles the rest)
  for (const t of ["download_log", "document_version", "ats_score_snapshot", "application", "cv",
    "cover_letter", "letter", "business_card", "ai_usage", "user_profile", "tool_invocation",
    "provenance", "job_recommendation", "outcome_event", "signal_notification", "device_token",
    "web_push_subscription", "referral_claim", "referral_code", "eval_sample", "app_event"]) {
    try {
      const r = await c.query(`delete from ${t} where user_id = $1`, [uid]);
      if (r.rowCount) console.log(`  deleted ${r.rowCount} from ${t}`);
    } catch (e) { /* ignore */ }
  }
  const del = await c.query("delete from auth.users where id = $1", [uid]);
  console.log("deleted auth.users rows:", del.rowCount);

  // residual report
  const after = {};
  for (const t of TABLES) {
    try {
      const r = await c.query(`select count(*)::int as n from ${t} where user_id = $1`, [uid]);
      if (r.rows[0].n) after[t] = r.rows[0].n;
    } catch (e) { /* */ }
  }
  const u = await c.query("select count(*)::int as n from auth.users where email like '%@sumaiya-seam.invalid'");
  const real = await c.query("select count(*)::int as n from auth.users where email not like '%@sumaiya-seam.invalid'");

  console.log("\nAFTER (rows still carrying the deleted user id):", JSON.stringify(after));
  console.log("residual @sumaiya-seam.invalid auth users:", u.rows[0].n);
  console.log("real (non-throwaway) auth users remaining:", real.rows[0].n);
  fs.writeFileSync(path.join(__dirname, "results-cleanup.json"), JSON.stringify({ email: EMAIL, before, after, residualSeamUsers: u.rows[0].n, realUsers: real.rows[0].n }, null, 1));
  await c.end();
})().catch((e) => { console.error("FATAL", String(e).slice(0, 400)); process.exit(1); });
