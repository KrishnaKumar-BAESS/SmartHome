import { css } from '../../lib/css';

/**
 * Base gradient plus an accent tint layer. The tint uses currentColor so a
 * plain color transition cross-fades the stage when the mode changes.
 */
export function StageBackground({ view }) {
  return (
    <>
      <div
        style={css(
          'position:absolute;inset:0;background:' + (view.stageGrad ?? ''),
        )}
      ></div>
      <div
        style={css(
          `position:absolute;inset:0;color:${view.tintColor};background:${view.tintGrad};transition:color .45s ease`,
        )}
      ></div>
    </>
  );
}
