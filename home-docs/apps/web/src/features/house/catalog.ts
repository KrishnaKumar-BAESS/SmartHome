import {
  boxes,
  bulbs,
  cameras,
  circuits,
  nodeRoomId,
  nodes,
  rooms,
  sensors,
  servers,
  upkeep,
} from '../../data/house';

/** Snapshot the recorded inventory describes; values do not advance. */
export const INVENTORY_SNAPSHOT = 'July 2026';

/** Sound zones are presentation content kept out of the preserved inventory. */
export const zones = [
  {
    id: 'zoneA',
    name: 'Home Theater',
    roomId: 'bsmt_home_theater',
    room: 'Basement · 262 sq ft · tiered platforms',
    config: '7.2.4',
    power: 'AV rack on BS·4',
    source: 'AV rack · theater mesh node',
    gear: [
      { l: 'AV Processor', d: '[ model ] + amp' },
      { l: 'Projector + screen', d: '4K · 120" screen' },
      { l: 'Front L / C / R', d: '3 × behind screen' },
      { l: 'Surround L / R', d: '2 × in-wall' },
      { l: 'Rear L / R', d: '2 × in-wall' },
      { l: 'Height', d: '4 × in-ceiling' },
      { l: 'Subwoofer', d: '2 × ported' },
    ],
  },
  {
    id: 'zoneB',
    name: 'Great Room',
    roomId: 'living_room',
    room: 'Main floor · vaulted living',
    config: '7.2.4 Atmos',
    power: 'AV on MP·16 · room MP·14',
    source: 'Fed by Pi-5 media servers',
    gear: [
      { l: 'AV Receiver', d: '11-channel · [ model ]' },
      { l: 'Front L / C / R', d: '3 × floorstanding' },
      { l: 'Surround L / R', d: '2 × in-wall' },
      { l: 'Rear L / R', d: '2 × in-wall' },
      { l: 'Height (Atmos)', d: '4 × in-ceiling' },
      { l: 'Subwoofer', d: '2 × sealed' },
    ],
  },
] as const;

export type Zone = (typeof zones)[number];

/** Bulb display-room names mapped to model room IDs (null = not on plan). */
export const bulbRoomIds: Record<string, string | null> = {
  'Home Theater': 'bsmt_home_theater',
  'Wine Cellar': 'bsmt_wine_cellar',
  'Bar Area': 'bsmt_living_north',
  'Living Room': 'bsmt_living_north',
  'Living Area': 'bsmt_living_north',
  'Workout Room': 'bsmt_workout_room',
  Study: 'bsmt_study',
  Bathroom: 'bsmt_bath_and_stairs',
  'Stairs & Storage': 'bsmt_hallway',
  Kitchen: 'kitchen_breakfast_room',
  'Great Room': 'living_room',
  'Entry Foyer': 'foyer',
  Garage: 'garage',
  'Primary Bedroom': 'master_bedroom',
  'Bedroom 2': 'room_above_parlor',
  'Rear Deck': null,
};

export function bulbRoomId(name: string): string | null {
  return Object.prototype.hasOwnProperty.call(bulbRoomIds, name)
    ? bulbRoomIds[name]
    : null;
}

/** Every display-name alias that maps to a model room, keyed by room ID. */
export const roomAliases: Record<string, string[]> = (() => {
  const out: Record<string, string[]> = {};
  for (const b of bulbs) {
    const rid = bulbRoomId(b.room);
    if (!rid) continue;
    const list = (out[rid] ??= []);
    if (!list.includes(b.room)) list.push(b.room);
  }
  return out;
})();

/** Short glossary for technical shorthand used by the recorded inventory. */
export const glossary: Record<string, string> = {
  RH: 'relative humidity',
  RO: 'reverse osmosis',
  UHP: 'ultra-high-pressure mercury (projector lamp type)',
  GPD: 'gallons per day',
  TFC: 'thin-film composite (membrane)',
  GAC: 'granular activated carbon',
  GFCI: 'ground-fault circuit interrupter',
  PoE: 'power over Ethernet',
  NVR: 'network video recorder',
  ONT: 'optical network terminal',
  IR: 'infrared',
  '7.2.4': '7 main speakers, 2 subwoofers, 4 height channels',
  AP: 'access point',
  AV: 'audio/video',
  ISP: 'internet service provider',
};

export type CircuitRef = {
  text: string;
  circuitId: string | null;
  tag: string | null;
};

/**
 * Resolve a recorded power reference such as `PoE · MP·9` against the
 * circuit inventory. Unmatched tags are surfaced as unverified, never guessed.
 */
export function resolveCircuitRef(text: string): CircuitRef {
  const m = /\b(MP|BS)·(\d+)\b/.exec(text);
  if (!m) return { text, circuitId: null, tag: null };
  const box = boxes.find((b) => b.short === m[1]);
  const no = Number(m[2]);
  const circuit = box
    ? circuits.find((c) => c.box === box.id && c.no === no)
    : undefined;
  return { text, circuitId: circuit?.id ?? null, tag: `${m[1]}·${m[2]}` };
}

export function circuitTag(circuitId: string): string {
  const c = circuits.find((x) => x.id === circuitId);
  if (!c) return circuitId;
  const bx = boxes.find((b) => b.id === c.box);
  return `${bx?.short ?? c.box}·${c.no}`;
}

/** Cameras whose recorded floor disagrees with their mapped room's floor. */
export function cameraFloorConflict(cam: {
  floor: string;
  roomId: string;
}): { recorded: string; mapped: string } | null {
  const room = rooms.find((r) => r.id === cam.roomId);
  if (!room || room.floor === cam.floor) return null;
  return { recorded: cam.floor, mapped: room.floor };
}

export type RelatedRecord = {
  kind:
    | 'circuit'
    | 'bulb'
    | 'node'
    | 'server'
    | 'camera'
    | 'sensor'
    | 'upkeep'
    | 'zone';
  id: string;
  label: string;
  sub: string;
  accent: string;
};

const ACCENT = {
  circuit: '#3b6fb0',
  bulb: '#e0a043',
  node: '#3f9a8c',
  server: '#3f9a8c',
  camera: '#c0573b',
  sensor: '#3f9a8c',
  upkeep: '#b07b3b',
  zone: '#7b5cd6',
};

/** Every recorded item associated with a model room, for cross-system links. */
export function relatedForRoom(roomId: string): RelatedRecord[] {
  const out: RelatedRecord[] = [];
  const room = rooms.find((r) => r.id === roomId);
  if (!room) return out;
  for (const sw of room.sw ?? []) {
    const c = circuits.find((x) => x.id === sw.c);
    if (c)
      out.push({
        kind: 'circuit',
        id: c.id,
        label: `${circuitTag(c.id)} · ${c.label}`,
        sub: `${c.amp} A · ${c.type}`,
        accent: ACCENT.circuit,
      });
  }
  for (const b of bulbs)
    if (bulbRoomId(b.room) === roomId)
      out.push({
        kind: 'bulb',
        id: b.id,
        label: b.fixture,
        sub: `${b.brand} ${b.model} · ${b.st === 'ok' ? 'OK' : b.st === 'soon' ? 'due soon' : 'overdue'}`,
        accent: ACCENT.bulb,
      });
  for (const n of nodes)
    if (nodeRoomId[n.room as keyof typeof nodeRoomId] === roomId)
      out.push({
        kind: 'node',
        id: n.id,
        label: n.name,
        sub: `${n.role} · ${n.status === 'warn' ? 'weak' : 'OK'}`,
        accent: ACCENT.node,
      });
  for (const s of servers) {
    const node = nodes.find((n) => n.id === s.node);
    if (node && nodeRoomId[node.room as keyof typeof nodeRoomId] === roomId)
      out.push({
        kind: 'server',
        id: s.id,
        label: s.name,
        sub: s.kind,
        accent: ACCENT.server,
      });
  }
  for (const z of zones)
    if (z.roomId === roomId)
      out.push({
        kind: 'zone',
        id: z.id,
        label: `${z.name} sound zone`,
        sub: z.config,
        accent: ACCENT.zone,
      });
  for (const c of cameras)
    if (c.roomId === roomId)
      out.push({
        kind: 'camera',
        id: c.id,
        label: c.name,
        sub: `${c.type} · ${c.status}`,
        accent: ACCENT.camera,
      });
  for (const s of sensors)
    if (s.roomId === roomId)
      out.push({
        kind: 'sensor',
        id: s.id,
        label: `${s.name} sensor`,
        sub: `${s.target} · planned`,
        accent: ACCENT.sensor,
      });
  for (const u of upkeep)
    if (u.roomId === roomId)
      out.push({
        kind: 'upkeep',
        id: u.id,
        label: u.kind,
        sub: `${u.device} · ${u.status === 'ok' ? 'OK' : u.status === 'soon' ? 'due soon' : 'overdue'}`,
        accent: ACCENT.upkeep,
      });
  return out;
}

const STATUS_RANK: Record<string, number> = {
  overdue: 3,
  soon: 2,
  warn: 2,
  ok: 1,
};

/** The most urgent recorded status among a set of items. */
export function worstStatus(statuses: string[]): string {
  let best = 'ok',
    rank = 0;
  for (const s of statuses) {
    const r = STATUS_RANK[s] ?? 0;
    if (r > rank) {
      rank = r;
      best = s;
    }
  }
  return best;
}
