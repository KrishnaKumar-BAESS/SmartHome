/**
 * Room ownership for model geometry.
 *
 * The Blender model does not say which room a wall, slab or fixture belongs
 * to, so rooms are traced from its walls. Wall footprints cut the plan into a
 * grid of cells. Open cells are flood-filled between the walls; each enclosed
 * area takes the atlas room whose centre falls in it. A wall cell belongs to
 * every room it faces, so a shared wall is drawn once for each side. Where
 * the model leaves two atlas rooms open to each other, the atlas outlines
 * decide between them. It is an inspection aid, not surveyed ownership.
 */
export type RoomOutline = { id: string; verts: readonly (readonly number[])[] };
export type Rect = { x0: number; x1: number; y0: number; y1: number };

export type RoomCells = {
  xs: number[];
  ys: number[];
  /** Cells per column: ys.length + 1. Cell (i, j) is at i * ny + j. */
  ny: number;
  /** Index into `sets` for each cell. */
  set: Int32Array;
  /** Distinct owner lists; most cells have one room, shared walls two. */
  sets: string[][];
};

/** Position then normal: x, y, z, nx, ny, nz. Plan axes are x and y. */
export type Vertex = number[];

/**
 * Walls are thickened by this much while tracing (atlas units, about 0.45 m),
 * which closes doorless openings up to twice as wide. The thickening is then
 * handed back to the room it borders.
 */
const SEAL = 0.15;
/** How far through a wall to look for the room on its other side. */
const REACH = 0.2;

function contains(verts: RoomOutline['verts'], x: number, y: number) {
  let inside = false;
  for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
    const [ax, ay] = verts[i],
      [bx, by] = verts[j];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax)
      inside = !inside;
  }
  return inside;
}

function distance(verts: RoomOutline['verts'], x: number, y: number) {
  let best = Infinity;
  for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
    const [ax, ay] = verts[i],
      [bx, by] = verts[j];
    const dx = bx - ax,
      dy = by - ay;
    const span = dx * dx + dy * dy;
    const t = span
      ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / span))
      : 0;
    best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
  }
  return best;
}

/** The outline holding the point, or else the nearest one. */
function nearestRoom(rooms: readonly RoomOutline[], x: number, y: number) {
  let best = rooms[0],
    bestDistance = Infinity;
  for (const room of rooms) {
    const d = contains(room.verts, x, y) ? 0 : distance(room.verts, x, y);
    if (d < bestDistance) {
      best = room;
      bestDistance = d;
    }
  }
  return best;
}

/** A point inside the outline: its area centroid, or a vertex-average. */
function seedOf(room: RoomOutline): [number, number] {
  let area = 0,
    cx = 0,
    cy = 0,
    mx = 0,
    my = 0;
  const n = room.verts.length;
  for (let i = 0; i < n; i++) {
    const [ax, ay] = room.verts[i],
      [bx, by] = room.verts[(i + 1) % n];
    const cross = ax * by - bx * ay;
    area += cross;
    cx += (ax + bx) * cross;
    cy += (ay + by) * cross;
    mx += ax / n;
    my += ay / n;
  }
  const centroid: [number, number] = area
    ? [cx / (3 * area), cy / (3 * area)]
    : [mx, my];
  return contains(room.verts, centroid[0], centroid[1]) ? centroid : [mx, my];
}

function cuts(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.filter((v, i) => i === 0 || v - sorted[i - 1] > 1e-5);
}

/** Middle of interval `i` of `lines`; the two outer intervals are unbounded. */
function middle(lines: number[], i: number) {
  if (i === 0) return lines[0] - 0.05;
  if (i === lines.length) return lines[lines.length - 1] + 0.05;
  return (lines[i - 1] + lines[i]) / 2;
}

/** Index of the interval of `lines` holding `value`. */
function interval(lines: number[], value: number) {
  let lo = 0,
    hi = lines.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (value > lines[mid]) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

const OPEN = 0,
  SEALED = 1,
  WALL = 2;

export function buildRoomCells(
  rooms: readonly RoomOutline[],
  walls: readonly Rect[] = [],
): RoomCells {
  const xs = cuts([
    ...rooms.flatMap((r) => r.verts.map((v) => v[0])),
    ...walls.flatMap((w) => [w.x0, w.x1, w.x0 - SEAL, w.x1 + SEAL]),
  ]);
  const ys = cuts([
    ...rooms.flatMap((r) => r.verts.map((v) => v[1])),
    ...walls.flatMap((w) => [w.y0, w.y1, w.y0 - SEAL, w.y1 + SEAL]),
  ]);
  const nx = xs.length + 1,
    ny = ys.length + 1,
    count = nx * ny;
  const kind = new Uint8Array(count);
  const mark = (w: Rect, grow: number, value: number) => {
    const i0 = interval(xs, w.x0 - grow + 1e-5),
      i1 = interval(xs, w.x1 + grow - 1e-5),
      j0 = interval(ys, w.y0 - grow + 1e-5),
      j1 = interval(ys, w.y1 + grow - 1e-5);
    for (let i = i0; i <= i1; i++)
      for (let j = j0; j <= j1; j++)
        if (kind[i * ny + j] < value) kind[i * ny + j] = value;
  };
  for (const w of walls) mark(w, SEAL, SEALED);
  for (const w of walls) mark(w, 0, WALL);

  // Enclosed areas: connected open cells. Area 0 is everything outdoors.
  const area = new Int32Array(count).fill(-1);
  const flood = (start: number, id: number) => {
    const stack = [start];
    area[start] = id;
    while (stack.length) {
      const cell = stack.pop()!;
      const i = Math.floor(cell / ny),
        j = cell % ny;
      for (const [di, dj] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const a = i + di,
          b = j + dj;
        if (a < 0 || b < 0 || a >= nx || b >= ny) continue;
        const next = a * ny + b;
        if (kind[next] !== OPEN || area[next] !== -1) continue;
        area[next] = id;
        stack.push(next);
      }
    }
  };
  if (kind[0] === OPEN) flood(0, 0);
  let areas = 1;
  for (let cell = 0; cell < count; cell++)
    if (kind[cell] === OPEN && area[cell] === -1) flood(cell, areas++);

  // Which atlas rooms have their centre in each enclosed area.
  const claims: RoomOutline[][] = Array.from({ length: areas }, () => []);
  for (const room of rooms) {
    const [x, y] = seedOf(room);
    let at = area[interval(xs, x) * ny + interval(ys, y)];
    if (at <= 0) {
      // The centre is in or beside a wall: use the nearest open cell that
      // is still inside the outline.
      let best = Infinity;
      for (let cell = 0; cell < count; cell++) {
        if (area[cell] <= 0) continue;
        const cx = middle(xs, Math.floor(cell / ny)),
          cy = middle(ys, cell % ny);
        const d = Math.hypot(cx - x, cy - y);
        if (d < best && contains(room.verts, cx, cy)) {
          best = d;
          at = area[cell];
        }
      }
    }
    if (at > 0) claims[at].push(room);
  }
  const index = new Map(rooms.map((r, i) => [r.id, i]));
  const room = new Int32Array(count).fill(-1);
  for (let cell = 0; cell < count; cell++) {
    if (kind[cell] !== OPEN) continue;
    const claimed = area[cell] > 0 ? claims[area[cell]] : [];
    const x = middle(xs, Math.floor(cell / ny)),
      y = middle(ys, cell % ny);
    room[cell] = index.get(
      claimed.length === 1
        ? claimed[0].id
        : nearestRoom(claimed.length ? claimed : rooms, x, y).id,
    )!;
  }
  // Cells sealed beside a wall join the nearest room reachable without
  // crossing a wall, nearest first so no room creeps along a wall.
  {
    const cost = new Float64Array(count).fill(Infinity);
    const heap: number[] = [];
    const lift = (cell: number, value: number) => {
      cost[cell] = value;
      let at = heap.push(cell) - 1;
      while (at > 0) {
        const up = (at - 1) >> 1;
        if (cost[heap[up]] <= cost[heap[at]]) break;
        [heap[up], heap[at]] = [heap[at], heap[up]];
        at = up;
      }
    };
    const take = () => {
      const top = heap[0];
      const last = heap.pop()!;
      if (heap.length) {
        heap[0] = last;
        for (let at = 0; ;) {
          let low = at;
          for (const child of [2 * at + 1, 2 * at + 2])
            if (child < heap.length && cost[heap[child]] < cost[heap[low]])
              low = child;
          if (low === at) break;
          [heap[low], heap[at]] = [heap[at], heap[low]];
          at = low;
        }
      }
      return top;
    };
    for (let cell = 0; cell < count; cell++)
      if (room[cell] !== -1) lift(cell, 0);
    const done = new Uint8Array(count);
    while (heap.length) {
      const cell = take();
      if (done[cell]) continue;
      done[cell] = 1;
      const i = Math.floor(cell / ny),
        j = cell % ny;
      for (const [di, dj] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const a = i + di,
          b = j + dj;
        if (a < 0 || b < 0 || a >= nx || b >= ny) continue;
        const next = a * ny + b;
        if (kind[next] !== SEALED || done[next]) continue;
        const step =
          Math.abs(middle(xs, a) - middle(xs, i)) +
          Math.abs(middle(ys, b) - middle(ys, j));
        if (cost[cell] + step < cost[next]) {
          room[next] = room[cell];
          area[next] = area[cell];
          lift(next, cost[cell] + step);
        }
      }
    }
  }

  // A wall cell belongs to each indoor room found a short way through the
  // wall in the four plan directions.
  const sets: string[][] = [];
  const setIndex = new Map<string, number>();
  const intern = (ids: number[]) => {
    const key = [...new Set(ids)].sort((a, b) => a - b).join(',');
    let at = setIndex.get(key);
    if (at === undefined) {
      at = sets.length;
      sets.push(key.split(',').map((i) => rooms[Number(i)].id));
      setIndex.set(key, at);
    }
    return at;
  };
  const set = new Int32Array(count);
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++) {
      const cell = i * ny + j;
      if (room[cell] !== -1) {
        set[cell] = intern([room[cell]]);
        continue;
      }
      const x = middle(xs, i),
        y = middle(ys, j);
      const found: number[] = [];
      for (const [di, dj] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        for (let a = i + di, b = j + dj; ; a += di, b += dj) {
          if (a < 0 || b < 0 || a >= nx || b >= ny) break;
          if (Math.abs(middle(xs, a) - x) + Math.abs(middle(ys, b) - y) > REACH)
            break;
          const next = a * ny + b;
          if (room[next] === -1) continue;
          if (area[next] > 0) found.push(room[next]);
          break;
        }
      }
      set[cell] = intern(
        found.length ? found : [index.get(nearestRoom(rooms, x, y).id)!],
      );
    }
  return { xs, ys, ny, set, sets };
}

/** Rooms owning the plan point; more than one inside a shared wall. */
export function roomsAt(cells: RoomCells, x: number, y: number): string[] {
  return cells.sets[
    cells.set[interval(cells.xs, x) * cells.ny + interval(cells.ys, y)]
  ];
}

/** Keep the part of a convex polygon on one side of an axis-aligned line. */
function clip(poly: Vertex[], axis: 0 | 1, limit: number, keepAbove: boolean) {
  const out: Vertex[] = [];
  const inside = (v: Vertex) =>
    keepAbove ? v[axis] >= limit : v[axis] <= limit;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i],
      b = poly[(i + 1) % poly.length];
    const ain = inside(a),
      bin = inside(b);
    if (ain) out.push(a);
    if (ain !== bin) {
      const t = (limit - a[axis]) / (b[axis] - a[axis]);
      out.push(a.map((value, k) => value + (b[k] - value) * t));
    }
  }
  return out;
}

/**
 * Cut one triangle where ownership changes and hand each piece, as
 * triangles, to every room that owns it. Pieces keep the triangle's winding.
 */
export function splitTriangle(
  cells: RoomCells,
  triangle: [Vertex, Vertex, Vertex],
  emit: (room: string, a: Vertex, b: Vertex, c: Vertex) => void,
) {
  const { xs, ys, ny, set, sets } = cells;
  const divide = (
    poly: Vertex[],
    i0: number,
    i1: number,
    j0: number,
    j1: number,
  ) => {
    if (poly.length < 3) return;
    const first = set[i0 * ny + j0];
    let same = true;
    for (let i = i0; i <= i1 && same; i++)
      for (let j = j0; j <= j1; j++)
        if (set[i * ny + j] !== first) {
          same = false;
          break;
        }
    if (same) {
      for (const owner of sets[first])
        for (let k = 1; k + 1 < poly.length; k++)
          emit(owner, poly[0], poly[k], poly[k + 1]);
      return;
    }
    if (i1 - i0 >= j1 - j0) {
      const mid = (i0 + i1) >> 1;
      divide(clip(poly, 0, xs[mid], false), i0, mid, j0, j1);
      divide(clip(poly, 0, xs[mid], true), mid + 1, i1, j0, j1);
    } else {
      const mid = (j0 + j1) >> 1;
      divide(clip(poly, 1, ys[mid], false), i0, i1, j0, mid);
      divide(clip(poly, 1, ys[mid], true), i0, i1, mid + 1, j1);
    }
  };
  const px = triangle.map((v) => v[0]),
    py = triangle.map((v) => v[1]);
  divide(
    triangle,
    interval(xs, Math.min(...px)),
    interval(xs, Math.max(...px)),
    interval(ys, Math.min(...py)),
    interval(ys, Math.max(...py)),
  );
}
