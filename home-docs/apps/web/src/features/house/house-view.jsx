import { memo } from 'react';
import { css } from '../../lib/css';
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
import { LiveCameras } from './live-cameras';
import { CameraViewer } from './camera-viewer';
import { HelpSheet } from './help-sheet';
import { NoticeToast } from './notice-toast';
import { PrintInventory } from './print-inventory';

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
      {view.isSecurity && view.showGrid ? (
        <LiveCameras onClose={view.closeGrid} />
      ) : null}
      <CameraViewer view={view} />
      <HelpSheet view={view} />
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
        style={css(
          "position:relative;height:100dvh;width:100%;overflow:hidden;background:var(--bg);font-family:'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t1);-webkit-font-smoothing:antialiased",
        )}
      >
        <a className="skip-link" href="#house-stage">
          Skip to the house model
        </a>
        <StageBackground view={view} />
        <StageGrid view={view} />
        <HouseStage view={view} scene={scene} />
        <StageVignette view={view} />
        <Chrome view={view} />
      </main>
      <PrintInventory />
    </>
  );
}
