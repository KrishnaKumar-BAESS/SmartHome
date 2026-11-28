// Bundle-size gate for the production build (runs after `vite build`).
// Budgets are gzip sizes; raise them deliberately, with a changelog entry.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const dist = new URL('../dist/assets/', import.meta.url);
const BUDGET = {
  js: 140 * 1024, // total gzip JS, without the lazy 3D-model chunk
  // Three.js and the model renderer load only when the Blender model is
  // shown; they are budgeted apart so the app shell stays held to its own.
  modelJs: 150 * 1024,
  // On-demand watering workspace and its MQTT browser client. The
  // workspace's stylesheet loads with it, so it is budgeted apart from the
  // app shell's CSS as well.
  wateringJs: 124 * 1024,
  wateringCss: 8 * 1024,
  // Styling moved from inline JS strings into the stylesheet's design
  // system (JS fell ~5 kB gzip while CSS grew ~6 kB).
  css: 14 * 1024, // total gzip CSS, without the lazy watering stylesheet
  fontFiles: 6, // one woff2 per shipped face; woff fallbacks are also emitted
};

const files = readdirSync(dist);
const gz = (name) => gzipSync(readFileSync(new URL(name, dist))).length;
const isModel = (f) => f.startsWith('stage-model-') && f.endsWith('.js');
const isWatering = (f) => /^(watering-view|mqtt\.esm)-.*\.js$/.test(f);
const isWateringCss = (f) => /^watering-view-.*\.css$/.test(f);
const wateringJs = files.filter(isWatering).reduce((a, f) => a + gz(f), 0);
const js = files
  .filter((f) => f.endsWith('.js') && !isModel(f) && !isWatering(f))
  .reduce((a, f) => a + gz(f), 0);
const modelJs = files.filter(isModel).reduce((a, f) => a + gz(f), 0);
const css = files
  .filter((f) => f.endsWith('.css') && !isWateringCss(f))
  .reduce((a, f) => a + gz(f), 0);
const wateringCss = files.filter(isWateringCss).reduce((a, f) => a + gz(f), 0);
const woff2 = files.filter((f) => f.endsWith('.woff2')).length;
const raw = files.reduce(
  (a, f) =>
    a + statSync(join(dist.pathname.replace(/^\/([A-Za-z]:)/, '$1'), f)).size,
  0,
);

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
const rows = [
  ['JS (gzip)', js, BUDGET.js],
  ['Pump JS (gzip)', wateringJs, BUDGET.wateringJs],
  ['3D JS (gzip)', modelJs, BUDGET.modelJs],
  ['CSS (gzip)', css, BUDGET.css],
  ['Pump CSS (gzip)', wateringCss, BUDGET.wateringCss],
  ['woff2 faces', woff2, BUDGET.fontFiles],
];
let failed = false;
for (const [label, value, limit] of rows) {
  const ok = value <= limit;
  if (!ok) failed = true;
  const shown = label.includes('faces') ? `${value}` : kb(value);
  const lim = label.includes('faces') ? `${limit}` : kb(limit);
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(12)} ${shown} (budget ${lim})`,
  );
}
console.log(`     assets total ${kb(raw)} on disk`);
if (failed) {
  console.error(
    'Bundle budget exceeded. See home-docs/apps/web/scripts/bundle-budget.mjs.',
  );
  process.exit(1);
}
