# SmartHome

Home documentation and automation, organized as independent subsystems. The active
application is an interactive house atlas with eight views: overview, electrical,
lighting, network, sound, security, climate, and upkeep.

## Get started

Use Node.js 22.23.2 (see `.node-version`) and pnpm 12.4.1.

```sh
npm install --global pnpm@12.4.1
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:5173](http://localhost:5173). React, application code, and fonts are
bundled locally; the app does not require a CDN or a backend to render.

## Repository map

| Path                                        | Responsibility                                              | Status                           |
| ------------------------------------------- | ----------------------------------------------------------- | -------------------------------- |
| [home-docs/apps/web](home-docs/apps/web/)   | React application, inventory, model, tests                  | Active                           |
| [home-docs/reference](home-docs/reference/) | Original source workbook                                    | Reference material               |
| [security](security/)                       | Future KumarSec migration                                   | Reserved; no runtime integration |
| [platforms](platforms/)                     | Future automation platform configurations                   | Reserved                         |
| [docs](docs/)                               | Architecture, decisions, development and historical sources | Shared documentation             |

## Commands

Run these from the repository root:

| Command         | Purpose                                                    |
| --------------- | ---------------------------------------------------------- |
| `pnpm dev`      | Vite development server with hot reload                    |
| `pnpm check`    | Typecheck, lint, unit tests, production build              |
| `pnpm test:e2e` | Desktop/mobile Chromium tests against the production build |
| `pnpm preview`  | Serve the production build on localhost:4173               |
| `pnpm format`   | Format maintained sources and documentation                |

Before the first browser test, run `pnpm exec playwright install chromium`.
CI runs formatting, all checks, and browser tests on pull requests.

## Current boundaries

This is a documentation application. Inventory and device statuses are recorded
data, camera feeds/history are demonstrations, and climate sensors are planned.
There is no live telemetry, backend authentication, or persistent editing yet.
KumarSec and FamSecDash remain separate repositories.

The original DC prototype is retained under [docs/archive](docs/archive/) for
migration comparison and rollback, and is excluded from production output.

- [Development](docs/development.md)
- [Architecture](docs/architecture.md)
- [Modernization decision](docs/decisions/0002-native-react-workspace.md)
- [Contributing and conventions](docs/conventions.md)
- [Change history](CHANGELOG.md)
- [Agent instructions](AGENTS.md)
