import { usePresence } from '../../lib/presence';
import { Icon } from './icons';
import { ModeIcon } from './mode-icons';

const IS_MAC =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

const CAT_ICON = {
  Room: 'room',
  Circuit: 'electrical',
  Panel: 'electrical',
  Light: 'lighting',
  Network: 'network',
  Node: 'network',
  Server: 'network',
  Sound: 'sound',
  Camera: 'security',
  Climate: 'climate',
  Upkeep: 'upkeep',
};

function SearchPopup({ view }) {
  const open = view.showResults || view.showSuggest;
  const { mounted, exiting } = usePresence(open, 160);
  if (!mounted) return null;
  return (
    <div
      id="search-listbox"
      role="listbox"
      aria-label={
        view.showSuggest ? 'Suggested destinations' : 'Search results'
      }
      className={`popover surface-pop ${view.narrow ? 'popover--narrow ' : ''}${exiting ? 'float-out' : 'float-in'}`}
      onPointerDown={(e) => {
        // Keep focus in the input while a result is pressed.
        if (e.target.closest('[role="option"], button')) e.preventDefault();
      }}
    >
      {view.showResults ? (
        <>
          <div className="popover-head">
            <span className="section-label">Results</span>
            <span className="panel-count">{view.searchCountLabel}</span>
          </div>
          {view.searchCats.length > 2 ? (
            <div
              className="chips"
              role="group"
              aria-label="Filter results by category"
            >
              {view.searchCats.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className="ia chip"
                  aria-pressed={c.on}
                  onClick={c.onClick}
                >
                  {`${c.label} `}
                  <span className="num">{c.count}</span>
                </button>
              ))}
            </div>
          ) : null}
          {(view.searchResults ?? []).map((r) => (
            <div
              key={r.id}
              id={r.id}
              onClick={r.onClick}
              className="result"
              role="option"
              aria-selected={r.active}
              tabIndex={-1}
            >
              <span
                className="result-icon"
                style={{ '--c': r.accent }}
                aria-hidden="true"
              >
                <ModeIcon mode={CAT_ICON[r.cat] || 'overview'} size={15} />
              </span>
              <div className="result-main">
                <div className="result-title">{r.label}</div>
                <div className="result-sub">{r.sub}</div>
              </div>
              <span className="tag" style={{ '--c': r.accent }}>
                {r.cat}
              </span>
              <Icon name="arrowRight" size={13} className="result-go" />
            </div>
          ))}
          {view.searchMore > 0 ? (
            <button
              type="button"
              className="ia btn btn--ghost btn--block"
              style={{ marginTop: 4 }}
              onClick={view.showAllResults}
            >
              {`Show ${view.searchMore} more`}
            </button>
          ) : null}
          {view.noResults ? (
            <div className="popover-empty">
              No matches. Try a room, a device, a circuit tag like MP·20,
              “overdue” or “gateway”.
            </div>
          ) : null}
        </>
      ) : null}

      {view.showSuggest ? (
        <>
          <div className="popover-head">
            <span className="section-label">Jump to</span>
          </div>
          {(view.searchSuggest ?? []).map((s) => (
            <div
              key={s.id}
              id={s.id}
              onClick={s.onClick}
              className="result"
              role="option"
              aria-selected={s.active}
              tabIndex={-1}
            >
              <Icon
                name="search"
                size={14}
                style={{ color: 'var(--t5)', flexShrink: 0 }}
              />
              <div className="result-main">
                <div className="result-title">{s.label}</div>
              </div>
              <Icon name="arrowRight" size={13} className="result-go" />
            </div>
          ))}
        </>
      ) : null}
      {view.narrow ? null : (
        <div className="popover-foot" aria-hidden="true">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> Navigate
          </span>
          <span>
            <kbd>↵</kbd> Open
          </span>
          <span>
            <kbd>esc</kbd> Close
          </span>
        </div>
      )}
    </div>
  );
}

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d="M10 2.6 16.6 6.4v7.2L10 17.4 3.4 13.6V6.4z" />
        <path d="M10 10 16.6 6.4M10 10 3.4 6.4M10 10v7.4" opacity="0.65" />
      </svg>
    </div>
  );
}

export function TopBar({ view }) {
  const narrow = view.narrow;
  const cls = [
    'topbar surface',
    narrow ? 'topbar--narrow' : 'topbar--wide',
    view.searchOpen ? 'topbar--search' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <header className={cls}>
      {view.searchOpen ? null : (
        <div className="brand">
          <BrandMark />
          <h1 className={narrow ? 'brand-name sr-only' : 'brand-name'}>
            house<span>.sys</span>
          </h1>
        </div>
      )}

      <div
        className="search"
        data-focus={view.searchFocus ? 'true' : undefined}
        onBlur={view.onSearchWrapBlur}
        onFocus={view.onSearchWrapFocus}
      >
        <Icon name="search" size={16} />
        <input
          ref={view.searchRef}
          value={view.q}
          onChange={view.onSearch}
          onFocus={view.onSearchFocus}
          onKeyDown={view.onSearchKeyDown}
          placeholder={view.searchPlaceholder}
          className="search-input"
          aria-label="Search home inventory"
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
            className="ia icon-btn search-clear"
            aria-label="Clear search"
            data-tip="Clear"
          >
            <Icon name="close" size={11} strokeWidth={1.8} />
          </button>
        ) : !narrow && !view.searchFocus ? (
          <span className="search-keys" aria-hidden="true">
            <kbd>{IS_MAC ? '⌘' : 'Ctrl'}</kbd>
            <kbd>K</kbd>
          </span>
        ) : null}
        <SearchPopup view={view} />
      </div>

      {view.searchOpen ? (
        <button
          type="button"
          className="ia btn btn--ghost"
          onClick={view.cancelSearch}
        >
          Cancel
        </button>
      ) : (
        <div className="topbar-actions">
          <button
            type="button"
            onClick={view.toggleIso}
            className={`ia btn ${view.isoOn ? 'is-on' : 'btn--ghost'}`}
            aria-expanded={view.showIsoPanel}
            aria-controls="isolation-panel"
            data-popover="iso"
          >
            <Icon name="layers" size={14} />
            {narrow && !view.isoActive ? (
              <span className="sr-only">{view.isoTopLabel}</span>
            ) : (
              view.isoTopLabel
            )}
          </button>
          {view.isoActive ? (
            <button
              type="button"
              onClick={view.isoClear}
              className="ia icon-btn"
              aria-label="Clear isolation and show all rooms"
              data-tip="Clear isolation"
            >
              <Icon name="close" size={12} />
            </button>
          ) : null}
          {narrow ? null : <span className="topbar-sep" aria-hidden="true" />}
          <button
            type="button"
            onClick={view.helpBtn.onClick}
            className="ia icon-btn icon-btn--lg"
            aria-label="Help and keyboard shortcuts"
            data-tip="Help"
            data-tip-kbd="?"
            aria-haspopup="dialog"
          >
            <Icon name="help" size={16} />
          </button>
          <button
            type="button"
            onClick={view.themeBtn.onClick}
            className="ia icon-btn icon-btn--lg"
            aria-label={view.themeBtn.title}
            data-tip={view.themeBtn.isLight ? 'Dark theme' : 'Light theme'}
          >
            <Icon
              key={view.themeBtn.isLight ? 'moon' : 'sun'}
              name={view.themeBtn.isLight ? 'moon' : 'sun'}
              size={16}
              style={{ animation: 'pop 0.45s var(--ease-spring) both' }}
            />
          </button>
        </div>
      )}
    </header>
  );
}
