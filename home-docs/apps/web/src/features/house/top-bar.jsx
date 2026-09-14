import { Fragment } from 'react';
import { css } from '../../lib/css';
import { usePresence } from '../../lib/presence';
import { Icon } from './icons';

const FONT = "'Inter',system-ui,'Segoe UI',sans-serif";
const MONO = "'IBM Plex Mono',monospace";

function SearchPopup({ view }) {
  const open = view.showResults || view.showSuggest;
  const { mounted, exiting } = usePresence(open, 140);
  if (!mounted) return null;
  return (
    <div
      id="search-listbox"
      role="listbox"
      aria-label={
        view.showSuggest ? 'Suggested destinations' : 'Search results'
      }
      className={exiting ? 'float-out' : 'float-in'}
      style={css(view.resultsStyle)}
      onPointerDown={(e) => {
        // Keep focus in the input while a result is pressed.
        if (e.target.closest('[role="option"], button')) e.preventDefault();
      }}
    >
      {view.showResults ? (
        <>
          <div
            style={css(
              'display:flex;align-items:center;justify-content:space-between;padding:6px 9px 7px;gap:8px',
            )}
          >
            <span
              style={css(
                `font:600 10px ${MONO};color:var(--t3);letter-spacing:0.12em`,
              )}
            >
              {'RESULTS'}
            </span>
            <span style={css(`font:500 11px ${MONO};color:var(--t3)`)}>
              {view.searchCountLabel}
            </span>
          </div>
          {view.searchCats.length > 2 ? (
            <div
              style={css(
                'display:flex;flex-wrap:wrap;gap:5px;padding:0 9px 8px',
              )}
              role="group"
              aria-label="Filter results by category"
            >
              {view.searchCats.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className="ia"
                  style={css(c.style)}
                  aria-pressed={c.on}
                  onClick={c.onClick}
                >
                  {c.label}
                </button>
              ))}
            </div>
          ) : null}
          {(view.searchResults ?? []).map((r, index) => (
            <Fragment key={r.id ?? index}>
              <div
                id={r.id}
                onClick={r.onClick}
                style={css(r.rowStyle)}
                className="ia"
                role="option"
                aria-selected={r.active}
                tabIndex={-1}
              >
                <span style={css(r.swatch)} aria-hidden="true"></span>
                <div style={css('flex:1;min-width:0')}>
                  <div
                    style={css(
                      `font:500 13px ${FONT};color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap`,
                    )}
                  >
                    {r.label}
                  </div>
                  <div
                    style={css(
                      `font:400 11px ${FONT};color:var(--t3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap`,
                    )}
                  >
                    {r.sub}
                  </div>
                </div>
                <div style={css(r.chipStyle)}>{r.cat}</div>
              </div>
            </Fragment>
          ))}
          {view.searchMore > 0 ? (
            <button
              type="button"
              className="ia link-button"
              style={css('margin:4px 9px 6px')}
              onClick={view.showAllResults}
            >
              {`Show ${view.searchMore} more`}
            </button>
          ) : null}
          {view.noResults ? (
            <div
              style={css(
                `padding:20px 14px;text-align:center;font:400 12px ${FONT};color:var(--t3);line-height:1.5`,
              )}
            >
              {
                'No matches. Try a room, a device, a circuit tag like MP·20, “overdue”, “gateway”, “projector”…'
              }
            </div>
          ) : null}
        </>
      ) : null}

      {view.showSuggest ? (
        <>
          <div
            style={css(
              `font:600 10px ${MONO};color:var(--t3);letter-spacing:0.12em;padding:7px 9px 8px`,
            )}
          >
            {'JUMP TO'}
          </div>
          {(view.searchSuggest ?? []).map((s, index) => (
            <Fragment key={s.id ?? index}>
              <div
                id={s.id}
                onClick={s.onClick}
                style={css(
                  'display:flex;align-items:center;gap:10px;padding:9px;border-radius:8px;cursor:pointer' +
                    (s.active ? ';background:var(--lift-08)' : ''),
                )}
                className="ia"
                role="option"
                aria-selected={s.active}
                tabIndex={-1}
              >
                <span
                  style={css(
                    'width:6px;height:6px;border-radius:50%;background:var(--t4);flex-shrink:0',
                  )}
                  aria-hidden="true"
                ></span>
                <div style={css(`font:500 13px ${FONT};color:var(--t2)`)}>
                  {s.label}
                </div>
              </div>
            </Fragment>
          ))}
        </>
      ) : null}
    </div>
  );
}

export function TopBar({ view }) {
  return (
    <header style={css(view.topbarStyle)}>
      <div style={css(view.idBoxStyle)}>
        <div style={css(view.logoMarkStyle)} aria-hidden="true"></div>
        <div style={css('min-width:0')}>
          <h1
            style={css(
              `font:600 13px ${MONO};letter-spacing:0.03em;line-height:1;color:var(--t1);margin:0`,
            )}
          >
            {'HOUSE.SYS'}
          </h1>
          <div style={css(view.idSubStyle)}>{view.headerSub}</div>
        </div>
      </div>

      <div
        style={css(view.searchWrapStyle)}
        onBlur={view.onSearchWrapBlur}
        onFocus={view.onSearchWrapFocus}
      >
        <svg
          width={'16'}
          height={'16'}
          viewBox={'0 0 16 16'}
          fill={'none'}
          stroke={'var(--t4)'}
          strokeWidth={'1.6'}
          strokeLinecap={'round'}
          style={css('flex-shrink:0')}
          aria-hidden="true"
        >
          <circle cx={'7'} cy={'7'} r={'4.3'}></circle>
          <path d={'M10.2 10.2 L14 14'}></path>
        </svg>
        <input
          ref={view.searchRef}
          value={view.q}
          onChange={view.onSearch}
          onFocus={view.onSearchFocus}
          onKeyDown={view.onSearchKeyDown}
          placeholder={view.searchPlaceholder}
          style={css(view.searchInputStyle)}
          aria-label="Search home inventory"
          title="Search (press / anywhere)"
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={view.searchExpanded}
          aria-controls="search-listbox"
          aria-activedescendant={view.searchActiveId}
          autoComplete="off"
          spellCheck={false}
        />
        {view.hasQ ? (
          <button
            type="button"
            onClick={view.clearSearch}
            className="ia"
            style={css(
              `flex-shrink:0;width:20px;height:20px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--lift-12);color:var(--t2);border:0;padding:0;cursor:pointer`,
            )}
            aria-label="Clear search"
            title="Clear search"
          >
            <Icon name="close" size={11} />
          </button>
        ) : null}
        <SearchPopup view={view} />
      </div>

      {view.searchOpen ? (
        <button
          type="button"
          className="ia link-button"
          onClick={view.cancelSearch}
          style={css('justify-self:end')}
        >
          Cancel
        </button>
      ) : null}

      <div style={css(view.controlsWrapStyle)}>
        <div style={css('display:flex;align-items:center;gap:2px')}>
          <button
            type="button"
            onClick={view.toggleIso}
            className="ia"
            style={css(view.isoBtnTopStyle)}
            aria-expanded={view.showIsoPanel}
            aria-controls="isolation-panel"
            data-popover="iso"
          >
            {view.isoTopLabel}
          </button>
          {view.isoActive ? (
            <button
              type="button"
              onClick={view.isoClear}
              className="ia icon-button"
              aria-label="Clear isolation and show all rooms"
              title="Clear isolation"
            >
              <Icon name="close" size={12} />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={view.helpBtn.onClick}
          style={css(view.helpBtn.style)}
          className="ia"
          aria-label="Help and keyboard shortcuts"
          title="Help (?)"
          aria-haspopup="dialog"
        >
          <Icon name="help" size={16} />
        </button>
        <button
          type="button"
          onClick={view.themeBtn.onClick}
          style={css(view.themeBtn.style)}
          className="ia"
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
              aria-hidden="true"
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
              aria-hidden="true"
            >
              <circle cx={'8'} cy={'8'} r={'3.1'}></circle>
              <path
                d={
                  'M8 1.2v1.6M8 13.2v1.6M1.2 8h1.6M13.2 8h1.6M3.2 3.2l1.1 1.1M11.7 11.7l1.1 1.1M12.8 3.2l-1.1 1.1M4.3 11.7l-1.1 1.1'
                }
              ></path>
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
