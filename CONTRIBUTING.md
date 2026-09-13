# Contributing

A good change leaves the house documentation accurate, preserves reference
material, and includes enough evidence for another maintainer to review it.

Start with [development setup](docs/development.md),
[conventions](docs/conventions.md), and [architecture](docs/architecture.md).
Automated contributors also follow [AGENTS.md](AGENTS.md).

## Make the change

1. Inspect `git status --short` and the current branch before editing. Preserve
   unrelated local work. Use a focused branch; automated branches default to
   `codex/<description>`.
2. Identify the owning subsystem. The active web app is
   `home-docs/apps/web/`; `security/` and `platforms/` contain no integrations.
3. Read the relevant guide: [data model](home-docs/docs/data-model.md) for inventory,
   [app internals](home-docs/apps/web/README.md) for UI changes, or
   [deployment](docs/deployment.md) for hosting.
4. Make the smallest complete change. New modules use strict TypeScript; preserve
   existing JSX behavior during incremental migration. Add regression coverage for
   changed behavior.
5. Update the documentation in the same change. Follow the
   [documentation maintenance rules](docs/documentation.md) and record notable
   changes under `[Unreleased]` in [CHANGELOG.md](CHANGELOG.md).

Do not modify `docs/archive/` or the source workbook to make tests pass.
An intentional inventory update needs a reviewed baseline change; see the
[data editing workflow](home-docs/docs/data-model.md#intentional-inventory-changes).

## Verify before committing

From the repository root:

```sh
pnpm format:check
pnpm check
pnpm test:e2e
git diff --check
git diff --stat
git diff
```

Install Chromium once with `pnpm exec playwright install chromium`. If a gate
fails, resolve it and rerun the affected gate and any dependent gates before
committing. Documentation-only changes follow the same repository gates.

Review the stat for unrelated files and line-ending churn. Stage explicit paths
and create atomic conventional commits, with subjects under 72 characters.
Do not add assistant attribution or `Co-Authored-By` trailers.

## Prepare the review

Describe the problem, resulting behavior, relevant design decisions, and
verification performed. For UI changes, include desktop and narrow-layout
evidence after checking it for private home information. For inventory changes,
identify the approved source and every relationship affected.

Link a new [architecture decision](docs/decisions/README.md) when the change
introduces a subsystem integration, changes ownership, or creates a significant
operational obligation. Do not add speculative infrastructure or empty packages.

Check branch topology before choosing a PR base. For a requested version bump or
release that already has implementation commits in `dev`, target `main`.
Releases are intentional and require a request; normal changes stay under
`[Unreleased]`.

## Report a problem

Include the commit, toolchain versions, operating system, reproduction steps,
expected result, observed result, and the failing command or browser view.
State whether the problem occurs in development, production preview, or both.
Remove private inventory details and credentials from logs and screenshots.
For a sensitive report, follow [security and privacy guidance](docs/security.md#reporting-and-response).
