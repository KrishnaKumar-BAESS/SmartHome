import { useEffect, useRef } from 'react';
import { css } from '../../lib/css';
import { optionOnKey } from '../../lib/keyboard';
import { Icon } from './icons';
import { FeedClock } from './feed-clock';

function Tile({ t }) {
  return (
    <div
      id={`hist-${t.idx}`}
      onClick={t.onClick}
      className="ia hist-tile"
      role="option"
      aria-selected={t.selected}
      aria-label={t.aria}
      tabIndex={0}
      onKeyDown={optionOnKey}
    >
      <div>
        <div className="feed-bg"></div>
        <div className="feed-mark">{t.watermark}</div>
        <div className="feed-top">
          <span className="feed-live" style={{ '--c': t.color }}>
            <span className="dot" style={{ '--c': t.color }} />
            {t.label}
          </span>
          <span>{t.time}</span>
        </div>
        <div className="feed-bottom">
          <span className="feed-dim">{t.sub}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal review of the demonstration history. A native dialog gives the
 * focus trap, inert background, Escape handling, and focus return.
 */
export function CameraViewer({ view }) {
  const open = view.showCamExpanded;
  if (!open) return null;
  return <Viewer view={view} />;
}

function Viewer({ view }) {
  const ref = useRef(null);
  const close = useRef(view.closeExpand);
  useEffect(() => {
    close.current = view.closeExpand;
  });
  useEffect(() => {
    const el = ref.current;
    const previous = document.activeElement;
    el?.showModal();
    return () => {
      el?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  const narrow = view.narrow;
  const f = view.bigFeed;
  return (
    <dialog
      ref={ref}
      className="camera-review"
      aria-labelledby="camera-review-title"
      aria-describedby="camera-review-sub"
      onCancel={(e) => {
        e.preventDefault();
        close.current();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          close.current();
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close.current();
      }}
    >
      <div className="dialog-head">
        <div style={{ minWidth: 0 }}>
          <h2 id="camera-review-title">
            {f.name}
            {' · Demo review'}
          </h2>
          <p id="camera-review-sub">{view.expandSub}</p>
        </div>
        <div className="dialog-head-actions">
          <button
            type="button"
            className="ia dialog-button dialog-button--icon"
            onClick={f.prev}
            aria-label="Previous camera"
          >
            <Icon name="chevronLeft" size={15} />
          </button>
          <span className="dialog-counter">{f.counter}</span>
          <button
            type="button"
            className="ia dialog-button dialog-button--icon"
            onClick={f.next}
            aria-label="Next camera"
          >
            <Icon name="chevronRight" size={15} />
          </button>
          <button
            type="button"
            className="ia dialog-button"
            onClick={view.closeExpand}
            autoFocus
          >
            {'Close'}
            <Icon name="close" size={12} />
          </button>
        </div>
      </div>
      <div
        style={css(
          `flex:1;min-height:0;display:flex;gap:18px;${narrow ? 'flex-direction:column' : ''}`,
        )}
      >
        <div
          style={css(
            'flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;gap:12px',
          )}
        >
          <div
            role="img"
            aria-label={`${f.name}: ${f.eventLabel}. Demonstration, not recorded video.`}
            className="feed feed--big"
            style={narrow ? { minHeight: 160 } : undefined}
          >
            <div className="feed-bg"></div>
            <div className="feed-floor"></div>
            <div className="feed-mark">{f.watermark}</div>
            <div className="feed-scan"></div>
            {f.showOffline ? (
              <div className="feed-offline">NO SIGNAL</div>
            ) : null}
            <div className="feed-top" style={{ padding: '14px 16px' }}>
              <span className="feed-live" style={{ '--c': f.liveColor }}>
                <span
                  className="dot dot--pulse"
                  style={{ '--c': f.liveColor }}
                />
                {f.liveLabel}
              </span>
              <span>{f.res}</span>
            </div>
            <div className="feed-event" key={f.eventLabel}>
              {f.eventLabel}
            </div>
            <div className="feed-bottom" style={{ padding: '14px 16px' }}>
              <span className="feed-name">{`${f.name} · ${f.room}`}</span>
              <span className="feed-dim">
                {f.time ? f.time : <FeedClock />}
              </span>
            </div>
          </div>
          <div className="review-panel">
            <div style={css('display:flex;align-items:center;gap:12px')}>
              <span className="review-label">Events</span>
              <div
                className="timeline"
                role="listbox"
                aria-label="Event timeline, oldest on the left, now on the right"
                aria-orientation="horizontal"
              >
                <div
                  className="timeline-fill"
                  style={{ left: `${view.timeline.fillLeft}%` }}
                  aria-hidden="true"
                ></div>
                {(view.histTiles ?? []).map((t) => (
                  <div
                    key={t.idx}
                    onClick={t.onClick}
                    style={css(t.dotStyle)}
                    className="timeline-dot"
                    role="option"
                    aria-selected={t.selected}
                    aria-label={t.aria}
                    tabIndex={0}
                    onKeyDown={optionOnKey}
                    title={t.aria}
                  ></div>
                ))}
              </div>
            </div>
            <div className="review-scale">
              <span>{view.timeline.start}</span>
              <span>{view.timeline.note}</span>
              <span>{view.timeline.end}</span>
            </div>
          </div>
        </div>

        <div
          style={css(
            narrow
              ? 'flex-shrink:0;display:flex;flex-direction:column;min-height:0;max-height:34%'
              : 'width:248px;flex-shrink:0;display:flex;flex-direction:column;min-height:0',
          )}
        >
          <h3 className="review-label" style={{ margin: '0 2px 10px' }}>
            Event history · generated
          </h3>
          <div
            style={css(
              narrow
                ? 'flex:1;min-height:0;overflow:auto;display:grid;grid-auto-flow:column;grid-auto-columns:156px;gap:10px;padding:2px 2px 4px'
                : 'flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:10px;padding:2px 4px 2px 2px',
            )}
            role="listbox"
            aria-label="Generated event history"
          >
            {(view.histTiles ?? []).map((t) => (
              <Tile key={t.idx} t={t} />
            ))}
          </div>
        </div>
      </div>
    </dialog>
  );
}
