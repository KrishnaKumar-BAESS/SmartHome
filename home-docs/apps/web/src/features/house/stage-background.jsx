import { css } from '../../lib/css';

export function StageBackground({ view }) {
  return (
    <>
      <div
        style={css(
          'position:absolute;inset:0;background:' + (view.stageGrad ?? '') + '',
        )}
      ></div>
    </>
  );
}
