import { css } from '../../lib/css';

export function HouseStage({ view, scene }) {
  return (
    <div
      id="house-stage"
      ref={view.stageRef}
      onPointerDown={view.onPointerDown}
      onPointerMove={view.onPointerMove}
      onPointerUp={view.onPointerUp}
      onPointerCancel={view.onPointerCancel}
      onLostPointerCapture={view.onLostPointerCapture}
      onContextMenu={view.onContextMenu}
      onKeyDown={view.onStageKeyDown}
      tabIndex={0}
      role="group"
      aria-label="Interactive house model"
      aria-describedby="house-stage-help"
      style={css(
        `position:absolute;inset:0;cursor:${scene.dragging ? 'grabbing' : 'grab'};touch-action:none;user-select:none;-webkit-user-select:none`,
      )}
      data-testid="house-stage"
    >
      <span id="house-stage-help" className="sr-only">
        Drag to rotate. Arrow keys rotate and tilt; Shift plus arrow keys pan.
        Rooms and markers are buttons: Tab to reach them, Enter to select.
      </span>
      <svg
        viewBox={scene.viewBox}
        preserveAspectRatio="none"
        role="img"
        aria-labelledby="house-svg-title house-svg-desc"
        style={css(
          'position:absolute;inset:0;width:100%;height:100%;display:block',
        )}
      >
        <title id="house-svg-title">{`House model · ${view.modeLabel}`}</title>
        <desc id="house-svg-desc">
          Three-floor isometric model of the house. Positions are recorded
          prototype geometry, not surveyed measurements.
        </desc>
        {scene.els}
      </svg>
    </div>
  );
}
