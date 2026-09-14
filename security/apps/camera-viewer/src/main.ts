import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import './style.css';

const embedded =
  new URLSearchParams(window.location.search).get('embedded') === '1';
if (embedded) {
  document.body.classList.add('embedded');
  // Let Escape close the Security overlay even while the player has focus.
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape')
      window.parent.postMessage(
        { type: 'smarthome:close-live-cameras' },
        window.location.origin,
      );
  });
}

interface Camera {
  id: string;
  label: string;
  expires?: number;
  renewable?: boolean;
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
const loginButton = element<HTMLButtonElement>('login');
const refreshButton = element<HTMLButtonElement>('refresh');
const stopButton = element<HTMLButtonElement>('stop');
const tiles = element<HTMLDivElement>('cameras');
const viewer = element<HTMLDivElement>('viewer');
const video = element<HTMLVideoElement>('video');
let cameras: Camera[] = [];
let selectedCamera: string | undefined;
let sessionId: string | undefined;
let events: EventSource | undefined;
let peer: RTCPeerConnection | undefined;
let iceServers: RTCIceServer[] = [];
let candidates: RTCIceCandidateInit[] = [];
let serial: Promise<void> = Promise.resolve();
let statsTimer: ReturnType<typeof setInterval> | undefined;
let generation = 0;
let renewable = false;
let desiredCamera: string | undefined;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let watchdog: ReturnType<typeof setTimeout> | undefined;
let loginTimer: ReturnType<typeof setInterval> | undefined;
let attempts = 0;

function status(message: string, error = false) {
  element('status').textContent = message;
  element('status').classList.toggle('error', error);
}

type LiveState = 'idle' | 'connecting' | 'live' | 'error';
const liveLabels: Record<LiveState, string> = {
  idle: 'STANDBY',
  connecting: 'CONNECTING',
  live: 'LIVE',
  error: 'RETRYING',
};
const placeholderLabels: Record<LiveState, string> = {
  idle: 'No camera connected',
  connecting: 'Connecting…',
  live: 'Live',
  error: 'Reconnecting…',
};
function setLive(state: LiveState) {
  element('live').dataset.state = state;
  element('live-label').textContent = liveLabels[state];
  element('placeholder-label').textContent = placeholderLabels[state];
  element('placeholder-hint').hidden = state !== 'idle';
  viewer.classList.toggle('is-live', state === 'live');
  tiles.dataset.state = state;
}

function selectedLabel() {
  return cameras.find((camera) => camera.id === selectedCamera)?.label;
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

function tile(camera: Camera) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tile';
  button.dataset.camera = camera.id;
  const dot = document.createElement('span');
  dot.className = 'tile-dot';
  dot.setAttribute('aria-hidden', 'true');
  const text = document.createElement('span');
  text.className = 'tile-text';
  const name = document.createElement('span');
  name.className = 'tile-name';
  name.textContent = camera.label;
  const sub = document.createElement('span');
  sub.className = 'tile-sub';
  sub.textContent = camera.renewable
    ? 'Renews automatically'
    : `Expires ${new Date(camera.expires!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  text.append(name, sub);
  button.append(dot, text);
  button.addEventListener('click', () => {
    if (desiredCamera === camera.id) return;
    attempts = 0;
    selectedCamera = camera.id;
    desiredCamera = camera.id;
    markSelected();
    void connectCamera(camera.id);
  });
  return button;
}

function markSelected() {
  for (const button of tiles.querySelectorAll<HTMLButtonElement>('.tile'))
    button.setAttribute(
      'aria-pressed',
      String(button.dataset.camera === selectedCamera),
    );
  const label = selectedLabel();
  element('camera-name').textContent = label || 'No camera selected';
  element('watermark').textContent = (label || 'Security').toUpperCase();
  updateExpiry();
}

function showCameras(value: Camera[]) {
  cameras = value;
  if (!value.some((camera) => camera.id === selectedCamera))
    selectedCamera = undefined;
  element('cameras-empty').hidden = value.length > 0;
  tiles.replaceChildren(
    element('cameras-empty'),
    ...value.map((camera) => tile(camera)),
  );
  markSelected();
}

function updateExpiry() {
  const camera = cameras.find((camera) => camera.id === selectedCamera);
  if (camera)
    element('expiry').textContent = camera.renewable
      ? 'SmartHome requests fresh viewing credentials automatically. No phone connection is required.'
      : `Credentials for ${camera.label} expire at ${new Date(camera.expires!).toLocaleTimeString()}. A new connection needs unexpired credentials.`;
}

async function release() {
  generation++;
  const oldId = sessionId;
  sessionId = undefined;
  events?.close();
  events = undefined;
  peer?.close();
  peer = undefined;
  clearInterval(statsTimer);
  clearTimeout(watchdog);
  video.srcObject = null;
  video.controls = false;
  element('placeholder').hidden = false;
  element('playback').textContent = 'Stopped';
  element('connection').textContent = '—';
  element('resolution').textContent = '—';
  setLive('idle');
  stopButton.disabled = true;
  if (oldId) await api(`/api/sessions/${oldId}/stop`, {}).catch(() => {});
}

async function stop() {
  desiredCamera = undefined;
  clearTimeout(retryTimer);
  retryTimer = undefined;
  await release();
}

async function retry(message: string) {
  if (!desiredCamera || !renewable) {
    await stop();
    status(message, true);
    return;
  }
  if (retryTimer) return;
  const camera = desiredCamera;
  await release();
  if (desiredCamera !== camera) return;
  const delay = Math.min(30_000, 2000 * 2 ** Math.min(attempts++, 4));
  status(`${message} Retrying in ${delay / 1000} seconds…`, true);
  setLive('error');
  stopButton.disabled = false;
  retryTimer = setTimeout(() => {
    retryTimer = undefined;
    if (desiredCamera === camera) void connectCamera(camera);
  }, delay);
}

function watchVideo() {
  clearTimeout(watchdog);
  watchdog = setTimeout(() => {
    void retry('Video stopped arriving.');
  }, 30_000);
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
    await retry(event.message || 'Connection failed.');
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
    video.controls = true;
    void video
      .play()
      .catch(() => status('Press Play on the video to begin playback.'));
  };
  connection.onconnectionstatechange = () => {
    if (current !== generation) return;
    element('connection').textContent = connection.connectionState;
    if (connection.connectionState === 'failed') {
      element('playback').textContent = 'Disconnected';
      void retry('Media connection failed.');
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
              attempts = 0;
              watchVideo();
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
              setLive('live');
              status(`Playing ${selectedLabel() || 'camera'}.`);
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
        `Imported ${data.cameras.length} camera sessions. Choose a camera to start a live session.`,
      );
    })
    .catch((error) => status(error.message, true))
    .finally(() => {
      importButton.disabled = false;
    });
});

async function connectCamera(camera: string) {
  try {
    await release();
    if (desiredCamera !== camera) return;
    const current = generation;
    setLive('connecting');
    element('frames').textContent = '0';
    element('resolution').textContent = '—';
    iceServers = [];
    candidates = [];
    serial = Promise.resolve();
    stopButton.disabled = false;
    const data = await api('/api/sessions', { camera });
    if (current !== generation || desiredCamera !== camera) {
      await api(`/api/sessions/${data.id}/stop`, {}).catch(() => {});
      return;
    }
    sessionId = data.id;
    stopButton.disabled = false;
    watchVideo();
    events = new EventSource(`/api/sessions/${sessionId}/events`);
    events.onmessage = (event) => {
      serial = serial
        .then(() => receive(JSON.parse(event.data), current))
        .catch(async (error) => {
          if (current === generation)
            await retry(`Playback negotiation failed: ${error.message}`);
        });
    };
    events.onerror = () => {
      if (current === generation && sessionId)
        void retry('The local signaling connection closed.');
    };
  } catch (error) {
    const account = await api('/api/account').catch(() => null);
    if (account && !account.signedIn && renewable) {
      await stop();
      loginButton.hidden = false;
      status('Xfinity requires a new sign-in.', true);
    } else if (desiredCamera === camera)
      await retry(
        error instanceof Error ? error.message : 'Connection failed.',
      );
  }
}
stopButton.addEventListener('click', () => {
  void stop().then(() => status('Viewer stopped.'));
});
window.addEventListener('pagehide', () => {
  desiredCamera = undefined;
  clearTimeout(retryTimer);
  clearTimeout(watchdog);
  clearInterval(statsTimer);
  clearInterval(loginTimer);
  events?.close();
  peer?.close();
});
async function loadCameras() {
  return api('/api/cameras')
    .then((data) => {
      renewable = !!data.renewable;
      showCameras(data.cameras);
      if (!data.configured)
        status(
          'Configure verified signaling hosts in .env.local before importing sessions.',
        );
      else if (!desiredCamera)
        status(
          data.cameras.length
            ? 'Choose a camera to start a live session.'
            : 'Sign in to Xfinity to load your cameras.',
        );
    })
    .catch((error) => status(error.message, true));
}

async function accountStatus() {
  const account = await api('/api/account');
  loginButton.hidden = !account.configured || account.signedIn;
  refreshButton.hidden = !account.signedIn;
  element('account-status').textContent = account.persistenceFailed
    ? 'Account storage failed. Keep this service running and check disk access before restarting.'
    : account.signedIn
      ? 'Xfinity account connected · automatic renewal enabled'
      : account.configured
        ? 'Sign in to enable automatic access renewal.'
        : 'Account sign-in is not configured. See Setup and troubleshooting.';
  return account;
}
loginButton.addEventListener('click', () => {
  // Open synchronously so browsers permit the sign-in tab.
  const popup = window.open('about:blank', '_blank');
  if (!popup) {
    status('Allow the sign-in pop-up, then try again.', true);
    return;
  }
  popup.opener = null;
  loginButton.disabled = true;
  void api('/api/account/login', {})
    .then((data) => {
      popup.location.href = data.url;
      status('Complete Xfinity sign-in in the new tab, then return here.');
      const deadline = Date.now() + 10 * 60_000;
      clearInterval(loginTimer);
      loginTimer = setInterval(() => {
        void accountStatus()
          .then((account) => {
            if (
              account.signedIn ||
              account.loginError ||
              Date.now() > deadline
            ) {
              clearInterval(loginTimer);
              loginButton.disabled = false;
              if (account.signedIn) {
                status('Account connected. Loading cameras…');
                void loadCameras();
              } else
                status(
                  account.loginError ||
                    'Sign-in timed out. Start sign-in again.',
                  true,
                );
            }
          })
          .catch(() => {});
      }, 2000);
    })
    .catch((error) => {
      popup.close();
      loginButton.disabled = false;
      status(error.message, true);
    });
});
refreshButton.addEventListener('click', () => {
  void accountStatus()
    .then(loadCameras)
    .catch((error) => status(error.message, true));
});
void accountStatus()
  .then(loadCameras)
  .catch((error) => status(error.message, true));
