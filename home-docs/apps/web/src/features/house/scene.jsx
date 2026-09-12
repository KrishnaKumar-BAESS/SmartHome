import { createElement } from 'react';

/** Project the preserved floor polygons and system overlays into an SVG scene. */
export function renderScene(house, opt = {}) {
  const S = house.state,
    B = house.bMap(),
    RE = createElement;
  const layer = opt.layer || 'overview';
  const showRoomLabels = opt.showRoomLabels !== false;
  const isoFloor = S.isoFloor || 'all',
    isoRooms = S.isoRooms && S.isoRooms.length ? new Set(S.isoRooms) : null;
  const vis = (r) =>
    isoRooms ? isoRooms.has(r.id) : isoFloor === 'all' || r.floor === isoFloor;
  const visById = (id) => {
    const r = house.rooms.find((x) => x.id === id);
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
  const drawBase = (f) => baseElev[f] + floorIdx[f] * EXPL;
  let K = 0;
  const k = () => 'k' + K++;

  let bx0 = 1e9,
    bx1 = -1e9,
    by0 = 1e9,
    by1 = -1e9,
    bz0 = 1e9,
    bz1 = -1e9;
  house.rooms.forEach((r) => {
    if (!vis(r)) return;
    const zb = drawBase(r.floor),
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
  const scale = (430 / diag) * S.zoom;
  const CX = 480,
    CY = 300;
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
    const r = Math.round(parseInt(h.substr(0, 2), 16) * f),
      g = Math.round(parseInt(h.substr(2, 2), 16) * f),
      b = Math.round(parseInt(h.substr(4, 2), 16) * f);
    return `rgb(${r},${g},${b})`;
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
    const r = house.rooms.find((x) => x.id === rid);
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
    (selC ? house.typeColor(selC.type) : locate ? locate.color : '#3b6fb0');
  const isHi = (id) =>
    (servedSet && servedSet.has(id)) ||
    (locate && locate.roomId === id) ||
    (extraHi && extraHi.has(id));
  const hasFocus = !!(servedSet || (locate && locate.roomId) || extraHi);
  const floorTop = { basement: '#e7eef5', main: '#ecedf2', second: '#efedf4' };

  // ---- room volumes ----
  const faces = [];
  house.rooms.forEach((r) => {
    if (!vis(r)) return;
    const zb = drawBase(r.floor),
      zt = zb + r.height,
      n = r.verts.length;
    const sel = isHi(r.id);
    const top = floorTop[r.floor];
    // REVERSED transparency: highlighted rooms read SOLID; everything else fades back
    const topFill = sel ? house.mix(top, hiColor, 0.5) : top;
    const topStroke = sel ? hiColor : '#aab6c1';
    const wallFill = sel ? house.mix(top, hiColor, 0.32) : darken(top, 0.9);
    const faceOp = hasFocus ? (sel ? 1 : 0.16) : 1;
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
        d: polyD([p1, p2, p3, p4]),
        fill: wallFill,
        stroke: sel ? topStroke : '#aab6c1',
        sw: 0.6,
        depth: (p1.depth + p2.depth + p3.depth + p4.depth) / 4,
        op: faceOp,
        rid: r.id,
      });
    }
    const tp = r.verts.map((v) => projR(r.id, v[0], v[1], zt));
    faces.push({
      d: polyD(tp),
      fill: topFill,
      stroke: topStroke,
      sw: sel ? 1.6 : 0.9,
      depth: tp.reduce((s, p) => s + p.depth, 0) / tp.length,
      op: faceOp,
      rid: r.id,
      isTop: true,
    });
  });
  faces.sort((a, b) => b.depth - a.depth);

  const els = [];
  faces.forEach((f) => {
    const rProps =
      opt.onRoomClick && f.rid
        ? {
            onClick: () => opt.onRoomClick(f.rid),
            style: { cursor: 'pointer' },
          }
        : {};
    els.push(
      RE('path', {
        key: k(),
        d: f.d,
        fill: f.fill,
        stroke: f.stroke,
        strokeWidth: f.sw,
        strokeLinejoin: 'round',
        opacity: f.op,
        ...rProps,
      }),
    );
  });

  // ---- breaker panels (electrical infra) ----
  if (layer === 'overview' || layer === 'electrical') {
    Object.keys(house.panelPos).forEach((bid) => {
      const pp = house.panelPos[bid];
      if (!visById(pp.room)) return;
      const po = offOf(pp.room);
      const p = project(pp.x + po.ox, pp.y + po.oy, drawBase(pp.floor) + 0.55);
      const active = selC && selC.box === bid;
      const bx = B[bid];
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
        RE('rect', {
          key: k(),
          x: (p.sx - 15).toFixed(1),
          y: (p.sy - 24).toFixed(1),
          width: 30,
          height: 22,
          rx: 3,
          fill: active ? '#e0a043' : '#e8edf2',
          stroke: active ? '#d9a24e' : '#9aa4ad',
          strokeWidth: 1.4,
          ...panelCk,
        }),
      );
      els.push(
        RE(
          'text',
          {
            key: k(),
            x: p.sx.toFixed(1),
            y: (p.sy - 10).toFixed(1),
            textAnchor: 'middle',
            style: {
              font: "600 10px 'IBM Plex Mono',monospace",
              fill: active ? '#3a2a08' : '#5a6b7a',
              cursor: opt.onPanelClick ? 'pointer' : 'default',
            },
            ...panelCk,
          },
          bx.short,
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
          key: k(),
          d,
          fill: 'none',
          stroke: hiColor,
          strokeWidth: 2.4,
          strokeOpacity: 0.5,
          strokeLinejoin: 'round',
          strokeLinecap: 'round',
          style: glow,
        }),
      );
      els.push(
        RE('path', {
          key: k(),
          d,
          fill: 'none',
          stroke: hiColor,
          strokeWidth: 1.5,
          strokeDasharray: '5 9',
          strokeLinecap: 'round',
          style: { ...glow, animation: 'wireFlow 0.85s linear infinite' },
        }),
      );
    });
    rooms.forEach((r) => {
      const zt = drawBase(r.floor) + r.height + 0.05;
      const [rx, ry] = cen2(r.verts);
      const c = projR(r.id, rx, ry, zt);
      els.push(
        RE('circle', {
          key: k(),
          cx: c.sx.toFixed(1),
          cy: c.sy.toFixed(1),
          r: 8,
          fill: hiColor,
          style: { animation: 'nodePulse 1.7s ease-in-out infinite' },
        }),
      );
      els.push(
        RE('circle', {
          key: k(),
          cx: c.sx.toFixed(1),
          cy: c.sy.toFixed(1),
          r: 3.6,
          fill: hiColor,
          stroke: '#fff',
          strokeWidth: 1.3,
        }),
      );
    });
  }

  // ---- room labels ----
  if (showRoomLabels) {
    house.rooms.forEach((r) => {
      if (!vis(r)) return;
      const [rx, ry] = cen2(r.verts);
      const c = projR(r.id, rx, ry, drawBase(r.floor) + r.height);
      const sel = isHi(r.id);
      els.push(
        RE(
          'text',
          {
            key: k(),
            x: c.sx.toFixed(1),
            y: c.sy.toFixed(1),
            textAnchor: 'middle',
            style: {
              font: `600 9px 'IBM Plex Sans'`,
              fill: sel ? '#11202c' : '#3c4a54',
              paintOrder: 'stroke',
              stroke: '#ffffffea',
              strokeWidth: sel ? 3.6 : 3,
              strokeLinejoin: 'round',
              opacity: hasFocus && !sel ? 0.5 : 1,
              pointerEvents: 'none',
            },
          },
          r.short,
        ),
      );
    });
  }

  // ---- floor labels ----
  // ---- floor labels: dynamically placed at leftmost projected vertex to avoid overlapping rooms ----
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
    const lx = Math.max(22, minSx - 18),
      ly = minSy;
    const flCk = opt.onFloorClick
      ? {
          onClick: (e) => {
            e.stopPropagation();
            opt.onFloorClick(f);
          },
          onPointerDown: (e) => e.stopPropagation(),
        }
      : {};
    els.push(
      RE(
        'text',
        {
          key: k(),
          x: lx.toFixed(1),
          y: ly.toFixed(1),
          textAnchor: 'end',
          style: {
            font: "600 10px 'IBM Plex Mono',monospace",
            fill: opt.onFloorClick ? '#c8d8ea' : '#aeb9c4',
            letterSpacing: '0.05em',
            cursor: opt.onFloorClick ? 'pointer' : 'default',
          },
          ...flCk,
        },
        house.floorLabels[f],
      ),
    );
  });

  // helpers for overlay markers
  const pushGlowDot = (cx, cy, col, r0, sel) => {
    els.push(
      RE('circle', {
        key: k(),
        cx: cx.toFixed(1),
        cy: cy.toFixed(1),
        r: r0 + 5,
        fill: col,
        opacity: sel ? 0.3 : 0.18,
        style: { animation: 'nodePulse 1.7s ease-in-out infinite' },
      }),
    );
    els.push(
      RE('circle', {
        key: k(),
        cx: cx.toFixed(1),
        cy: cy.toFixed(1),
        r: r0,
        fill: col,
        stroke: '#fff',
        strokeWidth: sel ? 2 : 1.3,
      }),
    );
  };

  // ---- OVERVIEW: flagged bulbs + mesh nodes ----
  if (layer === 'overview') {
    const byRoom = {};
    house.bulbs
      .filter((b) => b.st !== 'ok')
      .forEach((b) => {
        const rid = house.bulbRoomId(b.room);
        if (!rid) return;
        (byRoom[rid] = byRoom[rid] || []).push(b);
      });
    Object.keys(byRoom).forEach((rid) => {
      const arr = byRoom[rid];
      const base = roomCeil(rid);
      if (!base) return;
      arr.forEach((b, i) => {
        const ox = (i - (arr.length - 1) / 2) * 9;
        const bcx = base.c.sx + ox,
          bcy = base.c.sy + 13;
        pushGlowDot(bcx, bcy, house.stColor(b.st), 4, false);
        if (opt.onBulbClick)
          els.push(
            RE('circle', {
              key: k(),
              cx: bcx.toFixed(1),
              cy: bcy.toFixed(1),
              r: 12,
              fill: 'transparent',
              onClick: (e) => {
                e.stopPropagation();
                opt.onBulbClick(b.id);
              },
              onPointerDown: (e) => e.stopPropagation(),
              style: { cursor: 'pointer' },
            }),
          );
      });
    });
    house.nodes.forEach((n) => {
      const rid = house.nodeRoomId[n.room];
      const base = rid ? roomCeil(rid) : null;
      if (!base) return;
      const cx = base.c.sx,
        cy = base.c.sy - 13;
      const nOvCk = opt.onNodeClick
        ? {
            onClick: (e) => {
              e.stopPropagation();
              opt.onNodeClick(n.id);
            },
            onPointerDown: (e) => e.stopPropagation(),
            style: { cursor: 'pointer' },
          }
        : {};
      els.push(
        RE('rect', {
          key: k(),
          x: (cx - 5).toFixed(1),
          y: (cy - 5).toFixed(1),
          width: 10,
          height: 10,
          rx: 2.5,
          fill: '#3b6fb0',
          opacity: 0.7,
          stroke: '#fff',
          strokeWidth: 1,
          ...nOvCk,
        }),
      );
      if (opt.onNodeClick)
        els.push(
          RE('rect', {
            key: k(),
            x: (cx - 11).toFixed(1),
            y: (cy - 11).toFixed(1),
            width: 22,
            height: 22,
            rx: 5,
            fill: 'transparent',
            ...nOvCk,
          }),
        );
    });
  }

  // ---- LIGHTING: bulb dots ----
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
        const ox = (i - (arr.length - 1) / 2) * 10;
        const sel = opt.selBulb === b.id;
        if (sel) return; // selected handled by locate pin
        const bcx = base.c.sx + ox,
          bcy = base.c.sy;
        pushGlowDot(bcx, bcy, house.stColor(b.st), 4, false);
        if (opt.onBulbClick)
          els.push(
            RE('circle', {
              key: k(),
              cx: bcx.toFixed(1),
              cy: bcy.toFixed(1),
              r: 12,
              fill: 'transparent',
              onClick: (e) => {
                e.stopPropagation();
                opt.onBulbClick(b.id);
              },
              onPointerDown: (e) => e.stopPropagation(),
              style: { cursor: 'pointer' },
            }),
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
      if (base) pos[n.id] = { x: base.c.sx, y: base.c.sy - 12 };
    });
    const gw = house.nodes[0];
    house.nodes.forEach((n) => {
      if (n.id === gw.id) return;
      if (!pos[n.id] || !pos[gw.id]) return;
      const wired = /Wired/i.test(n.backhaul);
      const active = opt.selNode === n.id || opt.selNode === gw.id;
      const col = active ? '#3b6fb0' : '#7d93ad';
      els.push(
        RE('line', {
          key: k(),
          x1: pos[gw.id].x.toFixed(1),
          y1: pos[gw.id].y.toFixed(1),
          x2: pos[n.id].x.toFixed(1),
          y2: pos[n.id].y.toFixed(1),
          stroke: col,
          strokeWidth: active ? 2 : 1.3,
          strokeOpacity: active ? 0.85 : 0.5,
          strokeDasharray: wired ? '' : '4 5',
          strokeLinecap: 'round',
          style: active ? { filter: 'drop-shadow(0 0 3px #3b6fb0)' } : {},
        }),
      );
    });
    house.nodes.forEach((n) => {
      const p = pos[n.id];
      if (!p) return;
      const sel = opt.selNode === n.id;
      const isGw = n.id === gw.id;
      const col =
        n.status === 'ok' ? (isGw ? '#3b6fb0' : '#46739f') : '#c0892f';
      const s = isGw ? 14 : 11;
      const nCk = opt.onNodeClick
        ? {
            onClick: (e) => {
              e.stopPropagation();
              opt.onNodeClick(n.id);
            },
            onPointerDown: (e) => e.stopPropagation(),
            style: { cursor: 'pointer' },
          }
        : {};
      els.push(
        RE('rect', {
          key: k(),
          x: (p.x - s / 2 - 4).toFixed(1),
          y: (p.y - s / 2 - 4).toFixed(1),
          width: s + 8,
          height: s + 8,
          rx: 4,
          fill: col,
          opacity: sel ? 0.32 : 0.16,
          style: { animation: 'nodePulse 1.7s ease-in-out infinite' },
        }),
      );
      els.push(
        RE('rect', {
          key: k(),
          x: (p.x - s / 2).toFixed(1),
          y: (p.y - s / 2).toFixed(1),
          width: s,
          height: s,
          rx: 3,
          fill: col,
          stroke: '#fff',
          strokeWidth: sel ? 2.2 : 1.4,
          transform: isGw
            ? `rotate(45 ${p.x.toFixed(1)} ${p.y.toFixed(1)})`
            : '',
          ...nCk,
        }),
      );
      if (opt.onNodeClick)
        els.push(
          RE('rect', {
            key: k(),
            x: (p.x - s / 2 - 6).toFixed(1),
            y: (p.y - s / 2 - 6).toFixed(1),
            width: s + 12,
            height: s + 12,
            rx: 5,
            fill: 'transparent',
            ...nCk,
          }),
        );
    });
  }

  // ---- SOUND: speaker clusters ----
  if (layer === 'sound' && opt.soundRoom) {
    const base = roomCeil(opt.soundRoom);
    if (base) {
      const cx = base.c.sx,
        cy = base.c.sy;
      const offs = [
        [-22, -12],
        [0, -16],
        [22, -12],
        [-26, 6],
        [26, 6],
        [-14, 18],
        [14, 18],
      ];
      offs.forEach(([ox, oy]) => {
        els.push(
          RE('rect', {
            key: k(),
            x: (cx + ox - 3.5).toFixed(1),
            y: (cy + oy - 3.5).toFixed(1),
            width: 7,
            height: 7,
            rx: 1.4,
            fill: house.SOUND,
            stroke: '#fff',
            strokeWidth: 0.8,
          }),
        );
      });
    }
  }

  // ---- SECURITY: cameras + FOV coverage cones ----
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
      const col = off ? '#8a94a0' : sel ? '#d2604f' : '#c0573b';
      const camHit = opt.onCamClick
        ? {
            onClick: () => opt.onCamClick(cam.id),
            onPointerDown: (e) => e.stopPropagation(),
            style: { cursor: 'pointer' },
          }
        : {};
      els.push(
        RE('path', {
          key: k(),
          d: polyD([apex, ...arc]),
          fill: house.hexA(col, sel ? 0.24 : 0.12),
          stroke: col,
          strokeWidth: sel ? 1.3 : 0.8,
          strokeOpacity: sel ? 0.85 : 0.45,
          strokeLinejoin: 'round',
          strokeDasharray: off ? '4 4' : '',
          ...camHit,
        }),
      );
      els.push(
        RE('circle', {
          key: k(),
          cx: apex.sx.toFixed(1),
          cy: apex.sy.toFixed(1),
          r: sel ? 9 : 6,
          fill: col,
          opacity: sel ? 0.3 : 0.16,
          style: { animation: 'nodePulse 1.7s ease-in-out infinite' },
        }),
      );
      els.push(
        RE('circle', {
          key: k(),
          cx: apex.sx.toFixed(1),
          cy: apex.sy.toFixed(1),
          r: 11,
          fill: 'transparent',
          ...camHit,
        }),
      );
      els.push(
        RE('rect', {
          key: k(),
          x: (apex.sx - 4).toFixed(1),
          y: (apex.sy - 4).toFixed(1),
          width: 8,
          height: 8,
          rx: 2,
          fill: col,
          stroke: '#fff',
          strokeWidth: sel ? 1.9 : 1.2,
          ...camHit,
        }),
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
      const col = on ? '#3f9a8c' : '#8a94a0';
      const cx = base.c.sx,
        cy = base.c.sy;
      const snCk = opt.onSensorClick
        ? {
            onClick: (e) => {
              e.stopPropagation();
              opt.onSensorClick(sn.id);
            },
            onPointerDown: (e) => e.stopPropagation(),
            style: { cursor: 'pointer' },
          }
        : {};
      if (sel)
        els.push(
          RE('circle', {
            key: k(),
            cx: cx.toFixed(1),
            cy: cy.toFixed(1),
            r: 12,
            fill: col,
            opacity: 0.22,
            style: { animation: 'nodePulse 1.7s ease-in-out infinite' },
          }),
        );
      els.push(
        RE('rect', {
          key: k(),
          x: (cx - 5).toFixed(1),
          y: (cy - 5).toFixed(1),
          width: 10,
          height: 10,
          fill: house.hexA(col, sel ? 0.4 : 0.16),
          stroke: col,
          strokeWidth: sel ? 2 : 1.2,
          strokeDasharray: on ? '' : '3 2.5',
          transform: `rotate(45 ${cx.toFixed(1)} ${cy.toFixed(1)})`,
          ...snCk,
        }),
      );
      if (opt.onSensorClick)
        els.push(
          RE('circle', {
            key: k(),
            cx: cx.toFixed(1),
            cy: cy.toFixed(1),
            r: 14,
            fill: 'transparent',
            ...snCk,
          }),
        );
    });
  }

  // ---- UPKEEP: consumable device locations ----
  if (layer === 'upkeep') {
    const items = opt.upkeep || house.upkeep;
    const seen = {};
    items.forEach((it) => {
      const base = roomCeil(it.roomId);
      if (!base) return;
      if (opt.selUp === it.id) return;
      if (seen[it.roomId]) return;
      seen[it.roomId] = 1;
      const ucx = base.c.sx,
        ucy = base.c.sy;
      pushGlowDot(ucx, ucy, house.stColor(it.status), 4, false);
      if (opt.onUpkeepClick)
        els.push(
          RE('circle', {
            key: k(),
            cx: ucx.toFixed(1),
            cy: ucy.toFixed(1),
            r: 12,
            fill: 'transparent',
            onClick: (e) => {
              e.stopPropagation();
              opt.onUpkeepClick(it.id);
            },
            onPointerDown: (e) => e.stopPropagation(),
            style: { cursor: 'pointer' },
          }),
        );
    });
  }

  // ---- locate / selection pin (drawn last) ----
  if (locate && locate.roomId && visById(locate.roomId)) {
    const r = house.rooms.find((x) => x.id === locate.roomId);
    if (r) {
      const zt = drawBase(r.floor) + r.height;
      const [rx, ry] = cen2(r.verts);
      const foot = projR(locate.roomId, rx, ry, zt),
        head = projR(locate.roomId, rx, ry, zt + 0.62);
      els.push(
        RE('line', {
          key: k(),
          x1: foot.sx.toFixed(1),
          y1: foot.sy.toFixed(1),
          x2: head.sx.toFixed(1),
          y2: head.sy.toFixed(1),
          stroke: locate.color,
          strokeWidth: 1.6,
        }),
      );
      els.push(
        RE('circle', {
          key: k(),
          cx: head.sx.toFixed(1),
          cy: head.sy.toFixed(1),
          r: 12,
          fill: locate.color,
          opacity: 0.22,
          style: { animation: 'nodePulse 1.7s ease-in-out infinite' },
        }),
      );
      els.push(
        RE('circle', {
          key: k(),
          cx: head.sx.toFixed(1),
          cy: head.sy.toFixed(1),
          r: 6.5,
          fill: locate.color,
          stroke: '#fff',
          strokeWidth: 1.8,
        }),
      );
      els.push(
        RE('circle', {
          key: k(),
          cx: head.sx.toFixed(1),
          cy: head.sy.toFixed(1),
          r: 2.2,
          fill: '#fff',
        }),
      );
      els.push(
        RE('circle', {
          key: k(),
          cx: foot.sx.toFixed(1),
          cy: foot.sy.toFixed(1),
          r: 2.4,
          fill: locate.color,
        }),
      );
    }
  }
  return els;
}
