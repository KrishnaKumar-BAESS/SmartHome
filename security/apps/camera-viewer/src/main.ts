import './style.css';

if (new URLSearchParams(window.location.search).get('embedded') === '1')
  document.body.classList.add('embedded');

interface Camera {
  id: string;
  label: string;
  expires: number;
}
interface SignalMessage {
  type: string;
  payload: { sdp?: string; candidate?: RTCIceCandidateInit };
}
interface SignalEvent {
  kind: string;
  message?: string;
  name?: string;
  args?: unknown[];
}
const element = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const importButton = element<HTMLButtonElement>('import');
const connectButton = element<HTMLButtonElement>('connect');
const stopButton = element<HTMLButtonElement>('stop');
const select = element<HTMLSelectElement>('camera');
const video = element<HTMLVideoElement>('video');
let cameras: Camera[] = [];
let sessionId: string | undefined;
let events: EventSource | undefined;
let peer: RTCPeerConnection | undefined;
let iceServers: RTCIceServer[] = [];
let candidates: RTCIceCandidateInit[] = [];
let serial: Promise<void> = Promise.resolve();
let statsTimer: ReturnType<typeof setInterval> | undefined;
let generation = 0;

function status(message: string, error = false) {
  element('status').textContent = message;
  element('status').classList.toggle('error', error);
}

async function api(path: string, value?: unknown) {
  const response = await fetch(
    path,
    value === undefined
      ? {}
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(value),
        },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

function showCameras(value: Camera[]) {
  cameras = value;
  select.replaceChildren(
    ...value.map((camera) => new Option(camera.label, camera.id)),
  );
  select.disabled = !value.length;
  connectButton.disabled = !value.length || !!sessionId;
  updateExpiry();
}

function updateExpiry() {
  const camera = cameras.find((camera) => camera.id === select.value);
  if (camera)
    element('expiry').textContent =
      `Credentials for ${camera.label} expire at ${new Date(camera.expires).toLocaleTimeString()}. A new connection needs unexpired credentials.`;
}
select.addEventListener('change', updateExpiry);

async function stop() {
  generation++;
  const oldId = sessionId;
  sessionId = undefined;
  events?.close();
  events = undefined;
  peer?.close();
  peer = undefined;
  clearInterval(statsTimer);
  video.srcObject = null;
  element('placeholder').hidden = false;
  element('playback').textContent = 'Stopped';
  element('connection').textContent = '—';
  connectButton.disabled = !cameras.length;
  stopButton.disabled = true;
  select.disabled = !cameras.length;
  if (oldId) await api(`/api/sessions/${oldId}/stop`, {}).catch(() => {});
}

async function send(type: string, payload: unknown) {
  if (sessionId)
    await api(`/api/sessions/${sessionId}/signal`, { type, payload });
}

function addIceServers(raw: unknown[]) {
  const entries = raw.flat();
  for (const entry of entries) {
    if (typeof entry === 'string' && /^(stun|turn|turns):/.test(entry))
      iceServers.push({ urls: entry });
    else if (entry && typeof entry === 'object') {
      const item = entry as {
        url?: string;
        urls?: string | string[];
        username?: string;
        credential?: string;
      };
      const urls = item.urls || item.url;
      if (
        urls &&
        (Array.isArray(urls) ? urls : [urls]).every((url) =>
          /^(stun|turn|turns):/.test(url),
        )
      ) {
        iceServers.push({
          urls,
          username: item.username,
          credential: item.credential,
        });
      }
    }
  }
}

async function receive(event: SignalEvent, current: number) {
  if (current !== generation) return;
  if (event.kind === 'error') {
    await stop();
    status(event.message || 'Connection failed.', true);
    return;
  }
  if (event.kind === 'status') {
    status(event.message || 'Connecting…');
    return;
  }
  if (event.name === 'stunservers' || event.name === 'turnservers') {
    addIceServers(event.args || []);
    return;
  }
  if (event.name !== 'message') return;
  const message = event.args?.[0] as SignalMessage | undefined;
  if (!message) return;
  if (message.type === 'candidate' && message.payload.candidate) {
    if (peer?.remoteDescription)
      await peer.addIceCandidate(message.payload.candidate);
    else candidates.push(message.payload.candidate);
  }
  if (message.type !== 'offer' || !message.payload.sdp) return;
  peer?.close();
  const connection = new RTCPeerConnection({ iceServers });
  peer = connection;
  connection.onicecandidate = (event) => {
    if (event.candidate && current === generation)
      void send('candidate', { candidate: event.candidate.toJSON() }).catch(
        (error) => status(error.message, true),
      );
  };
  connection.ontrack = (event) => {
    const stream =
      video.srcObject instanceof MediaStream
        ? video.srcObject
        : new MediaStream();
    stream.addTrack(event.track);
    video.srcObject = stream;
    void video
      .play()
      .catch(() => status('Press Play on the video to begin playback.'));
  };
  connection.onconnectionstatechange = () => {
    if (current !== generation) return;
    element('connection').textContent = connection.connectionState;
    if (connection.connectionState === 'failed') {
      element('playback').textContent = 'Disconnected';
      status(
        'Media connection failed. Check LAN/VPN routing, then reconnect.',
        true,
      );
    }
  };
  await connection.setRemoteDescription({
    type: 'offer',
    sdp: message.payload.sdp,
  });
  for (const candidate of candidates)
    await connection.addIceCandidate(candidate);
  candidates = [];
  const answer = await connection.createAnswer();
  await connection.setLocalDescription(answer);
  await send('answer', { sdp: connection.localDescription?.sdp });
  status('Session negotiated. Waiting for decoded video…');
  clearInterval(statsTimer);
  let lastFrames = 0;
  let lastFrameAt = Date.now();
  statsTimer = setInterval(() => {
    void connection
      .getStats()
      .then((stats) => {
        if (current !== generation) return;
        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            element('frames').textContent = String(report.framesDecoded || 0);
            element('resolution').textContent = video.videoWidth
              ? `${video.videoWidth} × ${video.videoHeight}`
              : '—';
            if (report.framesDecoded > lastFrames) {
              lastFrames = report.framesDecoded;
              lastFrameAt = Date.now();
            }
            if (Date.now() - lastFrameAt > 10_000) {
              element('playback').textContent = 'Waiting for video';
              status(
                'No new decoded frames for 10 seconds. Check the connection or reconnect.',
                true,
              );
            } else if (
              report.framesDecoded > 0 &&
              video.videoWidth &&
              connection.connectionState !== 'failed'
            ) {
              element('placeholder').hidden = true;
              element('playback').textContent = 'Live';
              status(
                `Playing ${cameras.find((camera) => camera.id === select.value)?.label || 'camera'}.`,
              );
            }
          }
        });
      })
      .catch(() => {});
  }, 1000);
}

importButton.addEventListener('click', () => {
  importButton.disabled = true;
  status('Reading fresh camera sessions from the phone…');
  void api('/api/import', {})
    .then((data) => {
      showCameras(data.cameras);
      status(
        `Imported ${data.cameras.length} camera sessions. Select a camera and connect.`,
      );
    })
    .catch((error) => status(error.message, true))
    .finally(() => {
      importButton.disabled = false;
    });
});

connectButton.addEventListener('click', () => {
  connectButton.disabled = true;
  void (async () => {
    await stop();
    const current = generation;
    connectButton.disabled = true;
    select.disabled = true;
    element('frames').textContent = '0';
    element('resolution').textContent = '—';
    iceServers = [];
    candidates = [];
    serial = Promise.resolve();
    const data = await api('/api/sessions', { camera: select.value });
    sessionId = data.id;
    stopButton.disabled = false;
    events = new EventSource(`/api/sessions/${sessionId}/events`);
    events.onmessage = (event) => {
      serial = serial
        .then(() => receive(JSON.parse(event.data), current))
        .catch(async (error) => {
          await stop();
          status(`Playback negotiation failed: ${error.message}`, true);
        });
    };
    events.onerror = () => {
      if (sessionId) {
        void stop();
        status(
          'The local signaling connection closed. Reconnect to retry.',
          true,
        );
      }
    };
  })().catch(async (error) => {
    await stop();
    status(error.message, true);
  });
});
stopButton.addEventListener('click', () => {
  void stop().then(() => status('Viewer stopped.'));
});
window.addEventListener('pagehide', () => {
  events?.close();
  peer?.close();
});
void api('/api/cameras')
  .then((data) => {
    showCameras(data.cameras);
    if (!data.configured)
      status(
        'Configure verified signaling hosts in .env.local before importing sessions.',
      );
  })
  .catch((error) => status(error.message, true));
