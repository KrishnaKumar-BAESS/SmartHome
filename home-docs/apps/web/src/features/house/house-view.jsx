import { lazy, memo, Suspense } from 'react';
import { StageBackground } from './stage-background';
import { StageGrid } from './stage-grid';
import { HouseStage } from './house-stage';
import { StageVignette } from './stage-vignette';
import { TopBar } from './top-bar';
import { Navigation } from './navigation';
import { IsolationPanel } from './isolation-panel';
import { SelectionPrompt } from './selection-prompt';
import { SystemList } from './system-list';
import { ListToggle } from './list-toggle';
import { SystemDetails } from './system-details';
import { DetailsToggle } from './details-toggle';
import { SceneLegend } from './scene-legend';
import { ViewControls } from './view-controls';
import { NoticeToast } from './notice-toast';
import { PrintInventory } from './print-inventory';
import { Tooltips } from './tooltips';
import { offlineCapable } from '../../lib/offline';

// Dialogs load on first open, keeping them out of the initial bundle.
const loadLiveCameras = () => import('./live-cameras');
const loadCameraViewer = () => import('./camera-viewer');
const loadHelpSheet = () => import('./help-sheet');
const LiveCameras = lazy(() =>
  loadLiveCameras().then((m) => ({ default: m.LiveCameras })),
);
const CameraViewer = lazy(() =>
  loadCameraViewer().then((m) => ({ default: m.CameraViewer })),
);
const HelpSheet = lazy(() =>
  loadHelpSheet().then((m) => ({ default: m.HelpSheet })),
);
// Where the app works offline, fetch the dialogs once the page is idle so the
// offline copy can still open them.
if (offlineCapable()) {
  const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 2000));
  idle(() => {
    for (const load of [loadLiveCameras, loadCameraViewer, loadHelpSheet])
      void load().catch(() => {});
  });
}

// Everything except the stage only depends on `view`, which the controller
// keeps referentially stable while the camera moves, so these skip
// re-rendering during drag, auto-spin, and the explode tween.
const Chrome = memo(function Chrome({ view }) {
  return (
    <>
      <TopBar view={view} />
      <Navigation view={view} />
      <IsolationPanel view={view} />
      <SelectionPrompt view={view} />
      <SystemList view={view} />
      <ListToggle view={view} />
      <SystemDetails view={view} />
      <DetailsToggle view={view} />
      <SceneLegend view={view} />
      <ViewControls view={view} />
      <NoticeToast view={view} />
      <Suspense fallback={null}>
        {view.isSecurity && view.showGrid ? (
          <LiveCameras onClose={view.closeGrid} />
        ) : null}
        {view.showCamExpanded ? <CameraViewer view={view} /> : null}
        {view.helpOpen ? <HelpSheet view={view} /> : null}
      </Suspense>
      <Tooltips />
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {view.selectionAnnounce}
      </div>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {view.searchAnnounce}
      </div>
    </>
  );
});

export function HouseView({ view, scene }) {
  return (
    <>
      <main
        aria-label="Home documentation"
        data-dragging={scene.dragging ? 'true' : undefined}
        data-narrow={view.narrow ? 'true' : undefined}
        data-intro={view.intro ? 'true' : undefined}
        className="app"
        data-mode={view.mode}
        style={{ '--accent': view.accent }}
      >
        <a className="skip-link" href="#house-stage">
          Skip to the house model
        </a>
        <StageBackground view={view} />
        <StageGrid view={view} />
        {/* Chrome comes first in the DOM so Tab reaches search and the
            views before the model's many rooms; z-index keeps it on top. */}
        <Chrome view={view} />
        <HouseStage view={view} scene={scene} />
        <StageVignette view={view} />
      </main>
      <PrintInventory />
    </>
  );
}
