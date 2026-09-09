import { describe, it, expect } from "vitest";
import { isPrivateHost, redirectTarget } from "./ai-ssrf";

describe("SSRF guard — isPrivateHost", () => {
  it("blocks obvious private hostnames", async () => {
    expect(await isPrivateHost("localhost")).toBe(true);
    expect(await isPrivateHost("LOCALHOST")).toBe(true);
    expect(await isPrivateHost("myhost.local")).toBe(true);
    expect(await isPrivateHost("foo.internal")).toBe(true);
    expect(await isPrivateHost("metadata.google.internal")).toBe(true);
    expect(await isPrivateHost("0.0.0.0")).toBe(true);
  });

  it("blocks dotted-quad private IPv4 literals", async () => {
    expect(await isPrivateHost("127.0.0.1")).toBe(true);
    expect(await isPrivateHost("127.1.2.3")).toBe(true);
    expect(await isPrivateHost("10.0.0.1")).toBe(true);
    expect(await isPrivateHost("192.168.1.1")).toBe(true);
    expect(await isPrivateHost("172.16.0.1")).toBe(true);
    expect(await isPrivateHost("172.31.255.255")).toBe(true);
    expect(await isPrivateHost("169.254.169.254")).toBe(true); // cloud metadata
    expect(await isPrivateHost("100.64.0.1")).toBe(true); // CGNAT
    expect(await isPrivateHost("0.0.0.5")).toBe(true);
  });

  it("blocks decimal integer IPv4 encoding (2130706433 == 127.0.0.1)", async () => {
    expect(await isPrivateHost("2130706433")).toBe(true);
    expect(await isPrivateHost("3232235777")).toBe(true); // 192.168.1.1
    expect(await isPrivateHost("2852039166")).toBe(true); // 169.254.169.254
  });

  it("blocks hex integer IPv4 encoding (0x7f000001 == 127.0.0.1)", async () => {
    expect(await isPrivateHost("0x7f000001")).toBe(true);
    expect(await isPrivateHost("0x7F000001")).toBe(true);
    expect(await isPrivateHost("0x0a000001")).toBe(true); // 10.0.0.1
  });

  it("blocks octal dotted IPv4 encoding (0177.0.0.1 == 127.0.0.1)", async () => {
    expect(await isPrivateHost("0177.0.0.1")).toBe(true);
    expect(await isPrivateHost("012.0.0.1")).toBe(true); // 10.0.0.1
  });

  it("blocks IPv4-mapped IPv6 literals (::ffff:127.0.0.1)", async () => {
    expect(await isPrivateHost("::ffff:127.0.0.1")).toBe(true);
    expect(await isPrivateHost("::ffff:169.254.169.254")).toBe(true);
    expect(await isPrivateHost("[::ffff:10.0.0.1]")).toBe(true);
  });

  it("blocks IPv6 private/reserved literals", async () => {
    expect(await isPrivateHost("::1")).toBe(true);
    expect(await isPrivateHost("::")).toBe(true);
    expect(await isPrivateHost("fc00::1")).toBe(true); // ULA
    expect(await isPrivateHost("fd12:3456::1")).toBe(true); // ULA
    expect(await isPrivateHost("fe80::1")).toBe(true); // link-local
    expect(await isPrivateHost("fe90::1")).toBe(true); // link-local fe80::/10
    expect(await isPrivateHost("ff02::1")).toBe(true); // multicast
  });

  it("allows public literal IPs", async () => {
    expect(await isPrivateHost("8.8.8.8")).toBe(false);
    expect(await isPrivateHost("1.1.1.1")).toBe(false);
    expect(await isPrivateHost("134.209.0.1")).toBe(false); // public DigitalOcean
  });

  it("allows public DNS names and rejects names resolving to private IPs", async () => {
    // example.com resolves to public addresses (93.184.x / 2606:2800:...)
    expect(await isPrivateHost("example.com")).toBe(false);
    // A DNS name pointing at loopback must be caught via resolution.
    expect(await isPrivateHost("localhost.localdomain")).toBe(true);
  });

  it("treats unresolvable names as private (can't prove public)", async () => {
    expect(await isPrivateHost("definitely-not-a-real-hostname-xyzzy.invalid")).toBe(true);
  });
});

describe("redirectTarget — manual redirect-hop resolution", () => {
  it("resolves absolute and relative http(s) Locations against the current URL", () => {
    const base = new URL("https://example.com/jobs/123");
    expect(redirectTarget(base, "https://other.com/page")?.href).toBe("https://other.com/page");
    expect(redirectTarget(base, "/apply")?.href).toBe("https://example.com/apply");
    expect(redirectTarget(base, "../next")?.href).toBe("https://example.com/next");
    expect(redirectTarget(base, "https://example.com:8443/x")?.href).toBe("https://example.com:8443/x");
  });

  it("rejects non-http(s) schemes (javascript:, file:, data:, ftp:)", () => {
    const base = new URL("https://example.com/");
    expect(redirectTarget(base, "javascript:alert(1)")).toBeNull();
    expect(redirectTarget(base, "file:///etc/passwd")).toBeNull();
    expect(redirectTarget(base, "data:text/html,<b>hi</b>")).toBeNull();
    expect(redirectTarget(base, "ftp://example.com/x")).toBeNull();
  });

  it("rejects unparseable Locations", () => {
    const base = new URL("https://example.com/");
    expect(redirectTarget(base, "")).toBeNull();
    expect(redirectTarget(base, "   ")).toBeNull();
    expect(redirectTarget(base, "http://[::1")).toBeNull(); // unclosed IPv6 bracket
    expect(redirectTarget(base, "http://exa mple.com")).toBeNull(); // space in host
  });

  it("keeps http(s) scheme change allowed (http→https and back)", () => {
    const base = new URL("http://example.com/");
    expect(redirectTarget(base, "https://example.com/secure")?.href).toBe("https://example.com/secure");
    expect(redirectTarget(base, "http://other.example/")?.href).toBe("http://other.example/");
  });
});
