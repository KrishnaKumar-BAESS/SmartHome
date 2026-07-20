# Changelog

All notable changes to SmartHome are documented here.

Format: [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/).

**Update protocol for assistants:** see `AGENTS.md` → "Changelog update protocol".

---

## [Unreleased]

### Added

- `home-docs/app/` — interactive Smart Home Documentation System; isometric 3D
  house model (pan/zoom/rotate/explode) with 8 views: Overview, Electrical,
  Lighting, Network, Sound, Security, Climate, Upkeep; covers 21 rooms across
  3 floors, 13+ circuits on 2 panels, 18 bulbs, 6 mesh nodes, 8 cameras; runs
  in-browser via the DC runtime with no build step (`home-documentation.dc.html`
  + `support.js`)
- Scaffolded umbrella repo structure: root docs, `.claude/`, `security/`,
  `home-docs/`, `platforms/`, `scripts/`
- `AGENTS.md` — canonical, tool-agnostic AI assistant guide including changelog
  update protocol
- `CLAUDE.md` — Claude Code-specific supplement; references `AGENTS.md`
- `docs/architecture.md` — umbrella overview and guide for adding new subsystems
- `docs/conventions.md` — naming, secrets handling, and commit conventions
- `docs/glossary.md` — definitions for key terms used across the repo
- `docs/decisions/0001-monorepo-of-subsystems.md` — ADR capturing the
  subsystem-first layout decision
- Added `security/` placeholder reserving the slot for the polished KumarSec stack
- Added `home-docs/` placeholder reserving the slot for the home documentation system
- Added `platforms/` placeholder for future automation platforms
