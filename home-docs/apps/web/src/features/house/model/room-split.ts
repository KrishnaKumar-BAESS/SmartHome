/**
 * Room ownership for model geometry.
 *
 * The Blender model does not say which room a wall, slab or fixture belongs
 * to. For floors whose interiors are modeled, the atlas's room outlines stand
 * in: their edges, extended across the floor, cut the plan into a grid of
 * cells, and every cell belongs to the room that contains it or, outside all
 * rooms, to the nearest one. Small objects go whole to the cell under their
 * centre; long ones (walls, slabs, carpet) are cut along the cell edges.
 * It is an inspection aid, not surveyed ownership.
 */
export type RoomOutline = { id: string; verts: readonly (readonly number[])[] };

export type RoomCells = {
  xs: number[];
  ys: number[];
  /** Owner of cell (i, j): between xs[i-1]..xs[i] and ys[j-1]..ys[j]. */
  owner: string[][];
};

/** Position then normal: x, y, z, nx, ny, nz. Plan axes are x and y. */
export type Vertex = number[];

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

function cuts(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.filter((v, i) => i === 0 || v - sorted[i - 1] > 1e-6);
}

/** Middle of interval `i` of `cuts`; the two outer intervals are unbounded. */
function middle(lines: number[], i: number) {
  if (i === 0) return lines[0] - 0.05;
  if (i === lines.length) return lines[lines.length - 1] + 0.05;
  return (lines[i - 1] + lines[i]) / 2;
}

export function buildRoomCells(rooms: readonly RoomOutline[]): RoomCells {
  const xs = cuts(rooms.flatMap((r) => r.verts.map((v) => v[0])));
  const ys = cuts(rooms.flatMap((r) => r.verts.map((v) => v[1])));
  const owner: string[][] = [];
  for (let i = 0; i <= xs.length; i++) {
    owner.push([]);
    for (let j = 0; j <= ys.length; j++) {
      const x = middle(xs, i),
        y = middle(ys, j);
      const inside = rooms.find((r) => contains(r.verts, x, y));
      const room =
        inside ??
        rooms.reduce((a, b) =>
          distance(b.verts, x, y) < distance(a.verts, x, y) ? b : a,
        );
      owner[i].push(room.id);
    }
  }
  return { xs, ys, owner };
}

/** Index of the interval of `lines` holding `value`. */
function interval(lines: number[], value: number) {
  let i = 0;
  while (i < lines.length && value > lines[i]) i++;
  return i;
}

export function roomAt(cells: RoomCells, x: number, y: number): string {
  return cells.owner[interval(cells.xs, x)][interval(cells.ys, y)];
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
 * Cut one triangle along the cell edges and hand each piece, as triangles, to
 * the room that owns its cell. Pieces keep the triangle's winding.
 */
export function splitTriangle(
  cells: RoomCells,
  triangle: [Vertex, Vertex, Vertex],
  emit: (room: string, a: Vertex, b: Vertex, c: Vertex) => void,
) {
  const { xs, ys, owner } = cells;
  const px = triangle.map((v) => v[0]),
    py = triangle.map((v) => v[1]);
  const i0 = interval(xs, Math.min(...px)),
    i1 = interval(xs, Math.max(...px)),
    j0 = interval(ys, Math.min(...py)),
    j1 = interval(ys, Math.max(...py));
  // Neighbouring cells of one room need no cut between them.
  let same = true;
  for (let i = i0; i <= i1 && same; i++)
    for (let j = j0; j <= j1; j++)
      if (owner[i][j] !== owner[i0][j0]) {
        same = false;
        break;
      }
  if (same) {
    emit(owner[i0][j0], triangle[0], triangle[1], triangle[2]);
    return;
  }
  for (let i = i0; i <= i1; i++) {
    let column: Vertex[] = triangle;
    if (i > 0) column = clip(column, 0, xs[i - 1], true);
    if (i < xs.length) column = clip(column, 0, xs[i], false);
    if (column.length < 3) continue;
    for (let j = j0; j <= j1; j++) {
      let piece = column;
      if (j > 0) piece = clip(piece, 1, ys[j - 1], true);
      if (j < ys.length) piece = clip(piece, 1, ys[j], false);
      for (let k = 1; k + 1 < piece.length; k++)
        emit(owner[i][j], piece[0], piece[k], piece[k + 1]);
    }
  }
}
