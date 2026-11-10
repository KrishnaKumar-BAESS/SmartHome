// The export is a local build input (see docs/blender-model.md). Builds
// without it simply have no model and keep the schematic stage.
const found = import.meta.glob<string>('../../../../models/house.glb', {
  query: '?url',
  import: 'default',
  eager: true,
});

export const MODEL_URL: string | null = Object.values(found)[0] ?? null;
