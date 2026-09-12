# SmartHome contributor and agent guide

SmartHome organizes independent home subsystems. Read [docs/conventions.md](docs/conventions.md)
before editing. Current architecture: [docs/architecture.md](docs/architecture.md).

## Active code

- `home-docs/apps/web/`: React 19 / Vite 8 application.
- `home-docs/apps/web/src/data/house.ts`: inventory and floor geometry.
- `home-docs/apps/web/src/features/house/`: native React views, controller, renderer.
- `security/` and `platforms/`: reserved; no integration exists yet.
- `docs/archive/`: immutable historical reference, excluded from builds and formatting.
- `home-docs/reference/`: source workbook; preserve its contents.

## Working rules

1. Use the pinned Node and pnpm versions. Use pnpm only; commit the lockfile.
2. Keep code inside its subsystem. Add shared packages only for demonstrated reuse.
3. New modules use strict TypeScript. Existing JSX is preserved migration code; do
   not introduce DC templates, CDN scripts, eval, or browser compilation.
4. Preserve the house model and inventory. Do not label documented/mock device
   statuses as live telemetry. Never change historical sources to satisfy tests.
5. Run `pnpm format:check`, `pnpm check` and `pnpm test:e2e` before committing.
6. Inspect `git diff --stat` before every atomic conventional commit. Do not add
   assistant attribution. Avoid unrelated line-ending changes.
7. Record notable changes in root `CHANGELOG.md` under `[Unreleased]`; do not cut
   releases unless requested.
8. Secrets belong in ignored environment files. Serve production `dist/` only,
   never the repository root or reference material.

Run commands at the root. Browser setup: `pnpm exec playwright install chromium`.
See [docs/development.md](docs/development.md) for checks and rollback details.
