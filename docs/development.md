# Development

Run commands in this guide from the repository root. The active workspace package
is `@smarthome/home-docs` at `home-docs/apps/web/`.

## Toolchain and installation

The development and CI baseline is Node.js **22.23.2** from
[.node-version](../.node-version) and pnpm **12.4.1** from
[package.json](../package.json). The package's Node engine range is broader than
this baseline; use the pinned version when reproducing failures.
[.npmrc](../.npmrc) enforces engine compatibility.

With Node and Corepack available:

```sh
corepack enable
corepack install
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
```

Expect `v22.23.2` and `12.4.1` from the version checks. If enabling Corepack
shims requires privileges, use `corepack pnpm` in place of `pnpm` for commands;
no global shim is needed. If the Node distribution does not include Corepack,
bootstrap pnpm with `npm install --global pnpm@12.4.1`, then use pnpm exclusively
for repository work. This bootstrap does not install project dependencies.

On Linux, browser setup may also require system packages:
`pnpm exec playwright install --with-deps chromium`. CI uses this form.

A fresh install needs access to the package registry and browser download host.
There is no required `.env`, database, container, device, or external service.
An optional `home-docs/apps/web/.env.local` with `VITE_SHOW_ADDRESS=true` shows
the street address in the atlas (copy `.env.example`).
Do not disable frozen-lockfile checks to work around an unexplained mismatch.

## Run and preview

```sh
pnpm dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).
The development server reloads source changes. It binds to loopback, and
`strictPort` makes an occupied port fail instead of silently choosing another.

To inspect the production bundle:

```sh
pnpm build
pnpm preview
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173).
Preview serves the existing `dist/`; it does not rebuild after edits.
Stop either foreground server with Ctrl+C. Stop a manual preview before browser
tests so they cannot accidentally reuse an older build.

## Command reference

| Root command        | Behavior                                                               |
| ------------------- | ---------------------------------------------------------------------- |
| `pnpm dev`          | Run the web package's Vite development server                          |
| `pnpm typecheck`    | Recursively run package TypeScript checks without emitting             |
| `pnpm lint`         | Recursively run ESLint with zero allowed warnings                      |
| `pnpm test`         | Recursively run Vitest once                                            |
| `pnpm build`        | Recursively build production packages                                  |
| `pnpm check`        | Run typecheck → lint → unit tests → build; stop on failure             |
| `pnpm test:e2e`     | Run the web package's Playwright suite against a built preview         |
| `pnpm preview`      | Serve the web production build locally                                 |
| `pnpm format:check` | Check all maintained files with Prettier                               |
| `pnpm format`       | Rewrite all maintained files with Prettier; review the resulting scope |

Use targeted formatting while working, for example
`pnpm exec prettier --write README.md docs/development.md`.
[.prettierignore](../.prettierignore) excludes generated output, the lockfile,
`docs/archive/`, and generated `.delta/` worktrees.

For a focused browser run:

```sh
pnpm build
pnpm --filter @smarthome/home-docs exec playwright test --project=desktop
```

A focused run helps diagnosis but does not replace the full
[pre-commit gates](testing.md#required-local-gates).

## Configuration map

| File                                                               | Responsibility                                                  |
| ------------------------------------------------------------------ | --------------------------------------------------------------- |
| [package.json](../package.json)                                    | Root commands, pnpm pin, engine range, development dependencies |
| [pnpm-workspace.yaml](../pnpm-workspace.yaml)                      | Package discovery, strict peers, minimum release age            |
| [pnpm-lock.yaml](../pnpm-lock.yaml)                                | Resolved dependency graph                                       |
| [eslint.config.mjs](../eslint.config.mjs)                          | JS/TS lint rules and React hook checks                          |
| [web/package.json](../home-docs/apps/web/package.json)             | Application dependencies and package scripts                    |
| [tsconfig.json](../home-docs/apps/web/tsconfig.json)               | Strict TS, permitted unchecked JS, compiler inputs              |
| [vite.config.ts](../home-docs/apps/web/vite.config.ts)             | React plugin, server ports, unit-test discovery                 |
| [playwright.config.ts](../home-docs/apps/web/playwright.config.ts) | Browser projects, preview lifecycle, retries, traces            |
| [CI workflow](../.github/workflows/ci.yml)                         | Linux verification and failure artifacts                        |

## Where to edit

Use [app internals](../home-docs/apps/web/README.md) for the source map.
Inventory and geometry live in `src/data/house.ts`; view derivation and some
display content remain in `house-controller.jsx`. Changing the source workbook
does not update the application.

For an intentional data change, follow the
[data model workflow](../home-docs/docs/data-model.md#intentional-inventory-changes).
For a geometry or interaction change, preserve projection behavior and verify
desktop and mobile layouts.

## Dependency maintenance

Use pnpm and commit `pnpm-lock.yaml` with manifest changes. Versions are exact;
[pnpm-workspace.yaml](../pnpm-workspace.yaml) enables strict peer checks and a
minimum release age of 1,440 minutes. Inspect registry metadata and peer ranges
before upgrades; the installed tree alone does not establish compatibility.

[Dependabot](../.github/dependabot.yml) checks npm dependencies weekly and
GitHub Actions monthly. React packages are grouped together; development tooling
has its own group. Update the documented toolchain when changing its pins.
Do not accept dependency changes without all normal gates passing.

## Troubleshooting

| Symptom                                    | Check and recovery                                                                                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Wrong Node/pnpm version or engine error    | Check versions and executable resolution (`Get-Command node,pnpm` in PowerShell or `command -v node pnpm` in a POSIX shell). Use the pinned manager through Corepack if a shim shadows it. |
| Frozen-lockfile failure                    | Inspect manifest and lockfile changes together; restore the intended pair or make a deliberate pnpm update. Do not discard the lockfile.                                                   |
| Peer or release-age rejection              | Check the declared compatibility and release metadata. Keep the guardrails; choose a compatible released version or wait for its eligibility.                                              |
| Port 5173 or 4173 in use                   | Stop the server you started on that port; do not kill unrelated processes. Both ports are strict.                                                                                          |
| Missing Chromium executable                | Run `pnpm exec playwright install chromium` using this checkout's Playwright version.                                                                                                      |
| Linux browser missing shared libraries     | Use the browser setup with `--with-deps` where system-package installation is permitted.                                                                                                   |
| Preview or tests show old behavior         | Rebuild, stop an existing preview, then rerun. Local Playwright may reuse a server on port 4173.                                                                                           |
| Inventory parity test fails                | Review the deliberate data change against the archive; use a reviewed new fixture when updating inventory. Never edit historical input to match new output.                                |
| Blank page or missing assets after hosting | Follow [deployment diagnosis](deployment.md#diagnosis-and-rollback); verify the served directory and base path.                                                                            |

Include the command, error, commit, toolchain, and OS when escalating an unresolved
failure. Keep browser traces and logs private as described in [testing](testing.md).
