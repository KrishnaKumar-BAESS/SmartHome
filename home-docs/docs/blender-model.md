# Blender house model on the atlas stage

When a build includes the exported Blender model, the atlas draws it as the
house: a WebGL canvas sits under the SVG scene and follows the same
orthographic camera, so rooms, markers, labels, camera cones and wiring stay
registered to it. Without the export (for example in CI) the app is unchanged
and shows the schematic room blocks.

**View options → House** switches between **3D model** and **Schematic**; the
choice is remembered per browser. The schematic also appears while the model
loads and when WebGL is unavailable.

The model is a work-in-progress reconstruction with estimated dimensions. It
does not establish device positions, and nothing about it is live telemetry.

## What changes with the model on stage

- Floors use the model's 2.44 m storey height; rooms become floor-level hit
  areas that tint when hovered or highlighted. The model supplies the walls.
- Floor separation moves whole floors. **Exploded** separates floors further
  but does not spread rooms apart: the model has no per-room ownership.
- The roof is drawn on the stacked house and lifts away as floors separate.
  It is hidden while a floor or room is isolated.
- Isolating rooms shows the whole floor they are on.

## Refresh the export

The export is a local build input, ignored by Git. Run from the repository
root with the intended saved revision; the `.blend` is never saved:

```sh
/path/to/blender --background /path/to/house_v64.blend \
  --python home-docs/apps/web/scripts/export-house-model.py -- \
  --output home-docs/apps/web/models/house.glb
pnpm build
```

The script exports the `01 House · complete model` scene, leaves out reference
drawings, labels, cameras and the site grade, applies modifiers, and tags each
object with `smarthome_floor` (`basement`, `main`, `second`, `roof`). Exterior
parts are assigned by height. The GLB must be self-contained and uncompressed
(no Draco, Meshopt or KTX2); textures are not drawn.

Vite emits the file as a hashed asset under `dist/assets/`, so the existing
host rules and caching apply. Three.js is bundled locally in a lazy chunk with
its own budget in `scripts/bundle-budget.mjs`.

## Alignment

[`alignment.ts`](../apps/web/src/features/house/model/alignment.ts) holds one
best-fit similarity between the model and the atlas rooms: 3.02 m per atlas
unit and a shift, no rotation. It was fitted to the main-floor footprints; the
basement's far wall differs by about 0.8 m. Room tints and markers can
therefore sit slightly off the modeled walls. Adjust the constants there after
a model revision moves the footprint, and re-check the three floors.

Do not publish `.blend` sources or reference material; serve `dist/` only.
