import { useEffect, useRef, useState } from 'react';
import './live-cameras.css';

export function LiveCameras({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [service, setService] = useState<'checking' | 'ready' | 'unavailable'>(
    'checking',
  );
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
    return () => {
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
    >
      <header className="live-cameras-heading">
        <div>
          <h2 id="live-cameras-title">Security · Live cameras</h2>
          <p>View your Xfinity cameras. Close this panel to stop playback.</p>
        </div>
        <button type="button" onClick={onClose} autoFocus>
          Close live cameras
        </button>
      </header>
      {service === 'ready' ? (
        <iframe
          title="Live camera player"
          src="/?embedded=1"
          allow="autoplay; fullscreen"
        />
      ) : (
        <div className="live-cameras-setup" role="status">
          {service === 'checking' ? (
            <p>Checking the local camera service…</p>
          ) : (
            <>
              <h3>Open SmartHome with its local camera service</h3>
              <p>
                This copy of the house atlas has no camera service attached.
              </p>
              <p>
                On the laptop connected to your signed-in phone, run{' '}
                <code>corepack pnpm build</code> and{' '}
                <code>corepack pnpm security:start</code> from SmartHome.
              </p>
              <a href="http://127.0.0.1:4318/house/">Open local SmartHome</a>
              <p>Then select Security → Live cameras → Import from phone.</p>
            </>
          )}
        </div>
      )}
    </dialog>
  );
}
