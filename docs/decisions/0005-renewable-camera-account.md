# ADR-0005: Renewable local camera account

Status: implemented; live authentication validation pending.
Date: 2026-09-13.

## Context

[ADR-0003](0003-local-camera-prototype.md) proved additional Xfinity camera
playback using short-lived tokens imported from an Android phone.
[ADR-0004](0004-security-live-camera-integration.md) embedded that player into
Security. Requiring ADB whenever credentials expire prevents unattended use.

## Decision

The security service supports a separate interactive OAuth authorization-code
session using the installed app's production client configuration and PKCE.
Windows routes its custom callback to a narrowly scoped Node helper, which sends
the callback to localhost. State expires after ten minutes and is consumed once.
The operator signs in directly with Xfinity; SmartHome never receives a password.

The Node service persists account credentials using Windows DPAPI CurrentUser,
with atomic file replacement. It serializes account renewal, saves rotated
refresh tokens, and checks renewal every minute. Camera API requests use account
credentials only at the fixed Comcast API origin and refuse redirects. Camera
viewing tokens go only to explicitly configured signaling hosts. No account or
viewing token is returned to the browser.

The browser loads camera metadata from the account, requests new credentials on
each connection, and retries temporary failures with capped exponential delays.
Stopping playback or unmounting the Security panel cancels retries. Revoked
account sessions require sign-in again. ADB remains a temporary diagnostic path.

## Consequences and verification

Keeping only ADB imports was rejected because those tokens cannot renew.
Copying the phone's refresh token was avoided in favor of a separate interactive
session. A normal localhost OAuth callback was tested and rejected by the
provider, so this Windows implementation uses the registered custom scheme.

This implementation is Windows-specific and local-only. It trusts the current
Windows user and local processes. DPAPI does not protect against processes running
as that user. It provides neither LAN user authentication nor remote hosting,
OS startup registration, a recorder, or a guarantee of permanent Xfinity access.
An unofficial upstream API change may break authentication or camera discovery.

Automated tests cover callback binding, refresh rotation/concurrency, recovery
from persisted credentials, failed writes, destination checks, and canceled
retries. Live validation must additionally prove sign-in, renewal, restart and
playback without ADB, and continued normal phone access. Earlier phone-assisted
video evidence does not satisfy that requirement. See the
[service guide](../../security/apps/camera-viewer/README.md) for setup and rollback.
