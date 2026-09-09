import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";

/** Parse a hostname into IPv4 octets, handling the trickier literal encodings
 *  (decimal integers like 2130706433 → 127.0.0.1, hex 0x7f000001, octal
 *  0177.0.0.1, IPv4-mapped IPv6 ::ffff:127.0.0.1). Returns octets or null when
 *  the host is NOT an IP literal (i.e. a real DNS name). */
export function ipv4Octets(host: string): number[] | null {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  // IPv4-mapped IPv6 (::ffff:a.b.c.d) — treat as IPv4
  const mapped = h.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return mapped[1].split(".").map(Number);

  // Octal / mixed octal-decimal dotted form: 0177.0.0.1 == 127.0.0.1, and
  // mixed forms like 012.0.0.1 (octal first segment, decimal rest) that
  // browsers accept. Must run BEFORE the plain dotted-quad check — "012.0.0.1"
  // would otherwise parse as decimal 12.0.0.1 (public) instead of octal 10.0.0.1.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h) && h.split(".").some((s) => s.length > 1 && s.startsWith("0"))) {
    const o = h.split(".").map((s) => (s.startsWith("0") && /^[0-7]+$/.test(s) ? parseInt(s, 8) : parseInt(s, 10)));
    return o.every((n) => n >= 0 && n <= 255) ? o : null;
  }

  // Plain dotted quad
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) {
    const o = h.split(".").map(Number);
    return o.every((n) => n >= 0 && n <= 255) ? o : null;
  }

  // Decimal integer form: 2130706433 == 127.0.0.1
  if (/^\d{1,10}$/.test(h)) {
    const n = Number(h);
    if (!Number.isSafeInteger(n) || n < 0 || n > 0xffffffff) return null;
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  }

  // Hex integer form: 0x7f000001 == 127.0.0.1
  if (/^0x[0-9a-f]{1,8}$/i.test(h)) {
    const n = parseInt(h, 16);
    if (!Number.isSafeInteger(n) || n < 0 || n > 0xffffffff) return null;
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  }

  return null; // not an IP literal → DNS name
}

/** True when the IP (v4 or v6 string) is in a private/reserved range that an
 *  SSRF must never reach: loopback, RFC1918, link-local (incl. the cloud
 *  metadata endpoint 169.254.169.254), ULA, CGNAT, multicast, reserved. */
export function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 169 && b === 254) ||                       // link-local / metadata
      (a === 172 && b >= 16 && b <= 31) ||              // 172.16/12
      (a === 192 && b === 168) ||                       // 192.168/16
      (a === 100 && b >= 64 && b <= 127) ||             // CGNAT 100.64/10
      a >= 224                                          // multicast + reserved
    );
  }
  if (isIP(ip) === 6) {
    const h = ip.toLowerCase();
    return (
      h === "::" || h === "::1" ||
      h.startsWith("fc") || h.startsWith("fd") ||       // ULA fc00::/7
      h.startsWith("fe8") || h.startsWith("fe9") ||
      h.startsWith("fea") || h.startsWith("feb") ||     // link-local fe80::/10
      h.startsWith("ff") ||                             // multicast
      h.startsWith("::ffff:")                           // mapped v4 (checked below)
    ) || (h.startsWith("::ffff:") ? isPrivateIp(h.slice(7)) : false);
  }
  return false;
}

/** Block hosts that must never be fetched (SSRF guard).
 *  Rejects: obvious private hostnames, IP literals in ANY encoding
 *  (dotted/decimal/hex/octal/IPv4-mapped), and DNS names whose resolution
 *  lands on a private address — the attack a pure hostname-string check
 *  misses (attacker domain → 169.254.169.254). */
export async function isPrivateHost(hostname: string): Promise<boolean> {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") ||
      host === "metadata.google.internal" || host === "0.0.0.0" || host === "::1") {
    return true;
  }

  // Literal IP in any encoding → check the octets directly.
  const octets = ipv4Octets(host);
  if (octets) return isPrivateIp(octets.join("."));
  if (isIP(host) === 6) return isPrivateIp(host);

  // Real DNS name → resolve and check EVERY address family (A + AAAA). If the
  // name doesn't resolve at all we can't prove it's public — reject.
  try {
    const addrs = await dnsLookup(host, { all: true, verbatim: true });
    if (!addrs.length) return true;
    return addrs.some((a) => isPrivateIp(a.address));
  } catch {
    return true;
  }
}

/** Resolve a redirect Location header against the current URL. Returns null
 *  for empty/whitespace Locations, non-http(s) schemes (javascript:, file:,
 *  data:…) and unparseable values — the read-url loop must only ever follow
 *  http(s) hops, and a redirect to \"nowhere\" is malformed, not a reload. */
export function redirectTarget(current: URL, location: string): URL | null {
  if (!location || !location.trim()) return null;
  try {
    const next = new URL(location, current);
    return next.protocol === "http:" || next.protocol === "https:" ? next : null;
  } catch {
    return null;
  }
}
