// ============================================================
//  Spherical chess — pure rules engine for the hero planet.
//
//  Topology: 8 ranks (latitude bands between ±60°) × 8 files
//  that WRAP around the longitude — the board is a cylinder
//  wrapped onto the globe, so there is no a-file/h-file edge:
//  rooks can circle the planet and knights wrap the horizon.
//  Ranks do not wrap (no pole transit in v1). No castling or
//  en passant (ill-defined on a wrapped board); pawns promote
//  to queens automatically. Everything else is legal chess,
//  including check, checkmate, and stalemate.
//
//  Pure TypeScript, no dependencies — unit-testable.
// ============================================================

export type PieceType = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";
export type Color = "white" | "black";

export type GamePiece = {
  id: number;
  type: PieceType;
  color: Color;
  file: number; // 0..7, wraps
  rank: number; // 0..7, white home = 0/1, black home = 6/7
  alive: boolean;
};

export type Move = { file: number; rank: number; capture?: GamePiece };

export type GameState = {
  pieces: GamePiece[];
  turn: Color;
  /** null = in progress */
  result: null | { winner: Color | "draw"; reason: "checkmate" | "stalemate" };
};

const wrap = (f: number) => ((f % 8) + 8) % 8;

export function initialState(): GameState {
  const pieces: GamePiece[] = [];
  let id = 0;
  const back: PieceType[] = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];
  for (let f = 0; f < 8; f++) {
    pieces.push({ id: id++, type: back[f], color: "white", file: f, rank: 0, alive: true });
    pieces.push({ id: id++, type: "pawn", color: "white", file: f, rank: 1, alive: true });
    pieces.push({ id: id++, type: "pawn", color: "black", file: f, rank: 6, alive: true });
    pieces.push({ id: id++, type: back[f], color: "black", file: f, rank: 7, alive: true });
  }
  return { pieces, turn: "white", result: null };
}

export function pieceAt(state: GameState, file: number, rank: number): GamePiece | undefined {
  const f = wrap(file);
  return state.pieces.find((p) => p.alive && p.file === f && p.rank === rank);
}

const KNIGHT_OFFSETS: [number, number][] = [
  [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2],
];
const ROOK_DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const BISHOP_DIRS: [number, number][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

/** Pseudo-legal moves (may leave own king in check — filtered later). */
function pseudoMoves(state: GameState, p: GamePiece): Move[] {
  const out: Move[] = [];
  const push = (f: number, r: number): boolean => {
    // returns true if the ray may continue past this square
    if (r < 0 || r > 7) return false;
    const target = pieceAt(state, f, r);
    if (!target) {
      out.push({ file: wrap(f), rank: r });
      return true;
    }
    if (target.color !== p.color) out.push({ file: wrap(f), rank: r, capture: target });
    return false;
  };

  if (p.type === "pawn") {
    const dir = p.color === "white" ? 1 : -1;
    const start = p.color === "white" ? 1 : 6;
    const one = p.rank + dir;
    if (one >= 0 && one <= 7 && !pieceAt(state, p.file, one)) {
      out.push({ file: p.file, rank: one });
      const two = p.rank + dir * 2;
      if (p.rank === start && !pieceAt(state, p.file, two)) out.push({ file: p.file, rank: two });
    }
    for (const df of [-1, 1]) {
      const t = pieceAt(state, p.file + df, one);
      if (t && t.color !== p.color) out.push({ file: wrap(p.file + df), rank: one, capture: t });
    }
    return out;
  }

  if (p.type === "knight") {
    for (const [df, dr] of KNIGHT_OFFSETS) push(p.file + df, p.rank + dr);
    return out;
  }

  if (p.type === "king") {
    for (let df = -1; df <= 1; df++)
      for (let dr = -1; dr <= 1; dr++) {
        if (!df && !dr) continue;
        push(p.file + df, p.rank + dr);
      }
    return out;
  }

  const dirs = p.type === "rook" ? ROOK_DIRS : p.type === "bishop" ? BISHOP_DIRS : [...ROOK_DIRS, ...BISHOP_DIRS];
  for (const [df, dr] of dirs) {
    // A wrapped ray could orbit forever on an empty band — cap at 8 steps
    // (a full loop), never revisiting the origin square.
    for (let step = 1; step <= 8; step++) {
      const f = p.file + df * step;
      const r = p.rank + dr * step;
      if (dr === 0 && step === 8) break; // full orbit back to self
      if (!push(f, r)) break;
    }
  }
  return out;
}

/** Is (file, rank) attacked by any living piece of `by`? */
export function isAttacked(state: GameState, file: number, rank: number, by: Color): boolean {
  for (const p of state.pieces) {
    if (!p.alive || p.color !== by) continue;
    if (p.type === "pawn") {
      const dir = p.color === "white" ? 1 : -1;
      if (p.rank + dir === rank && (wrap(p.file + 1) === wrap(file) || wrap(p.file - 1) === wrap(file))) return true;
      continue;
    }
    // For non-pawns, pseudo moves = attacked squares.
    if (pseudoMoves(state, p).some((m) => m.file === wrap(file) && m.rank === rank)) return true;
  }
  return false;
}

export function inCheck(state: GameState, color: Color): boolean {
  const king = state.pieces.find((p) => p.alive && p.color === color && p.type === "king");
  if (!king) return false;
  return isAttacked(state, king.file, king.rank, color === "white" ? "black" : "white");
}

/** Fully legal moves for a piece (never leaves own king in check). */
export function legalMoves(state: GameState, p: GamePiece): Move[] {
  if (!p.alive || state.result) return [];
  return pseudoMoves(state, p).filter((m) => {
    // Simulate.
    const undoF = p.file, undoR = p.rank;
    const cap = m.capture;
    if (cap) cap.alive = false;
    p.file = m.file;
    p.rank = m.rank;
    const bad = inCheck(state, p.color);
    p.file = undoF;
    p.rank = undoR;
    if (cap) cap.alive = true;
    return !bad;
  });
}

/** Apply a move (assumed legal). Returns { promoted } for the renderer. */
export function applyMove(state: GameState, p: GamePiece, m: Move): { promoted: boolean } {
  if (m.capture) m.capture.alive = false;
  p.file = m.file;
  p.rank = m.rank;
  let promoted = false;
  if (p.type === "pawn" && (p.rank === 7 || p.rank === 0)) {
    p.type = "queen";
    promoted = true;
  }
  state.turn = state.turn === "white" ? "black" : "white";
  // Game over?
  const mover = state.turn;
  const any = state.pieces.some((q) => q.alive && q.color === mover && legalMoves(state, q).length > 0);
  if (!any) {
    state.result = inCheck(state, mover)
      ? { winner: mover === "white" ? "black" : "white", reason: "checkmate" }
      : { winner: "draw", reason: "stalemate" };
  }
  return { promoted };
}

/** HUD line for the current state. */
export function statusText(state: GameState): string {
  if (state.result) {
    if (state.result.reason === "stalemate") return "STALEMATE — DRAW";
    return `CHECKMATE — ${state.result.winner === "white" ? "WHITE" : "BLACK"} WINS`;
  }
  const side = state.turn === "white" ? "WHITE" : "BLACK";
  return inCheck(state, state.turn) ? `${side} TO MOVE — CHECK` : `${side} TO MOVE`;
}
