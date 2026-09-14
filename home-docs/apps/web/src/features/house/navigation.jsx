import { css } from '../../lib/css';

const ICONS = {
  overview: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="5.4" height="5.4" rx="1"></rect>
      <rect x="11" y="3.5" width="5.4" height="5.4" rx="1"></rect>
      <rect x="3.5" y="11" width="5.4" height="5.4" rx="1"></rect>
      <rect x="11" y="11" width="5.4" height="5.4" rx="1"></rect>
    </svg>
  ),
  electrical: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M11 2 L4.5 11 L9 11 L8 18 L15.5 8.5 L10.5 8.5 Z"></path>
    </svg>
  ),
  lighting: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 2.6 a5.1 5.1 0 0 1 3.1 9.1 c-0.7 0.55 -1 1.15 -1.1 2.1 H8 c-0.1 -0.95 -0.4 -1.55 -1.1 -2.1 A5.1 5.1 0 0 1 10 2.6 Z"></path>
      <path d="M8 16.4 h4"></path>
      <path d="M8.6 18.1 h2.8"></path>
    </svg>
  ),
  network: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M10 5.2 L4.8 14.2 M10 5.2 L15.2 14.2 M4.8 14.2 L15.2 14.2"></path>
      <circle cx="10" cy="5" r="2.1" fill="currentColor" stroke="none"></circle>
      <circle
        cx="4.7"
        cy="14.4"
        r="1.9"
        fill="currentColor"
        stroke="none"
      ></circle>
      <circle
        cx="15.3"
        cy="14.4"
        r="1.9"
        fill="currentColor"
        stroke="none"
      ></circle>
    </svg>
  ),
  sound: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path
        d="M3.5 8 H6.5 L10.5 4.5 V15.5 L6.5 12 H3.5 Z"
        fill="currentColor"
      ></path>
      <path d="M13.5 7.6 a3.4 3.4 0 0 1 0 4.8"></path>
      <path d="M15.6 5.6 a6 6 0 0 1 0 8.8"></path>
    </svg>
  ),
  security: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.8" y="6" width="10.6" height="8.2" rx="2"></rect>
      <path d="M13.4 8.8 L17 6.6 V13.6 L13.4 11.4"></path>
      <circle cx="7.8" cy="10.1" r="1.9"></circle>
    </svg>
  ),
  climate: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M8.4 3.4 V11.3"></path>
      <circle
        cx="8.4"
        cy="14"
        r="2.6"
        fill="currentColor"
        stroke="none"
      ></circle>
      <path d="M12 6.2 h3.4 M12 9.2 h2.6 M12 12.2 h3"></path>
    </svg>
  ),
  upkeep: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15.4 7 A6 6 0 1 0 16.3 11.6"></path>
      <path d="M15.9 3 V7 H11.9"></path>
    </svg>
  ),
};

const ORDER = [
  'overview',
  'electrical',
  'lighting',
  'network',
  'sound',
  'security',
  'climate',
  'upkeep',
];

export function Navigation({ view }) {
  return (
    <nav
      aria-label="Documentation views"
      className={view.narrow ? 'nav-rail nav-rail-row' : 'nav-rail'}
      style={css(view.railStyle)}
    >
      {ORDER.map((key) => {
        const item = view.nav[key];
        return (
          <button
            key={key}
            style={css(item.style)}
            onClick={item.onClick}
            type="button"
            className={item.active ? 'nav-button is-active' : 'nav-button'}
            aria-label={item.label}
            title={item.title}
            aria-pressed={item.active}
            aria-current={item.active ? 'page' : undefined}
            data-mode={key}
          >
            {ICONS[key]}
            <span style={css(view.navLabelStyle)}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
