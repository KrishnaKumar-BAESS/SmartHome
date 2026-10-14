import { describe, expect, it, vi } from 'vitest';
import { createPiholeService } from './pihole-service';
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status });
const summary = {
  queries: { total: 120, blocked: 30, percent_blocked: 25 },
  clients: { active: 4 },
  gravity: { domains_being_blocked: 900 },
};
describe('Pi-hole read-only connection', () => {
  it('requires local credentials without attempting a request', async () => {
    const request = vi.fn();
    expect(
      await createPiholeService('http://pihole.test', '', request)(),
    ).toEqual({ state: 'setup', dashboardUrl: 'http://pihole.test/admin/' });
    expect(request).not.toHaveBeenCalled();
  });
  it('keeps secrets on the server and deduplicates concurrent polling', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(
        json({ session: { valid: true, sid: 'secret-session' } }),
      )
      .mockResolvedValueOnce(json(summary))
      .mockResolvedValueOnce(json({ blocking: 'enabled' }));
    const stats = createPiholeService(
      'http://pihole.test',
      'secret-password',
      request,
    );
    const [a, b] = await Promise.all([stats(), stats()]);
    expect(a).toEqual(b);
    expect(a).toMatchObject({
      state: 'ready',
      queries: 120,
      blocked: 30,
      percentBlocked: 25,
      clients: 4,
      domains: 900,
      blocking: 'enabled',
    });
    expect(JSON.stringify(a)).not.toContain('secret');
    expect(request).toHaveBeenCalledTimes(3);
    expect(request.mock.calls[0][1].body).toBe(
      JSON.stringify({ password: 'secret-password' }),
    );
    expect(request.mock.calls[1][1].headers).toEqual({ sid: 'secret-session' });
    await stats();
    expect(request).toHaveBeenCalledTimes(3);
  });
  it('renews an expired session once and never exposes upstream errors', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(json({ session: { valid: true, sid: 'old' } }))
      .mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(json({ session: { valid: true, sid: 'new' } }))
      .mockResolvedValueOnce(json(summary))
      .mockResolvedValueOnce(json({ blocking: 'disabled' }));
    expect(
      await createPiholeService('http://pihole.test', 'password', request)(),
    ).toMatchObject({ state: 'ready', blocking: 'disabled' });
    expect(request.mock.calls[3][1].headers).toEqual({ sid: 'new' });
    const denied = vi
      .fn()
      .mockResolvedValue(json({ error: 'sensitive details' }, 401));
    expect(
      await createPiholeService('http://pihole.test', 'password', denied)(),
    ).toEqual({ state: 'auth', dashboardUrl: 'http://pihole.test/admin/' });
  });
  it('reports malformed or unreachable data as unavailable, not zero stats', async () => {
    const malformed = vi
      .fn()
      .mockResolvedValueOnce(json({ session: { valid: true, sid: 'sid' } }))
      .mockResolvedValueOnce(json({ queries: {} }))
      .mockResolvedValueOnce(json({ blocking: 'enabled' }));
    expect(
      await createPiholeService('http://pihole.test', 'password', malformed)(),
    ).toMatchObject({ state: 'unavailable' });
    const failed = vi.fn().mockRejectedValue(new Error('private details'));
    const result = await createPiholeService(
      'http://pihole.test',
      'password',
      failed,
    )();
    expect(result).toMatchObject({ state: 'unavailable' });
    expect(JSON.stringify(result)).not.toContain('private');
  });
});
