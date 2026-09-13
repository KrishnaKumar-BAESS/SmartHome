import { describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { Account, redirectUri } from './account.js';
import type { CredentialStore } from './credential-store.js';

function fixture() {
  let saved: string | undefined;
  let now = 100_000;
  const store: CredentialStore = {
    read: async () => saved,
    write: vi.fn(async (value) => {
      saved = value;
    }),
  };
  const request = vi.fn<typeof fetch>();
  const account = new Account('test-client-secret', store, request, () => now);
  const response = (access: string, refresh?: string) =>
    Response.json({
      access_token: access,
      refresh_token: refresh,
      id_token: 'id-token',
      expires_in: 3600,
    });
  async function signIn() {
    const url = new URL(account.begin());
    request.mockResolvedValueOnce(response('access-1', 'refresh-1'));
    await account.complete(
      `${redirectUri}?state=${url.searchParams.get('state')}&code=test-code`,
    );
    return url;
  }
  return {
    account,
    store,
    request,
    response,
    signIn,
    advance: () => {
      now += 3_600_000;
    },
    restart: () => new Account('test-client-secret', store, request, () => now),
  };
}

describe('renewable account session', () => {
  it('binds the one-use callback to state and PKCE and persists no password', async () => {
    const f = fixture();
    const url = new URL(f.account.begin());
    await expect(
      f.account.complete(`${redirectUri}?state=wrong&code=wrong`),
    ).rejects.toThrow('invalid or expired');
    expect(f.request).not.toHaveBeenCalled();
    f.request.mockResolvedValueOnce(f.response('access-1', 'refresh-1'));
    const callback = `${redirectUri}?state=${url.searchParams.get('state')}&code=test-code`;
    await f.account.complete(callback);
    const [, options] = f.request.mock.calls[0];
    const form = options!.body as URLSearchParams;
    expect(
      createHash('sha256')
        .update(form.get('code_verifier')!)
        .digest('base64url'),
    ).toBe(url.searchParams.get('code_challenge'));
    expect(form.get('grant_type')).toBe('authorization_code');
    expect(options!.redirect).toBe('error');
    expect(JSON.stringify(f.account.status())).not.toContain('access-1');
    await expect(f.account.complete(callback)).rejects.toThrow(
      'invalid or expired',
    );
  });

  it('renews only once for simultaneous requests and restores the rotated token after restart', async () => {
    const f = fixture();
    await f.signIn();
    f.advance();
    f.request.mockResolvedValueOnce(f.response('access-2', 'refresh-2'));
    const results = await Promise.all(
      Array.from({ length: 5 }, () => f.account.credentials()),
    );
    expect(results.every((value) => value.access === 'access-2')).toBe(true);
    expect(f.request).toHaveBeenCalledTimes(2);
    const restarted = f.restart();
    await restarted.load();
    expect((await restarted.credentials()).access).toBe('access-2');
    f.advance();
    f.request.mockResolvedValueOnce(f.response('access-3'));
    await restarted.credentials();
    expect(
      (f.request.mock.calls[2][1]!.body as URLSearchParams).get(
        'refresh_token',
      ),
    ).toBe('refresh-2');
    expect(JSON.parse((await f.store.read())!).refresh).toBe('refresh-2');
  });

  it('backs off transient failures and requires sign-in after revocation without leaking upstream errors', async () => {
    const f = fixture();
    await f.signIn();
    f.advance();
    f.request.mockResolvedValueOnce(
      Response.json({ error_description: 'private-material' }, { status: 503 }),
    );
    await expect(f.account.credentials()).rejects.toThrow('503');
    await expect(f.account.credentials()).rejects.toThrow('retry shortly');
    expect(f.request).toHaveBeenCalledTimes(2);
    expect(f.account.status().signedIn).toBe(true);
    f.advance();
    f.request.mockResolvedValueOnce(
      Response.json(
        { error: 'invalid_grant', error_description: 'private-material' },
        { status: 400 },
      ),
    );
    await expect(f.account.credentials()).rejects.toThrow(
      'requires a new sign-in',
    );
    expect(f.account.status().needsLogin).toBe(true);
  });

  it('retains a rotated token when storage fails and retries persistence before more renewal', async () => {
    const f = fixture();
    await f.signIn();
    f.advance();
    f.request.mockResolvedValueOnce(f.response('access-2', 'refresh-2'));
    vi.mocked(f.store.write).mockRejectedValueOnce(
      new Error('Disk unavailable'),
    );
    await expect(f.account.credentials()).rejects.toThrow('Disk unavailable');
    expect(f.account.status().persistenceFailed).toBe(true);
    await Promise.all(Array.from({ length: 5 }, () => f.account.credentials()));
    expect(f.store.write).toHaveBeenCalledTimes(3);
    expect(JSON.parse((await f.store.read())!).refresh).toBe('refresh-2');
    expect(f.request).toHaveBeenCalledTimes(2);
    expect(f.account.status().persistenceFailed).toBe(false);
  });
});
