/**
 * The shareable part of the view lives in the URL hash so a mode, selection,
 * and isolation can be linked, bookmarked, and restored after reload.
 * Format: `#m=security&s=c3&f=main&r=garage,foyer&x=floors`.
 */
export type UrlState = {
  mode?: string;
  sel?: string;
  isoFloor?: string;
  isoRooms?: string[];
  explode?: string;
};

export function encodeUrlState(state: UrlState): string {
  const params = new URLSearchParams();
  if (state.mode && state.mode !== 'overview') params.set('m', state.mode);
  if (state.sel) params.set('s', state.sel);
  if (state.isoFloor && state.isoFloor !== 'all')
    params.set('f', state.isoFloor);
  if (state.isoRooms && state.isoRooms.length)
    params.set('r', state.isoRooms.join(','));
  if (state.explode && state.explode !== 'full') params.set('x', state.explode);
  const s = params.toString();
  return s ? `#${s}` : '';
}

export function decodeUrlState(hash: string): UrlState {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw) return {};
  const params = new URLSearchParams(raw);
  const out: UrlState = {};
  const mode = params.get('m');
  if (mode) out.mode = mode;
  const sel = params.get('s');
  if (sel) out.sel = sel;
  const floor = params.get('f');
  if (floor) out.isoFloor = floor;
  const rooms = params.get('r');
  if (rooms) out.isoRooms = rooms.split(',').filter(Boolean);
  const explode = params.get('x');
  if (explode) out.explode = explode;
  return out;
}
