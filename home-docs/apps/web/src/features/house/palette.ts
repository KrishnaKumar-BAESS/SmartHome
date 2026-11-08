/**
 * The one colour source for the house atlas. Every value is a six-digit hex
 * string because the controller and scene renderer blend them with
 * `hexA()` / `mix()`; CSS custom properties cannot be parsed there.
 *
 * Text never uses these raw values directly: styles.css derives readable
 * text and tinted surfaces from them with `color-mix()` against the theme's
 * text colour, so one accent works in both light and dark themes.
 */

/** One accent per documentation view. */
export const MODE_ACCENT = {
  overview: '#7b83f6',
  electrical: '#4b8cf5',
  lighting: '#f2b33d',
  network: '#22b8a5',
  sound: '#a374f2',
  security: '#f0644d',
  climate: '#3ab0e6',
  upkeep: '#e3679f',
} as const;

export type ModeKey = keyof typeof MODE_ACCENT;

/** Recorded status. Shared by fixtures, upkeep, cameras and nodes. */
export const STATUS = {
  ok: '#3dba7e',
  soon: '#ec9a35',
  overdue: '#ef5b4b',
  warn: '#ec9a35',
  idle: '#8d97a6',
  live: '#ff5a50',
  history: '#efc05e',
  real: '#3dba7e',
} as const;

/** Circuit type colours (electrical legend, list dots, wiring glow). */
export const CIRCUIT_TYPE = {
  Lighting: '#f2b33d',
  Outlets: '#4b8cf5',
  Appliance: '#f0644d',
  Mixed: '#22b8a5',
} as const;

/** Floor identity used in served-room dots. */
export const FLOOR = {
  second: '#7b83f6',
  main: '#22b8a5',
  basement: '#e3679f',
} as const;

/** Neutral room accent used by search results. */
export const ROOM = '#8d97a6';

/**
 * Network colours are stored with the recorded network inventory. The
 * atlas restyles them here without editing the inventory itself.
 */
const LEGACY_NETWORK: Record<string, string> = {
  '#3b6fb0': '#4b8cf5',
  '#3f9a8c': '#22b8a5',
  '#c0892f': '#ec9a35',
};

export function networkColor(recorded: string): string {
  return LEGACY_NETWORK[recorded.toLowerCase()] ?? recorded;
}

/** Speaker diagram marker colours. */
export const SPEAKER = {
  main: '#4b8cf5',
  height: '#22b8a5',
  sub: '#f0644d',
} as const;

/** Demonstration event colours on the camera history timeline. */
export const CAMERA_EVENT = {
  Motion: '#ec9a35',
  Person: '#4b8cf5',
  Vehicle: '#22b8a5',
  Package: '#a374f2',
  Ring: '#f0644d',
} as const;
