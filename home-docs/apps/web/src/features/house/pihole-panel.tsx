import { useEffect, useRef, useState } from 'react';
import './pihole-panel.css';

const FALLBACK_DASHBOARD = 'http://192.168.0.254/admin/';
type Stats = {
  state: 'ready' | 'setup' | 'auth' | 'unavailable';
  dashboardUrl: string;
  observedAt?: string;
  queries?: number;
  blocked?: number;
  percentBlocked?: number;
  clients?: number;
  domains?: number;
  blocking?: string;
};

function PiholeDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [stats, setStats] = useState<Stats>();
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function load() {
      setBusy(true);
      try {
        const response = await fetch('/api/pihole/stats', {
          signal: controller.signal,
          cache: 'no-store',
        });
        const data = (await response.json()) as Stats;
        if (
          !response.ok ||
          !['ready', 'setup', 'auth', 'unavailable'].includes(data.state)
        )
          throw new Error('Unavailable');
        const url = new URL(data.dashboardUrl);
        if (
          !['http:', 'https:'].includes(url.protocol) ||
          url.username ||
          url.password
        )
          throw new Error('Invalid dashboard');
        if (!controller.signal.aborted) setStats(data);
      } catch {
        if (!controller.signal.aborted)
          setStats({ state: 'unavailable', dashboardUrl: FALLBACK_DASHBOARD });
      } finally {
        if (!controller.signal.aborted) {
          setBusy(false);
          timer = setTimeout(() => {
            void load();
          }, 30000);
        }
      }
    }
    void load();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [refresh]);
  const number = (value?: number) =>
    typeof value === 'number'
      ? value.toLocaleString(undefined, { maximumFractionDigits: 1 })
      : '—';
  return (
    <dialog
      className="pihole-dialog"
      ref={dialog}
      aria-labelledby="pihole-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <header>
        <div>
          <h2 id="pihole-title">Pi-hole · DNS statistics</h2>
          <p>pihole-pod · home network</p>
        </div>
        <button type="button" autoFocus onClick={onClose}>
          Back to SmartHome
        </button>
      </header>
      <div className="pihole-content">
        <div className="pihole-actions">
          <a
            href={stats?.dashboardUrl ?? FALLBACK_DASHBOARD}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Pi-hole dashboard ↗
          </a>
          <button
            type="button"
            disabled={busy}
            onClick={() => setRefresh((value) => value + 1)}
          >
            {busy ? 'Refreshing…' : 'Refresh stats'}
          </button>
        </div>
        <p>
          The full dashboard opens in a new tab. Sign in there, then close that
          tab or switch back here to keep your place in SmartHome.
        </p>
        <div role="status" aria-live="polite">
          {!stats ? (
            <p>Connecting to Pi-hole…</p>
          ) : stats.state === 'ready' ? (
            <p>
              Live summary · refreshed{' '}
              {new Date(stats.observedAt!).toLocaleTimeString()} · updates every
              30 seconds
            </p>
          ) : (
            <div className="pihole-notice">
              <h3>
                {stats.state === 'setup'
                  ? 'Connect your Pi-hole account'
                  : stats.state === 'auth'
                    ? 'Pi-hole sign-in needs attention'
                    : 'Pi-hole stats are unavailable'}
              </h3>
              <p>
                {stats.state === 'setup'
                  ? 'Add a Pi-hole app password to PIHOLE_APP_PASSWORD in home-docs/apps/web/.env.local, then restart pnpm dev.'
                  : stats.state === 'auth'
                    ? 'Check the app password in your local settings and restart the development server. The full dashboard is still available above.'
                    : 'Check that Pi-hole is reachable and run SmartHome with pnpm dev or pnpm preview. You can retry or open the full dashboard above.'}
              </p>
            </div>
          )}
        </div>
        {stats?.state === 'ready' && (
          <>
            <p className="pihole-blocking">
              Blocking: <strong>{stats.blocking}</strong>
            </p>
            <dl className="pihole-metrics">
              {[
                ['Queries', number(stats.queries)],
                ['Blocked queries', number(stats.blocked)],
                ['Blocked', `${number(stats.percentBlocked)}%`],
                ['Active clients', number(stats.clients)],
                ['Domains on blocklist', number(stats.domains)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p>
              Query and client totals cover Pi-hole’s rolling summary window
              (normally the past 24 hours). This view is read-only.
            </p>
          </>
        )}
      </div>
    </dialog>
  );
}

export function PiholePanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="pihole-entry">
      <button
        className="ia chip-button"
        type="button"
        onClick={() => setOpen(true)}
      >
        Pi-hole stats & dashboard
      </button>
      {open && <PiholeDialog onClose={() => setOpen(false)} />}
    </div>
  );
}
