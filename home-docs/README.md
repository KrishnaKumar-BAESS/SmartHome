# Home documentation

**Status: active.** HOUSE.SYS is a native React house atlas with eight
documentation modes, a projected SVG model, inventory search, floor/room
isolation, and camera demonstrations.

The data is local and read-only. Status values describe recorded inventory;
camera feeds/history are simulated and climate sensors are planned.
No device integration or editing backend exists.

## Use or develop

- [User guide](docs/user-guide.md): modes, search, model controls, and mobile use.
- [Quick start](../README.md#start-locally): install and run from the repository root.
- [Development](../docs/development.md): commands, configuration, and troubleshooting.
- [Web app reference](apps/web/README.md): source map and implementation constraints.
- [Data model](docs/data-model.md): collection relationships and reviewed updates.
- [UI audit](docs/ui-audit.md): logged speed, accessibility, usability, layout, and polish gaps.
- [Deployment](../docs/deployment.md): build-only hosting and rollback.
- [Source references](reference/README.md): original workbook provenance.

## Subsystem layout

| Location                       | Responsibility                                   |
| ------------------------------ | ------------------------------------------------ |
| `apps/web/src/data/house.ts`   | Recorded inventory and original floor geometry   |
| `apps/web/src/features/house/` | Native React views, controller, and SVG renderer |
| `apps/web/src/lib/`            | Typed CSS and keyboard compatibility helpers     |
| `apps/web/src/styles.css`      | Shared application styles                        |
| `apps/web/e2e/`                | Browser interaction tests                        |
| `docs/`                        | User and data-maintenance guides                 |
| `reference/`                   | Preserved workbook, not automatically imported   |

The original DC app lives in [the immutable archive](../docs/archive/README.md).
It remains a migration-test baseline and is excluded from production.
