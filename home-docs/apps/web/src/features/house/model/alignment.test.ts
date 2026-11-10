import { describe, expect, it } from 'vitest';
import {
  atlasFromGltf,
  MODEL_LAYOUT,
  stageFromAtlas,
  type StageCamera,
} from './alignment';

const apply = (m: number[], [x, y, z]: number[]) =>
  [0, 1, 2].map(
    (r) => m[r * 4] * x + m[r * 4 + 1] * y + m[r * 4 + 2] * z + m[r * 4 + 3],
  );

const camera: StageCamera = {
  cx: 3.4,
  cy: 0.4,
  cz: 0.2,
  scale: 52,
  sx: 700,
  sy: 480,
  yaw: (35 * Math.PI) / 180,
  pitch: (58 * Math.PI) / 180,
  vw: 1440,
  vh: 1000,
  light: true,
  floors: {
    basement: { dz: 0, opacity: 1, visible: true },
    main: { dz: 0, opacity: 1, visible: true },
    second: { dz: 0, opacity: 1, visible: true },
    roof: { dz: 0, opacity: 1, visible: true },
  },
};

// The SVG scene's projection, restated independently of the matrix.
function svgProject(c: StageCamera, x: number, y: number, z: number) {
  x -= c.cx;
  y -= c.cy;
  z -= c.cz;
  const X1 = x * Math.cos(c.yaw) - y * Math.sin(c.yaw);
  const Y1 = x * Math.sin(c.yaw) + y * Math.cos(c.yaw);
  const Y2 = Y1 * Math.cos(c.pitch) - z * Math.sin(c.pitch);
  const Z2 = Y1 * Math.sin(c.pitch) + z * Math.cos(c.pitch);
  return { sx: X1 * c.scale + c.sx, sy: -Z2 * c.scale + c.sy, depth: Y2 };
}

describe('Blender model alignment', () => {
  it('projects atlas points to the same pixels as the SVG scene', () => {
    const m = stageFromAtlas(camera);
    for (const p of [
      [0, 0, 0],
      [6.95, -2.2, 1.1],
      [1.3, 3.05, -0.9],
    ]) {
      const want = svgProject(camera, p[0], p[1], p[2]);
      const [px, py, pz] = apply(m, p);
      expect(px).toBeCloseTo(want.sx, 6);
      // WebGL's Y axis points up; farther points have smaller Z.
      expect(camera.vh - py).toBeCloseTo(want.sy, 6);
      expect(pz).toBeCloseTo(-want.depth * camera.scale, 6);
    }
  });

  it('keeps handedness so faces are not turned inside out', () => {
    for (const m of [stageFromAtlas(camera), atlasFromGltf()]) {
      const det =
        m[0] * (m[5] * m[10] - m[6] * m[9]) -
        m[1] * (m[4] * m[10] - m[6] * m[8]) +
        m[2] * (m[4] * m[9] - m[5] * m[8]);
      expect(det).toBeGreaterThan(0);
    }
  });

  it('puts the modeled floor datums on the atlas floors', () => {
    const m = atlasFromGltf();
    // glTF Y is Blender Z: 0 m basement slab, 2.44 m main, 4.88 m second.
    expect(apply(m, [0, 0, 0])[2]).toBeCloseTo(-MODEL_LAYOUT.storey, 6);
    expect(apply(m, [0, 2.44, 0])[2]).toBeCloseTo(0, 6);
    expect(apply(m, [0, 4.88, 0])[2]).toBeCloseTo(MODEL_LAYOUT.storey, 6);
    // The garage's outer corner (Blender −1.79, −2.45) is the atlas's (0, −2.2).
    const corner = apply(m, [-1.79, 2.44, 2.45]);
    expect(corner[0]).toBeCloseTo(0, 2);
    expect(corner[1]).toBeCloseTo(-2.2, 1);
  });
});
