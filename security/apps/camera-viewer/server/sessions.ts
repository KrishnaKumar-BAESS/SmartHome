import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { homedir } from 'node:os';
import { join } from 'node:path';

const run = promisify(execFile);
export interface CameraSession {
  camera: string;
  label: string;
  room: string;
  host: string;
  token: string;
  streamName: string;
  expires: number;
}

export function parseSessions(
  logs: string,
  allowedHosts: ReadonlySet<string>,
  names: Record<string, string> = {},
  now = Date.now(),
): CameraSession[] {
  const sessions = new Map<string, CameraSession>();
  for (const line of logs.split(/\r?\n/)) {
    const raw = line.match(/io\.socket: > .*?(\{"name":"join".*)$/)?.[1];
    if (!raw) continue;
    try {
      const event = JSON.parse(raw);
      const [room, info] = event.args;
      if (typeof room !== 'string' || !/^\d{1,24}$/.test(room)) continue;
      if (typeof info?.token !== 'string' || info.token.length > 8192) continue;
      if (!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(info.token)) continue;
      // Decoding discovers camera/expiry; only Comcast can validate the signature.
      const claims = JSON.parse(
        Buffer.from(info.token.split('.')[1], 'base64url').toString(),
      );
      const camera =
        typeof claims.camera === 'string' ? claims.camera.toUpperCase() : '';
      const host = `${room}.ssrouterprod.comcast.net`;
      if (!/^[A-F0-9]{12}$/.test(camera) || !allowedHosts.has(host)) continue;
      if (typeof claims.exp !== 'number' || !Number.isFinite(claims.exp))
        continue;
      const expires = claims.exp * 1000;
      if (expires <= now + 15_000) continue;
      if (
        typeof info.streamName !== 'string' ||
        !/^stream\d{1,2}$/.test(info.streamName)
      )
        continue;
      sessions.set(camera, {
        camera,
        label: names[camera] || `Camera ${camera.slice(-4)}`,
        room,
        host,
        token: info.token,
        streamName: info.streamName,
        expires,
      });
    } catch {
      // Logcat can truncate a line. Never include raw log material in errors.
    }
  }
  return [...sessions.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function publicCamera(session: CameraSession) {
  return { id: session.camera, label: session.label, expires: session.expires };
}

export async function readPhoneSessions(
  allowedHosts: ReadonlySet<string>,
  names: Record<string, string>,
) {
  if (!allowedHosts.size)
    throw new Error(
      'Configure the verified signaling hosts in .env.local first.',
    );
  const adb =
    process.env.ADB_PATH ||
    (process.platform === 'win32'
      ? join(homedir(), 'AppData/Local/Android/Sdk/platform-tools/adb.exe')
      : 'adb');
  const options = {
    timeout: 20_000,
    maxBuffer: 12 * 1024 * 1024,
    windowsHide: true,
  };
  let logs: string;
  try {
    const { stdout: packages } = await run(
      adb,
      ['shell', 'pm', 'list', 'packages', '-U', 'com.xfinity.digitalhome'],
      options,
    );
    const uid = packages.match(
      /^package:com\.xfinity\.digitalhome uid:(\d+)\s*$/m,
    )?.[1];
    if (!uid) throw new Error('Package unavailable');
    ({ stdout: logs } = await run(
      adb,
      ['logcat', '-d', `--uid=${uid}`, '-t', '12000', '-v', 'threadtime'],
      options,
    ));
  } catch {
    throw new Error(
      'Cannot read the Xfinity app logs. Connect one authorized ADB phone with Xfinity installed.',
    );
  }
  const sessions = parseSessions(logs, allowedHosts, names);
  if (!sessions.length) {
    throw new Error(
      'No fresh viewing sessions found. Open the camera list in Xfinity, then import again. Expired tokens cannot start a new viewer.',
    );
  }
  return sessions;
}
