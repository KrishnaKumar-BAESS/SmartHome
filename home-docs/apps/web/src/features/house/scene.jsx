import { createElement } from 'react';
import { worstStatus } from './catalog';
import { MODE_ACCENT, STATUS } from './palette';

const keyActivate = (fn) => (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    e.stopPropagation();
    fn(e);
  }
};

/** Project the preserved floor polygons and system overlays into an SVG scene. */
export function renderScene(house, opt = {}) {
  const S = house.state,
    B = house.bMap(),
    RE = createElement;
  const layer = opt.layer || 'overview';
  const light = opt.light !== false;
  const showRoomLabels = opt.showRoomLabels !== false;
  const L = opt.layout || {
    cx: 480,
    cy: 300,
    fit: 430,
    ms: 1,
    vw: 960,
    vh: 600,
  };
  const ms = L.ms || 1;
  const isoFloor = S.isoFloor || 'all',
    isoRooms = S.isoRooms && S.isoRooms.length ? new Set(S.isoRooms) : null;
  const vis = (r) =>
    isoRooms ? isoRooms.has(r.id) : isoFloor === 'all' || r.floor === isoFloor;
  const roomById = (id) => house.rooms.find((x) => x.id === id);
  const visById = (id) => {
    const r = roomById(id);
    return !!r && vis(r);
  };
  // continuous explode parameter (0=stacked, 1=floors, 2=exploded) drives smooth transitions
  const eT =
    typeof S.explodeT === 'number'
      ? S.explodeT
      : S.explode === 'full'
        ? 2
        : S.explode === 'floors'
          ? 1
          : 0;
  const EXPL = eT <= 1 ? eT * 1.0 : 1.0 + (eT - 1) * 0.9;
  const floorIdx = { basement: 0, main: 1, second: 2 };
  const baseElev = { basement: -0.9, main: 0, second: 1.1 };
  const layoutBase = (f) => baseElev[f] + floorIdx[f] * EXPL;
  // First-load intro: each floor drops into place in turn, basement first.
  // Bounds use the settled layout so the camera fit holds still meanwhile.
  const introT = typeof S.introT === 'number' ? S.introT : 1;
  const introP = (f) => {
    if (introT >= 1) return 1;
    const t = Math.min(1, Math.max(0, (introT - floorIdx[f] * 0.2) / 0.6));
    return 1 - Math.pow(1 - t, 3);
  };
  const drawBase = (f) => layoutBase(f) + (1 - introP(f)) * 3.2;

  let bx0 = 1e9,
    bx1 = -1e9,
    by0 = 1e9,
    by1 = -1e9,
    bz0 = 1e9,
    bz1 = -1e9;
  house.rooms.forEach((r) => {
    if (!vis(r)) return;
    const zb = layoutBase(r.floor),
      zt = zb + r.height;
    r.verts.forEach(([vx, vy]) => {
      if (vx < bx0) bx0 = vx;
      if (vx > bx1) bx1 = vx;
      if (vy < by0) by0 = vy;
      if (vy > by1) by1 = vy;
    });
    if (zb < bz0) bz0 = zb;
    if (zt > bz1) bz1 = zt;
  });
  const MC = { x: (bx0 + bx1) / 2, y: (by0 + by1) / 2, z: (bz0 + bz1) / 2 };
  const diag =
    Math.sqrt((bx1 - bx0) ** 2 + (by1 - by0) ** 2 + (bz1 - bz0) ** 2) || 1;
  // Pixel units: the SVG viewBox matches the stage, and the model is fitted
  // to the stage area left free by the panels.
  const scale = (L.fit / diag) * S.zoom;
  const CX = L.cx,
    CY = L.cy;
  const yaw = (S.yaw * Math.PI) / 180,
    pitch = (S.pitch * Math.PI) / 180;
  const cyw = Math.cos(yaw),
    syw = Math.sin(yaw),
    cp = Math.cos(pitch),
    sp = Math.sin(pitch);
  const project = (x, y, z) => {
    x -= MC.x;
    y -= MC.y;
    z -= MC.z;
    const X1 = x * cyw - y * syw,
      Y1 = x * syw + y * cyw,
      Z1 = z;
    const X2 = X1,
      Y2 = Y1 * cp - Z1 * sp,
      Z2 = Y1 * sp + Z1 * cp;
    return {
      sx: X2 * scale + CX + S.panX,
      sy: -Z2 * scale + CY + S.panY,
      depth: Y2,
    };
  };
  const ptStr = (p) => p.sx.toFixed(1) + ',' + p.sy.toFixed(1);
  const polyD = (pts) => 'M' + pts.map(ptStr).join(' L') + ' Z';
  const cen2 = (v) => {
    let cx = 0,
      cy = 0;
    for (const p of v) {
      cx += p[0];
      cy += p[1];
    }
    return [cx / v.length, cy / v.length];
  };
  const darken = (hex, f) => {
    const h = hex.replace('#', '');
    const ch = (i) =>
      Math.min(255, Math.round(parseInt(h.substr(i, 2), 16) * f));
    const r = ch(0),
      g = ch(2),
      b = ch(4);
    return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  };
  // ---- exploded room layout: spread rooms radially in x/y away from each floor's center ----
  const EXPL_XY = eT <= 1 ? 0 : (eT - 1) * 0.34;
  const floorCen = {};
  house.rooms.forEach((r) => {
    if (!vis(r)) return;
    const [cx, cy] = cen2(r.verts);
    const fc =
      floorCen[r.floor] || (floorCen[r.floor] = { sx: 0, sy: 0, n: 0 });
    fc.sx += cx;
    fc.sy += cy;
    fc.n++;
  });
  Object.values(floorCen).forEach((fc) => {
    fc.x = fc.sx / fc.n;
    fc.y = fc.sy / fc.n;
  });
  const roomOff = {};
  house.rooms.forEach((r) => {
    const fc = floorCen[r.floor];
    if (!fc) return;
    const [cx, cy] = cen2(r.verts);
    roomOff[r.id] = { ox: (cx - fc.x) * EXPL_XY, oy: (cy - fc.y) * EXPL_XY };
  });
  const offOf = (rid) => roomOff[rid] || { ox: 0, oy: 0 };
  const projR = (rid, x, y, z) => {
    const o = offOf(rid);
    return project(x + o.ox, y + o.oy, z);
  };
  const roomCeil = (rid) => {
    const r = roomById(rid);
    if (!r || !vis(r)) return null;
    const [rx, ry] = cen2(r.verts);
    return { r, c: projR(rid, rx, ry, drawBase(r.floor) + r.height) };
  };

  const selC = opt.selC || null,
    locate = opt.locate || null;
  const servedSet = selC
    ? new Set(house.circuitRooms(selC.id).map((r) => r.id))
    : null;
  const extraHi = opt.hiRooms ? new Set(opt.hiRooms) : null;
  const hiColor =
    opt.hiColor ||
    (selC
      ? house.typeColor(selC.type)
      : locate
        ? locate.color
        : MODE_ACCENT.overview);
  const isHi = (id) =>
    (servedSet && servedSet.has(id)) ||
    (locate && locate.roomId === id) ||
    (extraHi && extraHi.has(id));
  const hasFocus = !!(servedSet || (locate && locate.roomId) || extraHi);
  // Theme-aware model palette: dark mode keeps de-emphasised rooms legible.
  const floorTop = light
    ? { basement: '#e8edf3', main: '#f0f2f6', second: '#f6f7fa' }
    : { basement: '#2f3744', main: '#363f4d', second: '#3e4756' };
  // A world-fixed key light, so walls turn lighter or darker as the model
  // rotates. Tuned to separate the two visible faces at the home angle.
  const LX = 0.259,
    LY = -0.966;
  const wallLight = (nx, ny) => {
    const len = Math.hypot(nx, ny) || 1;
    const lam = Math.max(0, (nx * LX + ny * LY) / len);
    return light ? 0.79 + 0.18 * lam : 0.6 + 0.3 * lam;
  };
  const baseStroke = light ? '#b3bdc9' : '#566275';
  // Ceiling edges read a step brighter than wall seams, so each room's
  // footprint stays crisp against its own walls.
  const topEdge = light ? '#a6b1be' : '#6c7a90';
  // Context rooms stay legible behind a selection in both themes.
  const dimOp = light ? 0.3 : 0.34;
  const markerRing = light ? '#ffffff' : '#0b0e13';
  const labelFill = light ? '#2a3644' : '#dde4ec';
  const labelFillSel = light ? '#0f1722' : '#ffffff';
  const labelFillDim = light ? '#5b6a78' : '#a6b1bd';
  const labelHalo = light ? 'rgba(255,255,255,0.94)' : 'rgba(12,15,20,0.86)';

  // ---- room volumes ----
  const faces = [];
  house.rooms.forEach((r) => {
    if (!vis(r)) return;
    const zb = drawBase(r.floor),
      zt = zb + r.height,
      n = r.verts.length;
    const sel = isHi(r.id);
    const hov = !sel && !!opt.onRoomClick && S.hoverRoom === r.id;
    const top = floorTop[r.floor];
    // REVERSED transparency: highlighted rooms read SOLID; everything else fades back
    const topFill = sel
      ? house.mix(top, hiColor, light ? 0.38 : 0.5)
      : hov
        ? house.mix(top, hiColor, 0.18)
        : top;
    const topStroke = sel || hov ? hiColor : topEdge;
    const wallBase = sel ? house.mixHex(top, hiColor, 0.32) : top;
    const faceOp =
      (hasFocus ? (sel ? 1 : hov ? 0.55 : dimOp) : 1) * introP(r.floor);
    let area2 = 0;
    for (let i = 0; i < n; i++) {
      const a = r.verts[i],
        b = r.verts[(i + 1) % n];
      area2 += a[0] * b[1] - b[0] * a[1];
    }
    const ccw = area2 > 0;
    for (let i = 0; i < n; i++) {
      const a = r.verts[i],
        b = r.verts[(i + 1) % n];
      const dx = b[0] - a[0],
        dy = b[1] - a[1];
      let nx, ny;
      if (ccw) {
        nx = dy;
        ny = -dx;
      } else {
        nx = -dy;
        ny = dx;
      }
      if (nx * syw + ny * cyw >= 0) continue;
      const p1 = projR(r.id, a[0], a[1], zb),
        p2 = projR(r.id, b[0], b[1], zb),
        p3 = projR(r.id, b[0], b[1], zt),
        p4 = projR(r.id, a[0], a[1], zt);
      faces.push({
        key: `wall-${r.id}-${i}`,
        d: polyD([p1, p2, p3, p4]),
        fill: darken(wallBase, wallLight(nx, ny) + (sel ? 0.08 : 0)),
        stroke: sel || hov ? topStroke : baseStroke,
        sw: 0.6,
        depth: (p1.depth + p2.depth + p3.depth + p4.depth) / 4,
        op: faceOp,
        rid: r.id,
        room: r,
      });
    }
    const tp = r.verts.map((v) => projR(r.id, v[0], v[1], zt));
    faces.push({
      key: `top-${r.id}`,
      d: polyD(tp),
      fill: topFill,
      stroke: topStroke,
      sw: sel ? 1.6 : hov ? 1.3 : 0.9,
      depth: tp.reduce((s, p) => s + p.depth, 0) / tp.length,
      op: faceOp,
      rid: r.id,
      room: r,
      isTop: true,
      pts: tp,
    });
  });
  // ---- aerial perspective: rooms further from the camera recede ----
  // A gentle fade toward the stage tone (light) or a slight dimming (dark),
  // applied to unhighlighted ceilings and walls only.
  {
    const ds = faces.map((f) => f.depth);
    const dMin = Math.min(...ds),
      dMax = Math.max(...ds);
    const span = dMax - dMin || 1;
    const stageTone = light ? '#e4e9ef' : '#0d1016';
    faces.forEach((f) => {
      if (!f.room || isHi(f.rid) || !/^#/.test(f.fill)) return;
      const t = (f.depth - dMin) / span;
      f.fill = house.mixHex(f.fill, stageTone, t * (light ? 0.22 : 0.28));
    });
  }

  // ---- floor plates: a thin slab under each separated floor ----
  // They fade in with separation (absent when stacked) and sort just behind
  // their own floor's rooms so each floor reads as one object.
  const plateT = Math.max(0, Math.min(1, (eT - 0.25) / 0.6));
  const platePts = {};
  if (plateT > 0.01)
    ['basement', 'main', 'second'].forEach((fl) => {
      const rs = house.rooms.filter((r) => r.floor === fl && vis(r));
      if (!rs.length) return;
      let x0 = 1e9,
        y0 = 1e9,
        x1 = -1e9,
        y1 = -1e9;
      rs.forEach((r) => {
        const o = offOf(r.id);
        r.verts.forEach(([x, y]) => {
          x0 = Math.min(x0, x + o.ox);
          y0 = Math.min(y0, y + o.oy);
          x1 = Math.max(x1, x + o.ox);
          y1 = Math.max(y1, y + o.oy);
        });
      });
      const pad = 0.35,
        z = drawBase(fl) - 0.03;
      const pts = [
        project(x0 - pad, y0 - pad, z),
        project(x1 + pad, y0 - pad, z),
        project(x1 + pad, y1 + pad, z),
        project(x0 - pad, y1 + pad, z),
      ];
      platePts[fl] = pts;
      const own = faces.filter((fc) => fc.room && fc.room.floor === fl);
      faces.push({
        key: `plate-${fl}`,
        plate: true,
        d: polyD(pts),
        depth: Math.max(...own.map((fc) => fc.depth)) + 0.01,
        op: plateT * introP(fl),
      });
    });
  faces.sort((a, b) => b.depth - a.depth);

  const els = [];

  // ---- soft ground shadow beneath the footprint, grounding the model ----
  if (bx0 < bx1) {
    const gz = bz0 - 0.06;
    const gPts = [
      project(bx0, by0, gz),
      project(bx1, by0, gz),
      project(bx1, by1, gz),
      project(bx0, by1, gz),
    ];
    els.push(
      RE(
        'defs',
        { key: 'defs' },
        RE(
          'filter',
          {
            id: 'groundShadow',
            x: '-45%',
            y: '-45%',
            width: '190%',
            height: '190%',
          },
          RE('feGaussianBlur', { stdDeviation: light ? 9 : 13 }),
        ),
      ),
    );
    els.push(
      RE('path', {
        key: 'ground',
        d: polyD(gPts),
        fill: light ? 'rgba(35,50,65,0.11)' : 'rgba(0,0,0,0.4)',
        filter: 'url(#groundShadow)',
        style: { pointerEvents: 'none' },
      }),
    );
  }

  // Highlighted rooms emit a soft halo of their accent (skipped mid-drag).
  const glowTops = S.dragging
    ? []
    : faces.filter((f) => f.isTop && isHi(f.rid));
  faces.forEach((f) => {
    if (f.plate) {
      els.push(
        RE('path', {
          key: f.key,
          className: 'plate',
          d: f.d,
          fill: light ? 'rgba(16,24,40,0.04)' : 'rgba(255,255,255,0.03)',
          stroke: light ? 'rgba(16,24,40,0.12)' : 'rgba(255,255,255,0.09)',
          strokeWidth: 1,
          strokeLinejoin: 'round',
          opacity: f.op,
          style: { pointerEvents: 'none' },
        }),
      );
      return;
    }
    const clickable = opt.onRoomClick && f.rid;
    const rProps = clickable
      ? {
          onClick: () => opt.onRoomClick(f.rid),
          // hover preview only for mouse: touch taps must not re-render
          // the scene mid-gesture or the tap's click event is lost
          onPointerEnter: opt.onRoomHover
            ? (e) => {
                if (e.pointerType === 'mouse') opt.onRoomHover(f.rid);
              }
            : undefined,
          onPointerLeave: opt.onRoomHover
            ? (e) => {
                if (e.pointerType === 'mouse') opt.onRoomHover(null);
              }
            : undefined,
          style: { cursor: 'pointer' },
        }
      : {};
    // Only the top face is a keyboard stop so each room is one target.
    const a11y =
      clickable && f.isTop
        ? {
            tabIndex: 0,
            role: 'button',
            'aria-label': `${f.room.name}, ${house.floorLabels[f.room.floor]}`,
            onKeyDown: keyActivate(() => opt.onRoomClick(f.rid)),
            onFocus: () => opt.onRoomHover?.(f.rid),
            onBlur: () => opt.onRoomHover?.(null),
          }
        : {};
    els.push(
      RE(
        'path',
        {
          key: f.key,
          className: 'face',
          d: f.d,
          fill: f.fill,
          stroke: f.stroke,
          strokeWidth: f.sw,
          strokeLinejoin: 'round',
          opacity: f.op,
          ...rProps,
          ...a11y,
        },
        f.isTop ? RE('title', null, f.room.name) : null,
      ),
    );
  });

  if (glowTops.length) {
    els.push(
      RE(
        'defs',
        { key: 'glow-defs' },
        RE(
          'filter',
          {
            id: 'selGlow',
            x: '-60%',
            y: '-60%',
            width: '220%',
            height: '220%',
          },
          RE('feGaussianBlur', { stdDeviation: 10 * ms }),
        ),
      ),
    );
    glowTops.forEach((f) =>
      els.push(
        RE('path', {
          key: `glow-${f.rid}`,
          className: 'sel-glow',
          d: f.d,
          fill: hiColor,
          opacity: (light ? 0.22 : 0.42) * f.op,
          filter: 'url(#selGlow)',
          style: {
            pointerEvents: 'none',
            mixBlendMode: light ? 'normal' : 'screen',
          },
        }),
      ),
    );
  }

  // Markers and labels join once every floor has landed (see styles.css).
  if (introT < 1) return els;

  // Screen boxes that room labels must not cover (panel markers).
  const reserved = [];
  // Name callouts for the selected item, drawn above everything else.
  const callouts = [];
  const floorBoxes = [];
  // Geometry of a callout pill, shared by the label pass and the drawing.
  const calloutBox = (c) => {
    const fs = 11 * ms;
    const text = c.text.length > 30 ? `${c.text.slice(0, 29)}…` : c.text;
    const w = text.length * fs * 0.56 + 30 * ms;
    const h = fs * 2.1;
    let x0 = c.x - w / 2;
    const y0 = c.y - h - 7 * ms;
    // Slide right of any floor label it would cover; the stem still points
    // at the item because it is drawn from the pill's nearest edge.
    floorBoxes.forEach((b) => {
      if (x0 < b.x1 + 6 && x0 + w > b.x0 && y0 < b.y1 && y0 + h > b.y0)
        x0 = b.x1 + 6;
    });
    // Keep the pill inside the stage area left free by the side panels.
    const minX = (L.leftPx || 0) + 8,
      maxX = (L.vw || 960) - (L.rightPx || 0) - 8 - w;
    x0 = Math.max(minX, Math.min(x0, maxX));
    return { fs, text, w, h, x0, y0 };
  };

  // ---- breaker panels (electrical infra) ----
  if (layer === 'overview' || layer === 'electrical') {
    Object.keys(house.panelPos).forEach((bid) => {
      const pp = house.panelPos[bid];
      if (!visById(pp.room)) return;
      const po = offOf(pp.room);
      const p = project(pp.x + po.ox, pp.y + po.oy, drawBase(pp.floor) + 0.55);
      const active = (selC && selC.box === bid) || opt.selPanel === bid;
      const bx = B[bid];
      const w = 28 * ms,
        h = 18 * ms;
      reserved.push({
        x0: p.sx - w / 2 - 2,
        x1: p.sx + w / 2 + 2,
        y0: p.sy - h - 6,
        y1: p.sy - 2,
      });
      const panelCk = opt.onPanelClick
        ? {
            onClick: (e) => {
              e.stopPropagation();
              opt.onPanelClick(bid);
            },
            onPointerDown: (e) => e.stopPropagation(),
            style: { cursor: 'pointer' },
          }
        : {};
      els.push(
        RE(
          'g',
          {
            key: `panel-${bid}`,
            className: 'marker',
            tabIndex: opt.onPanelClick ? 0 : undefined,
            role: opt.onPanelClick ? 'button' : undefined,
            'aria-label': `${bx.name}, breaker panel`,
            onKeyDown: opt.onPanelClick
              ? keyActivate(() => opt.onPanelClick(bid))
              : undefined,
            ...panelCk,
          },
          RE('title', null, `${bx.name} · ${bx.loc}`),
          RE('rect', {
            x: (p.sx - w / 2).toFixed(1),
            y: (p.sy - h - 4).toFixed(1),
            width: w,
            height: h,
            rx: 5,
            fill: active
              ? house.mixHex(MODE_ACCENT.electrical, '#000000', 0.3)
              : light
                ? 'rgba(255,255,255,0.9)'
                : 'rgba(30,36,46,0.92)',
            stroke: active
              ? MODE_ACCENT.electrical
              : light
                ? '#a9b4c1'
                : '#5d6a7d',
            strokeWidth: 1,
          }),
          RE(
            'text',
            {
              x: p.sx.toFixed(1),
              y: (p.sy - 4 - h / 2 + 3.8 * ms).toFixed(1),
              textAnchor: 'middle',
              style: {
                font: `600 ${10.5 * ms}px 'IBM Plex Mono',monospace`,
                fill: active ? '#ffffff' : light ? '#4a5867' : '#c8d1dc',
                pointerEvents: 'none',
              },
            },
            bx.short,
          ),
        ),
      );
    });
  }

  // ---- electrical wiring ----
  if (selC) {
    const pp = house.panelPos[selC.box];
    const pz = drawBase(pp.floor) + 0.45;
    const po = offOf(pp.room);
    const ppx = pp.x + po.ox,
      ppy = pp.y + po.oy;
    const rooms = house.circuitRooms(selC.id).filter((r) => vis(r));
    const glow = {
      filter: `drop-shadow(0 0 2px ${hiColor}) drop-shadow(0 0 5px ${hiColor})`,
    };
    rooms.forEach((r) => {
      const zt = drawBase(r.floor) + r.height + 0.05;
      const o = offOf(r.id);
      const c0 = cen2(r.verts);
      const rx = c0[0] + o.ox,
        ry = c0[1] + o.oy;
      const P0 = project(ppx, ppy, pz),
        A = project(ppx, ppy, zt),
        Bp = project(rx, ppy, zt),
        Cc = project(rx, ry, zt);
      const d = `M${ptStr(P0)} L${ptStr(A)} L${ptStr(Bp)} L${ptStr(Cc)}`;
      els.push(
        RE('path', {
          key: `wire-${r.id}`,
          d,
          fill: 'none',
          stroke: hiColor,
          strokeWidth: 2.4,
          strokeOpacity: 0.5,
          strokeLinejoin: 'round',
          strokeLinecap: 'round',
          style: { ...glow, pointerEvents: 'none' },
        }),
      );
      els.push(
        RE('path', {
          key: `wire-dash-${r.id}`,
          d,
          fill: 'none',
          stroke: hiColor,
          strokeWidth: 1.5,
          strokeDasharray: '5 9',
          strokeLinecap: 'round',
          style: {
            ...glow,
            animation: 'wireFlow 0.85s linear infinite',
            pointerEvents: 'none',
          },
        }),
      );
    });
    rooms.forEach((r) => {
      const zt = drawBase(r.floor) + r.height + 0.05;
      const [rx, ry] = cen2(r.verts);
      const c = projR(r.id, rx, ry, zt);
      els.push(
        RE('circle', {
          key: `wire-glow-${r.id}`,
          cx: c.sx.toFixed(1),
          cy: c.sy.toFixed(1),
          r: 8 * ms,
          fill: hiColor,
          style: {
            animation: 'nodePulse 1.7s ease-in-out infinite',
            pointerEvents: 'none',
          },
        }),
      );
      els.push(
        RE('circle', {
          key: `wire-dot-${r.id}`,
          cx: c.sx.toFixed(1),
          cy: c.sy.toFixed(1),
          r: 3.6 * ms,
          fill: hiColor,
          stroke: markerRing,
          strokeWidth: 1.3,
          style: { pointerEvents: 'none' },
        }),
      );
    });
  }

  // ---- floor labels: placed at the leftmost projected vertex, clear of the list panel ----
  ['second', 'main', 'basement'].forEach((f) => {
    const fRooms = house.rooms.filter((r) => r.floor === f && vis(r));
    if (!fRooms.length) return;
    let minSx = 1e9,
      minSy = 300;
    fRooms.forEach((r) => {
      const zb = drawBase(r.floor),
        zt = zb + r.height,
        o = offOf(r.id);
      r.verts.forEach(([vx, vy]) => {
        const pb = project(vx + o.ox, vy + o.oy, zb),
          pt = project(vx + o.ox, vy + o.oy, zt);
        if (pb.sx < minSx) {
          minSx = pb.sx;
          minSy = pb.sy;
        }
        if (pt.sx < minSx) {
          minSx = pt.sx;
          minSy = pt.sy;
        }
      });
    });
    if (minSx === 1e9) return;
    const roomMinSx = minSx,
      roomMinSy = minSy;
    const plateCorner =
      platePts[f] && plateT > 0.5
        ? platePts[f].reduce((a, b) => (b.sx < a.sx ? b : a))
        : null;
    const fullLabel = house.floorLabels[f];
    const fs = 11 * ms;
    // Inter semibold averages ≈ 0.56em per glyph.
    const widthOf = (t) => t.length * fs * 0.56;
    const minX = Math.max(22, opt.floorLabelMinX || 0);
    // When the full name would be pushed onto the model, use the short
    // architectural level code instead.
    // Phones always use the short codes: the model fills the width there.
    const fits =
      !L.narrow && !L.short && roomMinSx - 18 >= minX + widthOf(fullLabel);
    const visibleLabel = fits
      ? fullLabel
      : { second: 'L2', main: 'L1', basement: 'B1' }[f];
    const label = fullLabel;
    const labelW = widthOf(visibleLabel);
    const lx = Math.max(minX + labelW, roomMinSx - 18),
      ly = roomMinSy;
    // The leader points at the plate's outer corner when it lies clear of the
    // label, otherwise at the floor's nearest room corner.
    if (plateCorner && plateCorner.sx > lx + 16) {
      minSx = plateCorner.sx;
      minSy = plateCorner.sy;
    } else {
      minSx = roomMinSx;
      minSy = roomMinSy;
    }
    const flCk = opt.onFloorClick
      ? {
          onClick: (e) => {
            e.stopPropagation();
            opt.onFloorClick(f);
          },
          onPointerDown: (e) => e.stopPropagation(),
          onKeyDown: keyActivate(() => opt.onFloorClick(f)),
          tabIndex: 0,
          role: 'button',
          'aria-label': `Isolate ${label}`,
          style: { cursor: 'pointer' },
        }
      : {};
    floorBoxes.push({
      x0: lx - labelW - 10,
      x1: lx + 10,
      y0: ly - fs * 1.05,
      y1: ly + fs * 0.7,
    });
    els.push(
      RE(
        'g',
        { key: `floor-${f}`, className: 'marker', ...flCk },
        RE('title', null, `Isolate ${label}`),
        // Hairline leader from the pill to the floor's nearest slab corner.
        RE('line', {
          x1: (lx + 10).toFixed(1),
          y1: (ly - fs * 0.175).toFixed(1),
          x2: minSx.toFixed(1),
          y2: minSy.toFixed(1),
          stroke: light ? 'rgba(16,24,40,0.22)' : 'rgba(255,255,255,0.22)',
          strokeWidth: 1,
          style: { pointerEvents: 'none' },
        }),
        RE('circle', {
          cx: minSx.toFixed(1),
          cy: minSy.toFixed(1),
          r: 2.2,
          fill: light ? 'rgba(16,24,40,0.35)' : 'rgba(255,255,255,0.4)',
          style: { pointerEvents: 'none' },
        }),
        RE('rect', {
          x: (lx - labelW - 10).toFixed(1),
          y: (ly - fs * 1.05).toFixed(1),
          width: (labelW + 20).toFixed(1),
          height: (fs * 1.75).toFixed(1),
          rx: ((fs * 1.75) / 2).toFixed(1),
          fill: light ? 'rgba(255,255,255,0.86)' : 'rgba(22,26,34,0.86)',
          stroke: light ? 'rgba(16,24,40,0.1)' : 'rgba(255,255,255,0.1)',
          strokeWidth: 1,
        }),
        RE(
          'text',
          {
            x: lx.toFixed(1),
            y: (ly - fs * 0.15 + fs * 0.35).toFixed(1),
            textAnchor: 'end',
            style: {
              font: `600 ${fs}px 'Inter',system-ui,'Segoe UI',sans-serif`,
              fill: light ? '#344150' : '#c8d1dc',
              letterSpacing: '-0.005em',
              pointerEvents: 'none',
            },
          },
          visibleLabel,
        ),
      ),
    );
  });

  // helpers for overlay markers
  const pushGlowDot = (key, cx, cy, col, r0, sel) => {
    els.push(
      RE('circle', {
        key: `${key}-glow`,
        cx: cx.toFixed(1),
        cy: cy.toFixed(1),
        r: (r0 + 5) * ms,
        fill: col,
        opacity: sel ? 0.3 : 0.18,
        style: {
          animation: 'nodePulse 1.7s ease-in-out infinite',
          pointerEvents: 'none',
        },
      }),
    );
    els.push(
      RE('circle', {
        key: `${key}-dot`,
        cx: cx.toFixed(1),
        cy: cy.toFixed(1),
        r: r0 * ms,
        fill: col,
        stroke: markerRing,
        strokeWidth: sel ? 2 : 1.3,
        style: { pointerEvents: 'none' },
      }),
    );
  };
  const hit = (key, cx, cy, r, label, onActivate, shape) => {
    const props = {
      key,
      className: 'marker',
      fill: 'transparent',
      tabIndex: 0,
      role: 'button',
      'aria-label': label,
      onClick: (e) => {
        e.stopPropagation();
        onActivate();
      },
      onPointerDown: (e) => e.stopPropagation(),
      onKeyDown: keyActivate(onActivate),
      style: { cursor: 'pointer' },
    };
    const title = RE('title', null, label);
    if (shape === 'rect')
      return RE(
        'rect',
        {
          ...props,
          x: (cx - r).toFixed(1),
          y: (cy - r).toFixed(1),
          width: (r * 2).toFixed(1),
          height: (r * 2).toFixed(1),
          rx: 5,
        },
        title,
      );
    return RE(
      'circle',
      { ...props, cx: cx.toFixed(1), cy: cy.toFixed(1), r: r.toFixed(1) },
      title,
    );
  };
  const countBadge = (key, cx, cy, n, col) => {
    els.push(
      RE('circle', {
        key: `${key}-badge`,
        cx: cx.toFixed(1),
        cy: cy.toFixed(1),
        r: 7 * ms,
        // Darkened so the white count clears AA on every status hue.
        fill: house.mixHex(col, '#000000', 0.35),
        stroke: markerRing,
        strokeWidth: 1.2,
        style: { pointerEvents: 'none' },
      }),
    );
    els.push(
      RE(
        'text',
        {
          key: `${key}-badge-text`,
          x: cx.toFixed(1),
          y: (cy + 3 * ms).toFixed(1),
          textAnchor: 'middle',
          style: {
            font: `600 ${8.5 * ms}px 'Inter',system-ui,sans-serif`,
            fill: '#fff',
            pointerEvents: 'none',
          },
        },
        String(n),
      ),
    );
  };
  // Neighbouring dots are spaced wider than their hit radius so no marker
  // can steal a click from the one beside it.
  const SPACING = 16 * ms,
    HIT = 8 * ms;

  // ---- OVERVIEW: flagged bulbs + mesh nodes ----
  // One tidy row of markers under each room label: flagged fixtures, then
  // devices. Devices with an owner-confirmed position keep that spot.
  if (layer === 'overview') {
    const rows = {};
    const rowOf = (rid) => (rows[rid] = rows[rid] || []);
    house.bulbs
      .filter((b) => b.st !== 'ok')
      .forEach((b) => {
        const rid = house.bulbRoomId(b.room);
        if (rid) rowOf(rid).push({ kind: 'bulb', b });
      });
    const placedNodes = [];
    house.nodes.forEach((n) => {
      const rid = house.nodeRoomId[n.room];
      if (!rid) return;
      if (n.position) placedNodes.push({ n, rid });
      else rowOf(rid).push({ kind: 'node', n });
    });
    const drawNode = (n, cx, cy) => {
      els.push(
        RE('rect', {
          key: `ov-node-${n.id}`,
          x: (cx - 4.5 * ms).toFixed(1),
          y: (cy - 4.5 * ms).toFixed(1),
          width: 9 * ms,
          height: 9 * ms,
          rx: 2.5 * ms,
          fill: n.status === 'warn' ? STATUS.soon : MODE_ACCENT.network,
          stroke: markerRing,
          strokeWidth: 1.2,
          style: { pointerEvents: 'none' },
        }),
      );
      if (opt.onNodeClick)
        els.push(
          hit(
            `ov-node-hit-${n.id}`,
            cx,
            cy,
            HIT,
            `${n.name}, ${n.role}${n.status === 'warn' ? ', recorded weak' : ''}`,
            () => opt.onNodeClick(n.id),
            'rect',
          ),
        );
    };
    Object.keys(rows).forEach((rid) => {
      const arr = rows[rid];
      const base = roomCeil(rid);
      if (!base) return;
      arr.forEach((it, i) => {
        const cx = base.c.sx + (i - (arr.length - 1) / 2) * SPACING,
          cy = base.c.sy + 13 * ms;
        if (it.kind === 'node') return drawNode(it.n, cx, cy);
        const b = it.b;
        pushGlowDot(`ov-bulb-${b.id}`, cx, cy, house.stColor(b.st), 4, false);
        if (opt.onBulbClick)
          els.push(
            hit(
              `ov-bulb-hit-${b.id}`,
              cx,
              cy,
              HIT,
              `${b.room} — ${b.fixture}, ${b.st === 'overdue' ? 'overdue' : 'due soon'}`,
              () => opt.onBulbClick(b.id),
            ),
          );
      });
    });
    placedNodes.forEach(({ n, rid }) => {
      const base = roomCeil(rid);
      if (!base) return;
      const point = projR(
        rid,
        n.position.x,
        n.position.y,
        drawBase(base.r.floor) + n.position.z,
      );
      drawNode(n, point.sx, point.sy);
    });
  }

  // ---- LIGHTING: fixture dots ----
  if (layer === 'lighting') {
    const list = opt.bulbs || house.bulbs;
    const byRoom = {};
    list.forEach((b) => {
      const rid = house.bulbRoomId(b.room);
      if (!rid) return;
      (byRoom[rid] = byRoom[rid] || []).push(b);
    });
    Object.keys(byRoom).forEach((rid) => {
      const arr = byRoom[rid];
      const base = roomCeil(rid);
      if (!base) return;
      arr.forEach((b, i) => {
        const ox = (i - (arr.length - 1) / 2) * SPACING;
        const sel = opt.selBulb === b.id;
        if (sel) return; // selected handled by locate pin
        const bcx = base.c.sx + ox,
          bcy = base.c.sy + 12 * ms;
        pushGlowDot(`bulb-${b.id}`, bcx, bcy, house.stColor(b.st), 4, false);
        if (opt.onBulbClick)
          els.push(
            hit(
              `bulb-hit-${b.id}`,
              bcx,
              bcy,
              HIT,
              `${b.room} — ${b.fixture}, ${house.stLabel(b.st) || 'OK'}`,
              () => opt.onBulbClick(b.id),
            ),
          );
      });
    });
  }

  // ---- NETWORK: mesh links + node markers ----
  if (layer === 'network') {
    const pos = {};
    house.nodes.forEach((n) => {
      const rid = house.nodeRoomId[n.room];
      const base = rid ? roomCeil(rid) : null;
      if (base) {
        const point = n.position
          ? projR(
              rid,
              n.position.x,
              n.position.y,
              drawBase(base.r.floor) + n.position.z,
            )
          : base.c;
        pos[n.id] = { x: point.sx, y: point.sy + (n.position ? 0 : 14 * ms) };
      }
    });
    const gw = house.nodes[0];
    house.nodes.forEach((n) => {
      if (n.id === gw.id || n.uplink !== gw.id) return;
      if (!pos[n.id] || !pos[gw.id]) return;
      const wired = /Wired/i.test(n.backhaul);
      const active = opt.selNode === n.id || opt.selNode === gw.id;
      const col = active ? MODE_ACCENT.network : light ? '#8e9cb0' : '#7d8ba1';
      els.push(
        RE(
          'line',
          {
            key: `link-${n.id}`,
            x1: pos[gw.id].x.toFixed(1),
            y1: pos[gw.id].y.toFixed(1),
            x2: pos[n.id].x.toFixed(1),
            y2: pos[n.id].y.toFixed(1),
            stroke: col,
            strokeWidth: active ? 2 : 1.3,
            strokeOpacity: active ? 0.85 : 0.5,
            strokeDasharray: wired ? '' : '4 5',
            strokeLinecap: 'round',
            style: active
              ? {
                  filter: `drop-shadow(0 0 3px ${MODE_ACCENT.network})`,
                  pointerEvents: 'none',
                }
              : { pointerEvents: 'none' },
          },
          RE('title', null, `${n.name}: ${n.backhaul} (recorded, schematic)`),
        ),
      );
    });
    house.nodes.forEach((n) => {
      const p = pos[n.id];
      if (!p) return;
      const sel = opt.selNode === n.id;
      const isGw = n.id === gw.id;
      const col =
        n.status === 'observed'
          ? isGw
            ? MODE_ACCENT.network
            : '#3a9e93'
          : STATUS.soon;
      const s = (isGw ? 14 : 11) * ms;
      if (sel)
        callouts.push({ x: p.x, y: p.y - s / 2 - 6, text: n.name, color: col });
      els.push(
        RE('rect', {
          key: `node-glow-${n.id}`,
          x: (p.x - s / 2 - 4).toFixed(1),
          y: (p.y - s / 2 - 4).toFixed(1),
          width: s + 8,
          height: s + 8,
          rx: 4,
          fill: col,
          opacity: sel ? 0.32 : 0.16,
          style: {
            animation: 'nodePulse 1.7s ease-in-out infinite',
            pointerEvents: 'none',
          },
        }),
      );
      els.push(
        RE('rect', {
          key: `node-${n.id}`,
          x: (p.x - s / 2).toFixed(1),
          y: (p.y - s / 2).toFixed(1),
          width: s,
          height: s,
          rx: 3,
          fill: col,
          stroke: markerRing,
          strokeWidth: sel ? 2.2 : 1.4,
          transform: isGw
            ? `rotate(45 ${p.x.toFixed(1)} ${p.y.toFixed(1)})`
            : '',
          style: { pointerEvents: 'none' },
        }),
      );
      if (opt.onNodeClick)
        els.push(
          hit(
            `node-hit-${n.id}`,
            p.x,
            p.y,
            s / 2 + 6,
            `${n.name}, ${n.role}${n.status === 'warn' ? ', recorded weak' : ''}`,
            () => opt.onNodeClick(n.id),
            'rect',
          ),
        );
    });
  }

  // ---- SOUND: schematic speaker cluster ----
  if (layer === 'sound' && opt.soundRoom) {
    const base = roomCeil(opt.soundRoom);
    if (base) {
      const cx = base.c.sx,
        cy = base.c.sy + 24 * ms;
      const offs = [
        [-22, -12],
        [0, -16],
        [22, -12],
        [-26, 6],
        [26, 6],
        [-14, 18],
        [14, 18],
      ];
      els.push(
        RE(
          'g',
          {
            key: 'speakers',
            className: 'marker',
            style: { pointerEvents: 'none' },
          },
          RE(
            'title',
            null,
            'Schematic speaker cluster — placement is illustrative',
          ),
          ...offs.map(([ox, oy], i) =>
            RE('rect', {
              key: `spk-${i}`,
              x: (cx + ox * ms - 3.5 * ms).toFixed(1),
              y: (cy + oy * ms - 3.5 * ms).toFixed(1),
              width: 7 * ms,
              height: 7 * ms,
              rx: 1.4,
              fill: MODE_ACCENT.sound,
              stroke: markerRing,
              strokeWidth: 0.8,
            }),
          ),
        ),
      );
    }
  }

  // ---- SECURITY: cameras + illustrative coverage cones ----
  if (layer === 'security') {
    const cams = opt.cameras || house.cameras;
    cams.forEach((cam) => {
      if (!visById(cam.roomId)) return;
      const zb = drawBase(cam.floor),
        zt = zb + 1.0;
      const apex = projR(cam.roomId, cam.pos[0], cam.pos[1], zt);
      const facing = (cam.facing * Math.PI) / 180,
        half = ((cam.fov / 2) * Math.PI) / 180,
        range = cam.range;
      const steps = 16,
        arc = [];
      for (let i = 0; i <= steps; i++) {
        const a = facing - half + 2 * half * (i / steps);
        arc.push(
          projR(
            cam.roomId,
            cam.pos[0] + Math.cos(a) * range,
            cam.pos[1] + Math.sin(a) * range,
            zb,
          ),
        );
      }
      const sel = opt.selCam === cam.id,
        off = cam.status !== 'online';
      const col = off ? STATUS.idle : sel ? '#ff7d68' : MODE_ACCENT.security;
      const room = roomById(cam.roomId);
      const conflict = room && room.floor !== cam.floor;
      const label = `${cam.name}, ${cam.type} camera, recorded ${cam.status}${conflict ? ', floor mapping unverified' : ''}`;
      if (sel)
        callouts.push({
          x: apex.sx,
          y: apex.sy - 8 * ms,
          text: cam.name,
          color: col,
        });
      els.push(
        RE(
          'path',
          {
            key: `cone-${cam.id}`,
            d: polyD([apex, ...arc]),
            fill: house.hexA(col, sel ? 0.26 : 0.07),
            stroke: col,
            strokeWidth: sel ? 1.4 : 0.8,
            strokeOpacity: sel ? 0.9 : 0.28,
            strokeLinejoin: 'round',
            strokeDasharray: off ? '4 4' : '',
            onClick: opt.onCamClick ? () => opt.onCamClick(cam.id) : undefined,
            onPointerDown: opt.onCamClick
              ? (e) => e.stopPropagation()
              : undefined,
            style: { cursor: opt.onCamClick ? 'pointer' : 'default' },
          },
          RE(
            'title',
            null,
            `${cam.name} — illustrative coverage, ignores walls`,
          ),
        ),
      );
      els.push(
        RE('circle', {
          key: `cam-glow-${cam.id}`,
          cx: apex.sx.toFixed(1),
          cy: apex.sy.toFixed(1),
          r: (sel ? 9 : 6) * ms,
          fill: col,
          opacity: sel ? 0.3 : 0.16,
          style: {
            animation: 'nodePulse 1.7s ease-in-out infinite',
            pointerEvents: 'none',
          },
        }),
      );
      els.push(
        RE('rect', {
          key: `cam-${cam.id}`,
          x: (apex.sx - 4 * ms).toFixed(1),
          y: (apex.sy - 4 * ms).toFixed(1),
          width: 8 * ms,
          height: 8 * ms,
          rx: 2,
          fill: col,
          stroke: markerRing,
          strokeWidth: sel ? 1.9 : 1.2,
          style: { pointerEvents: 'none' },
        }),
      );
      if (conflict)
        els.push(
          RE(
            'text',
            {
              key: `cam-conflict-${cam.id}`,
              x: (apex.sx + 8 * ms).toFixed(1),
              y: (apex.sy - 6 * ms).toFixed(1),
              style: {
                font: `700 ${10 * ms}px 'Inter',system-ui,sans-serif`,
                fill: STATUS.soon,
                paintOrder: 'stroke',
                stroke: labelHalo,
                strokeWidth: 2.5,
                pointerEvents: 'none',
              },
            },
            '?',
          ),
        );
      if (opt.onCamClick)
        els.push(
          hit(`cam-hit-${cam.id}`, apex.sx, apex.sy, 11 * ms, label, () =>
            opt.onCamClick(cam.id),
          ),
        );
    });
  }

  // ---- CLIMATE: temp/humidity sensors (planned / disconnected) ----
  if (layer === 'climate') {
    const list = opt.sensors || house.sensors;
    list.forEach((sn) => {
      const base = roomCeil(sn.roomId);
      if (!base) return;
      const sel = opt.selSensor === sn.id;
      const on = sn.status === 'online';
      const col = on ? MODE_ACCENT.climate : STATUS.idle;
      const cx = base.c.sx,
        cy = base.c.sy + 13 * ms;
      if (sel)
        // Above the room name, not between the name and the marker.
        callouts.push({
          x: cx,
          y: base.c.sy - 13 * ms,
          text: `${sn.name} sensor`,
          color: MODE_ACCENT.climate,
        });
      if (sel)
        els.push(
          RE('circle', {
            key: `sensor-glow-${sn.id}`,
            cx: cx.toFixed(1),
            cy: cy.toFixed(1),
            r: 12 * ms,
            fill: col,
            opacity: 0.22,
            style: {
              animation: 'nodePulse 1.7s ease-in-out infinite',
              pointerEvents: 'none',
            },
          }),
        );
      els.push(
        RE('rect', {
          key: `sensor-${sn.id}`,
          x: (cx - 5 * ms).toFixed(1),
          y: (cy - 5 * ms).toFixed(1),
          width: 10 * ms,
          height: 10 * ms,
          fill: house.hexA(col, sel ? 0.4 : 0.16),
          stroke: col,
          strokeWidth: sel ? 2 : 1.2,
          strokeDasharray: on ? '' : '3 2.5',
          transform: `rotate(45 ${cx.toFixed(1)} ${cy.toFixed(1)})`,
          style: { pointerEvents: 'none' },
        }),
      );
      if (opt.onSensorClick)
        els.push(
          hit(
            `sensor-hit-${sn.id}`,
            cx,
            cy,
            14 * ms,
            `${sn.name} sensor, planned, ${sn.mount}`,
            () => opt.onSensorClick(sn.id),
          ),
        );
    });
  }

  // ---- UPKEEP: one marker per room, coloured by its most urgent item ----
  if (layer === 'upkeep') {
    const items = opt.upkeep || house.upkeep;
    const byRoom = {};
    items.forEach((it) => {
      (byRoom[it.roomId] = byRoom[it.roomId] || []).push(it);
    });
    Object.keys(byRoom).forEach((rid) => {
      const base = roomCeil(rid);
      if (!base) return;
      const arr = byRoom[rid];
      const selHere = arr.some((it) => it.id === opt.selUp);
      const others = arr.filter((it) => it.id !== opt.selUp);
      const worst = worstStatus(arr.map((it) => it.status));
      const ucx = base.c.sx,
        ucy = base.c.sy + 12 * ms;
      if (selHere) {
        // The locate pin marks the selected item; a badge keeps the rest of
        // the room's records (and their most urgent status) visible.
        if (others.length) {
          const worstOther = worstStatus(others.map((it) => it.status));
          const bx = ucx + 16 * ms,
            by = ucy;
          countBadge(
            `up-more-${rid}`,
            bx,
            by,
            others.length,
            house.stColor(worstOther),
          );
          if (opt.onUpkeepClick)
            els.push(
              hit(
                `up-more-hit-${rid}`,
                bx,
                by,
                9 * ms,
                `${others.length} more upkeep item${others.length > 1 ? 's' : ''} in ${base.r.name}, most urgent ${house.stLabel(worstOther) || 'OK'}`,
                () => opt.onUpkeepClick(others[0].id),
              ),
            );
        }
        return;
      }
      pushGlowDot(`up-${rid}`, ucx, ucy, house.stColor(worst), 4, false);
      if (arr.length > 1)
        countBadge(
          `up-count-${rid}`,
          ucx + 12 * ms,
          ucy,
          arr.length,
          house.stColor(worst),
        );
      if (opt.onUpkeepClick) {
        const first = arr.find((it) => it.status === worst) || arr[0];
        els.push(
          hit(
            `up-hit-${rid}`,
            ucx,
            ucy,
            HIT + 2 * ms,
            `${arr.length} upkeep item${arr.length > 1 ? 's' : ''} in ${base.r.name}, most urgent ${house.stLabel(worst) || 'OK'}`,
            () => opt.onUpkeepClick(first.id),
          ),
        );
      }
    });
  }

  // ---- locate / selection pin (drawn last) ----
  if (locate && locate.roomId && visById(locate.roomId)) {
    const r = roomById(locate.roomId);
    if (r) {
      const zt = drawBase(r.floor) + r.height;
      const [rx, ry] = cen2(r.verts);
      const foot = projR(locate.roomId, rx, ry, zt),
        head = projR(locate.roomId, rx, ry, zt + 0.95);
      if (locate.label)
        callouts.push({
          x: head.sx,
          y: head.sy - 9 * ms,
          text: locate.label,
          color: locate.color,
        });
      els.push(
        RE(
          'g',
          {
            key: 'locate',
            className: 'marker',
            style: { pointerEvents: 'none' },
          },
          RE(
            'title',
            null,
            locate.label ? `${locate.label} · ${r.name}` : r.name,
          ),
          RE('line', {
            x1: foot.sx.toFixed(1),
            y1: foot.sy.toFixed(1),
            x2: head.sx.toFixed(1),
            y2: head.sy.toFixed(1),
            stroke: locate.color,
            strokeWidth: 1.6,
          }),
          RE('circle', {
            cx: head.sx.toFixed(1),
            cy: head.sy.toFixed(1),
            r: 12 * ms,
            fill: locate.color,
            opacity: 0.22,
            style: { animation: 'nodePulse 1.7s ease-in-out infinite' },
          }),
          RE('circle', {
            cx: head.sx.toFixed(1),
            cy: head.sy.toFixed(1),
            r: 6.5 * ms,
            fill: locate.color,
            stroke: markerRing,
            strokeWidth: 1.8,
          }),
          RE('circle', {
            cx: head.sx.toFixed(1),
            cy: head.sy.toFixed(1),
            r: 2.2 * ms,
            fill: '#fff',
          }),
          RE('circle', {
            cx: foot.sx.toFixed(1),
            cy: foot.sy.toFixed(1),
            r: 2.4 * ms,
            fill: locate.color,
          }),
        ),
      );
    }
  }

  // ---- room labels (drawn over markers so names stay legible) ----
  // Greedy placement: highlighted rooms first, then larger rooms. A label
  // that would collide with one already placed is left out; the hover
  // pill still names that room.
  if (showRoomLabels) {
    const fs = 11 * ms;
    // Room names also stay clear of selection callouts.
    const placed = [
      ...reserved,
      ...callouts.map((c) => {
        const b = calloutBox(c);
        return { x0: b.x0, x1: b.x0 + b.w, y0: b.y0, y1: c.y };
      }),
    ];
    const hiTops = faces
      .filter((f) => f.isTop && isHi(f.rid))
      .map((f) => f.pts);
    const inPoly = (poly, x, y) => {
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i],
          b = poly[j];
        if (
          a.sy > y !== b.sy > y &&
          x < ((b.sx - a.sx) * (y - a.sy)) / (b.sy - a.sy) + a.sx
        )
          inside = !inside;
      }
      return inside;
    };
    const hits = (b) =>
      placed.some(
        (o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0,
      );
    const polyArea = (v) => {
      let a = 0;
      for (let i = 0; i < v.length; i++) {
        const p = v[i],
          q = v[(i + 1) % v.length];
        a += p[0] * q[1] - q[0] * p[1];
      }
      return Math.abs(a) / 2;
    };
    house.rooms
      .filter((r) => vis(r))
      .map((r) => {
        const [rx, ry] = cen2(r.verts);
        const c = projR(r.id, rx, ry, drawBase(r.floor) + r.height);
        const sel = isHi(r.id);
        return { r, c, sel, rank: (sel ? 1e6 : 0) + polyArea(r.verts) };
      })
      .sort((a, b) => b.rank - a.rank)
      .forEach(({ r, c, sel }) => {
        const w = r.short.length * fs * 0.55 + 6;
        const box = {
          x0: c.sx - w / 2,
          x1: c.sx + w / 2,
          y0: c.sy - fs * 0.95,
          y1: c.sy + fs * 0.3,
        };
        if (!sel && hits(box)) return;
        // Another floor's name must not sit on top of a highlighted room.
        if (
          !sel &&
          hiTops.some((poly) =>
            [
              [box.x0, box.y0],
              [box.x1, box.y0],
              [box.x0, box.y1],
              [box.x1, box.y1],
              [(box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2],
            ].some(([x, y]) => inPoly(poly, x, y)),
          )
        )
          return;
        placed.push(box);
        els.push(
          RE(
            'text',
            {
              key: `label-${r.id}`,
              x: c.sx.toFixed(1),
              y: c.sy.toFixed(1),
              textAnchor: 'middle',
              style: {
                font: `${sel ? 600 : 500} ${fs}px 'Inter',system-ui,'Segoe UI',sans-serif`,
                letterSpacing: '-0.01em',
                fill: sel ? labelFillSel : hasFocus ? labelFillDim : labelFill,
                paintOrder: 'stroke',
                stroke: labelHalo,
                strokeWidth: sel ? 4 : 3.4,
                strokeLinejoin: 'round',
                // Dimmed by colour, not opacity, so it still clears AA.
                pointerEvents: 'none',
              },
            },
            r.short,
          ),
        );
      });
  }

  // ---- selection callouts: a named pill above the selected item ----
  callouts.forEach((c, i) => {
    const { fs, text, w, h, x0, y0 } = calloutBox(c);
    const stemX = Math.min(Math.max(c.x, x0 + h / 2), x0 + w - h / 2);
    els.push(
      RE(
        'g',
        {
          key: `callout-${i}`,
          className: 'callout-pin',
          style: { pointerEvents: 'none' },
        },
        RE('path', {
          d: `M${(stemX - 5 * ms).toFixed(1)},${(y0 + h - 0.5).toFixed(1)} L${c.x.toFixed(1)},${(c.y - 1).toFixed(1)} L${(stemX + 5 * ms).toFixed(1)},${(y0 + h - 0.5).toFixed(1)} Z`,
          fill: light ? '#ffffff' : '#1c212b',
        }),
        RE('rect', {
          x: x0.toFixed(1),
          y: y0.toFixed(1),
          width: w.toFixed(1),
          height: h.toFixed(1),
          rx: (h / 2).toFixed(1),
          fill: light ? '#ffffff' : '#1c212b',
          stroke: light ? 'rgba(16,24,40,0.12)' : 'rgba(255,255,255,0.12)',
          strokeWidth: 1,
          style: {
            filter: light
              ? 'drop-shadow(0 4px 10px rgba(16,24,40,0.16))'
              : 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
          },
        }),
        RE(
          'text',
          {
            x: (x0 + 22 * ms).toFixed(1),
            y: (y0 + h / 2 + fs * 0.36).toFixed(1),
            style: {
              font: `600 ${fs}px 'Inter',system-ui,'Segoe UI',sans-serif`,
              letterSpacing: '-0.01em',
              fill: light ? '#0f1722' : '#eef2f7',
            },
          },
          text,
        ),
        RE('circle', {
          cx: (x0 + 13 * ms).toFixed(1),
          cy: (y0 + h / 2).toFixed(1),
          r: 3.5 * ms,
          fill: c.color,
        }),
      ),
    );
  });

  // ---- hovered / focused room name preview ----
  if (S.hoverRoom && opt.onRoomClick) {
    const base = roomCeil(S.hoverRoom);
    if (base) {
      const name = base.r.name;
      const fs = 12 * ms;
      const w = name.length * fs * 0.56 + 24;
      const x = base.c.sx,
        y = base.c.sy - 26 * ms;
      els.push(
        RE(
          'g',
          {
            key: 'hover-label',
            className: 'marker',
            style: { pointerEvents: 'none' },
          },
          RE('rect', {
            x: (x - w / 2).toFixed(1),
            y: (y - fs * 0.95).toFixed(1),
            width: w.toFixed(1),
            height: (fs * 1.6).toFixed(1),
            rx: ((fs * 1.6) / 2).toFixed(1),
            fill: light ? 'rgba(255,255,255,0.96)' : 'rgba(24,28,37,0.96)',
            stroke: light ? 'rgba(16,24,40,0.12)' : 'rgba(255,255,255,0.12)',
            strokeWidth: 1,
          }),
          RE(
            'text',
            {
              x: x.toFixed(1),
              y: (y + fs * 0.25).toFixed(1),
              textAnchor: 'middle',
              style: {
                font: `600 ${fs}px 'Inter',system-ui,'Segoe UI',sans-serif`,
                fill: light ? '#0f1722' : '#eef2f7',
              },
            },
            name,
          ),
        ),
      );
    }
  }
  return els;
}
