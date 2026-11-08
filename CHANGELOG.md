# Changelog

All notable changes to SmartHome are documented here.
The structure follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/). See the
[changelog update protocol](AGENTS.md#changelog-update-protocol) for contributor rules.

Work below is unreleased. Historical scaffold/prototype entries record earlier
states and are not descriptions of the current application layout.

## [Unreleased]

### Added

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
