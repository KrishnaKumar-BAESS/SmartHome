import { css } from '../../lib/css';

export function Navigation({ view }) {
  return (
    <nav aria-label="Documentation views" style={css(view.railStyle)}>
      <button
        style={css(view.nav.overview.style)}
        onClick={view.nav.overview.onClick}
        type="button"
        className="nav-button"
        aria-label="Overview"
        aria-pressed={view.mode === 'overview'}
        data-mode="overview"
      >
        <svg
          width={'20'}
          height={'20'}
          viewBox={'0 0 20 20'}
          fill={'none'}
          stroke={'currentColor'}
          strokeWidth={'1.5'}
        >
          <rect
            x={'3.5'}
            y={'3.5'}
            width={'5.4'}
            height={'5.4'}
            rx={'1'}
          ></rect>
          <rect x={'11'} y={'3.5'} width={'5.4'} height={'5.4'} rx={'1'}></rect>
          <rect x={'3.5'} y={'11'} width={'5.4'} height={'5.4'} rx={'1'}></rect>
          <rect x={'11'} y={'11'} width={'5.4'} height={'5.4'} rx={'1'}></rect>
        </svg>
        <span style={css(view.navLabelStyle)}>{'Overview'}</span>
      </button>
      <button
        style={css(view.nav.electrical.style)}
        onClick={view.nav.electrical.onClick}
        type="button"
        className="nav-button"
        aria-label="Electrical"
        aria-pressed={view.mode === 'electrical'}
        data-mode="electrical"
      >
        <svg
          width={'20'}
          height={'20'}
          viewBox={'0 0 20 20'}
          fill={'currentColor'}
        >
          <path d={'M11 2 L4.5 11 L9 11 L8 18 L15.5 8.5 L10.5 8.5 Z'}></path>
        </svg>
        <span style={css(view.navLabelStyle)}>{'Electrical'}</span>
      </button>
      <button
        style={css(view.nav.lighting.style)}
        onClick={view.nav.lighting.onClick}
        type="button"
        className="nav-button"
        aria-label="Lighting"
        aria-pressed={view.mode === 'lighting'}
        data-mode="lighting"
      >
        <svg
          width={'20'}
          height={'20'}
          viewBox={'0 0 20 20'}
          fill={'none'}
          stroke={'currentColor'}
          strokeWidth={'1.5'}
          strokeLinecap={'round'}
          strokeLinejoin={'round'}
        >
          <path
            d={
              'M10 2.6 a5.1 5.1 0 0 1 3.1 9.1 c-0.7 0.55 -1 1.15 -1.1 2.1 H8 c-0.1 -0.95 -0.4 -1.55 -1.1 -2.1 A5.1 5.1 0 0 1 10 2.6 Z'
            }
          ></path>
          <path d={'M8 16.4 h4'}></path>
          <path d={'M8.6 18.1 h2.8'}></path>
        </svg>
        <span style={css(view.navLabelStyle)}>{'Lighting'}</span>
      </button>
      <button
        style={css(view.nav.network.style)}
        onClick={view.nav.network.onClick}
        type="button"
        className="nav-button"
        aria-label="Network"
        aria-pressed={view.mode === 'network'}
        data-mode="network"
      >
        <svg
          width={'20'}
          height={'20'}
          viewBox={'0 0 20 20'}
          fill={'none'}
          stroke={'currentColor'}
          strokeWidth={'1.4'}
        >
          <path
            d={'M10 5.2 L4.8 14.2 M10 5.2 L15.2 14.2 M4.8 14.2 L15.2 14.2'}
          ></path>
          <circle
            cx={'10'}
            cy={'5'}
            r={'2.1'}
            fill={'currentColor'}
            stroke={'none'}
          ></circle>
          <circle
            cx={'4.7'}
            cy={'14.4'}
            r={'1.9'}
            fill={'currentColor'}
            stroke={'none'}
          ></circle>
          <circle
            cx={'15.3'}
            cy={'14.4'}
            r={'1.9'}
            fill={'currentColor'}
            stroke={'none'}
          ></circle>
        </svg>
        <span style={css(view.navLabelStyle)}>{'Network'}</span>
      </button>
      <button
        style={css(view.nav.sound.style)}
        onClick={view.nav.sound.onClick}
        type="button"
        className="nav-button"
        aria-label="Sound"
        aria-pressed={view.mode === 'sound'}
        data-mode="sound"
      >
        <svg
          width={'20'}
          height={'20'}
          viewBox={'0 0 20 20'}
          fill={'none'}
          stroke={'currentColor'}
          strokeWidth={'1.5'}
          strokeLinejoin={'round'}
          strokeLinecap={'round'}
        >
          <path
            d={'M3.5 8 H6.5 L10.5 4.5 V15.5 L6.5 12 H3.5 Z'}
            fill={'currentColor'}
          ></path>
          <path d={'M13.5 7.6 a3.4 3.4 0 0 1 0 4.8'}></path>
          <path d={'M15.6 5.6 a6 6 0 0 1 0 8.8'}></path>
        </svg>
        <span style={css(view.navLabelStyle)}>{'Sound'}</span>
      </button>
      <button
        style={css(view.nav.security.style)}
        onClick={view.nav.security.onClick}
        type="button"
        className="nav-button"
        aria-label="Security"
        aria-pressed={view.mode === 'security'}
        data-mode="security"
      >
        <svg
          width={'20'}
          height={'20'}
          viewBox={'0 0 20 20'}
          fill={'none'}
          stroke={'currentColor'}
          strokeWidth={'1.5'}
          strokeLinejoin={'round'}
        >
          <rect x={'2.8'} y={'6'} width={'10.6'} height={'8.2'} rx={'2'}></rect>
          <path d={'M13.4 8.8 L17 6.6 V13.6 L13.4 11.4'}></path>
          <circle cx={'7.8'} cy={'10.1'} r={'1.9'}></circle>
        </svg>
        <span style={css(view.navLabelStyle)}>{'Security'}</span>
      </button>
      <button
        style={css(view.nav.climate.style)}
        onClick={view.nav.climate.onClick}
        type="button"
        className="nav-button"
        aria-label="Climate"
        aria-pressed={view.mode === 'climate'}
        data-mode="climate"
      >
        <svg
          width={'20'}
          height={'20'}
          viewBox={'0 0 20 20'}
          fill={'none'}
          stroke={'currentColor'}
          strokeWidth={'1.5'}
          strokeLinecap={'round'}
        >
          <path d={'M8.4 3.4 V11.3'}></path>
          <circle
            cx={'8.4'}
            cy={'14'}
            r={'2.6'}
            fill={'currentColor'}
            stroke={'none'}
          ></circle>
          <path d={'M12 6.2 h3.4 M12 9.2 h2.6 M12 12.2 h3'}></path>
        </svg>
        <span style={css(view.navLabelStyle)}>{'Climate'}</span>
      </button>
      <button
        style={css(view.nav.upkeep.style)}
        onClick={view.nav.upkeep.onClick}
        type="button"
        className="nav-button"
        aria-label="Upkeep"
        aria-pressed={view.mode === 'upkeep'}
        data-mode="upkeep"
      >
        <svg
          width={'20'}
          height={'20'}
          viewBox={'0 0 20 20'}
          fill={'none'}
          stroke={'currentColor'}
          strokeWidth={'1.5'}
          strokeLinecap={'round'}
          strokeLinejoin={'round'}
        >
          <path d={'M15.4 7 A6 6 0 1 0 16.3 11.6'}></path>
          <path d={'M15.9 3 V7 H11.9'}></path>
        </svg>
        <span style={css(view.navLabelStyle)}>{'Upkeep'}</span>
      </button>
    </nav>
  );
}
