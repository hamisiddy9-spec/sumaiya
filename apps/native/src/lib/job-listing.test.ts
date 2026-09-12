import { isExpiredListing } from "./job-listing";

describe("isExpiredListing", () => {
  it("treats a past deadline as expired", () => {
    expect(isExpiredListing("2020-01-01T00:00:00.000Z")).toBe(true);
  });

  it("treats a future deadline as not expired", () => {
    expect(isExpiredListing("2099-01-01T00:00:00.000Z")).toBe(false);
  });

  it("treats no deadline as not expired — unknown is not expired", () => {
    expect(isExpiredListing(undefined)).toBe(false);
    expect(isExpiredListing(null)).toBe(false);
  });
});
