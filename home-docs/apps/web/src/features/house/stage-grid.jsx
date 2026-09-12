import { css } from '../../lib/css';

export function StageGrid() {
  return (
    <>
      <div
        style={css(
          'position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.045) 1px,transparent 1px);background-size:32px 32px;pointer-events:none',
        )}
      ></div>
    </>
  );
}
