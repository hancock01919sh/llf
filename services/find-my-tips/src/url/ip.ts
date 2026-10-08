import { isIP } from 'node:net';

type Range4 = [base: number, prefix: number];

const BLOCKED_V4: Range4[] = [
  [ip4('0.0.0.0'), 8],
  [ip4('10.0.0.0'), 8],
  [ip4('100.64.0.0'), 10],
  [ip4('127.0.0.0'), 8],
  [ip4('169.254.0.0'), 16],
  [ip4('172.16.0.0'), 12],
  [ip4('192.0.0.0'), 24],
  [ip4('192.0.2.0'), 24],
  [ip4('192.168.0.0'), 16],
  [ip4('198.18.0.0'), 15],
  [ip4('198.51.100.0'), 24],
  [ip4('203.0.113.0'), 24],
  [ip4('224.0.0.0'), 4],
  [ip4('240.0.0.0'), 4],
];

function ip4(address: string): number {
  return address.split('.').reduce((acc, part) => acc * 256 + Number(part), 0);
}

function inRange4(value: number, [base, prefix]: Range4): boolean {
  const size = 2 ** (32 - prefix);
  return value >= base && value < base + size;
}

function isBlockedV4(address: string): boolean {
  const value = ip4(address);
  return BLOCKED_V4.some((range) => inRange4(value, range));
}

/** Expands an IPv6 address into eight 16-bit groups; `null` if malformed. */
function expandV6(address: string): number[] | null {
  let text = address.toLowerCase();
  const zone = text.indexOf('%');
  if (zone !== -1) text = text.slice(0, zone);

  // Rewrite a dotted IPv4 tail (::ffff:1.2.3.4) as two hex groups.
  const lastColon = text.lastIndexOf(':');
  const maybeV4 = text.slice(lastColon + 1);
  if (maybeV4.includes('.')) {
    if (isIP(maybeV4) !== 4) return null;
    const v = ip4(maybeV4);
    const hi = Math.floor(v / 65536).toString(16);
    const lo = (v % 65536).toString(16);
    text = `${text.slice(0, lastColon + 1)}${hi}:${lo}`;
  }

  const halves = text.split('::');
  if (halves.length > 2) return null;
  const parse = (part: string | undefined) =>
    part
      ? part
          .split(':')
          .filter((g) => g !== '')
          .map((g) => parseInt(g, 16))
      : [];
  const head = parse(halves[0]);
  const rest = parse(halves[1]);
  const explicit = head.length + rest.length;
  if (halves.length === 1) {
    return explicit === 8 ? head : null;
  }
  if (explicit > 7) return null;
  return [...head, ...new Array<number>(8 - explicit).fill(0), ...rest];
}

function isBlockedV6(address: string): boolean {
  const groups = expandV6(address);
  if (!groups || groups.some((g) => Number.isNaN(g))) return true;
  const [g0 = 0, g1 = 0, g2 = 0, g3 = 0, g4 = 0, g5 = 0, g6 = 0, g7 = 0] = groups;

  if (groups.every((g) => g === 0)) return true; // ::
  if (
    g0 === 0 &&
    g1 === 0 &&
    g2 === 0 &&
    g3 === 0 &&
    g4 === 0 &&
    g5 === 0 &&
    g6 === 0 &&
    g7 === 1
  ) {
    return true; // ::1
  }
  // IPv4-mapped (::ffff:a.b.c.d) and IPv4-compatible (::a.b.c.d): check the embedded address.
  if (g0 === 0 && g1 === 0 && g2 === 0 && g3 === 0 && g4 === 0 && (g5 === 0xffff || g5 === 0)) {
    const v4 = `${g6 >> 8}.${g6 & 0xff}.${g7 >> 8}.${g7 & 0xff}`;
    return isBlockedV4(v4) || g5 === 0;
  }
  // NAT64 (64:ff9b::/96) can reach IPv4 internals.
  if (g0 === 0x64 && g1 === 0xff9b) return true;
  if ((g0 & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((g0 & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((g0 & 0xffc0) === 0xfec0) return true; // fec0::/10 site-local (deprecated)
  if ((g0 & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  if (g0 === 0x2001 && g1 === 0x0db8) return true; // documentation
  return false;
}

/**
 * True when an address must never be fetched (TDD §7.6): private, loopback,
 * link-local (incl. cloud metadata 169.254.169.254), CGNAT, multicast,
 * reserved, unique-local, and IPv4 embedded in IPv6. Anything that does not
 * parse as an IP is blocked.
 */
export function isBlockedIp(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isBlockedV4(address);
  if (family === 6) return isBlockedV6(address);
  return true;
}
