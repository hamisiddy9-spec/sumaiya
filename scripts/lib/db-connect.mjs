/**
 * ONE WAY FOR A SCRIPT TO OPEN THE PRODUCTION DATABASE.
 *
 * The bug this exists to stop, measured 2026-10-07: `scripts/assert-rls.mjs` — the nightly guard
 * that proves the public anon key cannot read user data — had been DEAD for four days, failing
 * every night with
 *
 *     Error: self-signed certificate in certificate chain
 *     code: 'SELF_SIGNED_CERT_IN_CHAIN'
 *
 * The file already passed `ssl: { rejectUnauthorized: false }`, which should tolerate exactly that
 * certificate. It did not, because libpq's `sslmode` in the connection STRING takes precedence over
 * the `ssl` option passed to `pg` — and since pg 8.11 the mode `require` is treated as
 * `verify-full`, so the chain was verified no matter what the code asked for. `pg` says so out loud
 * in the run log; it reads as a warning and buries the cause of a four-day red.
 *
 * A guard that cannot connect is worse than no guard: it reports red, red looks like "the hole is
 * open", and the actual state of production RLS stays unexamined. `scripts/tmp-query-campaign.mjs`
 * had already found this and stripped `sslmode` privately; the three other scripts that connect the
 * same way had not. So the strip lives here now, once, instead of in whichever script remembered.
 *
 * VERIFICATION, stated plainly: this relaxes certificate verification, which is a real trade and
 * deliberately visible rather than hidden in a script. Supabase's pooler is reachable only over
 * TLS, so the connection is still encrypted; what is given up is proof that the endpoint is the one
 * it claims to be. The stronger fix is to verify against Supabase's own CA
 * (`sslmode=verify-full` plus the project CA cert); do that when the CA is available, and this
 * helper is where it should be wired. Until then the relaxation is announced on every run so it can
 * never be mistaken for verified.
 */

/** Strip libpq's `sslmode` (and its partner flags) so the explicit `ssl` option governs. */
export function stripSslParams(raw) {
  if (!raw) return raw;
  // 1. Remove the params, keeping whatever separator preceded each one.
  let out = raw.replace(
    /([?&])(sslmode|sslcert|sslkey|sslrootcert|sslcrl|uselibpqcompat)=[^&]*/g,
    "$1",
  );
  // 2. Tidy the separators the removal left behind.
  //
  // This step is not cosmetic: removing the FIRST param leaves the query starting `?&`, and
  // removing the LAST one leaves a trailing separator. Getting it wrong silently corrupts the URL
  // for any connection string that carries another parameter — the first version of this function
  // turned `…/db?sslmode=require&foo=bar` into `…/db&foo=bar`, which `pg` would read as a database
  // named `db&foo=bar`. Caught by assert-rls's own probe, not by a live run.
  out = out
    .replace(/\?&+/g, "?") // ?&  / ?&&  -> ?
    .replace(/&{2,}/g, "&") // &&   -> &
    .replace(/[?&]+$/g, ""); // a trailing separator, or a query that is now empty
  return out;
}

/**
 * Options for `new Client(...)` / `new Pool(...)`.
 *
 * `verify` defaults to false (working today); pass a CA path to verify properly instead.
 */
export function connectOptions(url, { verify = false } = {}) {
  const connectionString = stripSslParams(url);
  if (verify) return { connectionString, ssl: { rejectUnauthorized: true, ca: verify } };
  return { connectionString, ssl: { rejectUnauthorized: false } };
}

/**
 * A one-line notice for the run log, so "we skipped verification" is never silent.
 * @param {unknown} err
 */
export function isConnectFailure(err) {
  const code = err?.code ?? "";
  const msg = String(err?.message ?? "");
  return (
    code === "SELF_SIGNED_CERT_IN_CHAIN" ||
    code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
    code === "CERT_HAS_EXPIRED" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT" ||
    code === "28P01" || // invalid_password
    /tenant or user .* not found/i.test(msg) ||
    /getaddrinfo|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|self.signed certificate/i.test(msg)
  );
}
