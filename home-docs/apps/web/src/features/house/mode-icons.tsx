import type { ReactNode } from 'react';

/** One glyph per documentation view, drawn on a 20-unit grid. */
const GLYPHS: Record<string, ReactNode> = {
  overview: (
    <>
      <rect x="3.25" y="3.25" width="5.6" height="5.6" rx="1.6" />
      <rect x="11.15" y="3.25" width="5.6" height="5.6" rx="1.6" />
      <rect x="3.25" y="11.15" width="5.6" height="5.6" rx="1.6" />
      <rect x="11.15" y="11.15" width="5.6" height="5.6" rx="1.6" />
    </>
  ),
  electrical: <path d="M11.2 2.6 5 11h4.4l-.9 6.4 6.5-8.6H10.6z" />,
  lighting: (
    <>
      <path d="M10 2.75a5.1 5.1 0 0 1 3.1 9.15c-.65.5-.95 1.1-1.05 1.95H7.95c-.1-.85-.4-1.45-1.05-1.95A5.1 5.1 0 0 1 10 2.75z" />
      <path d="M8 16.3h4M8.7 18h2.6" />
    </>
  ),
  network: (
    <>
      <circle cx="10" cy="4.6" r="1.9" />
      <circle cx="4.6" cy="14.6" r="1.9" />
      <circle cx="15.4" cy="14.6" r="1.9" />
      <path d="M9.1 6.3 5.5 12.9M10.9 6.3l3.6 6.6M6.5 14.6h7" />
    </>
  ),
  sound: (
    <>
      <path d="M3.5 7.9h2.9l3.9-3.4v11l-3.9-3.4H3.5z" />
      <path d="M13.4 7.6a3.4 3.4 0 0 1 0 4.8M15.6 5.5a6.2 6.2 0 0 1 0 9" />
    </>
  ),
  security: (
    <>
      <rect x="2.75" y="5.75" width="10.5" height="8.5" rx="2.2" />
      <path d="m13.25 8.7 3.9-2.2v7l-3.9-2.2" />
      <circle cx="8" cy="10" r="1.8" />
    </>
  ),
  climate: (
    <>
      <path d="M8.4 3.2a1.9 1.9 0 0 1 1.9 1.9v6.1a3.2 3.2 0 1 1-3.8 0V5.1a1.9 1.9 0 0 1 1.9-1.9z" />
      <path d="M13.3 6h2.9M13.3 9h2.2M13.3 12h2.9" />
    </>
  ),
  room: (
    <>
      <path d="M3.25 16.75V4.75a1.5 1.5 0 0 1 1.5-1.5h10.5a1.5 1.5 0 0 1 1.5 1.5v12" />
      <path d="M2.5 16.75h15M8 16.75v-5.5h4v5.5" />
    </>
  ),
  watering: (
    <path d="M10 2.5C8.2 5.2 4.5 9.2 4.5 12.2a5.5 5.5 0 0 0 11 0c0-3-3.7-7-5.5-9.7ZM7.3 12.4a2.8 2.8 0 0 0 2.8 2.8" />
  ),
  upkeep: (
    <>
      <path d="M15.6 7.2A6 6 0 1 0 16.2 12" />
      <path d="M16.2 3.4v4h-4" />
    </>
  ),
};

export function ModeIcon({ mode, size = 20 }: { mode: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {GLYPHS[mode]}
    </svg>
  );
}
