# Changelog

All notable changes to SmartHome are documented here.
The structure follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/). See the
[changelog update protocol](AGENTS.md#changelog-update-protocol) for contributor rules.

Work below is unreleased. Historical scaffold/prototype entries record earlier
states and are not descriptions of the current application layout.

## [Unreleased]

### Added

- Spread and isolate the basement's rooms on the Blender model stage: its geometry is divided among the atlas room outlines when the model loads (long walls and slabs cut at room edges, small objects kept whole), so **Exploded** separates basement rooms and room isolation hides the others. Other floors stay whole until listed in `MODEL_LAYOUT.roomFloors`.
- Draw the Blender house model as the home-docs stage when a build includes its export (`models/house.glb`, a local build input ignored by Git): a WebGL canvas follows the scene's camera under the SVG markers and labels, floors separate and isolate as before, and the roof sits on the stacked house. **View options → House** switches back to the schematic, which also remains the fallback without the export or WebGL. Three.js loads lazily with its own bundle budget; `scripts/export-house-model.py` produces the export. See `home-docs/docs/blender-model.md`.
- Add an offline shell for the installed app on the private HTTPS hostnames: a conservative service worker keeps the last loaded copy and its hashed assets, never caches Pi-hole or health responses, and the app says when it is showing that copy because the house server is unreachable. Plain-HTTP LAN addresses cannot run service workers and are unchanged. Its dialogs (help, camera review, live cameras) are fetched once the page is idle so the offline copy can open them.
- Make home-docs installable on phone and tablet home screens: a web app manifest, standard, maskable and Apple touch icons under `assets/`, and standalone display; the host serves `.webmanifest` as `application/manifest+json`.
- Show the running home-docs build in the UI: the version and commit (marked `-dirty` for uncommitted builds) beside the brand (commit only on tablets; click to copy), at the foot of View options and the help sheet with the build time, and in the print header.
- Add `e2e/design-qa.spec.ts`: measured WCAG AA contrast for derived tones and model text in both themes, an 11 px text floor, 40 px coarse-pointer touch targets, and no overlapping panel-header items at 1024 px, no overlapping model labels, and model translucency that survives entrance fades.
- Add a View options **Scroll gesture** setting (Auto, Pan, Zoom) that overrides trackpad/mouse detection.

- Add a first-load intro to home-docs (played once per browser session; reloads open settled): the basement, main and second floors drop into place in turn while the camera eases round, the top bar, rail and panels slide in, and markers and labels fade in last. Any click, key or wheel input settles it at once; reduced-motion users start on the settled view.

- Label all home-docs inventory as placeholder / mock data, with MOCK DATA tags on every list and detail panel, and add REAL DATA tags for household-recorded entries: the water softener's location (moved from the garage to the basement boiler room) and its first refill log entry (2 bags of pellets, 2026-11-07). Owner-confirmed corrections live in `household-corrections.fixture.json`; the agent API reports `provenance.default: 'mock'`.

- Show a persistent development disclaimer on every home-docs view and add a LAN host for built assets and the read-only Pi-hole summary.

- Add a read-only Pi-hole stats panel to home-docs, with a server-side development/preview connection, automatic refresh, setup/error states, and a full-dashboard shortcut that preserves the SmartHome tab.

- Add a versioned home-docs agent API for structured inventory discovery, view control, and change subscriptions. Add authenticated local HTTP access to connected atlas tabs and an administrator console for creating, editing, expiring, and revoking scoped API keys.

- Replace home-docs fictional networking with the October 14 LAN discovery: real SSIDs, eight devices, searchable IP/MAC addresses, discovery evidence, location confidence, and enriched CSV/print exports. Place the owner-confirmed Parlor host and Office NETGEAR R7000 at their specified walls; draw only the observed host-to-gateway link.

- Remediate every finding in the home-docs UI audit and its follow-up: keyboard-operable model (focusable stage, arrow-key rotate/tilt/pan, named room and marker buttons), combobox search with a shared keyboard model for results and suggestions, category chips, exact-identifier ranking, and "show more"; `aria-selected` record rows with live announcements; native dialogs for camera review and help; URL-hash state for mode, selection, isolation, and separation; room summaries and cross-system related-record links; unverified circuit-reference badges, floor-mapping notices, snapshot labels, and schematic labels for recorded data; CSV export and copy buttons; a help sheet with a single-key shortcut toggle; System/Light/Dark theme; orientation presets, fit, and tap-only nudge controls; pinch and two-finger pan; print inventory tables; startup and render-failure fallbacks; a gzip bundle budget in `pnpm build` with font preloads; and five new browser scenarios.
- Add `VITE_SHOW_ADDRESS` (see `home-docs/apps/web/.env.example`) to opt in to showing the street address; it is hidden by default.
- Add a `home-docs-dev` Claude Code launch configuration for the Vite dev server.

- Add a checked-in Claude Code `launch.json` that previews the built security service on port 4319 without Xfinity configuration.

- Add Windows account sign-in, encrypted credential persistence, automatic renewal, and camera reconnection to Security; keep ADB import as an optional diagnostic fallback.

- Integrate verified Xfinity playback into SmartHome's Security view through the local security service; preserve the existing Xfinity app connection and clearly label inventory previews/history as demonstrations.

- Add a local security camera prototype with ADB session import, restricted Xfinity signaling, WebRTC playback, and explicit live-validation requirements.

- Add a dated home-docs UI audit logging performance, accessibility, usability, responsive, motion, and visual findings with source references.
- Add a light/dark theme toggle to the home-docs top bar; the choice persists in `localStorage` and is applied before first paint to avoid flashes.
- Add home-docs keyboard shortcuts (`/` search, `1`–`8` views, `+`/`-` zoom, `0` reset, Escape closes overlays), arrow-key navigation in search results, and a hover highlight on clickable rooms in the model.
- Add pnpm workspace commands, a pinned toolchain and lockfile, ESLint, Prettier, Vitest, and Playwright.
- Add CI checks and dependency update configuration.
- Add inventory migration parity and reference-integrity tests plus desktop/mobile browser checks.
- Add user, data-model, testing, deployment, privacy, and documentation-maintenance guides with a central documentation index and contributor workflow.
- Establish the subsystem-first repository scaffold, contributor/agent guides, architecture documentation, glossary, and initial architecture decision.
- Reserve `security/` and `platforms/` for deliberate future integrations.
- Introduce the original home-documentation prototype with an interactive model and eight documentation modes; its former `home-docs/app/` sources are now preserved under `docs/archive/home-documentation/`.

### Changed

- 0.74.0: the Climate list's "sensors are planned" alert lines up with the rows below it; it was inset 4 px more on each side. A design QA test checks list alerts against row edges in Climate and Network.
- 0.73.0: detail panels share one vertical rhythm: 14 px between blocks, 12 px above notes and 22 px above sections. Eight blocks sat at 10, 12 or 16 px. A design QA test checks every mode's detail panel.
- 0.72.0: circuit rows are the same 49 px as every other two-line list row; the tag's mono font had reset the name line's height and made them 53 px. A design QA test compares row heights across modes.
- 0.71.0: circuit rows set their tag on the name's line (it sat 7 px low, between the two lines) and indent the amperage line to start under the name. The circuit-name design QA test now checks both.
- 0.70.0: Electrical list rows use the same two lines as every other list: tag and circuit name, then amperage and type ("15 A · Lighting"). Ten of the 24 circuit names were cut off on desktop when amperage shared their line. A design QA test checks that no circuit name is cut off.
- 0.69.0: with the details panel hidden, its "Show the details panel" tab tucks inside the window; it used to hang half off the right edge (at every width, and by default from 768 to 900 px). A design QA test checks it at 1440 and 768 px.
- 0.68.0: Isolate lists floors top-down (All · Second · Main · Basement), matching its room sections and the level chips; "2nd" now reads "Second". The getting-started hint steps aside while Isolate is open instead of running under it. Design QA tests cover both.
- 0.67.0: Help lists only gestures the device can do: phones get a Touch table (drag, pinch, two-finger drag, double-tap) instead of mouse wheel and middle-drag rows, and desktops get Mouse & trackpad. All Help tables now share one column line. A design QA test covers both.
- 0.66.0: on phones, View options is opaque like the List, and the getting-started hint steps aside while either covers it instead of peeking out half-hidden. Design QA tests cover both.
- 0.65.0: the View options drawer is inset from the dock's edge and scrolls inside itself. On phones its content used to spill over the List and Details buttons. A design QA test checks the inset and that the drawer stays above the dock bar.
- 0.64.0: amperage reads "15 A" everywhere, with a no-break space so it never splits across lines. Search results, circuit rows and circuit details previously read "15A" while related-record rows read "15 A". A design QA test covers list, details and search.
- 0.63.0: on phones the List panel is opaque, like the full-height details sheet, so the stage hint and room labels no longer ghost through its glass. A design QA test checks it.
- 0.62.0: even text rag. Detail headings balance their lines, and subtitles, notes and callouts never leave one word alone on the last line (for example "platforms" under Home Theater). A design QA test checks every mode's detail panel on desktop and phone.
- 0.61.0: Sound lights up only the selected zone's room, like every other mode; it used to light both zone rooms equally, so the model did not show which zone was open. A design QA test checks one highlighted room per selection in Sound, Security, Climate and Upkeep.
- 0.60.0: the Sound speaker diagram drops its "Schematic" tag, which covered the front-left speaker and repeated the note below it. A design QA test checks that no diagram labels overlap.
- 0.59.0: a planned climate sensor says "Planned" once (the badge) instead of repeating it in a banner; the empty temperature and humidity tiles now tell screen readers "No reading" instead of being hidden. A design QA test covers both.
- 0.58.0: on desktop, Electrical and Lighting give their "pick a circuit / fixture" instruction once, on the stage, instead of repeating it under the panel heading; phones keep it in the details sheet. A design QA test checks it appears exactly once.
- 0.57.0: Upkeep's summary tiles match Lighting's: Total · OK · Due soon · Overdue, in that order.
- 0.56.0: Lighting and Upkeep share one status filter vocabulary (All · Needs attention · Due soon · Overdue); Upkeep gains a Due soon filter and Lighting's "Soon" reads "Due soon" to match the status tags.
- 0.55.0: list headers count records consistently: filterable lists read "N of M" (Circuits previously read "24 shown"), and Sound zones shows its zone count.
- 0.54.0: detail panels no longer repeat their heading in the specs (upkeep Device rows, network Model rows that match the device name); upkeep notes use the info icon instead of a music note. A design QA test checks every view for repeated headings.
- 0.53.0: sound-zone speaker markers sit on their schematic positions (the pop-in animation had replaced their centring transform, shifting every marker 11 px and clipping the subwoofers); the `pop` animation now animates `scale` so it cannot override a positioning transform. Climate sensor details show the floor under the name instead of repeating the mount.
- 0.52.0: breaker panel details lead with the panel name (code and location beneath) instead of the bare code; fixture details no longer repeat the room circuits under "Also in".
- The home-docs version now advances with each deployed iteration (0.51.0 for this one) so the UI version tag shows which release is running, not only its commit.
- Breaker panel cards show their documented spaces (for example 13/34) in the card header, so both cards align instead of the count wrapping under one legend and not the other.
- The phone details sheet turns opaque when expanded to full height, so the gesture hint and dock beneath it no longer ghost through the glass.
- The home-docs host compresses text assets (Brotli, or gzip as a fallback) once per file off the event loop and sends `Vary: Accept-Encoding`; the main bundle transfers at about 110 kB instead of 423 kB, which matters most over Tailscale and mobile data.
- Search, Isolate and View options reference their popups with `aria-controls` only while the popup exists, so assistive technology never follows a dangling reference; a design QA test audits every view for unnamed controls, duplicate ids and broken ARIA references.
- On phones the active mode tab no longer sits clipped under the mode row's edge fade (the row keeps end padding while scrolled).
- The Pi-hole stats dialog closes with **Close** and the shared close icon, matching the other dialogs.
- Refine the printed inventory: hairline row rules instead of a full grid, small uppercase column headers over a dark rule, tabular figures, and short columns (codes, amps, dates, statuses) kept on one line.
- Keyboard: Tab now moves from the View options button straight into its open drawer (the drawer follows the bar in the DOM and is still drawn above it).
- The Live cameras overlay uses the shared dialog button and close icon, with hover feedback on its setup link.
- Narrowing a window into the phone layout (split view, a rotated tablet, or a resized desktop window) closes the List, so the List and the Details sheet no longer cover the whole model; the List button reopens it.
- On short windows such as landscape phones, the mode rail fades at its scrolling edge so the modes below the fold are discoverable.
- The search placeholder shortens on tablet-width windows (under 900 px) and ellipsizes instead of clipping mid-word into the ⌘K hint.
- On phones the help sheet stacks each control above its effect, so descriptions use the full width instead of a narrow wrapped column.
- Truncated list and search labels show their full text in a tooltip on mouse hover; tooltips wrap long text within their 260 px width instead of overflowing.
- Overview names the source of each attention count: "upkeep replacements due" in the alert card and "light fixture records" above the fixture list, so the two different totals no longer read as a contradiction.

- Rebuild the home-docs interface on one design system: colour, radius, elevation and motion tokens in `styles.css`, one hex palette (`palette.ts`), and class-based primitives (buttons, chips, segmented controls, list rows, key-value cards, callouts, badges, switches) in place of inline style strings. Each view has its own accent, used for the brand mark, rail indicator, stage glow, selection and focus.
- Model: world-lit walls, distance fade, floor plates under separated floors with label leaders, collision-free room labels, accent halos and named callouts for selections, quieter unselected camera cones, legible badges and panel codes, and isolation zooms in at most 1.6× the whole-house fit. Overlay fade-ins now end at each element's own opacity, so marker halos and selection glows keep their intended translucency.
- Panels: default content when nothing is selected (breaker-panel cards, fixture health), overview composition bars, exception-only row badges, stacked long values, scroll-edge fades, merged duplicate alerts, a single live-cameras entry, and headers that wrap cleanly at compact widths.
- Search: ⌘K / Ctrl+K, category icons, recent records, a keyboard footer, and full-screen results on phones.
- Motion: sliding rail and segmented indicators, spring panels, count-up stats, overlay fades on view change, a circular theme reveal, and a selection that glides into view when a panel hides it; reduced motion is respected throughout.
- Input: trackpad two-finger scroll pans and pinch zooms (with a Scroll gesture override), mouse wheel zooms, double-click or double-tap zooms to a spot, Escape steps back out of a selection, and model markers get styled tooltips.
- Phone and tablet: one-row dock, expandable details sheet with a draggable grip, a larger model, side-rail layout for landscape phones, and full-screen isolate.
- Accessibility: an Increase-contrast (`prefers-contrast: more`) variant with firmer lines and darker secondary text, AA contrast for UI and model text in both themes, an 11 px text floor, 40 px touch targets on coarse pointers, chrome before the model in tab order, and in-place focus outlines in the model.
- The CSS gzip budget rises to 14 kB because styling moved out of the JS bundle; the page gains an SVG favicon and a branded loading state.

- Rework the home-docs layout and rendering: the model is fitted to the stage area left free by the panels, narrow viewports start model-first with a details sheet, one side panel opens at a time below 1000 px, panels are memoised apart from camera state, the demo clock is a leaf component, the search index is built once, text sizes and contrast tokens meet the audited floor, hover/active/focus states are shared, and motion (mode cross-fade, theme transition, face transitions, exit animations, inertia) honours reduced motion.
- Convert the home-docs UI audit and follow-up into resolution logs and update the limitations, user guide, and testing documentation accordingly.

- Restyle the Security live-camera player and its overlay to match the house atlas: shared Inter/IBM Plex Mono typography, the dark feed treatment, terracotta actions, one-click camera tiles in place of the dropdown and Connect button, a LIVE/CONNECTING/RETRYING feed tag, and Escape closing the overlay from inside the player. Remove the superseded demonstration camera grid.

- Expand the home-docs UI audit with 41 additional findings, 8 optional improvements, wider workflow and viewport evidence, and corrections to the initial audit.

- Replace the home-docs hard-coded dark palette with a token-driven theme system; a clean light theme is now the default and the dark palette is preserved as a selectable theme. Security camera feeds intentionally stay dark in both themes.
- Switch the home-docs UI typeface from IBM Plex Sans to Inter (IBM Plex Mono retained for data/labels).
- Refresh the home-docs shell with floating glass chrome (top bar, nav rail and panels), a mode-tinted backdrop, an accent-glow active view, and a grounded shadow under the house model.
- Modernize home-docs with native React 19 components, Vite 8, typed inventory, and locally bundled fonts.
- Organize home-docs into `apps/web/` and `reference/`; archive the original DC app intact outside production assets.
- Reconcile repository guidance with the active implementation, clarify recorded/demo data and test limits, and document the evolution from scaffold to shared workspace tooling.
- Restore the canonical changelog protocol and distinguish historical plans from current contributor instructions.

### Fixed

- Keep home-docs single-finger rotation active when touch capture transfers from the house SVG to the stage, and clear the dragging cursor on release.

- Allow SmartHome access from Tailscale clients through an explicit second listener while retaining LAN access and Host/origin checks.

- Accept and safely encode Comcast's routed signaling session IDs in the camera prototype; verify real video from all three household cameras with existing Xfinity app access preserved.

- Match the camera prototype's outgoing ICE candidate payload to the Xfinity Android app protocol.

- Keep home-docs floor labels legible: clamp them clear of the list panel and halo them against room faces.
- Clear and dismiss the home-docs search field with the Escape key.
- Give home-docs speaker-layout markers unique React keys, silencing console errors in Sound views.
- Keep home-docs model controls and floor isolation inside mobile viewports.
- Exclude generated `.delta/` worktrees from formatting so nested historical sources remain untouched.
