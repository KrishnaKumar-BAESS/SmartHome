# Changelog

All notable changes to SmartHome are documented here.
The structure follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/). See the
[changelog update protocol](AGENTS.md#changelog-update-protocol) for contributor rules.

Work below is unreleased. Historical scaffold/prototype entries record earlier
states and are not descriptions of the current application layout.

## [Unreleased]

### Added

- Add home-docs keyboard shortcuts (`/` search, `1`–`8` views, `+`/`-` zoom, `0` reset, Escape closes overlays), arrow-key navigation in search results, and a hover highlight on clickable rooms in the model.
- Add pnpm workspace commands, a pinned toolchain and lockfile, ESLint, Prettier, Vitest, and Playwright.
- Add CI checks and dependency update configuration.
- Add inventory migration parity and reference-integrity tests plus desktop/mobile browser checks.
- Add user, data-model, testing, deployment, privacy, and documentation-maintenance guides with a central documentation index and contributor workflow.
- Establish the subsystem-first repository scaffold, contributor/agent guides, architecture documentation, glossary, and initial architecture decision.
- Reserve `security/` and `platforms/` for deliberate future integrations.
- Introduce the original home-documentation prototype with an interactive model and eight documentation modes; its former `home-docs/app/` sources are now preserved under `docs/archive/home-documentation/`.

### Changed

- Refresh the home-docs shell with floating glass chrome (top bar, nav rail and panels), a mode-tinted backdrop, an accent-glow active view, and a grounded shadow under the house model.
- Modernize home-docs with native React 19 components, Vite 8, typed inventory, and locally bundled fonts.
- Organize home-docs into `apps/web/` and `reference/`; archive the original DC app intact outside production assets.
- Reconcile repository guidance with the active implementation, clarify recorded/demo data and test limits, and document the evolution from scaffold to shared workspace tooling.
- Restore the canonical changelog protocol and distinguish historical plans from current contributor instructions.

### Fixed

- Keep home-docs floor labels legible: clamp them clear of the list panel and halo them against room faces.
- Clear and dismiss the home-docs search field with the Escape key.
- Give home-docs speaker-layout markers unique React keys, silencing console errors in Sound views.
- Keep home-docs model controls and floor isolation inside mobile viewports.
- Exclude generated `.delta/` worktrees from formatting so nested historical sources remain untouched.
