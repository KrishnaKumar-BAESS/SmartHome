# Changelog

All notable changes to SmartHome are documented here.

Format: [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/).

**Update protocol for assistants:** see `AGENTS.md` → "Changelog update protocol".

---

## [Unreleased]

### Added

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
