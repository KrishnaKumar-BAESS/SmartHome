# Local Xfinity camera prototype

This standalone application imports short-lived viewing sessions from the
signed-in Xfinity Android app over ADB. Its local server handles legacy Socket.IO
signaling; the browser negotiates WebRTC and displays received video. It provides
no camera-setting controls and requires no pairing changes.

**Status:** real-camera playback verified on three household cameras on
2026-09-13; the operator also confirmed normal Xfinity app playback during testing.
Independent account login and automatic token renewal are not implemented.
Fresh credentials require the phone.

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

```sh
corepack pnpm camera:start
```

Open [the local viewer](http://127.0.0.1:4318). The server binds to `127.0.0.1`
and serves only the generated `dist/web` directory.

1. Connect one authorized ADB phone and open the signed-in Xfinity camera list.
2. Select **Import from phone**. Only Xfinity's app-specific logs are read.
3. Select a camera and **Connect**. This sends its viewing token to the configured
   Comcast signaling host and attempts an additional viewing session.
4. Verify increasing **Decoded frames**, nonzero resolution, and visible video.
   A connected signaling socket alone is not proof of playback.
5. Select **Stop** to close the prototype session. The phone stays signed in.

Audio starts muted; use the player controls to enable it. When credentials expire,
return to the Xfinity camera list and import again. Stopping the server discards
imported credentials. The application writes no raw logs or tokens to disk.

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
- The home atlas remains a separate documentation app with recorded data.
- The [security decision](../../../docs/decisions/0003-local-camera-prototype.md)
  defines the credential, exposure, and validation boundaries.

## Verify

From the root run `corepack pnpm format:check`, `corepack pnpm check`, and
`corepack pnpm test:e2e`. Unit tests cover import validation, credential omission,
destination restrictions, local-origin checks, and signaling framing. Browser
tests cover setup/import UI on desktop and mobile Chromium using synthetic data.
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
or behavior after credential expiry. The home atlas remains separate.
