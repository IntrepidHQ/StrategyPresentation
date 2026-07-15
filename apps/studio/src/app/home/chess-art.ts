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

// Knight silhouette mask (side profile, faces left) — billboard + depth.
const KNIGHT_MASK = [
  "......####........",
  ".....######.......",
  "....#########.....",
  "...##.########....",
  "..#############...",
  ".###############..",
  "##..############..",
  "#..#############..",
  "...#############..",
  "..#####..#######..",
  "..###....#######..",
  ".........#######..",
  "........########..",
  ".......#########..",
  "......##########..",
  ".....###########..",
  ".....############.",
  "....#############.",
  "....#############.",
  "...##############.",
  "...###############",
  "..################",
  ".#################",
  "##################",
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

/** Knight: silhouette mask billboarded with an elliptical depth section. */
function sampleKnight(rand: () => number, count: number): P3[] {
  const rows = KNIGHT_MASK.length;
  const cols = KNIGHT_MASK[0].length;
  const filledCells: [number, number][] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) if (KNIGHT_MASK[r][c] === "#") filledCells.push([r, c]);
  // Per-row width → approximate a centered elliptical cross-section.
  const rowSpan: Record<number, [number, number]> = {};
  for (const [r, c] of filledCells) {
    const s = rowSpan[r] ?? [c, c];
    rowSpan[r] = [Math.min(s[0], c), Math.max(s[1], c)];
  }
  const pts: P3[] = [];
  const thick = 0.34; // body depth relative to height
  while (pts.length < count) {
    const [r, c] = filledCells[Math.floor(rand() * filledCells.length)];
    const u = c + rand();
    const v = r + rand();
    const [c0, c1] = rowSpan[r];
    const mid = (c0 + c1 + 1) / 2;
    const half = Math.max(1, (c1 - c0 + 1) / 2);
    const across = Math.max(-1, Math.min(1, (u - mid) / half)); // -1..1 across the row
    const zHalf = Math.sqrt(Math.max(0, 1 - across * across)) * thick * 0.5;
    const z = (rand() * 2 - 1) * zHalf;
    // Bias to the shell for a surface look.
    const shell = Math.sign(z || 1) * zHalf * (0.65 + 0.35 * rand());
    const zz = rand() > 0.35 ? shell : z;
    const x = (u / cols - 0.5) * (cols / rows); // keep aspect
    const y = 1 - v / rows;
    const nz = zz / Math.max(1e-4, zHalf);
    pts.push({ x, y, z: zz, nx: across * 0.6, ny: 0.1, nz: Math.max(-1, Math.min(1, nz)) });
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
