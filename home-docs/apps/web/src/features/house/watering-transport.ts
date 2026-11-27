import { checkCommand, deviceId } from './watering-protocol';

export type Connection = {
  usb: boolean;
  command: (value: string) => Promise<string>;
  close: () => void;
};
export type Signals = {
  lost: (reason: string) => void;
  event: (line: string) => void;
};
const uncertain =
  'No device reply. The command may have run. Check pump state before trying again.';
function pending(onTimeout: () => void) {
  let resolve!: (s: string) => void, reject!: (e: Error) => void;
  const promise = new Promise<string>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  const timer = setTimeout(() => {
    reject(new Error(uncertain));
    onTimeout();
  }, 6000);
  return {
    promise,
    done: (s: string) => {
      clearTimeout(timer);
      if (s.startsWith('error ')) reject(new Error(s));
      else resolve(s);
    },
    fail: (reason: string) => {
      clearTimeout(timer);
      reject(new Error(reason));
    },
  };
}
export async function connectBroker(
  url: string,
  id: string,
  username: string,
  password: string,
  signals: Signals,
): Promise<Connection> {
  const address = new URL(url);
  if (
    !['wss:', 'ws:'].includes(address.protocol) ||
    address.username ||
    address.password ||
    !deviceId.test(id)
  )
    throw new Error('Enter a WebSocket broker URL and a valid controller ID.');
  if (
    address.protocol === 'ws:' &&
    (password || username) &&
    !['localhost', '127.0.0.1', '[::1]'].includes(address.hostname)
  )
    throw new Error('Use wss:// to send broker credentials.');
  const { default: mqtt } = await import('mqtt');
  const client = await mqtt.connectAsync(
    address.href,
    {
      username,
      password,
      clean: true,
      connectTimeout: 6000,
      reconnectPeriod: 0,
      queueQoSZero: false,
    },
    false,
  );
  const prefix = 'watering/' + id + '/';
  const requests = new Map<string, ReturnType<typeof pending>>();
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    for (const p of requests.values())
      p.fail('Connection closed. Check the pump locally.');
    requests.clear();
    client.end(true);
  };
  const lost = (reason: string) => {
    if (!closed) {
      close();
      signals.lost(reason);
    }
  };
  client.on('close', () => lost('Broker disconnected. Pump state unknown.'));
  client.on('error', () => lost('Broker connection failed.'));
  client.on('message', (topic, bytes, packet) => {
    const line = bytes.toString();
    if (topic === prefix + 'availability' && line === 'offline') {
      lost('Controller offline. Pump state unknown.');
      return;
    }
    if (packet.retain) return;
    if (topic === prefix + 'event') signals.event(line);
    if (topic !== prefix + 'reply') return;
    const match = /^#([\w-]{1,16}) ([\s\S]+)$/.exec(line);
    if (match) {
      requests.get(match[1])?.done(match[2]);
      requests.delete(match[1]);
    }
  });
  const subscribeTimer = setTimeout(
    () => lost('Broker subscription timed out.'),
    6000,
  );
  try {
    const topics = ['reply', 'event', 'availability'].map((t) => prefix + t);
    const grants = await client.subscribeAsync(topics, { qos: 0 });
    if (
      !grants ||
      grants.length !== topics.length ||
      grants.some((g) => Number(g.qos) > 2) ||
      closed
    )
      throw new Error('Broker denied the device subscription.');
  } catch (error) {
    close();
    throw error;
  } finally {
    clearTimeout(subscribeTimer);
  }
  return {
    usb: false,
    close,
    async command(command) {
      checkCommand(command, false);
      if (closed || !client.connected) throw new Error('Broker disconnected.');
      const tag = Array.from(crypto.getRandomValues(new Uint8Array(8)), (n) =>
        n.toString(16).padStart(2, '0'),
      ).join('');
      const p = pending(() => requests.delete(tag));
      requests.set(tag, p);
      client.publish(
        prefix + 'cmd',
        '#' + tag + ' ' + command,
        { qos: 0, retain: false },
        (err) => {
          if (err) {
            p.fail(uncertain);
            requests.delete(tag);
          }
        },
      );
      return p.promise;
    },
  };
}

type SerialPort = {
  open: (options: { baudRate: number }) => Promise<void>;
  close: () => Promise<void>;
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
};
export async function connectUsb(signals: Signals): Promise<Connection> {
  const nav = navigator as Navigator & {
    serial?: { requestPort: () => Promise<SerialPort> };
  };
  if (!nav.serial)
    throw new Error('USB requires a Web Serial browser on localhost or HTTPS.');
  const port = await nav.serial.requestPort();
  await port.open({ baudRate: 115200 });
  const reader = port.readable.getReader(),
    writer = port.writable.getWriter();
  const requests: { response: ReturnType<typeof pending>; lines: string[] }[] =
    [];
  let closed = false,
    networkSketch = false;
  function close() {
    if (closed) return;
    closed = true;
    for (const r of requests.splice(0))
      r.response.fail('USB disconnected. Pump state unknown.');
    void reader.cancel().catch(() => {});
  }
  function lost(reason: string) {
    if (!closed) {
      close();
      signals.lost(reason);
    }
  }
  // The read-only time query ends each multiline UNO reply. A stop is written
  // immediately, even when a previous command still awaits acknowledgement.
  function line(value: string) {
    if (value.startsWith('event ')) {
      signals.event(value.slice(6));
      return;
    }
    const active = requests[0];
    if (!active) return;
    if (
      value.startsWith('esp32s3_network:') &&
      value.includes('pump=held-off')
    ) {
      networkSketch = true;
      requests.shift()?.response.done(value);
    } else if (value.startsWith('ok utc=')) {
      requests.shift()?.response.done(active.lines.join('\n'));
    } else if (/^(ok(?: |$)|error |\{|[1-8] )/.test(value)) {
      active.lines.push(value);
    }
  }
  async function listen() {
    const decoder = new TextDecoder();
    let buffered = '';
    try {
      while (!closed) {
        const { value, done } = await reader.read();
        if (done) break;
        buffered += decoder.decode(value, { stream: true });
        if (buffered.length > 65536) throw new Error('Unexpected USB data.');
        const lines = buffered.split('\n');
        buffered = lines.pop()!;
        for (const s of lines) line(s.trimEnd());
      }
    } catch {
      /* Device removal also ends this session. */
    } finally {
      lost('USB disconnected. Pump state unknown.');
      reader.releaseLock();
      writer.releaseLock();
      await port.close().catch(() => {});
    }
  }
  void listen();
  return {
    usb: true,
    close,
    async command(command) {
      checkCommand(command, true);
      if (closed || (networkSketch && command !== 'status'))
        throw new Error('Device control unavailable.');
      const response = pending(() => lost(uncertain));
      requests.push({ response, lines: [] });
      const instruction = command === 'stop' ? '!' : command;
      void writer
        .write(
          new TextEncoder().encode(
            instruction + (networkSketch ? '\n' : '\ntime\n'),
          ),
        )
        .catch(() => lost('USB write failed. Pump state unknown.'));
      return response.promise;
    },
  };
}
