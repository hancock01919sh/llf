'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  clientIp,
  createGuard,
  isOpenPath,
  normalizeIp,
  parseAllowlist,
} = require('../src/utils/ip-allowlist');

const xff = (value) => ({ 'x-forwarded-for': value });

describe('parseAllowlist', () => {
  it('accepts IPs and CIDR ranges, comma or space separated', () => {
    const { list, size } = parseAllowlist('203.0.113.7, 198.51.100.0/24 2001:db8::/48');
    assert.equal(size, 3);
    assert.ok(list.check('203.0.113.7', 'ipv4'));
    assert.ok(list.check('198.51.100.200', 'ipv4'));
    assert.ok(list.check('2001:db8:0:1::5', 'ipv6'));
    assert.ok(!list.check('203.0.113.8', 'ipv4'));
  });

  it('treats an empty value as an empty list', () => {
    assert.equal(parseAllowlist('').size, 0);
    assert.equal(parseAllowlist(undefined).size, 0);
  });

  it('rejects invalid entries and catch-all ranges', () => {
    for (const bad of ['nope', '1.2.3.4/33', '0.0.0.0/0', '::/0', '1.2.3.4/x', '1.2.3.4/8/1']) {
      assert.throws(() => parseAllowlist(bad), /ADMIN_IP_ALLOWLIST/, bad);
    }
  });
});

describe('normalizeIp', () => {
  it('strips ports, brackets and IPv4-mapped prefixes', () => {
    assert.equal(normalizeIp(' 203.0.113.7:443 '), '203.0.113.7');
    assert.equal(normalizeIp('[2001:db8::1]:443'), '2001:db8::1');
    assert.equal(normalizeIp('::ffff:203.0.113.7'), '203.0.113.7');
    assert.equal(normalizeIp('unknown'), undefined);
  });
});

describe('clientIp', () => {
  it('uses the right-most X-Forwarded-For entry by default', () => {
    const headers = xff('10.0.0.1, 203.0.113.7');
    assert.equal(clientIp({ headers, trustedHops: 1 }), '203.0.113.7');
  });

  it('skips the trusted proxy hops on the right', () => {
    const headers = xff('198.51.100.9, 203.0.113.7, 10.1.1.1');
    assert.equal(clientIp({ headers, trustedHops: 2 }), '203.0.113.7');
  });

  it('returns nothing when there are fewer entries than trusted hops', () => {
    assert.equal(clientIp({ headers: xff('203.0.113.7'), trustedHops: 2 }), undefined);
    assert.equal(clientIp({ headers: {}, trustedHops: 1 }), undefined);
  });

  it('can read a single-value header or the socket', () => {
    const headers = { 'cf-connecting-ip': '203.0.113.7' };
    assert.equal(clientIp({ headers, header: 'CF-Connecting-IP' }), '203.0.113.7');
    assert.equal(clientIp({ headers: {}, header: 'socket', socketIp: '::1' }), '::1');
  });
});

describe('isOpenPath', () => {
  it('opens only the content API, uploads and health check', () => {
    for (const path of ['/api', '/api/pages', '/uploads/a_1.jpg', '/_health']) {
      assert.ok(isOpenPath(path), path);
    }
    for (const path of ['/admin', '/admin/login', '/content-manager/x', '/apix', '/', '/uploads']) {
      assert.ok(!isOpenPath(path), path);
    }
  });

  it('never opens a path that could resolve somewhere else', () => {
    for (const path of ['/api/../admin', '/api/%2e%2e/admin', '/uploads/..%2Fadmin', '/api\\..']) {
      assert.ok(!isOpenPath(path), path);
    }
  });
});

describe('createGuard', () => {
  const request = (path, ip) => ({ path, headers: ip ? xff(ip) : {}, socketIp: '127.0.0.1' });

  it('lets everything through locally when not enforced and no list is set', () => {
    const allowed = createGuard({ allowlist: '', enforce: false });
    assert.ok(allowed(request('/admin')));
  });

  it('fails closed when enforced with an empty list', () => {
    const allowed = createGuard({ allowlist: '', enforce: true, trustedHops: 1 });
    assert.ok(!allowed(request('/admin', '203.0.113.7')));
    assert.ok(allowed(request('/api/pages', '203.0.113.7')));
    assert.ok(allowed(request('/_health')));
  });

  it('allows listed IPs and blocks the rest', () => {
    const allowed = createGuard({ allowlist: '203.0.113.0/24', enforce: true, trustedHops: 1 });
    assert.ok(allowed(request('/admin', '203.0.113.7')));
    assert.ok(!allowed(request('/admin', '198.51.100.1')));
    assert.ok(!allowed(request('/admin')));
  });

  it('ignores a forged X-Forwarded-For entry left of the proxy hop', () => {
    const allowed = createGuard({ allowlist: '203.0.113.7', enforce: true, trustedHops: 1 });
    assert.ok(!allowed(request('/admin', '203.0.113.7, 198.51.100.1')));
  });

  it('enforces a list even when enforcement is off, so it can be tested locally', () => {
    const allowed = createGuard({ allowlist: '203.0.113.7', enforce: false, trustedHops: 1 });
    assert.ok(!allowed(request('/admin', '198.51.100.1')));
  });
});
