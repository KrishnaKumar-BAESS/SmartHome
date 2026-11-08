/**
 * Data-provenance pill. Inventory values default to placeholder/mock data;
 * only entries explicitly marked `provenance: 'real'` were recorded by the
 * household.
 */
export function ProvenanceTag({ real = false }: { real?: boolean }) {
  return (
    <span
      className="provenance-tag"
      data-provenance={real ? 'real' : 'mock'}
      title={
        real
          ? 'Real data recorded by the household'
          : 'Placeholder / mock data — not verified for this house'
      }
    >
      {real ? 'REAL DATA' : 'MOCK DATA'}
    </span>
  );
}
