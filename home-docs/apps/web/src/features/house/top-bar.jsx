import { Fragment } from 'react';
import { css } from '../../lib/css';
import { activateOnKey } from '../../lib/keyboard';

export function TopBar({ view }) {
  return (
    <div style={css(view.topbarStyle)}>
      <div style={css(view.idBoxStyle)}>
        <div style={css(view.logoMarkStyle)}></div>
        <div style={css('min-width:0')}>
          <div
            style={css(
              "font:600 13px 'IBM Plex Mono',monospace;letter-spacing:0.03em;line-height:1;color:var(--t1)",
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
          stroke={'var(--t4)'}
          strokeWidth={'1.6'}
          strokeLinecap={'round'}
          style={css('flex-shrink:0')}
        >
          <circle cx={'7'} cy={'7'} r={'4.3'}></circle>
          <path d={'M10.2 10.2 L14 14'}></path>
        </svg>
        <input
          ref={view.searchRef}
          value={view.q}
          onChange={view.onSearch}
          onFocus={view.onSearchFocus}
          onBlur={view.onSearchBlur}
          onKeyDown={view.onSearchKeyDown}
          placeholder={view.searchPlaceholder}
          style={css(view.searchInputStyle)}
          aria-label="Search home inventory"
          title="Search (press / anywhere)"
          aria-activedescendant={view.searchActiveId}
        />
        {view.hasQ ? (
          <>
            <div
              onClick={view.clearSearch}
              style={css(
                "flex-shrink:0;width:18px;height:18px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--lift-12);color:var(--t2);font:600 11px 'Inter',system-ui,'Segoe UI',sans-serif;cursor:pointer",
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
                    "font:600 9px 'IBM Plex Mono',monospace;color:var(--t4);letter-spacing:0.12em",
                  )}
                >
                  {'RESULTS'}
                </span>
                <span
                  style={css(
                    "font:500 10px 'IBM Plex Mono',monospace;color:var(--t4)",
                  )}
                >
                  {view.searchCountLabel}
                </span>
              </div>
              {(view.searchResults ?? []).map((r, index) => (
                <Fragment key={r.id ?? r.key ?? r.label ?? index}>
                  <div
                    id={r.id}
                    onClick={r.onClick}
                    style={css(r.rowStyle)}
                    className="hover-0"
                    role="button"
                    tabIndex={0}
                    onKeyDown={activateOnKey}
                  >
                    <span style={css(r.swatch)}></span>
                    <div style={css('flex:1;min-width:0')}>
                      <div
                        style={css(
                          "font:500 12.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
                        )}
                      >
                        {r.label}
                      </div>
                      <div
                        style={css(
                          "font:400 10.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
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
                      "padding:20px 14px;text-align:center;font:400 12px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t4);line-height:1.5",
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
                  "font:600 9px 'IBM Plex Mono',monospace;color:var(--t4);letter-spacing:0.12em;padding:7px 9px 8px",
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
                        'width:6px;height:6px;border-radius:50%;background:var(--t4);flex-shrink:0',
                      )}
                    ></span>
                    <div
                      style={css(
                        "font:500 12.5px 'Inter',system-ui,'Segoe UI',sans-serif;color:var(--t2)",
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
        <div
          onClick={view.themeBtn.onClick}
          style={css(view.themeBtn.style)}
          className="hover-0"
          role="button"
          tabIndex={0}
          onKeyDown={activateOnKey}
          aria-label={view.themeBtn.title}
          title={view.themeBtn.title}
        >
          {view.themeBtn.isLight ? (
            <svg
              width={'15'}
              height={'15'}
              viewBox={'0 0 16 16'}
              fill={'none'}
              stroke={'currentColor'}
              strokeWidth={'1.5'}
              strokeLinecap={'round'}
              strokeLinejoin={'round'}
            >
              <path
                d={'M13.4 9.6 A5.6 5.6 0 1 1 6.4 2.6 A4.6 4.6 0 0 0 13.4 9.6 Z'}
              ></path>
            </svg>
          ) : (
            <svg
              width={'15'}
              height={'15'}
              viewBox={'0 0 16 16'}
              fill={'none'}
              stroke={'currentColor'}
              strokeWidth={'1.5'}
              strokeLinecap={'round'}
            >
              <circle cx={'8'} cy={'8'} r={'3.1'}></circle>
              <path
                d={
                  'M8 1.2v1.6M8 13.2v1.6M1.2 8h1.6M13.2 8h1.6M3.2 3.2l1.1 1.1M11.7 11.7l1.1 1.1M12.8 3.2l-1.1 1.1M4.3 11.7l-1.1 1.1'
                }
              ></path>
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
