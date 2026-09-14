import type { CSSProperties } from 'react';

// Parsed declarations are cached by their source string: most inline
// style strings are static, and the rest repeat across renders, so a
// bounded cache removes re-parsing from every render.
const cache = new Map<string, CSSProperties>();
const CACHE_LIMIT = 4000;

/** Convert the preserved house renderer's CSS declarations to React styles. */
export function css(declarations: string = ''): CSSProperties {
  const hit = cache.get(declarations);
  if (hit) return hit;
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
  const result = Object.freeze(Object.fromEntries(entries)) as CSSProperties;
  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(declarations, result);
  return result;
}
