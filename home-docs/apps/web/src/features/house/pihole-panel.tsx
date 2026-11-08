import { useEffect, useRef, useState, type CSSProperties } from 'react';
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
                  ? 'Set PIHOLE_APP_PASSWORD to a Pi-hole app password where this server runs (apps/smarthome/service.env.local for the deployed container, or home-docs/apps/web/.env.local for pnpm dev), then restart it.'
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
        className="ia callout"
        type="button"
        style={{ '--c': '#22b8a5' } as CSSProperties}
        onClick={() => setOpen(true)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 1.8 13.5 4v4c0 3.2-2.4 5.4-5.5 6.2C4.9 13.4 2.5 11.2 2.5 8V4z" />
          <path d="m5.6 8 1.7 1.7 3.2-3.4" />
        </svg>
        <span className="grow">Pi-hole stats & dashboard</span>
        <svg
          className="chev"
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </button>
      {open && <PiholeDialog onClose={() => setOpen(false)} />}
    </div>
  );
}
