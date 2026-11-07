import { css } from '../../lib/css';

const MONO = "'IBM Plex Mono',monospace";

/**
 * Data-provenance pill. Inventory values default to placeholder/mock data;
 * only entries explicitly marked `provenance: 'real'` were recorded by the
 * household.
 */
export function ProvenanceTag({ real = false }: { real?: boolean }) {
  const color = real ? '#3f9a5b' : '#c0892f';
  return (
    <span
      className="provenance-tag"
      data-provenance={real ? 'real' : 'mock'}
      title={
        real
          ? 'Real data recorded by the household'
          : 'Placeholder / mock data — not verified for this house'
      }
      style={css(
        `font:600 9px ${MONO};color:${color};border:1px solid ${color};padding:2px 6px;border-radius:4px;letter-spacing:0.08em;flex-shrink:0;white-space:nowrap`,
      )}
    >
      {real ? 'REAL DATA' : 'MOCK DATA'}
    </span>
  );
}
