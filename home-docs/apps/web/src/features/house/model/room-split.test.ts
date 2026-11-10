import { describe, expect, it } from 'vitest';
import { rooms } from '../../../data/house';
import {
  buildRoomCells,
  roomAt,
  splitTriangle,
  type Vertex,
} from './room-split';

const two = [
  {
    id: 'west',
    verts: [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ],
  },
  {
    id: 'east',
    verts: [
      [2, 0],
      [5, 0],
      [5, 2],
      [2, 2],
    ],
  },
];

const v = (x: number, y: number, z = 0): Vertex => [x, y, z, 0, 0, 1];
const area = (a: Vertex, b: Vertex, c: Vertex) =>
  ((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;

describe('room ownership for model geometry', () => {
  it('gives every point to the room holding it, or the nearest', () => {
    const cells = buildRoomCells(two);
    expect(roomAt(cells, 1, 1)).toBe('west');
    expect(roomAt(cells, 4, 1)).toBe('east');
    // An exterior wall just outside the outlines goes with its room.
    expect(roomAt(cells, -0.3, 1)).toBe('west');
    expect(roomAt(cells, 5.2, 2.4)).toBe('east');
  });

  it('cuts a wall that spans two rooms at their shared edge', () => {
    const cells = buildRoomCells(two);
    const got: Record<string, number> = {};
    let flipped = false;
    splitTriangle(
      cells,
      [v(1, 0.5), v(4, 0.5), v(1, 1.5, 3)],
      (room, a, b, c) => {
        const signed = area(a, b, c);
        if (signed < 0) flipped = true;
        got[room] = (got[room] ?? 0) + signed;
        for (const p of [a, b, c])
          expect(room === 'west' ? p[0] <= 2 + 1e-9 : p[0] >= 2 - 1e-9).toBe(
            true,
          );
      },
    );
    expect(flipped).toBe(false);
    // Plan area 1.5 in total: 5/6 west of x = 2, 2/3 east of it.
    expect(got.west).toBeCloseTo(5 / 6, 9);
    expect(got.east).toBeCloseTo(2 / 3, 9);
  });

  it('leaves a triangle inside one room uncut and interpolates heights', () => {
    const cells = buildRoomCells(two);
    const pieces: Vertex[][] = [];
    splitTriangle(cells, [v(0.2, 0.2), v(1, 0.2), v(0.2, 1)], (_, ...t) =>
      pieces.push(t),
    );
    expect(pieces).toHaveLength(1);
    const heights: number[] = [];
    splitTriangle(cells, [v(0, 1, 0), v(4, 1, 4), v(0, 1.5, 0)], (_, ...t) =>
      t.forEach((p) => heights.push(p[2] - p[0])),
    );
    for (const h of heights) expect(h).toBeCloseTo(0, 9);
  });

  it('assigns each recorded basement room its own centre', () => {
    const basement = rooms.filter((r) => r.floor === 'basement');
    const cells = buildRoomCells(basement);
    const owners = new Set(cells.owner.flat());
    for (const room of basement) expect(owners.has(room.id)).toBe(true);
    expect(roomAt(cells, 1.1, 0.4)).toBe('bsmt_wine_cellar');
    expect(roomAt(cells, 2.5, 1)).toBe('bsmt_home_theater');
    expect(roomAt(cells, 6, -0.8)).toBe('bsmt_study');
  });
});
