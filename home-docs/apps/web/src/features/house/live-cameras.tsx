import { useEffect, useRef, useState } from 'react';
import './live-cameras.css';

const CLOSE_MESSAGE = 'smarthome:close-live-cameras';

export function LiveCameras({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [service, setService] = useState<'checking' | 'ready' | 'unavailable'>(
    'checking',
  );
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    const controller = new AbortController();
    void fetch('/api/cameras', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Service unavailable');
        const data = await response.json();
        if (
          !Array.isArray(data.cameras) ||
          typeof data.configured !== 'boolean'
        )
          throw new Error('Service unavailable');
        setService('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setService('unavailable');
      });
    // The embedded player forwards Escape so the overlay closes from inside.
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.data?.type === CLOSE_MESSAGE
      )
        close.current();
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      controller.abort();
      element?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="live-cameras"
      aria-labelledby="live-cameras-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <header className="live-cameras-heading">
        <div>
          <h2 id="live-cameras-title">Live cameras · Security</h2>
          <p>
            {service === 'ready'
              ? 'Xfinity cameras · local security service · closing stops playback'
              : service === 'checking'
                ? 'Checking the local camera service…'
                : 'Local security service not attached'}
          </p>
        </div>
        <button type="button" onClick={onClose} autoFocus>
          Close ✕
        </button>
      </header>
      {service === 'ready' ? (
        <iframe
          title="Live camera player"
          src="/?embedded=1"
          allow="autoplay; fullscreen"
        />
      ) : (
        <div className="live-cameras-body">
          <div className="live-cameras-setup" role="status">
            {service === 'checking' ? (
              <p>Checking the local camera service…</p>
            ) : (
              <>
                <span className="live-cameras-tag">Setup required</span>
                <h3>Open SmartHome with its local camera service</h3>
                <p>
                  This copy of the house atlas has no camera service attached.
                  On the computer configured for camera access, run{' '}
                  <code>corepack pnpm build</code> and{' '}
                  <code>corepack pnpm security:start</code> from SmartHome.
                </p>
                <a href="http://127.0.0.1:4318/house/">Open local SmartHome</a>
                <p>
                  Then select Security → Live cameras and sign in to Xfinity.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
