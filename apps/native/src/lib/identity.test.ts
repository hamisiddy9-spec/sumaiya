import { identityFor, looksLikeDeviceName } from "./identity";

/**
 * The identity rule, and the bug it exists to kill.
 *
 * Home and Profile disagreed on the same person: Home preferred the account
 * photo, Profile showed initials, and the name was filtered on one screen and
 * raw on the other. Every test below is one half of "both screens answer the
 * same question the same way".
 */
describe("identityFor — one answer for every surface", () => {
  it("prefers the name the user gave us over the account's", () => {
    const id = identityFor({
      profileName: "Hamis Iddy",
      authName: "hamisiddy9",
      email: "hamisiddy9@gmail.com",
      fallback: "there",
    });
    expect(id.name).toBe("Hamis Iddy");
  });

  it("skips an account name that is really the device's", () => {
    expect(
      identityFor({ authName: "Hisense", email: "hamis@example.com", fallback: "there" }).name,
    ).toBe("hamis");
    expect(
      identityFor({ authName: "Redmi Note 10", email: "asha@example.com", fallback: "there" }).name,
    ).toBe("asha");
    // A short token is junk only when it carries a digit (A125, G50, sm-a1).
    // "Ali" and "Juma" are real Tanzanian names, and an earlier rule that threw
    // those away made people retype a name their account already had.
    expect(identityFor({ authName: "ab7", email: "h@example.com", fallback: "there" }).name).toBe("h");
    expect(identityFor({ authName: "A125", email: "h@example.com", fallback: "there" }).name).toBe("h");
    expect(identityFor({ authName: "Ali", email: "h@example.com", fallback: "there" }).name).toBe("Ali");
    expect(identityFor({ authName: "Juma", email: "h@example.com", fallback: "there" }).name).toBe("Juma");
    expect(identityFor({ authName: "hamis", email: "h@example.com", fallback: "there" }).name).toBe("hamis");
  });

  it("keeps a real account name", () => {
    expect(
      identityFor({ authName: "Asha Mwinyi", email: "asha@example.com", fallback: "there" }).name,
    ).toBe("Asha Mwinyi");
  });

  it("falls back to the caller's word only when there is nothing at all", () => {
    expect(identityFor({ fallback: "there" }).name).toBe("there");
    expect(identityFor({ fallback: "Not signed in" }).name).toBe("Not signed in");
  });

  it("uses the photo the user CHOSE first — it is the one on their CVs", () => {
    const id = identityFor({
      profilePhoto: "file:///local/me.jpg",
      authPhoto: "https://lh3.googleusercontent.com/me.jpg",
      fallback: "there",
    });
    expect(id.photoUri).toBe("file:///local/me.jpg");
  });

  it("falls back to the account photo instead of showing initials", () => {
    // THE REPORTED BUG: Home drew the Google portrait while Profile drew initials
    // for the same person, because Profile never looked at the account photo.
    const id = identityFor({
      authPhoto: "https://lh3.googleusercontent.com/me.jpg",
      fallback: "there",
    });
    expect(id.photoUri).toBe("https://lh3.googleusercontent.com/me.jpg");
  });

  it("reports no photo at all when there is none, so initials are drawn", () => {
    expect(identityFor({ fallback: "there" }).photoUri).toBeUndefined();
    expect(identityFor({ profilePhoto: "   ", authPhoto: "", fallback: "there" }).photoUri).toBeUndefined();
  });

  it("whitespace is not a name and not a photo", () => {
    const id = identityFor({ profileName: "  ", profilePhoto: "  ", email: "ali@example.com", fallback: "there" });
    expect(id.name).toBe("ali");
    expect(id.photoUri).toBeUndefined();
  });

  describe("looksLikeDeviceName", () => {
    it("catches the phone's own name from a real device list", () => {
      for (const n of ["Hisense", "Samsung", "Xiaomi Redmi", "Infinix HOT", "Tecno", "itel", "Redmi", "Android", "iPhone"]) {
        expect(looksLikeDeviceName(n)).toBe(true);
      }
    });
    it("does not catch real names", () => {
      for (const n of ["Hamis", "Asha Mwinyi", "Juma Ali", "Neema"]) {
        expect(looksLikeDeviceName(n)).toBe(false);
      }
    });
  });
});
