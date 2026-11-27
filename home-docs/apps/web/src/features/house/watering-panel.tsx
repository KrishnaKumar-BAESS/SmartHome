import { lazy, Suspense, useState } from 'react';
const WateringDialog = lazy(() => import('./watering-dialog'));
export function WateringPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="pihole-entry">
      <button className="ia callout water-launch" onClick={() => setOpen(true)}>
        <span className="grow">Manage watering system</span>
        <span aria-hidden="true">→</span>
      </button>
      {open && (
        <Suspense fallback={<p role="status">Opening watering controls…</p>}>
          <WateringDialog onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
