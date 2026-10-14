# Deployment and rollback

The application produces a static site at `home-docs/apps/web/dist/`.
A built-site Node host is available for LAN deployment, with templates in
`home-docs/infra/`. The home server uses port 8090 and its existing Docker runtime.
No public tunnel or automated deployment pipeline is configured.

## Home server deployment

The household URL is `http://192.168.0.202:8090`. Homepage links to it under
Family & Everyday, with an explicit development label. The UI also displays a
persistent warning: features and recorded home data may be incomplete or inaccurate.

The service runs from `/home/denkrishna/homelab/apps/smarthome`, using a pinned
Node 22 container, `restart: unless-stopped`, resource limits, a read-only release
mount, and `/healthz` checks. It binds only `192.168.0.202:8090`; the request handler
accepts that Host and local/192.168.0.0/24 peers. Do not add a public tunnel to this
unauthenticated household app. This is network-level access, not per-user login.

To update after building and checking a chosen commit:

1. Copy `home-docs/apps/web/dist/` to `releases/<commit>/web/` and
   `home-docs/apps/web/build/server/` to `releases/<commit>/server/` under the
   service directory. Add `package.json` containing `{"type":"module"}` to that
   release root. Retain the previous release for rollback.
2. On initial setup, copy `home-docs/infra/compose.yaml.example` to `compose.yaml`
   and `service.env.example` to `service.env.local`; keep the example copies next
   to their local counterparts. Restrict the local environment file to its owner.
   The optional Pi-hole password stays here and never goes in a release or Git.
3. Atomically point `current` at the complete release and run
   `docker compose up -d --force-recreate` from the service directory.
4. Verify `/healthz`, the development warning, all modes, and `/api/pihole/stats`.
   Verify `/.env.local`, `/AGENTS.md`, and `/server/index.js` return 404.

The Node host serves only the built entry page and assets, plus a fixed read-only
Pi-hole stats endpoint. Native camera playback is not hosted by this service.
Pi-hole setup/error states remain explicit until the app password is configured;
set it in `service.env.local` and recreate the container. The native Pi-hole
shortcut remains available. This host uses the same summary client as development.

Rollback by pointing `current` at the previous complete release and recreating
only `smarthome`. To remove the deployment, run `docker compose down` here and
remove its Homepage tile; leave unrelated services running.

## Hosting contract

| Concern          | Requirement                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| Document root    | Serve only `home-docs/apps/web/dist/`                                                                         |
| Data exposure    | The JS bundle includes recorded home inventory and geometry; review who can retrieve it                       |
| Access           | The app has no login; apply access restrictions at the host or gateway for private use                        |
| URL layout       | Current Vite defaults assume hosting at `/`; a subpath requires an explicit base-path change and verification |
| Routing          | One page, in-memory mode changes; no client history-route fallback needed                                     |
| Runtime services | Optional built Node host provides the Pi-hole summary; static-only hosting remains available                  |
| Assets           | Serve HTML, JS, CSS, and fonts with their appropriate content types                                           |
| Updates          | Publish a complete build together; avoid mixing old HTML with new assets                                      |

Vite preview is a local acceptance tool, not the production hosting configuration.
Never expose the repository root, `home-docs/reference/`, or `docs/archive/`.
Excluding those folders does not remove inventory from the production bundle.

## Prepare a build

1. Select and record the exact commit to deploy. Use the
   [pinned toolchain](development.md#toolchain-and-installation).
2. Install the frozen dependency graph and browser, then run all gates:

   ```sh
   pnpm install --frozen-lockfile
   pnpm exec playwright install chromium
   pnpm format:check
   pnpm check
   pnpm test:e2e
   git rev-parse HEAD
   ```

3. Inspect `home-docs/apps/web/dist/`. Expect `index.html` and generated assets;
   do not copy source workbooks, repository metadata, or archived prototypes into it.
4. Keep a copy of the complete previously accepted deployment for rollback.
   Associate each artifact with its source commit and verification result.

Dependency and browser installation need network access. The build does not
query home devices or import the workbook.

## Accept the build locally

Run `pnpm preview` and open
[http://127.0.0.1:4173](http://127.0.0.1:4173). Check:

- The model and locally served fonts load without missing assets or console errors.
- All eight modes open; search selects a known item and displays its details.
- Floor isolation, zoom, and Stacked/Floors/Exploded options respond.
- Narrow screens can switch between panels and the model without horizontal overflow.
- Camera screens remain understood as demonstrations; no live-system claim is inferred.

Stop preview after acceptance. See [testing](testing.md) for automated coverage.

## Publish and verify

Copy the complete `dist/` contents to the chosen static host's document root.
Use the host's atomic deployment/version mechanism where available. Configure
HTML revalidation and asset caching coherently so an updated page can fetch the
matching generated assets. The repository does not supply a cache policy.

At the actual deployment URL, repeat the local acceptance checks and reload the
page. Confirm the configured access boundary protects both the page and direct
asset URLs. Confirm requests for repository sources and the workbook do not
return those files.

If deploying below a URL prefix, update Vite's `base` as an intentional code
change, rebuild, and test at that exact prefix. Do not assume that moving the
root build under a subdirectory will work.

## Diagnosis and rollback

| Symptom                                  | Likely boundary to inspect                                            |
| ---------------------------------------- | --------------------------------------------------------------------- |
| Blank page, JavaScript/CSS 404s          | Wrong document root, incorrect URL prefix, or mixed build assets      |
| Old UI after an update                   | Browser/host caches or old HTML referring to previous assets          |
| Works in preview but not on host         | Host path rewriting, content types, access rules, or security headers |
| Workbook/source files downloadable       | Host document root or upload contents exceed `dist/`                  |
| “Offline” camera or planned sensor shown | Recorded application data, not a hosting or device-health signal      |

For an application regression, restore the **entire previously accepted build**,
including matching HTML and assets, using the hosting provider's rollback
mechanism. Revalidate its access boundary and smoke checks. There is no runtime
database migration to undo.

If rebuilding an older commit is necessary, use a separate checkout with that
commit's toolchain and lockfile; preserve current work. Prefer the retained artifact
when available, because rebuilding may require external dependency downloads.

The DC prototype in [the archive](archive/README.md) is a historical comparison
baseline with an external runtime dependency. It is not a drop-in rollback for the
current production bundle and should not replace an accepted deployment.
