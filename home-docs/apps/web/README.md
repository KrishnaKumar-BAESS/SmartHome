# HOUSE.SYS web application

Package: `@smarthome/home-docs`. A browser-only React application compiled with
Vite. Run workspace commands from the repository root; see
[development](../../../docs/development.md) for setup and scripts.

For product behavior, use the [user guide](../../docs/user-guide.md).
For inventory changes, use the [data model guide](../../docs/data-model.md).
For cross-subsystem context, read [architecture](../../../docs/architecture.md).

## Source map

| Entry point                                                     | Responsibility                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [index.html](index.html)                                        | Document metadata and root/module entry                                          |
| [src/main.tsx](src/main.tsx)                                    | Local fonts, global CSS, React Strict Mode root                                  |
| [src/app.tsx](src/app.tsx)                                      | Mount controller with the ink stage tone                                         |
| [src/data/house.ts](src/data/house.ts)                          | Inventory collections, floor geometry, mapping exports, inferred types           |
| [house-controller.jsx](src/features/house/house-controller.jsx) | Interaction state, view derivation, search index, mode data, animation lifecycle |
| [house-view.jsx](src/features/house/house-view.jsx)             | Compose the named main landmark and UI layers                                    |
| [house-stage.jsx](src/features/house/house-stage.jsx)           | SVG container and pointer/wheel event boundary                                   |
| [scene.jsx](src/features/house/scene.jsx)                       | Project room polygons and system overlays to SVG elements                        |
| [src/lib/css.ts](src/lib/css.ts)                                | Convert preserved CSS declaration strings to React style objects                 |
| [src/lib/keyboard.ts](src/lib/keyboard.ts)                      | Enter/Space activation for preserved clickable panels                            |
| [src/styles.css](src/styles.css)                                | Global styles, shared classes, and focus presentation                            |

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
| Camera demonstrations   | `camera-grid.jsx`, `camera-viewer.jsx`                          |

These remain JSX migration components. Avoid copying their large loosely typed
`view` contract into unrelated new features.

## Controller contract

`HouseController` extends React `Component`. It imports the recorded data
collections and initializes mode-specific selections, filters, and model state.
`renderVals()` computes display values, style strings, callbacks, and the SVG
element array that `HouseView` consumes.

The main state groups are:

- **Mode and selection:** active mode, selected circuit/bulb/node/zone/camera/sensor/upkeep record.
- **Filtering and search:** electrical/lighting/camera filters, query, and search focus.
- **Geometry:** yaw, pitch, zoom, pan, separation mode, and continuous `explodeT`.
- **Visibility:** floor/room isolation, side panels, labels, legend, view options,
  expanded camera, and camera grid.
- **Lifecycle:** viewport width, automatic rotation, and animation/listener handles.

Search indexes rooms, circuits, panels, lights, nodes, servers, cameras, sensors,
and upkeep records. It lowercases and tokenizes the query, requires every token
to match the indexed text, and displays at most 16 results. Choosing a result
applies a state patch and clears the query. Room results select scene isolation;
other results do not uniformly clear an existing isolation state.

Sound zones, some overview content, bulb room-name lookup, and camera-history
generation still live in the controller. Inventory extraction did not create
a complete domain layer.

## Renderer contract

`renderScene(house, options)` returns React SVG elements. It reads controller
state/data and helper methods; it is not a standalone renderer with a typed input
schema.

The renderer selects visible rooms, computes model bounds and scale, applies
yaw/pitch projection and pan, constructs floor/wall faces, sorts them by depth,
and adds mode-specific overlays. It uses `createElement` to build SVG nodes;
no dynamic source compilation occurs.

The stage uses a fixed `960 × 600` SVG viewBox and scales it to the available
viewport. Floor separation interpolates from stacked (`0`) through floors
(`1`) to exploded (`2`); exploded mode also spreads rooms horizontally.
Do not reinterpret these values as physical distances.

## Compatibility helpers

`css()` is a small adapter for the preserved declaration strings. It splits
declarations on semicolons and properties at their first colon, converts hyphenated
names to React-style keys, and preserves custom properties. It is not a general
CSS parser; arbitrary values containing semicolons are outside its simple model.

`activateOnKey()` triggers a panel's click on Enter or Space only when the panel
itself is the event target. The guard avoids treating activation of a nested
control as activation of its parent. Prefer semantic native controls for new UI.

## Lifecycle and responsive behavior

A resize listener updates the viewport width; `renderVals()` selects the narrow
layout below 900 pixels. A one-second interval refreshes the Security display,
including its demonstration clock. It does not poll a device.

Wheel handling is attached through the stage ref with `passive: false`.
Automatic spin and separation animation use requestAnimationFrame. Unmount
cleans up the controller's registered wheel/resize listeners, interval, and
animation frames. Changes to these paths must remain safe under React Strict Mode.

The current app has no URL state, storage adapter, backend API, service worker,
or persistent editing flow.

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
