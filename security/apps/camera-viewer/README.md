# Local Xfinity camera service

This application serves the SmartHome Security player, renews a separately
signed-in Xfinity account session, and requests fresh camera viewing credentials.
Its local server handles legacy Socket.IO signaling; the browser negotiates
WebRTC and displays received video. No camera-setting controls or pairing changes
are involved. ADB import remains an optional diagnostic fallback.

**Status:** real-camera playback verified on three household cameras on
2026-09-13; the operator also confirmed normal Xfinity app playback during testing.
Account sign-in, encrypted persistence, automatic renewal, and playback retries
are implemented with automated tests. Live account-mode validation is pending
completion of the operator's Xfinity sign-in; the earlier playback evidence below
uses phone-imported credentials and does not establish unattended reliability.

## Start

Use the repository's pinned Node and pnpm versions. From the repository root:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @smarthome/camera-viewer build
```

Copy `.env.example` to `.env.local` in this application directory. Set
`XFINITY_SIGNALING_HOSTS` to exact comma-separated signaling hosts independently
observed in your own Xfinity app traffic, of the form
`<numeric-room>.ssrouterprod.comcast.net`. Do not trust a host merely because a
log names it. `CAMERA_NAMES` optionally maps camera MAC identifiers to labels.
`ADB_PATH` selects an Android SDK executable if automatic discovery does not work.

For account mode on Windows, set `XFINITY_CLIENT_SECRET` in `.env.local` from the
production login configuration of your installed Xfinity app. The implementation
was traced against Android app 6.10.0-3, including its `partnerConfigSettings.json`,
OAuth exchange, and camera API models. This is an unofficial integration, not an
Xfinity-supported public API. No client or account credentials are checked in.
The local setup currently requires access to that client configuration; ADB is
not needed after setup.

Register the current user's callback once, after building (PowerShell, repo root):

```powershell
./security/apps/camera-viewer/register-login.ps1
```

Use `-Port` if changing `PORT`. The script refuses to overwrite another app's
handler. Xfinity accepts `xfinitydigitalhome://auth` for this client and rejects a
localhost redirect. The handler sends only the matching authorization callback
to the running local service; the server validates state, expiry, and PKCE.

```sh
corepack pnpm camera:start
```

Open [the local viewer](http://127.0.0.1:4318). The server binds to `127.0.0.1`.
It serves the player's generated `dist/web` directory and the atlas's production
`home-docs/apps/web/dist` directory at `/house/`.

For integrated viewing, run `corepack pnpm build` at the repository root to build
both apps, then `corepack pnpm security:start`. Open
[SmartHome](http://127.0.0.1:4318/house/) and select **Security → Live cameras**.
The embedded player uses the same steps below. Closing its panel stops playback.
See the [integration decision](../../../docs/decisions/0004-security-live-camera-integration.md).

1. Select **Sign in to Xfinity**, complete Xfinity's login/MFA, and allow the
   Windows callback prompt. If an embedded browser stalls, use a normal desktop
   browser. Return to the player; it loads the account's cameras.
2. Subsequent launches reuse `account.local`, encrypted with Windows DPAPI for
   the same Windows user. Keep the service running; no phone connection is needed.
3. Select a camera and **Connect**. This sends its viewing token to the configured
   Comcast signaling host and attempts an additional viewing session.
4. Verify increasing **Decoded frames**, nonzero resolution, and visible video.
   A connected signaling socket alone is not proof of playback.
5. Select **Stop** to close this viewing session and cancel automatic retries.

Audio starts muted; use the player controls to enable it. Account access is
checked every minute and renewed when within a minute of expiry. Renewal is
single-flight, saves rotated refresh credentials, and retries temporary errors
after a delay. New camera connections request new viewing tokens. An open player
retries interrupted signaling or 30 seconds without new video, with delays from
2 to 30 seconds. Stop, closing the panel, or leaving the page cancels playback.

An Xfinity-revoked/expired refresh session requires another interactive sign-in;
the service cannot promise perpetual access. Account credentials stay server-side
in Windows-encrypted `account.local`; viewing credentials stay in memory. The
client credential stays in ignored `.env.local`. No password, raw ADB log, or
footage is stored. Run as the same Windows user after a restart; another user or
machine cannot decrypt this store. There is no automatic OS-startup installation.

For phone-assisted diagnostics, expand **Setup and troubleshooting**, connect
one authorized ADB phone, open its Xfinity camera list, then **Import from phone**.
Those temporary credentials cannot renew and are discarded on server exit.

## Boundaries and troubleshooting

- This is a laptop-local prototype, not an authenticated LAN/internet service.
  Do not publish it through a tunnel or change its bind address. Local processes
  and people who can use the computer remain trusted.
- If ADB disconnects, reopen Wireless debugging or reconnect a USB cable. Exactly
  one authorized device must be available.
- JWT claims are decoded for identity and expiry, not cryptographically verified
  locally. Comcast validates tokens when a viewing session joins.
- A VPN, routing issue, or old-camera SDP incompatibility can prevent media even
  when signaling connects. Failures are displayed, not replaced by mock footage.
- The atlas inventory and example history remain recorded data; its Live cameras
  panel uses this player when hosted by the local security service.
- The [security decision](../../../docs/decisions/0003-local-camera-prototype.md)
  records the original prototype; [account renewal](../../../docs/decisions/0005-renewable-camera-account.md)
  extends its credential, exposure, and validation boundaries.

To roll back account mode, stop the service, remove `XFINITY_CLIENT_SECRET` from
the local environment, and remove the encrypted `account.local` and any
`account.local.pending.local` file. Run `register-login.ps1 -Remove` with the same
port to remove only this callback registration. This removes local access; it
does not revoke Xfinity-issued credentials at the provider or log out the phone.

## Verify

From the root run `corepack pnpm format:check`, `corepack pnpm check`, and
`corepack pnpm test:e2e`. Unit tests cover import validation, credential omission,
destination restrictions, local-origin checks, signaling framing, PKCE callbacks,
refresh rotation/concurrency, persistence failures, and restart recovery. Browser
tests cover setup/import UI and cancelable reconnects on desktop and mobile Chromium using synthetic data.
They do not send real tokens or establish live-camera playback.

Live verification must separately record camera name, increasing decoded-frame
count, resolution, duration, and whether Xfinity still displays the camera. Keep
footage and credentials out of test artifacts and commits.

### Live validation — 2026-09-13

The local viewer displayed actual camera images in the Codex in-app browser on
Windows. The browser reported connected media and increasing decoded-frame counts:

| Camera        | Resolution | Observed decoded frames |
| ------------- | ---------- | ----------------------- |
| KumarBell     | 1280 × 960 | 309 → 710               |
| kumarDriveway | 1280 × 720 | 204 → 535               |
| kumarPond     | 1280 × 720 | 206 → 267               |

These were brief sequential playback checks; exact durations were not timed.
Stopping and switching cameras succeeded. The operator confirmed the Xfinity app
still played the cameras normally while the desktop tests ran. No camera reset,
pairing change, account sign-out, or firmware change was performed.

This validates phone-assisted video playback and coexistence for this setup.
It does not establish unattended reliability, independent token renewal, audio,
or behavior after credential expiry. Subsequent atlas integration is described
in the [integration decision](../../../docs/decisions/0004-security-live-camera-integration.md).
