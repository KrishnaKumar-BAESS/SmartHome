import { useEffect, useRef } from 'react';
import { validateGlb } from './glb';
import { MODEL_URL } from './model-url';
import type { StageCamera } from './alignment';
import type { StageModel } from './stage-model';

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'failed';

/**
 * WebGL canvas under the SVG scene. Three.js and the model load the first
 * time the layer is wanted; afterwards it follows `camera` on every render.
 */
export function ModelLayer({
  wanted,
  shown,
  camera,
  onStatus,
}: {
  wanted: boolean;
  shown: boolean;
  camera: StageCamera | undefined;
  onStatus: (status: ModelStatus) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const model = useRef<StageModel | null>(null);
  const latest = useRef(camera);
  const started = useRef(false);
  const report = useRef(onStatus);
  useEffect(() => {
    latest.current = camera;
    report.current = onStatus;
  });

  useEffect(() => {
    if (!wanted || started.current || !MODEL_URL || !canvas.current) return;
    started.current = true;
    const element = canvas.current;
    report.current('loading');
    void (async () => {
      try {
        const response = await fetch(MODEL_URL);
        if (!response.ok) throw new Error(`Model request ${response.status}`);
        const data = await response.arrayBuffer();
        validateGlb(data);
        const { mountStageModel } = await import('./stage-model');
        model.current = await mountStageModel(element, data, () =>
          report.current('failed'),
        );
        if (latest.current) model.current.update(latest.current);
        report.current('ready');
      } catch (error) {
        console.warn('House model unavailable; using the schematic.', error);
        report.current('failed');
      }
    })();
  }, [wanted]);

  useEffect(() => () => model.current?.dispose(), []);

  useEffect(() => {
    if (shown && camera) model.current?.update(camera);
  }, [shown, camera]);

  return (
    <canvas
      ref={canvas}
      className="stage-model"
      data-shown={shown ? 'true' : undefined}
      data-testid="stage-model"
      aria-hidden="true"
    />
  );
}
