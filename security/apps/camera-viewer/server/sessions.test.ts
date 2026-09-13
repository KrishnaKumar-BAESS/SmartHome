import { describe, expect, it } from 'vitest';
import { parseSessions, publicCamera } from './sessions.js';

const now = 1_800_000_000_000;
const room = '12345';
const host = `${room}.ssrouterprod.comcast.net`;
function line(overrides: Record<string, unknown> = {}, joinRoom = room) {
  const claims = {
    camera: 'AABBCCDDEEFF',
    exp: now / 1000 + 600,
    ...overrides,
  };
  const token = `eyJhbGciOiJSUzI1NiJ9.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.testSignature`;
  return `09-13 13:00:00.000 100 101 I io.socket: > 5:1+::${JSON.stringify({ name: 'join', args: [joinRoom, { token, streamName: 'stream2' }] })}`;
}

describe('authorized phone-session import', () => {
  it('imports fresh camera sessions without exposing credentials in the browser response', () => {
    const [session] = parseSessions(
      line(),
      new Set([host]),
      { AABBCCDDEEFF: 'Test camera' },
      now,
    );
    expect(session.label).toBe('Test camera');
    expect(session.host).toBe(host);
    expect(publicCamera(session)).toEqual({
      id: 'AABBCCDDEEFF',
      label: 'Test camera',
      expires: now + 600_000,
    });
    expect(JSON.stringify(publicCamera(session))).not.toContain(session.token);
  });
  it('rejects expired credentials, malformed camera IDs, and unverified destinations', () => {
    expect(
      parseSessions(line({ exp: now / 1000 - 1 }), new Set([host]), {}, now),
    ).toEqual([]);
    expect(
      parseSessions(line({ camera: '../secret' }), new Set([host]), {}, now),
    ).toEqual([]);
    expect(parseSessions(line(), new Set(), {}, now)).toEqual([]);
    expect(
      parseSessions(line({}, '12345.evil.test'), new Set([host]), {}, now),
    ).toEqual([]);
  });
  it('tolerates truncated logs and keeps the newest session for a camera', () => {
    const logs = `${line()}\nio.socket: > 5:::{"name":"join",\n${line({ exp: now / 1000 + 900 })}`;
    expect(parseSessions(logs, new Set([host]), {}, now)).toHaveLength(1);
    expect(parseSessions(logs, new Set([host]), {}, now)[0].expires).toBe(
      now + 900_000,
    );
  });
});
