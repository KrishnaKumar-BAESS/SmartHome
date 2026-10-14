import { describe, expect, it, vi } from 'vitest';
import {
  createAgentApi,
  type AgentPort,
  type Command,
  type ViewState,
} from './agent-api';
import { collections, getData, getRecord, recordKinds } from './agent-data';

function harness() {
  let state = { mode: 'overview', camera: { yaw: 35 } } as ViewState;
  const port: AgentPort = {
    read: () => state,
    apply: vi.fn(async (patch) => {
      state = { ...state, ...patch } as ViewState;
    }),
    select: vi.fn(async () => {}),
    reset: vi.fn(async () => {}),
    index: [],
  };
  return {
    port,
    handle: createAgentApi(port),
    change: () => {
      state = { ...state, mode: 'lighting' };
    },
  };
}

describe('agent data', () => {
  it('covers every collection and preserves provenance and relationships without sharing mutable data', () => {
    const snapshot = getData();
    expect(Object.keys(snapshot.collections)).toEqual(recordKinds);
    for (const kind of recordKinds) {
      for (const item of collections[kind]) {
        const record = getRecord(kind, item.id)!;
        expect(record.data).toEqual(item);
        expect(record.provenance.liveTelemetry).toBe(false);
        expect(record.data).not.toBe(item);
      }
    }
    expect(getRecord('node', 'n1')?.provenance.observedAt).toBeTruthy();
    expect(getRecord('room', 'garage')?.relationships.records).toContainEqual({
      kind: 'circuit',
      id: 'm01',
    });
    expect(getRecord('camera', 'c1')?.relationships.rooms).not.toHaveLength(0);
    snapshot.collections.room[0].name = 'Changed by caller';
    expect(getData().collections.room[0].name).not.toBe('Changed by caller');
  });
  it('filters and paginates without truncating discovery or accepting malformed input', () => {
    const {
      handle: { api },
    } = harness();
    const all = api.query({ limit: 500 });
    expect(all.total).toBe(
      Object.values(collections).reduce((n, items) => n + items.length, 0),
    );
    const first = api.query({ limit: 2 });
    expect(first.nextOffset).toBe(2);
    expect(api.query({ offset: 2, limit: 2 }).records[0]).toEqual(
      all.records[2],
    );
    expect(
      api
        .query({ kind: 'circuit', roomId: 'garage' })
        .records.some((r) => r.id === 'm01'),
    ).toBe(true);
    expect(api.query({ kind: 'node', text: 'TP-Link' }).total).toBeGreaterThan(
      0,
    );
    expect(api.query({ text: 'no-such-inventory-record' }).records).toEqual([]);
    expect(() => api.query({ limit: 1.5 })).toThrow('integers');
    expect(() => api.getRecord('__proto__' as 'room', 'x')).toThrow(
      'expected one of',
    );
    expect(api.getRecord('room', 'missing')).toBeNull();
  });
});

describe('agent command lifecycle', () => {
  it('rejects invalid commands atomically, then accepts the next valid command', async () => {
    const {
      handle: { api },
      port,
    } = harness();
    for (const command of [
      { type: 'view.set', view: { mode: 'security', camera: { zoom: 100 } } },
      { type: 'view.set', view: { camera: { yaw: NaN } } },
      { type: 'view.set', view: { camera: { pitch: Infinity } } },
      { type: 'view.set', view: { surprise: true } },
      { type: 'view.set', view: { isolation: { rooms: ['not-a-room'] } } },
      { type: 'view.set', view: { theme: 'unknown' } },
      { type: 'view.set', view: null },
      { type: 'inventory.delete' },
      JSON.parse('{"type":"view.set","view":{"__proto__":{}}}') as unknown,
    ]) {
      await expect(api.execute(command as Command)).rejects.toMatchObject({
        code: 'INVALID_ARGUMENT',
      });
    }
    await expect(
      api.execute({ type: 'record.select', kind: 'camera', id: 'missing' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(port.apply).not.toHaveBeenCalled();
    expect(port.select).not.toHaveBeenCalled();
    expect(
      (await api.execute({ type: 'view.set', view: { mode: 'sound' } })).view
        .mode,
    ).toBe('sound');
  });
  it('serializes commands and snapshots input at submission', async () => {
    const {
      handle: { api },
      port,
    } = harness();
    const command: Command = { type: 'view.set', view: { mode: 'security' } };
    const first = api.execute(command);
    command.view.mode = 'climate';
    const second = api.execute({
      type: 'view.set',
      view: { mode: 'electrical' },
    });
    expect((await first).view.mode).toBe('security');
    expect((await second).view.mode).toBe('electrical');
    expect(port.apply).toHaveBeenCalledTimes(2);
  });
  it('observes manual and command changes with isolated snapshots and unsubscribe', async () => {
    const { handle, change } = harness();
    const observer = vi.fn();
    handle.api.subscribe(() => {
      throw new Error('consumer failed');
    });
    handle.api.subscribe((snapshot) => {
      snapshot.view.mode = 'upkeep';
    });
    const unsubscribe = handle.api.subscribe(observer);
    change();
    handle.publish();
    expect(observer.mock.calls[0][0].view.mode).toBe('lighting');
    handle.publish();
    expect(observer).toHaveBeenCalledTimes(1);
    await handle.api.execute({ type: 'view.set', view: { mode: 'security' } });
    expect(observer.mock.calls[1][0].revision).toBe(2);
    unsubscribe();
    change();
    handle.publish();
    expect(observer).toHaveBeenCalledTimes(2);
  });
  it('rejects pending and future work when the mounted controller disappears', async () => {
    const { handle, port } = harness();
    let finish!: () => void;
    port.apply = () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      });
    const pending = handle.api.execute({
      type: 'view.set',
      view: { mode: 'security' },
    });
    const assertion = expect(pending).rejects.toMatchObject({
      code: 'UNAVAILABLE',
    });
    await Promise.resolve();
    handle.dispose();
    await assertion;
    finish();
    expect(() => handle.api.getState()).toThrow('unmounted');
    await expect(
      handle.api.execute({ type: 'view.reset' }),
    ).rejects.toMatchObject({ code: 'UNAVAILABLE' });
  });
});
