# Security subsystem

The [local Xfinity camera prototype](apps/camera-viewer/README.md) imports viewing
credentials from an authorized Android phone and displays WebRTC video through
a localhost-only server. See its guide for setup, limitations, and the distinction
between automated checks and real-camera validation.

The **Security → Live cameras** action in the [home atlas](../home-docs/README.md)
opens this player inside SmartHome when served by the local security service.
Run `corepack pnpm build` and `corepack pnpm security:start` from the repository
root, then open <http://127.0.0.1:4318/house/>. Import sessions from the signed-in
phone, choose a camera, and connect. Closing the panel stops its playback.

Inventory details and generated history remain recorded/demo content. No
KumarSec or FamSecDash migration is included.

The [architecture decision](../docs/decisions/0003-local-camera-prototype.md)
defines credential handling, network exposure, retention, and verification.
This service is intended for its local operator, not LAN or internet hosting.
