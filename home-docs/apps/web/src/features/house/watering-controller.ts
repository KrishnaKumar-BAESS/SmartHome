import { useEffect, useRef, useState } from 'react';
import {
  connectBroker,
  connectUsb,
  type Connection,
} from './watering-transport';
import { parseStatus, type Status } from './watering-protocol';
import {
  describeEvent,
  formatNumber,
  sentence,
  type EventTone,
} from './watering-format';

export const errorText = (e: unknown) =>
  e instanceof Error ? e.message : 'Device unavailable.';
export type Send = (command: string) => Promise<boolean>;
export type Mode = 'USB' | 'MQTT';
export type Names = { name: string; zone: string };
export type BrokerForm = {
  broker: string;
  id: string;
  username: string;
  password: string;
};
export type Activity = {
  id: number;
  at: number;
  origin: 'device' | 'browser';
  title: string;
  detail: string;
  tone: EventTone;
};

/** Reports older than this block new commands; the stop request is exempt. */
export const STALE_MS = 8000;

export function readNames(key: string): Names {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? 'null');
    return {
      name: typeof v?.name === 'string' ? v.name : '',
      zone: typeof v?.zone === 'string' ? v.zone : '',
    };
  } catch {
    return { name: '', zone: '' };
  }
}

/** Human wording for an accepted command, for the session activity list. */
function commandTitle(command: string): string {
  const [op, ...rest] = command.split(' ');
  const last = rest.at(-1) ?? '';
  if (command === 'stop') return 'Stop requested';
  if (op === 'run') return `Prime ${formatNumber(Number(last))} s`;
  if (op === 'water') return `Water ${formatNumber(Number(last))} mL`;
  if (command.startsWith('cal run'))
    return `Calibration trial ${formatNumber(Number(last))} s`;
  if (command.startsWith('cal set'))
    return `Measured ${formatNumber(Number(last))} mL`;
  if (command === 'sched on') return 'Schedule enabled';
  if (command === 'sched off') return 'Schedule paused';
  if (command.startsWith('sched set')) return `Slot ${rest[1]} saved`;
  if (command.startsWith('sched clear')) return `Slot ${last} cleared`;
  if (command.startsWith('config tz.offset')) return 'UTC offset saved';
  if (command.startsWith('config limit.')) return 'Runtime limit saved';
  return command;
}

const SILENT = new Set(['status', 'sched', 'cal']);

/**
 * One browser session with one controller. Connection epochs discard
 * replies from superseded sessions; the action lock serializes commands
 * while a stop request always goes straight through.
 */
export function useWateringController() {
  const live = useRef<Connection | null>(null),
    epoch = useRef(0),
    lock = useRef(false);
  const [session, setSession] = useState<Connection | null>(null);
  const [mode, setMode] = useState<Mode>('USB'),
    [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState<Status>(),
    [diagnostic, setDiagnostic] = useState('');
  const [observed, setObserved] = useState(0);
  const [notice, setNotice] = useState(''),
    [alert, setAlert] = useState('');
  const [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0);
  const [names, setNames] = useState<Names>({ name: '', zone: '' });
  const [activity, setActivity] = useState<Activity[]>([]);
  const [ended, setEnded] = useState(false);
  const latestAction = useRef(0);
  const profile = useRef(''),
    scope = useRef(''),
    identity = useRef(''),
    serial = useRef(0);
  const log = (item: Omit<Activity, 'id' | 'at'>) =>
    setActivity((list) =>
      [{ ...item, id: ++serial.current, at: Date.now() }, ...list].slice(0, 40),
    );
  // Confirmations fade on their own; alerts stay until dismissed.
  useEffect(() => {
    if (!notice || notice.endsWith('…')) return;
    const timer = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    return () => {
      epoch.current = epoch.current + 1;
      live.current?.close();
      live.current = null;
    };
  }, []);
  function disconnect(reason = '') {
    setEnded(live.current !== null);
    epoch.current = epoch.current + 1;
    live.current?.close();
    live.current = null;
    setSession(null);
    setStatus(undefined);
    setDiagnostic('');
    setObserved(0);
    setBusy(false);
    lock.current = false;
    setConnecting(false);
    setActivity([]);
    setNotice('');
    setAlert(reason);
    profile.current = '';
    identity.current = '';
    setNames({ name: '', zone: '' });
  }
  async function start(form: BrokerForm) {
    const generation = ++epoch.current;
    setConnecting(true);
    setNotice('');
    setAlert('');
    const signals = {
      lost: (reason: string) => {
        if (epoch.current === generation) disconnect(reason);
      },
      event: (line: string) => {
        if (epoch.current !== generation) return;
        try {
          const v = JSON.parse(line);
          if (typeof v.event === 'string' && !v.replay)
            log({ origin: 'device', ...describeEvent(v) });
        } catch {
          /* Ignore malformed event messages. */
        }
      },
    };
    try {
      const connection =
        mode === 'USB'
          ? await connectUsb(signals)
          : await connectBroker(
              form.broker.trim(),
              form.id.trim(),
              form.username,
              form.password,
              signals,
            );
      if (epoch.current !== generation) {
        connection.close();
        return;
      }
      scope.current = connection.usb
        ? 'usb'
        : new URL(form.broker.trim()).origin;
      identity.current = connection.usb ? '' : form.id.trim();
      live.current = connection;
      setSession(connection);
      setConnecting(false);
    } catch (err) {
      // Dismissing the browser's port chooser is a choice, not a failure.
      const cancelled = err instanceof Error && err.name === 'NotFoundError';
      if (epoch.current === generation)
        disconnect(cancelled ? '' : errorText(err));
    }
  }
  useEffect(() => {
    if (!session) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      try {
        const reply = await session!.command('status');
        if (!active) return;
        if (reply.startsWith('esp32s3_network:') && session!.usb) {
          setDiagnostic(reply);
          setStatus(undefined);
        } else {
          const next = parseStatus(reply);
          if (identity.current && next.id !== identity.current)
            throw new Error(
              'Unexpected controller ID. Reconnect to the intended device.',
            );
          identity.current = next.id;
          const key = 'watering.labels.' + scope.current + '.' + next.id;
          if (profile.current !== key) {
            profile.current = key;
            setNames(readNames(key));
          }
          setStatus(next);
          setDiagnostic('');
        }
        setObserved(Date.now());
        timer = setTimeout(() => void refresh(), 1500);
      } catch (err) {
        if (active && live.current === session) disconnect(errorText(err));
      }
    }
    void refresh();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [session, revision]);
  async function send(command: string) {
    const target = live.current;
    const stopping = command === 'stop';
    if (
      !target ||
      !status ||
      (!stopping && (lock.current || Date.now() - observed > STALE_MS))
    )
      return false;
    if (!stopping) {
      lock.current = true;
      setBusy(true);
    }
    const action = ++latestAction.current;
    setAlert('');
    setNotice(stopping ? 'Requesting stop…' : 'Waiting for controller…');
    try {
      const reply = await target.command(command);
      if (live.current !== target) return false;
      if (!reply.startsWith('ok '))
        throw new Error('Unexpected device reply. Check pump state.');
      if (action === latestAction.current) setNotice(reply.slice(3));
      if (!SILENT.has(command))
        log({
          origin: 'browser',
          title: commandTitle(command),
          detail: sentence(reply.slice(3)),
          tone: stopping ? 'warn' : 'ok',
        });
      setRevision((x) => x + 1);
      return true;
    } catch (err) {
      if (live.current === target && action === latestAction.current) {
        setNotice('');
        setAlert(errorText(err));
        log({
          origin: 'browser',
          title: commandTitle(command),
          detail: errorText(err),
          tone: 'bad',
        });
        setRevision((x) => x + 1);
      }
      return false;
    } finally {
      if (!stopping && live.current === target) {
        lock.current = false;
        setBusy(false);
      }
    }
  }
  function saveNames(value: Names) {
    try {
      localStorage.setItem(profile.current, JSON.stringify(value));
      setNames(value);
      setNotice('Browser labels saved.');
      setAlert('');
    } catch {
      setAlert('Browser storage is unavailable.');
    }
  }
  return {
    session,
    mode,
    setMode: (next: Mode) => {
      if (!connecting) setMode(next);
    },
    connecting,
    status,
    diagnostic,
    observed,
    notice,
    alert,
    ended,
    busy,
    revision,
    names,
    activity,
    start,
    disconnect,
    send,
    saveNames,
    dismiss: () => {
      setNotice('');
      setAlert('');
    },
  };
}
export type Controller = ReturnType<typeof useWateringController>;
