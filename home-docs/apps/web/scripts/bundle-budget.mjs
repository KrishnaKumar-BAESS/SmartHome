// Bundle-size gate for the production build (runs after `vite build`).
// Budgets are gzip sizes; raise them deliberately, with a changelog entry.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const dist = new URL('../dist/assets/', import.meta.url);
const BUDGET = {
  js: 140 * 1024, // total gzip JS
  css: 8 * 1024, // total gzip CSS
  fontFiles: 6, // one woff2 per shipped face; woff fallbacks are also emitted
};

const files = readdirSync(dist);
const gz = (name) => gzipSync(readFileSync(new URL(name, dist))).length;
const sum = (ext) =>
  files.filter((f) => f.endsWith(ext)).reduce((a, f) => a + gz(f), 0);
const js = sum('.js');
const css = sum('.css');
const woff2 = files.filter((f) => f.endsWith('.woff2')).length;
const raw = files.reduce(
  (a, f) =>
    a + statSync(join(dist.pathname.replace(/^\/([A-Za-z]:)/, '$1'), f)).size,
  0,
);

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
const rows = [
  ['JS (gzip)', js, BUDGET.js],
  ['CSS (gzip)', css, BUDGET.css],
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
