# Architecture — SmartHome Umbrella Repo

## What this repo is

`SmartHome` is a **monorepo of subsystems**. Each home automation system (or the
home documentation system) lives in its own top-level directory and is completely
self-contained. There is no shared application runtime — the umbrella is an
organisational boundary, not a build system.

Shared meta — conventions, glossary, architecture notes, decision records — lives
at the root under `docs/`.

## Subsystem boundary model

A subsystem:

- Has a single top-level directory (e.g. `security/`, `home-docs/`).
- Owns all of its code, configuration, infrastructure definitions, and internal
  documentation inside that directory.
- Does **not** share libraries, databases, or runtime services with other
  subsystems. If sharing becomes necessary, it warrants an ADR.
- Has its own tooling choices (language, framework, package manager) independent
  of other subsystems.

Automation **platforms** (Home Assistant, Node-RED, Zigbee2MQTT, ESPHome, …) are
a special category: they each get a subdirectory under `platforms/` rather than a
top-level directory, because they are infrastructure rather than distinct products.

## How to add a new subsystem

1. **Create the top-level directory** (or `platforms/<name>/` for a platform).
2. **Give it a `README.md`** describing its purpose, status, and key entry points.
3. **Add internal structure as needed** — `apps/`, `services/`, `infra/`, `docs/`
   — following the conventions in [`docs/conventions.md`](conventions.md).
4. **Register it** in the subsystem map table in the root [`README.md`](../README.md)
   and in [`AGENTS.md`](../AGENTS.md).
5. **Add a changelog entry** under `[Unreleased]` in [`CHANGELOG.md`](../CHANGELOG.md)
   following the protocol in `AGENTS.md`.

## Current subsystems

| Directory    | Type       | Status      |
|--------------|------------|-------------|
| `security/`  | Subsystem  | Placeholder |
| `home-docs/` | Subsystem  | Placeholder |
| `platforms/` | Platforms  | Reserved    |
