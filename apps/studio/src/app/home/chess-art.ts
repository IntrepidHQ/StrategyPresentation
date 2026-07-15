// ============================================================
//  SP Landing — Particle chess pieces (v2: genuine 3D)
//  apps/studio/src/app/home/chess-art.ts
//
//  Chess pieces as 3D point clouds. The turned pieces (queen,
//  bishop, rook, pawn) are surfaces of revolution: a lathe
//  profile r(h) sampled uniformly by surface area, lit by a
//  directional light with a rim-glow term, perspective-projected
//  and depth-sorted so near particles draw over far ones. The
//  knight is a volumetric billboard: its silhouette mask gains
//  an elliptical depth cross-section and rotates like the rest.
//  Deterministic per (piece, seed). Pure build-time SVG,
//  monochrome via currentColor.
// ============================================================

type PieceName = "knight" | "queen" | "bishop" | "rook" | "pawn";

// ── Lathe profiles: [height 0..1, radius] control points ──
// Radii are in piece-height units; linear interpolation between stops.
// Shapes tuned to read as Staunton-ish silhouettes.
const PROFILES: Record<Exclude<PieceName, "knight">, [number, number][]> = {
  queen: [
    [0.0, 0.34], [0.045, 0.34], [0.08, 0.24], [0.12, 0.175], [0.2, 0.13],
    [0.34, 0.095], [0.46, 0.08], [0.5, 0.115], [0.54, 0.08], [0.62, 0.075],
    [0.7, 0.09], [0.74, 0.15], [0.78, 0.2], [0.8, 0.16], [0.86, 0.19],
    [0.9, 0.1], [0.93, 0.05],
  ],
  bishop: [
    [0.0, 0.34], [0.05, 0.34], [0.09, 0.23], [0.14, 0.16], [0.26, 0.115],
    [0.42, 0.09], [0.52, 0.085], [0.56, 0.13], [0.6, 0.09], [0.64, 0.13],
    [0.72, 0.17], [0.8, 0.15], [0.88, 0.08], [0.92, 0.04],
  ],
  rook: [
    [0.0, 0.36], [0.06, 0.36], [0.1, 0.26], [0.16, 0.2], [0.3, 0.17],
    [0.55, 0.16], [0.72, 0.17], [0.78, 0.24], [0.8, 0.26], [1.0, 0.26],
  ],
  pawn: [
    [0.0, 0.36], [0.06, 0.36], [0.11, 0.24], [0.2, 0.16], [0.36, 0.12],
    [0.5, 0.11], [0.56, 0.17], [0.6, 0.12],
  ],
};

// Spheres stacked on top of the lathe body: [centerH, radius].
const TOPPERS: Record<Exclude<PieceName, "knight">, [number, number][]> = {
  queen: [[0.965, 0.05]],
  bishop: [[0.955, 0.045]],
  rook: [],
  pawn: [[0.74, 0.15]],
};

// Crown spikes (queen): cones rising from the crown rim.
const QUEEN_SPIKES = 7;

// ── Knight geometry ──
// The head/neck is a traced Staunton profile polygon (x centered on the
// lathe axis, y 0..1 up, muzzle facing -x). The plinth below y≈0.2 is
// TURNED like every other piece, so the knight sits on the same round base.
const KNIGHT_BASE: [number, number][] = [
  [0.0, 0.34], [0.05, 0.34], [0.09, 0.24], [0.13, 0.19], [0.17, 0.17], [0.2, 0.185],
];
const KNIGHT_POLY: [number, number][] = [
  [-0.3, 0.19], [-0.27, 0.3], [-0.21, 0.44], [-0.16, 0.52],   // chest → throat
  [-0.23, 0.555],                                              // chin
  [-0.43, 0.60], [-0.455, 0.655],                              // muzzle underside → nose tip
  [-0.38, 0.715], [-0.245, 0.815],                             // nose bridge → forehead
  [-0.145, 0.875], [-0.10, 1.0], [-0.025, 0.895],              // ear 1
  [0.055, 0.975], [0.10, 0.865],                               // ear 2
  [0.16, 0.815],                                               // crown
  [0.245, 0.71], [0.185, 0.655],                               // mane notch 1
  [0.285, 0.565], [0.225, 0.51],                               // mane notch 2
  [0.325, 0.42], [0.265, 0.365],                               // mane notch 3
  [0.305, 0.19],                                               // back of body
];
// Carved voids — particle absence reads as sculpted detail.
const KNIGHT_EYE = { x: -0.155, y: 0.705, r: 0.048 };
const KNIGHT_NOSTRIL = { x: -0.395, y: 0.645, r: 0.022 };
const KNIGHT_MOUTH = { x1: -0.44, y1: 0.615, x2: -0.29, y2: 0.585, r: 0.014 };
// The mane crest: a raised ridge along the back-of-neck curve.
const KNIGHT_MANE: [number, number][] = [
  [0.16, 0.80], [0.21, 0.70], [0.25, 0.60], [0.28, 0.50], [0.30, 0.40], [0.30, 0.30],
];

/** mulberry32 — deterministic per (piece, seed). */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type P3 = { x: number; y: number; z: number; nx: number; ny: number; nz: number };
type P2 = { x: number; y: number; z: number; r: number; o: number };

function profileAt(profile: [number, number][], h: number): { r: number; slope: number } {
  for (let i = 0; i < profile.length - 1; i++) {
    const [h0, r0] = profile[i];
    const [h1, r1] = profile[i + 1];
    if (h >= h0 && h <= h1) {
      const t = (h - h0) / Math.max(1e-6, h1 - h0);
      return { r: r0 + (r1 - r0) * t, slope: (r1 - r0) / Math.max(1e-6, h1 - h0) };
    }
  }
  return { r: profile[profile.length - 1][1], slope: 0 };
}

/** Sample a lathe body + toppers + (queen) spikes into 3D points w/ normals. */
function sampleLathe(piece: Exclude<PieceName, "knight">, rand: () => number, count: number): P3[] {
  const profile = PROFILES[piece];
  const hMax = profile[profile.length - 1][0];
  const rMax = Math.max(...profile.map(([, r]) => r));
  const pts: P3[] = [];

  // Rook crenellations: cut 4 wedges out of the top band.
  const isCutRook = (h: number, th: number) => {
    if (piece !== "rook" || h < 0.88) return false;
    const sector = ((th / (Math.PI * 2)) * 8) % 2; // 8 sectors, alternate
    return sector < 0.9;
  };
  // Bishop mitre slit: a diagonal groove across the upper egg.
  const isCutBishop = (h: number, th: number) => {
    if (piece !== "bishop" || h < 0.62 || h > 0.9) return false;
    const face = Math.abs(((th + Math.PI) % (Math.PI * 2)) - Math.PI); // 0 at front
    return Math.abs(h - (0.62 + face * 0.09)) < 0.016;
  };

  while (pts.length < count) {
    const h = rand() * hMax;
    const { r, slope } = profileAt(profile, h);
    if (rand() > r / rMax) continue; // area-weighted acceptance
    const th = rand() * Math.PI * 2;
    if (isCutRook(h, th) || isCutBishop(h, th)) continue;
    // Lathe normal: radial, tilted by the profile slope.
    const nl = Math.hypot(1, slope);
    pts.push({
      x: r * Math.cos(th), y: h, z: r * Math.sin(th),
      nx: Math.cos(th) / nl, ny: -slope / nl, nz: Math.sin(th) / nl,
    });
  }

  for (const [ch, cr] of TOPPERS[piece]) {
    const n = Math.floor(count * (piece === "pawn" ? 0.55 : 0.16));
    for (let i = 0; i < n; i++) {
      // Uniform sphere sampling.
      const u = rand() * 2 - 1;
      const th = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      pts.push({
        x: cr * s * Math.cos(th), y: ch + cr * u, z: cr * s * Math.sin(th),
        nx: s * Math.cos(th), ny: u, nz: s * Math.sin(th),
      });
    }
  }

  if (piece === "queen") {
    const n = Math.floor(count * 0.14);
    for (let i = 0; i < n; i++) {
      const k = Math.floor(rand() * QUEEN_SPIKES);
      const baseTh = (k / QUEEN_SPIKES) * Math.PI * 2;
      const t = rand(); // 0 base → 1 tip
      const r = 0.185 * (1 - t * 0.8);
      const th = baseTh + (rand() - 0.5) * 0.5;
      pts.push({
        x: r * Math.cos(th), y: 0.86 + t * 0.1, z: r * Math.sin(th),
        nx: Math.cos(th), ny: 0.25, nz: Math.sin(th),
      });
    }
  }
  return pts;
}

function pointInPoly(x: number, y: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inVoid(x: number, y: number): boolean {
  const eye = (x - KNIGHT_EYE.x) ** 2 + (y - KNIGHT_EYE.y) ** 2 < KNIGHT_EYE.r ** 2;
  const nos = (x - KNIGHT_NOSTRIL.x) ** 2 + (y - KNIGHT_NOSTRIL.y) ** 2 < KNIGHT_NOSTRIL.r ** 2;
  // Mouth: distance from the slit segment.
  const { x1, y1, x2, y2, r } = KNIGHT_MOUTH;
  const dx = x2 - x1, dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  const mouth = (x - (x1 + t * dx)) ** 2 + (y - (y1 + t * dy)) ** 2 < r ** 2;
  return eye || nos || mouth;
}

/** Knight: turned plinth (lathe) + traced head/neck polygon with carved
 *  eye/mouth/nostril voids, a raised mane crest, and contour-derived
 *  normals so the light follows the silhouette. */
function sampleKnight(rand: () => number, count: number): P3[] {
  const pts: P3[] = [];

  // Turned base — same construction as every other piece.
  const baseCount = Math.floor(count * 0.22);
  const rBaseMax = 0.34;
  while (pts.length < baseCount) {
    const h = rand() * 0.2;
    const { r, slope } = profileAt(KNIGHT_BASE, h);
    if (rand() > r / rBaseMax) continue;
    const th = rand() * Math.PI * 2;
    const nl = Math.hypot(1, slope);
    pts.push({
      x: r * Math.cos(th), y: h, z: r * Math.sin(th),
      nx: Math.cos(th) / nl, ny: -slope / nl, nz: Math.sin(th) / nl,
    });
  }

  // Depth half-thickness by height: rounder at the body, slimmer at the head.
  const halfT = (y: number) => (y > 0.62 ? 0.115 : y > 0.4 ? 0.15 : 0.2);

  // 1) CONTOUR: walk the polygon perimeter and lay a dense, bright particle
  //    line along it — this is what makes the muzzle, ears, and mane notches
  //    read crisply regardless of how thin they are.
  const edges: { ax: number; ay: number; bx: number; by: number; len: number }[] = [];
  let per = 0;
  for (let i = 0; i < KNIGHT_POLY.length; i++) {
    const [ax, ay] = KNIGHT_POLY[i];
    const [bx, by] = KNIGHT_POLY[(i + 1) % KNIGHT_POLY.length];
    const len = Math.hypot(bx - ax, by - ay);
    edges.push({ ax, ay, bx, by, len });
    per += len;
  }
  const contourCount = Math.floor(count * 0.3);
  for (let i = 0; i < contourCount; i++) {
    let d = rand() * per;
    const e = edges.find((ed) => (d -= ed.len) <= 0) ?? edges[edges.length - 1];
    const t = 1 + d / e.len; // d is negative remainder within this edge
    const x = e.ax + (e.bx - e.ax) * t + (rand() - 0.5) * 0.012;
    const y = e.ay + (e.by - e.ay) * t + (rand() - 0.5) * 0.012;
    // Outward 2D normal of the edge (polygon is wound clockwise in screen space).
    const nl = Math.max(1e-4, e.len);
    const nx = (e.by - e.ay) / nl;
    const ny = -(e.bx - e.ax) / nl;
    const zh = halfT(y);
    const z = (rand() * 2 - 1) * zh * 0.85;
    pts.push({ x, y, z, nx, ny, nz: 0.4 });
  }

  // 2) DETAIL RIMS: bright rings around the carved eye / nostril / mouth.
  const rimCount = Math.floor(count * 0.07);
  for (let i = 0; i < rimCount; i++) {
    const pick = rand();
    let x: number, y: number, nx: number, ny: number;
    if (pick < 0.45) {
      const th = rand() * Math.PI * 2;
      x = KNIGHT_EYE.x + Math.cos(th) * KNIGHT_EYE.r;
      y = KNIGHT_EYE.y + Math.sin(th) * KNIGHT_EYE.r;
      nx = Math.cos(th); ny = Math.sin(th);
    } else if (pick < 0.6) {
      const th = rand() * Math.PI * 2;
      x = KNIGHT_NOSTRIL.x + Math.cos(th) * KNIGHT_NOSTRIL.r;
      y = KNIGHT_NOSTRIL.y + Math.sin(th) * KNIGHT_NOSTRIL.r;
      nx = Math.cos(th); ny = Math.sin(th);
    } else {
      const m = KNIGHT_MOUTH;
      const t = rand();
      const side = rand() > 0.5 ? 1 : -1;
      x = m.x1 + (m.x2 - m.x1) * t;
      y = m.y1 + (m.y2 - m.y1) * t + side * m.r;
      nx = 0; ny = side;
    }
    if (!pointInPoly(x, y, KNIGHT_POLY)) continue;
    pts.push({ x, y, z: halfT(y) * 0.9, nx: nx * 0.5, ny: ny * 0.5, nz: 0.85 });
  }

  // 3) INTERIOR FILL: volumetric but deliberately dimmer (shortened normals
  //    lower the light term) so the contour carries the drawing.
  const bodyCount = Math.floor(count * 0.56);
  let made = 0;
  while (made < bodyCount) {
    const x = -0.47 + rand() * 0.8;
    const y = 0.18 + rand() * 0.84;
    if (!pointInPoly(x, y, KNIGHT_POLY) || inVoid(x, y)) continue;
    const zh = halfT(y);
    const zc = (rand() * 2 - 1);
    const shellZ = Math.sign(zc || 1) * zh * Math.sqrt(1 - Math.min(1, Math.abs(zc))) * (0.7 + 0.3 * rand());
    const z = rand() > 0.3 ? shellZ : zc * zh;
    const nzs = Math.max(-1, Math.min(1, z / Math.max(1e-4, zh)));
    pts.push({ x, y, z, nx: 0, ny: 0.05, nz: nzs * 0.55 });
    made++;
  }

  // Mane crest: dense ridge along the back-of-neck curve, pushed proud of
  // the shell — catches the light as a bright rim.
  const maneCount = Math.max(0, Math.floor(count * 0.06));
  for (let i = 0; i < maneCount; i++) {
    const t = rand() * (KNIGHT_MANE.length - 1);
    const k = Math.floor(t);
    const f = t - k;
    const [ax, ay] = KNIGHT_MANE[Math.min(k, KNIGHT_MANE.length - 1)];
    const [bx, by] = KNIGHT_MANE[Math.min(k + 1, KNIGHT_MANE.length - 1)];
    const mx = ax + (bx - ax) * f + (rand() - 0.5) * 0.03;
    const my = ay + (by - ay) * f + (rand() - 0.5) * 0.03;
    const z = (rand() * 2 - 1) * 0.05;
    pts.push({ x: mx, y: my, z, nx: 0.4, ny: 0.3, nz: 0.55 });
  }
  return pts;
}

// ── Projection + shading ──
const LIGHT = { x: -0.45, y: 0.5, z: 0.74 }; // upper-left, toward viewer

function project(pts: P3[], rand: () => number, opts: { rotY: number; scale: number; cx: number; baseY: number }): P2[] {
  const { rotY, scale, cx, baseY } = opts;
  const rotX = -0.12;
  const cy = Math.cos(rotY), sy = Math.sin(rotY);
  const cxr = Math.cos(rotX), sxr = Math.sin(rotX);
  const f = 3.2; // perspective strength
  const out: P2[] = [];
  for (const p of pts) {
    // center piece on its own axis; y grows downward in SVG.
    const x0 = p.x, y0 = p.y - 0.5, z0 = p.z;
    let x = x0 * cy + z0 * sy;
    let z = -x0 * sy + z0 * cy;
    let y = y0 * cxr - z * sxr;
    z = y0 * sxr + z * cxr;
    let nx = p.nx * cy + p.nz * sy;
    const nz0 = -p.nx * sy + p.nz * cy;
    let ny = p.ny * cxr - nz0 * sxr;
    const nz = p.ny * sxr + nz0 * cxr;
    const persp = f / (f - z);
    const shade = Math.max(0, nx * LIGHT.x + ny * LIGHT.y + nz * LIGHT.z);
    const rim = Math.pow(1 - Math.min(1, Math.abs(nz)), 2.2); // grazing → glow
    const o = Math.min(1, 0.1 + shade * 0.55 + rim * 0.45 + rand() * 0.06);
    const r = (0.5 + shade * 0.75 + rim * 0.45) * persp * scale * 0.0062;
    out.push({ x: cx + x * scale * persp, y: baseY - (y + 0.5) * scale * persp, z, r, o });
  }
  out.sort((a, b) => a.z - b.z); // far first, near paints on top
  return out;
}

/** Sparse plexus threads between near points (bucketed, cheap). */
function threads(pts: P2[], rand: () => number, reach: number, keep = 0.3): string {
  const cell = reach;
  const grid = new Map<string, number[]>();
  pts.forEach((p, i) => {
    const k = `${Math.floor(p.x / cell)},${Math.floor(p.y / cell)}`;
    (grid.get(k) ?? grid.set(k, []).get(k)!).push(i);
  });
  const segs: string[] = [];
  pts.forEach((p, i) => {
    if (rand() > keep) return;
    let best = -1, bd = reach * reach;
    const gx = Math.floor(p.x / cell), gy = Math.floor(p.y / cell);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (const j of grid.get(`${gx + dx},${gy + dy}`) ?? []) {
          if (j <= i) continue;
          const q = pts[j];
          const d = (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
          if (d < bd) { bd = d; best = j; }
        }
    if (best >= 0) {
      const q = pts[best];
      segs.push(`<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}" opacity="${(0.05 + Math.min(p.o, q.o) * 0.14).toFixed(2)}"/>`);
    }
  });
  return segs.join("");
}

function renderPiece(piece: PieceName, seed: string, count: number, opts: { rotY: number; scale: number; cx: number; baseY: number }): string {
  const rand = prng(hashSeed(`${piece}:${seed}`));
  const pts3 = piece === "knight" ? sampleKnight(rand, count) : sampleLathe(piece, rand, count);
  // Ground scatter: a thin ring of dust where the piece meets the sheet —
  // grounds the object and sells the 3D read.
  const groundN = Math.floor(count * 0.1);
  for (let i = 0; i < groundN; i++) {
    const th = rand() * Math.PI * 2;
    const rr = 0.34 + Math.pow(rand(), 1.6) * 0.3;
    pts3.push({ x: rr * Math.cos(th), y: 0.004, z: rr * Math.sin(th), nx: 0, ny: 1, nz: 0 });
  }
  const pts = project(pts3, rand, opts);
  const dots = pts
    .map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(2)}" opacity="${p.o.toFixed(2)}"/>`)
    .join("");
  return `<g class="pc-threads">${threads(pts, rand, opts.scale * 0.085)}</g><g class="pc-dots">${dots}</g>`;
}

/** One piece as a standalone SVG (negative-space placements). */
export function particlePiece(piece: PieceName, seed = "sp"): string {
  const W = 320, H = 420;
  const counts: Record<PieceName, number> = { queen: 1600, knight: 1500, bishop: 1400, rook: 1300, pawn: 1000 };
  return `<svg class="lp-chess-svg" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${renderPiece(
    piece, seed, counts[piece], { rotY: 0.35, scale: 360, cx: W / 2, baseY: H - 12 },
  )}</svg>`;
}

/** The hero cluster: bishop · queen (tallest, center) · knight. */
export function particleChessCluster(seed = "sp"): string {
  const W = 880, H = 640;
  return `<svg class="lp-chess-svg" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMax meet">
  ${renderPiece("bishop", seed + "b", 1750, { rotY: 0.5, scale: 430, cx: 165, baseY: H - 14 })}
  ${renderPiece("queen", seed + "q", 2500, { rotY: 0.28, scale: 600, cx: 440, baseY: H - 8 })}
  ${renderPiece("knight", seed + "k", 2100, { rotY: 0.15, scale: 470, cx: 715, baseY: H - 12 })}
</svg>`;
}
