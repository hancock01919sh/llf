'use strict';

// Admin IP allow-list for Phase A (Render), TDD §5.4. Render can't set inbound IP rules on our
// plan, so Strapi enforces the list itself. Phase B uses a WAF IP set instead.

const { BlockList, isIP } = require('node:net');

// Paths that stay reachable from any IP. `/api/*` still needs a token (the Public role has no
// permissions), `/uploads/*` is the media the site's pages load in Phase A, and `/_health` is
// for the platform health check.
const OPEN_PATHS = [/^\/api(\/|$)/, /^\/uploads\//, /^\/_health\/?$/];
// A path that could be resolved to somewhere else never counts as open.
const AMBIGUOUS_PATH = /\.\.|\\|%2e|%2f|%5c/i;

function normalizeIp(value) {
  if (typeof value !== 'string') return undefined;
  let ip = value.trim();
  if (ip.startsWith('[')) ip = ip.slice(1, ip.indexOf(']'));
  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(ip)) ip = ip.slice(0, ip.lastIndexOf(':'));
  const mapped = /^::ffff:(\d{1,3}(\.\d{1,3}){3})$/i.exec(ip);
  if (mapped) ip = mapped[1];
  return isIP(ip) ? ip : undefined;
}

function familyOf(ip) {
  return isIP(ip) === 6 ? 'ipv6' : 'ipv4';
}

/**
 * Parses a comma- or whitespace-separated list of IPs and CIDR ranges. Throws on anything
 * invalid, and on catch-all ranges (/0), so a bad value stops the CMS from starting instead of
 * silently opening or closing the admin.
 */
function parseAllowlist(value) {
  const list = new BlockList();
  const entries = String(value ?? '')
    .split(/[\s,]+/)
    .filter(Boolean);
  for (const entry of entries) {
    const [address, prefixText, extra] = entry.split('/');
    const ip = normalizeIp(address);
    if (!ip || extra !== undefined) throw new Error(`ADMIN_IP_ALLOWLIST: invalid entry "${entry}"`);
    const family = familyOf(ip);
    if (prefixText === undefined) {
      list.addAddress(ip, family);
      continue;
    }
    const prefix = Number(prefixText);
    const max = family === 'ipv6' ? 128 : 32;
    if (!/^\d+$/.test(prefixText) || prefix < 1 || prefix > max) {
      throw new Error(`ADMIN_IP_ALLOWLIST: invalid or catch-all prefix in "${entry}"`);
    }
    list.addSubnet(ip, prefix, family);
  }
  return { list, size: entries.length };
}

/**
 * The client IP as seen by the platform's proxy. With `x-forwarded-for`, each proxy appends the
 * address it received the request from, so only the right-most `trustedHops` entries were
 * written by infrastructure we trust; anything to their left can be forged by the client.
 * `socket` uses the TCP peer (local use only).
 */
function clientIp({ headers, socketIp, header, trustedHops }) {
  const name = String(header || 'x-forwarded-for').toLowerCase();
  if (name === 'socket') return normalizeIp(socketIp);
  const raw = headers[name];
  const value = Array.isArray(raw) ? raw.join(',') : raw;
  if (!value) return undefined;
  if (name !== 'x-forwarded-for') return normalizeIp(value);
  const hops = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const index = hops.length - Math.max(1, trustedHops || 1);
  return index >= 0 ? normalizeIp(hops[index]) : undefined;
}

function isOpenPath(path) {
  if (AMBIGUOUS_PATH.test(path)) return false;
  return OPEN_PATHS.some((pattern) => pattern.test(path));
}

/**
 * Decides whether a request may pass. With enforcement off and no list (local development),
 * everything passes. With enforcement on and an empty list, every restricted path is blocked
 * (fail closed).
 */
function createGuard({ allowlist, header, trustedHops, enforce }) {
  const { list, size } = parseAllowlist(allowlist);
  return function allowed({ path, headers, socketIp }) {
    if (isOpenPath(path)) return true;
    if (!enforce && size === 0) return true;
    const ip = clientIp({ headers, socketIp, header, trustedHops });
    return Boolean(ip) && list.check(ip, familyOf(ip));
  };
}

module.exports = { createGuard, parseAllowlist, clientIp, isOpenPath, normalizeIp };
