declare const __APP_VERSION__: string;
declare const __APP_COMMIT__: string;
declare const __APP_BUILT__: string;

/** Identity of the running build, injected by vite.config.ts. */
export const BUILD = {
  version: __APP_VERSION__,
  commit: __APP_COMMIT__,
  built: __APP_BUILT__,
};

/** Short label for the UI, e.g. "v0.1.0 · 1370a3e". */
export const BUILD_LABEL = `v${BUILD.version} · ${BUILD.commit}`;

/** Build time in the viewer's locale, e.g. "7 Nov 2026, 22:40". */
export function builtAt(): string {
  const d = new Date(BUILD.built);
  return Number.isNaN(d.getTime())
    ? BUILD.built
    : d.toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}
