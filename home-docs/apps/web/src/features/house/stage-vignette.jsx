import { css } from '../../lib/css';

export function StageVignette() {
  return (
    <>
      <div
        style={css(
          'position:absolute;inset:0;pointer-events:none;background:radial-gradient(125% 95% at 50% 42%,transparent 52%,var(--vignette) 100%)',
        )}
      ></div>
    </>
  );
}
