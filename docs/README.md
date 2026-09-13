# Documentation

This index describes the current repository. Historical specifications explain
earlier decisions and are not setup instructions.

## Use and contribute

| Guide                                         | Audience and purpose                                        |
| --------------------------------------------- | ----------------------------------------------------------- |
| [Repository overview](../README.md)           | First-time orientation and quick start                      |
| [User guide](../home-docs/docs/user-guide.md) | Atlas modes, search, model controls, and demonstrations     |
| [Contributing](../CONTRIBUTING.md)            | Change workflow, review expectations, and commits           |
| [Development](development.md)                 | Toolchain, commands, configuration, and troubleshooting     |
| [Testing](testing.md)                         | Local/CI gates, coverage, failure evidence, and test gaps   |
| [Conventions](conventions.md)                 | Naming, ownership, TypeScript, secrets, and changelog rules |
| [Documentation maintenance](documentation.md) | Placement, evidence, linking, and review standards          |

## Understand and operate

| Guide                                                | Audience and purpose                                           |
| ---------------------------------------------------- | -------------------------------------------------------------- |
| [Architecture](architecture.md)                      | System boundaries, runtime flow, and extension points          |
| [Web app reference](../home-docs/apps/web/README.md) | Source map, controller, renderer, and migration constraints    |
| [Data model](../home-docs/docs/data-model.md)        | Inventory relationships, coordinates, and intentional updates  |
| [Deployment](deployment.md)                          | Build, private hosting, acceptance checks, and rollback        |
| [Security and privacy](security.md)                  | Trust boundaries, bundled data, credentials, and reporting     |
| [Known limitations](limitations.md)                  | Current gaps and criteria for addressing them                  |
| [UI audit](../home-docs/docs/ui-audit.md)            | Dated findings log for speed, accessibility, usability, polish |
| [Glossary](glossary.md)                              | Terms used by the repository and application                   |

## Subsystems and history

- [Home documentation](../home-docs/README.md): active application and its guides.
- [Security](../security/README.md): reserved integration boundary.
- [Platforms](../platforms/README.md): reserved platform configuration boundary.
- [Architecture decisions](decisions/README.md): accepted decisions and their evolution.
- [Changelog](../CHANGELOG.md): notable changes; unreleased work is not a release.
- [Source references](../home-docs/reference/README.md): original workbook provenance.
- [Historical prototype](archive/README.md): preserved source used by migration tests.
- [Historical scaffold specification](superpowers/README.md): context for the initial layout.
- [Repository scripts](../scripts/README.md): helper-script boundary; current commands live in package manifests.
- [Agent instructions](../AGENTS.md) and [Claude Code configuration](../.claude/README.md): contributor-tool guidance.

Configuration and source files establish implemented behavior. Maintained guides
explain it. If a historical plan disagrees with the current implementation, use
the current guide and record a correction rather than following the old plan.
