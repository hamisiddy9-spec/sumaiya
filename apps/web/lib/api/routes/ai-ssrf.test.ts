import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
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
});

// The DNS half of the guard runs against a stubbed resolver, never the live
// internet. It used to resolve real names on every run: `example.com` was
// queried each time, so the suite depended on this box's resolver being fast and
// reachable, and vitest's 5s default timeout turned a slow lookup into a red
// suite — observed, with no assertion actually failing (the test itself timed
// out). Stubbing is also the only way to pin the per-family logic the live
// internet can't be asked to produce on demand: a name that is public over A
// but private over AAAA, or one that resolves to nothing at all.
vi.mock("node:dns/promises", () => ({ lookup: vi.fn() }));
import { lookup as dnsLookup } from "node:dns/promises";
const lookupMock = vi.mocked(dnsLookup) as unknown as Mock;

describe("SSRF guard — DNS name resolution", () => {
  beforeEach(() => {
    lookupMock.mockReset();
  });

  it("allows a DNS name that resolves to public addresses only", async () => {
    lookupMock.mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
      { address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 },
    ]);
    expect(await isPrivateHost("example.com")).toBe(false);
    // Proves the guard really consulted the resolver (rather than falling
    // through to the "can't prove it's public" branch) and pins the call shape:
    // `all` matters — checking only the first address would miss the attack.
    expect(lookupMock).toHaveBeenCalledWith("example.com", { all: true, verbatim: true });
  });

  it("blocks a name whose A record is private (attacker domain → cloud metadata IP)", async () => {
    lookupMock.mockResolvedValue([{ address: "169.254.169.254", family: 4 }]);
    expect(await isPrivateHost("evil.example")).toBe(true);
  });

  it("blocks when only the AAAA record is private", async () => {
    lookupMock.mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
      { address: "fd12:3456::1", family: 6 },
    ]);
    expect(await isPrivateHost("dual-stack.example")).toBe(true);
  });

  it("blocks a name resolving to loopback", async () => {
    lookupMock.mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);
    expect(await isPrivateHost("localhost.localdomain")).toBe(true);
  });

  it("blocks a name that resolves to an empty address list", async () => {
    lookupMock.mockResolvedValue([]);
    expect(await isPrivateHost("empty.example")).toBe(true);
  });

  it("blocks a name that does not resolve at all — can't prove it's public", async () => {
    lookupMock.mockRejectedValue(Object.assign(new Error("queryA ENOTFOUND"), { code: "ENOTFOUND" }));
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
