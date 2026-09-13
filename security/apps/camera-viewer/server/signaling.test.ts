import { afterEach, describe, expect, it, vi } from 'vitest';
import { decodePacket, joinPacket, SignalingConnection } from './signaling.js';

const session = {
  camera: 'AABBCCDDEEFF',
  label: 'Test',
  room: '123',
  host: '123.ssrouterprod.comcast.net',
  token: 'test-token',
  streamName: 'stream2',
  expires: Date.now() + 60_000,
};
afterEach(() => vi.restoreAllMocks());
describe('signaling boundary', () => {
  it('preserves the legacy protocol framing and join acknowledgment request', () => {
    const packet = decodePacket(joinPacket(session));
    expect(packet.type).toBe('5');
    expect(packet.id).toBe('1+');
    expect(JSON.parse(packet.body)).toEqual({
      name: 'join',
      args: [
        '123',
        {
          token: 'test-token',
          streamName: 'stream2',
          transport: 'srtp',
          capabilities: 'hasHeartbeat',
        },
      ],
    });
    expect(decodePacket('2::').type).toBe('2');
    expect(decodePacket('7:::1+[{"clients":{}}]').body).toBe(
      '1+[{"clients":{}}]',
    );
  });
  it('does not contact a server for unapproved destinations or expired tokens', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await expect(
      new SignalingConnection(session, new Set(), () => {}).connect(),
    ).rejects.toThrow('destination');
    await expect(
      new SignalingConnection(
        { ...session, expires: 0 },
        new Set([session.host]),
        () => {},
      ).connect(),
    ).rejects.toThrow('expired');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it('does not follow redirects from the configured signaling host', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('redirect'));
    const emit = vi.fn();
    const connection = new SignalingConnection(
      session,
      new Set([session.host]),
      emit,
    );
    await connection.connect();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining(`https://${session.host}/socket.io/1/`),
      expect.objectContaining({ redirect: 'error' }),
    );
    expect(emit).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'error' }),
    );
    connection.close();
  });
});
