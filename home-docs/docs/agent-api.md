# Agent API and access console

Use this interface to explore recorded house data and control the atlas the user
is looking at. Inventory is read-only; changing a view does not operate devices.
The browser API works in a standalone static build. Scoped HTTP access and the
admin console require the local security service and an open atlas tab.

## Start and grant access

From the repository root, with the [pinned toolchain](../../docs/development.md):

```sh
pnpm build
pnpm security:start
```

1. Open [Agent access](http://127.0.0.1:4318/admin.html).
2. Read `security/apps/camera-viewer/agent-admin.local` locally and enter its
   administrator token. The service creates this ignored file on first start;
   it prints the file location, never the token. Xfinity configuration is not
   needed for agent access.
3. Choose **Create key**, name the program, choose permissions, and optionally
   set an expiry. Copy the full key now; it cannot be retrieved later.
4. Open the atlas using the console link. Keep that tab open. The console lists
   connected tab IDs. Use the same hostname for the console and atlas.
5. Use **Manage** to rename a key or change permissions/expiry. **Revoke**
   permanently denies subsequent requests. For rotation, create a replacement,
   update the program, then revoke the old key.

| Permission   | HTTP methods allowed                        |
| ------------ | ------------------------------------------- |
| `data:read`  | `describe`, `getData`, `query`, `getRecord` |
| `view:read`  | `getState`                                  |
| `view:write` | `execute`                                   |

Any valid key can list connected tab IDs. A write-only key receives `{ "ok": true }`
after a successful command; reading its resulting state requires `view:read`.
API keys cannot create keys, administer sessions, retrieve camera credentials,
or invoke the camera service's playback/sign-in routes through this interface.

## Call from a program

Use `Authorization: Bearer <key>`; never put credentials in URLs. All endpoints
are on the loopback service. `GET /api/agent/v1/tabs` lists live connections.
`POST /api/agent/v1/tabs/{id}/call` accepts `{method,args}`. Successful calls
return `{result}` except write-only acknowledgements described above.

This Node example uses a key with all three permissions and exactly one open
atlas tab. Supply `SMARTHOME_API_KEY` through the program's secret configuration.
With several tabs, choose the intended ID explicitly from the console.

```js
const base = 'http://127.0.0.1:4318/api/agent/v1';
const headers = {
  Authorization: `Bearer ${process.env.SMARTHOME_API_KEY}`,
  'Content-Type': 'application/json',
};
async function json(response) {
  const data = await response.json();
  if (!response.ok)
    throw new Error(`${data.error.code}: ${data.error.message}`);
  return data;
}
const { tabs } = await json(await fetch(`${base}/tabs`, { headers }));
if (tabs.length !== 1)
  throw new Error('Select one connected atlas tab explicitly.');
async function call(method, ...args) {
  return json(
    await fetch(`${base}/tabs/${tabs[0].id}/call`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ method, args }),
    }),
  );
}
const { result: matches } = await call('query', {
  kind: 'camera',
  text: 'doorbell',
});
const camera = matches.records[0];
await call('execute', {
  type: 'record.select',
  kind: camera.kind,
  id: camera.id,
});
await call('execute', {
  type: 'view.set',
  view: { camera: { yaw: 0, pitch: 88 }, panels: { details: true } },
});
console.log((await call('getState')).result);
```

The UI changes in the connected tab, not in a headless copy. Tabs get a new ID on
reconnection/reload. Closing a tab, signing out of admin, session expiry (8 hours),
or restarting the service disconnects it. Sign in again and wait up to five
seconds for an open atlas to reconnect. List tabs again before further calls.

Errors have `{error:{code,message}}`: HTTP 400 for malformed commands, 401 for
missing/expired/revoked keys, 403 for insufficient permission or rejected origin,
404 for unknown records/endpoints, 429 for limits, 503 for unavailable tabs,
and 504 if a tab does not reply within ten seconds. A timed-out or disconnected
command may already have taken effect; read state before deciding to retry.
Changing or revoking a key cancels its pending replies, but cannot undo commands
already delivered to the browser. The service never retries commands itself.

## Browser API

Wait for `window.smartHome` or the window event `smarthome:ready`. The version is
`1.0`. For browser automation, call these methods through the tool's supported
page evaluation mechanism, in the **existing** user tab:

```js
const api = window.smartHome;
api.describe(); // JSON schemas, modes, record kinds/counts, methods, errors
api.getData(); // all collections, geometry, mappings, glossary, provenance
api.query({ kind: 'circuit', roomId: 'garage', limit: 20 });
api.getRecord('room', 'garage'); // raw data plus related record references
await api.execute({ type: 'record.select', kind: 'room', id: 'garage' });
const state = api.getState();
const unsubscribe = api.subscribe((snapshot) => console.log(snapshot));
// Later:
unsubscribe();
```

Browser methods return detached data, not mutable inventory or React internals.
`getRecord` returns null for an unknown ID. `query` accepts optional `kind`,
`text`, `roomId`, `floor`, `offset`, and `limit` (default 50, maximum 500).
Results contain `total`, `offset`, `nextOffset`, and `records`. Follow
`nextOffset` until null. Text matches all case-insensitive whitespace-separated
terms across source fields and the UI search index. Floor filtering uses mapped
room floors; recorded camera floor conflicts remain explicit in relationships.

Record kinds are `room`, `panel`, `circuit`, `bulb`, `network`, `node`, `server`,
`zone`, `camera`, `sensor`, and `upkeep`. IDs are stable source identifiers;
use kind and ID together. Networks open their view without a separate selected
network detail. Room selection isolates the room. Other selections clear
conflicting isolation, reset relevant list filters, and reveal details, including
on narrow screens. Recorded statuses are not live telemetry; observed network
timestamps and source evidence are preserved.

### Commands and snapshots

`execute` accepts three commands, validated before any mutation:

- `record.select`: `{type,kind,id}` navigates through the UI's selection path.
- `view.set`: `{type,view}` changes only supplied controls. Discover exact allowed
  values and numeric ranges in `describe().commands['view.set']`.
- `view.reset`: resets orientation, zoom, pan, isolation and separation. It keeps
  the current mode, selection, theme, and filters, like the UI's view reset.

Supported view fields: `mode`, `search`, `searchCategory`, `electricalFilter`,
`lightingFilter`, `lightingRoom`, `cameraFilter`, `upkeepFilter`, `isolation`
(`floor`, `rooms`), `camera` (`yaw`, `pitch`, `zoom`, `panX`, `panY`), `panels`
(`list`, `details`), `separation`, `theme`, `labels`, `legend`, `help`,
`liveCameras`, and `shortcuts`. Controls do not expose credential operations.
Opening live cameras selects Security and still requires the local camera
service for playback. Opening help closes the live-camera overlay; when both
are requested, live cameras takes precedence.

Nonempty isolation rooms take precedence over floor. Setting a floor alone
clears room isolation. On narrow screens only one panel opens; details wins if
both are requested. Camera changes stop auto-rotation, inertia and camera
tweens; API camera/separation changes apply immediately. Theme and shortcuts
persist through the existing local storage path. URL state retains the same
shareable subset as the UI (mode, selection, isolation, separation).

Commands run in submission order and resolve after React commits. Snapshots
include `version`, monotonic per-mount `revision`, and `view`, with current
selection, visible room IDs, effective theme, hash, and supported controls.
Subscriptions observe committed UI and programmatic view changes; observers
receive separate copies and cannot break other observers. They do not fire
immediately on registration. Read `getState` initially and unsubscribe when done.
Unmount removes the global, closes the bridge and rejects outstanding commands.
Direct browser errors have `code` and `message`; code is `INVALID_ARGUMENT`,
`NOT_FOUND`, or `UNAVAILABLE`.

## Storage and trust boundary

The [key store](../../security/apps/camera-viewer/server/agent-keys.ts) persists
SHA-256 hashes of random 256-bit keys and their metadata in `agent-keys.local`.
The separate administrator bootstrap token lives in `agent-admin.local`.
Both are ignored, outside served builds, and created with restrictive file modes
where supported by the OS. Protect the local account and directory permissions
on Windows. `AGENT_STATE_DIR` can relocate these files; automated browser tests
use a separate directory under ignored `test-results/`.

Admin sign-in sets an HttpOnly, SameSite=Strict cookie with an eight-hour session;
it does not store the bootstrap token in browser storage. Sign-out disconnects
that session's atlas tabs. The service binds to loopback, checks Host/Origin,
rejects cross-site requests, and provides no cross-origin access. Only key-authenticated
program endpoints accept mutations without an Origin header. Incorrect admin
sign-ins are rate-limited. Server restarts invalidate admin sessions but preserve
keys and revocations. To replace a lost administrator token, stop the service,
remove only `agent-admin.local`, then restart and sign in with the newly generated
token. Keep `agent-keys.local` to preserve existing revocations.

Keys limit this HTTP API. They do **not** sandbox code already running in the
atlas origin, browser automation with full tab access, or trusted local processes
that can read the administrator file. Static assets still contain the inventory.
Do not expose this localhost service through a public tunnel. This is not a
multi-user hosting or device-control authorization system.

## Verification

[Browser API tests](../apps/web/e2e/agent-api.spec.ts) cover discovery, all record
kinds, visible controls, invalid commands, subscriptions and reloads on desktop
and mobile Chromium. [Admin browser tests](../../security/apps/camera-viewer/e2e/agent-admin.spec.ts)
exercise key creation, scope changes, real HTTP-to-visible-tab control, write-only
responses, revocation and logout. Unit tests cover serialization, lifecycle,
detached data, persisted hashes, expiry, revocation, origin/admin separation,
permission checks and pending-call cancellation. Run all
[required gates](../../docs/testing.md#required-local-gates) before committing.
