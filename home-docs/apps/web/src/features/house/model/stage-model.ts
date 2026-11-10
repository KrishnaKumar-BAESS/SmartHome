import {
  AmbientLight,
  BufferAttribute,
  Box3,
  BufferGeometry,
  DirectionalLight,
  Group,
  Matrix4,
  Mesh,
  OrthographicCamera,
  Scene,
  Texture,
  WebGLRenderer,
  type Material,
  type Object3D,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  atlasFromGltf,
  MODEL_FLOORS,
  stageFromAtlas,
  type ModelFloor,
  type StageCamera,
} from './alignment';
import {
  buildRoomCells,
  roomsAt,
  splitTriangle,
  type Rect,
  type RoomCells,
  type RoomOutline,
  type Vertex,
} from './room-split';

const DEPTH = 20000;

/** An export tag on the object or the nearest ancestor that carries it. */
function tagOf(object: Object3D, name: string): unknown {
  for (let o: Object3D | null = object; o; o = o.parent)
    if (o.userData[name] !== undefined) return o.userData[name];
  return undefined;
}

function floorOf(object: Object3D): ModelFloor | null {
  for (let o: Object3D | null = object; o; o = o.parent) {
    const floor = o.userData.smarthome_floor;
    if (MODEL_FLOORS.includes(floor)) return floor as ModelFloor;
  }
  return null;
}

/** Objects narrower than this in plan (atlas units) are never cut. */
const WHOLE_OBJECT_SPAN = 0.55;

/**
 * Bake every mesh into one geometry per floor, room and material, in atlas
 * coordinates. The export has over two thousand small objects; this keeps
 * the stage to a few dozen draw calls so it can follow the camera every
 * frame. Floors listed in `roomCells` are divided among their rooms.
 */
function mergeByFloor(
  root: Object3D,
  align: Matrix4,
  roomOutlines: Partial<Record<ModelFloor, readonly RoomOutline[]>>,
) {
  type Bucket = {
    floor: ModelFloor;
    room: string | null;
    material: Material;
    positions: number[];
    normals: number[];
  };
  root.updateMatrixWorld(true);
  const placed = new Matrix4();
  const planBox = (mesh: Mesh) => {
    const geometry = mesh.geometry as BufferGeometry;
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    return new Box3()
      .copy(geometry.boundingBox!)
      .applyMatrix4(placed.multiplyMatrices(align, mesh.matrixWorld));
  };
  // First pass: wall footprints trace the rooms, and each door assembly is
  // located by its frame, which stands in the wall whichever way it swings.
  const walls: Partial<Record<ModelFloor, Rect[]>> = {};
  const doorFrames = new Map<string, Box3>();
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const floor = floorOf(object);
    if (!floor || !roomOutlines[floor]) return;
    if (tagOf(object, 'smarthome_part') === 'wall') {
      const box = planBox(object);
      (walls[floor] ??= []).push({
        x0: box.min.x,
        x1: box.max.x,
        y0: box.min.y,
        y1: box.max.y,
      });
    }
    const door = tagOf(object, 'smarthome_door');
    if (typeof door === 'string' && tagOf(object, 'smarthome_door_frame')) {
      const key = `${floor}:${door}`;
      const box = planBox(object);
      const frame = doorFrames.get(key);
      if (frame) frame.union(box);
      else doorFrames.set(key, box);
    }
  });
  const roomCells: Partial<Record<ModelFloor, RoomCells>> = {};
  for (const floor of MODEL_FLOORS) {
    const outlines = roomOutlines[floor];
    if (outlines?.length)
      roomCells[floor] = buildRoomCells(outlines, walls[floor] ?? []);
  }
  const buckets = new Map<string, Bucket>();
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const floor = floorOf(object);
    const material = Array.isArray(object.material)
      ? object.material[0]
      : object.material;
    if (!floor || !material) return;
    const push = (room: string | null, ...vertices: Vertex[]) => {
      const key = `${floor}:${room ?? ''}:${material.uuid}`;
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { floor, room, material, positions: [], normals: [] };
        buckets.set(key, bucket);
      }
      for (const p of vertices) {
        bucket.positions.push(p[0], p[1], p[2]);
        bucket.normals.push(p[3], p[4], p[5]);
      }
    };
    const geometry = (object.geometry as BufferGeometry).index
      ? (object.geometry as BufferGeometry).toNonIndexed()
      : (object.geometry as BufferGeometry).clone();
    if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
    placed.multiplyMatrices(align, object.matrixWorld);
    geometry.applyMatrix4(placed);
    geometry.computeBoundingBox();
    const position = geometry.getAttribute('position');
    const normal = geometry.getAttribute('normal');
    const vertex = (j: number): Vertex => [
      position.getX(j),
      position.getY(j),
      position.getZ(j),
      normal.getX(j),
      normal.getY(j),
      normal.getZ(j),
    ];
    // A mirrored object would otherwise face inward: restore its winding.
    const mirrored = placed.determinant() < 0;
    const cells = roomCells[floor];
    const box = geometry.boundingBox!;
    // Doors, fixtures and furniture stay in one piece, with the room under
    // their centre; only long parts such as walls and slabs are cut. A door
    // assembly goes whole to every room its frame's wall faces.
    const door = tagOf(object, 'smarthome_door');
    const frame =
      typeof door === 'string' ? doorFrames.get(`${floor}:${door}`) : null;
    const small =
      box.max.x - box.min.x < WHOLE_OBJECT_SPAN &&
      box.max.y - box.min.y < WHOLE_OBJECT_SPAN;
    const centre = frame ?? (small ? box : null);
    const owners =
      cells && centre
        ? roomsAt(
            cells,
            (centre.min.x + centre.max.x) / 2,
            (centre.min.y + centre.max.y) / 2,
          )
        : null;
    for (let i = 0; i + 2 < position.count; i += 3) {
      const a = vertex(i),
        b = vertex(mirrored ? i + 2 : i + 1),
        c = vertex(mirrored ? i + 1 : i + 2);
      if (!cells) push(null, a, b, c);
      else if (owners) for (const room of owners) push(room, a, b, c);
      else splitTriangle(cells, [a, b, c], push);
    }
    geometry.dispose();
  });
  return [...buckets.values()];
}

function disposeTree(root: Object3D) {
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry.dispose();
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material])
      material.dispose();
  });
}

export type StageModel = {
  update: (camera: StageCamera) => void;
  dispose: () => void;
};

/**
 * Draw the Blender house into `canvas`, driven by the same orthographic
 * camera as the SVG scene so markers and labels stay registered to it.
 */
export async function mountStageModel(
  canvas: HTMLCanvasElement,
  data: ArrayBuffer,
  onContextLost: () => void,
  /** Atlas room outlines for the floors to divide among their rooms. */
  roomOutlines: Partial<Record<ModelFloor, readonly RoomOutline[]>> = {},
): Promise<StageModel> {
  const gltf = await new GLTFLoader().parseAsync(data, '');
  const align = new Matrix4().set(
    ...(atlasFromGltf() as Parameters<Matrix4['set']>),
  );
  const buckets = mergeByFloor(gltf.scene, align, roomOutlines);
  disposeTree(gltf.scene);
  if (!buckets.length)
    throw new Error('The export contains no floor-tagged geometry.');

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    throw new Error('The 3D model needs WebGL.');
  }
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  // `view` carries atlas coordinates to stage pixels; everything hangs off it.
  const view = new Group();
  view.matrixAutoUpdate = false;
  scene.add(view);
  const floors = {} as Record<
    ModelFloor,
    { group: Group; materials: Material[] }
  >;
  for (const floor of MODEL_FLOORS) {
    const group = new Group();
    view.add(group);
    floors[floor] = { group, materials: [] };
  }
  const roomGroups = new Map<string, Group>();
  for (const bucket of buckets) {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(bucket.positions), 3),
    );
    geometry.setAttribute(
      'normal',
      new BufferAttribute(new Float32Array(bucket.normals), 3),
    );
    const material = bucket.material.clone();
    // Merged geometry keeps positions and normals only.
    for (const [name, value] of Object.entries(material))
      if (value instanceof Texture)
        (material as unknown as Record<string, unknown>)[name] = null;
    material.userData.baseOpacity = material.opacity;
    material.userData.baseTransparent = material.transparent;
    const mesh = new Mesh(geometry, material);
    mesh.frustumCulled = false;
    let parent = floors[bucket.floor].group;
    if (bucket.room) {
      let room = roomGroups.get(bucket.room);
      if (!room) {
        room = new Group();
        roomGroups.set(bucket.room, room);
        parent.add(room);
      }
      parent = room;
    }
    parent.add(mesh);
    floors[bucket.floor].materials.push(material);
  }

  const ambient = new AmbientLight(0xffffff, 1.5);
  const sun = new DirectionalLight(0xffffff, 2.1);
  // A weak opposite light keeps the shaded walls from going flat.
  const fill = new DirectionalLight(0xffffff, 0.5);
  view.add(ambient, sun, sun.target, fill, fill.target);

  const camera = new OrthographicCamera(0, 1, 1, 0, 1, DEPTH * 2);
  camera.position.z = DEPTH;

  let width = 0,
    height = 0;
  const update = (c: StageCamera) => {
    if (c.vw !== width || c.vh !== height) {
      width = c.vw;
      height = c.vh;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      camera.right = width;
      camera.top = height;
      camera.updateProjectionMatrix();
    }
    view.matrix.set(...(stageFromAtlas(c) as Parameters<Matrix4['set']>));
    view.matrixWorldNeedsUpdate = true;
    // The sun is fixed to the house, like the schematic's key light, so
    // walls brighten and darken as the model turns.
    sun.target.position.set(c.cx, c.cy, c.cz);
    sun.position.set(c.cx + 2.6, c.cy - 9.7, c.cz + 9);
    fill.target.position.set(c.cx, c.cy, c.cz);
    fill.position.set(c.cx - 6, c.cy + 7, c.cz + 4);
    const dim = c.light ? 1 : 0.82;
    ambient.intensity = 1.5 * dim;
    sun.intensity = 2.1 * dim;
    for (const floor of MODEL_FLOORS) {
      const state = c.floors[floor];
      const { group, materials } = floors[floor];
      group.visible = state.visible && state.opacity > 0.01;
      group.position.set(0, 0, state.dz);
      for (const material of materials) {
        const faded = state.opacity < 0.999;
        material.transparent = faded || material.userData.baseTransparent;
        material.opacity = material.userData.baseOpacity * state.opacity;
      }
    }
    for (const [id, group] of roomGroups) {
      const room = c.rooms[id];
      group.visible = room ? room.visible : true;
      group.position.set(room?.ox ?? 0, room?.oy ?? 0, 0);
    }
    renderer.render(scene, camera);
  };

  const lost = (event: Event) => {
    event.preventDefault();
    onContextLost();
  };
  canvas.addEventListener('webglcontextlost', lost);
  const dispose = () => {
    canvas.removeEventListener('webglcontextlost', lost);
    disposeTree(scene);
    renderer.dispose();
    renderer.forceContextLoss();
  };
  return { update, dispose };
}
