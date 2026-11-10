import { describe, expect, it } from 'vitest';
import { rooms } from '../../../data/house';
import {
  buildRoomCells,
  roomsAt,
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
    expect(roomsAt(cells, 1, 1)).toEqual(['west']);
    expect(roomsAt(cells, 4, 1)).toEqual(['east']);
    // An exterior wall just outside the outlines goes with its room.
    expect(roomsAt(cells, -0.3, 1)).toEqual(['west']);
    expect(roomsAt(cells, 5.2, 2.4)).toEqual(['east']);
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

  it('traces rooms from walls and shares the wall between them', () => {
    // The real wall stands at x = 2.6–2.8, not on the atlas edge at x = 2,
    // and the outer walls close the plan.
    const walls = [
      { x0: 2.6, x1: 2.8, y0: 0, y1: 2 },
      { x0: -0.2, x1: 5.2, y0: -0.2, y1: 0 },
      { x0: -0.2, x1: 5.2, y0: 2, y1: 2.2 },
      { x0: -0.2, x1: 0, y0: 0, y1: 2 },
      { x0: 5, x1: 5.2, y0: 0, y1: 2 },
    ];
    const cells = buildRoomCells(two, walls);
    // Floor between the atlas edge and the wall follows the wall.
    expect(roomsAt(cells, 2.3, 1)).toEqual(['west']);
    expect(roomsAt(cells, 3.2, 1)).toEqual(['east']);
    // The dividing wall is drawn for both rooms, outer walls for one.
    expect(roomsAt(cells, 2.7, 1).sort()).toEqual(['east', 'west']);
    expect(roomsAt(cells, -0.1, 1)).toEqual(['west']);
    expect(roomsAt(cells, 5.1, 1)).toEqual(['east']);
    const copies: Record<string, number> = {};
    splitTriangle(cells, [v(2.62, 0.5), v(2.78, 0.5), v(2.7, 1.5, 2)], (r) => {
      copies[r] = (copies[r] ?? 0) + 1;
    });
    expect(copies).toEqual({ west: 1, east: 1 });
  });

  it('assigns each recorded basement room its own centre', () => {
    const basement = rooms.filter((r) => r.floor === 'basement');
    const cells = buildRoomCells(basement);
    const owners = new Set(cells.sets.flat());
    for (const room of basement) expect(owners.has(room.id)).toBe(true);
    expect(roomsAt(cells, 1.1, 0.4)).toEqual(['bsmt_wine_cellar']);
    expect(roomsAt(cells, 2.5, 1)).toEqual(['bsmt_home_theater']);
    expect(roomsAt(cells, 6, -0.8)).toEqual(['bsmt_study']);
  });
});
