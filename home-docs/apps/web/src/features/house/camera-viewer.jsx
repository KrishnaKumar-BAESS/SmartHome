import { useEffect, useRef } from 'react';
import { css } from '../../lib/css';
import { optionOnKey } from '../../lib/keyboard';
import { Icon } from './icons';
import { FeedClock } from './feed-clock';

const FONT = "'Inter',system-ui,'Segoe UI',sans-serif";
const MONO = "'IBM Plex Mono',monospace";

function Tile({ t }) {
  return (
    <div
      id={`hist-${t.idx}`}
      onClick={t.onClick}
      style={css(t.wrapStyle)}
      className="ia"
      role="option"
      aria-selected={t.selected}
      aria-label={t.aria}
      tabIndex={0}
      onKeyDown={optionOnKey}
    >
      <div
        style={css(
          'position:relative;width:100%;aspect-ratio:16/9;background:#0b1015;overflow:hidden',
        )}
      >
        <div
          style={css(
            'position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 122%,rgba(74,96,116,0.4),transparent 60%),linear-gradient(180deg,#10161d 0%,#0b1015 55%,#070a0e 100%)',
          )}
        ></div>
        <div
          style={css(
            `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:600 12px ${FONT};color:rgba(255,255,255,0.06);letter-spacing:0.05em;text-align:center;padding:0 8px`,
          )}
        >
          {t.watermark}
        </div>
        <div
          style={css(
            'position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:6px 8px',
          )}
        >
          <div
            style={css(
              `display:flex;align-items:center;gap:5px;font:600 10px ${MONO};color:${t.color}`,
            )}
          >
            <span
              style={css(
                `width:6px;height:6px;border-radius:50%;background:${t.color}`,
              )}
            ></span>
            {t.label}
          </div>
          <div style={css(`font:600 10px ${MONO};color:#cdd6df`)}>{t.time}</div>
        </div>
        <div
          style={css(
            `position:absolute;bottom:0;left:0;right:0;padding:6px 8px;font:500 10px ${MONO};color:#aeb9c4;background:linear-gradient(0deg,rgba(0,0,0,0.6),transparent)`,
          )}
        >
          {t.sub}
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
      <div
        style={css(
          'display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:15px;flex-shrink:0',
        )}
      >
        <div style={css('min-width:0')}>
          <h2
            id="camera-review-title"
            style={css(`font:600 15px ${FONT};color:#eef3f8;margin:0`)}
          >
            {f.name}
            {' · Demo review'}
          </h2>
          <div
            id="camera-review-sub"
            style={css(`font:400 11px ${MONO};color:#9aa8b4;margin-top:3px`)}
          >
            {view.expandSub}
          </div>
        </div>
        <div
          style={css('display:flex;align-items:center;gap:6px;flex-shrink:0')}
        >
          <button
            type="button"
            className="ia dialog-button"
            onClick={f.prev}
            aria-label="Previous camera"
            title="Previous camera"
          >
            <Icon name="chevronLeft" size={14} />
          </button>
          <span style={css(`font:500 11px ${MONO};color:#9aa8b4`)}>
            {f.counter}
          </span>
          <button
            type="button"
            className="ia dialog-button"
            onClick={f.next}
            aria-label="Next camera"
            title="Next camera"
          >
            <Icon name="chevronRight" size={14} />
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
            style={css(
              `position:relative;flex:1;min-height:${narrow ? '160px' : '0'};border-radius:12px;overflow:hidden;background:#0b1015;border:1px solid #20303c;box-shadow:inset 0 0 80px rgba(0,0,0,0.6)`,
            )}
          >
            <div
              style={css(
                'position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 122%,rgba(74,96,116,0.4),transparent 60%),linear-gradient(180deg,#10161d 0%,#0b1015 55%,#070a0e 100%)',
              )}
            ></div>
            <div
              style={css(
                'position:absolute;left:0;right:0;bottom:0;height:44%;background:repeating-linear-gradient(90deg,rgba(255,255,255,0.05) 0 1px,transparent 1px 46px),linear-gradient(180deg,transparent,rgba(40,60,80,0.22));transform:perspective(220px) rotateX(58deg);transform-origin:bottom',
              )}
            ></div>
            <div
              style={css(
                `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:600 40px ${FONT};color:rgba(255,255,255,0.05);letter-spacing:0.07em;text-align:center;padding:0 20px`,
              )}
            >
              {f.watermark}
            </div>
            <div
              className="feed-scan"
              style={css(
                'position:absolute;left:0;right:0;height:20%;background:linear-gradient(180deg,transparent,rgba(120,160,200,0.10),transparent);animation:feedScan 4.5s linear infinite',
              )}
            ></div>
            {f.showOffline ? (
              <div
                style={css(
                  `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(8,10,12,0.74);font:600 14px ${MONO};color:#aeb9c4;letter-spacing:0.16em`,
                )}
              >
                {'NO SIGNAL'}
              </div>
            ) : null}
            <div
              style={css(
                'position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:12px 15px;background:linear-gradient(180deg,rgba(0,0,0,0.55),transparent)',
              )}
            >
              <div
                style={css(
                  `display:flex;align-items:center;gap:7px;font:600 11px ${MONO};color:${f.liveColor}`,
                )}
              >
                <span
                  style={css(
                    `width:8px;height:8px;border-radius:50%;background:${f.liveColor};animation:pulseDot 1.4s ease-in-out infinite`,
                  )}
                ></span>
                {f.liveLabel}
              </div>
              <div style={css(`font:600 11px ${MONO};color:#cdd6df`)}>
                {f.res}
              </div>
            </div>
            <div
              style={css(
                `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font:600 11px ${MONO};color:#dfe7ee;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.12);padding:5px 12px;border-radius:20px;max-width:90%;text-align:center`,
              )}
            >
              {f.eventLabel}
            </div>
            <div
              style={css(
                'position:absolute;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:12px 15px;background:linear-gradient(0deg,rgba(0,0,0,0.6),transparent)',
              )}
            >
              <div
                style={css(
                  `font:600 11px ${MONO};color:#dfe7ee;text-shadow:0 1px 2px #000`,
                )}
              >
                {f.name}
                {' · '}
                {f.room}
              </div>
              <div style={css(`font:500 11px ${MONO};color:#aeb9c4`)}>
                {f.time ? f.time : <FeedClock />}
              </div>
            </div>
          </div>
          <div
            style={css(
              'flex-shrink:0;display:flex;flex-direction:column;gap:6px;padding:11px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px',
            )}
          >
            <div style={css('display:flex;align-items:center;gap:10px')}>
              <span
                style={css(
                  `font:600 10px ${MONO};color:#9aa8b4;letter-spacing:0.12em;flex-shrink:0`,
                )}
              >
                {'EVENT AXIS'}
              </span>
              <div
                style={css(
                  'position:relative;flex:1;height:8px;border-radius:4px;background:rgba(255,255,255,0.08)',
                )}
                role="listbox"
                aria-label="Event timeline, oldest on the left, now on the right"
                aria-orientation="horizontal"
              >
                <div
                  style={css(
                    `position:absolute;left:${view.timeline.fillLeft}%;right:2%;top:0;bottom:0;border-radius:4px;background:linear-gradient(90deg,rgba(192,87,59,0.2),rgba(192,87,59,0.55))`,
                  )}
                  aria-hidden="true"
                ></div>
                {(view.histTiles ?? []).map((t) => (
                  <div
                    key={t.idx}
                    onClick={t.onClick}
                    style={css(t.dotStyle)}
                    className="ia"
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
            <div
              style={css(
                `display:flex;justify-content:space-between;gap:8px;font:500 10px ${MONO};color:#9aa8b4`,
              )}
            >
              <span>{view.timeline.start}</span>
              <span style={css('color:#7f8d9a')}>{view.timeline.note}</span>
              <span>{view.timeline.end}</span>
            </div>
          </div>
        </div>

        <div
          style={css(
            narrow
              ? 'flex-shrink:0;display:flex;flex-direction:column;min-height:0;max-height:34%'
              : 'width:236px;flex-shrink:0;display:flex;flex-direction:column;min-height:0',
          )}
        >
          <h3
            style={css(
              `font:600 10px ${MONO};color:#9aa8b4;letter-spacing:0.12em;margin:0 2px 9px`,
            )}
          >
            {'EVENT HISTORY · GENERATED'}
          </h3>
          <div
            style={css(
              narrow
                ? 'flex:1;min-height:0;overflow:auto;display:grid;grid-auto-flow:column;grid-auto-columns:150px;gap:9px;padding-bottom:4px'
                : 'flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:9px;padding-right:2px',
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
