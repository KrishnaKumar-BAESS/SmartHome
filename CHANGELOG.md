# Changelog

All notable changes to SmartHome are documented here.
The structure follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/). See the
[changelog update protocol](AGENTS.md#changelog-update-protocol) for contributor rules.

Work below is unreleased. Historical scaffold/prototype entries record earlier
states and are not descriptions of the current application layout.

## [Unreleased]

### Added

- Add a first-load intro to home-docs: the basement, main and second floors drop into place in turn while the camera eases round, the top bar, rail and panels slide in, and markers and labels fade in last. Any click, key or wheel input settles it at once; reduced-motion users start on the settled view.

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

- Overhaul the home-docs interface on one design system: shared colour, radius, elevation and motion tokens in `styles.css`; a single hex palette module (`palette.ts`) for views, statuses, circuit types and the 3D model; and class-based primitives (buttons, chips, segmented controls with sliding thumbs, list rows, key-value cards, callouts, badges, switches) in place of inline style strings. Each view now has its own accent, which tints the brand mark, rail indicator, stage glow, selection and focus rings. The rail, segmented controls and panels animate with spring easing; overview counts tick up; panels, popovers, dialogs and toasts share one entry motion; hover styles apply only on hover-capable pointers and touch targets grow on coarse pointers. The model gets a refined room palette, a world-fixed key light that shades walls as it turns, pill floor labels that shorten to level codes when space is tight, room labels that skip collisions and draw above markers, and accent-matched markers. Icon controls gain delayed mouse/keyboard tooltips with their shortcut keys; search opens with ⌘K / Ctrl+K and shows category icons and a keyboard footer; overview markers form one row under each room label; list rows badge only exceptions; long detail values stack; panel edges fade while scrolling; the phone details sheet hides by drag, tap or keyboard on its grip and the phone dock fits one row. The page gains an SVG favicon and a branded loading state. A measured design pass brings every derived text tone to WCAG AA in both themes, no visible text below 11 px, and every touch control (including open drawers, the isolate panel and camera review) to at least 40 px on coarse pointers; keyboard focus now reaches search and the views before the model, and focus in the model outlines the room or marker itself. Highlighted rooms emit a soft accent halo, ceiling edges read crisper than wall seams, and the phone model is sized to fill the space between the view row and the dock. Camera review letterboxes its demo feed at 16:9 with a floor grid, vignette and grain. Taglines and repeated disclaimers are condensed into footnotes while MOCK/REAL tags, demo labels and schematic notes remain. The CSS gzip budget rises to 12 kB because styling moved out of the JS bundle (JS fell about 5 kB gzip).

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
