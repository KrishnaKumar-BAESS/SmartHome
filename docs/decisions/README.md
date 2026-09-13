# Architecture decisions

ADRs record significant choices and their consequences. They explain why the
system took its current shape; [architecture](../architecture.md) describes the
implemented state.

| Decision                                                                 | Status                                          | Scope                                                                              |
| ------------------------------------------------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| [0001 — Monorepo of subsystems](0001-monorepo-of-subsystems.md)          | Accepted; tooling consequences extended by 0002 | Subsystem ownership and reserved integration boundaries                            |
| [0002 — Native React and pnpm workspace](0002-native-react-workspace.md) | Accepted                                        | Static native app, shared build/verification tooling, preserved migration baseline |

## Create or evolve a decision

[0003 — Local camera prototype](0003-local-camera-prototype.md) records the ADB
credential source, localhost boundary, and real-camera validation requirements.

Use the next unused sequential number and a short kebab-case filename. Include:

- **Date and status:** proposed, accepted, superseded, or deprecated as appropriate.
- **Context:** the concrete problem and constraints.
- **Decision:** what is chosen and the boundary of that choice.
- **Alternatives:** meaningful options and why they were not selected.
- **Consequences:** benefits, costs, operational obligations, and remaining work.
- **References:** related decisions and the affected implementation/guides.

Use a new ADR for a significant replacement or extension and link both records.
Keep the original decision recognizable; add an explicit evolution/status note
when later work changes its consequences.

An ADR is warranted for subsystem ownership, runtime integration, new persistence
or authentication, or similarly lasting commitments. Routine implementation
details belong in code and contributor guides.
