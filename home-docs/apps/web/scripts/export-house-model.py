"""Export the Blender house model for the atlas stage.

Run inside Blender against an explicit saved revision. The .blend is opened
read-only in practice: this script tags objects in memory, exports a GLB and
never saves the source file.

    blender --background house_v64.blend \
      --python home-docs/apps/web/scripts/export-house-model.py -- \
      --output home-docs/apps/web/models/house.glb

Every exported object carries `smarthome_floor` (basement, main, second or
roof), which the stage uses for floor separation and isolation. Reference
drawings, labels, cameras and the site grade are left out.
"""
import argparse
import datetime
import hashlib
import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector

SCENE = '01 House · complete model'
# Top-level collection prefix → floor. Exterior parts are assigned by height.
FLOOR_BY_COLLECTION = {'01': 'basement', '02': 'main', '03': 'second', '05': 'roof'}
EXTERIOR = '04'
# Finished-floor datums of the model, in metres (8 ft storeys).
STOREY = 2.44

parser = argparse.ArgumentParser()
parser.add_argument('--output', required=True)
parser.add_argument('--scene', default=SCENE)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
output = Path(args.output).resolve()
output.parent.mkdir(parents=True, exist_ok=True)

scene = bpy.data.scenes[args.scene]
bpy.context.window.scene = scene


collection_of = {}


def walk(collection, top, owners):
    for obj in collection.objects:
        owners.setdefault(obj.name, top)
        collection_of.setdefault(obj.name, collection.name)
    for child in collection.children:
        walk(child, top, owners)


owners = {}
for top in scene.collection.children:
    walk(top, top.name[:2], owners)


def exterior_floor(obj):
    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    mid = (min(p.z for p in corners) + max(p.z for p in corners)) / 2
    # Deck boards and sills sit just under the floor they serve; the margin
    # keeps them with that floor instead of the storey below.
    level = int((mid + 0.35) // STOREY)
    return ('basement', 'main', 'second', 'roof')[max(0, min(3, level))]


bpy.ops.object.select_all(action='DESELECT')
counts = {}
for obj in scene.objects:
    if obj.type not in {'MESH', 'CURVE'} or not obj.visible_get():
        continue
    group = owners.get(obj.name)
    if group in FLOOR_BY_COLLECTION:
        floor = FLOOR_BY_COLLECTION[group]
    elif group == EXTERIOR:
        floor = exterior_floor(obj)
    else:
        continue
    obj['smarthome_floor'] = floor
    # Room tracing in the stage: wall footprints bound the rooms, and a door
    # assembly (frame, leaves, hardware under one FRAME/HINGE parent pair)
    # is shown with each room its wall faces.
    leaf = collection_of.get(obj.name, '').lower()
    for key in ('smarthome_part', 'smarthome_door', 'smarthome_door_frame'):
        if key in obj:
            del obj[key]
    if 'wall' in leaf and 'baseboard' not in leaf:
        obj['smarthome_part'] = 'wall'
    parent = obj.parent
    while parent and parent.parent:
        parent = parent.parent
    if 'door' in leaf and parent and ' • ' in parent.name:
        obj['smarthome_door'] = parent.name.split(' • ')[0]
        obj['smarthome_door_frame'] = 'FRAME' in parent.name
    counts[floor] = counts.get(floor, 0) + 1
    obj.select_set(True)

source = Path(bpy.data.filepath)
scene['smarthome_source'] = source.name
scene['smarthome_source_sha256'] = hashlib.sha256(source.read_bytes()).hexdigest()
scene['smarthome_exported'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
scene['smarthome_storey_m'] = STOREY

temporary = output.with_name(output.stem + '.pending.glb')
bpy.ops.export_scene.gltf(
    filepath=str(temporary), export_format='GLB', use_active_scene=True,
    use_selection=True, export_extras=True, export_apply=True,
    export_animations=False, export_cameras=False, export_lights=False,
    export_yup=True,
)
temporary.replace(output)
print('EXPORT ' + json.dumps({
    'source': source.name,
    'source_sha256': scene['smarthome_source_sha256'],
    'scene': scene.name,
    'objects': counts,
    'walls': sum(1 for o in scene.objects if o.get('smarthome_part') == 'wall'),
    'door_parts': sum(1 for o in scene.objects if 'smarthome_door' in o),
    'bytes': output.stat().st_size,
    'sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
    'output': str(output),
}), flush=True)
