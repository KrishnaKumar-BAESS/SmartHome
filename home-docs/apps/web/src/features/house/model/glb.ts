export const MAX_MODEL_BYTES = 100 * 1024 * 1024;

// The stage accepts self-contained GLB 2.0 exports only. Reject external
// resources before the loader can request textures or buffers elsewhere.
export function validateGlb(data: ArrayBuffer): void {
  if (data.byteLength > MAX_MODEL_BYTES)
    throw new Error('Model exceeds 100 MB. Export a smaller model.');
  if (data.byteLength < 20)
    throw new Error('Choose a binary glTF (.glb) export from Blender.');
  const view = new DataView(data);
  if (
    view.getUint32(0, true) !== 0x46546c67 ||
    view.getUint32(4, true) !== 2 ||
    view.getUint32(8, true) !== data.byteLength
  )
    throw new Error('Choose a valid GLB 2.0 export from Blender.');
  const length = view.getUint32(12, true);
  if (view.getUint32(16, true) !== 0x4e4f534a || length > data.byteLength - 20)
    throw new Error('The GLB metadata is incomplete. Export the model again.');
  const metadata = JSON.parse(
    new TextDecoder().decode(new Uint8Array(data, 20, length)),
  ) as {
    buffers?: { uri?: string }[];
    images?: { uri?: string }[];
    extensionsRequired?: string[];
  };
  for (const resource of [
    ...(metadata.buffers ?? []),
    ...(metadata.images ?? []),
  ]) {
    if (resource.uri && !resource.uri.startsWith('data:'))
      throw new Error('Embed all textures and buffers in the GLB export.');
  }
  if (
    metadata.extensionsRequired?.some((name) =>
      [
        'KHR_draco_mesh_compression',
        'KHR_texture_basisu',
        'EXT_meshopt_compression',
      ].includes(name),
    )
  )
    throw new Error('Export without Draco, Meshopt, or KTX2 compression.');
}
