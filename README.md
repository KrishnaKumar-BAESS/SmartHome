# SmartHome

SmartHome is a workspace for independent home documentation and automation
subsystems. Its active application, **HOUSE.SYS**, is an interactive house atlas:
explore floor geometry, find equipment, and inspect recorded electrical, lighting,
network, sound, security, climate, and upkeep information.

**Home atlas scope:** a static, read-only documentation app. Device statuses are
recorded data; camera feeds and event history are demonstrations. There is no live
telemetry, device control, backend authentication, or persistent editing.

A separate [local camera prototype](security/apps/camera-viewer/README.md) uses an
authorized Android phone for viewing credentials. It does not turn the atlas
demonstrations into live telemetry.

## Start locally

Install Node.js **22.23.2**, pinned in [.node-version](.node-version), and pnpm
**12.4.1**, pinned in [package.json](package.json). With Node and Corepack available:

```sh
corepack enable
corepack install
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). No environment file or backend
setup is needed. The app bundles React and fonts locally. Installing dependencies
and Chromium requires network access; rendering the built app requires no CDN.

If Corepack is unavailable or its shims cannot be enabled, see
[toolchain setup](docs/development.md#toolchain-and-installation).

## Find the right guide

| I want to…                                    | Start here                                                                         |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| Explore the atlas and its controls            | [User guide](home-docs/docs/user-guide.md)                                         |
| Set up, change, or troubleshoot the app       | [Development](docs/development.md)                                                 |
| Contribute a reviewable change                | [Contributing](CONTRIBUTING.md)                                                    |
| Understand subsystem boundaries and data flow | [Architecture](docs/architecture.md)                                               |
| Update inventory or floor geometry            | [Data model and editing](home-docs/docs/data-model.md)                             |
| Understand verification and its limits        | [Testing](docs/testing.md)                                                         |
| Host or roll back a production build          | [Deployment](docs/deployment.md)                                                   |
| Assess privacy and supported capabilities     | [Security and privacy](docs/security.md), [known limitations](docs/limitations.md) |
| Browse all documentation                      | [Documentation index](docs/README.md)                                              |

## Repository map

| Path                                                 | Responsibility                                     | Status                           |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------- |
| [home-docs/apps/web](home-docs/apps/web/README.md)   | React application, inventory, SVG model, and tests | Active                           |
| [home-docs/reference](home-docs/reference/README.md) | Preserved source workbook                          | Reference; no automatic import   |
| [security](security/README.md)                       | Local Xfinity camera playback prototype            | Phone-assisted playback verified |
| [platforms](platforms/README.md)                     | Reserved for automation platform configurations    | No implementation                |
| [docs](docs/README.md)                               | Shared guides and architecture decisions           | Maintained                       |
| [docs/archive](docs/archive/README.md)               | Original DC prototype and generated runtime        | Immutable historical reference   |

KumarSec and FamSecDash remain separate repositories. No runtime integration
with either exists in SmartHome.

## Everyday commands

Run commands at the repository root.

| Command             | Result                                                        |
| ------------------- | ------------------------------------------------------------- |
| `pnpm dev`          | Development server on `127.0.0.1:5173`                        |
| `pnpm format:check` | Check formatting of maintained files                          |
| `pnpm check`        | Typecheck, lint, unit tests, then production build            |
| `pnpm test:e2e`     | Desktop and mobile Chromium checks against the existing build |
| `pnpm preview`      | Local build preview on `127.0.0.1:4173`                       |

Before the first browser test, run `pnpm exec playwright install chromium`.
Before committing, run `pnpm format:check`, `pnpm check`, and `pnpm test:e2e`,
in that order. Browser tests do not build the app.

Production output is `home-docs/apps/web/dist/`. Serve only that directory;
it still contains bundled home inventory and needs an appropriate access boundary.
See the [deployment runbook](docs/deployment.md) before hosting.

[Change history](CHANGELOG.md) · [Conventions](docs/conventions.md) ·
[Agent instructions](AGENTS.md)
