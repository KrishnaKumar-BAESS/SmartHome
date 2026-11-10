import {
  AmbientLight,
  BufferAttribute,
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

const DEPTH = 20000;

function floorOf(object: Object3D): ModelFloor | null {
  for (let o: Object3D | null = object; o; o = o.parent) {
    const floor = o.userData.smarthome_floor;
    if (MODEL_FLOORS.includes(floor)) return floor as ModelFloor;
  }
  return null;
}

/**
 * Bake every mesh into one geometry per floor and material. The export has
 * over two thousand small objects; this keeps the stage to a few dozen draw
 * calls so it can follow the camera every frame.
 */
function mergeByFloor(root: Object3D) {
  type Bucket = {
    floor: ModelFloor;
    material: Material;
    positions: number[];
    normals: number[];
  };
  const buckets = new Map<string, Bucket>();
  root.updateMatrixWorld(true);
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const floor = floorOf(object);
    const material = Array.isArray(object.material)
      ? object.material[0]
      : object.material;
    if (!floor || !material) return;
    const key = `${floor}:${material.uuid}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { floor, material, positions: [], normals: [] };
      buckets.set(key, bucket);
    }
    const geometry = (object.geometry as BufferGeometry).index
      ? (object.geometry as BufferGeometry).toNonIndexed()
      : (object.geometry as BufferGeometry).clone();
    if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
    geometry.applyMatrix4(object.matrixWorld);
    const position = geometry.getAttribute('position');
    const normal = geometry.getAttribute('normal');
    // A mirrored object would otherwise face inward: restore its winding.
    const mirrored = object.matrixWorld.determinant() < 0;
    for (let i = 0; i + 2 < position.count; i += 3) {
      for (const j of mirrored ? [i, i + 2, i + 1] : [i, i + 1, i + 2]) {
        bucket.positions.push(
          position.getX(j),
          position.getY(j),
          position.getZ(j),
        );
        bucket.normals.push(normal.getX(j), normal.getY(j), normal.getZ(j));
      }
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
): Promise<StageModel> {
  const gltf = await new GLTFLoader().parseAsync(data, '');
  const buckets = mergeByFloor(gltf.scene);
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
  const align = new Matrix4().set(
    ...(atlasFromGltf() as Parameters<Matrix4['set']>),
  );
  const floors = {} as Record<
    ModelFloor,
    { group: Group; materials: Material[] }
  >;
  for (const floor of MODEL_FLOORS) {
    const group = new Group();
    view.add(group);
    floors[floor] = { group, materials: [] };
  }
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
    geometry.applyMatrix4(align);
    const material = bucket.material.clone();
    // Merged geometry keeps positions and normals only.
    for (const [name, value] of Object.entries(material))
      if (value instanceof Texture)
        (material as unknown as Record<string, unknown>)[name] = null;
    material.userData.baseOpacity = material.opacity;
    material.userData.baseTransparent = material.transparent;
    const mesh = new Mesh(geometry, material);
    mesh.frustumCulled = false;
    floors[bucket.floor].group.add(mesh);
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
