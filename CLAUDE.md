# CLAUDE.md — Claude Code Specifics

Read [`AGENTS.md`](AGENTS.md) first — it is the source of truth for conventions,
subsystem layout, and the changelog update protocol. This file only adds details
specific to Claude Code; it does not duplicate anything in `AGENTS.md`.

## `.claude/` layout

| File                       | Purpose                                      |
|----------------------------|----------------------------------------------|
| `settings.json`            | Checked-in project settings (shared)         |
| `settings.local.json`      | Machine-local overrides — **gitignored**, never commit |
| `README.md`                | Explains this folder                         |

## Superpowers / skills

This repo uses Claude Code superpowers (skills and specs). Specs live in
`docs/superpowers/specs/` and are named `YYYY-MM-DD-<slug>.md`. When a skill
or spec is referenced in a task, read it before starting work.

## Changelog

The changelog protocol is documented in `AGENTS.md` under "Changelog update
protocol". Follow it for any notable change made while working in this repo.
