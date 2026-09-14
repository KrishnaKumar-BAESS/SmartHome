# UI audit — HOUSE.SYS web application

Audit date: 2026-09-12 (branch `codex/modernize-smarthome`, commit `ee6e477`).
Remediation date: 2026-09-14 on `main`. Every finding below records what was
lacking and how the current source addresses it; the
[follow-up audit](ui-audit-follow-up.md) does the same for its 41 additional
findings and 8 optional improvements. Both documents now serve as a resolution
log so later changes do not regress them.

Retired findings (A-16, L-08) are kept for traceability with the correction
from the follow-up.

## Method and scope

| Aspect       | Original audit                                                              | Remediation check                                                                                                                       |
| ------------ | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Source       | Full read of `home-docs/apps/web/src/`                                      | Controller, renderer, views, styles, entry, tests rewritten or extended; see the source pointers below                                  |
| Browser      | Chromium at 1440×900 and 375×812                                            | Chromium at 1440×900, 900×600, 812×375, 375×812; both themes; keyboard search, overlays, isolation, drag/wheel, panel toggles           |
| Automation   | axe-core, in-page timing probes                                             | Ten Playwright scenarios in two projects (20 cases) plus a bundle-size gate in `pnpm build`                                             |
| Not verified | Screen readers, real touch devices, Firefox/WebKit, production frame timing | Still not verified: NVDA/VoiceOver output, real touch and pen hardware, Firefox/WebKit, forced-colors rendering on a real Windows theme |

Severity scale: **High** blocks or misleads a class of users; **Medium** degrades
a common task; **Low** is polish or a missed opportunity.

Source keys used in the resolution column: **C** `house-controller.jsx`, **R**
`scene.jsx`, **V** `house-view.jsx`, **T** `top-bar.jsx`, **L** `system-list.jsx`,
**D** `system-details.jsx`, **VC** `view-controls.jsx`, **I** `isolation-panel.jsx`,
**H** `camera-viewer.jsx`, **HS** `help-sheet.jsx`, **CSS** `styles.css`,
**LIB** `src/lib/*`, **CAT** `catalog.ts`, **E2E** `e2e/house.spec.ts`.

## Summary

All 65 original rows are resolved or retired. Counts by area: Performance 7,
Accessibility 16 (one retired), Usability 17, Layout 9 (one retired), Motion 7,
Visual 9.

## Performance (P)

| ID   | Severity | Finding (abridged)                                                                        | Resolution                                                                                                                                                                                                                                                                                     |
| ---- | -------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-01 | Medium   | No performance budget, benchmark, or bundle gate; 7 font faces shipped in two formats.    | `pnpm build` runs `scripts/bundle-budget.mjs` (gzip JS ≤ 140 kB, CSS ≤ 8 kB, six woff2 faces) and fails over budget. Inter 700 is no longer shipped. Frame timing stays unbenchmarked; the render split below removes the full-tree cost it measured.                                          |
| P-02 | High     | Every state change re-derived the search index, all mode data, styles, and the SVG scene. | C builds the search index once in the constructor; `deriveView()` caches the panel view object and only rebuilds when a non-camera state key changes; `deriveScene()` re-projects only when camera state or the scene options change. Panels are `memo`ised in V and skip camera-only renders. |
| P-03 | Medium   | `css()` parsed every inline style string on every render.                                 | LIB `css.ts` caches parsed declarations by source string (bounded map).                                                                                                                                                                                                                        |
| P-04 | Medium   | Auto-spin and the explode tween re-rendered panels every frame.                           | Yaw/pitch/zoom/pan/explode/hover/dragging are camera-only keys; only `HouseStage` re-renders during animation.                                                                                                                                                                                 |
| P-05 | Medium   | A 1 s interval called `forceUpdate()` for the demo clock.                                 | The clock is the `FeedClock` leaf component (`feed-clock.tsx`) with its own interval, mounted only inside the demonstration feeds, paused while the tab is hidden.                                                                                                                             |
| P-06 | Low      | Six blurred glass surfaces composited on every drag frame.                                | `main[data-dragging]` drops `backdrop-filter` on every glass surface while a captured drag is active (CSS).                                                                                                                                                                                    |
| P-07 | Low      | No font preload; first paint could fall back and swap.                                    | `vite.config.ts` injects `<link rel="preload">` for Inter 400/500 and Plex Mono 500 woff2 in the production HTML; weights are subset to those used.                                                                                                                                            |

## Accessibility (A)

| ID   | Severity | Finding (abridged)                                                                       | Resolution                                                                                                                                                                                                                                                                                                                        |
| ---- | -------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-01 | High     | The model was pointer-only.                                                              | The stage is focusable (`role="group"`, description, arrow keys rotate/tilt, Shift+arrows pan). Every room top face, panel, floor label, bulb, node, camera, sensor, and upkeep marker is a `role="button"` with a name and `<title>`, activated by Enter/Space (R). VC also has tap-only rotate/tilt/pan buttons. E2E covers it. |
| A-02 | High     | No headings, lists, or landmark names; SVG had no title/desc.                            | Top bar is a `header` with an `h1`; each panel has an `h2` and `h3` sections; asides are named per mode; records are `listbox`/`option`; the SVG has `<title>`/`<desc>`; a skip link targets the model.                                                                                                                           |
| A-03 | High     | Search claimed `aria-activedescendant` without a combobox; counts were not announced.    | T implements the combobox pattern (`role="combobox"`, `aria-expanded`, `aria-controls`, options with `aria-selected`) and a polite live region announces match counts and suggestions.                                                                                                                                            |
| A-04 | High     | Pervasive text below 10 px.                                                              | Type scale is now 10 (tracked mono micro-labels only) / 11 / 12 / 13 / 15 / 16 / 23 px; nav labels 10 px mono; the only 9 px text is the decorative speaker diagram whose container is a named `img`.                                                                                                                             |
| A-05 | High     | `--t4`–`--t6` and placeholder below 4.5:1.                                               | CSS retunes the ramp (light t4 5.6:1, t5 4.9:1, t6 4.5:1; dark ramp equivalent) and documents the ratios at the top of `styles.css`. Lighting's TOTAL uses `--t1` (N-35).                                                                                                                                                         |
| A-06 | Medium   | No state attributes on toggles; no skip link.                                            | `aria-expanded` on Isolate, View options, panel toggles; `aria-pressed` on filters, floor chips, room chips, auto-spin, labels, legend, shortcuts, theme; skip link added.                                                                                                                                                        |
| A-07 | Medium   | Overlays were not dialogs; no focus trap or return.                                      | Camera review (H) and help (HS) are native `<dialog>` modals with focus return and Escape; Isolate and View options are nonmodal disclosures with `aria-expanded`, Escape, and outside-click dismissal, per the follow-up's correction.                                                                                           |
| A-08 | Medium   | Escape did not close the camera grid.                                                    | The live-camera dialog closes on Escape (native `cancel` plus explicit keydown); E2E asserts it.                                                                                                                                                                                                                                  |
| A-09 | Medium   | Colour alone conveyed bulb temperature, network membership, circuit type, camera status. | Rows show status text (OK / DUE SOON / OVERDUE / WEAK / Online / Offline), colour-temperature text, and `aria-label`s naming networks and types (L).                                                                                                                                                                              |
| A-10 | Medium   | Unlabeled room `<select>`; zoom percentage unassociated.                                 | `aria-label` on the select; zoom percentage is a live `role="status"` that also announces minimum/maximum.                                                                                                                                                                                                                        |
| A-11 | Medium   | Single-key shortcuts could not be disabled or discovered.                                | "Single-key shortcuts" toggle in View options and the help sheet (persisted); `?` opens the shortcut sheet regardless; `?` and Escape always work.                                                                                                                                                                                |
| A-12 | Medium   | JS-driven auto-spin and tween ignored reduced motion.                                    | LIB `motion.ts` `tween()` jumps to the target under reduced motion; auto-spin and inertia refuse to start; CSS keeps the iteration-count rule.                                                                                                                                                                                    |
| A-13 | Low      | Fixed amber focus ring vanished on amber surfaces.                                       | Two-tone ring: `outline` in the text colour plus a `box-shadow` halo in the surface colour; dark overlays override the tokens.                                                                                                                                                                                                    |
| A-14 | Low      | Icon-only controls relied on `title`.                                                    | `aria-label` on zoom, view options, panel chevrons, clear search, close buttons, copy/export buttons.                                                                                                                                                                                                                             |
| A-15 | Low      | Demonstration labels shown without a "demo" cue.                                         | Feeds are `role="img"` named "demonstration camera preview, not live video"; labels read DEMO PREVIEW / DEMO HISTORY; the help sheet states the recorded/demonstration boundary. (Also closes V-08.)                                                                                                                              |
| A-16 | Low      | `aria-pressed` on the view switcher.                                                     | Retired by the follow-up; `aria-current="page"` was added alongside `aria-pressed`.                                                                                                                                                                                                                                               |

## Usability and quality of life (U)

| ID   | Severity | Finding (abridged)                                                  | Resolution                                                                                                                                                                                                   |
| ---- | -------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| U-01 | High     | Nothing persisted; no URL state.                                    | LIB `url-state.ts` encodes mode, selection, isolation, and separation in the hash; C restores it on load and on `hashchange`, and mirrors changes with `replaceState`. E2E restores `#m=upkeep&s=u5&f=main`. |
| U-02 | High     | No hover feedback on most controls.                                 | Shared `.ia` class gives hover/active states via brightness so inline backgrounds survive; `!important` hover overrides removed.                                                                             |
| U-03 | Medium   | Isolate and View options could overlap; no outside-click dismissal. | Opening one closes the other; a document `pointerdown` listener closes both outside `[data-popover]`; Escape closes them.                                                                                    |
| U-04 | Medium   | 170 ms blur timer could miss slow clicks.                           | Focus-within policy: the wrapper closes only when focus leaves it; option presses `preventDefault` so the input keeps focus.                                                                                 |
| U-05 | Medium   | 16-result cap with no way to see the rest.                          | Category chips with counts, exact-identifier ranking, and a "Show n more" control; choosing a category lists every match.                                                                                    |
| U-06 | Medium   | Choosing a hidden result left isolation active silently.            | `chooseResult` clears isolation when the target room is hidden and shows a notice; details show "Isolation hides this item" with a Show-all-rooms action.                                                    |
| U-07 | Medium   | Reset and mode switches snapped.                                    | Reset, presets, nudges, and fit use the shared `tween()`; mode switches cross-fade panel content and the stage tint.                                                                                         |
| U-08 | Medium   | No first-use affordance.                                            | One-time dismissable hint on Overview (persisted); prompts remain in Electrical/Lighting until a selection exists.                                                                                           |
| U-09 | Medium   | Room click selected only the first circuit.                         | Repeated clicks cycle through the room's circuits; each served room shows "+n more" to cycle; a notice names the count.                                                                                      |
| U-10 | Medium   | No shortcut sheet.                                                  | `?` and the top-bar help button open HS with keyboard, model, pointer/touch tables and the shortcuts toggle.                                                                                                 |
| U-11 | Medium   | Wheel zoom stepped 12 % with no zoom-to-cursor or bound cues.       | `zoomAt()` scales around the pointer with delta-proportional steps; +/− disable at 40 % / 400 % with `aria-disabled` and the status announces the bound.                                                     |
| U-12 | Low      | Only circuit rows toggled off.                                      | One convention: rows select and never toggle off.                                                                                                                                                            |
| U-13 | Low      | Timeline dots unlabeled; fill fixed.                                | Dots and tiles carry `aria-label`s with type, time, and duration; the fill spans from the oldest generated event to now (see N-29).                                                                          |
| U-14 | Low      | Isolate pill did not say what was isolated.                         | Pill reads "Isolate · Main" or "Isolate · 3 rooms" with an adjacent clear (×) button.                                                                                                                        |
| U-15 | Low      | Lists did not scroll the selection into view.                       | `componentDidUpdate` scrolls `#row-<id>` into view when the selection or mode changes.                                                                                                                       |
| U-16 | Low      | No copy/export.                                                     | Copy buttons on circuit tags and camera names; CSV export of the visible list in every mode (`export.ts`).                                                                                                   |
| U-17 | Low      | Street address in every build.                                      | Address and plat render only when `VITE_SHOW_ADDRESS=true` (see `apps/web/.env.example`); the header otherwise reads "April 147 · house atlas".                                                              |

## Layout and responsive behaviour (L)

| ID   | Severity | Finding (abridged)                                                | Resolution                                                                                                                                                                        |
| ---- | -------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L-01 | High     | Mobile hid the model behind two panels on first load.             | Narrow viewports start model-first: the list is collapsed, details are a bottom sheet (40 %/46 % of height), and the controls cluster offers List / Details / Show model toggles. |
| L-02 | High     | Fixed 960×600 `viewBox` letterboxed the model on phones.          | The SVG `viewBox` matches the stage in pixels and R fits the model to the area left free by the panels (`layoutFor()` in C); marker sizes scale with `ms`.                        |
| L-03 | Medium   | Prompt centred on the viewport and clipped under the right panel. | Prompt is centred on the free stage (`L.cx`) with `max-width` of the free area; entry animation runs on an inner element (N-37).                                                  |
| L-04 | Medium   | Narrow search truncated and popover too small.                    | Focusing search on a narrow viewport collapses the top bar to the field plus Cancel; results span the bar's width.                                                                |
| L-05 | Medium   | Narrow rail showed a scrollbar and cut off items.                 | `.nav-rail-row` hides the scrollbar and fades both edges; the active item scrolls into view on mode change (N-33).                                                                |
| L-06 | Medium   | Fixed three-column grid and 236 px history column.                | The demonstration grid was replaced by the live-camera dialog earlier; the review overlay stacks the history as a horizontal strip under the feed on narrow viewports.            |
| L-07 | Medium   | Panel toggles shifted `panX` by constants.                        | Layout (`leftPx`, `rightPx`, free centre, fit) is derived in one place from measured stage size and panel state; toggling a panel re-centres without touching `panX`.             |
| L-08 | Low      | Viewport defaulted to 1280×800 before mount.                      | Retired by the follow-up (already read from `window`); the stage is now measured with a `ResizeObserver`.                                                                         |
| L-09 | Low      | Floor labels collided with faces.                                 | Labels get a translucent background rect sized from the font metrics and stay right of the list panel.                                                                            |

## Motion and animation (M)

| ID   | Severity | Finding (abridged)                           | Resolution                                                                                                                                |
| ---- | -------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| M-01 | Medium   | Mode switches swapped in one frame.          | Details content fades in per mode (`.mode-fade`); the stage tint layer uses `currentColor` so the accent cross-fades (`StageBackground`). |
| M-02 | Medium   | Theme toggle snapped.                        | `setTheme` adds `html.theme-transition` for 320 ms (skipped under reduced motion).                                                        |
| M-03 | Medium   | Selection changes in the model were instant. | Faces carry `.face` with fill/stroke/opacity transitions and stable keys; transitions are suspended during drag.                          |
| M-04 | Low      | No exit animations.                          | LIB `presence.ts` keeps popovers, legend, prompt, and search results mounted for a `float-out` transition.                                |
| M-05 | Low      | No drag inertia.                             | Release velocity decays over subsequent frames (`startInertia`), disabled under reduced motion.                                           |
| M-06 | Low      | Two motion vocabularies.                     | One `tween()` helper drives explode, reset, presets, nudges, and fit.                                                                     |
| M-07 | Low      | Loops ran while hidden.                      | `visibilitychange` sets `html[data-hidden]` (CSS pauses animations) and suspends auto-spin and the clock.                                 |

## Visual polish (V)

| ID   | Severity | Finding (abridged)                           | Resolution                                                                                                                                                                                   |
| ---- | -------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V-01 | Medium   | Details panel mostly empty in several modes. | Every detail view lists related records for the room (`relatedForRoom` in CAT), room circuits for fixtures, other items in the room for upkeep, and a room summary in Overview (O-01/O-02).  |
| V-02 | Medium   | Fixed light model palette in dark mode.      | R uses theme-aware floor tops, strokes, halos, and a higher de-emphasis floor (0.34) in dark mode.                                                                                           |
| V-03 | Medium   | 30 font combinations.                        | Reduced to the scale in A-04 with two families (Inter, Plex Mono) and shared `FONT`/`MONO` constants.                                                                                        |
| V-04 | Low      | Mixed glyphs and stroke widths.              | `icons.tsx` provides one 16-unit, 1.5-stroke set used for close, chevrons, reset, expand, grid, bolt, note, help, copy, download, zoom, sliders, nudges.                                     |
| V-05 | Low      | 14 × 48 px hairline collapse tabs.           | 20 × 64 px tabs with icons, names, `aria-expanded`, and a hover reveal.                                                                                                                      |
| V-06 | Low      | Selection treatment differed per mode.       | `rowStyleFor()` gives every list the same lift plus inset ring in the mode accent; filter chips use the mode accent.                                                                         |
| V-07 | Low      | Breaker glyphs read louder than rooms.       | Smaller translucent marker with a theme-aware fill; still hidden outside the isolated floor.                                                                                                 |
| V-08 | Low      | Camera demos could pass for live video.      | See A-15.                                                                                                                                                                                    |
| V-09 | Low      | Missed delight moments.                      | Hover/focus room-name preview and `<title>` tooltips on markers, count-up on overview stats, confirmation toast when isolation clears, explicit empty states with a reset action in filters. |

## Things that already work well

Recorded so future changes do not regress them.

- Escape order for viewer, options, and isolation matches the visual stack, and
  the live-camera dialog now joins it.
- Search supports arrow keys with explicit first/last handling, Home/End, Enter,
  Escape-to-clear, and scrolls the active option into view.
- Explode/stack uses a proper eased tween; hover preview is mouse-only so touch
  taps are not lost.
- Theme is applied before first paint from `localStorage` or the OS preference.
- Wheel zoom uses a non-passive listener so the page does not scroll behind the
  model, and leaves Ctrl/⌘ + wheel to the browser.

## Verification

Re-run the [required gates](../../docs/testing.md#required-local-gates). The
browser suite covers repeated keyboard search and ArrowUp wrapping, Escape on the
live-camera dialog, modal containment of shortcuts and focus return, `aria-selected`
rows with filter-exclusion notices, inert collapsed panels, URL restoration,
keyboard model operation, zoom, and isolation. Manual checks used both themes at
1440×900, 900×600, 812×375, and 375×812. Screen-reader output and real touch
hardware remain unverified; see [limitations](../../docs/limitations.md).
