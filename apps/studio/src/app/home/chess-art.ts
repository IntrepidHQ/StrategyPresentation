// ============================================================
//  SP Landing — Particle chess pieces
//  apps/studio/src/app/home/chess-art.ts
//
//  The brand's illustration system (Blueprint, design-mind):
//  the Brainztem particle-thread style, shaped into chess
//  pieces. Each piece is an ASCII silhouette mask sampled into
//  a jittered point cloud, threaded to near neighbors.
//  Deterministic per (piece, seed) — pure build-time SVG, no
//  scripts, monochrome via currentColor.
// ============================================================

type PieceName = "knight" | "queen" | "bishop" | "rook" | "pawn";

// Hand-drawn silhouette masks. '#' = filled. ~15 cols each; rows vary.
const MASKS: Record<PieceName, string[]> = {
  knight: [
    ".....###.......",
    "....#####......",
    "...########....",
    "..##.#######...",
    ".###########...",
    "#############..",
    "##..#########..",
    "#..##########..",
    "..###########..",
    ".####..######..",
    ".##....######..",
    ".......######..",
    "......#######..",
    ".....########..",
    "....#########..",
    "....#########..",
    "...##########..",
    "...###########.",
    "..############.",
    "..############.",
    ".#############.",
    "###############",
    "###############",
  ],
  queen: [
    "..#....#....#..",
    ".###..###..###.",
    ".############..",
    "..###########..",
    "...#########...",
    "....#######....",
    "....#######....",
    ".....#####.....",
    "....#######....",
    ".....#####.....",
    ".....#####.....",
    ".....#####.....",
    "....#######....",
    "....#######....",
    "...#########...",
    "...#########...",
    "..###########..",
    ".#############.",
    "###############",
    "###############",
  ],
  bishop: [
    ".......#.......",
    "......###......",
    ".....#####.....",
    ".....##.##.....",
    "....###.###....",
    "....#######....",
    ".....#####.....",
    "......###......",
    ".....#####.....",
    ".....#####.....",
    ".....#####.....",
    "....#######....",
    "....#######....",
    "...#########...",
    "..###########..",
    ".#############.",
    "###############",
  ],
  rook: [
    "##..###..###..#",
    "##..###..###..#",
    "###############",
    "###############",
    "...#########...",
    "...#########...",
    "...#########...",
    "...#########...",
    "...#########...",
    "...#########...",
    "...#########...",
    "..###########..",
    ".#############.",
    "###############",
  ],
  pawn: [
    ".....#####.....",
    "....#######....",
    "....#######....",
    ".....#####.....",
    "....#######....",
    ".....#####.....",
    ".....#####.....",
    "....#######....",
    "...#########...",
    "..###########..",
    ".#############.",
    "###############",
  ],
};

/** mulberry32 — deterministic art per (piece, seed). */
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

type Pt = { x: number; y: number; r: number; o: number };

/** Sample a mask into jittered particles inside a w×h box. */
function sample(piece: PieceName, seed: string, w: number, h: number): { pts: Pt[]; edges: [Pt, Pt][] } {
  const mask = MASKS[piece];
  const rows = mask.length;
  const cols = mask[0].length;
  const cw = w / cols;
  const ch = h / rows;
  const rand = prng(hashSeed(`${piece}:${seed}`));
  const filled = (r: number, c: number) => r >= 0 && r < rows && c >= 0 && c < cols && mask[r][c] === "#";
  const pts: Pt[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!filled(r, c)) continue;
      // Contour cells (touching empty space) get dense, bright particles so
      // the silhouette reads as a chess piece; interiors stay airy.
      const isEdge = !filled(r - 1, c) || !filled(r + 1, c) || !filled(r, c - 1) || !filled(r, c + 1);
      const density = isEdge ? 3 : 1;
      for (let k = 0; k < density; k++) {
        const tier = rand();
        pts.push({
          x: (c + rand()) * cw,
          y: (r + rand()) * ch,
          r: isEdge
            ? (tier > 0.6 ? Math.max(cw, ch) * 0.17 : Math.max(cw, ch) * 0.12)
            : (tier > 0.6 ? Math.max(cw, ch) * 0.1 : Math.max(cw, ch) * 0.06),
          o: isEdge ? (tier > 0.6 ? 0.95 : 0.75) : (tier > 0.6 ? 0.45 : 0.28),
        });
      }
    }
  }
  // Near-neighbor threads (each point → up to 2 nearest within reach), deduped.
  const reach = Math.max(cw, ch) * 1.9;
  const edges: [Pt, Pt][] = [];
  const seen = new Set<string>();
  pts.forEach((p, i) => {
    const near = pts
      .map((q, j) => ({ q, j, d: (p.x - q.x) ** 2 + (p.y - q.y) ** 2 }))
      .filter((e) => e.j !== i && e.d < reach * reach)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (const e of near) {
      const key = i < e.j ? `${i}-${e.j}` : `${e.j}-${i}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([p, e.q]);
      }
    }
  });
  return { pts, edges };
}

function pieceGroup(piece: PieceName, seed: string, w: number, h: number, dx: number, dy: number): string {
  const { pts, edges } = sample(piece, seed, w, h);
  const lines = edges
    .map(([a, b]) => `<line x1="${(a.x + dx).toFixed(1)}" y1="${(a.y + dy).toFixed(1)}" x2="${(b.x + dx).toFixed(1)}" y2="${(b.y + dy).toFixed(1)}"/>`)
    .join("");
  const dots = pts
    .map((p) => `<circle cx="${(p.x + dx).toFixed(1)}" cy="${(p.y + dy).toFixed(1)}" r="${p.r.toFixed(1)}" opacity="${p.o}"/>`)
    .join("");
  return `<g class="pc-threads">${lines}</g><g class="pc-dots">${dots}</g>`;
}

/** One piece as a standalone SVG (negative-space placements). */
export function particlePiece(piece: PieceName, seed = "sp"): string {
  const w = 300;
  const h = (MASKS[piece].length / MASKS[piece][0].length) * w;
  return `<svg class="lp-chess-svg" viewBox="0 0 ${w} ${h.toFixed(0)}" aria-hidden="true" focusable="false">${pieceGroup(piece, seed, w, h, 0, 0)}</svg>`;
}

/** The hero cluster: bishop · queen (tallest, center) · knight. */
export function particleChessCluster(seed = "sp"): string {
  const W = 760;
  const H = 560;
  const queenW = 300;
  const queenH = (MASKS.queen.length / 15) * queenW; // 400 — tallest, center
  const knightW = 230;
  const knightH = (MASKS.knight.length / 15) * knightW; // ~353
  const bishopW = 260;
  const bishopH = (MASKS.bishop.length / 15) * bishopW; // ~295
  return `<svg class="lp-chess-svg" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMax meet">
  ${pieceGroup("bishop", seed + "b", bishopW, bishopH, 0, H - bishopH)}
  ${pieceGroup("queen", seed + "q", queenW, queenH, 235, H - queenH)}
  ${pieceGroup("knight", seed + "k", knightW, knightH, 525, H - knightH)}
</svg>`;
}
