# Testing and verification

The repository checks formatting, TypeScript, lint rules, preservation of the
migrated data, and browser behavior. Passing gates provide evidence for these
specific checks; they do not prove device connectivity or full accessibility.

## Required local gates

After [setup](development.md#toolchain-and-installation), run from the root:

```sh
pnpm format:check
pnpm check
pnpm test:e2e
```

`pnpm check` runs typecheck, lint, unit tests, and build sequentially.
`pnpm test:e2e` then tests that production build; it does not create one.
Run all three before committing, including for documentation changes.

## What each gate checks

| Gate             | Configuration or source                                                                                                 | Evidence and limits                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Formatting       | [.prettierignore](../.prettierignore), [.prettierrc.json](../.prettierrc.json)                                          | Maintained-file formatting; excludes archived sources and generated output              |
| TypeScript       | [tsconfig.json](../home-docs/apps/web/tsconfig.json)                                                                    | Strict TS/TSX and configuration/test inputs; JSX allowed with `checkJs: false`          |
| ESLint           | [eslint.config.mjs](../eslint.config.mjs)                                                                               | JS/TS recommended rules, hook usage/dependencies, component export rules; zero warnings |
| Unit tests       | [house.test.ts](../home-docs/apps/web/src/data/house.test.ts), [css.test.ts](../home-docs/apps/web/src/lib/css.test.ts) | Two inventory tests and one CSS-helper test                                             |
| Production build | [vite.config.ts](../home-docs/apps/web/vite.config.ts)                                                                  | Bundle generation succeeds; output still needs runtime and hosting checks               |
| Browser tests    | [house.spec.ts](../home-docs/apps/web/e2e/house.spec.ts)                                                                | Five scenarios across two Chromium projects, ten cases total                            |

### Inventory preservation and integrity

The parity test reads the checked-in DC HTML archive, extracts its logic,
evaluates it in a Node VM with a one-second timeout, and compares every runtime
export from `house.ts` to its archived counterpart after JSON normalization.
It preserves the migration baseline; it does not establish that the original
inventory matches the physical house.

The integrity test checks unique IDs within ten collections; room references
for cameras, sensors, and upkeep; room polygons with at least three vertices and
finite coordinates; switch-to-circuit references; circuit-to-panel references;
and node-to-network references.

It does not comprehensively validate every relationship or field. For example,
server-to-node links, room-name lookup completeness, enum values, polygon
self-intersection, physical dimensions, and hardware accuracy are not covered.
Review them explicitly when changing data. See the
[data editing workflow](../home-docs/docs/data-model.md#intentional-inventory-changes).

The CSS test checks preservation of a font declaration, custom property, WebKit
prefix, and gradient. It does not validate arbitrary CSS syntax.

### Browser scenarios

Both projects exercise:

1. All eight modes, active navigation state, attached SVG geometry, no page errors
   or external requests during that navigation, and no horizontal page overflow.
2. Searching for Front Doorbell, switching to Security, clearing the query, and
   finding its displayed name.
3. Enter-key activation of Security, live-camera setup on a static host, and panel dismissal.
4. Model zoom changing a projected path; the mobile case first hides side panels.
5. Floor isolation reducing visible paths, restoring all floors, and switching
   to Stacked changing geometry.

The external-request assertion applies to the navigation scenario, not every
possible interaction. Camera-history review, exhaustive search/filters, pan and
rotation, screen-reader behavior, and full keyboard navigation are not exhaustively
covered.

## Browser matrix and lifecycle

[playwright.config.ts](../home-docs/apps/web/playwright.config.ts) defines:

- `desktop`: Desktop Chrome settings with a `1440 × 1000` viewport.
- `mobile`: iPhone 13 emulation using **Chromium**, not iOS Safari/WebKit.

Tests run in parallel. Local runs use no retries and a list reporter; CI allows
two retries, rejects focused tests, and uses the GitHub reporter. Traces are
retained on failure.

Playwright starts `pnpm preview` and waits for `http://127.0.0.1:4173`.
Locally it can reuse an existing server; CI requires a fresh one. Stop an old
manual preview before testing to avoid exercising stale output.

## Diagnose a failure

Reproduce with the pinned toolchain. Start with the first failed gate.
For a focused browser investigation after building:

```sh
pnpm --filter @smarthome/home-docs exec playwright test --project=desktop --grep "floor isolation" --workers=1
```

Inspect the reported files under `home-docs/apps/web/test-results/`. To open a
retained trace, substitute its actual path:

```sh
pnpm exec playwright show-trace "home-docs/apps/web/test-results/<case>/trace.zip"
```

A trace may contain screenshots, DOM snapshots, and home inventory. Keep it
private and remove sensitive details before sharing. Rerun the full suite after
fixing the failure.

## Continuous integration

[SmartHome checks](../.github/workflows/ci.yml) runs on pull requests and pushes
to `main`. It uses an Ubuntu runner, the pinned Node and pnpm versions, a frozen
install, formatting, `pnpm check`, browser installation with system dependencies,
and `pnpm test:e2e`.

Workflow permissions are `contents: read`; a newer run for the same ref cancels
the previous run. On failure, test results are uploaded as
`browser-test-results` with seven-day retention. There is no deployment step.

## Review beyond automation

For relevant changes, manually check narrow and desktop layouts, search result
selection, readable details, floor isolation, camera demonstrations, and keyboard
focus. Review private-data exposure before publishing screenshots or artifacts.

There is no configured coverage threshold, screenshot-baseline suite,
accessibility audit, Firefox/WebKit matrix, or Markdown link checker. Documentation
links and procedures require review as described in
[documentation maintenance](documentation.md#verification).
