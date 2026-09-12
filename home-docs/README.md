# Home documentation

The active application lives in [apps/web](apps/web/). It preserves the original
interactive house model, search, floor isolation, camera demonstrations, and eight
documentation modes in a native React app.

Run `pnpm dev` from the repository root. See the root [README](../README.md) for
installation, checks and the production preview.

| Location                       | Purpose                                                   |
| ------------------------------ | --------------------------------------------------------- |
| `apps/web/src/data/house.ts`   | House inventory and original floor geometry               |
| `apps/web/src/features/house/` | Native React view components, controller and SVG renderer |
| `apps/web/src/lib/`            | Typed styling and keyboard helpers                        |
| `apps/web/e2e/`                | Browser interaction tests                                 |
| `reference/`                   | Original source workbook                                  |

The documentation data remains local and read-only. Camera feeds are mockups;
no device integrations or backend were added by the tooling migration.
