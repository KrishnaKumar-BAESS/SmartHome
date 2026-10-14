import { describe, expect, it } from 'vitest';
import { isAllowedHousePeer, isTailscaleAddress } from './network-access';

describe('LAN and Tailscale access boundaries', () => {
  it('accepts the Tailscale IPv4 range but rejects neighboring and invalid addresses', () => {
    for (const address of ['100.64.0.0', '100.106.235.89', '100.127.255.255'])
      expect(isTailscaleAddress(address)).toBe(true);
    for (const address of [
      '100.63.255.255',
      '100.128.0.0',
      '100.106.999.1',
      '8.8.8.8',
      'example.com',
    ])
      expect(isTailscaleAddress(address)).toBe(false);
  });
  it('accepts tailnet clients only through the Tailscale listener and preserves LAN access', () => {
    expect(isAllowedHousePeer('100.90.1.2', '100.106.235.89')).toBe(true);
    expect(isAllowedHousePeer('::ffff:100.90.1.2', '100.106.235.89')).toBe(
      true,
    );
    expect(isAllowedHousePeer('100.90.1.2', '192.168.0.202')).toBe(false);
    expect(isAllowedHousePeer('192.168.0.42', '192.168.0.202')).toBe(true);
    expect(isAllowedHousePeer('8.8.8.8', '100.106.235.89')).toBe(false);
    expect(isAllowedHousePeer('192.168.0.999', '192.168.0.202')).toBe(false);
  });
});
