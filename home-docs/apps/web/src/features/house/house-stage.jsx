import { css } from '../../lib/css';

export function HouseStage({ view }) {
  return (
    <div
      ref={view.stageRef}
      onPointerDown={view.onPointerDown}
      onPointerMove={view.onPointerMove}
      onPointerUp={view.onPointerUp}
      onPointerLeave={view.onPointerUp}
      onContextMenu={view.onContextMenu}
      style={css(
        'position:absolute;inset:0;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none',
      )}
      data-testid="house-stage"
      aria-label="Interactive house model"
    >
      <svg
        viewBox={'0 0 960 600'}
        preserveAspectRatio={'xMidYMid meet'}
        style={css(
          'position:absolute;inset:0;width:100%;height:100%;display:block',
        )}
      >
        {'\n      '}
        {view.svgEls}
        {'\n    '}
      </svg>
    </div>
  );
}
