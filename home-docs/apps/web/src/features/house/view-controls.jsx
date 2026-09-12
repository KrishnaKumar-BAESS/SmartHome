import { css } from '../../lib/css';
import { activateOnKey } from '../../lib/keyboard';

export function ViewControls({ view }) {
  return (
    <>
      <div style={css(view.ctrlClusterStyle)}>
        {view.isNarrow && (
          <button
            type="button"
            className="panel-toggle"
            onClick={view.togglePanels}
            aria-pressed={view.panelsHidden}
          >
            {view.panelsHidden ? 'Show panels' : 'Show model'}
          </button>
        )}
        {view.viewOptsOpen ? (
          <>
            <div style={css(view.voDrawerStyle)}>
              <div style={css(view.voSectionLabelStyle)}>{'FLOOR VIEW'}</div>
              <div style={css('display:flex;gap:4px;margin-bottom:6px')}>
                <div
                  onClick={view.setExplode2}
                  style={css(view.explodeBtn2Style)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={activateOnKey}
                >
                  {'Exploded'}
                </div>
                <div
                  onClick={view.setExplode1}
                  style={css(view.explodeBtn1Style)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={activateOnKey}
                >
                  {'Floors'}
                </div>
                <div
                  onClick={view.setExplode0}
                  style={css(view.explodeBtn0Style)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={activateOnKey}
                >
                  {'Stacked'}
                </div>
              </div>
              <div style={css(view.voDivStyle)}></div>

              <div
                onClick={view.resetView}
                style={css(view.voResetRowStyle)}
                role="button"
                tabIndex={0}
                onKeyDown={activateOnKey}
              >
                <span style={css(view.voIconCellStyle)}>{'↺'}</span>
                <span>{'Reset view'}</span>
              </div>
              <div style={css(view.voDivStyle)}></div>

              <div
                onClick={view.toggleAuto}
                style={css(view.voAutoRowStyle)}
                role="button"
                tabIndex={0}
                onKeyDown={activateOnKey}
              >
                <span style={css(view.voIconCellStyle)}>
                  <svg
                    width={'13'}
                    height={'13'}
                    viewBox={'0 0 16 16'}
                    fill={'none'}
                    stroke={'currentColor'}
                    strokeLinejoin={'round'}
                  >
                    <path
                      d={'M8 1.5 L13.5 4.5 L8 7.5 L2.5 4.5 Z'}
                      strokeWidth={'1.1'}
                    ></path>
                    <path
                      d={'M2.5 4.5 L8 7.5 L8 13 L2.5 10 Z'}
                      strokeWidth={'1.1'}
                    ></path>
                    <path
                      d={'M13.5 4.5 L13.5 10 L8 13 L8 7.5 Z'}
                      strokeWidth={'1.1'}
                    ></path>
                    <path
                      d={'M15 7 A7.5 7.5 0 1 1 9.5 15'}
                      stroke={view.autoOrbitColor}
                      strokeWidth={'1.6'}
                      strokeLinecap={'round'}
                    ></path>
                    <path
                      d={'M8 13.5 L9.5 15.2 L11 13.5'}
                      stroke={view.autoOrbitColor}
                      strokeWidth={'1.6'}
                      strokeLinecap={'round'}
                      strokeLinejoin={'round'}
                    ></path>
                  </svg>
                </span>
                <span style={css('flex:1')}>{'Auto-spin'}</span>
                <span style={css(view.voAutoToggleStyle)}></span>
              </div>

              <div
                onClick={view.toggleLabels}
                style={css(view.voLabelsRowStyle)}
                role="button"
                tabIndex={0}
                onKeyDown={activateOnKey}
              >
                <span style={css(view.voIconCellStyle)}>
                  <svg
                    width={'13'}
                    height={'13'}
                    viewBox={'0 0 14 14'}
                    fill={'currentColor'}
                  >
                    <rect
                      x={'1'}
                      y={'2'}
                      width={'8'}
                      height={'1.8'}
                      rx={'0.9'}
                      opacity={'0.95'}
                    ></rect>
                    <rect
                      x={'1'}
                      y={'5.8'}
                      width={'6'}
                      height={'1.8'}
                      rx={'0.9'}
                      opacity={'0.75'}
                    ></rect>
                    <rect
                      x={'1'}
                      y={'9.6'}
                      width={'7'}
                      height={'1.8'}
                      rx={'0.9'}
                      opacity={'0.85'}
                    ></rect>
                  </svg>
                </span>
                <span style={css('flex:1')}>{'Room labels'}</span>
                <span style={css(view.voLabelsToggleStyle)}></span>
              </div>

              <div
                onClick={view.toggleLegend}
                style={css(view.voLegendRowStyle)}
                role="button"
                tabIndex={0}
                onKeyDown={activateOnKey}
              >
                <span style={css(view.voIconCellStyle)}>
                  <svg
                    width={'13'}
                    height={'13'}
                    viewBox={'0 0 14 14'}
                    fill={'none'}
                    stroke={'currentColor'}
                    strokeWidth={'1.1'}
                  >
                    <rect
                      x={'1'}
                      y={'1'}
                      width={'12'}
                      height={'12'}
                      rx={'2'}
                    ></rect>
                    <rect
                      x={'2.5'}
                      y={'3.5'}
                      width={'3'}
                      height={'3'}
                      rx={'0.5'}
                      fill={'currentColor'}
                      opacity={'0.6'}
                      stroke={'none'}
                    ></rect>
                    <path d={'M7.5 5 h3.5'} strokeLinecap={'round'}></path>
                    <rect
                      x={'2.5'}
                      y={'8'}
                      width={'3'}
                      height={'3'}
                      rx={'0.5'}
                      fill={'currentColor'}
                      opacity={'0.6'}
                      stroke={'none'}
                    ></rect>
                    <path d={'M7.5 9.5 h3.5'} strokeLinecap={'round'}></path>
                  </svg>
                </span>
                <span style={css('flex:1')}>{'Legend'}</span>
                <span style={css(view.voLegendToggleStyle)}></span>
              </div>
            </div>
          </>
        ) : null}

        <div style={css(view.zoomBarStyle)}>
          <div
            onClick={view.zoomOut}
            style={css(view.zoomBtnStyle)}
            title={'Zoom out'}
            role="button"
            tabIndex={0}
            onKeyDown={activateOnKey}
          >
            {'−'}
          </div>
          <div style={css(view.zoomPctStyle)}>{view.zoomPct}</div>
          <div
            onClick={view.zoomIn}
            style={css(view.zoomBtnStyle)}
            title={'Zoom in'}
            role="button"
            tabIndex={0}
            onKeyDown={activateOnKey}
          >
            {'+'}
          </div>
          <div
            style={css(
              'width:1px;height:16px;background:rgba(255,255,255,0.12);margin:0 3px;flex-shrink:0',
            )}
          ></div>
          <div
            onClick={view.toggleViewOpts}
            style={css(view.viewOptsBtnStyle)}
            title={'View options'}
            role="button"
            tabIndex={0}
            onKeyDown={activateOnKey}
          >
            <svg
              width={'14'}
              height={'14'}
              viewBox={'0 0 14 14'}
              fill={'none'}
              stroke={'currentColor'}
              strokeWidth={'1.2'}
              strokeLinecap={'round'}
            >
              <line x1={'1.5'} y1={'3.5'} x2={'12.5'} y2={'3.5'}></line>
              <circle
                cx={'4.5'}
                cy={'3.5'}
                r={'1.5'}
                fill={'currentColor'}
                stroke={'none'}
              ></circle>
              <line x1={'1.5'} y1={'7'} x2={'12.5'} y2={'7'}></line>
              <circle
                cx={'9.5'}
                cy={'7'}
                r={'1.5'}
                fill={'currentColor'}
                stroke={'none'}
              ></circle>
              <line x1={'1.5'} y1={'10.5'} x2={'12.5'} y2={'10.5'}></line>
              <circle
                cx={'5.5'}
                cy={'10.5'}
                r={'1.5'}
                fill={'currentColor'}
                stroke={'none'}
              ></circle>
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}
