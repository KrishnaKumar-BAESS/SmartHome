# Maintaining documentation

Documentation is part of a change's acceptance criteria. Keep it accurate enough
that a new maintainer can follow a procedure without relying on conversation
history or undocumented local setup.

## Place each fact with its owner

| Location             | Owns                                                                         |
| -------------------- | ---------------------------------------------------------------------------- |
| Root README          | Purpose, current status, quick start, repository map, guide discovery        |
| CONTRIBUTING         | Contribution sequence and review expectations                                |
| AGENTS               | Additional execution rules for automated contributors and changelog protocol |
| `docs/`              | Shared architecture, development, testing, operations, and conventions       |
| Subsystem README     | Scope, status, entry points, and links into its own guides                   |
| Subsystem `docs/`    | User workflows and subsystem-specific data/operational guidance              |
| Application README   | Source map and implementation contracts                                      |
| ADRs                 | Significant decisions, context, alternatives, and consequences               |
| Dated specifications | The plan and assumptions at the time they were written                       |
| Archive/reference    | Preserved historical source, not maintained implementation guidance          |

The contributor changing a behavior owns its documentation update in that same
change. Reviewers check both. A separate docs team or approval board is not
required.

## Write for a task

Start with the purpose, audience, and prerequisites. Give commands from a stated
working directory, in execution order, with expected results. Explain failure
recovery where a procedure can leave the user uncertain.

Use concrete file links and exact command names. Prefer relative links to
repository files over machine-specific absolute paths in committed documentation.
Use descriptive link labels and stable headings. Introduce abbreviations in
context or link to the [glossary](glossary.md).

Use a table for genuinely comparable fields or choices and a diagram when it
clarifies boundaries or flow. A diagram needs nearby prose so the contract remains
understandable in viewers without Mermaid rendering.

## Make claims reviewable

Configuration and source establish implemented behavior. Link to them near
technical claims. Distinguish:

- **Implemented:** present in the current code or configuration.
- **Verified:** exercised by a named check, with its actual scope.
- **Recorded or simulated:** source content or demonstration behavior.
- **Proposed or historical:** a future option or a past plan.

Do not describe a placeholder as integrated, a passing TS check as coverage of
unchecked JSX, or mobile Chromium emulation as Safari verification. Avoid
unsupported claims of full test coverage, production readiness, or compliance.

Do not invent owners, escalation contacts, service-level promises, deployment
providers, credentials, or roadmap dates. State the missing boundary and the
concrete work required if it matters to the reader.

## Control duplication and history

Keep details in one owning guide and link to it. A quick-start summary can repeat
commands if they are verified against the full procedure. When a pin or command
changes, search for every occurrence and update each maintained reference.

Date inventories or measurements when useful; do not add freshness badges that
nobody maintains. Update the date and source together when rechecking the fact.

Preserve `docs/archive/` and the workbook. Keep old specifications recognizable
as historical; use their index to explain applicability. Evolve an ADR through
an explicit status/evolution note or a new linked decision, not by silently
rewriting what was originally decided.

## Update triggers

| Change                                      | Documentation to revisit                                                |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| Toolchain, scripts, or CI                   | Root quick start, development, testing, contributor/agent commands      |
| UI behavior or controls                     | User guide, app reference, relevant test coverage and limitations       |
| Inventory or geometry                       | Data guide, counts/relationships, test baseline, provenance             |
| Runtime integration or subsystem            | Architecture, subsystem README, root map, ADRs, security and operations |
| Hosting or access boundary                  | Deployment, security, limitations                                       |
| Filename, heading, or directory             | Inbound links, indexes, source maps                                     |
| Notable user-facing behavior or conventions | Changelog under `[Unreleased]`                                          |

## Verification

1. Follow the documented setup and commands using the pinned toolchain.
2. Resolve local file links and heading fragments, including links in tables.
   Check new documents are discoverable from an index or owning README.
3. Review examples against actual scripts, types, UI labels, and configuration.
4. Search maintained guidance for stale paths, unsupported claims, and unfinished
   placeholders. Historical paths are valid only when clearly labeled as history.
5. Run the [required repository gates](testing.md#required-local-gates).
   Prettier checks formatting; it does not check Markdown links or factual claims.
6. Inspect the diff and `git diff --stat` for accidental code, source-workbook,
   archive, or line-ending changes.

There is no Markdown link-checking CI job today. Local link review is a required
author/reviewer practice, not an implied automated guarantee.

## Review checklist

- Can a new reader find the guide and complete its procedure?
- Are the prerequisites, working directory, outputs, and recovery steps explicit?
- Do the implementation and verification claims match their linked evidence?
- Are current behavior, known limitations, and history clearly distinguished?
- Are private home details omitted from generic examples and public artifacts?
- Are duplicate references and the documentation index updated?
