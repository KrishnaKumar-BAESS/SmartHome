# Security subsystem

The [local Xfinity camera prototype](apps/camera-viewer/README.md) imports viewing
credentials from an authorized Android phone and displays WebRTC video through
a localhost-only server. See its guide for setup, limitations, and the distinction
between automated checks and real-camera validation.

The **Security** mode in the separate [home atlas](../home-docs/README.md) still
shows recorded information and demonstrations. It is not connected to this
prototype. No KumarSec or FamSecDash migration is included.

The [architecture decision](../docs/decisions/0003-local-camera-prototype.md)
defines credential handling, network exposure, retention, and verification.
This service is intended for its local operator, not LAN or internet hosting.
