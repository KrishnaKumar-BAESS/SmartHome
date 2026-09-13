# Glossary

Terms describe the current repository unless explicitly marked historical.
See [architecture](architecture.md) for how they fit together.

| Term                            | Meaning here                                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| SmartHome / umbrella repository | One repository grouping independently owned home subsystems, with shared pnpm commands and CI for workspace packages |
| Subsystem                       | A top-level system that owns its code, tests, configuration, and documentation; `home-docs/` is active               |
| Workspace package               | A package discovered by `pnpm-workspace.yaml`; currently the web app `@smarthome/home-docs`                          |
| Platform                        | Supporting automation infrastructure, reserved under `platforms/`; none is implemented                               |
| HOUSE.SYS / atlas               | The active interactive home-documentation application                                                                |
| Recorded status                 | A stored inventory value, without a freshness guarantee or live device check                                         |
| Camera demonstration            | Simulated feed graphics and generated event history; not a video stream or recorded event evidence                   |
| Planned sensor                  | A climate inventory record describing intended placement/measurement; not an ingested reading                        |
| Mode                            | One of Overview, Electrical, Lighting, Network, Sound, Security, Climate, or Upkeep                                  |
| Model / scene                   | SVG projection of recorded room geometry and system overlays                                                         |
| Isolation                       | Restricting the scene to a floor or selected rooms; independent of inventory-list filters                            |
| Stacked / Floors / Exploded     | Model separation choices, not different data sets or physical measurements                                           |
| Panel / circuit                 | A recorded breaker panel and its circuit records, connected through IDs                                              |
| Mesh node                       | A documented network device with network-membership and room information                                             |
| SSID                            | A recorded wireless network name; listing it does not configure or join the network                                  |
| PoE                             | Power over Ethernet; appears in recorded power descriptions                                                          |
| NVR                             | Network video recorder; referenced by camera descriptions but not connected to this app                              |
| RH                              | Relative humidity; part of the planned climate measurement target                                                    |
| ADR                             | Architecture decision record describing context, decision, alternatives, and consequences                            |
| DC prototype                    | Historical HTML/template application preserved under `docs/archive/`; not the active runtime                         |
| Migration parity                | Test comparison showing extracted inventory matches the historical prototype                                         |
| KumarSec                        | Separate security repository identified as a possible migration source; no code is imported here                     |
| FamSecDash                      | Separate repository; no runtime integration exists here                                                              |
| Production build / dist         | Vite output served to browsers; contains bundled inventory but excludes source reference folders                     |
| Preview                         | Local server for an existing production build; does not rebuild or define production hosting                         |

[Documentation index](README.md)
