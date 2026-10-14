import * as house from '../../data/house';
import {
  INVENTORY_SNAPSHOT,
  zones,
  glossary,
  bulbRoomIds,
  relatedForRoom,
  cameraFloorConflict,
  resolveCircuitRef,
} from './catalog';

export const collections = {
  room: house.rooms,
  panel: house.boxes,
  circuit: house.circuits,
  bulb: house.bulbs,
  network: house.networks,
  node: house.nodes,
  server: house.servers,
  zone: zones,
  camera: house.cameras,
  sensor: house.sensors,
  upkeep: house.upkeep,
};
export type RecordKind = keyof typeof collections;
export const recordKinds = Object.keys(collections) as RecordKind[];
export const modes = [
  'overview',
  'electrical',
  'lighting',
  'network',
  'sound',
  'security',
  'climate',
  'upkeep',
] as const;
export type Mode = (typeof modes)[number];
export const recordModes: Record<RecordKind, Mode> = {
  room: 'overview',
  panel: 'electrical',
  circuit: 'electrical',
  bulb: 'lighting',
  network: 'network',
  node: 'network',
  server: 'network',
  zone: 'sound',
  camera: 'security',
  sensor: 'climate',
  upkeep: 'upkeep',
};

export function focusId(kind: RecordKind, id: string) {
  const prefix = { panel: 'panel-', network: 'net-', server: 'server-' };
  return `row-${prefix[kind as keyof typeof prefix] ?? ''}${id}`;
}

export const dataProvenance = {
  inventorySnapshot: INVENTORY_SNAPSHOT,
  liveTelemetry: false,
  description:
    'Recorded inventory and illustrative geometry; network observations retain their own timestamps. Camera video is a separate local service. Status fields are not current device health.',
};

export function getData() {
  return structuredClone({
    provenance: dataProvenance,
    collections,
    floorLabels: house.floorLabels,
    panelPositions: house.panelPos,
    nodeRoomIds: house.nodeRoomId,
    bulbRoomIds,
    glossary,
  });
}

export function getRecord(kind: RecordKind, id: string) {
  const data = collections[kind].find((item) => item.id === id);
  if (!data) return null;
  const roomIds =
    kind === 'room'
      ? [id]
      : kind === 'panel'
        ? [house.panelPos[id as keyof typeof house.panelPos].room]
        : house.rooms
            .filter((room) =>
              relatedForRoom(room.id).some(
                (item) => item.kind === kind && item.id === id,
              ),
            )
            .map((room) => room.id);
  const power = 'power' in data ? String(data.power) : '';
  return structuredClone({
    kind,
    id,
    mode: recordModes[kind],
    data,
    roomIds,
    provenance: {
      ...dataProvenance,
      observedAt: 'observedAt' in data ? data.observedAt : null,
    },
    relationships: {
      rooms: roomIds,
      records:
        kind === 'room'
          ? relatedForRoom(id).map(({ kind, id }) => ({ kind, id }))
          : [],
      power: power ? resolveCircuitRef(power) : null,
      floorConflict:
        kind === 'camera'
          ? cameraFloorConflict(data as (typeof house.cameras)[number])
          : null,
    },
  });
}
