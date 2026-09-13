# Security subsystem

The [local Xfinity camera service](apps/camera-viewer/README.md) supports Windows
account sign-in and automatic credential renewal, and displays WebRTC video through
a localhost-only server. See its guide for setup, limitations, and the distinction
between automated checks and real-camera validation.

The **Security → Live cameras** action in the [home atlas](../home-docs/README.md)
opens this player inside SmartHome when served by the local security service.
Run `corepack pnpm build` and `corepack pnpm security:start` from the repository
root, then open <http://127.0.0.1:4318/house/>. Complete the service guide's one-time
sign-in setup, choose a camera, and connect. Closing the panel stops playback and
retries. Phone import remains an optional diagnostic fallback.

Inventory details and generated history remain recorded/demo content. No
KumarSec or FamSecDash migration is included.

The [architecture decision](../docs/decisions/0003-local-camera-prototype.md)
defines credential handling, network exposure, retention, and verification.
[Account renewal](../docs/decisions/0005-renewable-camera-account.md) extends the
original prototype with persistent access and states the remaining validation.
This service is intended for its local operator, not LAN or internet hosting.
