import type { SVGProps } from 'react';

/**
 * One icon set on a 16-unit grid with a 1.5 stroke, replacing the mixed
 * glyph characters and ad-hoc paths the preserved views used.
 */
const PATHS: Record<string, string> = {
  close: 'M4 4l8 8M12 4l-8 8',
  chevronLeft: 'M10 3.5L5.5 8l4.5 4.5',
  chevronRight: 'M6 3.5L10.5 8 6 12.5',
  chevronDown: 'M3.5 6L8 10.5 12.5 6',
  arrowRight: 'M3 8h10M9 4l4 4-4 4',
  reset: 'M3 8a5 5 0 1 0 1.5-3.6M3 2.5v3h3',
  expand: 'M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10',
  grid: 'M2.5 2.5h4.5v4.5H2.5zM9 2.5h4.5v4.5H9zM2.5 9h4.5v4.5H2.5zM9 9h4.5v4.5H9z',
  bolt: 'M9 1.5L4 9h4l-1 5.5L12 7H8z',
  note: 'M6 12.5V4l6-1.5V11M6 12.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM12 11a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z',
  help: 'M8 14.5A6.5 6.5 0 1 0 8 1.5a6.5 6.5 0 0 0 0 13zM6 6.2a2 2 0 1 1 2.8 1.8c-.6.3-.8.7-.8 1.3M8 11.6h.01',
  copy: 'M6 6h7v7H6zM3 10V3h7',
  download: 'M8 2.5v8M4.5 7L8 10.5 11.5 7M3 13.5h10',
  plus: 'M8 3v10M3 8h10',
  minus: 'M3 8h10',
  sliders: 'M2 4h12M2 8h12M2 12h12M5 4v0M10 8v0M6 12v0',
  rotateLeft: 'M4.5 6.5A4.5 4.5 0 1 1 5 11M2.5 3.5v3h3',
  rotateRight: 'M11.5 6.5A4.5 4.5 0 1 0 11 11M13.5 3.5v3h-3',
  arrowUp: 'M8 13V3M4 7l4-4 4 4',
  arrowDown: 'M8 3v10M4 9l4 4 4-4',
  arrowLeft: 'M13 8H3M7 4L3 8l4 4',
  cube: 'M8 1.5l5.5 3v7L8 14.5l-5.5-3v-7zM8 7.5l5.5-3M8 7.5L2.5 4.5M8 7.5v7',
  labels: 'M2 4h8M2 8h6M2 12h7',
  legend: 'M2 2.5h12v11H2zM4 5.5h2v2H4zM8 6.5h3.5M4 9.5h2v2H4zM8 10.5h3.5',
  check: 'M3 8.5l3 3 7-7',
  print: 'M4 6V2.5h8V6M4 12H2.5V7h11v5H12M4.5 9.5h7v4h-7z',
  list: 'M2.5 4h11M2.5 8h11M2.5 12h11',
  panel: 'M2.5 3h11v10h-11zM2.5 7h11',
  camera: 'M2.5 5.5h7.5v6H2.5zM10 8l3.5-2v5L10 9',
  compass:
    'M8 14.5A6.5 6.5 0 1 0 8 1.5a6.5 6.5 0 0 0 0 13zM10.5 5.5L9 9l-3.5 1.5L7 7z',
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 14,
  strokeWidth = 1.5,
  ...rest
}: { name: IconName; size?: number; strokeWidth?: number } & Omit<
  SVGProps<SVGSVGElement>,
  'name'
>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
