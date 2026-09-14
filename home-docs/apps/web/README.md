# HOUSE.SYS web application

Package: `@smarthome/home-docs`. A browser-only React application compiled with
Vite. Run workspace commands from the repository root; see
[development](../../../docs/development.md) for setup and scripts.

For product behavior, use the [user guide](../../docs/user-guide.md).
For inventory changes, use the [data model guide](../../docs/data-model.md).
For cross-subsystem context, read [architecture](../../../docs/architecture.md).

## Source map

| Entry point                                                     | Responsibility                                                                     |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [index.html](index.html)                                        | Document metadata and root/module entry                                            |
| [src/main.tsx](src/main.tsx)                                    | Local fonts (Inter 400–600, Plex Mono 400–600), global CSS, Strict Mode root       |
| [src/app.tsx](src/app.tsx)                                      | Error boundary and controller mount with the ink stage tone                        |
| [vite.config.ts](vite.config.ts)                                | Vite/Vitest configuration and the font-preload plugin                              |
| [scripts/bundle-budget.mjs](scripts/bundle-budget.mjs)          | Gzip bundle and font-face budget checked after every production build              |
| [src/data/house.ts](src/data/house.ts)                          | Inventory collections, floor geometry, mapping exports, inferred types             |
| [house-controller.jsx](src/features/house/house-controller.jsx) | Interaction state, view derivation, search index, mode data, animation lifecycle   |
| [house-view.jsx](src/features/house/house-view.jsx)             | Compose the named main landmark and UI layers                                      |
| [house-stage.jsx](src/features/house/house-stage.jsx)           | SVG container and pointer/wheel event boundary                                     |
| [scene.jsx](src/features/house/scene.jsx)                       | Project room polygons and system overlays to SVG elements                          |
| [catalog.ts](src/features/house/catalog.ts)                     | Sound zones, room aliases, glossary, circuit-reference resolution, related records |
| [icons.tsx](src/features/house/icons.tsx)                       | One inline icon set on a 16-unit grid                                              |
| [src/lib/css.ts](src/lib/css.ts)                                | Convert (and cache) preserved CSS declaration strings as React style objects       |
| [src/lib/keyboard.ts](src/lib/keyboard.ts)                      | Enter/Space activation and listbox arrow-key movement                              |
| [src/lib/motion.ts](src/lib/motion.ts)                          | Reduced-motion check and the shared `tween()`                                      |
| [src/lib/url-state.ts](src/lib/url-state.ts)                    | Encode/decode the shareable view in the URL hash                                   |
| [src/lib/export.ts](src/lib/export.ts)                          | CSV serialisation, download, and clipboard helpers                                 |
| [src/lib/presence.ts](src/lib/presence.ts)                      | Keep closing overlays mounted for their exit transition                            |
| [src/styles.css](src/styles.css)                                | Global styles, shared classes, and focus presentation                              |

## View components

Components receive the derived `view` object; the controller owns application
state and provides callbacks through it.

| Component group         | Files under `src/features/house/`                               |
| ----------------------- | --------------------------------------------------------------- |
| Navigation and search   | `navigation.jsx`, `top-bar.jsx`                                 |
| Inventory and selection | `system-list.jsx`, `system-details.jsx`, `selection-prompt.jsx` |
| Panel visibility        | `list-toggle.jsx`, `details-toggle.jsx`                         |
| Model configuration     | `isolation-panel.jsx`, `view-controls.jsx`, `scene-legend.jsx`  |
| Model backdrop          | `stage-background.jsx`, `stage-grid.jsx`, `stage-vignette.jsx`  |
| Camera demonstrations   | `camera-viewer.jsx`, `feed-clock.tsx`                           |
| Help, notices, print    | `help-sheet.jsx`, `notice-toast.jsx`, `print-inventory.tsx`     |
| Live camera integration | `live-cameras.tsx`, `live-cameras.css`                          |

Existing JSX components remain migration code. The live-camera dialog is strict
TypeScript and embeds the same-origin security player. Avoid copying the large loosely typed
`view` contract into unrelated new features.

## Controller contract

`HouseController` extends React `Component`. It imports the recorded data
collections and initializes mode-specific selections, filters, and model state
(restoring mode, selection, isolation, and separation from the URL hash).
`render()` calls `deriveView()`, which caches the panel view object until a
non-camera state key changes, and `deriveScene()`, which re-projects the SVG
only when camera state or scene options change. `HouseView` memoises every
panel on the `view` reference so drag, auto-spin, and the explode tween only
re-render the stage.

The main state groups are:

- **Mode and selection:** active mode, selected room/circuit/panel/bulb/node/server/zone/camera/sensor/upkeep record.
- **Filtering and search:** electrical/lighting/camera/upkeep filters, query, popup state, category, and "show all".
- **Camera (excluded from the view cache):** yaw, pitch, zoom, pan, continuous `explodeT`, hover room, dragging.
- **Visibility:** floor/room isolation, side panels, labels, legend, view options,
  help sheet, demonstration history viewer, live-camera panel, and notices.
- **Preferences:** theme choice (system/light/dark), single-key shortcuts, first-run hint.
- **Lifecycle:** measured stage size, automatic rotation, and animation/listener handles.

The search index is built once and covers rooms, circuits, panels, fixture
records, networks, nodes, servers, sound zones, cameras, sensors, and upkeep
records with their displayed specifications. Queries are tokenized; every token
must match; exact identifiers rank first; results are capped at 16 until a
category is chosen or "show more" is used. Choosing a result reveals the
destination panel, moves focus to the record's row, and clears an isolation that
would hide it.

Sound zones, room aliases, the glossary, circuit-reference resolution, and
related-record lookups live in `catalog.ts`; camera-history generation and
overview copy still live in the controller.

## Renderer contract

`renderScene(house, options)` returns React SVG elements. It reads controller
state/data and helper methods; it is not a standalone renderer with a typed input
schema.

The renderer selects visible rooms, computes model bounds and scale, applies
yaw/pitch projection and pan, constructs floor/wall faces, sorts them by depth,
and adds mode-specific overlays. It uses `createElement` to build SVG nodes;
no dynamic source compilation occurs.

The SVG viewBox matches the measured stage in CSS pixels; `layoutFor()` in the
controller computes the stage area left free by the panels, and the renderer
fits and centres the model there (`fit`, `cx`, `cy`) with marker sizes scaled
by `ms`. Room top faces and markers are named, focusable buttons. Floor
separation interpolates from stacked (`0`) through floors (`1`) to exploded
(`2`); exploded mode also spreads rooms horizontally. Do not reinterpret these
values as physical distances.

## Compatibility helpers

`css()` is a small adapter for the preserved declaration strings. It splits
declarations on semicolons and properties at their first colon, converts hyphenated
names to React-style keys, and preserves custom properties. It is not a general
CSS parser; arbitrary values containing semicolons are outside its simple model.

`activateOnKey()` triggers a panel's click on Enter or Space only when the panel
itself is the event target. The guard avoids treating activation of a nested
control as activation of its parent. Prefer semantic native controls for new UI.

## Lifecycle and responsive behavior

A `ResizeObserver` on the stage updates the layout; the narrow layout applies
below 760 pixels, one-panel behaviour below 1000 pixels, and short viewports
(below 520 pixels tall) hide summary rows. The demonstration clock lives in
`FeedClock` and does not poll a device.

Wheel handling is attached through the stage ref with `passive: false` and
leaves Ctrl/⌘ + wheel to the browser. Automatic spin, inertia, and tweens use
requestAnimationFrame and honour `prefers-reduced-motion`. Unmount cleans up the
controller's listeners, observers, timers, and animation frames. Changes to
these paths must remain safe under React Strict Mode.

The URL hash carries mode, selection, isolation, and separation;
`localStorage` holds theme, shortcut, and hint preferences. There is no storage
adapter, backend API, service worker, or persistent editing flow.
`VITE_SHOW_ADDRESS=true` (see [.env.example](.env.example)) opts in to showing
the street address.

## Verification and change guidance

[Unit tests](src/data/house.test.ts) protect migration parity and selected
relationships. [Browser tests](e2e/house.spec.ts) exercise the eight modes and
key interactions on desktop and mobile Chromium.
[Testing](../../../docs/testing.md) explains coverage and omissions.

New modules use strict TypeScript. The existing configuration allows JS but
does not statically check it; incremental conversion should establish typed
contracts and preserve behavior. Use the data guide for baseline changes and
the [limitations register](../../../docs/limitations.md) for known constraints.

Production output is `dist/`. Host it using the
[deployment runbook](../../../docs/deployment.md).
