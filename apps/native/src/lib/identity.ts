/**
 * Who the user is — one answer, for every screen that shows them.
 *
 * Home and Profile were answering this DIFFERENTLY, and the phone showed it:
 *
 *   photo   Home took `user.photoUrl` first and the locally chosen photo second;
 *           Profile ignored the account photo entirely and drew initials when no
 *           local photo had been chosen. A user with a Google portrait and no
 *           locally-set photo therefore saw a face on Home and bare initials on
 *           Profile — the same person, two identities.
 *   name    Home filtered the account name through a device-name guard and fell
 *           back to the email's local part; Profile printed `user.name` raw, so
 *           the two screens could disagree on the name itself.
 *
 * The rule below is the one that matches what the product promises elsewhere:
 * the Career Profile screen tells the user their photo "shows next to your name
 * and on your CVs", so the photo they chose is the one every surface uses, and
 * the name they gave us outranks the name their Google account happens to carry.
 *
 *   name   the user's own full name → the account name when it is a real name →
 *          the email's local part → the caller's fallback
 *   photo  the photo the user chose → the account photo → nothing (caller draws
 *          initials)
 */

/**
 * True when an account name is really the device's, not a person's.
 *
 * Android hands back the phone's own name for some accounts ("Hisense",
 * "Shubham", "Redmi Note 10") and a greeting that says "Hi, Redmi" is worse than
 * one that says "Hi, hamis". Short all-lowercase tokens are caught too, because
 * an account named "hamis" is a username, not a name to greet someone with.
 */
export function looksLikeDeviceName(name: string): boolean {
  return (
    /^(hisense|samsung|xiaomi|infinix|tecno|itel|oppo|vivo|realme|nokia|huawei|redmi|android|iphone|ipad|roku|tv)\b/i.test(
      name,
    ) ||
    // A short device-model code (A125, G50, SM-A) almost always carries a digit.
    // A short PURE-LETTER string is far more likely a real Tanzanian first name
    // (Ali, Juma, Zena, Iddi) than junk — flagging those discarded a name the
    // account had given CORRECTLY and made the person retype their own name.
    // First-run learned this the hard way and carried the better rule; Home
    // carried the cruder one, and lifting Home's would have re-broken it. The
    // better rule now lives here so all three screens share it.
    (/^[a-z0-9]{1,4}$/i.test(name) && /\d/.test(name))
  );
}

export interface Identity {
  name: string;
  /** Undefined when nothing real is available — the caller draws initials. */
  photoUri?: string;
}

export function identityFor(input: {
  /** The name the user typed in Career Profile, if any. */
  profileName?: string | null;
  /** The photo the user chose, if any. */
  profilePhoto?: string | null;
  /** The signed-in account's name and picture. */
  authName?: string | null;
  authPhoto?: string | null;
  email?: string | null;
  /** Shown only when nothing else exists (Home: "there", Profile: "Not signed in"). */
  fallback: string;
}): Identity {
  const profileName = (input.profileName ?? "").trim();
  const authName = (input.authName ?? "").trim();
  const emailLocal = (input.email ?? "").split("@")[0]?.trim() ?? "";

  const name =
    profileName ||
    (authName && !looksLikeDeviceName(authName) ? authName : "") ||
    emailLocal ||
    input.fallback;

  const photoUri = (input.profilePhoto ?? "").trim() || (input.authPhoto ?? "").trim() || undefined;

  return { name, photoUri };
}
