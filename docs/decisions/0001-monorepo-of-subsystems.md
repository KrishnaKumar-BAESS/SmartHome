# ADR-0001 — Monorepo of subsystems (subsystem-first layout)

- **Date:** 2026-06-24
- **Status:** Accepted

## Subsequent evolution

The subsystem ownership decision remains accepted.
[ADR-0002](0002-native-react-workspace.md) later introduced shared pnpm tooling,
root quality gates, and CI. The original consequences below describe the scaffold
at the time: tooling changes can now affect workspace packages even though their
runtime ownership remains independent. Home documentation is implemented;
`security/` and `platforms/` remain reserved.

See [current architecture](../architecture.md) for the implemented layout rather
than using this historical scaffold description as setup instructions.

## Context

`SmartHome` needs to hold multiple independent home automation systems over time
(security, Home Assistant, Node-RED, Zigbee2MQTT, ESPHome, home documentation,
…). Two candidate layouts were considered:

1. **Subsystem-first (Approach 1):** each automation system is a self-contained
   top-level directory. Shared meta lives at the root.
2. **Domain-first (Approach 2):** group by layer first (`apps/`, `services/`,
   `infra/`), with each subsystem nested inside.

The KumarSec security system (the first real subsystem) already has its own
established internal structure that should not be flattened.

## Decision

**Adopt Approach 1 — subsystem-first layout.**

Each subsystem gets its own top-level directory and owns all of its internals
(`apps/`, `services/`, `infra/`, `docs/` as needed). Automation platforms (Home
Assistant, Node-RED, Zigbee2MQTT, ESPHome) get subdirectories under a single
`platforms/` top-level directory because they are shared infrastructure rather
than standalone products.

**The KumarSec migration is placeholder-only for now.** A `security/README.md`
reserves the slot. The actual code migrates in a deliberate, separate step.

## Consequences

- Adding a new subsystem means creating a new top-level directory — the slot is
  always obvious.
- Each subsystem is fully isolated; changing tooling or structure inside one does
  not affect others.
- Cross-subsystem sharing is explicitly discouraged and would require a new ADR.
- The root stays clean: only `docs/`, placeholder subsystem dirs, and repo meta
  files live there.
