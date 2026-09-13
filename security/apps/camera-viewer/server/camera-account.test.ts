import { describe, expect, it, vi } from 'vitest';
import { Account } from './account.js';
import { CameraAccount } from './camera-account.js';

describe('account camera access', () => {
  it('requests fresh viewing credentials without ADB and never exposes tokens in the camera list', async () => {
    const account = new Account('client', {
      read: async () =>
        JSON.stringify({
          access: 'private-access',
          refresh: 'private-refresh',
          expires: Date.now() + 3_600_000,
        }),
      write: async () => {},
    });
    await account.load();
    const token = `header.${Buffer.from(JSON.stringify({ camera: 'AABBCCDDEEFF', exp: Math.floor(Date.now() / 1000) + 600 })).toString('base64url')}.signature`;
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(
      Response.json({
        cameras: [
          {
            id: 'device-1',
            macAddress: 'AA:BB:CC:DD:EE:FF',
            displayName: 'Front',
          },
        ],
      }),
    );
    const client = new CameraAccount(
      account,
      new Set(['123.ssrouterprod.comcast.net']),
      {},
      request,
    );
    expect(await client.list()).toEqual([
      { id: 'AABBCCDDEEFF', label: 'Front', renewable: true },
    ]);
    for (let index = 0; index < 2; index++) {
      request.mockResolvedValueOnce(
        Response.json({
          room: '123',
          auth: { token },
          server: { url: 'https://123.ssrouterprod.comcast.net', port: 443 },
        }),
      );
      expect((await client.session('AABBCCDDEEFF')).token).toBe(token);
    }
    expect(request).toHaveBeenCalledTimes(3);
    expect(request.mock.calls[1][0]).toBe(
      'https://gw.api.dh.comcast.com/camera/deviceId/device-1/liveStream',
    );
    expect(request.mock.calls[1][1]!.redirect).toBe('error');
    request.mockResolvedValueOnce(
      Response.json({
        room: '123',
        auth: { token },
        server: { url: 'https://untrusted.example' },
      }),
    );
    await expect(client.session('AABBCCDDEEFF')).rejects.toThrow(
      'approved host',
    );
  });
});
