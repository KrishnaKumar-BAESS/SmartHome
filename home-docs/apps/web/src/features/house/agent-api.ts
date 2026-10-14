import { floorLabels, rooms, bulbs } from '../../data/house';
import { connectAgentBridge } from './agent-bridge';
import {
  collections,
  dataProvenance,
  focusId,
  getData,
  getRecord,
  modes,
  recordKinds,
  type Mode,
  type RecordKind,
} from './agent-data';
import {
  AgentError,
  choice,
  objectSchema,
  validate,
  type Schema,
} from './agent-schema';

export type ViewPatch = {
  mode?: Mode;
  search?: string;
  searchCategory?: string;
  electricalFilter?: string;
  lightingFilter?: string;
  lightingRoom?: string;
  cameraFilter?: string;
  upkeepFilter?: string;
  isolation?: { floor?: string; rooms?: string[] };
  camera?: {
    yaw?: number;
    pitch?: number;
    zoom?: number;
    panX?: number;
    panY?: number;
  };
  panels?: { list?: boolean; details?: boolean };
  separation?: 'stacked' | 'floors' | 'full';
  theme?: 'system' | 'light' | 'dark';
  labels?: boolean;
  legend?: boolean;
  help?: boolean;
  liveCameras?: boolean;
  shortcuts?: boolean;
};
export type ViewState = Required<
  Omit<ViewPatch, 'isolation' | 'camera' | 'panels'>
> & {
  isolation: { floor: string; rooms: string[] };
  camera: {
    yaw: number;
    pitch: number;
    zoom: number;
    panX: number;
    panY: number;
  };
  panels: { list: boolean; details: boolean };
  selection: { kind: RecordKind; id: string } | null;
  visibleRoomIds: string[];
  autoRotate: boolean;
  effectiveTheme: 'light' | 'dark';
  hash: string;
};
export type Command =
  | { type: 'view.set'; view: ViewPatch }
  | { type: 'record.select'; kind: RecordKind; id: string }
  | { type: 'view.reset' };
export type Query = {
  kind?: RecordKind;
  text?: string;
  roomId?: string;
  floor?: string;
  offset?: number;
  limit?: number;
};
type IndexItem = { focusId: string; label: string; sub: string; h: string };
export type AgentPort = {
  read: () => ViewState;
  apply: (view: ViewPatch) => Promise<void>;
  select: (focusId: string) => Promise<void>;
  reset: () => Promise<void>;
  index: readonly IndexItem[];
};

const bool: Schema = { type: 'boolean' };
const text: Schema = { type: 'string', maxLength: 500 };
const number = (minimum: number, maximum: number): Schema => ({
  type: 'number',
  minimum,
  maximum,
});
const floors = Object.keys(floorLabels);
const roomIds = rooms.map((r) => r.id);
const statusFilters = ['all', 'due', 'soon', 'overdue'];
const categories = [
  'all',
  'Room',
  'Circuit',
  'Panel',
  'Light',
  'Network',
  'Node',
  'Server',
  'Sound',
  'Camera',
  'Climate',
  'Upkeep',
];
const viewSchema = objectSchema({
  mode: choice(modes),
  search: text,
  searchCategory: choice(categories),
  electricalFilter: choice([
    'all',
    'Lighting',
    'Outlets',
    'Appliance',
    'Mixed',
  ]),
  lightingFilter: choice([...statusFilters, 'smart']),
  lightingRoom: choice([
    'all',
    ...roomIds.map((id) => `rid:${id}`),
    ...bulbs.map((b) => `name:${b.room}`),
  ]),
  cameraFilter: choice(['all', 'outdoor', 'indoor', 'offline']),
  upkeepFilter: choice(['all', 'due', 'overdue']),
  isolation: objectSchema({
    floor: choice(['all', ...floors]),
    rooms: { type: 'array', items: choice(roomIds), maxItems: rooms.length },
  }),
  camera: objectSchema({
    yaw: number(-36000, 36000),
    pitch: number(12, 88),
    zoom: number(0.4, 4),
    panX: number(-10000, 10000),
    panY: number(-10000, 10000),
  }),
  panels: objectSchema({ list: bool, details: bool }),
  separation: choice(['stacked', 'floors', 'full']),
  theme: choice(['system', 'light', 'dark']),
  labels: bool,
  legend: bool,
  help: bool,
  liveCameras: bool,
  shortcuts: bool,
});
const commandSchemas = {
  'view.set': objectSchema({ type: choice(['view.set']), view: viewSchema }, [
    'type',
    'view',
  ]),
  'record.select': objectSchema(
    { type: choice(['record.select']), kind: choice(recordKinds), id: text },
    ['type', 'kind', 'id'],
  ),
  'view.reset': objectSchema({ type: choice(['view.reset']) }, ['type']),
};
const querySchema = objectSchema({
  kind: choice(recordKinds),
  text,
  roomId: choice(roomIds),
  floor: choice(floors),
  offset: number(0, 100000),
  limit: number(1, 500),
});

export function createAgentApi(port: AgentPort) {
  let active = true;
  let revision = 0;
  let queue = Promise.resolve();
  const listeners = new Set<(state: Snapshot) => void>();
  const pending = new Set<(error: AgentError) => void>();
  const available = () => {
    if (!active)
      throw new AgentError(
        'UNAVAILABLE',
        'Atlas is unmounted; wait for window.smartHome again.',
      );
  };
  const getState = () => {
    available();
    return structuredClone({
      version: '1.0' as const,
      revision,
      view: port.read(),
    });
  };
  type Snapshot = ReturnType<typeof getState>;
  let previous = JSON.stringify(port.read());
  const publish = () => {
    if (!active) return;
    const next = JSON.stringify(port.read());
    if (previous === next) return;
    previous = next;
    revision++;
    for (const listener of listeners) {
      try {
        listener(getState());
      } catch {
        /* An observer cannot break the app or other observers. */
      }
    }
  };
  const readRecord = (kind: RecordKind, id: string) => {
    available();
    validate(kind, choice(recordKinds), 'kind');
    validate(id, text, 'id');
    return getRecord(kind, id);
  };
  const api = Object.freeze({
    version: '1.0' as const,
    describe() {
      available();
      return structuredClone({
        version: '1.0',
        provenance: dataProvenance,
        methods: [
          'describe',
          'getData',
          'query',
          'getRecord',
          'getState',
          'execute',
          'subscribe',
        ],
        modes,
        collections: recordKinds.map((kind) => ({
          kind,
          count: collections[kind].length,
        })),
        commands: commandSchemas,
        query: querySchema,
        errors: ['INVALID_ARGUMENT', 'NOT_FOUND', 'UNAVAILABLE'],
        semantics:
          'Commands are serialized and resolve after React commits. Only view state changes; inventory is read-only. Isolation rooms take precedence over floor. On narrow screens the last requested open panel wins (details wins if both requested). Camera changes stop existing motion. Subscriptions observe UI and programmatic changes; unsubscribe on disposal.',
      });
    },
    getData() {
      available();
      return getData();
    },
    getRecord: readRecord,
    query(query: Query = {}) {
      available();
      validate(query, querySchema);
      if (![query.offset ?? 0, query.limit ?? 50].every(Number.isInteger))
        throw new AgentError(
          'INVALID_ARGUMENT',
          'offset and limit must be integers',
        );
      const terms = (query.text ?? '')
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      const all = (query.kind ? [query.kind] : recordKinds)
        .flatMap((kind) =>
          collections[kind].map((item) => {
            const record = getRecord(kind, item.id)!;
            const index = port.index.find(
              (entry) => entry.focusId === focusId(kind, item.id),
            );
            return {
              ...record,
              label: index?.label ?? item.id,
              summary: index?.sub ?? '',
              searchText:
                `${index?.h ?? ''} ${JSON.stringify(item)}`.toLowerCase(),
            };
          }),
        )
        .filter(
          (record) =>
            (!query.roomId || record.roomIds.includes(query.roomId)) &&
            (!query.floor ||
              record.roomIds.some(
                (id) => rooms.find((r) => r.id === id)?.floor === query.floor,
              )) &&
            terms.every((term) => record.searchText.includes(term)),
        );
      const offset = query.offset ?? 0;
      const end = offset + (query.limit ?? 50);
      return {
        total: all.length,
        offset,
        nextOffset: end < all.length ? end : null,
        records: all
          .slice(offset, end)
          .map(({ searchText: _searchText, ...record }) => record),
      };
    },
    getState,
    execute(input: Command): Promise<Snapshot> {
      // Validate and detach at submission, before queuing or changing any state.
      let command: Command;
      try {
        available();
        const type = (input as Command | null)?.type;
        if (
          !type ||
          !Object.prototype.hasOwnProperty.call(commandSchemas, type)
        )
          throw new AgentError(
            'INVALID_ARGUMENT',
            'Unknown command type; call describe().',
          );
        validate(input, commandSchemas[type]);
        command = structuredClone(input);
        if (
          command.type === 'record.select' &&
          !getRecord(command.kind, command.id)
        )
          throw new AgentError(
            'NOT_FOUND',
            `No ${command.kind} record ${command.id}`,
          );
      } catch (error) {
        return Promise.reject(error);
      }
      return new Promise<Snapshot>((resolve, reject) => {
        pending.add(reject);
        queue = queue
          .then(async () => {
            available();
            if (command.type === 'view.set') await port.apply(command.view);
            else if (command.type === 'record.select')
              await port.select(focusId(command.kind, command.id));
            else await port.reset();
            available();
            publish();
            resolve(getState());
          })
          .catch(reject)
          .finally(() => {
            pending.delete(reject);
          });
      });
    },
    subscribe(listener: (state: Snapshot) => void) {
      available();
      if (typeof listener !== 'function')
        throw new AgentError('INVALID_ARGUMENT', 'listener must be a function');
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  });
  return {
    api,
    publish,
    dispose() {
      active = false;
      listeners.clear();
      for (const reject of pending)
        reject(
          new AgentError(
            'UNAVAILABLE',
            'Atlas unmounted before command completed.',
          ),
        );
      pending.clear();
    },
  };
}

export type SmartHomeApi = ReturnType<typeof createAgentApi>['api'];
declare global {
  interface Window {
    smartHome?: SmartHomeApi;
  }
}

/** Install only for the lifetime of the mounted atlas, including StrictMode remounts. */
export function installAgentApi(port: AgentPort) {
  const handle = createAgentApi(port);
  window.smartHome = handle.api;
  const disconnect = connectAgentBridge(handle.api);
  window.dispatchEvent(new Event('smarthome:ready'));
  return {
    publish: handle.publish,
    dispose() {
      disconnect();
      handle.dispose();
      if (window.smartHome === handle.api) delete window.smartHome;
    },
  };
}
