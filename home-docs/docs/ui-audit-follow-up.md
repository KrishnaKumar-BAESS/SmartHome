# UI audit follow-up — missed workflows and presentation defects

Audit date: 2026-09-12 (commit `f76ef30`). Remediation date: 2026-09-14 on
`main`. This document supplements the [original UI audit](ui-audit.md) with the
41 additional findings and 8 optional improvements it recorded, and now logs how
each is addressed in the current source. Source keys match the original
document (C controller, R renderer, T top bar, L list, D details, I isolation,
VC view controls, H camera review, CSS, LIB, CAT `catalog.ts`, E2E).

Inventory data in `house.ts` was not changed: record-accuracy findings are
surfaced in the interface (unverified badges, mapping notices, snapshot labels)
so corrections can follow the [data workflow](data-model.md#intentional-inventory-changes).

## Search and navigation

| ID   | Severity | Finding (abridged)                                                                      | Resolution                                                                                                                                                                                                                                                        |
| ---- | -------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N-01 | High     | A second keyboard search silently produced no results.                                  | Choosing a result blurs the input, moves focus to the chosen record's row, and resets popup state; `/` refocuses search and results reappear. E2E runs `garage` → Enter → `projector` → Enter.                                                                    |
| N-02 | Medium   | Initial ArrowUp skipped the last result.                                                | The unselected state is handled explicitly: ArrowDown → first, ArrowUp → last, then wrap; Home/End supported. E2E asserts it.                                                                                                                                     |
| N-03 | Medium   | Search omitted sound zones, SSIDs, amperage, watts/lumens/Kelvin, camera power/storage. | Index entries now cover sound zones, networks (name + SSID), amps, watts, lumens, Kelvin and warmth words, node models, camera resolution/power/storage/recording, upkeep parts and notes. Exact identifiers (`MP·20`, `MP20`, `MP-20`, SSIDs, names) rank first. |
| N-04 | Medium   | Panel and server hits lost their identity at the destination.                           | Panels select `selPanel` with a panel detail view and a highlighted list heading; servers select `selServer` with a highlighted, focusable row under the node; both are addressable in the URL (`panel:MP`, `server:s2`).                                         |
| N-05 | Medium   | Suggestions were not keyboard navigable.                                                | Suggestions and results share one listbox and one arrow/Enter/Home/End model.                                                                                                                                                                                     |
| N-06 | Medium   | Navigation could land in a hidden panel.                                                | Search, overview cards, attention links, and related-record links reveal the details panel (and the list on wide layouts); model selections with hidden details raise a toast with a "Show details" action.                                                       |
| N-07 | Medium   | Filters and selection disagreed silently.                                               | Details show a notice ("MP·20 is outside the Appliance filter", "outside the current filter", etc.) with a one-click reset for Electrical, Lighting, Security, and Upkeep. E2E asserts the electrical case.                                                       |
| N-08 | Medium   | Attention summaries did not route to the advertised work.                               | The fixture warning opens Lighting with the new "Needs attention" filter and the first flagged record; the replacements warning opens Upkeep filtered to Due, sorted overdue-first. Totals state their scope ("all rooms", "fixture records").                    |
| N-09 | Medium   | Selection had no programmatic state or announcement.                                    | Record rows are `role="option"` with `aria-selected`; a polite live region announces the selected record and its status; the model markers are named buttons.                                                                                                     |
| N-10 | Medium   | Detail scroll survived navigation.                                                      | `componentDidUpdate` resets the details scroll when the mode or selected record changes; clock ticks live in a leaf component and never touch it.                                                                                                                 |

## Focus, input, and model interaction

| ID   | Severity | Finding (abridged)                                            | Resolution                                                                                                                                                                                                                                                                  |
| ---- | -------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N-11 | High     | Collapsed panels kept invisible tab stops.                    | Collapsed asides carry `inert` and `visibility:hidden`; collapsing a panel that holds focus moves focus to its reveal control. E2E asserts the attribute.                                                                                                                   |
| N-12 | Medium   | Inactive isolation exposed an empty 0×0 button.               | Clear renders only while isolation is active; the panel also has a named close button.                                                                                                                                                                                      |
| N-13 | Medium   | Shortcuts leaked through camera overlays.                     | Global shortcuts are ignored while the review, live-camera, or help dialog is open; dialogs are modal (`showModal`) so the covered app is inert. E2E presses `1` inside the review and checks Security remains active.                                                      |
| N-14 | Medium   | No touch pan or button alternative to drag.                   | Two-finger drag pans and pinch zooms; View options has tap-only rotate/tilt/pan buttons; arrow keys cover the keyboard.                                                                                                                                                     |
| N-15 | Medium   | Wheel consumed browser gestures.                              | Ctrl/⌘ + wheel is left to the browser; `deltaY: 0` is ignored; magnitude drives the step.                                                                                                                                                                                   |
| N-16 | Medium   | Drag ownership and cancellation incomplete.                   | Drags are keyed by `pointerId`; `pointercancel` and `lostpointercapture` end them; a second pointer switches to pinch instead of overwriting the drag.                                                                                                                      |
| N-17 | Medium   | Neighbouring bulb hit areas overlapped.                       | Markers are spaced 16 px apart with 8 px hit radii, so no target overlaps its neighbour; the list remains the equivalent control.                                                                                                                                           |
| N-18 | High     | A green upkeep marker could hide an overdue item in the room. | One marker per room coloured by the most urgent status with a count badge; when the selected item is in the room, a badge shows the remaining items' count and worst status and opens the next one.                                                                         |
| N-19 | Medium   | Room selection discarded aliases and multiple records.        | Lighting's room filter is keyed by model room and lists every alias (e.g. "Bar Area / Living Room / Living Area"); Security, Network, and Upkeep room clicks cycle through every record in the room with a count in the toast; the Overview room summary lists all of them. |
| N-20 | Medium   | Reset did not stop auto-spin or explain scope.                | "Reset orientation" stops auto-spin and tweens home; "Fit visible" recentres; "Reset everything" also clears isolation and separation, with a confirmation toast.                                                                                                           |

## Record accuracy and explanatory content

| ID   | Severity | Finding (abridged)                              | Resolution                                                                                                                                                                                                                   |
| ---- | -------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N-21 | High     | Side Gate's floor and mapped room disagree.     | `cameraFloorConflict()` (CAT) drives a warning note in the camera details and a "?" badge beside the marker; the data stays as recorded pending the data workflow.                                                           |
| N-22 | Medium   | Power references to circuits that do not exist. | `resolveCircuitRef()` links verified references ("Open MP·18") and marks unresolved ones UNVERIFIED; no replacement is guessed.                                                                                              |
| N-23 | Medium   | Bulb totals counted fixture records.            | Labels read "fixture records"; the totals row explains that a record may hold several bulbs; the overview warning says "fixture records need attention".                                                                     |
| N-24 | Medium   | No as-of context for recorded usage and status. | `INVENTORY_SNAPSHOT` (July 2026) is shown in Quick Facts, list headers, fixture and upkeep details, print output, and the help sheet, with text stating values do not advance.                                               |
| N-25 | Medium   | Visuals implied surveyed precision.             | Legend notes and detail copy label wiring paths, coverage cones, links, and speaker squares as schematic; the climate install note asks for on-site confirmation; the SVG description says positions are prototype geometry. |
| N-26 | Medium   | Status missing as text in several lists.        | Node, fixture, camera, sensor, and upkeep rows show status text; the node detail shows the WEAK badge and an explanatory note.                                                                                               |
| N-27 | Low      | Maintenance bars mixed meanings.                | Rows say "used"/"remaining" and show overruns ("14/12 mo · over by 2"); the detail bar has end labels and an `aria-label` describing direction.                                                                              |
| N-28 | Medium   | Speaker diagram implied detail it lacked.       | The diagram is labelled "Generic placement · schematic", 7.2.4 is expanded, and the scene cluster has a `<title>` saying placement is illustrative.                                                                          |
| N-29 | Medium   | Timeline had no direction or elapsed time.      | Events sit on an axis by minutes-ago (oldest left, now right) with endpoint labels and an "illustrative" note; the fill spans the generated range.                                                                           |
| N-30 | Medium   | Offline tiles covered their identity.           | The NO SIGNAL overlay renders beneath the name/status bars and the name also appears outside the feed; history tiles keep names in their own captions.                                                                       |

## Layout, styling, and recovery

| ID   | Severity | Finding (abridged)                                       | Resolution                                                                                                                                                                                    |
| ---- | -------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N-31 | Medium   | 900×600 left 144 px of stage.                            | Below 1180 px panels narrow (272/292 px); below 1000 px only one side panel is open at a time (toggling one hides the other, selections open details); the model is fitted to the free area.  |
| N-32 | Medium   | Mobile controls covered the detail sheet.                | The controls cluster and legend sit above the sheet (`bottomPx`), the prompt sits below the rail, and z-order is coordinated in `layoutFor()`.                                                |
| N-33 | Medium   | Programmatic navigation left the active mode off screen. | The active nav button scrolls into view on every mode change.                                                                                                                                 |
| N-34 | Medium   | No safe-area or keyboard handling.                       | `viewport-fit=cover`, `env(safe-area-inset-*)` on bars, controls, and sheets, `100dvh`, and stage size from a `ResizeObserver` instead of `innerHeight`.                                      |
| N-35 | Medium   | Lighting TOTAL used a background token as text.          | Uses `--t1`.                                                                                                                                                                                  |
| N-36 | Low      | Invalid `var(--t4)22` legend fill.                       | Uses the `--t4-soft` token.                                                                                                                                                                   |
| N-37 | Medium   | Entry animation overwrote the prompt's centering.        | The outer element centres; the inner element animates.                                                                                                                                        |
| N-38 | Medium   | No print layout.                                         | `print-inventory.tsx` renders flow tables (rooms, circuits, fixtures, nodes, servers, zones, cameras, sensors, replacements) shown only under `@media print`, labelled recorded/schematic.    |
| N-39 | Medium   | No startup failure explanation.                          | `index.html` has `<noscript>` guidance and a boot fallback that reports a failed bundle after 8 s or a script error; `app.tsx` wraps the controller in an error boundary with reload actions. |
| N-40 | Medium   | No in-app help or correction route.                      | The help sheet (`?` / top-bar button) covers controls, the recorded-vs-demonstration boundary, sharing/export, and how to request a correction (data file, workflow, issue link).             |
| N-41 | Medium   | Duplicate React keys in camera history.                  | Tiles and axis dots are keyed by the event index.                                                                                                                                             |

## Optional product improvements

| ID   | Opportunity (abridged)           | Resolution                                                                                                                                                       |
| ---- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| O-01 | Room-centred detail view.        | Selecting a room in Overview (model, search, or link) shows a room summary with floor, aliases, an isolate toggle, and every recorded record in that room.       |
| O-02 | Cross-system relationship links. | Every detail view lists related records with one-click navigation; verified power references open their circuit; unverified ones are flagged (N-22).             |
| O-03 | Show recorded network identity.  | The Networks header lists friendly name, SSID, band, and member count with a note that no credentials are stored.                                                |
| O-04 | Prioritise maintenance work.     | Upkeep has All / Due / Overdue filters; Due and Overdue sort overdue-first; the header shows the snapshot date.                                                  |
| O-05 | Orientation and fit presets.     | Isometric, Plan, North up, Elevation presets plus Fit visible, with a note on the prototype axis convention.                                                     |
| O-06 | Explicit theme preference.       | System / Light / Dark choice in View options; the system option follows `prefers-color-scheme` changes; `theme-color` updates; `index.html` honours the default. |
| O-07 | Camera review continuity.        | Previous/next camera controls and a position counter in the review dialog.                                                                                       |
| O-08 | Progressive detail density.      | The gateway card is hidden when the gateway itself is selected; `[ model ]` placeholders read "not recorded"; RH/RO/UHP/GPD/7.2.4 are expanded via the glossary. |

## Corrections to the original audit

The corrections recorded on 2026-09-12 stand: A-16 and L-08 are retired, the
reduced-motion gap was JS-side, Isolate and View options are nonmodal
disclosures, and the demo-label items were one issue. The original document's
tables now cite these corrections in their resolution column.

## Verification and next audit pass

`pnpm format:check`, `pnpm check` (typecheck, lint, 3 unit tests, build with the
bundle budget), and `pnpm test:e2e` (10 scenarios, 20 cases) pass. Manual checks
covered both themes at 1440×900, 900×600, 812×375, and 375×812 in Chromium.

Still unverified, and the first candidates for the next pass: NVDA/VoiceOver
reading order and announcements, real touch and pen hardware, Firefox/WebKit,
forced-colors rendering on Windows, 200–400 % browser zoom, mobile keyboards on
real devices, and production frame timing on low-power hardware.
