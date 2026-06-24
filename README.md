# SmartHome

`SmartHome` is the umbrella monorepo for all home automation and home documentation.
Each automation subsystem lives in its own top-level directory and is fully
self-contained. Shared meta (conventions, architecture notes, decisions) lives at
the root.

## Subsystem map

| Directory    | Status      | Description                                          |
|--------------|-------------|------------------------------------------------------|
| `security/`  | Placeholder | Polished home security system (KumarSec migration pending) |
| `home-docs/` | Placeholder | Home documentation system (design pending)           |
| `platforms/` | Reserved    | Future automation platforms (HA, Node-RED, Zigbee2MQTT, ESPHome, …) |

## Navigation

- **AI assistants:** read [`AGENTS.md`](AGENTS.md) first.
- **Architecture & adding subsystems:** [`docs/architecture.md`](docs/architecture.md)
- **Conventions & secrets handling:** [`docs/conventions.md`](docs/conventions.md)
- **Change history:** [`CHANGELOG.md`](CHANGELOG.md)
