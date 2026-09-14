# Known limitations

These are current implementation constraints, not promised roadmap dates.
Use them when assessing a change or deciding what the application can support.

The table describes the home atlas. The separate [camera prototype](../security/apps/camera-viewer/README.md)
supplies its Live cameras panel when served by the local security service, and
supports renewable Windows account credentials. Its live account validation
status and remaining authentication limits are documented in that service's guide.

| Area             | Current boundary                                                                                                                                                   | What addressing it requires                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Live device data | Inventory/status fields are recorded; only the local Security live-camera panel receives device video                                                              | Other telemetry needs deliberate integration, authentication, failure states, and provenance        |
| Cameras          | Feed graphics and deterministic event history are demonstrations; labels such as LIVE and Today are inherited UI                                                   | Accurate demonstration labeling in a future UI change, or a separately verified live integration    |
| Climate          | All current sensor records are planned; no measured readings are ingested                                                                                          | Real sensor source, freshness semantics, units, and unavailable-state handling                      |
| Editing          | No UI persistence, workbook import, or database                                                                                                                    | Reviewed authoring/storage design; current updates go through source and Git                        |
| Type safety      | Existing JSX is admitted with `checkJs: false`; the view object is not fully typed                                                                                 | Incremental typed contracts and conversion with behavior verification                               |
| Data integrity   | Migration parity preserves the historical baseline; explicit relationship checks cover a subset                                                                    | Reviewed fixtures for intentional updates and additional relevant integrity checks                  |
| Data structure   | Some sound, overview, room mappings, and presentation content remain in the controller                                                                             | Focused extraction with equivalence evidence when those areas change                                |
| Geometry         | Model units and camera coverage are illustrative; the renderer preserves prototype projection math                                                                 | Verified measurements and a documented coordinate/unit contract before asserting physical precision |
| Accessibility    | Keyboard operation of the model, named markers, listbox rows, combobox search, live announcements, and dialogs are implemented; screen-reader output is unverified | NVDA/VoiceOver, real touch/pen, Firefox/WebKit, and forced-colors verification on real devices      |
| Browsers         | Automated projects use Chromium, including mobile emulation                                                                                                        | Real-device and Firefox/WebKit verification before claiming broader support                         |
| Performance      | A gzip bundle budget gates `pnpm build`; panels are memoised apart from camera state; no frame-time benchmark exists                                               | A measured production frame budget on representative low-power hardware                             |
| Hosting          | No provider configuration, access gateway, or deployment workflow is checked in                                                                                    | Operator-owned hosting and verified private asset access                                            |
| Integration      | KumarSec, FamSecDash, and automation platforms are not connected                                                                                                   | Scoped migration/integration decision and operational documentation                                 |

## Consequences for day-to-day use

The [UI audit](../home-docs/docs/ui-audit.md) and its
[follow-up](../home-docs/docs/ui-audit-follow-up.md) are resolution logs: they
record how each finding is addressed and what remains unverified. Displayed
locations, power references, and maintenance totals are recorded information
with in-app qualifications (UNVERIFIED badges, mapping notices, snapshot dates),
not verified installation instructions; the Side Gate floor/room disagreement
and the unresolved MP·1 / MP·9 references stay in the data until corrected
through the data workflow.

The address bar carries the current mode, selection, isolation, and floor
separation, so links restore a view; other settings (theme, shortcuts, the
first-run hint) persist in `localStorage`. Camera status is not a device-health
check. Upkeep status is recorded data, not an automatically advancing maintenance
schedule. Placeholder hardware descriptions in the inventory are unverified
source content and should not be replaced with guesses.

Use [the user guide](../home-docs/docs/user-guide.md) for available interactions,
[testing](testing.md) for the exact automated evidence, and
[the data model guide](../home-docs/docs/data-model.md) for safe source updates.
