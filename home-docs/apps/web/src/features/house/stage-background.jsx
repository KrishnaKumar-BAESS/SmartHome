/**
 * Base gradient plus an accent tint layer. The tint follows `--accent`
 * through a colour transition, so the stage cross-fades between views.
 */
export function StageBackground() {
  return (
    <>
      <div className="stage-base"></div>
      <div className="stage-tint"></div>
    </>
  );
}
