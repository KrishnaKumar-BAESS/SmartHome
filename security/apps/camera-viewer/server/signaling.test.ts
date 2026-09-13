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
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe('signaling boundary', () => {
  it('sends browser ICE candidates in the Android app’s string payload format', async () => {
    const send = vi.fn();
    class TestSocket {
      static OPEN = 1;
      static instance: TestSocket;
      readyState = 1;
      send = send;
      close = vi.fn();
      onmessage?: (event: { data: string }) => void;
      constructor(readonly url: string) {
        TestSocket.instance = this;
      }
    }
    vi.stubGlobal('WebSocket', TestSocket);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('MTkyLjAuMi4xOjQ0Mw==,test-session:60:60:websocket'),
    );
    const connection = new SignalingConnection(
      session,
      new Set([session.host]),
      () => {},
    );
    try {
      await connection.connect();
      expect(TestSocket.instance.url).toBe(
        `wss://${session.host}/socket.io/1/websocket/MTkyLjAuMi4xOjQ0Mw%3D%3D%2Ctest-session`,
      );
      TestSocket.instance.onmessage?.({
        data: '5:::{"name":"message","args":[{"type":"offer","from":"camera-peer","payload":{"sdp":"test"}}]}',
      });
      const candidate = 'candidate:1 1 udp 2122260223 192.0.2.2 50000 typ host';
      connection.send('candidate', {
        candidate: { candidate, sdpMid: 'video', sdpMLineIndex: 1 },
      });
      expect(JSON.parse(decodePacket(send.mock.calls[0][0]).body)).toEqual({
        name: 'message',
        args: [
          { to: 'camera-peer', type: 'candidate', payload: { candidate } },
        ],
      });
      expect(() => connection.send('candidate', { candidate: {} })).toThrow(
        'Invalid ICE candidate',
      );
      expect(send).toHaveBeenCalledTimes(1);
    } finally {
      connection.close();
    }
  });
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
