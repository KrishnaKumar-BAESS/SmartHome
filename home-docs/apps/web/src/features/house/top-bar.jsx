import { Fragment } from 'react';
import { css } from '../../lib/css';
import { activateOnKey } from '../../lib/keyboard';

export function TopBar({ view }) {
  return (
    <div style={css(view.topbarStyle)}>
      <div style={css(view.idBoxStyle)}>
        <div
          style={css(
            'width:18px;height:18px;border:1.5px solid #6ea0e0;transform:rotate(45deg);flex-shrink:0',
          )}
        ></div>
        <div style={css('min-width:0')}>
          <div
            style={css(
              "font:600 13px 'IBM Plex Mono',monospace;letter-spacing:0.03em;line-height:1;color:#eef3f8",
            )}
          >
            {'HOUSE.SYS'}
          </div>
          <div style={css(view.idSubStyle)}>
            {'8502 Forrest St · April 147'}
          </div>
        </div>
      </div>

      <div style={css(view.searchWrapStyle)}>
        <svg
          width={'16'}
          height={'16'}
          viewBox={'0 0 16 16'}
          fill={'none'}
          stroke={'#8a98a6'}
          strokeWidth={'1.6'}
          strokeLinecap={'round'}
          style={css('flex-shrink:0')}
        >
          <circle cx={'7'} cy={'7'} r={'4.3'}></circle>
          <path d={'M10.2 10.2 L14 14'}></path>
        </svg>
        <input
          value={view.q}
          onChange={view.onSearch}
          onFocus={view.onSearchFocus}
          onBlur={view.onSearchBlur}
          placeholder={view.searchPlaceholder}
          style={css(view.searchInputStyle)}
          aria-label="Search home inventory"
        />
        {view.hasQ ? (
          <>
            <div
              onClick={view.clearSearch}
              style={css(
                "flex-shrink:0;width:18px;height:18px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,0.12);color:#cdd6df;font:600 11px 'IBM Plex Sans';cursor:pointer",
              )}
              role="button"
              tabIndex={0}
              onKeyDown={activateOnKey}
            >
              {'✕'}
            </div>
          </>
        ) : null}

        {view.showResults ? (
          <>
            <div style={css(view.resultsStyle)}>
              <div
                style={css(
                  'display:flex;align-items:center;justify-content:space-between;padding:6px 9px 7px',
                )}
              >
                <span
                  style={css(
                    "font:600 9px 'IBM Plex Mono',monospace;color:#8a94a0;letter-spacing:0.12em",
                  )}
                >
                  {'RESULTS'}
                </span>
                <span
                  style={css(
                    "font:500 10px 'IBM Plex Mono',monospace;color:#8a94a0",
                  )}
                >
                  {view.searchCountLabel}
                </span>
              </div>
              {(view.searchResults ?? []).map((r, index) => (
                <Fragment key={r.id ?? r.key ?? r.label ?? index}>
                  <div
                    onClick={r.onClick}
                    style={css(
                      'display:flex;align-items:center;gap:10px;padding:9px;border-radius:8px;cursor:pointer',
                    )}
                    className="hover-0"
                    role="button"
                    tabIndex={0}
                    onKeyDown={activateOnKey}
                  >
                    <span style={css(r.swatch)}></span>
                    <div style={css('flex:1;min-width:0')}>
                      <div
                        style={css(
                          "font:500 12.5px 'IBM Plex Sans';color:#e8edf2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
                        )}
                      >
                        {r.label}
                      </div>
                      <div
                        style={css(
                          "font:400 10.5px 'IBM Plex Sans';color:#8a94a0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
                        )}
                      >
                        {r.sub}
                      </div>
                    </div>
                    <div style={css(r.chipStyle)}>{r.cat}</div>
                  </div>
                </Fragment>
              ))}
              {view.noResults ? (
                <>
                  <div
                    style={css(
                      "padding:20px 14px;text-align:center;font:400 12px 'IBM Plex Sans';color:#8a94a0;line-height:1.5",
                    )}
                  >
                    {
                      'No matches. Try a room, a device, “overdue”, “gateway”, “projector”…'
                    }
                  </div>
                </>
              ) : null}
            </div>
          </>
        ) : null}

        {view.showSuggest ? (
          <>
            <div style={css(view.resultsStyle)}>
              <div
                style={css(
                  "font:600 9px 'IBM Plex Mono',monospace;color:#8a94a0;letter-spacing:0.12em;padding:7px 9px 8px",
                )}
              >
                {'JUMP TO'}
              </div>
              {(view.searchSuggest ?? []).map((s, index) => (
                <Fragment key={s.id ?? s.key ?? s.label ?? index}>
                  <div
                    onClick={s.onClick}
                    style={css(
                      'display:flex;align-items:center;gap:10px;padding:9px;border-radius:8px;cursor:pointer',
                    )}
                    className="hover-0"
                    role="button"
                    tabIndex={0}
                    onKeyDown={activateOnKey}
                  >
                    <span
                      style={css(
                        'width:6px;height:6px;border-radius:50%;background:#9aa4ad;flex-shrink:0',
                      )}
                    ></span>
                    <div
                      style={css(
                        "font:500 12.5px 'IBM Plex Sans';color:#cfd8e0",
                      )}
                    >
                      {s.label}
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div style={css(view.controlsWrapStyle)}>
        <div
          onClick={view.toggleIso}
          style={css(view.isoBtnTopStyle)}
          role="button"
          tabIndex={0}
          onKeyDown={activateOnKey}
        >
          {view.isoTopLabel}
        </div>
      </div>
    </div>
  );
}
