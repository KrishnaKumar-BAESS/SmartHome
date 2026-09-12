# Development

Use the Node version in `.node-version` and the pnpm version in `package.json`.
Install with `pnpm install --frozen-lockfile`. Run `pnpm dev` at the root.

## Quality gates

Before committing, run `pnpm format:check`, `pnpm check`, and
`pnpm test:e2e`. Install Chromium once with
`pnpm exec playwright install chromium`. CI installs browser system dependencies
on Linux and runs the same checks against the production build.

Unit tests compare every migrated inventory field and coordinate against the
archived source, validate references, and check CSS conversion. Browser tests cover
all eight modes, search, keyboard navigation, camera demonstrations, model zoom,
desktop/mobile layouts, and freedom from external runtime requests.

## Editing the house

Edit `home-docs/apps/web/src/data/house.ts` for inventory and coordinates. The
migration parity test intentionally records the original baseline: when making a
future intentional inventory change, replace exact legacy parity with an updated
reviewed fixture while retaining reference-integrity tests. Do not edit the archive
to make a test pass.

View components live under `src/features/house`. The controller's `renderVals`
method derives view data and the SVG renderer preserves original projection math.
These JavaScript modules remain explicit migration debt; new modules use TypeScript.
The TypeScript configuration permits JSX but does not claim full static checking of
the preserved controller and renderer.

## Dependency updates

Use pnpm only and commit `pnpm-lock.yaml`. Versions are pinned. Verify peer
compatibility before major upgrades; TypeScript 6 is intentional because the
selected typescript-eslint release supports versions below 6.1. No global tool
installation is required beyond Node and pnpm.

## Rollback

The pre-migration files are unchanged under `docs/archive/home-documentation`.
To inspect that historical app, serve only that directory over HTTP; its CDN runtime
still requires network access. Git history retains the original paths. The workbook
has been moved without modifying its contents.
