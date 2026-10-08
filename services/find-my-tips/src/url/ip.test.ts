import { describe, expect, it } from 'vitest';

import { isBlockedIp } from './ip';

describe('isBlockedIp', () => {
  it.each([
    '169.254.169.254',
    '10.0.0.1',
    '172.16.5.5',
    '192.168.1.1',
    '127.0.0.1',
    '100.64.0.1',
    '0.0.0.0',
    '224.0.0.1',
    '::',
    '::1',
    '::ffff:127.0.0.1',
    '::ffff:10.1.2.3',
    '64:ff9b::1',
    'fd00::1',
    'fe80::1',
    'ff02::1',
    '2001:db8::1',
    'not-an-ip',
  ])('blocks %s', (address) => {
    expect(isBlockedIp(address)).toBe(true);
  });

  it.each(['8.8.8.8', '1.1.1.1', '::ffff:8.8.8.8', '2606:4700::1'])('allows %s', (address) => {
    expect(isBlockedIp(address)).toBe(false);
  });
});
