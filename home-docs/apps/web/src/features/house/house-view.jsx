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
import { CameraGrid } from './camera-grid';
import { CameraViewer } from './camera-viewer';

export function HouseView({ view }) {
  return (
    <main
      aria-label="Home documentation"
      style={css(
        "position:relative;height:100dvh;width:100%;overflow:hidden;background:#1b242d;font-family:'IBM Plex Sans',sans-serif;color:#e8edf2;-webkit-font-smoothing:antialiased",
      )}
    >
      <StageBackground view={view} />
      <StageGrid view={view} />
      <HouseStage view={view} />
      <StageVignette view={view} />
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
      <CameraGrid view={view} />
      <CameraViewer view={view} />
    </main>
  );
}
