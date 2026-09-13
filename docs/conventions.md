# Conventions

These conventions apply to maintained files throughout SmartHome. Start with
[contributing](../CONTRIBUTING.md) for the complete workflow.

## Ownership and layout

Each subsystem owns its application, configuration, tests, and documentation.
Use `apps/`, `services/`, `infra/`, and `docs/` only when they contain real
content. The root owns shared repository tooling and cross-subsystem guidance.

Automation platforms live under `platforms/<platform-name>/`. Add a workspace
glob only when a package exists. Shared packages require demonstrated reuse;
cross-subsystem runtime coupling requires an architecture decision.

## Names and source files

- Directories, documentation, and new web modules use kebab-case.
- React components use PascalCase exports; ordinary functions use camelCase.
- New application modules use strict TypeScript (`.ts` or `.tsx`).
- Existing `.jsx` files are migration code, not a precedent for new unchecked modules.
- ADRs use `docs/decisions/NNNN-<slug>.md` with sequential, zero-padded numbers.
- Dated design specifications use `docs/superpowers/specs/YYYY-MM-DD-<slug>.md`.

Follow [EditorConfig](../.editorconfig), [Git attributes](../.gitattributes), and
[Prettier](../.prettierrc.json): UTF-8, LF line endings, a final newline, and
two-space indentation. Prettier owns formatting; avoid unrelated normalization.

## Application constraints

Preserve documented inventory, reference relationships, and floor geometry.
Do not present recorded or simulated states as verified device telemetry.
Do not introduce DC templates, CDN runtime scripts, `eval`, or browser template
compilation into the active application.

The TypeScript configuration permits existing JavaScript with `checkJs: false`.
Do not describe a passing typecheck as complete static verification of the JSX
controller or renderer. See [testing](testing.md).

## Dependencies and commands

Use the Node version in [.node-version](../.node-version) and pnpm version in
[package.json](../package.json). Use pnpm for dependencies, scripts, and the
single committed lockfile. Do not add npm or Yarn lockfiles.

Keep dependency versions exact. Review compatibility and the official registry
when investigating an unfamiliar version; do not revert a migration on suspicion.
See [dependency maintenance](development.md#dependency-maintenance).

## Secrets and reference material

The [.gitignore](../.gitignore) excludes `.env`, `.env.*`, and `*.local`,
with an exception for `.env.example`. When a subsystem requires environment
variables, commit a template with names, purpose, and harmless example values.
Document how that subsystem receives production secrets.

The home atlas needs no environment variables. The camera prototype documents
its local server configuration in its [README](../security/apps/camera-viewer/README.md).
Browser-bundled values are
readable by viewers and cannot store secrets. See [security and privacy](security.md).

Treat `docs/archive/` as immutable. Preserve the contents of
`home-docs/reference/house-inventory.xlsx`. Neither is a public asset or a
place to apply automatic formatting.

## Commits and changelog

Use conventional prefixes such as `feat:`, `fix:`, `docs:`, `refactor:`,
`test:`, and `chore:`; use a subsystem scope where helpful.
Keep subjects under 72 characters and commits atomic. Never add assistant
self-attribution to commits or PRs.

Before every commit, run the [required gates](testing.md#required-local-gates),
inspect `git diff --stat`, and review the diff. Record notable changes using the
[changelog protocol](../AGENTS.md#changelog-update-protocol). Do not create a
versioned release unless requested.

## Documentation

Write task-oriented instructions with expected results, evidence for behavioral
claims, and links to owning source files. Describe current behavior separately
from future work. Follow [documentation maintenance](documentation.md).
