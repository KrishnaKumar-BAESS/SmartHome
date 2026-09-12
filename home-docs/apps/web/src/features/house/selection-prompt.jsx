import { css } from '../../lib/css';

export function SelectionPrompt({ view }) {
  return (
    <>
      {view.showPrompt ? (
        <>
          <div
            style={css(
              "position:absolute;top:64px;left:50%;transform:translateX(-50%);z-index:16;font:500 11.5px 'IBM Plex Sans';color:#c4d0db;background:rgba(22,30,38,0.78);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:8px 16px;border:1px solid rgba(255,255,255,0.10);border-radius:20px;white-space:nowrap;animation:floatIn .3s ease both",
            )}
          >
            {view.promptText}
          </div>
        </>
      ) : null}
    </>
  );
}
