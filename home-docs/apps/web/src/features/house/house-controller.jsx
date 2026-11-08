import { Component, createRef } from 'react';
import {
  boxes,
  circuits,
  rooms,
  bulbs,
  networks,
  nodes,
  servers,
  cameras,
  sensors,
  upkeep,
  floorLabels,
  panelPos,
  nodeRoomId,
} from '../../data/house';
import {
  INVENTORY_SNAPSHOT,
  zones,
  bulbRoomId,
  roomAliases,
  resolveCircuitRef,
  circuitTag,
  cameraFloorConflict,
  relatedForRoom,
  glossary,
} from './catalog';
import { renderScene } from './scene';
import { HouseView } from './house-view';
import { prefersReducedMotion, tween } from '../../lib/motion';
import { decodeUrlState, encodeUrlState } from '../../lib/url-state';
import { toCsv, downloadText, copyText } from '../../lib/export';
import { installAgentApi } from './agent-api';
import {
  MODE_ACCENT,
  STATUS,
  CIRCUIT_TYPE,
  FLOOR,
  ROOM,
  SPEAKER,
  CAMERA_EVENT,
  networkColor,
} from './palette';

const THEME_KEY = 'housedocs-theme';
const SHORTCUTS_KEY = 'housedocs-shortcuts';
const HINT_KEY = 'housedocs-hint';
const SHOW_ADDRESS = import.meta.env.VITE_SHOW_ADDRESS === 'true';

/** State keys that only move the camera; panels never depend on them. */
const CAMERA_KEYS = new Set([
  'yaw',
  'pitch',
  'zoom',
  'panX',
  'panY',
  'explodeT',
  'introT',
  'hoverRoom',
  'dragging',
]);
const HOME = { yaw: 35, pitch: 58, zoom: 1, panX: 0, panY: 0 };
const ZOOM_MIN = 0.4,
  ZOOM_MAX = 4;

const MODE_DEF = [
  ['overview', 'Overview'],
  ['electrical', 'Electrical'],
  ['lighting', 'Lighting'],
  ['network', 'Network'],
  ['sound', 'Sound'],
  ['security', 'Security'],
  ['climate', 'Climate'],
  ['upkeep', 'Upkeep'],
];
const MODE_ORDER = MODE_DEF.map(([key]) => key);

function readStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // persistence is best-effort
  }
}

function initialTheme() {
  const saved = readStorage(THEME_KEY);
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  return 'system';
}

function systemPrefersDark() {
  try {
    return !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

function sameExcept(a, b, ignore) {
  if (a === b) return true;
  const ka = Object.keys(a);
  for (const k of ka) {
    if (ignore.has(k)) continue;
    if (a[k] !== b[k]) return false;
  }
  return ka.length === Object.keys(b).length;
}

const clampZoom = (z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

/** Owns model interaction and derives the eight documentation views. */
export class HouseController extends Component {
  boxes = boxes;
  circuits = circuits;
  rooms = rooms;
  bulbs = bulbs;
  networks = networks;
  nodes = nodes;
  servers = servers;
  cameras = cameras;
  sensors = sensors;
  upkeep = upkeep;
  floorLabels = floorLabels;
  panelPos = panelPos;
  nodeRoomId = nodeRoomId;
  zones = zones;
  SOUND = MODE_ACCENT.sound;

  constructor(props) {
    super(props);
    const hasWindow = typeof window !== 'undefined';
    const vw = hasWindow ? window.innerWidth : 1280;
    const vh = hasWindow ? window.innerHeight : 800;
    const narrow = vw < 760;
    this.state = {
      mode: 'overview',
      etype: 'all',
      selCirc: null,
      selPanel: null,
      selRoom: null,
      lf: 'all',
      lroom: 'all',
      bulb: null,
      selNode: 'n1',
      selServer: null,
      selZone: 'zoneA',
      selCam: 'c1',
      camFilter: 'all',
      feedGrid: false,
      selSensor: 'ts1',
      selUp: 'u1',
      uf: 'all',
      ...HOME,
      explode: 'full',
      explodeT: 2,
      // 0→1 drives the first-load intro; reduced motion starts settled.
      introT: prefersReducedMotion() ? 1 : 0,
      intro: !prefersReducedMotion(),
      legend: false,
      autoRotate: false,
      isoFloor: 'all',
      isoRooms: [],
      isoPanel: false,
      leftHidden: narrow,
      rightHidden: !narrow && vw < 1000,
      camExpanded: false,
      histIdx: 0,
      q: '',
      searchFocus: false,
      searchSel: -1,
      searchCat: 'all',
      searchAll: false,
      hoverRoom: null,
      dragging: false,
      vw,
      vh,
      showRoomLabels: true,
      viewOptsOpen: false,
      helpOpen: false,
      theme: hasWindow ? initialTheme() : 'system',
      systemDark: hasWindow ? systemPrefersDark() : false,
      shortcuts: hasWindow ? readStorage(SHORTCUTS_KEY) !== 'off' : true,
      hintDismissed: hasWindow ? readStorage(HINT_KEY) === '1' : true,
      notice: null,
    };
    if (hasWindow)
      Object.assign(this.state, this.stateFromHash(window.location.hash));
    this.idx = this.buildIndex();
  }

  // ---------------------------------------------------------------- helpers
  stColor(s) {
    // Hex only: results can feed hexA()/mix() in the scene renderer.
    return s === 'ok'
      ? STATUS.ok
      : s === 'soon' || s === 'warn'
        ? STATUS.soon
        : s === 'overdue'
          ? STATUS.overdue
          : STATUS.idle;
  }

  stLabel(s) {
    return s === 'ok'
      ? 'OK'
      : s === 'soon'
        ? 'DUE SOON'
        : s === 'overdue'
          ? 'OVERDUE'
          : s === 'warn'
            ? 'WEAK'
            : '';
  }

  kColor(k) {
    return k <= 2200
      ? '#f2a44e'
      : k <= 2500
        ? '#f6b65f'
        : k <= 2800
          ? '#f8c87f'
          : k <= 3200
            ? '#f4d9a6'
            : k <= 3700
              ? '#eee3c4'
              : k <= 4300
                ? '#e7ecdc'
                : '#dfe9f0';
  }

  kName(k) {
    return k <= 2700
      ? 'warm'
      : k <= 3500
        ? 'soft'
        : k <= 4200
          ? 'neutral'
          : 'daylight';
  }

  cMap() {
    const m = {};
    this.circuits.forEach((c) => (m[c.id] = c));
    return m;
  }

  bMap() {
    const m = {};
    this.boxes.forEach((b) => (m[b.id] = b));
    return m;
  }

  typeColor(t) {
    return CIRCUIT_TYPE[t] || CIRCUIT_TYPE.Mixed;
  }

  circuitRooms(cid) {
    return this.rooms.filter((r) => r.sw && r.sw.some((s) => s.c === cid));
  }

  hexA(hex, a) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substr(0, 2), 16),
      g = parseInt(h.substr(2, 2), 16),
      b = parseInt(h.substr(4, 2), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  mix(h1, h2, t) {
    const p = (h) => {
      h = h.replace('#', '');
      return [
        parseInt(h.substr(0, 2), 16),
        parseInt(h.substr(2, 2), 16),
        parseInt(h.substr(4, 2), 16),
      ];
    };
    const a = p(h1),
      b = p(h2);
    const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }

  /** Discovery status: observed reads as the network hue, weak as a warning. */
  nodeColor(status) {
    return status === 'observed'
      ? MODE_ACCENT.network
      : status === 'warn'
        ? STATUS.soon
        : STATUS.idle;
  }

  /** Like mix() but returns hex, so the result can be shaded again. */
  mixHex(h1, h2, t) {
    const p = (h) => {
      h = h.replace('#', '');
      return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
    };
    const a = p(h1),
      b = p(h2);
    return (
      '#' +
      a
        .map((v, i) =>
          Math.round(v + (b[i] - v) * t)
            .toString(16)
            .padStart(2, '0'),
        )
        .join('')
    );
  }

  bulbRoomId(name) {
    return bulbRoomId(name);
  }

  roomById(id) {
    return this.rooms.find((r) => r.id === id) || null;
  }

  roomVisible(rid) {
    const S = this.state;
    const r = this.roomById(rid);
    if (!r) return false;
    if (S.isoRooms && S.isoRooms.length) return S.isoRooms.includes(rid);
    return (S.isoFloor || 'all') === 'all' || r.floor === S.isoFloor;
  }

  spkLayout() {
    return [
      { l: 'FL', x: 18, y: 16, t: 'main', n: 'Front left' },
      { l: 'C', x: 50, y: 11, t: 'main', n: 'Center' },
      { l: 'FR', x: 82, y: 16, t: 'main', n: 'Front right' },
      { l: 'SL', x: 9, y: 50, t: 'main', n: 'Surround left' },
      { l: 'SR', x: 91, y: 50, t: 'main', n: 'Surround right' },
      { l: 'RL', x: 24, y: 86, t: 'main', n: 'Rear left' },
      { l: 'RR', x: 76, y: 86, t: 'main', n: 'Rear right' },
      { l: 'H', x: 33, y: 30, t: 'height', n: 'Height' },
      { l: 'H', x: 67, y: 30, t: 'height', n: 'Height' },
      { l: 'H', x: 33, y: 66, t: 'height', n: 'Height' },
      { l: 'H', x: 67, y: 66, t: 'height', n: 'Height' },
      { l: 'S', x: 38, y: 90, t: 'sub', n: 'Subwoofer' },
      { l: 'S', x: 62, y: 90, t: 'sub', n: 'Subwoofer' },
      { l: '', x: 50, y: 54, t: 'seat', n: 'Listening position' },
    ];
  }

  spk(arr) {
    return arr.map((p, i) => {
      const col = p.t === 'seat' ? 'var(--t4)' : SPEAKER[p.t] || SPEAKER.main;
      const sz = p.t === 'seat' ? 18 : 16;
      return {
        key: `${p.t}-${i}`,
        label: p.t === 'seat' ? '' : p.l,
        name: p.n,
        seat: p.t === 'seat',
        style: `left:${p.x}%;top:${p.y}%;width:${sz}px;height:${sz}px;background:${p.t === 'seat' ? 'transparent' : col};animation-delay:${i * 30}ms`,
      };
    });
  }

  searchRef = createRef();
  detailsRef = createRef();
  listRef = createRef();

  compass(deg) {
    const a = ((deg % 360) + 360) % 360;
    const names = [
      [0, 'E'],
      [45, 'SE'],
      [90, 'S'],
      [135, 'SW'],
      [180, 'W'],
      [225, 'NW'],
      [270, 'N'],
      [315, 'NE'],
    ];
    let best = names[6],
      bd = 999;
    names.forEach(([d, n]) => {
      let diff = Math.abs(a - d);
      diff = Math.min(diff, 360 - diff);
      if (diff < bd) {
        bd = diff;
        best = [d, n];
      }
    });
    return best[1];
  }

  camHistoryFor(cam) {
    const seed = [...cam.id].reduce((a, c) => a + c.charCodeAt(0), 0);
    const rng = (n) => {
      const x = Math.sin(seed * 9301 + n * 49297) * 233280;
      return x - Math.floor(x);
    };
    const types =
      cam.type === 'Doorbell'
        ? ['Ring', 'Person', 'Package', 'Motion']
        : cam.type === 'Indoor'
          ? ['Motion', 'Person']
          : ['Motion', 'Person', 'Vehicle', 'Package'];
    const tcol = CAMERA_EVENT;
    const out = [];
    // Demonstration clock: events are generated backwards from 14:48.
    const nowMin = 14 * 60 + 48;
    let h = 14,
      m = 48;
    for (let i = 0; i < 8; i++) {
      const t = types[Math.floor(rng(i) * types.length)];
      m -= Math.floor(7 + rng(i + 30) * 54);
      while (m < 0) {
        m += 60;
        h -= 1;
      }
      const day = h < 0 ? 'Yest.' : 'Today';
      const hh = ((h % 24) + 24) % 24;
      out.push({
        idx: i,
        type: t,
        color: tcol[t] || 'var(--t4)',
        time: `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        day,
        dur: `${Math.floor(4 + rng(i + 7) * 38)}s`,
        agoMin: nowMin - (h * 60 + m),
      });
    }
    return out;
  }

  // ------------------------------------------------------------- URL state
  selectionKey(S = this.state) {
    switch (S.mode) {
      case 'overview':
        return S.selRoom || '';
      case 'electrical':
        return S.selCirc || (S.selPanel ? `panel:${S.selPanel}` : '');
      case 'lighting':
        return S.bulb || '';
      case 'network':
        return S.selServer ? `server:${S.selServer}` : S.selNode || '';
      case 'sound':
        return S.selZone || '';
      case 'security':
        return S.selCam || '';
      case 'climate':
        return S.selSensor || '';
      case 'upkeep':
        return S.selUp || '';
      default:
        return '';
    }
  }

  hashFor(S = this.state) {
    return encodeUrlState({
      mode: S.mode,
      sel: this.selectionKey(S),
      isoFloor: S.isoFloor,
      isoRooms: S.isoRooms,
      explode: S.explode,
    });
  }

  stateFromHash(hash) {
    const u = decodeUrlState(hash || '');
    const patch = {};
    if (u.mode && MODE_ORDER.includes(u.mode)) patch.mode = u.mode;
    const mode = patch.mode || 'overview';
    const sel = u.sel || '';
    const has = (list, id) => list.some((x) => x.id === id);
    if (sel) {
      if (mode === 'overview' && has(this.rooms, sel)) patch.selRoom = sel;
      else if (mode === 'electrical') {
        if (sel.startsWith('panel:') && has(this.boxes, sel.slice(6))) {
          patch.selPanel = sel.slice(6);
          patch.selCirc = null;
        } else if (has(this.circuits, sel)) patch.selCirc = sel;
      } else if (mode === 'lighting' && has(this.bulbs, sel)) patch.bulb = sel;
      else if (mode === 'network') {
        if (sel.startsWith('server:')) {
          const sv = this.servers.find((s) => s.id === sel.slice(7));
          if (sv) {
            patch.selServer = sv.id;
            patch.selNode = sv.node;
          }
        } else if (has(this.nodes, sel)) patch.selNode = sel;
      } else if (mode === 'sound' && has(this.zones, sel)) patch.selZone = sel;
      else if (mode === 'security' && has(this.cameras, sel))
        patch.selCam = sel;
      else if (mode === 'climate' && has(this.sensors, sel))
        patch.selSensor = sel;
      else if (mode === 'upkeep' && has(this.upkeep, sel)) patch.selUp = sel;
    }
    if (u.isoFloor && ['basement', 'main', 'second'].includes(u.isoFloor))
      patch.isoFloor = u.isoFloor;
    if (u.isoRooms) {
      const valid = u.isoRooms.filter((id) => has(this.rooms, id));
      if (valid.length) {
        patch.isoRooms = valid;
        patch.isoFloor = 'all';
      }
    }
    if (u.explode && ['stacked', 'floors', 'full'].includes(u.explode)) {
      patch.explode = u.explode;
      patch.explodeT = ['stacked', 'floors', 'full'].indexOf(u.explode);
    }
    return patch;
  }

  syncHash() {
    if (typeof window === 'undefined') return;
    const next = this.hashFor();
    if (next === this._lastHash) return;
    this._lastHash = next;
    const url = `${window.location.pathname}${window.location.search}${next}`;
    if (window.location.hash !== next)
      window.history.replaceState(null, '', url);
  }

  // ------------------------------------------------------------- notices
  notify(text, action) {
    const notice = { id: Date.now(), text, action };
    this.setState({ notice });
    clearTimeout(this._noticeT);
    this._noticeT = setTimeout(() => {
      this.setState((s) => (s.notice === notice ? { notice: null } : null));
    }, 4200);
  }

  dismissNotice = () => {
    clearTimeout(this._noticeT);
    this.setState({ notice: null });
  };

  // ------------------------------------------------------------- pointer
  pointers = new Map();
  drag = null;
  pinch = null;

  onPointerDown = (e) => {
    if (e.button !== 0 && e.button !== 1 && e.button !== 2) return;
    this.stopInertia();
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.drag = null;
      this.pinch = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
      };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* capture may be unavailable */
      }
      return;
    }
    if (this.pointers.size > 2) return;
    const pan = e.shiftKey || e.button === 1 || e.button === 2;
    this.drag = {
      id: e.pointerId,
      active: true,
      mode: pan ? 'pan' : 'rotate',
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      vx: 0,
      vy: 0,
      t: performance.now(),
      captured: false,
      target: e.currentTarget,
    };
  };

  onPointerMove = (e) => {
    const pt = this.pointers.get(e.pointerId);
    if (pt) {
      pt.x = e.clientX;
      pt.y = e.clientY;
    }
    if (this.pinch && this.pointers.size >= 2) {
      const [a, b] = [...this.pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const cx = (a.x + b.x) / 2,
        cy = (a.y + b.y) / 2;
      const rect = e.currentTarget.getBoundingClientRect();
      const f = dist / (this.pinch.dist || dist);
      const dx = cx - this.pinch.cx,
        dy = cy - this.pinch.cy;
      this.pinch = { dist, cx, cy };
      this.zoomAt(f, cx - rect.left, cy - rect.top, { dx, dy });
      return;
    }
    const d = this.drag;
    if (!d || !d.active || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x,
      dy = e.clientY - d.y;
    const now = performance.now();
    const dt = Math.max(1, now - d.t);
    d.vx = (dx / dt) * 16;
    d.vy = (dy / dt) * 16;
    d.t = now;
    d.x = e.clientX;
    d.y = e.clientY;
    if (!d.captured) {
      const tdx = e.clientX - d.startX,
        tdy = e.clientY - d.startY;
      if (tdx * tdx + tdy * tdy < 25) return;
      d.captured = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* Capture may already be released by the browser. */
      }
      this.setState({ dragging: true });
    }
    this.moveCamera(d.mode, dx, dy);
  };

  moveCamera(mode, dx, dy) {
    if (mode === 'rotate') {
      this.setState((s) => ({
        yaw: s.yaw + dx * 0.55,
        pitch: Math.min(88, Math.max(12, s.pitch + dy * 0.45)),
      }));
    } else {
      this.setState((s) => ({ panX: s.panX + dx, panY: s.panY + dy }));
    }
  }

  endPointer = (e) => {
    this.pointers.delete(e.pointerId);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* Capture may already be released by the browser. */
    }
    if (this.pinch) {
      if (this.pointers.size < 2) this.pinch = null;
      return;
    }
    const d = this.drag;
    if (!d || d.id !== e.pointerId) return;
    d.active = false;
    this.drag = null;
    if (d.captured) {
      this.setState({ dragging: false });
      if (e.type === 'pointerup') this.startInertia(d);
    }
  };

  onPointerUp = (e) => this.endPointer(e);
  onPointerCancel = (e) => this.endPointer(e);
  onLostPointerCapture = (e) => {
    // Touch starts with implicit capture on the SVG target. Transferring it
    // to the stage bubbles a lost-capture event from that old target.
    if (e.currentTarget.hasPointerCapture(e.pointerId)) return;
    if (this.pointers.has(e.pointerId)) this.endPointer(e);
  };

  onContextMenu = (e) => {
    e.preventDefault();
  };

  startInertia(d) {
    if (prefersReducedMotion() || performance.now() - d.t > 80) return;
    let vx = d.vx,
      vy = d.vy;
    if (Math.hypot(vx, vy) < 1.5) return;
    const step = () => {
      vx *= 0.9;
      vy *= 0.9;
      if (Math.hypot(vx, vy) < 0.2) {
        this._inertiaRAF = null;
        return;
      }
      this.moveCamera(d.mode, vx, vy);
      this._inertiaRAF = requestAnimationFrame(step);
    };
    this._inertiaRAF = requestAnimationFrame(step);
  }

  stopInertia() {
    this.finishIntro();
    if (this._inertiaRAF) {
      cancelAnimationFrame(this._inertiaRAF);
      this._inertiaRAF = null;
    }
  }

  /** Scale around a stage-relative point so it stays under the pointer. */
  zoomAt(f, px, py, shift) {
    this.setState((s) => {
      const zoom = clampZoom(s.zoom * f);
      const real = zoom / s.zoom;
      const L = this._layout || { cx: px, cy: py };
      const panX = px - L.cx - (px - L.cx - s.panX) * real + (shift?.dx || 0);
      const panY = py - L.cy - (py - L.cy - s.panY) * real + (shift?.dy || 0);
      return { zoom, panX, panY };
    });
  }

  onWheelNative = (e) => {
    // Ctrl/⌘ + wheel is the browser's own zoom; leave it alone.
    if (e.ctrlKey || e.metaKey) return;
    if (!e.deltaY) return;
    e.preventDefault();
    const rect = this._stage.getBoundingClientRect();
    const mag = Math.min(1, Math.abs(e.deltaY) / 100);
    const f = Math.exp(-Math.sign(e.deltaY) * mag * 0.14);
    this.zoomAt(f, e.clientX - rect.left, e.clientY - rect.top);
  };

  stageRef = (element) => {
    if (element === this._stage) return;
    this._stage?.removeEventListener('wheel', this.onWheelNative);
    this._resize?.disconnect();
    this._stage = element;
    if (!element) return;
    element.addEventListener('wheel', this.onWheelNative, { passive: false });
    if (typeof ResizeObserver !== 'undefined') {
      this._resize = new ResizeObserver((entries) => {
        const r = entries[0]?.contentRect;
        if (!r) return;
        const w = Math.round(r.width),
          h = Math.round(r.height);
        if (w && h && (w !== this.state.vw || h !== this.state.vh))
          this.setState({ vw: w, vh: h });
      });
      this._resize.observe(element);
    }
  };

  // ------------------------------------------------------------- camera ops
  nudge = (what, dir) => {
    const step = { rotate: 15, tilt: 10, pan: 60 }[what];
    const from = { ...this.pick(['yaw', 'pitch', 'panX', 'panY']) };
    const to = { ...from };
    if (what === 'rotate') to.yaw += dir * step;
    else if (what === 'tilt')
      to.pitch = Math.min(88, Math.max(12, to.pitch + dir * step));
    else if (what === 'panX') to.panX += dir * step;
    else if (what === 'panY') to.panY += dir * step;
    this.tweenCamera(to, 180);
  };

  /** First-load intro: floors drop in while the camera eases round to its view. */
  startIntro() {
    if (!this.state.intro) return;
    const yaw = this.state.yaw;
    this._introTarget = yaw;
    // Any input anywhere (panels included) settles the model first.
    this._onIntroInput = () => this.finishIntro();
    for (const type of ['pointerdown', 'keydown', 'wheel'])
      window.addEventListener(type, this._onIntroInput, {
        capture: true,
        passive: true,
      });
    this._introTween = tween(
      { introT: 0, yaw: yaw - 40 },
      { introT: 1, yaw },
      1700,
      (v, done) => {
        this.setState(v);
        if (done) this.endIntro();
      },
    );
  }

  /** Settles the intro at once so it never fights the user's input. */
  finishIntro() {
    if (!this._introTween) return;
    this._introTween.cancel();
    this.setState({ introT: 1, yaw: this._introTarget });
    this.endIntro();
  }

  endIntro() {
    this._introTween = null;
    for (const type of ['pointerdown', 'keydown', 'wheel'])
      window.removeEventListener(type, this._onIntroInput, { capture: true });
    // Keep the flag briefly so markers, labels and panels finish fading in.
    this._introTimer = setTimeout(() => this.setState({ intro: false }), 700);
  }

  pick(keys) {
    const out = {};
    for (const k of keys) out[k] = this.state[k];
    return out;
  }

  tweenCamera(to, dur = 520) {
    this._camTween?.cancel();
    this.stopInertia();
    const from = this.pick(Object.keys(to));
    this._camTween = tween(from, to, dur, (v) => this.setState(v));
  }

  zoomStep = (f) => {
    const L = this._layout;
    if (!L) return;
    this.zoomAt(f, L.cx + this.state.panX, L.cy + this.state.panY);
  };

  resetView = () => {
    if (this.state.autoRotate) this.toggleAuto();
    this.tweenCamera({ ...HOME });
  };

  fitVisible = () => this.tweenCamera({ zoom: 1, panX: 0, panY: 0 });

  setPreset = (name) => {
    if (this.state.autoRotate) this.toggleAuto();
    const presets = {
      isometric: { yaw: 35, pitch: 58 },
      plan: { yaw: 0, pitch: 88 },
      north: { yaw: 270, pitch: 58 },
      elevation: { yaw: 0, pitch: 20 },
    };
    const p = presets[name];
    if (p) this.tweenCamera({ ...p });
  };

  resetAll = () => {
    this.resetView();
    this.setState({ isoFloor: 'all', isoRooms: [], explode: 'full' });
    this.animateExplode(2);
    this.notify('View reset · all rooms shown');
  };

  toggleAuto = () => {
    const on = !this.state.autoRotate;
    if (on && prefersReducedMotion()) {
      this.notify('Auto-spin stays off while reduced motion is on');
      return;
    }
    this.setState({ autoRotate: on });
    if (on) this.startAuto();
    else this.stopAuto();
  };

  startAuto = () => {
    if (this._autoRAF) return;
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!this.state.autoRotate || document.hidden) {
        this._autoRAF = null;
        return;
      }
      if (!(this.drag && this.drag.active) && !this.pinch)
        this.setState((s) => ({ yaw: s.yaw + 14 * dt }));
      this._autoRAF = requestAnimationFrame(loop);
    };
    this._autoRAF = requestAnimationFrame(loop);
  };

  stopAuto = () => {
    if (this._autoRAF) {
      cancelAnimationFrame(this._autoRAF);
      this._autoRAF = null;
    }
  };

  animateExplode(target) {
    this._explTween?.cancel();
    const start =
      typeof this.state.explodeT === 'number' ? this.state.explodeT : target;
    this._explTween = tween(
      { explodeT: start },
      { explodeT: target },
      620,
      (v) => this.setState(v),
    );
  }

  setExplode = (name) => {
    const idx = ['stacked', 'floors', 'full'].indexOf(name);
    if (idx < 0) return;
    this.setState({ explode: name });
    this.animateExplode(idx);
  };

  // ------------------------------------------------------------- theme
  effectiveTheme(S = this.state) {
    return S.theme === 'system' ? (S.systemDark ? 'dark' : 'light') : S.theme;
  }

  applyTheme(S = this.state) {
    if (typeof document === 'undefined') return;
    const t = this.effectiveTheme(S);
    document.documentElement.dataset.theme = t;
    document.documentElement.dataset.themeChoice = S.theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta)
      meta.setAttribute('content', t === 'dark' ? '#0b0e13' : '#eef1f5');
  }

  setTheme = (theme) => {
    const root = document.documentElement;
    if (!prefersReducedMotion()) {
      root.classList.add('theme-transition');
      clearTimeout(this._themeT);
      this._themeT = setTimeout(
        () => root.classList.remove('theme-transition'),
        320,
      );
    }
    this.setState({ theme }, () => this.applyTheme());
    writeStorage(THEME_KEY, theme);
  };

  setShortcuts = (on) => {
    this.setState({ shortcuts: on });
    writeStorage(SHORTCUTS_KEY, on ? 'on' : 'off');
  };

  dismissHint = () => {
    this.setState({ hintDismissed: true });
    writeStorage(HINT_KEY, '1');
  };

  // ------------------------------------------------------------- lifecycle
  componentDidMount() {
    this.applyTheme();
    this._mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    this._onMq = (e) =>
      this.setState({ systemDark: e.matches }, () => this.applyTheme());
    this._mq?.addEventListener?.('change', this._onMq);
    this._onKey = (e) => this.handleKey(e);
    window.addEventListener('keydown', this._onKey);
    this._onDown = (e) => {
      const S = this.state;
      if (!S.isoPanel && !S.viewOptsOpen) return;
      if (e.target instanceof Element && e.target.closest('[data-popover]'))
        return;
      this.setState({ isoPanel: false, viewOptsOpen: false });
    };
    document.addEventListener('pointerdown', this._onDown);
    this._onVis = () => {
      document.documentElement.dataset.hidden = document.hidden ? 'true' : '';
      if (!document.hidden && this.state.autoRotate) this.startAuto();
    };
    document.addEventListener('visibilitychange', this._onVis);
    this._onHash = () => {
      if (window.location.hash === this._lastHash) return;
      this._lastHash = window.location.hash;
      this.setState(this.stateFromHash(window.location.hash));
    };
    window.addEventListener('hashchange', this._onHash);
    this._lastHash = this.hashFor();
    this.syncHash();
    if (this.state.explode !== 'full')
      this.setState({
        explodeT: ['stacked', 'floors', 'full'].indexOf(this.state.explode),
      });
    this.startIntro();
    this._agent = installAgentApi({
      read: () => this.agentState(),
      index: this.idx,
      apply: (view) => this.applyAgentView(view),
      select: (id) =>
        new Promise((resolve, reject) => {
          const item = this.idx.find((entry) => entry.focusId === id);
          if (!item) return reject(new Error(`Missing UI record ${id}`));
          this.setState({
            helpOpen: false,
            camExpanded: false,
            feedGrid: false,
          });
          this.chooseResult(item, resolve);
        }),
      reset: () =>
        this.applyAgentView({
          camera: { ...HOME },
          isolation: { floor: 'all', rooms: [] },
          separation: 'full',
        }),
    });
  }

  componentWillUnmount() {
    this._agent?.dispose();
    this._stage?.removeEventListener('wheel', this.onWheelNative);
    this._resize?.disconnect();
    if (this._onKey) window.removeEventListener('keydown', this._onKey);
    if (this._onDown) document.removeEventListener('pointerdown', this._onDown);
    if (this._onVis)
      document.removeEventListener('visibilitychange', this._onVis);
    if (this._onHash) window.removeEventListener('hashchange', this._onHash);
    this._mq?.removeEventListener?.('change', this._onMq);
    this._explTween?.cancel();
    this._camTween?.cancel();
    this.stopInertia();
    if (this._autoRAF) cancelAnimationFrame(this._autoRAF);
    clearTimeout(this._noticeT);
    clearTimeout(this._themeT);
    clearTimeout(this._introTimer);
  }

  componentDidUpdate(_, prev) {
    const S = this.state;
    const selKey = this.selectionKey(S);
    const prevKey = this.selectionKey(prev);
    if (S.mode !== prev.mode || selKey !== prevKey) {
      // A new record opens with its title visible; unrelated updates keep scroll.
      if (this.detailsRef.current) this.detailsRef.current.scrollTop = 0;
      const row = document.getElementById(`row-${selKey.replace(':', '-')}`);
      row?.scrollIntoView({ block: 'nearest' });
    }
    if (S.mode !== prev.mode) {
      document
        .querySelector('.nav-button.is-active')
        ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    if (this._focusAfter) {
      const id = this._focusAfter;
      this._focusAfter = null;
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) {
          el.focus({ preventScroll: false });
          el.scrollIntoView({ block: 'nearest' });
        }
      });
    }
    if (
      (S.leftHidden && !prev.leftHidden) ||
      (S.rightHidden && !prev.rightHidden)
    ) {
      // Collapsing a panel that holds focus moves focus to its reveal control.
      const active = document.activeElement;
      const side = S.leftHidden && !prev.leftHidden ? 'left' : 'right';
      const panel = document.getElementById(`panel-${side}`);
      if (panel && active && panel.contains(active))
        document.getElementById(`toggle-${side}`)?.focus();
    }
    if (this._layout?.onePanel && !S.leftHidden && !S.rightHidden)
      this.setState({ rightHidden: true });
    this.syncHash();
    this._agent?.publish();
  }

  // The automation adapter exposes deliberate view controls, never React internals.
  agentState() {
    const S = this.state;
    const key = this.selectionKey(S);
    const kinds = {
      overview: 'room',
      electrical: 'circuit',
      lighting: 'bulb',
      network: 'node',
      sound: 'zone',
      security: 'camera',
      climate: 'sensor',
      upkeep: 'upkeep',
    };
    const split = key.indexOf(':');
    return {
      mode: S.mode,
      selection: key
        ? {
            kind: split < 0 ? kinds[S.mode] : key.slice(0, split),
            id: split < 0 ? key : key.slice(split + 1),
          }
        : null,
      search: S.q,
      searchCategory: S.searchCat,
      electricalFilter: S.etype,
      lightingFilter: S.lf,
      lightingRoom: S.lroom,
      cameraFilter: S.camFilter,
      upkeepFilter: S.uf,
      isolation: { floor: S.isoFloor, rooms: [...S.isoRooms] },
      camera: this.pick(['yaw', 'pitch', 'zoom', 'panX', 'panY']),
      panels: { list: !S.leftHidden, details: !S.rightHidden },
      separation: S.explode,
      theme: S.theme,
      effectiveTheme: this.effectiveTheme(S),
      labels: S.showRoomLabels,
      legend: S.legend,
      help: S.helpOpen,
      liveCameras: S.mode === 'security' && S.feedGrid,
      shortcuts: S.shortcuts,
      autoRotate: S.autoRotate,
      visibleRoomIds: this.rooms
        .filter((room) => this.roomVisible(room.id))
        .map((room) => room.id),
      hash: this.hashFor(),
    };
  }

  applyAgentView(view) {
    const patch = {};
    const fields = {
      mode: 'mode',
      search: 'q',
      searchCategory: 'searchCat',
      electricalFilter: 'etype',
      lightingFilter: 'lf',
      lightingRoom: 'lroom',
      cameraFilter: 'camFilter',
      upkeepFilter: 'uf',
      separation: 'explode',
      theme: 'theme',
      labels: 'showRoomLabels',
      legend: 'legend',
      help: 'helpOpen',
      liveCameras: 'feedGrid',
      shortcuts: 'shortcuts',
    };
    for (const [key, stateKey] of Object.entries(fields))
      if (Object.hasOwn(view, key)) patch[stateKey] = view[key];
    if (view.search !== undefined)
      Object.assign(patch, {
        searchFocus: !!view.search,
        searchSel: -1,
        searchAll: false,
      });
    if (view.isolation) {
      const floor = view.isolation.floor ?? this.state.isoFloor;
      const roomIds =
        view.isolation.rooms ??
        (view.isolation.floor !== undefined ? [] : this.state.isoRooms);
      Object.assign(patch, {
        isoFloor: roomIds.length ? 'all' : floor,
        isoRooms: [...new Set(roomIds)],
      });
    }
    if (view.camera) {
      this.stopAuto();
      this.stopInertia();
      this._camTween?.cancel();
      Object.assign(patch, view.camera, { autoRotate: false });
    }
    if (view.separation) {
      this._explTween?.cancel();
      patch.explodeT = ['stacked', 'floors', 'full'].indexOf(view.separation);
    }
    if (view.panels) {
      if (view.panels.list !== undefined) patch.leftHidden = !view.panels.list;
      if (view.panels.details !== undefined)
        patch.rightHidden = !view.panels.details;
      if (this._layout?.onePanel) {
        if (view.panels.details) patch.leftHidden = true;
        else if (view.panels.list) patch.rightHidden = true;
      }
    }
    if (view.liveCameras)
      Object.assign(patch, {
        mode: 'security',
        helpOpen: false,
        camExpanded: false,
      });
    else if (view.help)
      Object.assign(patch, { feedGrid: false, camExpanded: false });
    return new Promise((resolve) =>
      this.setState(patch, () => {
        if (view.theme !== undefined) {
          writeStorage(THEME_KEY, view.theme);
          this.applyTheme();
        }
        if (view.shortcuts !== undefined)
          writeStorage(SHORTCUTS_KEY, view.shortcuts ? 'on' : 'off');
        resolve();
      }),
    );
  }

  handleKey(e) {
    // ⌘K / Ctrl+K opens search from anywhere, even inside other fields;
    // it is a chord, so it works with single-key shortcuts turned off.
    if (
      (e.metaKey || e.ctrlKey) &&
      !e.altKey &&
      !e.shiftKey &&
      e.key.toLowerCase() === 'k' &&
      !this.state.camExpanded &&
      !this.state.feedGrid &&
      !this.state.helpOpen
    ) {
      e.preventDefault();
      this.searchRef.current?.focus();
      this.searchRef.current?.select();
      return;
    }
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const S = this.state;
    const t = e.target;
    const inField =
      t &&
      (t.tagName === 'INPUT' ||
        t.tagName === 'TEXTAREA' ||
        t.tagName === 'SELECT' ||
        t.isContentEditable);
    const overlay = S.camExpanded || S.feedGrid || S.helpOpen;
    if (e.key === 'Escape') {
      if (inField) return;
      // Overlays own Escape through their dialog; popovers close here.
      if (overlay) return;
      if (S.viewOptsOpen) this.setState({ viewOptsOpen: false });
      else if (S.isoPanel) this.setState({ isoPanel: false });
      else if (S.notice) this.dismissNotice();
      return;
    }
    if (inField || overlay) return;
    if (e.key === '?') {
      e.preventDefault();
      this.setState({ helpOpen: true });
      return;
    }
    if (!S.shortcuts) return;
    if (e.key === '/') {
      e.preventDefault();
      this.searchRef.current?.focus();
    } else if (e.key >= '1' && e.key <= '8') {
      this.setState({ mode: MODE_ORDER[Number(e.key) - 1] });
    } else if (e.key === '+' || e.key === '=') {
      this.zoomStep(1.15);
    } else if (e.key === '-' || e.key === '_') {
      this.zoomStep(0.87);
    } else if (e.key === '0' || e.key === 'r') {
      this.resetView();
    }
  }

  /** Arrow keys on the focused stage rotate; Shift+arrows pan. */
  onStageKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    const map = {
      ArrowLeft: ['rotate', -1],
      ArrowRight: ['rotate', 1],
      ArrowUp: ['tilt', -1],
      ArrowDown: ['tilt', 1],
    };
    const hit = map[e.key];
    if (!hit) return;
    e.preventDefault();
    if (e.shiftKey) {
      const [what, dir] = hit;
      this.nudge(what === 'rotate' ? 'panX' : 'panY', dir);
    } else this.nudge(hit[0], hit[1]);
  };

  // ------------------------------------------------------------- search
  buildIndex() {
    const B = this.bMap();
    const hay = (...p) => p.filter(Boolean).join(' ').toLowerCase();
    const idx = [];
    this.rooms.forEach((r) =>
      idx.push({
        cat: 'Room',
        accent: ROOM,
        label: r.name,
        sub: this.floorLabels[r.floor],
        ids: [r.name, r.short],
        h: hay(r.name, r.short, this.floorLabels[r.floor], 'room'),
        roomId: r.id,
        focusId: `row-${r.id}`,
        patch: {
          mode: 'overview',
          selRoom: r.id,
          isoRooms: [r.id],
          isoFloor: 'all',
          isoPanel: false,
        },
      }),
    );
    this.circuits.forEach((c) => {
      const bx = B[c.box];
      const rms = this.circuitRooms(c.id)
        .map((r) => r.name)
        .join(' ');
      const tag = `${bx.short}·${c.no}`;
      idx.push({
        cat: 'Circuit',
        accent: this.typeColor(c.type),
        label: c.label,
        sub: `${tag} · ${c.amp}A · ${c.type}`,
        ids: [tag, `${bx.short}${c.no}`, `${bx.short}-${c.no}`],
        h: hay(
          c.label,
          bx.short + c.no,
          tag,
          `${bx.short}-${c.no}`,
          bx.name,
          c.type,
          `${c.amp}a ${c.amp} amp`,
          rms,
          'breaker circuit fuse',
        ),
        roomId: this.circuitRooms(c.id)[0]?.id ?? null,
        focusId: `row-${c.id}`,
        patch: {
          mode: 'electrical',
          selCirc: c.id,
          selPanel: null,
          etype: 'all',
        },
      });
    });
    this.boxes.forEach((bx) =>
      idx.push({
        cat: 'Panel',
        accent: MODE_ACCENT.electrical,
        label: bx.name,
        sub: bx.loc,
        ids: [bx.short, bx.name],
        h: hay(bx.name, bx.short, bx.loc, bx.size, 'breaker panel box'),
        roomId: this.panelPos[bx.id]?.room ?? null,
        focusId: `row-panel-${bx.id}`,
        patch: {
          mode: 'electrical',
          selCirc: null,
          selPanel: bx.id,
          etype: 'all',
        },
      }),
    );
    this.bulbs.forEach((b) =>
      idx.push({
        cat: 'Light',
        accent: MODE_ACCENT.lighting,
        label: `${b.room} — ${b.fixture}`,
        sub: `${b.brand} ${b.model} · ${this.stLabel(b.st) || 'OK'}`,
        ids: [b.fixture, `${b.brand} ${b.model}`],
        h: hay(
          b.room,
          b.fixture,
          b.brand,
          b.model,
          b.base,
          `${b.w}w ${b.w} watt`,
          b.lm ? `${b.lm}lm ${b.lm} lumen` : '',
          `${b.k}k ${b.k} kelvin ${this.kName(b.k)}`,
          b.smart ? 'smart' : '',
          this.stLabel(b.st),
          'bulb light lamp fixture',
        ),
        roomId: this.bulbRoomId(b.room),
        focusId: `row-${b.id}`,
        patch: { mode: 'lighting', bulb: b.id, lf: 'all', lroom: 'all' },
      }),
    );
    this.networks.forEach((n) =>
      idx.push({
        cat: 'Network',
        accent: MODE_ACCENT.network,
        label: n.name,
        sub: `${n.ssid} · ${n.band}`,
        ids: [n.name, n.ssid],
        h: hay(n.name, n.ssid, n.band, 'wifi network ssid'),
        roomId: null,
        focusId: `row-net-${n.id}`,
        patch: { mode: 'network' },
      }),
    );
    this.nodes.forEach((n) =>
      idx.push({
        cat: 'Node',
        accent: MODE_ACCENT.network,
        label: n.name,
        sub: `${n.role} · ${n.room}`,
        ids: [n.name],
        h: hay(
          n.name,
          n.role,
          n.room,
          n.plug,
          n.backhaul,
          n.model,
          n.ip,
          n.mac,
          n.status === 'warn' ? 'weak' : '',
          'router wifi network node mesh access point gateway',
        ),
        roomId: this.nodeRoomId[n.room] ?? null,
        focusId: `row-${n.id}`,
        patch: { mode: 'network', selNode: n.id, selServer: null },
      }),
    );
    this.servers.forEach((s) =>
      idx.push({
        cat: 'Server',
        accent: MODE_ACCENT.network,
        label: s.name,
        sub: `${s.kind} · ${s.room}`,
        ids: [s.name],
        h: hay(s.name, s.kind, s.room, s.power, 'server compute pi raspberry'),
        roomId: this.nodeRoomId[s.room] ?? null,
        focusId: `row-server-${s.id}`,
        patch: { mode: 'network', selNode: s.node, selServer: s.id },
      }),
    );
    this.zones.forEach((z) =>
      idx.push({
        cat: 'Sound',
        accent: MODE_ACCENT.sound,
        label: `${z.name} zone`,
        sub: `${z.config} · ${z.room}`,
        ids: [z.name, z.config],
        h: hay(
          z.name,
          z.config,
          z.room,
          z.power,
          z.source,
          z.gear.map((g) => `${g.l} ${g.d}`).join(' '),
          'sound audio speaker surround zone atmos theater',
        ),
        roomId: z.roomId,
        focusId: `row-${z.id}`,
        patch: { mode: 'sound', selZone: z.id },
      }),
    );
    this.cameras.forEach((c) =>
      idx.push({
        cat: 'Camera',
        accent: MODE_ACCENT.security,
        label: c.name,
        sub: `${c.type} · ${c.room} · ${c.status}`,
        ids: [c.name],
        h: hay(
          c.name,
          c.type,
          c.room,
          c.status,
          c.res,
          c.power,
          c.store,
          c.rec,
          'camera security cctv feed',
        ),
        roomId: c.roomId,
        focusId: `row-${c.id}`,
        patch: {
          mode: 'security',
          selCam: c.id,
          feedGrid: false,
          camFilter: 'all',
        },
      }),
    );
    this.sensors.forEach((s) =>
      idx.push({
        cat: 'Climate',
        accent: MODE_ACCENT.climate,
        label: `${s.name} sensor`,
        sub: `${s.target} · planned`,
        ids: [s.name],
        h: hay(
          s.name,
          s.mount,
          s.target,
          'climate temperature humidity sensor thermostat planned',
        ),
        roomId: s.roomId,
        focusId: `row-${s.id}`,
        patch: { mode: 'climate', selSensor: s.id },
      }),
    );
    this.upkeep.forEach((u) =>
      idx.push({
        cat: 'Upkeep',
        accent: MODE_ACCENT.upkeep,
        label: u.kind,
        sub: `${u.device} · ${this.stLabel(u.status) || 'OK'}`,
        ids: [u.kind, u.part],
        h: hay(
          u.kind,
          u.device,
          u.part,
          u.note,
          this.stLabel(u.status),
          'replacement filter lamp salt maintenance consumable',
        ),
        roomId: u.roomId,
        focusId: `row-${u.id}`,
        patch: { mode: 'upkeep', selUp: u.id, uf: 'all' },
      }),
    );
    return idx;
  }

  chooseResult = (it, onCommit) => {
    const S = this.state;
    const patch = {
      ...it.patch,
      q: '',
      searchFocus: false,
      searchSel: -1,
      searchCat: 'all',
      searchAll: false,
      rightHidden: false,
    };
    patch.leftHidden = !!this._layout?.onePanel;
    let clearedIso = false;
    const isoActive =
      (S.isoFloor || 'all') !== 'all' || (S.isoRooms || []).length > 0;
    if (
      it.cat !== 'Room' &&
      isoActive &&
      it.roomId &&
      !this.roomVisible(it.roomId)
    ) {
      patch.isoFloor = 'all';
      patch.isoRooms = [];
      clearedIso = true;
    }
    this.searchRef.current?.blur();
    this._focusAfter = it.focusId;
    this.setState(patch, onCommit);
    if (clearedIso)
      this.notify(`Isolation cleared so ${it.label} is visible in the model`);
  };

  // ------------------------------------------------------------- data actions
  exportCsv = (name, columns, rows) => {
    downloadText(`house-${name}.csv`, toCsv(columns, rows));
    this.notify(`Exported ${rows.length} rows to house-${name}.csv`);
  };

  copy = async (text, what) => {
    const ok = await copyText(text);
    this.notify(ok ? `Copied ${what || text}` : 'Clipboard unavailable');
  };

  // ------------------------------------------------------------- view
  render() {
    const view = this.deriveView();
    const scene = this.deriveScene(view);
    return <HouseView view={view} scene={scene} />;
  }

  deriveView() {
    const S = this.state;
    const cache = this._viewCache;
    if (cache && sameExcept(cache.state, S, CAMERA_KEYS)) return cache.view;
    const view = this.buildView();
    this._viewCache = { state: S, view };
    return view;
  }

  deriveScene(view) {
    const S = this.state;
    const c = this._sceneCache;
    const camKey = `${S.yaw}|${S.pitch}|${S.zoom}|${S.panX}|${S.panY}|${S.explodeT}|${S.introT}|${S.hoverRoom}|${S.dragging}`;
    if (c && c.opt === view.sceneOpt && c.camKey === camKey) return c.scene;
    const scene = {
      els: renderScene(this, view.sceneOpt),
      viewBox: `0 0 ${view.layout.vw} ${view.layout.vh}`,
      dragging: !!S.dragging,
      hoverRoom: S.hoverRoom,
    };
    this._sceneCache = { opt: view.sceneOpt, camKey, scene };
    return scene;
  }

  layoutFor(S) {
    const vw = S.vw || 1280,
      vh = S.vh || 800;
    const narrow = vw < 760;
    const compact = !narrow && vw < 1180;
    const onePanel = !narrow && vw < 1000;
    const short = vh < 520;
    // Chrome geometry: 12 px gutters, a 56 px top bar and a 72 px rail.
    const G = 12;
    const listW = narrow ? 0 : compact ? 280 : 320;
    const detW = narrow ? 0 : compact ? 300 : 352;
    const railRight = G + 72 + G;
    const leftPx = narrow
      ? 0
      : S.leftHidden
        ? railRight
        : railRight + listW + G;
    const rightPx = narrow ? 0 : S.rightHidden ? G : G + detW + G;
    const sheetH = narrow ? Math.round(vh * (vh < 520 ? 0.46 : 0.42)) : 0;
    const topPx = narrow ? 108 : G + 56 + G;
    const bottomPx = narrow ? (S.rightHidden ? 0 : sheetH + 8) : G;
    const freeW = Math.max(120, vw - leftPx - rightPx);
    // On phones the model dock floats above the sheet; keep the model clear.
    const dockReserve = narrow ? 28 : 0;
    const freeH = Math.max(120, vh - topPx - bottomPx - dockReserve);
    const ms = Math.min(1.5, Math.max(1, Math.min(vw / 960, vh / 600)));
    return {
      vw,
      vh,
      narrow,
      compact,
      onePanel,
      short,
      listW,
      detW,
      leftPx,
      rightPx,
      topPx,
      bottomPx,
      sheetH,
      G,
      railRight,
      freeW,
      freeH,
      cx: leftPx + freeW / 2,
      cy: topPx + freeH / 2,
      fit: 0.72 * Math.min(freeW * 1.35, freeH),
      ms,
    };
  }

  buildView() {
    const S = this.state,
      B = this.bMap();
    const set = (o) => this.setState(o);
    const L = this.layoutFor(S);
    this._layout = L;
    const narrow = L.narrow;
    const light = this.effectiveTheme(S) === 'light';
    const accent = MODE_ACCENT[S.mode] || MODE_ACCENT.overview;
    const isoFloor = S.isoFloor || 'all';
    const isoRooms = S.isoRooms || [];
    const isoActive = isoFloor !== 'all' || isoRooms.length > 0;
    const vis = (rid) => this.roomVisible(rid);

    const isOverview = S.mode === 'overview',
      isElectrical = S.mode === 'electrical',
      isLighting = S.mode === 'lighting',
      isNetwork = S.mode === 'network',
      isSound = S.mode === 'sound',
      isSecurity = S.mode === 'security',
      isClimate = S.mode === 'climate',
      isUpkeep = S.mode === 'upkeep';
    const modeLabel = MODE_DEF.find(([k]) => k === S.mode)?.[1] || '';

    // --- nav rail ---
    const nav = {};
    MODE_DEF.forEach(([key, label], i) => {
      nav[key] = {
        onClick: () => set({ mode: key }),
        active: S.mode === key,
        label,
        accent: MODE_ACCENT[key],
        title: `${label} — shortcut ${i + 1}`,
        kbd: S.shortcuts ? String(i + 1) : null,
      };
    });

    // --- global search ---
    const q = S.q || '';
    const ql = q.trim().toLowerCase();
    const toks = ql.split(/\s+/).filter(Boolean);
    const matchH = (h) => toks.every((t) => h.includes(t));
    const rank = (it) => {
      const ids = it.ids.map((x) => String(x).toLowerCase());
      if (ids.some((x) => x === ql)) return 0;
      if (it.label.toLowerCase() === ql) return 0;
      if (
        ids.some((x) => x.startsWith(ql)) ||
        it.label.toLowerCase().startsWith(ql)
      )
        return 1;
      return 2;
    };
    const allMatches = toks.length
      ? this.idx
          .filter((it) => matchH(it.h))
          .map((it, i) => ({ it, r: rank(it), i }))
          .sort((a, b) => a.r - b.r || a.i - b.i)
          .map((x) => x.it)
      : [];
    const catCounts = {};
    allMatches.forEach(
      (it) => (catCounts[it.cat] = (catCounts[it.cat] || 0) + 1),
    );
    const searchCat = S.searchCat || 'all';
    const catMatches =
      searchCat === 'all'
        ? allMatches
        : allMatches.filter((it) => it.cat === searchCat);
    const searchCount = allMatches.length;
    const searchSel = typeof S.searchSel === 'number' ? S.searchSel : -1;
    const CAP = 16;
    const shown =
      S.searchAll || searchCat !== 'all'
        ? catMatches
        : catMatches.slice(0, CAP);
    const searchResults = shown.map((it, i) => ({
      id: `search-opt-${i}`,
      active: i === searchSel,
      label: it.label,
      sub: it.sub,
      cat: it.cat,
      accent: it.accent,
      onClick: () => this.chooseResult(it),
    }));
    const searchMore = catMatches.length - shown.length;
    const searchCats = [
      {
        key: 'all',
        label: 'All',
        count: searchCount,
        on: searchCat === 'all',
      },
      ...Object.keys(catCounts).map((c) => ({
        key: c,
        label: c,
        count: catCounts[c],
        on: searchCat === c,
      })),
    ].map((c) => ({
      ...c,
      onClick: () => set({ searchCat: c.key, searchSel: -1 }),
    }));
    const showAllResults = () => set({ searchAll: true, searchSel: -1 });
    const suggestDefs = [
      ['Garage outlets', 'm02'],
      ['TP-Link gateway', 'n1'],
      [
        'Overdue bulbs',
        null,
        { mode: 'lighting', lf: 'overdue', bulb: null, lroom: 'all' },
      ],
      ['Projector lamp', 'u1'],
      ['Front Doorbell', 'c1'],
      ['Wine Cellar', 'bsmt_wine_cellar'],
    ];
    const searchSuggest = suggestDefs.map(([label, id, patch], i) => {
      const it = id ? this.idx.find((x) => x.focusId === `row-${id}`) : null;
      return {
        id: `search-opt-${i}`,
        label,
        active: !ql && i === searchSel,
        onClick: () => {
          if (it) this.chooseResult(it);
          else {
            this.searchRef.current?.blur();
            set({
              ...patch,
              q: '',
              searchFocus: false,
              searchSel: -1,
              rightHidden: false,
            });
          }
        },
      };
    });
    const hasQ = ql.length > 0;
    const showResults = S.searchFocus && hasQ;
    const noResults = showResults && searchResults.length === 0;
    const showSuggest = S.searchFocus && !hasQ;
    const navItems = hasQ ? searchResults : searchSuggest;
    const onSearch = (e) =>
      set({
        q: e.target.value,
        searchSel: -1,
        searchCat: 'all',
        searchAll: false,
      });
    const onSearchFocus = () => set({ searchFocus: true, searchSel: -1 });
    // Focus leaving the whole search wrapper closes the popup; moving between
    // the input and its rows keeps it open.
    const onSearchWrapBlur = (e) => {
      const next = e.relatedTarget;
      if (next && e.currentTarget.contains(next)) return;
      set({ searchFocus: false, searchSel: -1 });
    };
    const onSearchWrapFocus = () => {
      if (!this.state.searchFocus) set({ searchFocus: true });
    };
    const clearSearch = () => {
      set({ q: '', searchSel: -1, searchCat: 'all', searchAll: false });
      this.searchRef.current?.focus();
    };
    const cancelSearch = () => {
      set({ q: '', searchFocus: false, searchSel: -1 });
      this.searchRef.current?.blur();
    };
    const onSearchKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (this.state.q)
          set({ q: '', searchSel: -1, searchCat: 'all', searchAll: false });
        else cancelSearch();
        return;
      }
      const n = navItems.length;
      if (!S.searchFocus || n === 0) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        let next;
        if (searchSel < 0) next = e.key === 'ArrowDown' ? 0 : n - 1;
        else next = (searchSel + (e.key === 'ArrowDown' ? 1 : -1) + n) % n;
        set({ searchSel: next });
        document
          .getElementById(`search-opt-${next}`)
          ?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        set({ searchSel: e.key === 'Home' ? 0 : n - 1 });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const r = navItems[searchSel] ?? navItems[0];
        if (r) r.onClick();
      }
    };
    const searchCountLabel =
      searchCount === 1 ? '1 match' : `${searchCount} matches`;
    const searchAnnounce = showResults
      ? noResults
        ? 'No matches'
        : `${searchCountLabel}. Use arrow keys to review results.`
      : showSuggest
        ? `${searchSuggest.length} suggested destinations`
        : '';

    // --- layout ---
    const searchOpen = narrow && S.searchFocus;
    const G = L.G;
    const hideLeft = narrow
      ? 'translateY(calc(-100% - 120px))'
      : `translateX(calc(-100% - ${L.railRight + G}px))`;
    const hideRight = narrow
      ? 'translateY(calc(100% + 24px))'
      : `translateX(calc(100% + ${G + 8}px))`;
    const listPanelStyle =
      (narrow
        ? // The phone list stops above the model dock so both stay usable.
          `left:8px;right:8px;top:calc(${L.topPx + 8}px + env(safe-area-inset-top));bottom:calc(${L.bottomPx + 76}px + env(safe-area-inset-bottom));z-index:20`
        : `left:${L.railRight}px;top:${L.topPx}px;bottom:${G}px;width:${L.listW}px;z-index:18`) +
      (S.leftHidden ? `;transform:${hideLeft}` : '');
    const detailPanelStyle =
      (narrow
        ? `left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom));height:${L.sheetH}px;z-index:19`
        : `right:${G}px;top:${L.topPx}px;bottom:${G}px;width:${L.detW}px;z-index:18`) +
      (S.rightHidden ? `;transform:${hideRight}` : '');
    const searchPlaceholder = narrow
      ? 'Search'
      : 'Search rooms, circuits, lights, devices…';

    // ---- shared dashboard data ----
    const due = this.bulbs.filter((b) => b.st !== 'ok');
    const alertText = `${due.length} fixture records need attention — ${this.bulbs.filter((b) => b.st === 'overdue').length} overdue, ${this.bulbs.filter((b) => b.st === 'soon').length} due soon`;
    const goMode = (patch) =>
      set({
        ...patch,
        rightHidden: false,
        ...(narrow ? {} : { leftHidden: L.onePanel }),
      });
    const overviewStats = [
      {
        label: 'ELECTRICAL',
        mode: 'electrical',
        name: 'Electrical',
        stat: String(this.circuits.length),
        sub: `circuits · ${this.boxes.length} panels`,
        accent: MODE_ACCENT.electrical,
        onClick: () => goMode({ mode: 'electrical' }),
      },
      {
        label: 'LIGHTING',
        mode: 'lighting',
        name: 'Lighting',
        stat: String(this.bulbs.length),
        sub: `fixtures · ${due.length} flagged`,
        accent: MODE_ACCENT.lighting,
        onClick: () => goMode({ mode: 'lighting' }),
      },
      {
        label: 'NETWORK',
        mode: 'network',
        name: 'Network',
        stat: String(this.nodes.length),
        sub: `nodes · ${this.networks.length} networks`,
        accent: MODE_ACCENT.network,
        onClick: () => goMode({ mode: 'network' }),
      },
      {
        label: 'SOUND',
        mode: 'sound',
        name: 'Sound',
        stat: String(this.zones.length),
        sub: 'surround zones',
        accent: MODE_ACCENT.sound,
        onClick: () => goMode({ mode: 'sound' }),
      },
      {
        label: 'SECURITY',
        mode: 'security',
        name: 'Security',
        stat: String(this.cameras.length),
        sub: 'cameras',
        accent: MODE_ACCENT.security,
        onClick: () => goMode({ mode: 'security' }),
      },
      {
        label: 'UPKEEP',
        mode: 'upkeep',
        name: 'Upkeep',
        stat: String(this.upkeep.filter((u) => u.status !== 'ok').length),
        sub: 'replacements due',
        accent: MODE_ACCENT.upkeep,
        onClick: () => goMode({ mode: 'upkeep' }),
      },
    ];
    const needs = due.map((b) => ({
      id: b.id,
      room: b.room,
      fixture: b.fixture,
      statusLabel: this.stLabel(b.st),
      color: this.stColor(b.st),
      onClick: () =>
        goMode({ mode: 'lighting', bulb: b.id, lf: 'all', lroom: 'all' }),
    }));
    const quickFacts = [
      ...(SHOW_ADDRESS
        ? [
            { label: 'Address', val: '8502 Forrest Street' },
            { label: 'Plat', val: 'Lot 11 · Filing 100-H' },
          ]
        : []),
      { label: 'Model', val: 'April 147' },
      { label: 'Levels', val: 'Second · Main · Basement' },
      { label: 'Breaker panels', val: 'Main + Basement sub' },
      { label: 'Finished basement', val: '~1,940 sq ft' },
      { label: 'Inventory snapshot', val: INVENTORY_SNAPSHOT },
    ];
    const headerSub = SHOW_ADDRESS
      ? '8502 Forrest St · April 147'
      : 'April 147 · house atlas';

    // ---- selected room (overview) ----
    const selRoomRec = S.selRoom ? this.roomById(S.selRoom) : null;
    const relatedRows = (rid) =>
      relatedForRoom(rid).map((r) => ({
        ...r,
        onClick: () => this.openRelated(r),
        square: r.kind === 'circuit' || r.kind === 'node',
      }));
    const roomDet = selRoomRec
      ? {
          id: selRoomRec.id,
          name: selRoomRec.name,
          floorLabel: this.floorLabels[selRoomRec.floor],
          aliases: (roomAliases[selRoomRec.id] || []).filter(
            (a) => a !== selRoomRec.name,
          ),
          related: relatedRows(selRoomRec.id),
          hidden: isoActive && !vis(selRoomRec.id),
          isolate: () => set({ isoRooms: [selRoomRec.id], isoFloor: 'all' }),
          isolated: isoRooms.length === 1 && isoRooms[0] === selRoomRec.id,
          clear: () => set({ selRoom: null }),
        }
      : null;

    // ---- ELECTRICAL ----
    const etype = S.etype;
    const eTypeDef = [
      ['all', 'All'],
      ['Lighting', 'Lighting'],
      ['Outlets', 'Outlets'],
      ['Appliance', 'Appliance'],
      ['Mixed', 'Mixed'],
    ];
    const typeFilters = eTypeDef.map(([key, label]) => ({
      key,
      label,
      on: etype === key,
      color: CIRCUIT_TYPE[key] || null,
      onClick: () => set({ etype: key }),
    }));
    const matches = (c) => etype === 'all' || c.type === etype;
    // List rows take their selection hue from a custom property.
    const rowStyleFor = (_sel, ac) => `--ac:${ac}`;
    const circGroups = this.boxes
      .map((bx) => ({
        id: bx.id,
        boxName: bx.name,
        boxShort: bx.short,
        size: bx.size,
        selected: S.selPanel === bx.id && !S.selCirc,
        onClick: () => set({ selPanel: bx.id, selCirc: null }),
        items: this.circuits
          .filter((c) => c.box === bx.id && matches(c))
          .map((c) => {
            const isSel = S.selCirc === c.id;
            return {
              id: c.id,
              tag: `${bx.short}·${c.no}`,
              label: c.label,
              amp: `${c.amp}A`,
              typeLabel: c.type,
              selected: isSel,
              onClick: () => set({ selCirc: c.id, selPanel: null }),
              rowStyle: rowStyleFor(isSel, MODE_ACCENT.electrical),
              color: this.typeColor(c.type),
            };
          }),
      }))
      .filter((g) => g.items.length > 0);
    const ecount = this.circuits.filter(matches).length;
    const selC = S.selCirc
      ? this.circuits.find((c) => c.id === S.selCirc)
      : null;
    const selPanelRec = !selC && S.selPanel ? B[S.selPanel] : null;
    let circDet = null;
    if (selC) {
      const bx = B[selC.box];
      const served = this.circuitRooms(selC.id);
      const floorsHit = [...new Set(served.map((r) => r.floor))];
      const order = { second: 0, main: 1, basement: 2 };
      const fl = floorsHit
        .sort((a, b) => order[a] - order[b])
        .map((f) => this.floorLabels[f]);
      const spansText =
        floorsHit.length > 1
          ? `Spans ${floorsHit.length} levels — ${fl.join(' · ')}`
          : `${fl[0]} only`;
      const tag = `${bx.short}·${selC.no}`;
      circDet = {
        id: selC.id,
        tag,
        copyTag: () => this.copy(tag, `circuit ${tag}`),
        typeLabel: selC.type,
        typeColor: this.typeColor(selC.type),
        amp: `${selC.amp}A`,
        label: selC.label,
        boxName: bx.name,
        boxLoc: bx.loc,
        openPanel: () => set({ selPanel: bx.id, selCirc: null }),
        spansText,
        loadCount: served.length,
        excluded: !matches(selC),
        rooms: served.map((r) => {
          const others = (r.sw || [])
            .map((s) => s.c)
            .filter((c) => c !== selC.id);
          return {
            id: r.id,
            name: r.name,
            floorLabel: this.floorLabels[r.floor],
            hidden: isoActive && !vis(r.id),
            otherCount: others.length,
            cycle: others.length
              ? () => set({ selCirc: others[0], selPanel: null })
              : null,
            floorColor: FLOOR[r.floor] || FLOOR.main,
          };
        }),
        related: relatedRows(served[0]?.id).filter(
          (r) => r.kind !== 'circuit' || r.id !== selC.id,
        ),
        relatedRoom: served[0]?.name,
      };
    }
    const panelDet = selPanelRec
      ? {
          id: selPanelRec.id,
          name: selPanelRec.name,
          short: selPanelRec.short,
          loc: selPanelRec.loc,
          size: selPanelRec.size,
          total: selPanelRec.total,
          documented: this.circuits.filter((c) => c.box === selPanelRec.id)
            .length,
          byType: ['Lighting', 'Outlets', 'Appliance', 'Mixed'].map((t) => ({
            type: t,
            color: this.typeColor(t),
            count: this.circuits.filter(
              (c) => c.box === selPanelRec.id && c.type === t,
            ).length,
          })),
          roomId: this.panelPos[selPanelRec.id]?.room,
          hidden: isoActive && !vis(this.panelPos[selPanelRec.id]?.room),
        }
      : null;

    // ---- LIGHTING ----
    const lsum = [
      { label: 'Total', val: String(this.bulbs.length), color: null },
      {
        label: 'OK',
        val: String(this.bulbs.filter((b) => b.st === 'ok').length),
        color: STATUS.ok,
      },
      {
        label: 'Soon',
        val: String(this.bulbs.filter((b) => b.st === 'soon').length),
        color: STATUS.soon,
      },
      {
        label: 'Overdue',
        val: String(this.bulbs.filter((b) => b.st === 'overdue').length),
        color: STATUS.overdue,
      },
    ];
    const lfDef = [
      ['all', 'All'],
      ['due', 'Needs attention'],
      ['soon', 'Soon'],
      ['overdue', 'Overdue'],
      ['smart', 'Smart'],
    ];
    const lfilters = lfDef.map(([key, label]) => ({
      key,
      label,
      on: S.lf === key,
      color: STATUS[key] && key !== 'warn' ? STATUS[key] : null,
      onClick: () => set({ lf: key }),
    }));
    // Room filter values: `rid:<roomId>` groups every display-name alias of a
    // model room; `name:<room>` keeps rooms that are not on the plan.
    const lroomOpts = [{ val: 'all', label: 'All rooms' }];
    const seenRid = new Set();
    this.bulbs.forEach((b) => {
      const rid = this.bulbRoomId(b.room);
      if (rid) {
        if (seenRid.has(rid)) return;
        seenRid.add(rid);
        const aliases = roomAliases[rid] || [b.room];
        lroomOpts.push({ val: `rid:${rid}`, label: aliases.join(' / ') });
      } else if (!lroomOpts.some((o) => o.val === `name:${b.room}`))
        lroomOpts.push({
          val: `name:${b.room}`,
          label: `${b.room} (not on plan)`,
        });
    });
    const lroom = S.lroom || 'all';
    const bulbInRoom = (b) => {
      if (lroom === 'all') return true;
      if (lroom.startsWith('rid:'))
        return this.bulbRoomId(b.room) === lroom.slice(4);
      if (lroom.startsWith('name:')) return b.room === lroom.slice(5);
      return b.room === lroom;
    };
    const setLroom = (e) => set({ lroom: e.target.value });
    const bulbMatch = (b) => {
      if (S.lf === 'smart' && !b.smart) return false;
      if (S.lf === 'due' && b.st === 'ok') return false;
      if ((S.lf === 'soon' || S.lf === 'overdue') && b.st !== S.lf)
        return false;
      return bulbInRoom(b);
    };
    const filtered = this.bulbs.filter(bulbMatch);
    const bulbRows = filtered.map((b) => ({
      id: b.id,
      room: b.room,
      fixture: b.fixture,
      replaced: b.replaced,
      statusLabel: this.stLabel(b.st) || 'OK',
      spec: `${b.w} W · ${b.lm ? `${b.lm} lm` : 'lumens not recorded'} · ${b.k} K ${this.kName(b.k)}`,
      kText: `${b.k}K`,
      color: this.stColor(b.st),
      kColor: this.kColor(b.k),
      selected: S.bulb === b.id,
      rowStyle: rowStyleFor(S.bulb === b.id, MODE_ACCENT.lighting),
      onClick: () => set({ bulb: b.id }),
    }));
    const lcount = `${filtered.length} of ${this.bulbs.length}`;
    const lroomLabel = lroomOpts.find((o) => o.val === lroom)?.label || '';
    const sb = S.bulb ? this.bulbs.find((b) => b.id === S.bulb) : null;
    let bd = null;
    if (sb) {
      const rid = this.bulbRoomId(sb.room);
      const roomRec = rid ? this.roomById(rid) : null;
      const roomCircuits = roomRec
        ? (roomRec.sw || [])
            .map((s) => this.circuits.find((c) => c.id === s.c))
            .filter(Boolean)
        : [];
      bd = {
        id: sb.id,
        room: sb.room,
        fixture: sb.fixture,
        kColor: this.kColor(sb.k),
        color: this.stColor(sb.st),
        statusLabel: this.stLabel(sb.st) || 'OK',
        statusFull: `Replaced ${sb.replaced} (recorded) · ~${sb.life} yr rated life`,
        excluded: !bulbMatch(sb),
        specs: [
          { k: 'Wattage', v: `${sb.w} W` },
          { k: 'Brightness', v: sb.lm ? `${sb.lm} lm` : 'not recorded' },
          { k: 'Color temp', v: `${sb.k}K (${this.kName(sb.k)})` },
          { k: 'Base / type', v: sb.base },
          { k: 'Brand / model', v: `${sb.brand} ${sb.model}` },
          { k: 'Smart', v: sb.smart ? 'Yes — app controlled' : 'No' },
          { k: 'Last replaced', v: `${sb.replaced} (recorded)` },
        ],
        circuits: roomCircuits.map((c) => ({
          id: c.id,
          tag: circuitTag(c.id),
          label: c.label,
          onClick: () =>
            goMode({
              mode: 'electrical',
              selCirc: c.id,
              selPanel: null,
              etype: 'all',
            }),
        })),
        related: rid
          ? relatedRows(rid).filter(
              (r) => !(r.kind === 'bulb' && r.id === sb.id),
            )
          : [],
        relatedRoom: roomRec?.name,
      };
    }
    let locate = null;
    if (sb) {
      const rid = this.bulbRoomId(sb.room);
      const col = this.stColor(sb.st);
      const room = rid ? this.roomById(rid) : null;
      const hidden = !!room && isoActive && !vis(rid);
      locate = {
        onPlan: !!room,
        color: col,
        roomId: rid,
        floorLabel: room ? this.floorLabels[room.floor] : 'Exterior',
        pinNote: !room
          ? 'not on plan'
          : hidden
            ? 'hidden by isolation'
            : 'pinned in model',
        hidden,
      };
    }

    // ---- NETWORK ----
    const netColor = {};
    this.networks.forEach((n) => (netColor[n.id] = networkColor(n.color)));
    const netName = {};
    this.networks.forEach((n) => (netName[n.id] = n.name));
    const gw = this.nodes[0];
    const gateway = {
      id: gw.id,
      name: gw.name,
      role: gw.role,
      room: gw.room,
      backhaul: gw.backhaul,
      plug: gw.plug,
      selected: S.selNode === gw.id && !S.selServer,
      onClick: () => set({ selNode: gw.id, selServer: null }),
    };
    const networkRows = this.networks.map((n) => ({
      id: n.id,
      name: n.name,
      ssid: n.ssid,
      band: n.band,
      color: networkColor(n.color),
      members: this.nodes.filter((nd) => nd.nets.includes(n.id)).length,
    }));
    const nodeList = this.nodes.map((nd) => {
      const isSel = S.selNode === nd.id && !S.selServer;
      return {
        id: nd.id,
        name: nd.name,
        role: nd.role,
        room: nd.room,
        statusColor: this.nodeColor(nd.status),
        statusLabel: 'Observed at scan',
        netDots: nd.nets.map((x) => ({
          id: x,
          color: netColor[x],
          name: netName[x],
        })),
        netText: nd.nets.map((x) => netName[x]).join(', '),
        selected: isSel,
        onClick: () => set({ selNode: nd.id, selServer: null }),
        rowStyle: rowStyleFor(isSel, MODE_ACCENT.network),
      };
    });
    const snd = this.nodes.find((n) => n.id === S.selNode) || gw;
    const sndServers = this.servers.filter((s) => s.node === snd.id);
    const sndRoomId = this.nodeRoomId[snd.room] ?? null;
    const nodeDet = {
      show: true,
      id: snd.id,
      isGateway: snd.id === gw.id,
      name: snd.name,
      role: snd.role,
      room: snd.room,
      model: snd.model,
      modelPlaceholder: /^\[.*\]$/.test(snd.model.trim()),
      backhaul: snd.backhaul,
      plug: snd.plug,
      plugRef: this.circuitLink(snd.plug, goMode),
      statusColor: this.nodeColor(snd.status),
      statusLabel: 'Observed at scan',
      ip: snd.ip,
      mac: snd.mac,
      observedAt: snd.observedAt,
      evidence: snd.evidence,
      location: `${snd.locationConfidence} · ${snd.locationNote}`,
      statusNote:
        'Discovery snapshot, not live monitoring. Unknown links and power circuits have not been inferred.',
      netDots: snd.nets.map((x) => ({
        id: x,
        color: netColor[x],
        name: netName[x],
      })),
      netText: snd.nets.map((x) => netName[x]).join(', '),
      hasServers: sndServers.length > 0,
      servers: sndServers.map((s) => ({
        id: s.id,
        name: s.name,
        kind: s.kind,
        power: s.power,
        powerRef: this.circuitLink(s.power, goMode),
        selected: S.selServer === s.id,
        onClick: () => set({ selServer: s.id }),
      })),
      hidden: !!sndRoomId && isoActive && !vis(sndRoomId),
      related: sndRoomId
        ? relatedRows(sndRoomId).filter(
            (r) => !(r.kind === 'node' && r.id === snd.id),
          )
        : [],
    };

    // ---- SOUND ----
    const zoneList = this.zones.map((z) => {
      const isSel = S.selZone === z.id;
      return {
        id: z.id,
        name: z.name,
        room: z.room,
        config: z.config,
        power: z.power,
        selected: isSel,
        onClick: () => set({ selZone: z.id }),
        cardStyle: rowStyleFor(isSel, MODE_ACCENT.sound),
      };
    });
    const sz = this.zones.find((z) => z.id === S.selZone) || this.zones[0];
    const zoneDet = {
      id: sz.id,
      name: sz.name,
      room: sz.room,
      config: sz.config,
      configNote: glossary['7.2.4'],
      power: sz.power,
      powerRefs: this.circuitLinks(sz.power, goMode),
      source: sz.source,
      spk: this.spk(this.spkLayout()),
      gear: sz.gear.map((g) => ({
        ...g,
        placeholder: /\[ model \]/.test(g.d),
      })),
      hidden: isoActive && !vis(sz.roomId),
      related: relatedRows(sz.roomId).filter(
        (r) => !(r.kind === 'zone' && r.id === sz.id),
      ),
    };

    // ---- SECURITY ----
    const camStatusCol = (s) => (s === 'online' ? STATUS.ok : STATUS.idle);
    const camFilter = S.camFilter || 'all';
    const camFilterDef = [
      ['all', 'All'],
      ['indoor', 'Indoor'],
      ['outdoor', 'Outdoor'],
      ['offline', 'Offline'],
    ];
    const camFilters = camFilterDef.map(([key, label]) => ({
      key,
      label,
      on: camFilter === key,
      color: key === 'offline' ? STATUS.idle : null,
      onClick: () => set({ camFilter: key }),
    }));
    const camMatch = (c) =>
      camFilter === 'all' ||
      (camFilter === 'indoor' && c.type === 'Indoor') ||
      (camFilter === 'outdoor' && c.type !== 'Indoor') ||
      (camFilter === 'offline' && c.status !== 'online');
    const camsF = this.cameras.filter(camMatch);
    const camList = camsF.map((c) => ({
      id: c.id,
      name: c.name,
      sub: `${c.type} · ${c.room}`,
      res: c.res,
      statusColor: camStatusCol(c.status),
      statusLabel: c.status === 'online' ? 'Online' : 'Offline',
      selected: S.selCam === c.id,
      onClick: () => set({ selCam: c.id, feedGrid: false }),
      rowStyle: rowStyleFor(S.selCam === c.id, MODE_ACCENT.security),
    }));
    const camOnline = this.cameras.filter((c) => c.status === 'online').length;
    const camTotal = this.cameras.length;
    const sc = this.cameras.find((c) => c.id === S.selCam) || this.cameras[0];
    const scOnline = sc.status === 'online';
    const conflict = cameraFloorConflict(sc);
    const powerRef = this.circuitLink(sc.power, goMode);
    const camDet = {
      id: sc.id,
      name: sc.name,
      room: sc.room,
      type: sc.type,
      statusColor: camStatusCol(sc.status),
      statusLabel: scOnline ? 'Online' : 'Offline',
      offline: !scOnline,
      liveColor: scOnline ? STATUS.live : STATUS.idle,
      liveLabel: 'DEMO PREVIEW',
      res: sc.res,
      watermark: sc.room.toUpperCase(),
      coverage: `${sc.fov}° · faces ${this.compass(sc.facing)} (illustrative)`,
      excluded: !camMatch(sc),
      hidden: isoActive && !vis(sc.roomId),
      floorConflict: conflict
        ? `Location mapping unverified: recorded floor is ${this.floorLabels[conflict.recorded]}, but its mapped room (${sc.room}) is on the ${this.floorLabels[conflict.mapped]}. The model draws it at the recorded floor.`
        : '',
      powerRef,
      specs: [
        { k: 'Resolution', v: sc.res },
        {
          k: 'Coverage',
          v: `${sc.fov}° · faces ${this.compass(sc.facing)}`,
          note: 'illustrative cone',
        },
        { k: 'Night vision', v: sc.night ? 'Yes — IR' : 'No' },
        { k: 'Microphone', v: sc.mic ? 'Yes' : 'No' },
        { k: 'Recording', v: sc.rec },
        { k: 'Storage', v: sc.store },
        { k: 'Power / port', v: sc.power, ref: powerRef },
        {
          k: 'Recorded status',
          v: scOnline ? 'Online' : 'Offline — check PoE',
        },
      ],
      copyName: () => this.copy(sc.name, 'camera name'),
      related: relatedRows(sc.roomId).filter(
        (r) => !(r.kind === 'camera' && r.id === sc.id),
      ),
    };
    const openGrid = () => set({ feedGrid: true });
    const closeGrid = () => set({ feedGrid: false });
    const showGrid = !!S.feedGrid;

    // ---- expanded camera + history review ----
    const openExpand = () => set({ camExpanded: true, histIdx: 0 });
    const closeExpand = () => set({ camExpanded: false });
    const showCamExpanded = !!S.camExpanded;
    const camHist = this.camHistoryFor(sc);
    const histSel = S.histIdx || 0;
    const histActive = histSel > 0 ? camHist[histSel - 1] : null;
    const selectHist = (i) => set({ histIdx: i });
    const camPool = camsF.length ? camsF : this.cameras;
    const camPos = Math.max(
      0,
      camPool.findIndex((c) => c.id === sc.id),
    );
    const stepCam = (d) => {
      const next = camPool[(camPos + d + camPool.length) % camPool.length];
      if (next) set({ selCam: next.id, histIdx: 0 });
    };
    const bigFeed = {
      name: sc.name,
      room: sc.room,
      res: sc.res,
      watermark: sc.room.toUpperCase(),
      liveColor:
        histSel === 0 ? (scOnline ? STATUS.live : STATUS.idle) : STATUS.history,
      liveLabel: histSel === 0 ? 'DEMO PREVIEW' : 'DEMO HISTORY',
      time: histActive ? `${histActive.day} ${histActive.time}` : null,
      eventLabel: histActive
        ? `${histActive.type} · ${histActive.dur}`
        : scOnline
          ? 'Demonstration preview — not live video'
          : 'Recorded offline',
      showOffline: !scOnline && histSel === 0,
      counter: `${camPos + 1} of ${camPool.length}`,
      prev: () => stepCam(-1),
      next: () => stepCam(1),
    };
    const expandSub = `${sc.name} · ${camHist.length} demonstration events · generated, not recorded`;
    const maxAgo = Math.max(...camHist.map((h) => h.agoMin), 1);
    const pos = (agoMin) => 4 + (1 - agoMin / maxAgo) * 92;
    const dotStyle = (left, _sel, color) => `left:${left}%;--c:${color}`;
    const histTiles = [
      {
        idx: 0,
        label: 'Demo preview',
        sub: 'Recorded inventory; no live stream',
        aria: 'Demo preview (now)',
        color: scOnline ? STATUS.live : STATUS.idle,
        time: 'DEMO',
        selected: histSel === 0,
        watermark: sc.room.toUpperCase(),
        onClick: () => selectHist(0),
        dotStyle: dotStyle(
          96,
          histSel === 0,
          scOnline ? STATUS.live : STATUS.idle,
        ),
      },
      ...camHist.map((hv, i) => ({
        idx: i + 1,
        label: hv.type,
        sub: `${hv.day} · ${hv.dur}`,
        aria: `${hv.type} at ${hv.time} ${hv.day}, ${hv.dur}`,
        color: hv.color,
        time: hv.time,
        selected: histSel === i + 1,
        watermark: sc.room.toUpperCase(),
        onClick: () => selectHist(i + 1),
        dotStyle: dotStyle(pos(hv.agoMin), histSel === i + 1, hv.color),
      })),
    ];
    const oldest = camHist[camHist.length - 1];
    const timeline = {
      start: oldest ? `${oldest.day} ${oldest.time}` : '',
      end: 'now',
      fillLeft: oldest ? pos(oldest.agoMin) : 0,
      note: `${camHist.length} generated events over ~${Math.round(maxAgo / 60)} h · illustrative`,
    };

    // ---- CLIMATE ----
    const sensorsPlanned = this.sensors.filter(
      (s) => s.status !== 'online',
    ).length;
    const sensorList = this.sensors.map((s) => ({
      id: s.id,
      name: s.name,
      mount: s.mount,
      dot: s.status === 'online' ? MODE_ACCENT.climate : STATUS.idle,
      badge: s.status === 'online' ? 'LIVE' : 'PLANNED',
      selected: S.selSensor === s.id,
      onClick: () => set({ selSensor: s.id }),
      rowStyle: rowStyleFor(S.selSensor === s.id, MODE_ACCENT.climate),
    }));
    const ssn =
      this.sensors.find((x) => x.id === S.selSensor) || this.sensors[0];
    const ssnRoom = this.roomById(ssn.roomId);
    const sensorDet = {
      id: ssn.id,
      name: ssn.name,
      mount: ssn.mount,
      target: ssn.target,
      targetNote: /RH/.test(ssn.target) ? `RH = ${glossary.RH}` : '',
      online: ssn.status === 'online',
      floorLabel: ssnRoom ? this.floorLabels[ssnRoom.floor] : '—',
      hidden: isoActive && !vis(ssn.roomId),
      related: relatedRows(ssn.roomId).filter(
        (r) => !(r.kind === 'sensor' && r.id === ssn.id),
      ),
    };
    const climateBannerText = `${sensorsPlanned} climate sensors planned · none connected`;

    // ---- UPKEEP ----
    const upPct = (u) =>
      u.metric === 'level'
        ? u.used
        : Math.min(100, Math.round((u.used / u.life) * 100));
    const upDueLabel = (u) =>
      u.metric === 'hours'
        ? `${u.used}/${u.life} h used`
        : u.metric === 'months'
          ? u.used > u.life
            ? `${u.used}/${u.life} mo · over by ${u.used - u.life}`
            : `${u.used}/${u.life} mo used`
          : `${u.used}% remaining`;
    const uf = S.uf || 'all';
    const ufDef = [
      ['all', 'All'],
      ['due', 'Due'],
      ['overdue', 'Overdue'],
    ];
    const ufilters = ufDef.map(([key, label]) => ({
      key,
      label,
      on: uf === key,
      color: key === 'overdue' ? STATUS.overdue : null,
      onClick: () => set({ uf: key }),
    }));
    const upMatch = (u) =>
      uf === 'all' ||
      (uf === 'due' && u.status !== 'ok') ||
      (uf === 'overdue' && u.status === 'overdue');
    const urgency = { overdue: 0, soon: 1, ok: 2 };
    const upFiltered = this.upkeep
      .filter(upMatch)
      .map((u, i) => ({ u, i }))
      .sort((a, b) =>
        uf === 'all'
          ? a.i - b.i
          : urgency[a.u.status] - urgency[b.u.status] || a.i - b.i,
      )
      .map((x) => x.u);
    const upList = upFiltered.map((u) => ({
      id: u.id,
      kind: u.kind,
      device: u.device,
      statusColor: this.stColor(u.status),
      statusLabel: this.stLabel(u.status) || 'OK',
      dueLabel: upDueLabel(u),
      lastRefill: u.refills?.length
        ? `+${u.refills.at(-1).bags} bags · ${u.refills.at(-1).date}`
        : '',
      barPct: upPct(u),
      barColor: this.stColor(u.status),
      barMeaning: u.metric === 'level' ? 'remaining' : 'used',
      barAria:
        u.metric === 'level'
          ? `${u.used}% remaining`
          : `${Math.round((u.used / u.life) * 100)}% of rated life used`,
      selected: S.selUp === u.id,
      onClick: () => set({ selUp: u.id }),
      rowStyle: rowStyleFor(S.selUp === u.id, MODE_ACCENT.upkeep),
    }));
    const upSummary = [
      {
        label: 'Overdue',
        val: String(this.upkeep.filter((u) => u.status === 'overdue').length),
        color: STATUS.overdue,
      },
      {
        label: 'Due soon',
        val: String(this.upkeep.filter((u) => u.status === 'soon').length),
        color: STATUS.soon,
      },
      {
        label: 'OK',
        val: String(this.upkeep.filter((u) => u.status === 'ok').length),
        color: STATUS.ok,
      },
    ];
    const upTotal = this.upkeep.length;
    const upCount = `${upFiltered.length} of ${upTotal}`;
    const su = this.upkeep.find((x) => x.id === S.selUp) || this.upkeep[0];
    const suRoom = this.roomById(su.roomId);
    const overrun =
      su.metric === 'months' && su.used > su.life ? su.used - su.life : 0;
    const upDet = {
      id: su.id,
      kind: su.kind,
      device: su.device,
      statusColor: this.stColor(su.status),
      statusLabel: this.stLabel(su.status) || 'OK',
      barPct: upPct(su),
      barColor: this.stColor(su.status),
      barMeaning: su.metric === 'level' ? 'remaining' : 'used',
      metricLabel:
        su.metric === 'level'
          ? 'Salt / pellet level (placeholder)'
          : su.metric === 'hours'
            ? 'Lamp hours used (placeholder)'
            : 'Time in service (placeholder)',
      metricVal:
        su.metric === 'level'
          ? `${su.used}% remaining`
          : su.metric === 'hours'
            ? `${su.used} of ${su.life} hr`
            : overrun
              ? `${su.used} of ${su.life} mo · over by ${overrun} mo`
              : `${su.used} of ${su.life} mo`,
      note: su.note,
      refills: su.refills ?? [],
      locationReal: su.locationProvenance === 'real',
      excluded: !upMatch(su),
      floorLabel: suRoom ? this.floorLabels[suRoom.floor] : '—',
      hidden: isoActive && !vis(su.roomId),
      pinNote:
        isoActive && !vis(su.roomId)
          ? 'hidden by isolation'
          : 'pinned in model',
      specs: [
        { k: 'Part / type', v: su.part, note: this.abbrNote(su.part) },
        { k: 'Device', v: su.device, note: this.abbrNote(su.device) },
        { k: 'Last replaced', v: `${su.lastDone} (placeholder)` },
        {
          k: 'Interval',
          v:
            su.metric === 'hours'
              ? `~${su.life} hr lamp`
              : su.metric === 'months'
                ? `every ${su.life} mo`
                : 'refill on level',
        },
      ],
      roomItems: this.upkeep
        .filter((u) => u.roomId === su.roomId && u.id !== su.id)
        .map((u) => ({
          id: u.id,
          kind: u.kind,
          statusLabel: this.stLabel(u.status) || 'OK',
          color: this.stColor(u.status),
          onClick: () => set({ selUp: u.id }),
        })),
      related: relatedRows(su.roomId).filter((r) => r.kind !== 'upkeep'),
    };
    const upDue = this.upkeep.filter((u) => u.status !== 'ok').length;
    const upOverdue = this.upkeep.filter((u) => u.status === 'overdue').length;
    const upSoon = this.upkeep.filter((u) => u.status === 'soon').length;
    const upAlertText = `${upDue} replacements due — ${upOverdue} overdue, ${upSoon} due soon`;
    const goClimate = () => goMode({ mode: 'climate' });
    const goUpkeep = () => {
      const first =
        this.upkeep.find((u) => u.status === 'overdue') ||
        this.upkeep.find((u) => u.status !== 'ok');
      goMode({ mode: 'upkeep', uf: 'due', selUp: first ? first.id : S.selUp });
    };
    const goLighting = () => {
      const first =
        this.bulbs.find((b) => b.st === 'overdue') ||
        this.bulbs.find((b) => b.st !== 'ok');
      goMode({
        mode: 'lighting',
        lf: 'due',
        lroom: 'all',
        bulb: first ? first.id : null,
      });
    };

    // ---- selection notices shared by every mode ----
    const filterNotice = (() => {
      if (isElectrical && circDet?.excluded)
        return {
          text: `${circDet.tag} is outside the ${etype} filter`,
          label: 'Show all types',
          onClick: () => set({ etype: 'all' }),
        };
      if (isLighting && bd?.excluded)
        return {
          text: 'This fixture is outside the current filter',
          label: 'Reset filters',
          onClick: () => set({ lf: 'all', lroom: 'all' }),
        };
      if (isSecurity && camDet.excluded)
        return {
          text: `${camDet.name} is outside the ${camFilter} filter`,
          label: 'Show all cameras',
          onClick: () => set({ camFilter: 'all' }),
        };
      if (isUpkeep && upDet.excluded)
        return {
          text: `${upDet.kind} is outside the ${uf} filter`,
          label: 'Show all items',
          onClick: () => set({ uf: 'all' }),
        };
      return null;
    })();
    const selHidden =
      (isOverview && roomDet?.hidden) ||
      (isElectrical &&
        (panelDet?.hidden ||
          (circDet &&
            circDet.rooms.length > 0 &&
            circDet.rooms.every((r) => r.hidden)))) ||
      (isLighting && locate?.hidden) ||
      (isNetwork && nodeDet.hidden) ||
      (isSound && zoneDet.hidden) ||
      (isSecurity && camDet.hidden) ||
      (isClimate && sensorDet.hidden) ||
      (isUpkeep && upDet.hidden);
    const isoNotice = selHidden
      ? {
          text: 'Isolation hides this item in the model',
          label: 'Show all rooms',
          onClick: () => set({ isoFloor: 'all', isoRooms: [] }),
        }
      : null;

    // ---- scene options ----
    const ridToLroom = {};
    this.bulbs.forEach((b) => {
      const r = this.bulbRoomId(b.room);
      if (r && !ridToLroom[r]) ridToLroom[r] = b.room;
    });
    const cycle = (list, currentId) => {
      if (!list.length) return null;
      const i = list.findIndex((x) => x.id === currentId);
      return list[(i + 1) % list.length];
    };
    const onRoomClick = (rid) => {
      const room = this.roomById(rid);
      if (!room) return;
      const describe = (what) => {
        if (this.state.rightHidden)
          this.notify(`Selected ${what}`, {
            label: 'Show details',
            onClick: () => set({ rightHidden: false }),
          });
      };
      if (isOverview) {
        set({ selRoom: rid });
        describe(room.name);
      } else if (isElectrical) {
        const list = (room.sw || [])
          .map((s) => this.circuits.find((c) => c.id === s.c))
          .filter(Boolean);
        const next = cycle(list, this.state.selCirc);
        if (next) {
          set({ selCirc: next.id, selPanel: null });
          describe(
            `${circuitTag(next.id)} (${list.length} circuit${list.length > 1 ? 's' : ''} in ${room.name})`,
          );
        } else this.notify(`No documented circuit serves ${room.name}`);
      } else if (isLighting) {
        if (roomAliases[rid]) set({ lroom: `rid:${rid}` });
        else this.notify(`No fixture records in ${room.name}`);
      } else if (isNetwork) {
        const list = this.nodes.filter((n) => this.nodeRoomId[n.room] === rid);
        const next = cycle(list, this.state.selNode);
        if (next) {
          set({ selNode: next.id, selServer: null });
          describe(next.name);
        }
      } else if (isSound) {
        const zone = this.zones.find((z) => z.roomId === rid);
        if (zone) set({ selZone: zone.id });
      } else if (isSecurity) {
        const list = this.cameras.filter((c) => c.roomId === rid);
        const next = cycle(list, this.state.selCam);
        if (next) {
          set({ selCam: next.id, feedGrid: false });
          describe(
            `${next.name}${list.length > 1 ? ` (${list.length} cameras here)` : ''}`,
          );
        }
      } else if (isClimate) {
        const sn = this.sensors.find((s) => s.roomId === rid);
        if (sn) set({ selSensor: sn.id });
      } else if (isUpkeep) {
        const list = this.upkeep.filter((u) => u.roomId === rid);
        const next = cycle(list, this.state.selUp);
        if (next) {
          set({ selUp: next.id });
          describe(
            `${next.kind}${list.length > 1 ? ` (${list.length} items here)` : ''}`,
          );
        }
      }
    };
    const onFloorClick = (floor) => set({ isoFloor: floor, isoRooms: [] });
    const floorLabelMinX = narrow ? 22 : L.leftPx + 22;

    const sceneOpt = {
      layer: S.mode,
      light,
      layout: L,
      onRoomClick,
      onFloorClick,
      onPanelClick: (bid) =>
        set({
          mode: 'electrical',
          selCirc: null,
          selPanel: bid,
          rightHidden: false,
        }),
      showRoomLabels: S.showRoomLabels !== false,
      floorLabelMinX,
      onRoomHover: (rid) => {
        if (this.state.hoverRoom !== rid) this.setState({ hoverRoom: rid });
      },
      roomAliases,
      selRoom: isOverview ? S.selRoom : null,
    };
    if (isOverview && S.selRoom) sceneOpt.hiRooms = [S.selRoom];
    if (isElectrical) {
      sceneOpt.selC = selC;
      sceneOpt.selPanel = S.selPanel;
    }
    if (isLighting) {
      sceneOpt.bulbs = filtered;
      sceneOpt.selBulb = S.bulb;
      sceneOpt.hiColor = MODE_ACCENT.lighting;
      sceneOpt.onBulbClick = (id) => set({ bulb: id });
      if (sb && this.bulbRoomId(sb.room))
        sceneOpt.locate = {
          roomId: this.bulbRoomId(sb.room),
          color: this.stColor(sb.st),
          label: sb.fixture,
        };
    }
    if (isNetwork) {
      sceneOpt.selNode = S.selNode;
      sceneOpt.hiColor = MODE_ACCENT.network;
      sceneOpt.onNodeClick = (id) => set({ selNode: id, selServer: null });
      if (sndRoomId) sceneOpt.hiRooms = [sndRoomId];
    }
    if (isSound) {
      sceneOpt.hiColor = MODE_ACCENT.sound;
      sceneOpt.hiRooms = this.zones.map((z) => z.roomId);
      sceneOpt.soundRoom = sz.roomId;
      sceneOpt.locate = {
        roomId: sz.roomId,
        color: MODE_ACCENT.sound,
        label: `${sz.name} zone`,
      };
    }
    if (isSecurity) {
      sceneOpt.cameras = this.cameras;
      sceneOpt.selCam = S.selCam;
      sceneOpt.hiColor = MODE_ACCENT.security;
      sceneOpt.onCamClick = (id) => set({ selCam: id, feedGrid: false });
      if (sc && sc.roomId && sc.type === 'Indoor')
        sceneOpt.hiRooms = [sc.roomId];
    }
    if (isClimate) {
      sceneOpt.sensors = this.sensors;
      sceneOpt.selSensor = S.selSensor;
      sceneOpt.hiColor = MODE_ACCENT.climate;
      sceneOpt.onSensorClick = (id) => set({ selSensor: id });
      if (ssn && ssn.roomId) sceneOpt.hiRooms = [ssn.roomId];
    }
    if (isUpkeep) {
      sceneOpt.upkeep = this.upkeep;
      sceneOpt.selUp = S.selUp;
      sceneOpt.hiColor = MODE_ACCENT.upkeep;
      sceneOpt.onUpkeepClick = (id) => set({ selUp: id });
      if (su && su.roomId) {
        sceneOpt.hiRooms = [su.roomId];
        sceneOpt.locate = {
          roomId: su.roomId,
          color: this.stColor(su.status),
          label: su.kind,
        };
      }
    }
    if (isOverview) {
      sceneOpt.onNodeClick = (id) =>
        goMode({ mode: 'network', selNode: id, selServer: null });
      sceneOpt.onBulbClick = (id) => goMode({ mode: 'lighting', bulb: id });
    }

    // ---- prompt / hint / legend ----
    const showPrompt =
      (isElectrical && !selC && !selPanelRec) || (isLighting && !sb);
    const promptTop = narrow ? L.topPx + 10 : L.topPx + 4;
    const promptStyle = `top:${promptTop}px;left:${L.cx}px;max-width:calc(${L.freeW}px - 24px)`;
    const promptText = isElectrical
      ? 'Pick a circuit, a panel, or a room'
      : isLighting
        ? 'Pick a fixture, or a room to filter'
        : '';
    const showHint = !S.hintDismissed && isOverview && !showPrompt;
    const hintText = narrow
      ? 'Drag to rotate · pinch to zoom'
      : 'Drag to rotate · scroll to zoom · Shift-drag to pan';
    let legendTitle = 'Systems',
      legendItems = [],
      legendNote = '';
    const sw = (c, sq) => ({ color: c, shape: sq ? 'sq' : 'dot' });
    if (isOverview) {
      legendTitle = 'Overview';
      legendItems = [
        { label: 'Breaker panel', ...sw('var(--panel-marker-bd)', true) },
        { label: 'Flagged fixture', ...sw(STATUS.soon) },
        { label: 'Network device', ...sw(MODE_ACCENT.network, true) },
      ];
    } else if (isElectrical) {
      legendTitle = 'Circuit type';
      legendItems = ['Lighting', 'Outlets', 'Appliance', 'Mixed'].map((t) => ({
        label: t,
        ...sw(CIRCUIT_TYPE[t], true),
      }));
      legendNote =
        'Wiring paths are schematic associations, not surveyed routes.';
    } else if (isLighting) {
      legendTitle = 'Fixture status';
      legendItems = [
        { label: 'OK', ...sw(STATUS.ok) },
        { label: 'Due soon', ...sw(STATUS.soon) },
        { label: 'Overdue', ...sw(STATUS.overdue) },
      ];
    } else if (isNetwork) {
      legendTitle = 'Networks';
      legendItems = [
        ...this.networks.map((n) => ({
          label: n.name,
          ...sw(networkColor(n.color), true),
        })),
        {
          label: 'Gateway (diamond)',
          ...sw(MODE_ACCENT.network),
          diamond: true,
        },
      ];
      legendNote =
        'Only the observed host-to-gateway association is drawn. Other uplinks are unknown; positions are schematic.';
    } else if (isSound) {
      legendTitle = 'Sound';
      legendItems = [
        { label: 'Surround zone', ...sw(MODE_ACCENT.sound) },
        { label: 'Speaker (schematic)', ...sw(MODE_ACCENT.sound, true) },
      ];
      legendNote = 'Speaker squares are a generic placement sketch.';
    } else if (isSecurity) {
      legendTitle = 'Security';
      legendItems = [
        {
          label: 'Camera + illustrative coverage',
          ...sw(MODE_ACCENT.security, true),
        },
        { label: 'Offline camera', ...sw(STATUS.idle, true) },
      ];
      legendNote =
        'Coverage cones ignore walls; positions are recorded, not surveyed.';
    } else if (isClimate) {
      legendTitle = 'Climate';
      legendItems = [
        {
          label: 'Sensor (planned)',
          ...sw('var(--t4)'),
          diamond: true,
          ring: true,
        },
        { label: 'Disconnected', ...sw(STATUS.idle, true) },
      ];
    } else if (isUpkeep) {
      legendTitle = 'Replacements';
      legendItems = [
        { label: 'OK', ...sw(STATUS.ok) },
        { label: 'Due soon', ...sw(STATUS.soon) },
        { label: 'Overdue', ...sw(STATUS.overdue) },
      ];
      legendNote = 'Each room marker shows its most urgent item.';
    }

    // ---- view controls ----
    const explodeOrder = ['stacked', 'floors', 'full'];
    const explodeIdx = Math.max(0, explodeOrder.indexOf(S.explode));
    const explodeLabel =
      { stacked: 'STACKED', floors: 'FLOORS', full: 'EXPLODED' }[S.explode] ||
      'EXPLODED';
    const leftHidden = !!S.leftHidden;
    const rightHidden = !!S.rightHidden;
    // Below 1000 px only one side panel fits beside a usable stage.
    const toggleLeft = () =>
      set((s) => ({
        leftHidden: !s.leftHidden,
        rightHidden: L.onePanel && s.leftHidden ? true : s.rightHidden,
      }));
    const toggleRight = () =>
      set((s) => ({
        rightHidden: !s.rightHidden,
        leftHidden: L.onePanel && s.rightHidden ? true : s.leftHidden,
      }));
    const mapRight = narrow ? 8 : L.rightPx;
    const clusterRight = narrow ? 8 : mapRight + 4;
    const ctrlBottom = narrow ? L.bottomPx + 10 : L.G + 4;
    const isoPanelStyle = `top:calc(${narrow ? L.topPx + 10 : L.topPx}px + env(safe-area-inset-top));right:${mapRight}px;max-height:calc(100dvh - ${narrow ? L.topPx + 24 + L.bottomPx : L.topPx + 40}px)`;
    const legendPanelStyle = narrow
      ? `left:8px;bottom:calc(${ctrlBottom}px + env(safe-area-inset-bottom));max-width:calc(100% - 200px)`
      : `right:${clusterRight}px;bottom:${ctrlBottom + 60}px;max-width:calc(100% - 16px)`;
    const labelsOn = S.showRoomLabels !== false;
    const toggleLabels = () =>
      set((s) => ({ showRoomLabels: !s.showRoomLabels }));
    const autoRotate = !!S.autoRotate;
    const toggleLegend = () => set((s) => ({ legend: !s.legend }));
    const viewOptsOpen = !!S.viewOptsOpen;
    const toggleViewOpts = () =>
      set((s) => ({ viewOptsOpen: !s.viewOptsOpen, isoPanel: false }));
    const zoomPct = Math.round(S.zoom * 100) + '%';
    const atMin = S.zoom <= ZOOM_MIN + 1e-6,
      atMax = S.zoom >= ZOOM_MAX - 1e-6;
    const explodeBtns = [
      {
        key: 'full',
        label: 'Exploded',
        on: explodeIdx === 2,
        onClick: () => this.setExplode('full'),
      },
      {
        key: 'floors',
        label: 'Floors',
        on: explodeIdx === 1,
        onClick: () => this.setExplode('floors'),
      },
      {
        key: 'stacked',
        label: 'Stacked',
        on: explodeIdx === 0,
        onClick: () => this.setExplode('stacked'),
      },
    ];
    const voRow = () => '';
    const voToggle = () => '';
    const viewOpts = {
      resetRow: {
        style: voRow(false),
        onClick: this.resetView,
        label: 'Reset orientation',
        hint: 'Angle, zoom, pan',
      },
      resetAllRow: {
        style: voRow(false),
        onClick: this.resetAll,
        label: 'Reset everything',
        hint: '+ isolation, floors',
      },
      fitRow: {
        style: voRow(false),
        onClick: this.fitVisible,
        label: 'Fit visible',
        hint: '100%, centred',
      },
      presets: [
        {
          key: 'isometric',
          label: 'Isometric',
          onClick: () => this.setPreset('isometric'),
        },
        { key: 'plan', label: 'Plan', onClick: () => this.setPreset('plan') },
        {
          key: 'north',
          label: 'North up',
          onClick: () => this.setPreset('north'),
        },
        {
          key: 'elevation',
          label: 'Elevation',
          onClick: () => this.setPreset('elevation'),
        },
      ],
      presetNote:
        'Model +Y faces south; presets use the prototype axes, not a surveyed scale.',
      autoRow: {
        style: voRow(autoRotate, true),
        onClick: this.toggleAuto,
        on: autoRotate,
        toggle: voToggle(autoRotate, true),
        label: 'Auto-spin',
      },
      labelsRow: {
        style: voRow(labelsOn),
        onClick: toggleLabels,
        on: labelsOn,
        toggle: voToggle(labelsOn),
        label: 'Room labels',
      },
      legendRow: {
        style: voRow(!!S.legend),
        onClick: toggleLegend,
        on: !!S.legend,
        toggle: voToggle(!!S.legend),
        label: 'Legend',
      },
      shortcutsRow: {
        style: voRow(!!S.shortcuts),
        onClick: () => this.setShortcuts(!S.shortcuts),
        on: !!S.shortcuts,
        toggle: voToggle(!!S.shortcuts),
        label: 'Single-key shortcuts',
      },
      theme: ['system', 'light', 'dark'].map((t) => ({
        key: t,
        label: t === 'system' ? 'System' : t === 'light' ? 'Light' : 'Dark',
        on: S.theme === t,
        onClick: () => this.setTheme(t),
      })),
      nudge: [
        {
          key: 'rotL',
          icon: 'rotateLeft',
          label: 'Rotate left',
          onClick: () => this.nudge('rotate', -1),
        },
        {
          key: 'rotR',
          icon: 'rotateRight',
          label: 'Rotate right',
          onClick: () => this.nudge('rotate', 1),
        },
        {
          key: 'tiltU',
          icon: 'arrowUp',
          label: 'Tilt up',
          onClick: () => this.nudge('tilt', -1),
        },
        {
          key: 'tiltD',
          icon: 'arrowDown',
          label: 'Tilt down',
          onClick: () => this.nudge('tilt', 1),
        },
        {
          key: 'panL',
          icon: 'arrowLeft',
          label: 'Pan left',
          onClick: () => this.nudge('panX', -1),
        },
        {
          key: 'panR',
          icon: 'arrowRight',
          label: 'Pan right',
          onClick: () => this.nudge('panX', 1),
        },
      ],
      drawerStyle: `max-height:calc(100dvh - ${ctrlBottom + L.topPx + (narrow ? 120 : 80)}px)`,
    };
    const ctrlClusterStyle = `bottom:calc(${ctrlBottom}px + env(safe-area-inset-bottom));right:calc(${clusterRight}px + env(safe-area-inset-right))`;

    // ---- ISOLATION ----
    const isoTotal = this.rooms.length;
    const isoVisCount = isoRooms.length
      ? isoRooms.length
      : isoFloor === 'all'
        ? isoTotal
        : this.rooms.filter((r) => r.floor === isoFloor).length;
    const isoFloorDefs = [
      ['all', 'All'],
      ['basement', 'Basement'],
      ['main', 'Main'],
      ['second', '2nd'],
    ];
    const isoFloors = isoFloorDefs.map(([key, label]) => {
      const on = isoRooms.length === 0 && isoFloor === key;
      return {
        key,
        label,
        on,
        onClick: () => set({ isoFloor: key, isoRooms: [] }),
      };
    });
    const floorOrder = ['second', 'main', 'basement'];
    const isoRoomGroups = floorOrder
      .filter((f) => this.rooms.some((r) => r.floor === f))
      .map((f) => ({
        key: f,
        label: this.floorLabels[f],
        rooms: this.rooms
          .filter((r) => r.floor === f)
          .map((r) => {
            const on = isoRooms.includes(r.id);
            return {
              id: r.id,
              name: r.name,
              on,
              onClick: () =>
                set((s) => {
                  const cur = new Set(s.isoRooms || []);
                  if (cur.has(r.id)) cur.delete(r.id);
                  else cur.add(r.id);
                  return { isoRooms: [...cur], isoFloor: 'all' };
                }),
            };
          }),
      }));
    const isoClear = () => {
      set({ isoFloor: 'all', isoRooms: [] });
      this.notify(`Isolation cleared · showing all ${isoTotal} rooms`);
    };
    const toggleIso = () =>
      set((s) => ({ isoPanel: !s.isoPanel, viewOptsOpen: false }));
    const closeIso = () => set({ isoPanel: false });
    const showIsoPanel = !!S.isoPanel;
    const isoCountLabel = isoActive
      ? `${isoVisCount} of ${isoTotal} rooms shown · lists stay complete`
      : `Showing all ${isoTotal} rooms`;
    const isoWhat = isoRooms.length
      ? isoRooms.length === 1
        ? this.roomById(isoRooms[0])?.short || '1 room'
        : `${isoRooms.length} rooms`
      : isoFloor !== 'all'
        ? this.floorLabels[isoFloor].replace(' Floor', '')
        : '';
    const isoTopLabel = isoActive ? `Isolate · ${isoWhat}` : 'Isolate';
    const isoOn = isoActive || S.isoPanel;

    // ---- announcements ----
    const selectionAnnounce = isOverview
      ? roomDet
        ? `Room ${roomDet.name} selected`
        : `${modeLabel} view`
      : isElectrical
        ? circDet
          ? `Circuit ${circDet.tag} ${circDet.label} selected`
          : panelDet
            ? `${panelDet.name} selected`
            : 'Electrical view, no circuit selected'
        : isLighting
          ? bd
            ? `${bd.room} ${bd.fixture} selected, ${bd.statusLabel}`
            : 'Lighting view, no fixture selected'
          : isNetwork
            ? S.selServer
              ? `Server ${nodeDet.servers.find((s) => s.id === S.selServer)?.name || ''} selected`
              : `${nodeDet.name} selected, ${nodeDet.statusLabel}`
            : isSound
              ? `${zoneDet.name} zone selected`
              : isSecurity
                ? `${camDet.name} selected, recorded ${camDet.statusLabel}`
                : isClimate
                  ? `${sensorDet.name} sensor selected, planned`
                  : `${upDet.kind} selected, ${upDet.statusLabel}`;

    // ---- exports ----
    const exportCurrent = () => {
      if (isElectrical)
        this.exportCsv(
          'circuits',
          ['panel', 'circuit', 'amps', 'type', 'label', 'rooms'],
          this.circuits.filter(matches).map((c) => ({
            panel: B[c.box].name,
            circuit: circuitTag(c.id),
            amps: c.amp,
            type: c.type,
            label: c.label,
            rooms: this.circuitRooms(c.id)
              .map((r) => r.name)
              .join('; '),
          })),
        );
      else if (isLighting)
        this.exportCsv(
          'fixtures',
          [
            'room',
            'fixture',
            'status',
            'watts',
            'lumens',
            'kelvin',
            'base',
            'brand',
            'model',
            'smart',
            'replaced',
            'rated_life_years',
          ],
          filtered.map((b) => ({
            room: b.room,
            fixture: b.fixture,
            status: b.st,
            watts: b.w,
            lumens: b.lm ?? '',
            kelvin: b.k,
            base: b.base,
            brand: b.brand,
            model: b.model,
            smart: b.smart ? 'yes' : 'no',
            replaced: b.replaced,
            rated_life_years: b.life,
          })),
        );
      else if (isNetwork)
        this.exportCsv(
          'nodes',
          [
            'name',
            'role',
            'room',
            'model',
            'backhaul',
            'plug',
            'networks',
            'status',
            'ip',
            'mac',
            'observed_at',
            'location_confidence',
            'location_note',
            'evidence',
          ],
          this.nodes.map((n) => ({
            name: n.name,
            role: n.role,
            room: n.room,
            model: n.model,
            backhaul: n.backhaul,
            plug: n.plug,
            networks: n.nets.map((x) => netName[x]).join('; '),
            status: n.status,
            ip: n.ip,
            mac: n.mac,
            observed_at: n.observedAt,
            location_confidence: n.locationConfidence,
            location_note: n.locationNote,
            evidence: n.evidence,
          })),
        );
      else if (isSecurity)
        this.exportCsv(
          'cameras',
          [
            'name',
            'type',
            'room',
            'floor',
            'resolution',
            'night_vision',
            'microphone',
            'recording',
            'storage',
            'power',
            'recorded_status',
          ],
          camsF.map((c) => ({
            name: c.name,
            type: c.type,
            room: c.room,
            floor: c.floor,
            resolution: c.res,
            night_vision: c.night ? 'yes' : 'no',
            microphone: c.mic ? 'yes' : 'no',
            recording: c.rec,
            storage: c.store,
            power: c.power,
            recorded_status: c.status,
          })),
        );
      else if (isClimate)
        this.exportCsv(
          'sensors',
          ['name', 'mount', 'target', 'status'],
          this.sensors.map((s) => ({
            name: s.name,
            mount: s.mount,
            target: s.target,
            status: s.status,
          })),
        );
      else if (isUpkeep)
        this.exportCsv(
          'upkeep',
          [
            'item',
            'device',
            'part',
            'metric',
            'used',
            'life',
            'last_done',
            'status',
            'note',
          ],
          upFiltered.map((u) => ({
            item: u.kind,
            device: u.device,
            part: u.part,
            metric: u.metric,
            used: u.used,
            life: u.life,
            last_done: u.lastDone,
            status: u.status,
            note: u.note,
          })),
        );
      else if (isSound)
        this.exportCsv(
          'sound-zones',
          ['zone', 'config', 'room', 'power', 'source'],
          this.zones.map((z) => ({
            zone: z.name,
            config: z.config,
            room: z.room,
            power: z.power,
            source: z.source,
          })),
        );
      else
        this.exportCsv(
          'rooms',
          ['room', 'short', 'floor', 'circuits'],
          this.rooms.map((r) => ({
            room: r.name,
            short: r.short,
            floor: this.floorLabels[r.floor],
            circuits: (r.sw || []).map((s) => circuitTag(s.c)).join('; '),
          })),
        );
    };

    return {
      layout: L,
      narrow,
      intro: !!S.intro,
      short: L.short,
      isNarrow: narrow,
      mode: S.mode,
      modeLabel,
      accent,
      light,
      nav,
      listPanelStyle,
      detailPanelStyle,
      headerSub,
      searchPlaceholder,
      searchOpen,
      searchFocus: !!S.searchFocus,
      q,
      onSearch,
      onSearchFocus,
      onSearchWrapBlur,
      onSearchWrapFocus,
      clearSearch,
      cancelSearch,
      onSearchKeyDown,
      searchRef: this.searchRef,
      searchExpanded: !!S.searchFocus,
      searchActiveId:
        S.searchFocus && searchSel >= 0 && searchSel < navItems.length
          ? `search-opt-${searchSel}`
          : undefined,
      hasQ,
      showResults,
      noResults,
      showSuggest,
      searchResults,
      searchCountLabel,
      searchCats,
      searchMore,
      showAllResults,
      searchSuggest,
      searchAnnounce,
      panelsHidden: S.leftHidden && S.rightHidden,
      togglePanels: () =>
        set({
          leftHidden: !(S.leftHidden && S.rightHidden),
          rightHidden: !(S.leftHidden && S.rightHidden),
        }),
      isOverview,
      isElectrical,
      isLighting,
      isNetwork,
      isSound,
      isSecurity,
      isClimate,
      isUpkeep,
      sceneOpt,
      stageRef: this.stageRef,
      onPointerDown: this.onPointerDown,
      onPointerMove: this.onPointerMove,
      onPointerUp: this.onPointerUp,
      onPointerCancel: this.onPointerCancel,
      onLostPointerCapture: this.onLostPointerCapture,
      onContextMenu: this.onContextMenu,
      onStageKeyDown: this.onStageKeyDown,
      explodeIdx,
      explodeLabel,
      explodeBtns,
      toggleLegend,
      zoomIn: () => this.zoomStep(1.15),
      zoomOut: () => this.zoomStep(0.87),
      atMin,
      atMax,
      resetView: this.resetView,
      autoRotate,
      toggleAuto: this.toggleAuto,
      toggleLabels,
      ctrlClusterStyle,
      viewOptsOpen,
      toggleViewOpts,
      closeViewOpts: () => set({ viewOptsOpen: false }),
      viewOpts,
      zoomPct,
      isoPanelStyle,
      legendPanelStyle,
      leftHidden,
      rightHidden,
      toggleLeft,
      toggleRight,
      leftTabStyle: `left:${L.leftPx - 17}px`,
      rightTabStyle: `right:${L.rightPx - 17}px`,
      isoFloors,
      isoRoomGroups,
      isoClear,
      isoActive,
      toggleIso,
      closeIso,
      showIsoPanel,
      isoCountLabel,
      isoTopLabel,
      isoOn,
      themeBtn: {
        onClick: () => this.setTheme(light ? 'dark' : 'light'),
        isLight: light,
        title: light ? 'Switch to dark theme' : 'Switch to light theme',
      },
      helpBtn: {
        onClick: () => set({ helpOpen: true }),
      },
      helpOpen: !!S.helpOpen,
      closeHelp: () => set({ helpOpen: false }),
      shortcutsOn: !!S.shortcuts,
      setShortcuts: this.setShortcuts,
      showPrompt,
      promptStyle,
      promptText,
      showHint,
      hintText,
      dismissHint: this.dismissHint,
      showLegend: S.legend,
      legendTitle,
      legendItems,
      legendNote,
      goLighting,
      overviewStats,
      quickFacts,
      needs,
      alertText,
      alert: {
        title: `${due.length} fixtures need attention`,
        sub: `${this.bulbs.filter((b) => b.st === 'overdue').length} overdue · ${this.bulbs.filter((b) => b.st === 'soon').length} due soon`,
      },
      roomDet,
      typeFilters,
      circGroups,
      ecount,
      hasSel: !!selC,
      noSel: !selC && !panelDet,
      circDet,
      panelDet,
      lsum,
      lfilters,
      lroom,
      lroomOpts,
      lroomLabel,
      setLroom,
      bulbRows,
      lcount,
      noBulb: !sb,
      hasBulb: !!sb,
      bd,
      locate,
      networks: networkRows,
      gateway,
      nodeList,
      nodeDet,
      zoneList,
      zoneDet,
      camFilters,
      camList,
      camOnline,
      camTotal,
      camDet,
      openGrid,
      closeGrid,
      showGrid,
      openExpand,
      closeExpand,
      showCamExpanded,
      bigFeed,
      histTiles,
      timeline,
      expandSub,
      sensorsPlanned,
      sensorList,
      sensorDet,
      climateBannerText,
      climateBanner: {
        title: `${sensorsPlanned} climate sensors planned`,
        sub: 'None connected yet',
      },
      upSummary,
      upTotal,
      upCount,
      ufilters,
      upList,
      upDet,
      upAlertText,
      upAlert: {
        title: `${upDue} replacements due`,
        sub: `${upOverdue} overdue · ${upSoon} due soon`,
      },
      goClimate,
      goUpkeep,
      filterNotice,
      isoNotice,
      selectionAnnounce,
      snapshot: INVENTORY_SNAPSHOT,
      exportCurrent,
      notice: S.notice,
      dismissNotice: this.dismissNotice,
      detailsRef: this.detailsRef,
      listRef: this.listRef,
      glossary,
    };
  }

  /** Follow a related record to its own view. */
  openRelated(r) {
    const goMode = (patch) =>
      this.setState({
        ...patch,
        rightHidden: false,
        ...(this._layout?.narrow
          ? {}
          : { leftHidden: !!this._layout?.onePanel }),
      });
    switch (r.kind) {
      case 'circuit':
        return goMode({
          mode: 'electrical',
          selCirc: r.id,
          selPanel: null,
          etype: 'all',
        });
      case 'bulb':
        return goMode({
          mode: 'lighting',
          bulb: r.id,
          lf: 'all',
          lroom: 'all',
        });
      case 'node':
        return goMode({ mode: 'network', selNode: r.id, selServer: null });
      case 'server': {
        const s = this.servers.find((x) => x.id === r.id);
        return goMode({ mode: 'network', selNode: s?.node, selServer: r.id });
      }
      case 'zone':
        return goMode({ mode: 'sound', selZone: r.id });
      case 'camera':
        return goMode({
          mode: 'security',
          selCam: r.id,
          camFilter: 'all',
          feedGrid: false,
        });
      case 'sensor':
        return goMode({ mode: 'climate', selSensor: r.id });
      case 'upkeep':
        return goMode({ mode: 'upkeep', selUp: r.id, uf: 'all' });
      default:
        return undefined;
    }
  }

  /** A recorded power reference resolved to a circuit link or an explicit unverified state. */
  circuitLink(text, goMode) {
    const ref = resolveCircuitRef(text || '');
    if (!ref.tag) return null;
    return {
      tag: ref.tag,
      verified: !!ref.circuitId,
      label: ref.circuitId
        ? `Open circuit ${ref.tag}`
        : `${ref.tag} is not a documented circuit`,
      onClick: ref.circuitId
        ? () =>
            goMode({
              mode: 'electrical',
              selCirc: ref.circuitId,
              selPanel: null,
              etype: 'all',
            })
        : null,
    };
  }

  circuitLinks(text, goMode) {
    const out = [];
    const re = /\b(MP|BS)·(\d+)\b/g;
    let m;
    while ((m = re.exec(text || ''))) {
      const link = this.circuitLink(m[0], goMode);
      if (link) out.push(link);
    }
    return out;
  }

  abbrNote(text) {
    const hits = Object.keys(glossary).filter((k) =>
      new RegExp(`(^|[^A-Za-z])${k.replace('.', '\\.')}([^A-Za-z]|$)`).test(
        text || '',
      ),
    );
    return hits.map((k) => `${k} = ${glossary[k]}`).join(' · ');
  }
}
