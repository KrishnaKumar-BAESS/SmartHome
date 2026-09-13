# Known limitations

These are current implementation constraints, not promised roadmap dates.
Use them when assessing a change or deciding what the application can support.

The table describes the home atlas. The separate [camera prototype](../security/apps/camera-viewer/README.md)
has its own phone dependency, credential handling, and live-validation requirements.

| Area             | Current boundary                                                                                                                                                           | What addressing it requires                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Live device data | Inventory/status fields are recorded; no polling, streaming, or device API exists                                                                                          | Deliberate integration design with authentication, failure states, and provenance                   |
| Cameras          | Feed graphics and deterministic event history are demonstrations; labels such as LIVE and Today are inherited UI                                                           | Accurate demonstration labeling in a future UI change, or a separately verified live integration    |
| Climate          | All current sensor records are planned; no measured readings are ingested                                                                                                  | Real sensor source, freshness semantics, units, and unavailable-state handling                      |
| Editing          | No UI persistence, workbook import, or database                                                                                                                            | Reviewed authoring/storage design; current updates go through source and Git                        |
| Type safety      | Existing JSX is admitted with `checkJs: false`; the view object is not fully typed                                                                                         | Incremental typed contracts and conversion with behavior verification                               |
| Data integrity   | Migration parity preserves the historical baseline; explicit relationship checks cover a subset                                                                            | Reviewed fixtures for intentional updates and additional relevant integrity checks                  |
| Data structure   | Some sound, overview, room mappings, and presentation content remain in the controller                                                                                     | Focused extraction with equivalence evidence when those areas change                                |
| Geometry         | Model units and camera coverage are illustrative; the renderer preserves prototype projection math                                                                         | Verified measurements and a documented coordinate/unit contract before asserting physical precision |
| Accessibility    | Some native controls and Enter/Space activation exist; the model itself is pointer-only and text/contrast gaps are logged in the [UI audit](../home-docs/docs/ui-audit.md) | Remediation of the logged findings, then screen-reader and real-device verification                 |
| Browsers         | Automated projects use Chromium, including mobile emulation                                                                                                                | Real-device and Firefox/WebKit verification before claiming broader support                         |
| Performance      | No performance budget, load benchmark, or bundle-size gate is configured; every state change re-derives the full view (see [UI audit](../home-docs/docs/ui-audit.md))      | A measured target and repeatable representative workload                                            |
| Hosting          | No provider configuration, access gateway, or deployment workflow is checked in                                                                                            | Operator-owned hosting and verified private asset access                                            |
| Integration      | KumarSec, FamSecDash, and automation platforms are not connected                                                                                                           | Scoped migration/integration decision and operational documentation                                 |

## Consequences for day-to-day use

The [follow-up UI audit](../home-docs/docs/ui-audit-follow-up.md) records additional
workflow and presentation limits: repeated keyboard searches can stop showing
results; filters can leave an excluded record selected; collapsed panels retain
keyboard stops; and camera overlays do not contain background shortcuts.
Room-level upkeep markers can conceal a more urgent record, and the Side Gate
camera's floor and room mappings disagree. Treat displayed locations, power
references, and maintenance totals as recorded information requiring the
qualifications in that audit, not verified installation instructions.

Reloading resets selections and model state. Camera status is not a device-health
check. Upkeep status is recorded data, not an automatically advancing maintenance
schedule. Placeholder hardware descriptions in the inventory are unverified
source content and should not be replaced with guesses.

Use [the user guide](../home-docs/docs/user-guide.md) for available interactions,
[testing](testing.md) for the exact automated evidence, and
[the data model guide](../home-docs/docs/data-model.md) for safe source updates.
