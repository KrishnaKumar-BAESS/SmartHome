# 0004 — Live cameras in SmartHome Security

- Date: 2026-09-13
- Status: Accepted

## Context

The phone-assisted camera player has decoded video from all three household
Xfinity cameras while existing Xfinity app access remained available. SmartHome's
Security view previously offered only inventory and generated demonstrations.

## Decision

The existing local security server serves the built house atlas at `/house/` and
the camera player at `/`. Security's **Live cameras** action opens the player in
a same-origin dialog. This reuses the verified signaling and media implementation
without duplicating it in the atlas or introducing cross-origin credential access.
Closing the dialog removes its frame, closing the media and signaling session.

The server remains bound to loopback. Tokens remain in server memory and are sent
only to the exact configured Comcast hosts. The player's frame policy permits
same-origin embedding; the atlas cannot be framed. The atlas's inline styles and
hashed theme initializer are allowed without permitting arbitrary inline scripts.
Both asset roots are production build directories; repository files are not served.

The atlas's static deployment still works. Its live-camera action explains how
to open the local service when no matching camera API is available. It does not
automatically probe another origin. Recorded inventory and demonstration history
remain distinct from the live player and are labeled accordingly.

## Alternatives

- A second React WebRTC client would duplicate lifecycle and protocol behavior.
- Linking out alone would leave live viewing outside the Security workflow.
- A remote camera backend would require authentication and a new exposure model,
  beyond incorporating the working local player.

## Consequences

The local Security runtime now depends on both production builds. The standalone
atlas can still be hosted independently. Fresh viewing credentials continue to
require the signed-in ADB phone; automatic renewal is not added by this integration.

## References

- [Camera player and local setup](../../security/apps/camera-viewer/README.md)
- [Original player boundary](0003-local-camera-prototype.md)
- [Architecture](../architecture.md)
