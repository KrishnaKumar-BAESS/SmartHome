# 0003 — Local camera playback prototype

- Date: 2026-09-13
- Status: Accepted for local prototype scope; live validation is separate

## Context

Owned Xfinity cameras exchange encrypted WebRTC media with the signed-in Android
app. Inspection identified cloud-issued viewing tokens and legacy Socket.IO
signaling. Independent account authentication has not been established. Existing
camera pairing must be preserved.

## Decision

Implement a strict-TypeScript application in `security/apps/camera-viewer`, using
the shared workspace tooling. It imports short-lived credentials through
authorized, app-scoped ADB logs. A localhost-only Node server retains camera
tokens and proxies signaling; the browser handles WebRTC media. Import and Connect
are separate actions. Token destinations require an independently verified host
allowlist. Signaling handshakes do not follow redirects.

The service requires local hostnames and same-origin state-changing requests.
It has no remote login, persistence, recording, camera controls, or hosting.
Only built frontend assets are served. The local operator owns configuration,
ADB authorization, stopping the service, and private validation evidence.
Camera tokens do not enter the browser bundle, application logs, or persistent
application storage. SDP and ICE credentials needed for media necessarily reach
the local browser. Local people and processes remain trusted.

## Alternatives

- OAuth login and renewal are the route to phone independence, but require
  separate validation of login, registration, and renewal behavior.
- Resetting/reflashing threatens existing pairing and is outside scope.
- Replacing atlas demonstrations now would mix recorded inventory with an
  unverified integration and add cross-subsystem runtime coupling.

## Consequences

The prototype can exercise an independent media client without changing pairing,
but requires the phone for fresh credentials. Tests establish local boundaries
and UI behavior; real devices must establish server acceptance, video decoding,
and simultaneous viewing. Failures and stalled video are displayed explicitly.
Remote exposure or durable authentication requires reviewing this boundary.

Shared checks and browser tests include the package. No runtime dependency on the
atlas or separate KumarSec/FamSecDash repositories is introduced.

## References

- [Prototype guide](../../security/apps/camera-viewer/README.md)
- [Security subsystem](../../security/README.md)
- [Security and privacy](../security.md)
