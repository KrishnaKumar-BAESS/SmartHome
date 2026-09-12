# Architecture

SmartHome is a workspace of independent home subsystems. Root tooling provides
consistent commands and CI; it does not introduce shared databases or services.

## Active application

`home-docs/apps/web` is a React 19 application built with Vite 8. It uses native
React components and locally bundled fonts. Vite compiles modules at build time;
there is no DC runtime, browser template compiler, or CDN React dependency.

`src/data/house.ts` owns inventory and floor coordinates. The house controller
owns interaction state and derives view data. The SVG renderer projects the floor
model and system overlays. Separate components render navigation, search, inventory,
details, isolation, camera demonstrations, and view controls.

New code uses strict TypeScript. The preserved controller, geometry renderer and
converted views currently use native JSX; they are linted and covered by browser
tests, with incremental TypeScript conversion documented as remaining work.

## Boundaries

- `home-docs/`: active documentation app and source references.
- `security/`: reserved for a future deliberate KumarSec migration.
- `platforms/`: reserved for Home Assistant and other platform configurations.
- `docs/archive/`: historical source, not application code or public assets.

There is no cross-repository runtime integration. A new subsystem owns its code,
configuration and tests. Add a workspace glob only when a package exists. Do not
create empty packages, shared libraries or a task orchestrator ahead of need.

## Deployment

`pnpm build` writes a static site to `home-docs/apps/web/dist`. A static server
can host that directory. The application currently uses one URL and requires no
history fallback routing. Never serve the repository root, which includes private
home reference material and the historical prototype.
