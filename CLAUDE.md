# Claude Code guidance

Read [AGENTS.md](AGENTS.md) first. It contains the shared contributor rules and
[changelog update protocol](AGENTS.md#changelog-update-protocol).
This file adds only Claude Code-specific navigation.

## Project configuration

[.claude/README.md](.claude/README.md) describes checked-in and local configuration.
The shared settings currently disable commit/PR attribution. Machine-local
overrides are ignored and must not be committed.

## Skills and specifications

Read a skill or specification when the task explicitly references it. Dated
specifications live under `docs/superpowers/specs/`; their
[index](docs/superpowers/README.md) explains historical applicability.
A past scaffold plan does not override the active code or current contributor guide.

Use the root [development commands](docs/development.md) and
[verification gates](docs/testing.md), regardless of the coding assistant used.
