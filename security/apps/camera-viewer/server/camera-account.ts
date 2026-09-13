import type { Account } from './account.js';
import { parseSessions, type CameraSession } from './sessions.js';

interface Device {
  id: string;
  camera: string;
  label: string;
}
export class CameraAccount {
  private devices: Device[] = [];
  private listedAt = 0;
  private listing?: Promise<Device[]>;
  constructor(
    private readonly account: Account,
    private readonly hosts: ReadonlySet<string>,
    private readonly names: Record<string, string>,
    private readonly request: typeof fetch = fetch,
  ) {}

  private async get(path: string) {
    let credentials = await this.account.credentials();
    for (let attempt = 0; attempt < 2; attempt++) {
      let response: Response;
      try {
        response = await this.request(
          `https://gw.api.dh.comcast.com/camera/${path}`,
          {
            redirect: 'error',
            signal: AbortSignal.timeout(20_000),
            headers: {
              Authorization: `Bearer ${credentials.access}`,
              ...(credentials.id ? { 'X-Id-Token': credentials.id } : {}),
              Accept: 'application/json',
            },
          },
        );
      } catch {
        throw new Error('Xfinity camera service is unavailable.');
      }
      if (response.status === 401 && attempt === 0) {
        await response.body?.cancel();
        credentials = await this.account.credentials(credentials.access);
        continue;
      }
      if (!response.ok)
        throw new Error(`Xfinity camera request failed (${response.status}).`);
      return response.json();
    }
    throw new Error('Xfinity camera authorization failed.');
  }

  private async devicesForAccount() {
    if (Date.now() - this.listedAt < 60_000) return this.devices;
    if (this.listing) return this.listing;
    this.listing = (async () => {
      const data = await this.get('devices?support=privacy');
      if (!Array.isArray(data.cameras))
        throw new Error('Unexpected Xfinity camera list.');
      const devices: Device[] = [];
      for (const value of data.cameras) {
        const camera =
          typeof value.macAddress === 'string'
            ? value.macAddress.replaceAll(':', '').toUpperCase()
            : '';
        if (
          !/^[A-F0-9]{12}$/.test(camera) ||
          typeof value.id !== 'string' ||
          !/^[\w:-]{1,128}$/.test(value.id)
        )
          throw new Error('Unexpected Xfinity camera identifier.');
        devices.push({
          id: value.id,
          camera,
          label:
            this.names[camera] ||
            (typeof value.displayName === 'string'
              ? value.displayName.slice(0, 120)
              : `Camera ${camera.slice(-4)}`),
        });
      }
      this.devices = devices;
      this.listedAt = Date.now();
      return devices;
    })();
    try {
      return await this.listing;
    } finally {
      this.listing = undefined;
    }
  }

  async list() {
    return (await this.devicesForAccount()).map((device) => ({
      id: device.camera,
      label: device.label,
      renewable: true,
    }));
  }

  async session(camera: string): Promise<CameraSession> {
    const device = (await this.devicesForAccount()).find(
      (device) => device.camera === camera,
    );
    if (!device) throw new Error('Camera is not in the signed-in account.');
    const metadata = await this.get(
      `deviceId/${encodeURIComponent(device.id)}/liveStream`,
    );
    // Reuse the proven token/room/host validation and Socket.IO join contract.
    const log = `io.socket: > ${JSON.stringify({ name: 'join', args: [metadata.room, { token: metadata.auth?.token, streamName: 'stream2' }] })}`;
    const session = parseSessions(log, this.hosts, {
      [camera]: device.label,
    }).find((value) => value.camera === camera);
    if (!session)
      throw new Error(
        'Camera returned expired credentials or an unapproved signaling host.',
      );
    const server = metadata.server?.url;
    if (
      (metadata.server?.port !== undefined && metadata.server.port !== 443) ||
      typeof server !== 'string' ||
      ![
        session.host,
        `https://${session.host}`,
        `https://${session.host}/`,
      ].includes(server)
    )
      throw new Error(
        'Camera signaling address did not match the approved host.',
      );
    return session;
  }
}
