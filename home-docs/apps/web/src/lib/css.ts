import type { CSSProperties } from 'react';

/** Convert the preserved house renderer's CSS declarations to React styles. */
export function css(declarations: string = ''): CSSProperties {
  const entries = declarations.split(';').flatMap((declaration) => {
    const colon = declaration.indexOf(':');
    if (colon < 0) return [];
    const name = declaration.slice(0, colon).trim();
    const value = declaration.slice(colon + 1).trim();
    const property = name.startsWith('--')
      ? name
      : name
          .replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
          .replace(/^Ms/, 'ms');
    return [[property, value]];
  });
  return Object.fromEntries(entries) as CSSProperties;
}
