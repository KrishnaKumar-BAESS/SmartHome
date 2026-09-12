import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import * as house from './house';

describe('house inventory migration', () => {
  it('preserves every inventory field and floor coordinate from the archived prototype', () => {
    const original = readFileSync(
      new URL(
        '../../../../../docs/archive/home-documentation/home-documentation.dc.html',
        import.meta.url,
      ),
      'utf8',
    );
    const logic = original.match(
      /<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/,
    )?.[1];
    expect(logic).toBeDefined();
    // Only the checked-in, archived source is evaluated here; no runtime template evaluation ships to browsers.
    const baseline = runInNewContext(
      logic + '; new Component()',
      { DCLogic: class {} },
      { timeout: 1000 },
    ) as Record<string, unknown>;
    for (const [name, value] of Object.entries(house)) {
      expect(value, name).toEqual(JSON.parse(JSON.stringify(baseline[name])));
    }
  });

  it('has unique inventory IDs and valid camera, sensor, circuit, and network references', () => {
    const collections = [
      house.rooms,
      house.circuits,
      house.boxes,
      house.bulbs,
      house.cameras,
      house.sensors,
      house.upkeep,
      house.nodes,
      house.networks,
      house.servers,
    ];
    for (const collection of collections)
      expect(new Set(collection.map((item) => item.id)).size).toBe(
        collection.length,
      );
    const roomIds = new Set(house.rooms.map((room) => room.id));
    const circuitIds = new Set(house.circuits.map((circuit) => circuit.id));
    for (const item of [...house.cameras, ...house.sensors, ...house.upkeep])
      expect(roomIds.has(item.roomId), item.id).toBe(true);
    for (const room of house.rooms) {
      expect(room.verts.length).toBeGreaterThanOrEqual(3);
      for (const point of room.verts)
        expect(point.every(Number.isFinite)).toBe(true);
      for (const connection of room.sw ?? [])
        expect(circuitIds.has(connection.c)).toBe(true);
    }
    for (const circuit of house.circuits)
      expect(house.boxes.some((box) => box.id === circuit.box)).toBe(true);
    for (const node of house.nodes)
      for (const network of node.nets)
        expect(house.networks.some((item) => item.id === network)).toBe(true);
  });
});
