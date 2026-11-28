import { expect, test } from '@playwright/test';

test('operate a simulated single-pump controller and edit its stored settings', async ({
  page,
}) => {
  await page.addInitScript(() => {
    let input: ReadableStreamDefaultController<Uint8Array>;
    let state = 'idle',
      flow: number | null = null,
      trial = false,
      enabled = false,
      row = '',
      limit = '30';
    const status = () =>
      JSON.stringify({
        device: 'bench',
        fw: '0.1.0',
        build: 'simulated',
        uptime_s: 50,
        reset: 'power-on',
        pump: { state, remaining_ms: 5000 },
        clock: { trusted: true, tz_offset_min: 0 },
        calibration: { flow_ml_s: flow },
        today: { ml: 0, run_s: 0, limit_ml: 1000, limit_run_s: 180 },
        schedule: { state: enabled ? 'active' : 'off' },
        net: { transport: 'wifi', mqtt: true, link: true },
        log: { ok: true },
        storage_ok: true,
      });
    function reply(cmd: string) {
      if (cmd === 'time') return 'ok utc=unset source=none';
      if (cmd === 'status') return status();
      if (cmd === 'run 5') {
        state = 'running';
        return 'ok started 5 s';
      }
      if (cmd === '!') {
        state = 'idle';
        return 'ok stopped (!)';
      }
      if (cmd === 'cal run 3') {
        trial = true;
        return 'ok started 3 s';
      }
      if (cmd === 'cal')
        return 'ok uncalibrated' + (trial ? ' pending_trial=3 s' : '');
      if (cmd === 'cal set 6' && trial) {
        flow = 2;
        trial = false;
        return 'ok flow=2 mL/s';
      }
      if (cmd === 'sched')
        return 'ok schedule=' + (enabled ? 'on' : 'off') + ' grace=30min' + row;
      if (cmd === 'sched set 1 07:30 3 mon,tue,wed,thu,fri,sat') {
        row = '\n1 07:30 3mL mon,tue,wed,thu,fri,sat';
        return 'ok schedule updated';
      }
      if (cmd === 'sched set 1 07:30 4 mon,tue,wed,thu,fri,sat') {
        row = '\n1 07:30 4mL mon,tue,wed,thu,fri,sat';
        return 'ok schedule updated';
      }
      if (cmd === 'sched clear 1') {
        row = '';
        return 'ok schedule updated';
      }
      if (cmd === 'sched on' || cmd === 'sched off') {
        enabled = cmd === 'sched on';
        return 'ok schedule updated';
      }
      if (cmd === 'config limit.max_run_s 25') {
        limit = '25';
        return 'ok limit.max_run_s=25';
      }
      if (cmd === 'config limit.max_run_s')
        return 'ok limit.max_run_s=' + limit + '  # longest single dose';
      const read = /^config limit\.(rest_s|daily_ml|daily_run_s)$/.exec(cmd);
      if (read) return 'ok limit.' + read[1] + '=60';
      return 'error rejected: unexpected command ' + cmd;
    }
    Object.defineProperty(navigator, 'serial', {
      configurable: true,
      value: {
        requestPort: async () => ({
          open: async () => {},
          close: async () => {},
          readable: new ReadableStream({
            start(controller) {
              input = controller;
            },
          }),
          writable: new WritableStream({
            write(chunk) {
              for (const line of new TextDecoder()
                .decode(chunk)
                .trim()
                .split('\n')) {
                input.enqueue(new TextEncoder().encode(reply(line) + '\r\n'));
              }
            },
          }),
        }),
      },
    });
  });
  await page.goto('/#m=upkeep&s=u5&f=main');
  await expect(page.locator('#panel-right')).not.toContainText(
    'Manage watering system',
  );
  const nav = page.getByRole('navigation', { name: 'Documentation views' });
  await nav.getByRole('button', { name: 'Watering', exact: true }).click();
  await expect(
    nav.getByRole('button', { name: 'Watering', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(page).toHaveURL(/m=watering/);
  await expect(page.getByTestId('house-stage')).toBeHidden();
  const workspace = page.getByRole('region', { name: 'Watering system' });
  const button = (name: string) =>
    workspace.getByRole('button', { name, exact: true });
  await button('Select USB device').click();
  await workspace.getByLabel('Prime duration (s)').fill('5');
  await button('Prime pump').click();
  const pump = workspace.getByRole('region', { name: 'Pump output' });
  await expect(pump.locator('.wv-pump-state')).toHaveText('running');
  await button('Stop pump').click();
  await expect(pump.locator('.wv-pump-state')).toHaveText('idle');
  await button('Calibration').click();
  await workspace.getByLabel('Trial duration (s)').fill('3');
  await button('Start trial').click();
  await workspace.getByLabel('Collected water (mL)').fill('6');
  await button('Save measured flow').click();
  await expect(workspace.getByText('Stored flow 2 mL/s')).toBeVisible();
  await button('Schedule').click();
  await workspace.getByLabel('Local time').fill('07:30');
  await workspace.getByLabel('Dose (mL)', { exact: true }).fill('3');
  await workspace.getByLabel('Sunday', { exact: true }).uncheck();
  await button('Save slot 1').click();
  await expect(workspace.getByText(/1 of 8 slots/)).toBeVisible();
  const firstSlot = workspace.locator('.wv-slot').first();
  await expect(firstSlot).toContainText('3 mL · Mon, Tue, Wed, Thu, Fri, Sat');
  await button('Pump time').click();
  await workspace.getByLabel('Pump duration (s)', { exact: true }).fill('2');
  await button('Save slot 1').click();
  await expect(firstSlot).toContainText('4 mL');
  const automatic = button('Automatic watering');
  await automatic.click();
  await expect(automatic).toHaveAttribute('aria-pressed', 'true');
  await automatic.click();
  await expect(automatic).toHaveAttribute('aria-pressed', 'false');
  await button('Delete slot 1').click();
  await expect(workspace.getByText(/0 of 8 slots/)).toBeVisible();
  await button('Device').click();
  await workspace.getByLabel('Display name').fill('Fern pump');
  await workspace.getByLabel('Pump zone').fill('Window');
  await button('Save browser labels').click();
  await expect(
    workspace.getByRole('heading', { name: 'Fern pump' }),
  ).toBeVisible();
  await expect(workspace.getByText(/^Window · bench/)).toBeVisible();
  const maxRun = workspace.getByLabel('Maximum run (s)', { exact: true });
  await expect(maxRun).toHaveValue('30');
  await maxRun.fill('25');
  await button('Save maximum run (s)').click();
  await expect(maxRun).toHaveValue('25');
  await button('Disconnect').click();
  await expect(button('Prime pump')).toHaveCount(0);
  await nav.getByRole('button', { name: 'Upkeep', exact: true }).click();
  await expect(workspace).toHaveCount(0);
  await expect(page.getByTestId('house-stage')).toBeVisible();
});

// Exercise the shipped browser MQTT bundle against MQTT 3.1.1 frames.
// Hold the run reply to verify that an operator can still issue a stop.
test('MQTT correlates replies and allows a stop while priming awaits acknowledgement', async ({
  page,
}) => {
  const commands: string[] = [];
  let waiting = '';
  await page.routeWebSocket('**/watering-test', (ws) => {
    const send = (topic: string, message: string) => {
      const content = Buffer.from(message),
        name = Buffer.from('watering/fern/' + topic);
      const body = Buffer.alloc(2 + name.length + content.length);
      body.writeUInt16BE(name.length);
      name.copy(body, 2);
      content.copy(body, 2 + name.length);
      const length: number[] = [];
      let remaining = body.length;
      do {
        let byte = remaining % 128;
        remaining = Math.floor(remaining / 128);
        if (remaining) byte |= 128;
        length.push(byte);
      } while (remaining);
      ws.send(Buffer.concat([Buffer.from([0x30, ...length]), body]));
    };
    ws.onMessage((frame) => {
      const b = Buffer.from(frame);
      let offset = 1;
      while (b[offset++] & 128) {
        /* Skip encoded remaining length. */
      }
      switch (b[0] >> 4) {
        case 1:
          ws.send(Buffer.from([0x20, 2, 0, 0]));
          return;
        case 8:
          ws.send(Buffer.from([0x90, 5, b[offset], b[offset + 1], 0, 0, 0]));
          return;
        case 12:
          ws.send(Buffer.from([0xd0, 0]));
          return;
        case 3:
          break;
        default:
          return;
      }
      expect(b[0]).toBe(0x30);
      const nameLength = b.readUInt16BE(offset);
      expect(b.subarray(offset + 2, offset + 2 + nameLength).toString()).toBe(
        'watering/fern/cmd',
      );
      const message = b.subarray(offset + 2 + nameLength).toString();
      const tag = message.slice(0, message.indexOf(' ')),
        command = message.slice(tag.length + 1);
      expect(tag).toMatch(/^#[a-f0-9]{16}$/);
      commands.push(command);
      if (command === 'run 5') {
        waiting = tag;
        return;
      }
      if (command === 'stop') {
        send('reply', tag + ' ok stopped');
        send('reply', waiting + ' ok started 5 s');
        return;
      }
      const limit = /^config limit\.(\w+)$/.exec(command);
      if (limit) {
        send('reply', tag + ' ok limit.' + limit[1] + '=30  # limit');
        return;
      }
      send(
        'reply',
        tag +
          ' ' +
          JSON.stringify({
            device: 'fern',
            fw: '0.1.0',
            build: 'broker-test',
            uptime_s: 11,
            reset: 'power-on',
            pump: { state: 'idle' },
            clock: { trusted: true, tz_offset_min: 0 },
            calibration: { flow_ml_s: null },
            today: { ml: 0, run_s: 0, limit_ml: 1000, limit_run_s: 180 },
            schedule: { state: 'off' },
            net: { transport: 'wifi', mqtt: true, link: true },
            log: { ok: true },
            storage_ok: true,
          }),
      );
    });
  });
  await page.goto('/#m=watering');
  const workspace = page.getByRole('region', { name: 'Watering system' });
  await workspace
    .getByRole('button', { name: 'MQTT broker', exact: true })
    .click();
  await workspace
    .getByLabel('Broker WebSocket URL')
    .fill('ws://127.0.0.1:4173/watering-test');
  await workspace.getByLabel('Controller ID').fill('fern');
  await workspace
    .getByRole('button', { name: 'Connect to controller' })
    .click();
  await workspace.getByLabel('Prime duration (s)').fill('5');
  await workspace.getByRole('button', { name: 'Prime pump' }).click();
  await expect.poll(() => commands.includes('run 5')).toBe(true);
  await workspace.getByRole('button', { name: 'Stop pump' }).click();
  await expect.poll(() => commands.includes('stop')).toBe(true);
  expect(commands.filter((c) => c.startsWith('run'))).toEqual(['run 5']);
  await workspace.getByRole('button', { name: 'Device', exact: true }).click();
  await expect(
    workspace.getByLabel('Maximum run (s)', { exact: true }),
  ).toHaveText('30 s');
  await expect(workspace.getByText('Read-only')).toBeVisible();
  await expect(
    workspace.getByRole('button', { name: /^Save maximum run/ }),
  ).toHaveCount(0);
});
