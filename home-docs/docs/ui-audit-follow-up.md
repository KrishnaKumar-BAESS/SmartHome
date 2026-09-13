# UI audit follow-up — missed workflows and presentation defects

Audit date: 2026-09-12. Reviewed branch `codex/modernize-smarthome`, commit
`f76ef30`; application source is unchanged from the original audit's `ee6e477`.

This supplements and corrects the [original UI audit](ui-audit.md). It records
**41 additional findings**, **8 optional product improvements**, and expanded
evidence for existing findings. These are observations and proposals; this audit
does not fix application behavior or change recorded inventory.

The largest omissions concern repeated keyboard search, invisible focus targets,
selection/filter disagreement, misleading room-level maintenance markers, and
inconsistent device locations. Address these before adding decorative motion.

## Scope and evidence

Reviewed the controller, renderer, every view component, CSS, entry points,
inventory relationships, user guide, and browser tests. Exercised all eight
views in local Chromium through the Vite development server. Inspected both
themes, keyboard search, collapsed panels, filters, isolation, and camera
overlays. Used DOM measurements and screenshots at 1440×900, 900×600, 900×400,
812×375, 375×812, and 320×568 CSS pixels. Viewport resizing is desktop Chromium
testing, not evidence of real touch-device behavior.

- **B — browser verified:** exercised the behavior or measured rendered DOM.
- **S — source confirmed:** follows directly from the current implementation
  or inventory; a runtime/device-specific outcome is not claimed as tested.
- **O — opportunity:** an optional addition, not a broken implemented feature.
- **High:** prevents access to a workflow or materially misrepresents a record.
- **Medium:** creates a wrong turn, obscures information, or impedes interaction.
- **Low:** localized clarity or presentation problem.

No claim that every possible UI problem has been found is supportable. Unchecked
dimensions include NVDA/VoiceOver, real touch and pen input, Safari/Firefox,
forced-colors rendering, user text-spacing overrides, real browser 200–400%
zoom, mobile browser toolbars/keyboards/safe areas, print preview, assistive input
software, slow/failing asset delivery, and production performance. Findings below
separate source risks in these areas from browser reproductions. No new axe run
or performance benchmark was performed; the original timings are not reused as
new measurements.

### Source key

The following links own the evidence. Symbols and distinctive text in each
finding make the relevant implementation searchable without relying on line
numbers that move as the audit is maintained.

| Key   | Source                                                                                                                                   |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| C     | [house-controller.jsx](../apps/web/src/features/house/house-controller.jsx): state, search patches, filters, layout, derived records     |
| R     | [scene.jsx](../apps/web/src/features/house/scene.jsx): projection, hit areas, marker aggregation                                         |
| T     | [top-bar.jsx](../apps/web/src/features/house/top-bar.jsx): search and top controls                                                       |
| L     | [system-list.jsx](../apps/web/src/features/house/system-list.jsx): inventory and filters                                                 |
| D     | [system-details.jsx](../apps/web/src/features/house/system-details.jsx): details and summaries                                           |
| I     | [isolation-panel.jsx](../apps/web/src/features/house/isolation-panel.jsx): floors, rooms, Clear                                          |
| V     | [view-controls.jsx](../apps/web/src/features/house/view-controls.jsx): separation, reset, model/panels                                   |
| G     | [camera-grid.jsx](../apps/web/src/features/house/camera-grid.jsx): feed selection                                                        |
| H     | [camera-viewer.jsx](../apps/web/src/features/house/camera-viewer.jsx): review and timeline                                               |
| S     | [house-stage.jsx](../apps/web/src/features/house/house-stage.jsx): pointer boundary                                                      |
| W     | [house-view.jsx](../apps/web/src/features/house/house-view.jsx): composition and clipping                                                |
| CSS   | [styles.css](../apps/web/src/styles.css): tokens and animations                                                                          |
| DATA  | [house.ts](../apps/web/src/data/house.ts): preserved inventory and room mappings                                                         |
| ENTRY | [index.html](../apps/web/index.html), [main.tsx](../apps/web/src/main.tsx), [app.tsx](../apps/web/src/app.tsx): startup                  |
| TEST  | [house.spec.ts](../apps/web/e2e/house.spec.ts), [Playwright configuration](../apps/web/playwright.config.ts): current browser assertions |

## Additional findings

### Search and navigation

**N-01 · High · B/S — A second keyboard search silently stops working.**
Enter `garage`, choose a result with Enter, then type `projector` without moving
focus. The input remains focused and contains the new query, but there are zero
result rows. C's result callback sets `searchFocus: false`; `onSearch` never
restores it, and the already-focused input does not fire another focus event.
Keep the actual focus and popup state consistent, or deliberately move focus to
the destination. Acceptance: two consecutive keyboard searches both produce
results and can be activated without clicking elsewhere.

**N-02 · Medium · B/S — ArrowUp initially skips the last result.**
With ten `garage` results, the first ArrowUp activates `search-opt-8`, not
`search-opt-9`. C's modulo expression starts at `searchSel: -1` and subtracts
again. Handle the unselected state explicitly. Acceptance: initial ArrowDown
selects the first result; initial ArrowUp selects the last; subsequent arrows
wrap correctly, including a single-result query.

**N-03 · Medium · S — Global search omits an entire mode and useful visible fields.**
C's `idx` has no sound-zone entries or network/SSID entries. Circuit amperage,
bulb watts/lumens/Kelvin, and camera power/storage are displayed but absent from
their search haystacks. Searching `7.2.4`, a recorded SSID, or a camera's power
reference cannot find the corresponding record through those fields. Define
searchable fields per entity and add sound-zone destinations; distinguish exact
identifier searches from broad room matches. Acceptance: documented examples
for each supported entity and field resolve to that entity. This is separate
from U-05's result-count cap.

**N-04 · Medium · S — Distinct search hits lose their identity at the destination.**
Both panel results apply the same `{mode: 'electrical', selCirc: null,
etype: 'all'}` patch. R passes a panel ID to `onPanelClick`, but C ignores it.
Server results select their attached node without selecting/highlighting the
server; two servers on the same node lead to identical views. Give panels a
specific section/detail destination and servers an identifiable focused row.
Acceptance: choosing each panel or server visibly identifies the item named in
the result, even after scrolling or previous selection.

**N-05 · Medium · S — Suggested destinations do not support search's arrow/Enter navigation.**
Focus the empty search field: T displays six JUMP TO destinations. C's
`onSearchKeyDown` returns unless `showResults` is true and `searchResults` has
items; suggestions are a separate collection and never participate. ArrowDown
and Enter therefore cannot select the visible suggestions, although those keys
work after entering a query. Include suggestions in the same intentional
keyboard-navigation model. Acceptance: focus an empty search, navigate to each
suggestion, activate it, and cancel using the keyboard without a mouse.

**N-06 · Medium · B/S — Navigation can succeed entirely inside a hidden panel.**
Collapse a panel, then select a search result or switch mode. C's navigation and
search patches retain `leftHidden`/`rightHidden`; a record's details may remain
off screen without confirmation. On mobile, the common “Show model” state hides
both destinations. Reveal the relevant details or give an explicit selected-item
summary with a reveal action. Acceptance: searches, overview shortcuts, and model
selections always expose a meaningful destination or visible confirmation.

**N-07 · Medium · B/S — Filtering and selection disagree.**
Select MP·20, then filter Electrical to Appliance: the list contains three
appliances while the detail panel still shows MP·20, an outlet circuit. Security
→ Offline leaves the Front Doorbell's LIVE detail selected while only Side Gate
is listed. Lighting's status filter likewise preserves an excluded bulb. C
derives `selC`, `sb`, and `sc` from the full collections. Clear/reconcile selection
or explicitly mark it as outside the filter. Acceptance: list, details, and model
never silently disagree about whether the selected item is in the active result
set. Check model-driven selection with an existing list filter too.

**N-08 · Medium · S — Attention summaries do not take users to the advertised work.**
D's bulb warning calls C's `goLighting`, which only changes mode; a previous
Smart/room filter and selection remain. The replacements warning likewise opens
the unfiltered upkeep list with its previous selection. C's `lsum` is global
even when `lcount` is filtered, without an “all inventory” scope label. Route
attention calls to a defined attention view and label global versus filtered
counts. Acceptance: warning → destination exposes the advertised items, and
summary numbers state their scope.

**N-09 · Medium · B/S — Selection has no programmatic state or detail-change cue.**
Inventory rows in L are generic buttons with a visual style change, but no
selected/pressed state. D changes content without a named selection heading,
focus transfer, or concise announcement. This concerns actual record selection,
beyond A-06's filter/toggle attributes. Use suitable selection semantics and a
brief status announcement; avoid making the entire ticking camera panel live.
Acceptance: a keyboard/screen-reader user can identify the selected record and
learn that its details changed.

**N-10 · Medium · B/S — Detail scrolling survives navigation and hides the new title.**
At 900×400, scroll Security's right panel to its end, then switch to Upkeep. The
same D aside retains/clamps its scroll offset: observed 230.7 px in Security and
43.3 px in Upkeep, rather than returning to the top. A new record can appear to
start partway through its details. Reset scroll on entity/mode change, while
preserving it for clock ticks and unrelated model updates. Acceptance: each new
detail opens with its title visible; normal background updates do not jump it.

### Focus, input, and model interaction

**N-11 · High · B/S — Collapsed panels retain invisible keyboard stops.**
C hides panels using only transforms. Their controls remain in the DOM, tab
sequence, and accessibility tree; the collapsed Appliance list had eight
tabbable controls and no `aria-hidden` or inert handling. W clips the translated
content. Make collapsed content inert/unmounted as appropriate and move focus
to the collapse/reveal control if necessary. Acceptance: Tab never disappears
into either collapsed panel on desktop or mobile; reopening restores access.

**N-12 · Medium · B/S — Inactive isolation exposes an empty, zero-size button.**
Open Isolate with no isolation applied. I always renders the Clear button while
C supplies an empty label. DOM inspection finds a focusable `role="button"`
with no accessible name and a 0×0 rectangle. Conditionally render it or present a
named, appropriately disabled action. Acceptance: unfiltered isolation has no
unnamed or invisible focus stop; Clear appears with a name when useful.

**N-13 · Medium · B/S — Background shortcuts leak through camera overlays.**
Open expanded review and press `1`: Overview becomes active behind the still-open
camera viewer. C's `showGrid`/`showCamExpanded` are independent of mode, and its
global key handler does not scope shortcuts to overlays. The Security clock then
stops refreshing because its interval checks the underlying mode. `/` can also
focus the concealed search; input-specific Escape handling can prevent the
expected overlay close. Define one active interaction layer and gate shortcuts.
Acceptance: background mode/search/zoom shortcuts cannot mutate or focus the
covered app, and closing returns to the originating Security context. This is
the state-management consequence missing from A-07's dialog checklist.

**N-14 · Medium · S — Touch users have no pan operation or button alternative to drag.**
S disables native touch actions; C recognizes pan only through Shift/middle/right
mouse buttons. It tracks one drag, not a two-finger pan or pinch. Zoom buttons
exist, but no directional pan/rotate buttons or manipulation mode does. Add
tap-operable directional controls or a clear touch pan mode. Acceptance: all
useful camera adjustments can be made with simple taps on a real touch device.
Adding keyboard arrows alone would not supply a single-pointer alternative to
dragging; see [W3C's dragging guidance](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html).

**N-15 · Medium · S — The wheel listener consumes browser gestures indiscriminately.**
C's `onWheelNative` always calls `preventDefault()` and uses only the sign of
`deltaY`. Ctrl+wheel over the stage is swallowed as model zoom; a horizontal-only
wheel event with `deltaY: 0` takes the zoom-out branch. Trackpad pinch behavior
depends on the browser and was not exercised. Respect browser zoom modifiers,
ignore zero vertical deltas, and define supported trackpad behavior. Acceptance:
browser zoom remains available over the stage; horizontal scrolling does not
change model scale. This is distinct from U-11's coarse zoom steps.

**N-16 · Medium · S — Drag ownership and cancellation are incomplete.**
C stores no owning `pointerId`; another pointer can overwrite the active drag.
S has no `pointercancel`/`lostpointercapture` handler. Capture starts only after
five pixels, so a press leaving the stage before capture is not the same
lifecycle as a captured drag. Add explicit ownership and cancellation handling.
Acceptance: two-finger contact, pen cancellation, interrupted gestures, and
leaving/re-entering the stage do not jump the model or leave rotation paused.
These are source-visible robustness gaps, not claimed real-device reproductions.

**N-17 · Medium · S — Neighboring bulb hit areas overlap by design.**
R spaces bulb centers by 9 units in Overview and 10 in Lighting while assigning
each an invisible radius-12 click circle. Later SVG nodes win overlapping hit
tests, so a visible dot can activate its neighbor. All sizes also shrink with
the SVG's CSS scale on narrow screens. Cluster/spread markers or provide a room
chooser with distinguishable targets. Acceptance: selecting each visible bulb
dot selects that bulb at supported zooms; clustered markers expose every item.
Target assessment must account for size, spacing, and equivalent controls, not
just a blanket 44 px rule; see [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

**N-18 · High · S — A green upkeep marker can conceal an overdue item in that room.**
R's upkeep `seen[it.roomId]` keeps the first nonselected item per room. DATA's
kitchen records start with OK `u2`, followed by OK `u3`, soon `u4`, and overdue
`u5`. With the default projector selection, the kitchen marker is green and opens
`u2`; the overdue item has no separate scene marker. Aggregate by worst recorded
status and expose a room-item chooser/count. Acceptance: the kitchen conveys its
overdue item regardless of data order or selection, and all four records remain
reachable without guessing a list entry.

**N-19 · Medium · S — Room selection discards multiple associated records.**
C's `ridToLroom` retains the first display-name alias for a room. The shared
basement living/bar geometry maps several names; clicking it filters to just the
first alias, hiding other fixtures located there. Security and Upkeep room
handlers also use `.find`, choosing the first camera/item: Great Room selects
the outdoor camera before the indoor one. Resolve canonical room membership and
offer all matches. Acceptance: clicking a room exposes all relevant records,
including aliases. U-09 already covers the electrical variant; do not count that
variant again.

**N-20 · Medium · S — Reset does not stop the motion the user may be trying to escape.**
C's `resetView` resets orientation/zoom/pan but leaves auto-spin running, so the
model immediately rotates away again. It also leaves isolation and separation
unchanged, despite the broad “Reset view” label. The user guide clarifies the
scope, but the control does not. Rename it “Reset orientation” and provide a
clear stop/all-view reset policy. Acceptance: reset while spinning has an
intentional, visible outcome; isolation can be recovered without reloading.

### Record accuracy and explanatory content

**N-21 · High · S — Side Gate has contradictory floor identities.**
DATA's `c6` uses `floor: 'main'` but `roomId: 'master_bath_and_closet'`, whose room
floor is `second`. R filters visibility through the room ID and projects elevation
through the camera floor. Main-floor isolation therefore hides this main-floor
camera; second-floor isolation admits it with main-floor projection. Surface
the unresolved mapping and reconcile against an authoritative record before
changing data. Acceptance: displayed location, floor isolation, and rendered
elevation agree, with the correction's provenance retained.

**N-22 · Medium · S — Displayed camera power references cannot all be resolved.**
DATA records `c3` at MP·9 and `c6` at MP·1, but neither circuit number exists in
the circuit collection. D renders the strings as ordinary specifications with
no unresolved-reference cue. These may be missing records or stale references;
the audit cannot choose which. Show unverified relationships distinctly and
provide a correction path. Acceptance: a displayed reference either resolves to
a documented circuit or explicitly says the relationship is unverified. Do not
guess replacements from spatial proximity.

**N-23 · Medium · B/S — Bulb totals count fixture records, not individual bulbs.**
The “18 bulbs” total uses `bulbs.length`. Records include four sconces, eight
recessed cans, and combined fixtures; individual quantity is not normalized.
The “7 bulbs need attention” warning has the same ambiguity. Label these as
fixture records/lighting entries, or introduce verified quantities separately.
Acceptance: totals and warnings describe their counting unit; no inferred bulb
quantity is presented as measured inventory.

**N-24 · Medium · S — Recorded maintenance values have no as-of context.**
D combines last-replaced dates with fixed `used` values, statuses, and life
estimates as though they share a current clock. For example `u2` is four months
used since 2026-02, unchanged in September 2026. Bulb status is also stored
independently of replacement date/life. Add an explicit snapshot/as-of and
status-basis explanation, including “date unknown” where necessary. Acceptance:
the user can distinguish a recorded usage/status from an automatically computed
due date. Preserve original values until a deliberate data correction. This is
more specific than adding a DEMO badge to camera feeds (A-15/V-08).

**N-25 · Medium · S — Spatial visuals imply more precision than the data supports.**
R's electrical paths are right-angle connections derived from centers; camera
cones ignore walls/occlusion; network links join nodes directly to the first
node. D describes a circuit as “energiz[ing] its wiring path” and tells users
planned sensor positions allow installation “with no re-survey.” No in-app
schematic/illustrative explanation accompanies those claims. Label the visuals
and qualify installation language; do not invent measured routes or coverage.
Acceptance: a viewer can distinguish logical association from verified physical
wiring, coverage, and installation coordinates without reading repository docs.

**N-26 · Medium · S — Status is missing from several lists as actual text.**
L's node, bulb, camera, and upkeep rows use colored dots/bars rather than naming
the recorded status. D never names the selected node's `warn` status, although
C has a “WEAK” label helper. A-09 mentions network membership and camera colors,
but misses these absent health/maintenance labels. Add concise status text to
rows and node details. Acceptance: users can identify the weak node and compare
OK/soon/overdue/offline items without color or opening every detail.

**N-27 · Low · S — Maintenance bars mix opposite meanings without list labels.**
C fills hour/month bars by fraction of life used, but salt by percent remaining.
A fuller bar thus means more consumed life for one item and more available stock
for another. Overdue usage is capped at a visually full 100%, while the row only
shows `14/12mo`. Label “used” versus “remaining/full” and indicate overrun with
text; keep units attached to the displayed value. Acceptance: each bar's
direction and meaning are understandable without entering its detail panel.

**N-28 · Medium · S — Speaker diagrams contradict their apparent level of detail.**
C's detail layout displays 7 main, 2 sub, and 4 height speakers; R's scene emits
only seven fixed screen-space squares for the selected zone. Both zones reuse the same detail
layout, and the model offsets do not rotate/project as room coordinates do.
L promises selection will light the zone's speakers. Label the simplified scene
and generic placement diagram, or derive a consistent verified speaker model.
Acceptance: the user understands what 7.2.4 means and which placements/counts are
schematic; no generic diagram is mistaken for a surveyed layout.

**N-29 · Medium · S — The camera timeline encodes neither a consistent direction nor elapsed time.**
C places Live at 4%, then progressively older events at 12%, 23%, and so on;
intervals are equal although generated timestamps are not. H labels the strip
“last ~4h” without endpoints or chronological direction. U-13 covered fixed fill
and unnamed dots, but not the misleading time mapping. Label it an event list,
or position events on an actual axis with oldest/newest endpoints. Acceptance:
event order, elapsed spacing, and selected time agree or their illustrative nature
is explicit.

**N-30 · Medium · S — Offline grid tiles cover their own identity.**
G draws the NO SIGNAL overlay last with `inset:0`, covering the tile's name,
resolution, and time. The camera name has no separate caption; its watermark is
the room name rather than camera identity. On narrow tiles, overflow also clips
online-camera metadata. Keep a readable camera name outside the replaceable feed
surface and retain status there. Acceptance: every tile remains identifiable
when offline and at narrow widths. L-06 already owns the fixed-column layout fix.

### Layout, styling, and recovery

**N-31 · Medium · B/S — The desktop breakpoint leaves almost no usable stage.**
At 900×600, C keeps a list spanning x=90–406 and details at x=550–890: only
144 px between them. Opening View options puts its left edge around x=329,
covering the list. Merely fixing the below-900 mobile layout will not fix this
desktop interval. Choose breakpoints from required panel/stage space and allow
one-panel layouts. Acceptance: at the breakpoint and intermediate laptop widths,
the model and all controls have a usable, nonoverlapping region.

**N-32 · Medium · B/S — Mobile model controls cover the detail panel's content.**
C positions the controls at bottom 18 px with z-index 22 while the mobile detail
panel ends at bottom 8 px with z-index 19. They occupy the same lower-right
space; opening the drawer increases the obstruction. Legend is z-index 16 and
can disappear behind the detail panel; the mobile selection prompt at top 64 px
sits under the nav at z-index 26. Reserve layout space or use a coordinated sheet
system. Acceptance: details, their final row, legends, and prompts are readable
when their controls say they are visible, in portrait and landscape.

**N-33 · Medium · S — Programmatic mobile navigation can leave the active mode off screen.**
The horizontal rail scrolls, but C's search patches, overview cards, and global
shortcuts never scroll the selected navigation button into view. A jump to
Upkeep can change content while its active label stays outside the rail's
visible portion. Reveal the active item without unnecessary motion, or supply a
persistent current-mode heading. Acceptance: a search/shortcut to each mode
leaves its identity visible at 320/375 px and after rotation.

**N-34 · Medium · S — Viewport handling omits mobile keyboard and safe-area boundaries.**
W uses `100dvh`, but C mixes it with `42vh`/`40vh`, fixed top offsets, and
`window.innerHeight`. There is no safe-area inset padding or visual-viewport
handling. A mobile software keyboard/notch can shrink or cover the working area
in ways the tested desktop resizes do not establish. Unify viewport sizing and
test actual browser chrome, keyboard opening, and rotation. Acceptance: focused
search, results, close buttons, and bottom controls remain reachable. Treat this
as a source-identified validation/design gap, not a proven iOS failure.

**N-35 · Medium · B/S — Lighting's TOTAL value uses a background token as text.**
C sets `lsum[0].color` to `var(--sel-bg)`; L applies it to the number's text.
Measured foregrounds were `rgb(219,229,238)` in light mode and `rgb(40,50,59)`
in dark mode, against similar panel washes. The total nearly vanishes in both
themes. Use a text token. Acceptance: TOTAL is as readable as the other numeric
summaries in both themes. Retuning A-05's secondary text ramp alone will not
repair this wrong-token use.

**N-36 · Low · S — Climate's planned-sensor swatch contains invalid CSS.**
C builds `background:var(--t4)22` in `legendItems`. A hex alpha suffix cannot be
appended to a `var()` expression; the browser discards the fill declaration.
Use a valid translucent token/color expression matching R's marker. Acceptance:
the planned-sensor legend's computed fill is valid and matches its dashed scene
marker in both themes.

**N-37 · Medium · B/S — Entry animation overwrites the prompt's centering transform.**
C's `promptStyle` uses `translateX(-50%)` and `floatIn ... both`; CSS's final
keyframe assigns `transform: none`. At 1440 px the prompt begins at x=720, its
nominal center, rather than being centered there; computed transform is identity
while the inline transform still says translateX. Fix transform composition or
animate an inner element. Acceptance: before, during, and after entry—including
reduced motion—the prompt retains its intended alignment. This supplies the
missing root cause of L-03, whose free-stage centering recommendation alone is
insufficient; count it as an additional implementation defect, not a second
instance of clipped text.

**N-38 · Medium · S — The documentation app has no usable print layout.**
W fixes the main region to one viewport and clips overflow; panels have their
own scrolling and absolute placement. CSS has no print treatment. A readable
paper/PDF inventory cannot be assumed from this screen composition. Add a
flow-based print view with explicit scope and demo/recorded labels. Acceptance:
print-preview a multi-page circuit/upkeep list with complete rows and without
model controls, clipping, or transparent text. Printing itself was not exercised;
the confirmed omission is the absence of a print layout.

**N-39 · Medium · S — Startup failure has no in-app explanation or recovery.**
ENTRY provides an empty root, no `noscript` content, and no React error boundary
or startup fallback. A failed entry bundle or uncaught render error can strand
the user without a readable action. Supply static startup/no-script guidance and
a recoverable error boundary; do not imply an offline cache exists. Acceptance:
controlled bundle-load and render failures produce a useful message and retry/
reload action. Fault injection was not performed during this audit.

**N-40 · Medium · S — There is no in-app route to guidance or record correction.**
T/V/navigation expose modes and controls but no Help/About, user-guide link,
record provenance, or “report a correction” route. Model gestures, schematic
limits, placeholders, and stale maintenance values require leaving the app and
finding repository documentation independently. Provide a compact help surface
and an explicit correction workflow appropriate to this read-only app.
Acceptance: a first-time user can learn controls, identify the recorded/demo
boundary, and find how to request a data correction without repository knowledge.
Do not add a nonfunctional “save” action or imply device integration.

**N-41 · Medium · B/S — Camera history gives repeated events duplicate React keys.**
Opening Front Doorbell review emitted React warnings for duplicate `Package`,
`Person`, and `Motion` keys. Both maps in H choose `t.label` before falling back
to the array index, although C supplies a unique `idx` for every history entry.
Repeated event types are expected, so labels cannot identify events. This makes
reconciliation unreliable when history/camera context changes; actual missing
rows were not observed. Use stable event identifiers consistently for timeline
and history cards. Acceptance: repeated event types render once each, selection
remains attached to the intended event, and opening/changing review context
produces no duplicate-key console warnings.

### Finding counts

| Area                               |  High | Medium |   Low |  Total |
| ---------------------------------- | ----: | -----: | ----: | -----: |
| Search and navigation, N-01–N-10   |     1 |      9 |     0 |     10 |
| Focus/input/model, N-11–N-20       |     2 |      8 |     0 |     10 |
| Record accuracy/content, N-21–N-30 |     1 |      8 |     1 |     10 |
| Layout/styling/recovery, N-31–N-40 |     0 |      9 |     1 |     10 |
| Camera history identity, N-41      |     0 |      1 |     0 |      1 |
| **Additional findings**            | **4** | **35** | **2** | **41** |

N-13, N-19, N-26, N-29, and N-37 explicitly identify their relationship to the
original audit. They add concrete failure mechanisms or omitted cases, rather
than recounting A-07/U-09/A-09/U-13/L-03 as newly discovered findings. Do not sum
the two documents' headline counts as though they were a deduplicated backlog.

## Optional product improvements

These are additional choices worth considering after the defects above. They
are not requirements to build integrations or expand the product in this change.

| ID   | Opportunity and current evidence                                                                                                                                                                    | A useful acceptance condition                                                                                                             |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| O-01 | **Room-centered detail view.** Searching a room only isolates geometry (C). There is no room page aggregating its circuits, fixtures, nodes, cameras, sensors, and upkeep.                          | Selecting a room gives a named summary and related records, with unmapped/exterior items distinguished.                                   |
| O-02 | **Cross-system relationship links.** D displays power references, rooms, sound sources, and attached servers as plain text. Users must re-search instead of following an existing relationship.     | A verified circuit reference opens that exact circuit and provides a clear return path; unresolved references follow N-22.                |
| O-03 | **Show recorded network identity.** DATA includes SSIDs, but L displays only friendly network name and band.                                                                                        | Network details distinguish friendly name, recorded SSID, membership, and placeholder hardware without implying connection credentials.   |
| O-04 | **Prioritize maintenance work.** Upkeep has no sort/filter by recorded urgency; Overview's NEEDS ATTENTION rows contain only bulbs.                                                                 | A unified attention view can separate fixture and upkeep records, sort overdue before soon, and expose its snapshot date.                 |
| O-05 | **Orientation and fit presets.** R has no compass/plan-view legend or floor-aligned camera presets; reset uses fixed yaw/pitch/zoom.                                                                | North/plan/isometric presets and “Fit visible” use a documented coordinate convention and do not imply a physical scale unless verified.  |
| O-06 | **Explicit theme preference.** C/ENTRY support saved light/dark only; system color preference is ignored and the HTML theme-color stays light.                                                      | A System/Light/Dark choice follows preference changes, persists explicit overrides, and keeps browser chrome coherent.                    |
| O-07 | **Camera review continuity.** G closes the grid on tile selection; H has Close but no next/previous camera or return-to-grid action.                                                                | Review can move between cameras and return to the originating grid while keeping the selected camera identifiable.                        |
| O-08 | **Progressive detail density.** D repeats the gateway above the selected node, includes unannotated `[ model ]` placeholders, and uses unexplained technical shorthand such as RH/RO/UHP/GPD/7.2.4. | Primary identity and actionable recorded facts lead; secondary context expands on demand; unknown values and abbreviations are explained. |

## Stronger evidence for existing findings

These extend the original entries and are **not additional findings** in the
41-item count.

| Original IDs     | What the original audit missed                                                                                                                                                  | Required refinement                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| L-01, L-04       | At 320×568 with `camera` entered, the input is 4 px wide and result label containers are 0 px wide; the page still has no document-level horizontal overflow.                   | Test usable text/target width, not just `scrollWidth <= innerWidth`; give search a dedicated narrow presentation.                    |
| L-01             | At 812×375, Lighting's list viewport is about 23 px high for 905 px of content, and the detail sheet overlaps the list's lower portion.                                         | Include short-height/landscape layouts and minimum usable scroll regions, not just portrait phone screenshots.                       |
| L-02             | A fixed SVG viewBox also shrinks marker hit targets and labels; magnifying the model does not automatically correct the surrounding UI.                                         | Evaluate rendered target dimensions and label density at each supported fit/zoom state.                                              |
| L-03             | The prompt is hidden behind the narrow nav, and `floatIn` destroys its centering (N-32/N-37).                                                                                   | Fix animation composition and layer placement as well as free-stage centering.                                                       |
| L-06             | Grid feed metadata is inside clipped aspect-ratio surfaces; the 236 px history rail leaves little room for the feed and timeline at phone width.                                | Test name/status visibility and review usability, not only responsive column count.                                                  |
| U-04, A-03       | Blur dismissal also removes keyboard-focusable result/suggestion rows when Tab moves from the input; a timer is not a focus-within policy.                                      | Test Tab/Shift+Tab, refocus, suggestion activation, and successive Enter searches, including N-01/N-02.                              |
| U-05             | Results are ordered by entity insertion: rooms, circuits, panels, bulbs, nodes, servers, cameras, climate, upkeep. Generic room terms can fill the cap before later categories. | Rank exact names/identifiers and expose category coverage, in addition to providing all matches.                                     |
| U-06, U-14       | Isolation applies only to scene geometry. Lists/counts remain global, and Lighting/Upkeep can still claim “pinned in model” when isolation hides that pin.                      | State model-only filter scope and hidden-selection status for list/model/search entry paths.                                         |
| A-04, A-05, A-13 | Neutral text ratios do not cover white text on amber Lighting filters, colored category labels, non-text boundaries, or the wrong TOTAL token (N-35).                           | Measure actual composites and states in both themes; validate focus contrast on every accent surface.                                |
| A-09, V-09       | Room labels, the network legend, and a few generic colored dots do not explain marker clusters, weak-node status, or how many items share a room.                               | Provide text equivalents, counts, and selection feedback for actual represented data.                                                |
| P-02, P-04, P-05 | Hidden panels and obscured scenes still participate in C's full render; pointer hover changes also rederive the view.                                                           | Benchmark selection, hover, drag, filtering, Security clock, and overlays separately in production before prescribing optimizations. |
| M-01–M-06, V-09  | Extra transitions, inertia, count-ups, and decorative illustration do not resolve incorrect selection or missing information, and can worsen motion sensitivity.                | Treat decorative motion as optional; fix state continuity, accessibility, and render cost first.                                     |

## Corrections to the original audit

Some original claims were inaccurate for its own source baseline. The following
corrections are authoritative; the original document's 65-row summary is an
inventory of its initial findings, not a count of verified open defects.

| Original claim                                                                                    | Correction and source                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A-01 says the stage has `tabIndex -1`.                                                            | S has no `tabIndex` attribute. The pointer-only accessibility finding remains valid.                                                                                                                                                             |
| A-10 and nearby text describe an explode slider/popover.                                          | V renders three separation buttons; C retains unused slider derivation. No range input is mounted. Audit button state and labels; do not plan a fix for a nonexistent rendered slider.                                                           |
| A-12 says reduced-motion CSS leaves infinite loops retriggering and affects the JS explode tween. | CSS explicitly sets `animation-iteration-count: 1`; CSS animation loops do not remain infinite under that rule. CSS cannot stop C's requestAnimationFrame auto-spin or explode tween. The unhandled JS preference remains the real gap.          |
| A-14 says all named icon-only controls rely on `title`.                                           | T's clear and the panel chevrons have neither title nor explicit accessible label; zoom and View options use titles. Check each control instead of applying the same diagnosis to all.                                                           |
| A-16 says `aria-pressed` is inherently wrong for the view switcher.                               | A set of toggle buttons can communicate the current view. Tabs are a design choice requiring the complete keyboard/panel pattern, not a mandatory role substitution. Retire this as a defect; N-09 covers missing record-selection semantics.    |
| A-07 proposes dialogs/inert background for every popover.                                         | The camera overlays need modal behavior. Isolate and View options may be nonmodal disclosures that intentionally leave the model usable. Choose semantics and focus behavior to match the intended interaction.                                  |
| L-08 says viewport state defaults to 1280×800 until mount.                                        | C initializes from `window.innerWidth/innerHeight` whenever `window` exists. Those constants are fallbacks for nonbrowser execution. Retire the claimed browser first-paint defect.                                                              |
| V-07 recommends hiding panels outside the isolated floor.                                         | R already checks `visById(pp.room)` before drawing panel markers. Their size/overlap remains a design issue, but isolation visibility is implemented.                                                                                            |
| M-07 asserts all animation runs while the browser tab is hidden.                                  | No explicit visibility policy exists, but requestAnimationFrame and CSS background scheduling are browser-controlled. Hidden-tab cost was not established by source alone; distinguish it from still-visible work behind an overlay.             |
| M-01 implies the entire stage tint transitions gradually.                                         | The background component has no background transition. The logo has a border/shadow transition; these are separate surfaces.                                                                                                                     |
| A-15 and V-08 describe separate camera-demo problems.                                             | They substantially duplicate the same missing demo-label issue. The changelog says dark camera surfaces are intentional, not that omitting demonstration labels is intentional.                                                                  |
| The closing positive list says Escape always matches the visual stack.                            | Grid Escape is missing (A-08), keyboard handling can reach background content (N-13), and input focus changes Escape behavior. Limit that positive claim to the specific tested viewer/options/isolation sequence.                               |
| The original audit implies a font-size floor or an axe count establishes accessibility.           | Its 11 px suggestion is a design recommendation, not a universal conformance threshold. Small text, resizing/reflow, contrast, and legibility need separate assessment. Two reported automated violations do not establish that the rest passes. |

The [W3C reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
is relevant to the narrow UI: a two-dimensional model can need spatial layout,
while its accompanying search, lists, and controls still need usable reflow.
The viewport tests above do not constitute a browser-zoom or WCAG conformance
assessment.

## Verification and next audit pass

Documentation-change verification used Node 22.23.2 and pnpm 12.4.1:
`pnpm format:check`, `pnpm check` (typecheck, lint, 3 unit tests, build), and
`pnpm test:e2e` (10 tests) passed. The first browser-test attempt failed to launch
Chromium with sandbox `spawn EPERM`; the permitted rerun passed. A local link
check resolved 60 relative links across the changed documents, including
Markdown heading targets, and checked the finding IDs and severity totals.
These checks validate this documentation change and the existing baseline; they
do not establish that the UI defects described here have been fixed.

The existing TEST suite has five tests in two Chromium projects. It checks mode
activation, a camera search, opening the grid, projected zoom changes, and a
floor/separation path. It does not assert repeated keyboard search, selected
detail identity after filtering, collapsed focus, overlay shortcut containment,
semantic selection, text contrast, or element occlusion. Its error collection
listens for `pageerror`, not React's duplicate-key `console.error` warnings, and
it never opens the expanded camera review. A visible SVG and no
document overflow can both pass while panels cover the model or search labels
have zero width. No new behavioral tests were added because this change records
defects rather than implements their fixes.

For remediation, use these bounded acceptance scenarios alongside the
[required repository gates](../../docs/testing.md#required-local-gates):

1. **Search:** each category, exact identifier, no result, one result, over 16
   results, suggestions, ArrowUp/Down boundaries, repeated Enter selection,
   Tab/Shift+Tab, and searching with panels hidden or isolation active.
2. **Selection:** every mode's list/model/search entry paths, excluded selections,
   multiple devices per room, unknown/unmapped location, changed details after
   scrolling, and observable selection for assistive technology.
3. **Model:** all floors and separation presets, room groups, clear/reset,
   hidden panels, min/max zoom, overlapping markers, drag interruption, touch
   pan alternatives, and browser zoom modifiers.
4. **Camera overlays:** all/offline filters, grid → detail → review → close,
   keyboard-only open/close, background shortcut suppression, event identity,
   narrow feed labels, and offline identity independent of the feed image.
5. **Responsive:** 320/375 px portrait, short landscape, both sides of 900 px,
   ordinary desktop, real 200–400% browser zoom, text-spacing overrides,
   mobile keyboard, rotation, safe areas, and controls above expanded sheets.
6. **Accessibility and appearance:** both themes, all accents and states,
   reduced motion including JS, forced colors, named controls and selection,
   focus after collapse/dismissal, real NVDA/VoiceOver, and touch/pen targets.
7. **Resilience/output:** disabled JavaScript, blocked entry/assets, render errors,
   storage unavailable, font fallback, print preview, and production performance
   under representative device limits. Record these results separately from
   baseline build/test success.

Suggested order: N-01/N-11 and selection/overlay consistency first; N-18/N-21
and record-trust corrections next; responsive/search/contrast fixes alongside
them; then the remaining input and recovery defects. Choose optional product
improvements only after these workflows are dependable. Keep source inventory
and archived references intact until separately verified corrections are approved
through the [data workflow](data-model.md#intentional-inventory-changes).
