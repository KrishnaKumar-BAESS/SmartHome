# 0002 — Native React application and pnpm workspace

Date: 2026-09-12
Status: Accepted

## Context

The house app was a single DC HTML document with embedded inventory and logic.
A generated browser runtime interpreted the template and fetched React from a CDN.
There was no dependency lockfile, reproducible build, linting, or CI.

## Decision

Keep subsystem ownership. Place the house app in `home-docs/apps/web`, with
root pnpm commands and a single lockfile. Use React 19, Vite 8, TypeScript 6, ESLint,
Prettier, Vitest and Playwright. Preserve the existing view behavior and geometry;
convert the template to native JSX and extract inventory into TypeScript.

Vite matches the current static, browser-only application. A server framework,
database, shared-package layer and task orchestrator would add obligations without
an existing feature needing them. Do not import KumarSec or FamSecDash as part of
this migration.

## Consequences

The app builds without runtime CDNs or dynamic template evaluation. Changes have
repeatable gates and CI. The source archive and exact data comparison test provide
a rollback and preservation baseline. JSX controller/renderer conversion to strict
TypeScript remains an incremental follow-up; tooling modernization does not imply
device connectivity or persistence.
