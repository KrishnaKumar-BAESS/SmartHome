# SmartHome contributor and agent guide

SmartHome organizes independent home subsystems. Read [docs/conventions.md](docs/conventions.md)
before editing. Current architecture: [docs/architecture.md](docs/architecture.md).
Human contribution workflow: [CONTRIBUTING.md](CONTRIBUTING.md).
Documentation navigation: [docs/README.md](docs/README.md).

## Active code

- `home-docs/apps/web/`: React 19 / Vite 8 application.
- `home-docs/apps/web/src/data/house.ts`: inventory and floor geometry.
- `home-docs/apps/web/src/features/house/`: native React views, controller, renderer.
- `security/apps/camera-viewer/`: phone-assisted local Xfinity playback prototype.
- `platforms/`: reserved; no integration exists yet.
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

## Documentation changes

Follow [docs/documentation.md](docs/documentation.md). Check claims against source
and configuration, update inbound links after path/heading changes, and distinguish
implemented behavior from recorded data, demonstrations, and historical plans.
Documentation-only changes still run all required gates. Preserve archived sources
and workbook contents; do not rewrite them for consistency with newer guidance.

## Changelog update protocol

Use the single root [CHANGELOG.md](CHANGELOG.md), following its existing
Keep a Changelog structure.

- Add notable user-facing, structural, tooling, or convention changes under
  `[Unreleased]`, grouped by `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`,
  or `Security` as applicable.
- Write concise entries describing the outcome and name the affected subsystem
  when useful. Routine typo corrections do not need an entry.
- Keep historical entries recognizable. Clarify obsolete paths as historical
  rather than describing them as active application locations.
- Do not assign a release version or date, create release tags, or move unreleased
  work into a release unless explicitly requested.

## Branch and review discipline

Inspect the current branch and working tree before changing files. Preserve
unrelated work and stage explicit paths. Automated branches default to `codex/`.
For a requested version bump or release whose implementation already exists in
`dev`, confirm branch topology and target `main`, not `dev`.

Keep PR descriptions focused on the resulting change and actual verification.
Never add assistant attribution to commits or PRs. See
[CONTRIBUTING.md](CONTRIBUTING.md) for review expectations.
