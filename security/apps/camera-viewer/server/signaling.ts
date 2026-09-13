import type { CameraSession } from './sessions.js';

export interface WireEvent {
  name: string;
  args: unknown[];
}
export type ViewerEvent =
  | { kind: 'status'; message: string }
  | { kind: 'event'; name: string; args: unknown[] }
  | { kind: 'error'; message: string };

export function decodePacket(wire: string) {
  const match = wire.match(/^(\d):([^:]*):([^:]*):?([\s\S]*)$/);
  if (!match) throw new Error('Invalid signaling packet');
  return { type: match[1], id: match[2], body: match[4] };
}

export function joinPacket(session: CameraSession) {
  return `5:1+::${JSON.stringify({
    name: 'join',
    args: [
      session.room,
      {
        token: session.token,
        streamName: session.streamName,
        transport: 'srtp',
        capabilities: 'hasHeartbeat',
      },
    ],
  })}`;
}

export class SignalingConnection {
  private socket?: WebSocket;
  private abort = new AbortController();
  private timeout?: ReturnType<typeof setTimeout>;
  private joined = false;
  private stun = false;
  private turn = false;
  private closed = false;
  private peerId?: string;

  constructor(
    private session: CameraSession,
    private allowedHosts: ReadonlySet<string>,
    private emit: (event: ViewerEvent) => void,
  ) {}

  async connect() {
    if (
      !this.allowedHosts.has(this.session.host) ||
      this.session.host !== `${this.session.room}.ssrouterprod.comcast.net`
    ) {
      throw new Error(
        'Signaling destination is not approved in local configuration.',
      );
    }
    if (this.session.expires <= Date.now() + 5000)
      throw new Error(
        'Viewing token expired. Import a fresh session from the phone.',
      );
    this.emit({ kind: 'status', message: 'Connecting to Xfinity signaling…' });
    this.timeout = setTimeout(
      () =>
        this.fail(
          'Signaling timed out. Reimport a fresh camera session and retry.',
        ),
      25_000,
    );
    try {
      const response = await fetch(
        `https://${this.session.host}/socket.io/1/?t=${Date.now()}`,
        {
          signal: this.abort.signal,
          redirect: 'error',
        },
      );
      if (!response.ok) throw new Error('Handshake rejected');
      const parts = (await response.text()).trim().split(':');
      if (
        !/^[A-Za-z0-9_-]{1,160}$/.test(parts[0]) ||
        !parts[3]?.split(',').includes('websocket')
      )
        throw new Error('Unsupported handshake');
      if (this.closed) return;
      this.socket = new WebSocket(
        `wss://${this.session.host}/socket.io/1/websocket/${parts[0]}`,
      );
      this.socket.onmessage = (event) => {
        try {
          this.receive(String(event.data));
        } catch {
          this.fail('The signaling server sent an unsupported response.');
        }
      };
      this.socket.onerror = () =>
        this.fail('Could not connect to Xfinity signaling.');
      this.socket.onclose = () => {
        if (!this.closed) this.fail('Xfinity signaling disconnected.');
      };
    } catch {
      if (!this.closed)
        this.fail(
          'The Xfinity signaling handshake failed. Check connectivity and session expiry.',
        );
    }
  }

  private receive(wire: string) {
    if (wire.length > 1_000_000) throw new Error('Oversized packet');
    const packet = decodePacket(wire);
    if (packet.type === '2') {
      this.socket?.send('2::');
      return;
    }
    if (
      packet.type === '0' ||
      (packet.type === '7' && packet.body.includes('invalidToken')) ||
      (packet.type === '3' && packet.body === 'invalidToken')
    ) {
      this.fail(
        'Xfinity rejected or ended the viewing session. Import fresh credentials.',
      );
      return;
    }
    let event: WireEvent | undefined;
    if (packet.type === '5') event = JSON.parse(packet.body);
    if (packet.type === '7') {
      const ack = packet.body.match(/^1\+([\s\S]+)$/)?.[1];
      if (ack) {
        const args = JSON.parse(ack);
        const peers = Array.isArray(args)
          ? args.find(
              (value) =>
                value && typeof value === 'object' && 'clients' in value,
            )
          : undefined;
        if (peers) event = { name: 'peers', args: [peers] };
      }
    }
    if (!event || !Array.isArray(event.args)) return;
    if (event.name === 'stunservers') this.stun = true;
    if (event.name === 'turnservers') this.turn = true;
    if (
      ['stunservers', 'turnservers', 'peers', 'message'].includes(event.name)
    ) {
      if (event.name === 'message') {
        const message = event.args[0] as
          { type?: string; from?: string } | undefined;
        if (message?.type === 'offer' && typeof message.from === 'string') {
          this.peerId = message.from;
          clearTimeout(this.timeout);
        }
      }
      this.emit({ kind: 'event', name: event.name, args: event.args });
    }
    if (this.stun && this.turn && !this.joined) {
      this.joined = true;
      this.socket?.send(joinPacket(this.session));
      this.emit({
        kind: 'status',
        message: 'Joining the camera’s viewing session…',
      });
    }
  }

  send(type: string, payload: unknown) {
    if (!this.peerId || this.socket?.readyState !== WebSocket.OPEN)
      throw new Error('Camera connection is not ready.');
    if (type !== 'answer' && type !== 'candidate')
      throw new Error('Only playback negotiation is supported.');
    if (type === 'candidate') {
      // The app's outgoing payload uses a string; incoming candidates use an object.
      const candidate = (payload as { candidate?: { candidate?: unknown } })
        ?.candidate?.candidate;
      if (typeof candidate !== 'string' || !candidate.startsWith('candidate:'))
        throw new Error('Invalid ICE candidate.');
      payload = { candidate };
    }
    this.socket.send(
      `5:::${JSON.stringify({ name: 'message', args: [{ to: this.peerId, type, payload }] })}`,
    );
  }

  private fail(message: string) {
    if (!this.closed) {
      this.emit({ kind: 'error', message });
      this.close();
    }
  }
  close() {
    this.closed = true;
    clearTimeout(this.timeout);
    this.abort.abort();
    this.socket?.close();
  }
}
