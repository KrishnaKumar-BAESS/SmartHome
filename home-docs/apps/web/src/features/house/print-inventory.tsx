import {
  boxes,
  bulbs,
  cameras,
  circuits,
  floorLabels,
  nodes,
  rooms,
  sensors,
  servers,
  upkeep,
} from '../../data/house';
import { INVENTORY_SNAPSHOT, zones } from './catalog';

type Floor = keyof typeof floorLabels;

const status = (s: string) =>
  s === 'ok'
    ? 'OK'
    : s === 'soon'
      ? 'Due soon'
      : s === 'overdue'
        ? 'Overdue'
        : s === 'warn'
          ? 'Weak'
          : s;

function Table({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <table>
      <caption>{caption}</caption>
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h} scope="col">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Flow-based inventory shown only when printing. The interactive stage is a
 * fixed one-viewport composition that cannot paginate, so print gets tables.
 */
export function PrintInventory() {
  const tag = (id: string) => {
    const c = circuits.find((x) => x.id === id);
    const b = c && boxes.find((x) => x.id === c.box);
    return c && b ? `${b.short}·${c.no}` : id;
  };
  return (
    <section className="print-only" aria-hidden="true">
      <h1>HOUSE.SYS · recorded inventory</h1>
      <p>
        Snapshot {INVENTORY_SNAPSHOT}. Statuses, dates, and usage values are
        recorded documentation, not live readings. Camera previews and event
        history in the app are demonstrations and are not printed.
      </p>
      <Table
        caption="Rooms"
        head={['Room', 'Floor', 'Documented circuits']}
        rows={rooms.map((r) => [
          r.name,
          floorLabels[r.floor as Floor],
          (r.sw ?? []).map((s) => tag(s.c)).join(', ') || '—',
        ])}
      />
      <Table
        caption="Circuits"
        head={['Circuit', 'Panel', 'Amps', 'Type', 'Label']}
        rows={circuits.map((c) => [
          tag(c.id),
          boxes.find((b) => b.id === c.box)?.name ?? c.box,
          c.amp,
          c.type,
          c.label,
        ])}
      />
      <Table
        caption="Fixture records (a record may cover several bulbs)"
        head={[
          'Room',
          'Fixture',
          'Status',
          'W',
          'lm',
          'K',
          'Brand / model',
          'Replaced',
        ]}
        rows={bulbs.map((b) => [
          b.room,
          b.fixture,
          status(b.st),
          b.w,
          b.lm ?? '—',
          b.k,
          `${b.brand} ${b.model}`,
          b.replaced,
        ])}
      />
      <Table
        caption="Mesh nodes"
        head={['Node', 'Role', 'Room', 'Backhaul', 'Plug', 'Status']}
        rows={nodes.map((n) => [
          n.name,
          n.role,
          n.room,
          n.backhaul,
          n.plug,
          status(n.status),
        ])}
      />
      <Table
        caption="Servers"
        head={['Server', 'Kind', 'Room', 'Power reference']}
        rows={servers.map((s) => [s.name, s.kind, s.room, s.power])}
      />
      <Table
        caption="Sound zones (schematic layouts)"
        head={['Zone', 'Configuration', 'Room', 'Power', 'Source']}
        rows={zones.map((z) => [z.name, z.config, z.room, z.power, z.source])}
      />
      <Table
        caption="Cameras (recorded status; coverage is illustrative)"
        head={[
          'Camera',
          'Type',
          'Room',
          'Resolution',
          'Recording',
          'Storage',
          'Power',
          'Status',
        ]}
        rows={cameras.map((c) => [
          c.name,
          c.type,
          c.room,
          c.res,
          c.rec,
          c.store,
          c.power,
          c.status,
        ])}
      />
      <Table
        caption="Planned climate sensors"
        head={['Sensor', 'Mount', 'Will report', 'Status']}
        rows={sensors.map((s) => [s.name, s.mount, s.target, s.status])}
      />
      <Table
        caption="Replacements"
        head={['Item', 'Device', 'Part', 'Recorded use', 'Last done', 'Status']}
        rows={upkeep.map((u) => [
          u.kind,
          u.device,
          u.part,
          u.metric === 'level'
            ? `${u.used}% remaining`
            : `${u.used} of ${u.life} ${u.metric === 'hours' ? 'h' : 'mo'}`,
          u.lastDone,
          status(u.status),
        ])}
      />
    </section>
  );
}
