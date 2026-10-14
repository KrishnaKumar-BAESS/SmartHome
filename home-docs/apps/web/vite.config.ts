import { defineConfig, type Plugin } from 'vitest/config';
import { loadEnv } from 'vite';
import { piholePlugin } from './server/pihole-service';
import react from '@vitejs/plugin-react';

// The primary faces are preloaded so first paint does not fall back and
// swap. Only the woff2 files browsers actually fetch are listed; the woff
// fallbacks stay lazy.
const PRELOAD = [
  /inter-latin-400-normal/,
  /inter-latin-500-normal/,
  /ibm-plex-mono-latin-500-normal/,
];

function preloadFonts(): Plugin {
  return {
    name: 'smarthome-preload-fonts',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const names = Object.keys(ctx.bundle ?? {}).filter(
          (f) => f.endsWith('.woff2') && PRELOAD.some((re) => re.test(f)),
        );
        return names.map((href) => ({
          tag: 'link',
          attrs: {
            rel: 'preload',
            as: 'font',
            type: 'font/woff2',
            crossorigin: true,
            href: `./${href}`,
          },
          injectTo: 'head-prepend' as const,
        }));
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  return {
    base: './',
    plugins: [
      react(),
      preloadFonts(),
      piholePlugin(
        env.PIHOLE_URL || 'http://192.168.0.254',
        env.PIHOLE_APP_PASSWORD || '',
      ),
    ],
    server: { port: 5173, strictPort: true },
    preview: { port: 4173, strictPort: true },
    test: { include: ['src/**/*.test.ts', 'server/**/*.test.ts'] },
  };
});
