import { css } from '../../lib/css';

export function SelectionPrompt({ view }) {
  return (
    <>
      {view.showPrompt ? (
        <>
          <div style={css(view.promptStyle)}>{view.promptText}</div>
        </>
      ) : null}
    </>
  );
}
