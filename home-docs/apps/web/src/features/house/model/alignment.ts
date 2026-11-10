/**
 * Placement of the Blender house model in the atlas's room coordinates.
 *
 * The atlas rooms are prototype geometry, the model is an estimated
 * reconstruction; this is a single best-fit similarity (uniform scale and a
 * shift, no rotation) between their main-floor footprints, not a survey.
 * Blender axes: +X east-ish, +Y away from the garage, +Z up, metres.
 */
export const METRES_PER_UNIT = 3.02;
/** Blender coordinates of the atlas origin (x = 0, y = 0, main floor). */
export const MODEL_ORIGIN = { x: -1.79, y: 4.19, z: 2.44 } as const;
const STOREY_M = 2.44;

/** Scene layout overrides (atlas units) used while the model is on stage. */
export const MODEL_LAYOUT = {
  storey: STOREY_M / METRES_PER_UNIT,
  /** Height of the roof above the second-floor ceiling. */
  roof: 2.45 / METRES_PER_UNIT,
} as const;

export const MODEL_FLOORS = ['basement', 'main', 'second', 'roof'] as const;
export type ModelFloor = (typeof MODEL_FLOORS)[number];

/** Camera and floor placement the scene hands to the WebGL layer. */
export type StageCamera = {
  cx: number;
  cy: number;
  cz: number;
  scale: number;
  sx: number;
  sy: number;
  yaw: number;
  pitch: number;
  vw: number;
  vh: number;
  light: boolean;
  floors: Record<ModelFloor, { dz: number; opacity: number; visible: boolean }>;
};

/**
 * Row-major 4×4 taking glTF coordinates (Y up, as Blender exports them) to
 * atlas room coordinates (Z up).
 */
export function atlasFromGltf(): number[] {
  const k = 1 / METRES_PER_UNIT;
  const o = MODEL_ORIGIN;
  // glTF (X, Y, Z) = Blender (x, z, −y).
  return [k, 0, 0, -o.x * k, 0, 0, -k, -o.y * k, 0, k, 0, -o.z * k, 0, 0, 0, 1];
}

/**
 * Row-major 4×4 taking atlas coordinates to stage pixels with Y up and depth
 * on −Z, matching the SVG scene's orthographic `project()` exactly.
 */
export function stageFromAtlas(c: StageCamera): number[] {
  const cyw = Math.cos(c.yaw),
    syw = Math.sin(c.yaw),
    cp = Math.cos(c.pitch),
    sp = Math.sin(c.pitch),
    s = c.scale;
  const rows = [
    [s * cyw, -s * syw, 0],
    [s * syw * sp, s * cyw * sp, s * cp],
    [-s * syw * cp, -s * cyw * cp, s * sp],
  ];
  const shift = [c.sx, c.vh - c.sy, 0];
  return [
    ...rows.flatMap((r, i) => [
      r[0],
      r[1],
      r[2],
      shift[i] - (r[0] * c.cx + r[1] * c.cy + r[2] * c.cz),
    ]),
    0,
    0,
    0,
    1,
  ];
}
