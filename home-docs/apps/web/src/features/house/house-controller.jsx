import { Component } from 'react';
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
import { renderScene } from './scene';
import { HouseView } from './house-view';

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
  state = {
    mode: 'overview',
    etype: 'all',
    selCirc: null,
    lf: 'all',
    lroom: 'all',
    bulb: null,
    selNode: 'n1',
    selZone: 'zoneA',
    selCam: 'c1',
    camFilter: 'all',
    feedGrid: false,
    selSensor: 'ts1',
    selUp: 'u1',
    yaw: 35,
    pitch: 58,
    zoom: 1,
    panX: 0,
    panY: 0,
    explode: 'full',
    explodeT: 2,
    legend: false,
    autoRotate: false,
    isoFloor: 'all',
    isoRooms: [],
    isoPanel: false,
    leftHidden: false,
    rightHidden: false,
    camExpanded: false,
    histIdx: 0,
    q: '',
    searchFocus: false,
    vw: typeof window === 'undefined' ? 1280 : window.innerWidth,
    showRoomLabels: true,
    sliderFocused: false,
    viewOptsOpen: false,
  };

  SOUND = '#7b5cd6';

  stColor(s) {
    return s === 'ok'
      ? '#5a9c6e'
      : s === 'soon'
        ? '#c0892f'
        : s === 'overdue'
          ? '#c0573b'
          : s === 'warn'
            ? '#c0892f'
            : '#8a94a0';
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
    return t === 'Lighting'
      ? '#e0a043'
      : t === 'Outlets'
        ? '#3b6fb0'
        : t === 'Appliance'
          ? '#c0573b'
          : '#3f9a8c';
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

  drag = null;

  onPointerDown = (e) => {
    const pan = e.shiftKey || e.button === 1 || e.button === 2;
    const r = e.currentTarget.getBoundingClientRect();
    this.drag = {
      active: true,
      mode: pan ? 'pan' : 'rotate',
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      k: Math.max(960 / r.width, 600 / r.height),
      captured: false,
    };
  };

  onPointerMove = (e) => {
    const d = this.drag;
    if (!d || !d.active) return;
    const dx = e.clientX - d.x,
      dy = e.clientY - d.y;
    d.x = e.clientX;
    d.y = e.clientY;
    if (!d.captured) {
      const tdx = e.clientX - d.startX,
        tdy = e.clientY - d.startY;
      if (tdx * tdx + tdy * tdy < 25) return;
      d.captured = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {
        /* Capture may already be released by the browser. */
      }
    }
    if (d.mode === 'rotate') {
      this.setState((s) => ({
        yaw: s.yaw + dx * 0.55,
        pitch: Math.min(88, Math.max(12, s.pitch + dy * 0.45)),
      }));
    } else {
      this.setState((s) => ({
        panX: s.panX + dx * d.k,
        panY: s.panY + dy * d.k,
      }));
    }
  };

  onPointerUp = (e) => {
    if (this.drag) this.drag.active = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {
      /* Capture may already be released by the browser. */
    }
  };

  onContextMenu = (e) => {
    e.preventDefault();
  };

  onWheelNative = (e) => {
    e.preventDefault();
    this.setState((s) => ({
      zoom: Math.min(4, Math.max(0.4, s.zoom * (e.deltaY < 0 ? 1.12 : 0.89))),
    }));
  };

  stageRef = (element) => {
    if (element === this._stage) return;
    this._stage?.removeEventListener('wheel', this.onWheelNative);
    this._stage = element;
    element?.addEventListener('wheel', this.onWheelNative, { passive: false });
  };

  toggleAuto = () => {
    const on = !this.state.autoRotate;
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
      if (!this.state.autoRotate) {
        this._autoRAF = null;
        return;
      }
      if (!(this.drag && this.drag.active))
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

  bulbRoomId(name) {
    const m = {
      'Home Theater': 'bsmt_home_theater',
      'Wine Cellar': 'bsmt_wine_cellar',
      'Bar Area': 'bsmt_living_north',
      'Living Room': 'bsmt_living_north',
      'Living Area': 'bsmt_living_north',
      'Workout Room': 'bsmt_workout_room',
      Study: 'bsmt_study',
      Bathroom: 'bsmt_bath_and_stairs',
      'Stairs & Storage': 'bsmt_hallway',
      Kitchen: 'kitchen_breakfast_room',
      'Great Room': 'living_room',
      'Entry Foyer': 'foyer',
      Garage: 'garage',
      'Primary Bedroom': 'master_bedroom',
      'Bedroom 2': 'room_above_parlor',
      'Rear Deck': null,
    };
    return Object.prototype.hasOwnProperty.call(m, name) ? m[name] : null;
  }

  spkLayout() {
    return [
      { l: 'FL', x: 18, y: 16, t: 'main' },
      { l: 'C', x: 50, y: 11, t: 'main' },
      { l: 'FR', x: 82, y: 16, t: 'main' },
      { l: 'SL', x: 9, y: 50, t: 'main' },
      { l: 'SR', x: 91, y: 50, t: 'main' },
      { l: 'RL', x: 24, y: 86, t: 'main' },
      { l: 'RR', x: 76, y: 86, t: 'main' },
      { l: 'H', x: 33, y: 30, t: 'height' },
      { l: 'H', x: 67, y: 30, t: 'height' },
      { l: 'H', x: 33, y: 66, t: 'height' },
      { l: 'H', x: 67, y: 66, t: 'height' },
      { l: 'S', x: 38, y: 90, t: 'sub' },
      { l: 'S', x: 62, y: 90, t: 'sub' },
      { l: '', x: 50, y: 54, t: 'seat' },
    ];
  }

  spk(arr) {
    return arr.map((p) => {
      const col =
        p.t === 'sub'
          ? '#c0573b'
          : p.t === 'height'
            ? '#3f9a8c'
            : p.t === 'seat'
              ? '#8a94a0'
              : '#3b6fb0';
      const sz = p.t === 'seat' ? 16 : 13;
      return {
        label: p.t === 'seat' ? '' : p.l,
        style: `position:absolute;left:${p.x}%;top:${p.y}%;transform:translate(-50%,-50%);width:${sz}px;height:${sz}px;border-radius:${p.t === 'seat' ? '50%' : '2px'};background:${p.t === 'seat' ? 'transparent' : col};border:${p.t === 'seat' ? '1.5px solid #8a94a0' : 'none'};display:flex;align-items:center;justify-content:center;font:600 7px 'IBM Plex Mono',monospace;color:#fff;`,
      };
    });
  }

  componentDidMount() {
    this._tick = setInterval(() => {
      if (this.state.mode === 'security') this.forceUpdate();
    }, 1000);
    this._ro = () => {
      const w = window.innerWidth || 1280;
      if (w !== this.state.vw) this.setState({ vw: w });
    };
    window.addEventListener('resize', this._ro);
    this._ro();
  }

  componentWillUnmount() {
    this._stage?.removeEventListener('wheel', this.onWheelNative);
    if (this._tick) clearInterval(this._tick);
    if (this._ro) window.removeEventListener('resize', this._ro);
    if (this._explRAF) cancelAnimationFrame(this._explRAF);
    if (this._autoRAF) cancelAnimationFrame(this._autoRAF);
  }

  animateExplode(target) {
    if (this._explRAF) {
      cancelAnimationFrame(this._explRAF);
      this._explRAF = null;
    }
    const start =
      typeof this.state.explodeT === 'number' ? this.state.explodeT : target;
    if (Math.abs(target - start) < 0.001) {
      this.setState({ explodeT: target });
      return;
    }
    const t0 =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    const dur = 620;
    const ease = (x) =>
      x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; // easeInOutCubic
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = ease(p);
      this.setState({ explodeT: start + (target - start) * e });
      if (p < 1) {
        this._explRAF = requestAnimationFrame(step);
      } else {
        this._explRAF = null;
      }
    };
    this._explRAF = requestAnimationFrame(step);
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
    const tcol = {
      Motion: '#c0892f',
      Person: '#c0573b',
      Vehicle: '#3b6fb0',
      Ring: '#7b5cd6',
      Package: '#3f9a8c',
    };
    const out = [];
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
        color: tcol[t] || '#8a94a0',
        time: `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        day,
        dur: `${Math.floor(4 + rng(i + 7) * 38)}s`,
      });
    }
    return out;
  }

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

  renderVals() {
    const S = this.state,
      B = this.bMap();
    const set = (o) => this.setState(o);
    const tone = this.props.stageTone ?? 'slate';
    const stageGrad =
      tone === 'ink'
        ? 'radial-gradient(125% 120% at 50% 0%,#2a2f36 0%,#1d2126 55%,#15181c 100%)'
        : tone === 'navy'
          ? 'radial-gradient(125% 120% at 50% 0%,#26384c 0%,#1a293a 55%,#132030 100%)'
          : 'radial-gradient(125% 120% at 50% 0%,#33414f 0%,#232e38 55%,#1a232c 100%)';

    // MODES
    const modeDef = [
      ['overview', 'Overview'],
      ['electrical', 'Electrical'],
      ['lighting', 'Lighting'],
      ['network', 'Network'],
      ['sound', 'Sound'],
      ['security', 'Security'],
      ['climate', 'Climate'],
      ['upkeep', 'Upkeep'],
    ];
    const modeAccent = {
      overview: '#3b6fb0',
      electrical: '#3b6fb0',
      lighting: '#e0a043',
      network: '#3f9a8c',
      sound: this.SOUND,
      security: '#c0573b',
      climate: '#3f9a8c',
      upkeep: '#b07b3b',
    };
    const modes = modeDef.map(([key, label]) => ({
      key,
      label,
      onClick: () => set({ mode: key }),
      style:
        `padding:6px 12px;border-radius:7px;cursor:pointer;font:500 11.5px 'IBM Plex Sans';transition:background .15s;white-space:nowrap;` +
        (S.mode === key
          ? `background:${modeAccent[key]};color:#fff;`
          : `background:transparent;color:#aab6c1;`),
    }));
    const isOverview = S.mode === 'overview',
      isElectrical = S.mode === 'electrical',
      isLighting = S.mode === 'lighting',
      isNetwork = S.mode === 'network',
      isSound = S.mode === 'sound',
      isSecurity = S.mode === 'security',
      isClimate = S.mode === 'climate',
      isUpkeep = S.mode === 'upkeep';

    // ===================== NEW SHELL: responsive + nav rail + search =====================
    const narrow = (S.vw || 1280) < 900;

    // --- nav rail (vertical list of the 8 systems) ---
    const nav = {};
    modeDef.forEach(([key]) => {
      const on = S.mode === key,
        ac = modeAccent[key];
      nav[key] = {
        onClick: () => set({ mode: key }),
        style: narrow
          ? `display:flex;align-items:center;gap:7px;padding:7px 12px;border-radius:9px;cursor:pointer;user-select:none;flex-shrink:0;white-space:nowrap;transition:background .15s,color .15s;` +
            (on
              ? `background:${this.hexA(ac, 0.18)};color:${ac};`
              : `background:transparent;color:#7f8d9a;`)
          : `display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 3px;border-radius:11px;cursor:pointer;user-select:none;transition:background .15s,color .15s;` +
            (on
              ? `background:${this.hexA(ac, 0.18)};color:${ac};`
              : `background:transparent;color:#7f8d9a;`),
      };
    });
    const navLabelStyle = narrow
      ? `font:600 12px 'IBM Plex Sans'`
      : `font:600 8.5px 'IBM Plex Mono',monospace;letter-spacing:0.02em`;

    // --- global search across every documented thing ---
    const q = S.q || '';
    const ql = q.trim().toLowerCase();
    const toks = ql.split(/\s+/).filter(Boolean);
    const hay = (...p) => p.filter(Boolean).join(' ').toLowerCase();
    const matchH = (h) => toks.every((t) => h.includes(t));
    const idx = [];
    this.rooms.forEach((r) =>
      idx.push({
        cat: 'Room',
        accent: '#6b7a88',
        label: r.name,
        sub: this.floorLabels[r.floor],
        h: hay(r.name, r.short, this.floorLabels[r.floor], 'room'),
        patch: {
          mode: 'overview',
          isoRooms: [r.id],
          isoFloor: 'all',
          isoPanel: true,
        },
      }),
    );
    this.circuits.forEach((c) => {
      const bx = B[c.box];
      const rms = this.circuitRooms(c.id)
        .map((r) => r.name)
        .join(' ');
      idx.push({
        cat: 'Circuit',
        accent: this.typeColor(c.type),
        label: c.label,
        sub: `${bx.short}·${c.no} · ${c.amp}A · ${c.type}`,
        h: hay(
          c.label,
          bx.short + c.no,
          bx.short + '·' + c.no,
          bx.name,
          c.type,
          rms,
          'breaker circuit fuse',
        ),
        patch: { mode: 'electrical', selCirc: c.id, etype: 'all' },
      });
    });
    this.boxes.forEach((bx) =>
      idx.push({
        cat: 'Panel',
        accent: '#3b6fb0',
        label: bx.name,
        sub: bx.loc,
        h: hay(bx.name, bx.short, bx.loc, 'breaker panel box'),
        patch: { mode: 'electrical', selCirc: null, etype: 'all' },
      }),
    );
    this.bulbs.forEach((b) =>
      idx.push({
        cat: 'Light',
        accent: '#e0a043',
        label: `${b.room} — ${b.fixture}`,
        sub: `${b.brand} ${b.model} · ${this.stLabel(b.st) || 'OK'}`,
        h: hay(
          b.room,
          b.fixture,
          b.brand,
          b.model,
          b.base,
          b.smart ? 'smart' : '',
          this.stLabel(b.st),
          'bulb light lamp',
        ),
        patch: { mode: 'lighting', bulb: b.id, lf: 'all', lroom: 'all' },
      }),
    );
    this.nodes.forEach((n) =>
      idx.push({
        cat: 'Network',
        accent: '#3f9a8c',
        label: n.name,
        sub: `${n.role} · ${n.room}`,
        h: hay(
          n.name,
          n.role,
          n.room,
          n.plug,
          n.backhaul,
          'router wifi network node mesh access point gateway',
        ),
        patch: { mode: 'network', selNode: n.id },
      }),
    );
    this.servers.forEach((s) =>
      idx.push({
        cat: 'Server',
        accent: '#3f9a8c',
        label: s.name,
        sub: `${s.kind} · ${s.room}`,
        h: hay(s.name, s.kind, s.room, 'server compute pi raspberry'),
        patch: { mode: 'network', selNode: s.node },
      }),
    );
    this.cameras.forEach((c) =>
      idx.push({
        cat: 'Camera',
        accent: '#c0573b',
        label: c.name,
        sub: `${c.type} · ${c.room} · ${c.status}`,
        h: hay(c.name, c.type, c.room, c.status, 'camera security cctv feed'),
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
        accent: '#3f9a8c',
        label: `${s.name} sensor`,
        sub: `${s.target} · planned`,
        h: hay(
          s.name,
          s.mount,
          s.target,
          'climate temperature humidity sensor thermostat',
        ),
        patch: { mode: 'climate', selSensor: s.id },
      }),
    );
    this.upkeep.forEach((u) =>
      idx.push({
        cat: 'Upkeep',
        accent: '#b07b3b',
        label: u.kind,
        sub: `${u.device} · ${this.stLabel(u.status) || 'OK'}`,
        h: hay(
          u.kind,
          u.device,
          u.part,
          this.stLabel(u.status),
          'replacement filter lamp salt maintenance consumable',
        ),
        patch: { mode: 'upkeep', selUp: u.id },
      }),
    );
    const allMatches = toks.length ? idx.filter((it) => matchH(it.h)) : [];
    const searchCount = allMatches.length;
    const searchResults = allMatches.slice(0, 16).map((it) => ({
      label: it.label,
      sub: it.sub,
      cat: it.cat,
      swatch: `width:9px;height:9px;border-radius:2px;background:${it.accent};flex-shrink:0`,
      chipStyle: `font:600 8.5px 'IBM Plex Mono',monospace;color:${it.accent};background:${this.hexA(it.accent, 0.12)};border:1px solid ${this.hexA(it.accent, 0.3)};padding:2px 7px;border-radius:5px;flex-shrink:0;letter-spacing:0.04em`,
      onClick: () =>
        set(Object.assign({}, it.patch, { q: '', searchFocus: false })),
    }));
    const onSearch = (e) => set({ q: e.target.value });
    const onSearchFocus = () => set({ searchFocus: true });
    const onSearchBlur = () =>
      setTimeout(() => {
        this.setState({ searchFocus: false });
      }, 170);
    const clearSearch = () => set({ q: '', searchFocus: false });
    const hasQ = ql.length > 0;
    const showResults = S.searchFocus && hasQ;
    const noResults = showResults && searchResults.length === 0;
    const showSuggest = S.searchFocus && !hasQ;
    const searchCountLabel =
      searchCount === 1 ? '1 match' : `${searchCount} matches`;
    const suggestDefs = [
      ['Garage outlets', { mode: 'electrical', selCirc: 'm02', etype: 'all' }],
      ['Mesh Gateway', { mode: 'network', selNode: 'n1' }],
      [
        'Overdue bulbs',
        { mode: 'lighting', lf: 'overdue', bulb: null, lroom: 'all' },
      ],
      ['Projector lamp', { mode: 'upkeep', selUp: 'u1' }],
      ['Front Doorbell', { mode: 'security', selCam: 'c1', feedGrid: false }],
      [
        'Wine Cellar',
        {
          mode: 'overview',
          isoRooms: ['bsmt_wine_cellar'],
          isoFloor: 'all',
          isoPanel: true,
        },
      ],
    ];
    const searchSuggest = suggestDefs.map(([label, patch]) => ({
      label,
      onClick: () =>
        set(Object.assign({}, patch, { q: '', searchFocus: false })),
    }));

    // --- responsive layout style strings (one template, JS-driven layout) ---
    const topbarStyle = `position:absolute;top:0;left:0;right:0;height:56px;z-index:34;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px;padding:0 14px;background:rgba(17,24,31,0.92);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,0.08)`;
    const railStyle = narrow
      ? `position:absolute;top:56px;left:0;right:0;height:52px;z-index:26;display:flex;flex-direction:row;align-items:center;gap:3px;padding:0 8px;overflow-x:auto;overflow-y:hidden;background:rgba(13,19,25,0.94);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,0.06)`
      : `position:absolute;top:56px;left:0;bottom:0;width:76px;z-index:26;display:flex;flex-direction:column;gap:3px;padding:11px 9px;overflow-y:auto;background:rgba(13,19,25,0.92);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-right:1px solid rgba(255,255,255,0.06)`;
    const listPanelStyle =
      (narrow
        ? `position:absolute;left:8px;right:8px;top:118px;height:42vh;z-index:18;display:flex;flex-direction:column;background:rgba(20,27,34,0.97);border:1px solid rgba(255,255,255,0.09);border-radius:12px;box-shadow:0 22px 54px -16px rgba(0,0,0,0.6);color:#e8edf2;overflow:hidden`
        : `position:absolute;left:88px;top:68px;bottom:14px;width:316px;z-index:18;display:flex;flex-direction:column;background:rgba(20,27,34,0.97);border:1px solid rgba(255,255,255,0.09);border-radius:12px;box-shadow:0 22px 54px -16px rgba(0,0,0,0.6);color:#e8edf2;overflow:hidden`) +
      (narrow
        ? (S.leftHidden ? ';transform:translateY(calc(-100% - 120px))' : '') +
          ';transition:transform .28s cubic-bezier(0.4,0,0.2,1)'
        : (S.leftHidden ? ';transform:translateX(-100%)' : '') +
          ';transition:transform .28s cubic-bezier(0.4,0,0.2,1)');
    const detailPanelStyle =
      (narrow
        ? `position:absolute;left:8px;right:8px;bottom:8px;max-height:40vh;z-index:19;display:flex;flex-direction:column;background:rgba(20,27,34,0.97);border:1px solid rgba(255,255,255,0.09);border-radius:12px;box-shadow:0 22px 54px -16px rgba(0,0,0,0.6);color:#e8edf2;overflow:auto`
        : `position:absolute;right:14px;top:68px;bottom:14px;width:340px;z-index:18;display:flex;flex-direction:column;background:rgba(20,27,34,0.97);border:1px solid rgba(255,255,255,0.09);border-radius:12px;box-shadow:0 22px 54px -16px rgba(0,0,0,0.6);color:#e8edf2;overflow:auto`) +
      (narrow
        ? (S.rightHidden ? ';transform:translateY(calc(100% + 20px))' : '') +
          ';transition:transform .28s cubic-bezier(0.4,0,0.2,1)'
        : (S.rightHidden ? ';transform:translateX(calc(100% + 16px))' : '') +
          ';transition:transform .28s cubic-bezier(0.4,0,0.2,1)');
    const idBoxStyle = `display:flex;align-items:center;gap:10px;min-width:0`;
    const idSubStyle = `font:400 9.5px 'IBM Plex Mono',monospace;color:#8a98a6;margin-top:2px;${narrow ? 'display:none' : ''}`;
    const searchWrapStyle = `position:relative;width:100%;max-width:${narrow ? '100%' : '560px'};margin:0 auto;display:flex;align-items:center;gap:9px;height:38px;padding:0 11px;background:${S.searchFocus ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)'};border:1px solid ${S.searchFocus ? 'rgba(140,180,230,0.5)' : 'rgba(255,255,255,0.13)'};border-radius:10px;transition:background .15s,border-color .15s`;
    const searchInputStyle = `flex:1;min-width:0;height:100%;border:none;outline:none;background:transparent;color:#e8edf2;font:500 13px 'IBM Plex Sans'`;
    const searchPlaceholder = narrow
      ? 'Search the house…'
      : 'Search the house — a breaker, room, light, router, camera…';
    const resultsStyle = narrow
      ? `position:absolute;top:50px;left:0;right:0;max-height:58vh;overflow:auto;z-index:42;background:rgba(18,24,30,0.985);border:1px solid rgba(255,255,255,0.09);border-radius:12px;box-shadow:0 26px 60px -14px rgba(0,0,0,0.62);color:#e8edf2;padding:7px`
      : `position:absolute;top:50px;left:0;right:0;max-height:64vh;overflow:auto;z-index:42;background:rgba(18,24,30,0.985);border:1px solid rgba(255,255,255,0.09);border-radius:12px;box-shadow:0 26px 60px -14px rgba(0,0,0,0.62);color:#e8edf2;padding:7px`;
    const controlsWrapStyle = `display:flex;align-items:center;gap:7px;justify-self:end;${narrow ? 'overflow-x:auto;max-width:38vw' : ''}`;

    // ---- shared dashboard data ----
    const due = this.bulbs.filter((b) => b.st !== 'ok');
    const alertText = `${due.length} bulbs need attention — ${this.bulbs.filter((b) => b.st === 'overdue').length} overdue, ${this.bulbs.filter((b) => b.st === 'soon').length} due soon`;
    const overviewStats = [
      {
        label: 'ELECTRICAL',
        stat: String(this.circuits.length),
        sub: 'circuits · 2 panels',
        accent: '#3b6fb0',
        onClick: () => set({ mode: 'electrical' }),
      },
      {
        label: 'LIGHTING',
        stat: String(this.bulbs.length),
        sub: `bulbs · ${due.length} flagged`,
        accent: '#e0a043',
        onClick: () => set({ mode: 'lighting' }),
      },
      {
        label: 'NETWORK',
        stat: String(this.nodes.length),
        sub: 'nodes · 3 nets',
        accent: '#3f9a8c',
        onClick: () => set({ mode: 'network' }),
      },
      {
        label: 'SOUND',
        stat: '2',
        sub: 'surround zones',
        accent: this.SOUND,
        onClick: () => set({ mode: 'sound' }),
      },
      {
        label: 'SECURITY',
        stat: String(this.cameras.length),
        sub: `${this.cameras.filter((c) => c.status === 'online').length} cameras online`,
        accent: '#c0573b',
        onClick: () => set({ mode: 'security' }),
      },
      {
        label: 'UPKEEP',
        stat: String(this.upkeep.filter((u) => u.status !== 'ok').length),
        sub: 'replacements due',
        accent: '#b07b3b',
        onClick: () => set({ mode: 'upkeep' }),
      },
    ];
    const needs = due.map((b) => ({
      room: b.room,
      fixture: b.fixture,
      statusLabel: this.stLabel(b.st),
      color: this.stColor(b.st),
      dotStyle: `width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${this.stColor(b.st)}`,
      onClick: () =>
        set({ mode: 'lighting', bulb: b.id, lf: 'all', lroom: 'all' }),
    }));
    const quickFacts = [
      { label: 'Address', val: '8502 Forrest Street' },
      { label: 'Plat', val: 'Lot 11 · Filing 100-H' },
      { label: 'Model', val: 'April 147' },
      { label: 'Levels', val: 'Second · Main · Basement' },
      { label: 'Breaker panels', val: 'Main + Basement sub' },
      { label: 'Finished basement', val: '~1,940 sq ft' },
    ];

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
      onClick: () => set({ etype: key }),
      style:
        `padding:5px 11px;border-radius:6px;cursor:pointer;font:500 11px 'IBM Plex Sans';` +
        (etype === key
          ? `background:#28323b;color:#fff;`
          : `background:rgba(255,255,255,0.05);color:#aab6c1;border:1px solid rgba(255,255,255,0.12);`),
    }));
    const matches = (c) => etype === 'all' || c.type === etype;
    const circGroups = this.boxes
      .map((bx) => ({
        boxName: bx.name,
        boxShort: bx.short,
        size: bx.size,
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
              onClick: () => set({ selCirc: isSel ? null : c.id }),
              rowStyle:
                `display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:6px;cursor:pointer;margin-bottom:2px;` +
                (isSel ? `background:#28323b;` : `background:transparent;`),
              dotStyle: `width:9px;height:9px;border-radius:2px;flex-shrink:0;background:${this.typeColor(c.type)};${isSel ? 'box-shadow:0 0 0 2px rgba(255,255,255,.25);' : ''}`,
              tagStyle: `font:600 10px 'IBM Plex Mono',monospace;width:42px;flex-shrink:0;color:${isSel ? '#e8edf2' : '#9aa8b4'}`,
              labelStyle: `font:500 11.5px 'IBM Plex Sans';flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${isSel ? '#fff' : '#cfd8e0'}`,
              ampStyle: `font:500 10px 'IBM Plex Mono',monospace;flex-shrink:0;color:${isSel ? '#9aa8b4' : '#8a94a0'}`,
            };
          }),
      }))
      .filter((g) => g.items.length > 0);
    const ecount = this.circuits.filter(matches).length;
    const selC = S.selCirc
      ? this.circuits.find((c) => c.id === S.selCirc)
      : null;
    let circDet = null;
    if (selC) {
      const bx = B[selC.box];
      const rooms = this.circuitRooms(selC.id);
      const floorsHit = [...new Set(rooms.map((r) => r.floor))];
      const order = { second: 0, main: 1, basement: 2 };
      const fl = floorsHit
        .sort((a, b) => order[a] - order[b])
        .map((f) => this.floorLabels[f]);
      const spansText =
        floorsHit.length > 1
          ? `Spans ${floorsHit.length} levels — ${fl.join(' · ')}`
          : `${fl[0]} only`;
      circDet = {
        tag: `${bx.short}·${selC.no}`,
        typeLabel: selC.type,
        typeColor: this.typeColor(selC.type),
        amp: `${selC.amp}A`,
        label: selC.label,
        boxName: bx.name,
        boxLoc: bx.loc,
        spansText,
        loadCount: rooms.length,
        rooms: rooms.map((r) => ({
          name: r.name,
          floorLabel: this.floorLabels[r.floor],
          fdot: `width:6px;height:6px;border-radius:50%;flex-shrink:0;background:${r.floor === 'second' ? '#3b6fb0' : r.floor === 'main' ? '#3f9a8c' : '#b07b3b'}`,
        })),
      };
    }

    // ---- LIGHTING ----
    const lsum = [
      { label: 'TOTAL', val: String(this.bulbs.length), color: '#28323b' },
      {
        label: 'OK',
        val: String(this.bulbs.filter((b) => b.st === 'ok').length),
        color: '#5a9c6e',
      },
      {
        label: 'SOON',
        val: String(this.bulbs.filter((b) => b.st === 'soon').length),
        color: '#c0892f',
      },
      {
        label: 'OVERDUE',
        val: String(this.bulbs.filter((b) => b.st === 'overdue').length),
        color: '#c0573b',
      },
    ];
    const lfDef = [
      ['all', 'All'],
      ['soon', 'Soon'],
      ['overdue', 'Overdue'],
      ['smart', 'Smart'],
    ];
    const lfilters = lfDef.map(([key, label]) => ({
      key,
      label,
      onClick: () => set({ lf: key }),
      style:
        `padding:5px 10px;border-radius:6px;cursor:pointer;font:500 11px 'IBM Plex Sans';` +
        (S.lf === key
          ? `background:#e0a043;color:#fff;`
          : `background:rgba(255,255,255,0.05);color:#aab6c1;border:1px solid rgba(255,255,255,0.12);`),
    }));
    const allRooms = [...new Set(this.bulbs.map((b) => b.room))];
    const lroomOpts = [
      { val: 'all', label: 'All rooms' },
      ...allRooms.map((r) => ({ val: r, label: r })),
    ];
    const setLroom = (e) => set({ lroom: e.target.value, bulb: null });
    let filtered = this.bulbs.filter((b) => {
      if (S.lf === 'smart' && !b.smart) return false;
      if ((S.lf === 'soon' || S.lf === 'overdue') && b.st !== S.lf)
        return false;
      if (S.lroom !== 'all' && b.room !== S.lroom) return false;
      return true;
    });
    const bulbRows = filtered.map((b) => ({
      id: b.id,
      room: b.room,
      fixture: b.fixture,
      replaced: b.replaced,
      spec: `${b.w}W·${b.lm || '—'}lm·${b.k}K`,
      color: this.stColor(b.st),
      kColor: this.kColor(b.k),
      rowStyle:
        `display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:7px;cursor:pointer;margin-bottom:3px;` +
        (S.bulb === b.id
          ? 'background:rgba(255,255,255,0.06);box-shadow:inset 0 0 0 1.5px #e0a043;'
          : 'background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.085);'),
      onClick: () => set({ bulb: b.id }),
    }));
    const lcount = `${filtered.length} of ${this.bulbs.length}`;
    const sb = S.bulb ? this.bulbs.find((b) => b.id === S.bulb) : null;
    let bd = null;
    if (sb) {
      bd = {
        room: sb.room,
        fixture: sb.fixture,
        kColor: this.kColor(sb.k),
        glow: this.hexA(this.kColor(sb.k), 0.7),
        color: this.stColor(sb.st),
        statusFull: `${this.stLabel(sb.st)} · replaced ${sb.replaced} · ~${sb.life} yr life`,
        statusBg:
          sb.st === 'ok'
            ? 'rgba(90,156,110,0.16)'
            : sb.st === 'soon'
              ? 'rgba(192,137,47,0.16)'
              : 'rgba(192,87,59,0.16)',
        statusBd:
          sb.st === 'ok'
            ? 'rgba(90,156,110,0.34)'
            : sb.st === 'soon'
              ? 'rgba(192,137,47,0.34)'
              : 'rgba(192,87,59,0.34)',
        specs: [
          { k: 'Wattage', v: `${sb.w} W` },
          { k: 'Brightness', v: sb.lm ? `${sb.lm} lm` : '—' },
          {
            k: 'Color temp',
            v: `${sb.k}K ${sb.k <= 2700 ? '(warm)' : sb.k <= 3500 ? '(soft)' : sb.k <= 4200 ? '(neutral)' : '(daylight)'}`,
          },
          { k: 'Base / type', v: sb.base },
          { k: 'Brand / model', v: `${sb.brand} ${sb.model}` },
          { k: 'Smart', v: sb.smart ? 'Yes — app controlled' : 'No' },
          { k: 'Last replaced', v: sb.replaced },
        ],
      };
    }
    let locate = null;
    if (sb) {
      const rid = this.bulbRoomId(sb.room);
      const col = this.stColor(sb.st);
      const room = rid ? this.rooms.find((r) => r.id === rid) : null;
      locate = {
        onPlan: !!room,
        color: col,
        roomId: rid,
        floorLabel: room ? this.floorLabels[room.floor] : 'Exterior',
        pinNote: room ? 'pinned in model' : 'not on plan',
      };
    }

    // ---- NETWORK ----
    const netColor = {};
    this.networks.forEach((n) => (netColor[n.id] = n.color));
    const gw = this.nodes[0];
    const gateway = {
      name: gw.name,
      role: gw.role,
      room: gw.room,
      backhaul: gw.backhaul,
      plug: gw.plug,
    };
    const nodeList = this.nodes.map((nd) => {
      const isSel = S.selNode === nd.id;
      return {
        id: nd.id,
        name: nd.name,
        role: nd.role,
        room: nd.room,
        statusColor: this.stColor(nd.status),
        netDots: nd.nets.map((x) => ({ color: netColor[x] })),
        onClick: () => set({ selNode: nd.id }),
        rowStyle:
          `display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:7px;cursor:pointer;margin-bottom:3px;` +
          (isSel
            ? 'background:rgba(255,255,255,0.06);box-shadow:inset 0 0 0 1.5px #3b6fb0;'
            : 'background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.085);'),
      };
    });
    const snd = this.nodes.find((n) => n.id === S.selNode) || gw;
    const sndServers = this.servers.filter((s) => s.node === snd.id);
    const nodeDet = {
      show: true,
      name: snd.name,
      role: snd.role,
      room: snd.room,
      model: snd.model,
      backhaul: snd.backhaul,
      plug: snd.plug,
      statusColor: this.stColor(snd.status),
      netDots: snd.nets.map((x) => ({ color: netColor[x] })),
      hasServers: sndServers.length > 0,
      servers: sndServers.map((s) => ({
        name: s.name,
        kind: s.kind,
        power: `⚡ ${s.power}`,
      })),
    };

    // ---- SOUND ----
    const zoneData = [
      {
        id: 'zoneA',
        name: 'Home Theater',
        roomId: 'bsmt_home_theater',
        room: 'Basement · 262 sq ft · tiered platforms',
        config: '7.2.4',
        power: 'AV rack on BS·4',
        source: 'AV rack · theater mesh node',
        gear: [
          { l: 'AV Processor', d: '[ model ] + amp' },
          { l: 'Projector + screen', d: '4K · 120" screen' },
          { l: 'Front L / C / R', d: '3 × behind screen' },
          { l: 'Surround L / R', d: '2 × in-wall' },
          { l: 'Rear L / R', d: '2 × in-wall' },
          { l: 'Height', d: '4 × in-ceiling' },
          { l: 'Subwoofer', d: '2 × ported' },
        ],
      },
      {
        id: 'zoneB',
        name: 'Great Room',
        roomId: 'living_room',
        room: 'Main floor · vaulted living',
        config: '7.2.4 Atmos',
        power: 'AV on MP·16 · room MP·14',
        source: 'Fed by Pi-5 media servers',
        gear: [
          { l: 'AV Receiver', d: '11-channel · [ model ]' },
          { l: 'Front L / C / R', d: '3 × floorstanding' },
          { l: 'Surround L / R', d: '2 × in-wall' },
          { l: 'Rear L / R', d: '2 × in-wall' },
          { l: 'Height (Atmos)', d: '4 × in-ceiling' },
          { l: 'Subwoofer', d: '2 × sealed' },
        ],
      },
    ];
    const zoneList = zoneData.map((z) => {
      const isSel = S.selZone === z.id;
      return {
        id: z.id,
        name: z.name,
        room: z.room,
        config: z.config,
        power: z.power,
        onClick: () => set({ selZone: z.id }),
        cardStyle:
          `padding:13px 14px;border-radius:8px;cursor:pointer;margin-bottom:9px;` +
          (isSel
            ? 'background:rgba(255,255,255,0.06);box-shadow:inset 0 0 0 1.5px ' +
              this.SOUND +
              ';'
            : 'background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.085);'),
      };
    });
    const sz = zoneData.find((z) => z.id === S.selZone) || zoneData[0];
    const zoneDet = {
      name: sz.name,
      room: sz.room,
      config: sz.config,
      power: sz.power,
      source: sz.source,
      spk: this.spk(this.spkLayout()),
      gear: sz.gear,
    };

    // ---- SECURITY (cameras + live feeds) ----
    const camStatusCol = (s) => (s === 'online' ? '#5a9c6e' : '#8a94a0');
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
      onClick: () => set({ camFilter: key }),
      style:
        `padding:5px 10px;border-radius:6px;cursor:pointer;font:500 11px 'IBM Plex Sans';` +
        (camFilter === key
          ? `background:#c0573b;color:#fff;`
          : `background:rgba(255,255,255,0.05);color:#aab6c1;border:1px solid rgba(255,255,255,0.12);`),
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
      onClick: () => set({ selCam: c.id, feedGrid: false }),
      rowStyle:
        `display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:7px;cursor:pointer;margin-bottom:3px;` +
        (S.selCam === c.id
          ? 'background:rgba(255,255,255,0.06);box-shadow:inset 0 0 0 1.5px #c0573b;'
          : 'background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.085);'),
    }));
    const camOnline = this.cameras.filter((c) => c.status === 'online').length;
    const camTotal = this.cameras.length;
    const now = new Date();
    const feedTime =
      now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }) +
      '  ' +
      now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    const sc = this.cameras.find((c) => c.id === S.selCam) || this.cameras[0];
    const scOnline = sc.status === 'online';
    const camDet = {
      name: sc.name,
      room: sc.room,
      type: sc.type,
      statusColor: camStatusCol(sc.status),
      offline: !scOnline,
      liveColor: scOnline ? '#e5544a' : '#8a94a0',
      liveLabel: scOnline ? 'LIVE' : 'OFFLINE',
      res: sc.res,
      time: feedTime,
      watermark: sc.room.toUpperCase(),
      coverage: `${sc.fov}° · faces ${this.compass(sc.facing)}`,
      specs: [
        { k: 'Resolution', v: sc.res },
        { k: 'Coverage', v: `${sc.fov}° · faces ${this.compass(sc.facing)}` },
        { k: 'Night vision', v: sc.night ? 'Yes — IR' : 'No' },
        { k: 'Microphone', v: sc.mic ? 'Yes' : 'No' },
        { k: 'Recording', v: sc.rec },
        { k: 'Storage', v: sc.store },
        { k: 'Power / port', v: sc.power },
        { k: 'Status', v: scOnline ? 'Online' : 'Offline — check PoE' },
      ],
    };
    const feedTiles = this.cameras.map((c) => {
      const on = c.status === 'online';
      return {
        id: c.id,
        name: c.name,
        sub: `${c.type} · ${c.room}`,
        offline: !on,
        liveColor: on ? '#e5544a' : '#8a94a0',
        liveLabel: on ? 'LIVE' : 'OFFLINE',
        res: c.res,
        time: feedTime,
        watermark: c.room.toUpperCase(),
        onClick: () => set({ selCam: c.id, feedGrid: false }),
        wrapStyle: `cursor:pointer;border-radius:9px;overflow:hidden;border:2px solid ${c.id === S.selCam ? '#c0573b' : 'transparent'}`,
      };
    });
    const openGrid = () => set({ feedGrid: true });
    const closeGrid = () => set({ feedGrid: false });
    const showGrid = !!S.feedGrid;
    const feedGridSub = `${camOnline} of ${camTotal} cameras online · ${feedTime}`;

    // ---- expanded camera + history review ----
    const openExpand = () => set({ camExpanded: true, histIdx: 0 });
    const closeExpand = () => set({ camExpanded: false });
    const showCamExpanded = !!S.camExpanded;
    const camHist = this.camHistoryFor(sc);
    const histSel = S.histIdx || 0;
    const histActive = histSel > 0 ? camHist[histSel - 1] : null;
    const selectHist = (i) => set({ histIdx: i });
    const bigFeed = {
      name: sc.name,
      room: sc.room,
      res: sc.res,
      watermark: sc.room.toUpperCase(),
      liveColor: histSel === 0 ? (scOnline ? '#e5544a' : '#8a94a0') : '#e0b46b',
      liveLabel: histSel === 0 ? (scOnline ? 'LIVE' : 'OFFLINE') : 'REVIEW',
      time: histActive ? `${histActive.day} ${histActive.time}` : feedTime,
      eventLabel: histActive
        ? `${histActive.type} · ${histActive.dur}`
        : scOnline
          ? 'Live view'
          : 'No signal',
      showOffline: !scOnline && histSel === 0,
    };
    const expandSub = `${sc.name} · ${camHist.length} recent events`;
    const histTiles = [
      {
        idx: 0,
        label: 'Live view',
        sub: scOnline ? 'streaming now' : 'offline',
        color: scOnline ? '#e5544a' : '#8a94a0',
        time: scOnline ? 'LIVE' : 'OFF',
        watermark: sc.room.toUpperCase(),
        onClick: () => selectHist(0),
        dotStyle: `position:absolute;top:50%;transform:translate(-50%,-50%);width:${histSel === 0 ? 12 : 9}px;height:${histSel === 0 ? 12 : 9}px;border-radius:50%;background:${scOnline ? '#e5544a' : '#8a94a0'};border:1.5px solid #0b1015;cursor:pointer;left:4%`,
        wrapStyle: `cursor:pointer;border-radius:8px;overflow:hidden;border:2px solid ${histSel === 0 ? '#c0573b' : 'rgba(255,255,255,0.06)'};flex-shrink:0`,
      },
      ...camHist.map((hv, i) => ({
        idx: i + 1,
        label: hv.type,
        sub: `${hv.day} · ${hv.dur}`,
        color: hv.color,
        time: hv.time,
        watermark: sc.room.toUpperCase(),
        onClick: () => selectHist(i + 1),
        dotStyle: `position:absolute;top:50%;transform:translate(-50%,-50%);width:${histSel === i + 1 ? 12 : 9}px;height:${histSel === i + 1 ? 12 : 9}px;border-radius:50%;background:${hv.color};border:1.5px solid #0b1015;cursor:pointer;left:${12 + i * 11}%`,
        wrapStyle: `cursor:pointer;border-radius:8px;overflow:hidden;border:2px solid ${histSel === i + 1 ? '#c0573b' : 'rgba(255,255,255,0.06)'};flex-shrink:0`,
      })),
    ];

    // ---- CLIMATE (temp/humidity sensors — planned) ----
    const sensorsPlanned = this.sensors.filter(
      (s) => s.status !== 'online',
    ).length;
    const sensorList = this.sensors.map((s) => ({
      id: s.id,
      name: s.name,
      mount: s.mount,
      dot: s.status === 'online' ? '#3f9a8c' : '#8a94a0',
      badge: s.status === 'online' ? 'LIVE' : 'PLANNED',
      onClick: () => set({ selSensor: s.id }),
      rowStyle:
        `display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:7px;cursor:pointer;margin-bottom:3px;` +
        (S.selSensor === s.id
          ? 'background:rgba(255,255,255,0.06);box-shadow:inset 0 0 0 1.5px #3f9a8c;'
          : 'background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.085);'),
    }));
    const ssn =
      this.sensors.find((x) => x.id === S.selSensor) || this.sensors[0];
    const ssnRoom = this.rooms.find((r) => r.id === ssn.roomId);
    const sensorDet = {
      name: ssn.name,
      mount: ssn.mount,
      target: ssn.target,
      online: ssn.status === 'online',
      floorLabel: ssnRoom ? this.floorLabels[ssnRoom.floor] : '—',
    };
    const climateBannerText = `${sensorsPlanned} climate sensors mapped · disconnected`;

    // ---- UPKEEP (consumable replacements) ----
    const upPct = (u) =>
      u.metric === 'level'
        ? u.used
        : Math.min(100, Math.round((u.used / u.life) * 100));
    const upDueLabel = (u) =>
      u.metric === 'hours'
        ? `${u.used}/${u.life}h`
        : u.metric === 'months'
          ? `${u.used}/${u.life}mo`
          : `${u.used}%`;
    const upList = this.upkeep.map((u) => ({
      id: u.id,
      kind: u.kind,
      device: u.device,
      statusColor: this.stColor(u.status),
      dueLabel: upDueLabel(u),
      barPct: upPct(u),
      barColor: this.stColor(u.status),
      onClick: () => set({ selUp: u.id }),
      rowStyle:
        `padding:10px 11px;border-radius:7px;cursor:pointer;margin-bottom:4px;` +
        (S.selUp === u.id
          ? 'background:rgba(255,255,255,0.06);box-shadow:inset 0 0 0 1.5px #b07b3b;'
          : 'background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.085);'),
    }));
    const upSummary = [
      {
        label: 'OVERDUE',
        val: String(this.upkeep.filter((u) => u.status === 'overdue').length),
        color: '#c0573b',
      },
      {
        label: 'DUE SOON',
        val: String(this.upkeep.filter((u) => u.status === 'soon').length),
        color: '#c0892f',
      },
      {
        label: 'OK',
        val: String(this.upkeep.filter((u) => u.status === 'ok').length),
        color: '#5a9c6e',
      },
    ];
    const upTotal = this.upkeep.length;
    const su = this.upkeep.find((x) => x.id === S.selUp) || this.upkeep[0];
    const suRoom = this.rooms.find((r) => r.id === su.roomId);
    const upDet = {
      kind: su.kind,
      device: su.device,
      statusColor: this.stColor(su.status),
      statusLabel: this.stLabel(su.status),
      statusBg:
        su.status === 'ok'
          ? 'rgba(90,156,110,0.16)'
          : su.status === 'soon'
            ? 'rgba(192,137,47,0.16)'
            : 'rgba(192,87,59,0.16)',
      statusBd:
        su.status === 'ok'
          ? 'rgba(90,156,110,0.34)'
          : su.status === 'soon'
            ? 'rgba(192,137,47,0.34)'
            : 'rgba(192,87,59,0.34)',
      barPct: upPct(su),
      barColor: this.stColor(su.status),
      metricLabel:
        su.metric === 'level'
          ? 'Salt / pellet level'
          : su.metric === 'hours'
            ? 'Lamp hours used'
            : 'Time in service',
      metricVal:
        su.metric === 'level'
          ? `${su.used}% full`
          : su.metric === 'hours'
            ? `${su.used} of ${su.life} hr`
            : `${su.used} of ${su.life} mo`,
      note: su.note,
      floorLabel: suRoom ? this.floorLabels[suRoom.floor] : '—',
      specs: [
        { k: 'Part / type', v: su.part },
        { k: 'Device', v: su.device },
        { k: 'Last replaced', v: su.lastDone },
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
    };
    const upDue = this.upkeep.filter((u) => u.status !== 'ok').length;
    const upOverdue = this.upkeep.filter((u) => u.status === 'overdue').length;
    const upSoon = this.upkeep.filter((u) => u.status === 'soon').length;
    const upAlertText = `${upDue} replacements due — ${upOverdue} overdue, ${upSoon} due soon`;
    const goClimate = () => set({ mode: 'climate' });
    const goUpkeep = () => set({ mode: 'upkeep' });

    // ---- 3D scene per layer ----
    // reverse map: roomId → bulb display-room name (for lighting room click)
    const ridToLroom = {};
    this.bulbs.forEach((b) => {
      const r = this.bulbRoomId(b.room);
      if (r && !ridToLroom[r]) ridToLroom[r] = b.room;
    });

    // universal room-click — behaviour adapts to whichever mode is active
    const onRoomClick = (rid) => {
      if (isOverview) {
        set((s) => {
          const cur = new Set(s.isoRooms || []);
          if (cur.has(rid)) cur.delete(rid);
          else cur.add(rid);
          return { isoRooms: [...cur], isoFloor: 'all' };
        });
      } else if (isElectrical) {
        const room = this.rooms.find((r) => r.id === rid);
        if (room && room.sw && room.sw.length > 0)
          set({ selCirc: room.sw[0].c });
      } else if (isLighting) {
        const ln = ridToLroom[rid];
        if (ln) set({ lroom: ln, bulb: null });
      } else if (isNetwork) {
        const entry = Object.entries(this.nodeRoomId).find(
          ([, rId]) => rId === rid,
        );
        if (entry) {
          const nd = this.nodes.find((n) => n.room === entry[0]);
          if (nd) set({ selNode: nd.id });
        }
      } else if (isSound) {
        const zone = zoneData.find((z) => z.roomId === rid);
        if (zone) set({ selZone: zone.id });
      } else if (isSecurity) {
        const cam = this.cameras.find((c) => c.roomId === rid);
        if (cam) set({ selCam: cam.id, feedGrid: false });
      } else if (isClimate) {
        const sn = this.sensors.find((s) => s.roomId === rid);
        if (sn) set({ selSensor: sn.id });
      } else if (isUpkeep) {
        const it = this.upkeep.find((u) => u.roomId === rid);
        if (it) set({ selUp: it.id });
      }
    };
    const onFloorClick = (floor) => set({ isoFloor: floor, isoRooms: [] });

    let sceneOpt = {
      layer: S.mode,
      onRoomClick,
      onFloorClick,
      onPanelClick: () => set({ mode: 'electrical', selCirc: null }),
      showRoomLabels: S.showRoomLabels !== false,
    };
    if (isElectrical) {
      sceneOpt.selC = selC;
    }
    if (isLighting) {
      sceneOpt.bulbs = filtered;
      sceneOpt.selBulb = S.bulb;
      sceneOpt.hiColor = '#e0a043';
      sceneOpt.onBulbClick = (id) => set({ bulb: id });
      if (sb && this.bulbRoomId(sb.room))
        sceneOpt.locate = {
          roomId: this.bulbRoomId(sb.room),
          color: this.stColor(sb.st),
        };
    }
    if (isNetwork) {
      sceneOpt.selNode = S.selNode;
      sceneOpt.hiColor = '#3b6fb0';
      sceneOpt.onNodeClick = (id) => set({ selNode: id });
      const rid = this.nodeRoomId[snd.room];
      if (rid) sceneOpt.hiRooms = [rid];
    }
    if (isSound) {
      sceneOpt.hiColor = this.SOUND;
      sceneOpt.hiRooms = zoneData.map((z) => z.roomId);
      sceneOpt.soundRoom = sz.roomId;
      sceneOpt.locate = { roomId: sz.roomId, color: this.SOUND };
    }
    if (isSecurity) {
      sceneOpt.cameras = this.cameras;
      sceneOpt.selCam = S.selCam;
      sceneOpt.hiColor = '#c0573b';
      sceneOpt.onCamClick = (id) => set({ selCam: id, feedGrid: false });
      if (sc && sc.roomId && sc.type === 'Indoor')
        sceneOpt.hiRooms = [sc.roomId];
    }
    if (isClimate) {
      sceneOpt.sensors = this.sensors;
      sceneOpt.selSensor = S.selSensor;
      sceneOpt.hiColor = '#3f9a8c';
      sceneOpt.onSensorClick = (id) => set({ selSensor: id });
      if (ssn && ssn.roomId) sceneOpt.hiRooms = [ssn.roomId];
    }
    if (isUpkeep) {
      sceneOpt.upkeep = this.upkeep;
      sceneOpt.selUp = S.selUp;
      sceneOpt.hiColor = '#b07b3b';
      sceneOpt.onUpkeepClick = (id) => set({ selUp: id });
      if (su && su.roomId) {
        sceneOpt.hiRooms = [su.roomId];
        sceneOpt.locate = { roomId: su.roomId, color: this.stColor(su.status) };
      }
    }
    if (isOverview) {
      sceneOpt.onNodeClick = (id) => set({ mode: 'network', selNode: id });
      sceneOpt.onBulbClick = (id) => set({ mode: 'lighting', bulb: id });
    }
    const svgEls = renderScene(this, sceneOpt);

    // ---- prompt / legend / hint ----
    const showPrompt = (isElectrical && !selC) || (isLighting && !sb);
    const promptText = isElectrical
      ? 'Click a circuit in the list — or click a room in the model'
      : isLighting
        ? 'Click a bulb in the list — or click a room to filter it'
        : '';
    let legendTitle = 'SYSTEMS',
      legendItems = [];
    const sw = (c, sq) =>
      `width:10px;height:10px;border-radius:${sq ? '2px' : '50%'};background:${c};flex-shrink:0`;
    if (isOverview) {
      legendTitle = 'OVERVIEW';
      legendItems = [
        {
          label: 'Breaker panel',
          swatch: `width:14px;height:10px;border-radius:2px;background:#e8edf2;border:1px solid #9aa4ad;flex-shrink:0`,
        },
        { label: 'Flagged bulb', swatch: sw('#c0892f') },
        { label: 'Mesh node', swatch: sw('#3b6fb0', true) },
      ];
    } else if (isElectrical) {
      legendTitle = 'CIRCUIT TYPE';
      legendItems = [
        { label: 'Lighting', swatch: sw('#e0a043', true) },
        { label: 'Outlets', swatch: sw('#3b6fb0', true) },
        { label: 'Appliance', swatch: sw('#c0573b', true) },
        { label: 'Mixed', swatch: sw('#3f9a8c', true) },
      ];
    } else if (isLighting) {
      legendTitle = 'BULB STATUS';
      legendItems = [
        { label: 'OK', swatch: sw('#5a9c6e') },
        { label: 'Due soon', swatch: sw('#c0892f') },
        { label: 'Overdue', swatch: sw('#c0573b') },
      ];
    } else if (isNetwork) {
      legendTitle = 'NETWORKS';
      legendItems = [
        { label: 'Main / Trusted', swatch: sw('#3b6fb0', true) },
        { label: 'IoT', swatch: sw('#3f9a8c', true) },
        { label: 'Guest', swatch: sw('#c0892f', true) },
        { label: '◇ Gateway', swatch: sw('#3b6fb0', true) },
      ];
    } else if (isSound) {
      legendTitle = 'SOUND';
      legendItems = [
        { label: 'Surround zone', swatch: sw(this.SOUND) },
        { label: 'Speaker', swatch: sw(this.SOUND, true) },
      ];
    } else if (isSecurity) {
      legendTitle = 'SECURITY';
      legendItems = [
        { label: 'Camera + coverage', swatch: sw('#c0573b', true) },
        { label: 'Offline camera', swatch: sw('#8a94a0', true) },
      ];
    } else if (isClimate) {
      legendTitle = 'CLIMATE';
      legendItems = [
        {
          label: 'Sensor (planned)',
          swatch: `width:10px;height:10px;background:#8a94a022;border:1px dashed #8a94a0;transform:rotate(45deg);flex-shrink:0`,
        },
        { label: 'Disconnected', swatch: sw('#8a94a0', true) },
      ];
    } else if (isUpkeep) {
      legendTitle = 'REPLACEMENTS';
      legendItems = [
        { label: 'OK', swatch: sw('#5a9c6e') },
        { label: 'Due soon', swatch: sw('#c0892f') },
        { label: 'Overdue', swatch: sw('#c0573b') },
      ];
    }

    // explode as a 3-stop slider
    const explodeOrder = ['stacked', 'floors', 'full'];
    const explodeNames = {
      stacked: 'STACKED',
      floors: 'FLOORS',
      full: 'EXPLODED',
    };
    const explodeIdx = Math.max(0, explodeOrder.indexOf(S.explode));
    const explodeLabel = explodeNames[S.explode] || 'EXPLODED';
    const onExplodeSlide = (e) => {
      const idx = Math.max(0, Math.min(2, +e.target.value));
      set({ explode: explodeOrder[idx] || 'stacked' });
      this.animateExplode(idx);
    };
    const onSliderDown = (e) => {
      e.stopPropagation();
      this.setState({ sliderFocused: true });
    };
    const onSliderUp = () => this.setState({ sliderFocused: false });
    const sliderFocused = !!S.sliderFocused;
    const _db =
      'position:absolute;left:50%;transform:translateX(-50%);border-radius:50%;pointer-events:none;z-index:1;width:5px;height:5px;transition:background .15s';
    const sliderDot2Style = `${_db};top:4px;background:${explodeIdx === 2 ? '#e0a043' : 'rgba(255,255,255,0.22)'}`;
    const sliderDot1Style = `${_db};top:37px;background:${explodeIdx === 1 ? '#e0a043' : 'rgba(255,255,255,0.22)'}`;
    const sliderDot0Style = `${_db};bottom:4px;background:${explodeIdx === 0 ? '#e0a043' : 'rgba(255,255,255,0.22)'}`;
    const sliderPopupStyle =
      'position:absolute;right:38px;top:50%;transform:translateY(-50%);z-index:30;display:flex;flex-direction:column;gap:1px;padding:7px 10px;background:rgba(13,19,26,0.97);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.13);border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.55);animation:floatIn .18s ease both;pointer-events:none;white-space:nowrap';
    const sliderStops = [
      {
        label: 'EXPLODED',
        style: `font:600 8.5px 'IBM Plex Mono',monospace;letter-spacing:0.07em;color:${explodeIdx === 2 ? '#e0a043' : '#5a6877'};padding:2px 0`,
      },
      {
        label: 'FLOORS',
        style: `font:600 8.5px 'IBM Plex Mono',monospace;letter-spacing:0.07em;color:${explodeIdx === 1 ? '#e0a043' : '#5a6877'};padding:2px 0`,
      },
      {
        label: 'STACKED',
        style: `font:600 8.5px 'IBM Plex Mono',monospace;letter-spacing:0.07em;color:${explodeIdx === 0 ? '#e0a043' : '#5a6877'};padding:2px 0`,
      },
    ];
    const leftHidden = !!S.leftHidden;
    const rightHidden = !!S.rightHidden;
    const toggleLeft = () =>
      this.setState((s) => {
        const sh = Math.round((158 * 960) / (s.vw || 1280));
        return {
          leftHidden: !s.leftHidden,
          panX: (s.panX || 0) + (s.leftHidden ? sh : -sh),
        };
      });
    const toggleRight = () =>
      this.setState((s) => {
        const sh = Math.round((170 * 960) / (s.vw || 1280));
        return {
          rightHidden: !s.rightHidden,
          panX: (s.panX || 0) + (s.rightHidden ? -sh : sh),
        };
      });
    const mapRight = narrow ? 8 : rightHidden ? 20 : 370;
    const clusterRight = narrow ? 8 : mapRight + 16;
    const isoPanelStyle = `position:absolute;top:${narrow ? 114 : 64}px;right:${mapRight}px;z-index:30;width:236px;max-width:calc(100% - 16px);max-height:calc(100dvh - ${narrow ? 132 : 84}px);display:flex;flex-direction:column;background:rgba(20,27,34,0.97);border:1px solid rgba(255,255,255,0.09);border-radius:10px;box-shadow:0 22px 54px -16px rgba(0,0,0,0.6);color:#e8edf2;overflow:hidden;animation:floatIn .25s ease both;transition:right .28s cubic-bezier(0.4,0,0.2,1)`;
    const legendPanelStyle = `position:absolute;right:${narrow ? 8 : clusterRight + 185}px;bottom:${narrow ? 68 : 18}px;max-width:calc(100% - 16px);z-index:16;display:flex;flex-direction:column;gap:6px;padding:10px 13px;background:rgba(13,19,26,0.92);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.10);border-radius:9px;animation:floatIn .3s ease both;transition:right .28s cubic-bezier(0.4,0,0.2,1)`;
    const labelsOn = S.showRoomLabels !== false;
    const toggleLabels = () =>
      set((s) => ({ showRoomLabels: !s.showRoomLabels }));
    const resetView = () =>
      set({ yaw: 35, pitch: 58, zoom: 1, panX: 0, panY: 0 });
    const autoRotate = !!S.autoRotate;
    const autoBtnLabel = autoRotate ? 'Spinning' : 'Auto-spin';
    const autoOrbitColor = autoRotate ? '#f0c060' : '#6a7a8a';
    const toggleLegend = () => set((s) => ({ legend: !s.legend }));
    const zoomIn = () => set((s) => ({ zoom: Math.min(4, s.zoom * 1.15) }));
    const zoomOut = () => set((s) => ({ zoom: Math.max(0.4, s.zoom * 0.87) }));
    // view options drawer
    const viewOptsOpen = !!S.viewOptsOpen;
    const toggleViewOpts = () =>
      set((s) => ({ viewOptsOpen: !s.viewOptsOpen }));
    const zoomPct = Math.round(S.zoom * 100) + '%';
    const setExplode0 = () => {
      set({ explode: 'stacked' });
      this.animateExplode(0);
    };
    const setExplode1 = () => {
      set({ explode: 'floors' });
      this.animateExplode(1);
    };
    const setExplode2 = () => {
      set({ explode: 'full' });
      this.animateExplode(2);
    };
    const _exBase =
      "flex:1;text-align:center;padding:5px 4px;border-radius:6px;font:600 9.5px 'IBM Plex Mono',monospace;letter-spacing:0.06em;cursor:pointer;user-select:none;border:1px solid;transition:background .12s,color .12s";
    const explodeBtn0Style = `${_exBase};${explodeIdx === 0 ? 'border-color:rgba(224,160,67,.55);background:rgba(224,160,67,.15);color:#e0a043' : 'border-color:rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:#6e7e8c'}`;
    const explodeBtn1Style = `${_exBase};${explodeIdx === 1 ? 'border-color:rgba(224,160,67,.55);background:rgba(224,160,67,.15);color:#e0a043' : 'border-color:rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:#6e7e8c'}`;
    const explodeBtn2Style = `${_exBase};${explodeIdx === 2 ? 'border-color:rgba(224,160,67,.55);background:rgba(224,160,67,.15);color:#e0a043' : 'border-color:rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:#6e7e8c'}`;
    const _voRow =
      "display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:6px;cursor:pointer;user-select:none;font:400 12px 'IBM Plex Sans',sans-serif";
    const voResetRowStyle = `${_voRow};color:#c4d0db;background:rgba(255,255,255,0.04)`;
    const voAutoRowStyle = `${_voRow};color:${autoRotate ? '#e3b264' : '#c4d0db'};background:${autoRotate ? 'rgba(224,160,67,.10)' : 'rgba(255,255,255,0.04)'}`;
    const voLabelsRowStyle = `${_voRow};color:${labelsOn ? '#9cc0ee' : '#c4d0db'};background:${labelsOn ? 'rgba(59,111,176,.10)' : 'rgba(255,255,255,0.04)'}`;
    const voLegendRowStyle = `${_voRow};color:${S.legend ? '#9cc0ee' : '#c4d0db'};background:${S.legend ? 'rgba(59,111,176,.10)' : 'rgba(255,255,255,0.04)'}`;
    const voIconCellStyle =
      'width:18px;flex-shrink:0;display:flex;align-items:center;justify-content:center;line-height:1';
    const _dot8 = 'width:7px;height:7px;border-radius:50%;flex-shrink:0';
    const voAutoToggleStyle = `${_dot8};background:${autoRotate ? '#e0a043' : 'rgba(255,255,255,0.18)'}`;
    const voLabelsToggleStyle = `${_dot8};background:${labelsOn ? '#6ea0e0' : 'rgba(255,255,255,0.18)'}`;
    const voLegendToggleStyle = `${_dot8};background:${S.legend ? '#6ea0e0' : 'rgba(255,255,255,0.18)'}`;
    const voDrawerStyle =
      'display:flex;flex-direction:column;gap:2px;padding:10px 10px 8px;border-bottom:1px solid rgba(255,255,255,0.07)';
    const voSectionLabelStyle =
      "font:500 8px 'IBM Plex Mono',monospace;color:#5a6877;letter-spacing:0.12em;margin-bottom:4px";
    const voDivStyle =
      'height:1px;background:rgba(255,255,255,0.07);margin:4px 0';
    const zoomBarStyle =
      'display:flex;align-items:center;gap:3px;padding:6px 7px';
    const zoomBtnStyle =
      "width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:7px;cursor:pointer;user-select:none;font:400 19px 'IBM Plex Sans',sans-serif;color:#cdd6df;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10);line-height:1;flex-shrink:0";
    const zoomPctStyle =
      "width:38px;text-align:center;font:600 10px 'IBM Plex Mono',monospace;color:#8a98a6;letter-spacing:0.04em;flex-shrink:0";
    const viewOptsBtnStyle = `width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:7px;cursor:pointer;user-select:none;flex-shrink:0;border:1px solid ${viewOptsOpen ? 'rgba(110,160,224,.5)' : 'rgba(255,255,255,0.10)'};background:${viewOptsOpen ? 'rgba(59,111,176,.18)' : 'rgba(255,255,255,0.06)'};color:${viewOptsOpen ? '#9cc0ee' : '#cdd6df'}`;
    // right controls cluster
    const ctrlClusterStyle = `position:absolute;bottom:18px;right:${clusterRight}px;z-index:22;display:flex;flex-direction:column;align-items:stretch;background:rgba(13,19,26,0.91);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.10);border-radius:13px;box-shadow:0 12px 36px -8px rgba(0,0,0,.62);transition:right .28s cubic-bezier(.4,0,.2,1);overflow:hidden`;

    // ---- ISOLATION (single floor / single room / group of rooms) ----
    const isoFloor = S.isoFloor || 'all';
    const isoRooms = S.isoRooms || [];
    const isoActive = isoFloor !== 'all' || isoRooms.length > 0;
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
        label,
        onClick: () => set({ isoFloor: key, isoRooms: [] }),
        style:
          `flex:1;text-align:center;padding:5px 4px;border-radius:6px;cursor:pointer;font:500 11px 'IBM Plex Sans';white-space:nowrap;` +
          (on
            ? 'background:#3b6fb0;color:#fff;'
            : 'background:rgba(255,255,255,0.05);color:#aab6c1;border:1px solid rgba(255,255,255,0.12);'),
      };
    });
    const floorOrder = ['second', 'main', 'basement'];
    const isoRoomGroups = floorOrder
      .filter((f) => this.rooms.some((r) => r.floor === f))
      .map((f) => ({
        label: this.floorLabels[f],
        rooms: this.rooms
          .filter((r) => r.floor === f)
          .map((r) => {
            const on = isoRooms.includes(r.id);
            return {
              name: r.name,
              onClick: () =>
                set((s) => {
                  const cur = new Set(s.isoRooms || []);
                  if (cur.has(r.id)) cur.delete(r.id);
                  else cur.add(r.id);
                  return { isoRooms: [...cur], isoFloor: 'all' };
                }),
              style:
                `padding:4px 9px;border-radius:13px;cursor:pointer;font:500 10.5px 'IBM Plex Sans';` +
                (on
                  ? 'background:#3b6fb0;color:#fff;border:1px solid #3b6fb0;'
                  : 'background:rgba(255,255,255,0.05);color:#aab6c1;border:1px solid rgba(255,255,255,0.12);'),
            };
          }),
      }));
    const isoClear = () => set({ isoFloor: 'all', isoRooms: [] });
    const toggleIso = () => set((s) => ({ isoPanel: !s.isoPanel }));
    const showIsoPanel = !!S.isoPanel;
    const isoCountLabel = isoActive
      ? `Showing ${isoVisCount} of ${isoTotal} rooms`
      : `Showing all ${isoTotal} rooms`;
    const isoClearLabel = isoActive ? 'Clear' : '';
    const isoTopLabel = isoActive ? `Isolate · ${isoVisCount}` : 'Isolate';
    const isoOn = isoActive || S.isoPanel;
    const isoBtnTopStyle = `pointer-events:auto;padding:7px 12px;border-radius:8px;font:500 11.5px 'IBM Plex Sans';cursor:pointer;user-select:none;border:1px solid ${isoOn ? 'rgba(110,160,224,0.5)' : 'rgba(255,255,255,0.10)'};background:${isoOn ? 'rgba(110,160,224,0.18)' : 'rgba(22,30,38,0.0)'};color:${isoOn ? '#a9c8f0' : '#cdd6df'}`;

    return {
      narrow,
      nav,
      navLabelStyle,
      topbarStyle,
      railStyle,
      listPanelStyle,
      detailPanelStyle,
      idBoxStyle,
      idSubStyle,
      searchWrapStyle,
      searchInputStyle,
      searchPlaceholder,
      controlsWrapStyle,
      q,
      onSearch,
      onSearchFocus,
      onSearchBlur,
      clearSearch,
      hasQ,
      showResults,
      noResults,
      showSuggest,
      searchResults,
      searchCountLabel,
      searchSuggest,
      resultsStyle,
      mode: S.mode,
      isNarrow: narrow,
      panelsHidden: S.leftHidden && S.rightHidden,
      togglePanels: () =>
        set({
          leftHidden: !(S.leftHidden && S.rightHidden),
          rightHidden: !(S.leftHidden && S.rightHidden),
        }),
      stageGrad,
      modes,
      isOverview,
      isElectrical,
      isLighting,
      isNetwork,
      isSound,
      svgEls,
      stageRef: this.stageRef,
      onPointerDown: this.onPointerDown,
      onPointerMove: this.onPointerMove,
      onPointerUp: this.onPointerUp,
      onContextMenu: this.onContextMenu,
      explodeIdx,
      explodeLabel,
      onExplodeSlide,
      onSliderDown,
      onSliderUp,
      sliderFocused,
      sliderDot0Style,
      sliderDot1Style,
      sliderDot2Style,
      sliderPopupStyle,
      sliderStops,
      toggleLegend,
      zoomIn,
      zoomOut,
      resetView,
      autoRotate,
      toggleAuto: this.toggleAuto,
      autoBtnLabel,
      autoOrbitColor,
      toggleLabels,
      ctrlClusterStyle,
      viewOptsOpen,
      toggleViewOpts,
      zoomPct,
      setExplode0,
      setExplode1,
      setExplode2,
      explodeBtn0Style,
      explodeBtn1Style,
      explodeBtn2Style,
      voDrawerStyle,
      voSectionLabelStyle,
      voDivStyle,
      voResetRowStyle,
      voAutoRowStyle,
      voLabelsRowStyle,
      voLegendRowStyle,
      voIconCellStyle,
      voAutoToggleStyle,
      voLabelsToggleStyle,
      voLegendToggleStyle,
      zoomBarStyle,
      zoomBtnStyle,
      zoomPctStyle,
      viewOptsBtnStyle,
      isoPanelStyle,
      legendPanelStyle,
      leftHidden,
      rightHidden,
      toggleLeft,
      toggleRight,
      leftTabStyle: narrow
        ? 'display:none'
        : `position:absolute;top:50%;margin-top:-24px;z-index:20;cursor:pointer;left:${S.leftHidden ? 88 : 403}px;transition:left .28s cubic-bezier(0.4,0,0.2,1);width:14px;height:48px;background:rgba(20,27,34,0.97);border:1px solid rgba(255,255,255,0.09);border-left:none;border-radius:0 6px 6px 0;display:flex;align-items:center;justify-content:center;color:#6a7a88;font-size:10px`,
      rightTabStyle: narrow
        ? 'display:none'
        : `position:absolute;top:50%;margin-top:-24px;z-index:20;cursor:pointer;right:${S.rightHidden ? 13 : 353}px;transition:right .28s cubic-bezier(0.4,0,0.2,1);width:14px;height:48px;background:rgba(20,27,34,0.97);border:1px solid rgba(255,255,255,0.09);border-right:none;border-radius:6px 0 0 6px;display:flex;align-items:center;justify-content:center;color:#6a7a88;font-size:10px`,
      leftTabChevron: S.leftHidden ? '›' : '‹',
      rightTabChevron: S.rightHidden ? '‹' : '›',
      isoFloors,
      isoRoomGroups,
      isoClear,
      toggleIso,
      showIsoPanel,
      isoCountLabel,
      isoClearLabel,
      isoTopLabel,
      isoBtnTopStyle,
      showPrompt,
      promptText,
      showLegend: S.legend,
      legendTitle,
      legendItems,
      goLighting: () => set({ mode: 'lighting' }),
      overviewStats,
      quickFacts,
      needs,
      alertText,
      typeFilters,
      circGroups,
      ecount,
      hasSel: !!selC,
      noSel: !selC,
      circDet,
      lsum,
      lfilters,
      lroom: S.lroom,
      lroomOpts,
      setLroom,
      bulbRows,
      lcount,
      noBulb: !sb,
      hasBulb: !!sb,
      bd,
      locate,
      networks: this.networks,
      gateway,
      nodeList,
      nodeDet,
      zoneList,
      zoneDet,
      isSecurity,
      isClimate,
      isUpkeep,
      camFilters,
      camList,
      camOnline,
      camTotal,
      camDet,
      feedTiles,
      openGrid,
      closeGrid,
      showGrid,
      feedGridSub,
      openExpand,
      closeExpand,
      showCamExpanded,
      bigFeed,
      histTiles,
      expandSub,
      sensorsPlanned,
      sensorList,
      sensorDet,
      climateBannerText,
      upSummary,
      upTotal,
      upList,
      upDet,
      upAlertText,
      goClimate,
      goUpkeep,
    };
  }

  render() {
    return <HouseView view={this.renderVals()} />;
  }
}
