"use client";

// ============================================================
//  The hero: PLAYABLE spherical chess on a particle planet.
//
//  Board: 8 latitude ranks (±60°) × 8 longitude files that
//  wrap around the globe — no board edges; the armies start on
//  opposite hemispheres. Rules live in sphere-chess.ts (legal
//  chess with check/mate; no castling/en-passant; auto-queen).
//
//  Interaction: click one of your pieces → it brightens and a
//  ring pulses under it; every legal square lights up. Click a
//  lit square → the piece arcs along the great circle; captures
//  launch the victim off the planet. Drag rotates the world;
//  it idles slowly when you're not playing. Hot-seat two-player
//  (drag around to play the other army). HUD shows the turn /
//  check / mate, with reset.
//
//  Geometry: "A Beautiful Game" (© 2020 ASWF / © 2022 Ed
//  Mackey, CC BY 4.0 — credited in the footer). SVG fallback
//  stays for no-JS / no-WebGL.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { particleChessCluster } from "./chess-art";
import { type PieceData, densify, loadPoints } from "./points-lib";
import {
  type GamePiece,
  type GameState,
  type Move,
  applyMove,
  inCheck,
  initialState,
  isAttacked,
  legalMoves,
  statusText,
} from "./sphere-chess";

const GLOBE_R = 1.0;
const CENTER = { x: 0.34, y: -0.02, z: 0 };

const SCALES: Record<string, number> = {
  king: 0.27, queen: 0.26, bishop: 0.235, knight: 0.22, rook: 0.21, pawn: 0.165,
};
// Beyond the 4.2K points stored per piece in the .bin — the loader densifies
// tangentially, so the armies read as SOLID lit surfaces (tight jitter +
// ~2× the old sample counts; per-point size is dialed down to compensate).
const SAMPLES: Record<string, number> = {
  king: 10400, queen: 10400, bishop: 9200, knight: 9200, rook: 8400, pawn: 5600,
};
// One shared per-point size base (fraction of viewport height). Smaller than
// the old 0.0042 so the denser clouds pack into crisp solids, not bloom.
const PT_BASE = 0.0033;

// Cell → spherical coordinates. Ranks are latitude bands between ±60°,
// files wrap the longitude; file 3.5 faces the camera at spin 0.
// Board bands. A full 8-file wrap fixes columns at 45° of longitude; to make
// the CENTER cells read squarer we widen the 8 rank bands to ±66° latitude
// (16.5° each) so equatorial cells are closer to square than the old ±60°.
const LAT_SPAN = 66;
const BAND = (2 * LAT_SPAN) / 8; // 16.5°
const latDeg = (r: number) => -LAT_SPAN + BAND / 2 + BAND * r;
const lonDeg = (f: number) => (f - 3.5) * 45;

// Piece shaders. Crisp, uniform, SMALL particles (no size-by-brightness →
// no blur); shading is carried by per-particle color + a bright silhouette
// rim, and by sampling density. uColor tints the army (white vs dark); aBlack
// marks the pure-black finial ball on every piece's tip. uRim lifts the dark
// army's edge so it reads on the blue sheet.
const GAME_VERT = /* glsl */ `
  uniform float uScale;
  uniform float uBoost;
  uniform vec3 uColor;
  uniform float uRim;
  attribute float aLum;
  attribute float aBlack;
  varying vec3 vColor;
  varying float vA;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 lightDir = normalize(vec3(-0.4, 0.55, 0.82));
    vec3 wn = normalize(mat3(modelMatrix) * normal);
    float diff = max(dot(wn, lightDir), 0.0);
    vec3 vn = normalize(normalMatrix * normal);
    float rim = pow(1.0 - abs(vn.z), 3.0);
    vec3 base = mix(uColor, vec3(0.015), aBlack);   // true-black particles
    // High ambient floor: the WHITE army must read solid white, never a
    // gray speckle — shading is a gentle 30% swing, not a blackout.
    vec3 col = base * (0.70 + diff * 0.38) * uBoost;
    col = mix(col, vec3(1.0), rim * uRim * (1.0 - aBlack)); // white silhouette
    vColor = col;
    // Near-opaque so dense small points read as a solid surface, not haze.
    vA = clamp(aLum * (0.88 + diff * 0.12 + rim * 0.2), 0.8, 1.0);
    gl_PointSize = uScale * (300.0 / max(60.0, -mv.z * 100.0));
    gl_Position = projectionMatrix * mv;
  }
`;
const GAME_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vA;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float edge = 1.0 - smoothstep(0.46, 0.5, d); // near-hard disc — crisp, no halo
    gl_FragColor = vec4(vColor, vA * edge);
  }
`;
// Highlight rings: simple pulsing points.
const RING_VERT = /* glsl */ `
  uniform float uScale;
  uniform float uTime;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float pulse = 0.75 + 0.25 * sin(uTime * 4.2);
    gl_PointSize = 1.6 * pulse * uScale * (300.0 / max(60.0, -mv.z * 100.0));
    gl_Position = projectionMatrix * mv;
  }
`;
const RING_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (length(c) > 0.5) discard;
    float pulse = 0.7 + 0.3 * sin(uTime * 4.2);
    gl_FragColor = vec4(vec3(1.0), uAlpha * pulse);
  }
`;

export function ChessHero() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  // svg = static fallback (SSR / no-WebGL); boot = JS loading the globe;
  // live = interactive board. The 3-piece SVG only shows on svg.
  const [phase, setPhase] = useState<"svg" | "boot" | "live">("svg");
  const [hud, setHud] = useState("LOADING BOARD…");
  const [banner, setBanner] = useState<null | { big: string; sub: string; win: boolean }>(null);
  const [labelsOn, setLabelsOn] = useState(true);
  const labelsOnRef = useRef(true);
  useEffect(() => {
    labelsOnRef.current = labelsOn;
  }, [labelsOn]);
  const resetRef = useRef<() => void>(() => {});
  const hintRef = useRef<() => void>(() => {});

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    setPhase("boot"); // JS is running — hide the static cluster immediately
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let raf = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    let ro: ResizeObserver | null = null;

    (async () => {
      try {
        const [THREE, points] = await Promise.all([import("three"), loadPoints()]);
        if (disposed) return;

        const W = () => host.clientWidth || 640;
        const H = () => host.clientHeight || 640;
        // Overscan: the canvas renders 18% past the host on every side so
        // pieces at the globe's edge are never clipped by the container.
        // FOV widens to compensate, so the globe's on-screen size is unchanged.
        const OS = 1.18;
        const CW = () => Math.round(W() * OS);
        const CH = () => Math.round(H() * OS);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        // Full device resolution (retina = 3): the single biggest crispness
        // lever — at capped DPR every particle edge is antialiased into mush.
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
        renderer.setSize(CW(), CH());
        renderer.domElement.className = "lp-chess-canvas";
        renderer.domElement.setAttribute("aria-hidden", "true");

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(51, CW() / CH(), 0.1, 30); // 44° × 1.18 overscan
        camera.position.set(0, 0.2, 3.0);
        camera.lookAt(CENTER.x, CENTER.y + 0.05, 0);

        const center = new THREE.Vector3(CENTER.x, CENTER.y, CENTER.z);
        // Everything on the planet lives in this group; rotating the group
        // rotates the world (drag + idle spin).
        const root = new THREE.Group();
        root.position.copy(center);
        scene.add(root);

        const allMats: import("three").ShaderMaterial[] = [];
        const WHITE_ARMY = new THREE.Color(1, 1, 1);
        const BLACK_ARMY = new THREE.Color(0.16, 0.18, 0.34); // dark slate, rim-lit
        const mkPieceMat = (col: import("three").Color = WHITE_ARMY, rim = 0.35) => {
          const m = new THREE.ShaderMaterial({
            uniforms: {
              uScale: { value: CH() * PT_BASE },
              uBoost: { value: 1 },
              uColor: { value: col.clone() },
              uRim: { value: rim },
            },
            vertexShader: GAME_VERT,
            fragmentShader: GAME_FRAG,
            transparent: true,
            depthWrite: false,
          });
          allMats.push(m);
          return m;
        };

        // ── The planet, checkered to MATCH the playing field ──
        // BOTH colors carry particles: light squares SOLID WHITE, dark squares
        // BLACK ink — a real checkerboard, maximum contrast on the blue.
        {
          const N = 220000; // packed tight — a near-solid board, not a dot screen
          const pos = new Float32Array(N * 3);
          const nor = new Float32Array(N * 3);
          const lum = new Float32Array(N);
          const blk = new Float32Array(N);
          let i = 0, made = 0, guard = 0;
          while (made < N && guard++ < N * 10) {
            const u = Math.random() * 2 - 1;
            const th = Math.random() * Math.PI * 2;
            const s = Math.sqrt(1 - u * u);
            const nx = s * Math.cos(th), ny = u, nz = s * Math.sin(th);
            const lat = (Math.asin(ny) * 180) / Math.PI;
            const lon = (Math.atan2(nx, nz) * 180) / Math.PI; // matches lonDeg mapping
            if (Math.abs(lat) > LAT_SPAN) continue; // no polar caps — keep it clean
            // Groove lines between cells so the 8×8 board reads clearly.
            const latIn = lat + LAT_SPAN;
            const dLat = Math.abs(latIn / BAND - Math.round(latIn / BAND)) * BAND;
            const lonIn = lon + 180;
            const dLon = Math.abs(lonIn / 45 - Math.round(lonIn / 45)) * 45 * Math.cos((lat * Math.PI) / 180);
            if (Math.min(dLat, dLon) < 0.3) continue; // hairline seam — cells sit shoulder to shoulder
            const r = Math.min(7, Math.floor(latIn / BAND));
            const f = ((Math.floor(lon / 45 + 4) % 8) + 8) % 8;
            const light = (r + f) % 2 === 0;
            // Black ink needs slightly less coverage than white to read.
            if (!light && Math.random() < 0.12) continue;
            // Slight diffuse at the surface: a few particles float just above
            // the sheet so the globe's silhouette has a soft fuzz, not a
            // machined edge.
            const lift = Math.random() < 0.05 ? 1 + Math.random() * 0.014 : 1;
            const rr = GLOBE_R * lift;
            pos[i] = nx * rr; pos[i + 1] = ny * rr; pos[i + 2] = nz * rr;
            nor[i] = nx; nor[i + 1] = ny; nor[i + 2] = nz;
            lum[made] = light ? (Math.random() > 0.9 ? 1 : 0.96) : 1;
            blk[made] = light ? 0 : 1;
            i += 3; made++;
          }
          const geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.BufferAttribute(pos.slice(0, made * 3), 3));
          geo.setAttribute("normal", new THREE.BufferAttribute(nor.slice(0, made * 3), 3));
          geo.setAttribute("aLum", new THREE.BufferAttribute(lum.slice(0, made), 1));
          geo.setAttribute("aBlack", new THREE.BufferAttribute(blk.slice(0, made), 1));
          const m = mkPieceMat(WHITE_ARMY, 0.2);
          m.uniforms.uScale.value = CH() * PT_BASE * 0.95;
          m.userData.scaleMul = 0.95;
          root.add(new THREE.Points(geo, m));
        }

        // ── Cell frames ──
        const upY = new THREE.Vector3(0, 1, 0);
        function cellNormal(f: number, r: number, out: import("three").Vector3) {
          const la = (latDeg(r) * Math.PI) / 180;
          const lo = (lonDeg(f) * Math.PI) / 180;
          out.set(Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo));
          return out;
        }
        function frameFor(f: number, r: number, color: "white" | "black", scale: number) {
          const n = cellNormal(f, r, new THREE.Vector3());
          const posLocal = n.clone().multiplyScalar(GLOBE_R + (scale / 2) * 0.98);
          // Face the enemy: forward = tangent toward the opposing pole.
          const poleSign = color === "white" ? 1 : -1;
          const fwd = new THREE.Vector3(0, poleSign, 0).addScaledVector(n, -poleSign * n.y).normalize();
          const right = new THREE.Vector3().crossVectors(fwd, n).normalize();
          const back = new THREE.Vector3().crossVectors(right, n);
          const m4 = new THREE.Matrix4().makeBasis(right, n, back);
          const q = new THREE.Quaternion().setFromRotationMatrix(m4);
          return { posLocal, q, n };
        }

        // ── Game state + piece objects ──
        let game: GameState = initialState();
        // DOM layer for piece name tags — overlays the (overscanned) canvas.
        const labelLayer = document.createElement("div");
        labelLayer.className = "lp-chess-labels";
        labelLayer.setAttribute("aria-hidden", "true");
        host.appendChild(labelLayer);
        type Vis = {
          piece: GamePiece;
          obj: import("three").Points;
          proxy: import("three").Mesh;
          mat: import("three").ShaderMaterial;
          label: HTMLDivElement;
          scale: number;
          anim: null | {
            from: import("three").Vector3;
            to: import("three").Vector3;
            qFrom: import("three").Quaternion;
            qTo: import("three").Quaternion;
            t: number;
          };
        };
        const visuals: Vis[] = [];
        type Flyer = {
          obj: import("three").Points;
          mat: import("three").ShaderMaterial;
          vel: import("three").Vector3;
          spin: import("three").Vector3;
          life: number;
        };
        const flyers: Flyer[] = [];

        // Densified point clouds, built once per piece type.
        const dense = new Map<string, PieceData>();
        function denseData(type: string): PieceData {
          let d = dense.get(type);
          if (!d) {
            const src = points.get(type)!;
            // Tight jitter (0.0035 vs the 0.006 default) keeps the extra
            // points hugging the surface — solid shape, not fuzz.
            d = densify(src, Math.ceil(SAMPLES[type] / src.meta.count), 0.0035);
            dense.set(type, d);
          }
          return d;
        }

        function pieceGeometry(type: string, scale: number, withFinial: boolean) {
          const data = denseData(type);
          const want = SAMPLES[type];
          const stride = Math.max(1, Math.floor(data.meta.count / want));
          const bodyN = Math.floor(data.meta.count / stride);
          // Top of the piece (for the black finial ball). Data y is normalized
          // 0..1; centered geometry puts the tip at ~+scale/2.
          let topY = -Infinity;
          for (let k = 0; k < bodyN; k++) topY = Math.max(topY, data.pos[k * stride * 3 + 1]);
          const finialN = withFinial ? Math.round(bodyN * 0.05) + 30 : 0;
          // Base skirt: a dense ring of particles at the foot so every piece
          // visibly SITS on the board instead of hovering over it.
          const baseN = Math.round(bodyN * 0.12) + 120;
          const n = bodyN + finialN + baseN;
          const pos = new Float32Array(n * 3);
          const nor = new Float32Array(n * 3);
          const lum = new Float32Array(n).fill(0.92);
          const blk = new Float32Array(n);
          for (let k = 0; k < bodyN; k++) {
            const src = k * stride * 3;
            pos[k * 3] = data.pos[src] * scale;
            pos[k * 3 + 1] = data.pos[src + 1] * scale - scale / 2;
            pos[k * 3 + 2] = data.pos[src + 2] * scale;
            nor[k * 3] = data.nor[src];
            nor[k * 3 + 1] = data.nor[src + 1];
            nor[k * 3 + 2] = data.nor[src + 2];
          }
          // Black finial: a small solid ball of pure-black particles at the tip.
          const cy = topY * scale - scale / 2 + scale * 0.05;
          const rad = scale * 0.1;
          for (let k = 0; k < finialN; k++) {
            const o = bodyN + k;
            const u = Math.random() * 2 - 1;
            const th = Math.random() * Math.PI * 2;
            const s = Math.sqrt(1 - u * u) * (0.55 + Math.random() * 0.45);
            const nx = s * Math.cos(th), ny = u, nz = s * Math.sin(th);
            pos[o * 3] = nx * rad;
            pos[o * 3 + 1] = cy + ny * rad;
            pos[o * 3 + 2] = nz * rad;
            nor[o * 3] = nx; nor[o * 3 + 1] = ny; nor[o * 3 + 2] = nz;
            lum[o] = 1;
            blk[o] = 1;
          }
          // Skirt ring: hugs the base radius, slightly flared, a couple of
          // particle-widths tall — a solid visual footing.
          const baseR = data.meta.baseR * scale;
          for (let k = 0; k < baseN; k++) {
            const o = bodyN + finialN + k;
            const a = Math.random() * Math.PI * 2;
            const rr = baseR * (0.86 + Math.random() * 0.3);
            const yy = -scale / 2 + Math.random() * scale * 0.035;
            pos[o * 3] = Math.cos(a) * rr;
            pos[o * 3 + 1] = yy;
            pos[o * 3 + 2] = Math.sin(a) * rr;
            nor[o * 3] = Math.cos(a) * 0.8; nor[o * 3 + 1] = 0.6; nor[o * 3 + 2] = Math.sin(a) * 0.8;
            lum[o] = 1;
            blk[o] = 0;
          }
          const geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
          geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
          geo.setAttribute("aLum", new THREE.BufferAttribute(lum, 1));
          geo.setAttribute("aBlack", new THREE.BufferAttribute(blk, 1));
          return geo;
        }

        function placeAtCell(v: Vis) {
          const { posLocal, q } = frameFor(v.piece.file, v.piece.rank, v.piece.color, v.scale);
          v.obj.position.copy(posLocal);
          v.obj.quaternion.copy(q);
          v.proxy.position.copy(posLocal);
          v.proxy.quaternion.copy(q);
        }

        function buildPieces() {
          for (const v of visuals) {
            root.remove(v.obj, v.proxy);
            v.obj.geometry.dispose();
            v.label.remove();
          }
          visuals.length = 0;
          for (const p of game.pieces) {
            const scale = SCALES[p.type];
            // Black finial only on the dark army (white pieces stay clean white).
            const geo = pieceGeometry(p.type, scale, p.color === "black");
            const mat = p.color === "black" ? mkPieceMat(BLACK_ARMY, 0.9) : mkPieceMat(WHITE_ARMY, 0.28);
            const obj = new THREE.Points(geo, mat);
            const data = points.get(p.type)!;
            const proxy = new THREE.Mesh(
              new THREE.CylinderGeometry(data.meta.maxR * scale * 1.35, data.meta.baseR * scale * 1.35, scale * 1.1, 8),
              new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
            );
            proxy.userData.pieceId = p.id;
            root.add(obj, proxy);
            const label = document.createElement("div");
            label.className = `lp-piece-tag lp-piece-tag--${p.color}`;
            label.textContent = p.type.toUpperCase();
            labelLayer.appendChild(label);
            const v: Vis = { piece: p, obj, proxy, mat, label, scale, anim: null };
            placeAtCell(v);
            visuals.push(v);
          }
        }

        // ── Highlights ──
        const ringGeo = (() => {
          const n = 64;
          const pos = new Float32Array(n * 3);
          const nor = new Float32Array(n * 3);
          for (let k = 0; k < n; k++) {
            const a = (k / n) * Math.PI * 2;
            pos[k * 3] = Math.cos(a) * 0.155;
            pos[k * 3 + 1] = 0;
            pos[k * 3 + 2] = Math.sin(a) * 0.155;
            nor[k * 3 + 1] = 1;
          }
          const g = new THREE.BufferGeometry();
          g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
          g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
          return g;
        })();
        const mkRing = (alpha: number) => {
          const m = new THREE.ShaderMaterial({
            uniforms: { uScale: { value: CH() * 0.0075 }, uTime: { value: 0 }, uAlpha: { value: alpha } },
            vertexShader: RING_VERT,
            fragmentShader: RING_FRAG,
            transparent: true,
            depthWrite: false,
          });
          const p = new THREE.Points(ringGeo, m);
          p.visible = false;
          root.add(p);
          return { p, m };
        };
        const moveRings = Array.from({ length: 30 }, () => mkRing(0.85));
        const selRing = mkRing(1.0);
        // The hint target: a wider, brighter ring on the recommended square.
        const hintRing = mkRing(1.0);
        hintRing.m.uniforms.uScale.value = CH() * 0.0105;
        // Invisible discs to click target squares.
        const discGeo = new THREE.CircleGeometry(0.18, 12);
        const moveDiscs = Array.from({ length: 30 }, () => {
          const mesh = new THREE.Mesh(
            discGeo,
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
          );
          mesh.visible = false;
          root.add(mesh);
          return mesh;
        });

        let selected: Vis | null = null;

        function clearHighlights() {
          if (selected) selected.mat.uniforms.uBoost.value = 1;
          selected = null;
          selRing.p.visible = false;
          hintRing.p.visible = false;
          moveRings.forEach((r) => (r.p.visible = false));
          moveDiscs.forEach((d) => (d.visible = false));
        }

        const qTmp = new THREE.Quaternion();
        function ringToCell(obj: { position: import("three").Vector3; quaternion: import("three").Quaternion }, f: number, r: number, lift = 0.012) {
          const n = cellNormal(f, r, new THREE.Vector3());
          obj.position.copy(n).multiplyScalar(GLOBE_R + lift);
          qTmp.setFromUnitVectors(upY, n);
          obj.quaternion.copy(qTmp);
        }

        function select(v: Vis) {
          clearHighlights();
          selected = v;
          v.mat.uniforms.uBoost.value = 1.5;
          ringToCell(selRing.p, v.piece.file, v.piece.rank);
          selRing.p.visible = true;
          const targets = legalMoves(game, v.piece);
          targets.forEach((m, i) => {
            if (i >= moveRings.length) return;
            ringToCell(moveRings[i].p, m.file, m.rank);
            moveRings[i].p.visible = true;
            const n = cellNormal(m.file, m.rank, new THREE.Vector3());
            moveDiscs[i].position.copy(n).multiplyScalar(GLOBE_R + 0.02);
            moveDiscs[i].quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
            moveDiscs[i].visible = true;
            moveDiscs[i].userData.move = m;
          });
        }

        function launchCapture(target: GamePiece) {
          const idx = visuals.findIndex((x) => x.piece.id === target.id);
          if (idx < 0) return;
          const v = visuals[idx];
          root.remove(v.proxy);
          v.label.remove();
          const n = cellNormal(target.file, target.rank, new THREE.Vector3());
          flyers.push({
            obj: v.obj,
            mat: v.mat,
            vel: n.clone().multiplyScalar(1.6).add(new THREE.Vector3((Math.random() - 0.5) * 0.8, 0.4, (Math.random() - 0.5) * 0.8)),
            spin: new THREE.Vector3(Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 4 - 2),
            life: 1,
          });
          visuals.splice(idx, 1);
        }

        let aiTimer: ReturnType<typeof setTimeout> | null = null;

        function commitMove(v: Vis, m: Move) {
          if (m.capture) launchCapture(m.capture);
          const fromP = v.obj.position.clone();
          const fromQ = v.obj.quaternion.clone();
          const { promoted } = applyMove(game, v.piece, m);
          if (promoted) {
            v.obj.geometry.dispose();
            v.scale = SCALES.queen;
            v.obj.geometry = pieceGeometry("queen", v.scale, v.piece.color === "black");
            v.label.textContent = "QUEEN";
          }
          const { posLocal, q } = frameFor(v.piece.file, v.piece.rank, v.piece.color, v.scale);
          if (reduced) placeAtCell(v);
          else v.anim = { from: fromP, to: posLocal, qFrom: fromQ, qTo: q, t: 0 };
          setHud(statusText(game));
          if (game.result) {
            const r = game.result;
            setTimeout(() => {
              if (disposed) return;
              if (r.reason === "stalemate") setBanner({ big: "Stalemate.", sub: "Nobody blinked. Run it back?", win: false });
              else if (r.winner === "white") setBanner({ big: "Congratulations!", sub: "Strategy was on point.", win: true });
              else setBanner({ big: "Checkmate.", sub: "Let's work on that strategy for next time.", win: false });
            }, 700);
          }
        }

        // Black is a deliberately dumb opponent: it plays a random legal move,
        // almost instantly, so a person crushes it. Prefers captures a little
        // just so it isn't lifeless.
        function playAi() {
          if (game.result || game.turn !== "black") return;
          const movers = visuals.filter((v) => v.piece.color === "black" && v.piece.alive);
          const options: { v: Vis; m: Move }[] = [];
          for (const v of movers) for (const m of legalMoves(game, v.piece)) options.push({ v, m });
          if (!options.length) return;
          // Easy-win tuning: it rarely captures, and when it can take your
          // queen it usually "doesn't notice."
          const caps = options.filter((o) => o.m.capture && !(o.m.capture.type === "queen" && Math.random() < 0.75));
          const pool = caps.length && Math.random() < 0.2 ? caps : options;
          const pick = pool[Math.floor(Math.random() * pool.length)];
          commitMove(pick.v, pick.m);
        }

        function doMove(m: Move) {
          if (!selected) return;
          commitMove(selected, m);
          clearHighlights();
          if (!game.result && game.turn === "black") {
            if (aiTimer) clearTimeout(aiTimer);
            aiTimer = setTimeout(playAi, 260); // snappy but readable
          }
        }

        // ── Hint: a one-ply coach. Value captured material, reward checks
        // and mate, punish hanging the mover — then light the best move up.
        const VAL: Record<string, number> = { pawn: 1, knight: 3, bishop: 3.1, rook: 5, queen: 9, king: 0 };
        function scoreMove(p: GamePiece, m: Move): number {
          let sc = m.capture ? VAL[m.capture.type] * 10 : 0;
          const undoF = p.file, undoR = p.rank, cap = m.capture;
          if (cap) cap.alive = false;
          p.file = m.file; p.rank = m.rank;
          if (inCheck(game, "black")) {
            sc += 4;
            // Mate? No black piece has a legal reply.
            const mate = !game.pieces.some((q) => q.alive && q.color === "black" && legalMoves(game, q).length > 0);
            if (mate) sc += 10000;
          }
          if (isAttacked(game, m.file, m.rank, "black")) sc -= VAL[p.type] * 8;
          if (p.type === "pawn") sc += m.rank * 0.3; // march toward promotion
          sc += Math.random(); // break ties differently each press
          p.file = undoF; p.rank = undoR;
          if (cap) cap.alive = true;
          return sc;
        }
        hintRef.current = () => {
          if (game.result || game.turn !== "white") return;
          let best: { v: Vis; m: Move; sc: number } | null = null;
          for (const v of visuals) {
            if (v.piece.color !== "white" || !v.piece.alive) continue;
            for (const m of legalMoves(game, v.piece)) {
              const sc = scoreMove(v.piece, m);
              if (!best || sc > best.sc) best = { v, m, sc };
            }
          }
          if (!best) return;
          select(best.v);
          ringToCell(hintRing.p, best.m.file, best.m.rank, 0.02);
          hintRing.p.visible = true;
          setHud(`HINT — ${best.v.piece.type.toUpperCase()} TO THE MARKED SQUARE`);
        };

        resetRef.current = () => {
          if (aiTimer) clearTimeout(aiTimer);
          clearHighlights();
          for (const fl of flyers) {
            root.remove(fl.obj);
            fl.obj.geometry.dispose();
          }
          flyers.length = 0;
          game = initialState();
          buildPieces();
          setBanner(null);
          setHud(statusText(game));
        };

        buildPieces();
        setHud(statusText(game));
        host.appendChild(renderer.domElement);
        setReady(true);
        setPhase("live");

        // ── Pointer: drag to rotate, click/tap to play ──
        let spin = 0;
        let dragging = false;
        let downX = 0, downY = 0, spin0 = 0;
        let lastInteract = performance.now();
        const ray = new THREE.Raycaster();
        const ndc = new THREE.Vector2();
        const vTip = new THREE.Vector3();
        const vDir = new THREE.Vector3();

        const el = renderer.domElement;
        el.style.cursor = "grab";
        el.addEventListener("pointerdown", (ev) => {
          downX = ev.clientX; downY = ev.clientY; spin0 = spin;
          dragging = false;
          el.setPointerCapture(ev.pointerId);
        });
        el.addEventListener("pointermove", (ev) => {
          if (ev.buttons !== 1) return;
          const dx = ev.clientX - downX;
          if (!dragging && Math.abs(dx) + Math.abs(ev.clientY - downY) > 7) dragging = true;
          if (dragging) {
            spin = spin0 + dx * 0.009;
            lastInteract = performance.now();
            el.style.cursor = "grabbing";
          }
        });
        el.addEventListener("pointerup", (ev) => {
          el.style.cursor = "grab";
          lastInteract = performance.now();
          if (dragging) return;
          const rct = el.getBoundingClientRect();
          ndc.set(((ev.clientX - rct.left) / rct.width) * 2 - 1, -((ev.clientY - rct.top) / rct.height) * 2 + 1);
          ray.setFromCamera(ndc, camera);
          // Move targets first…
          const discHits = ray.intersectObjects(moveDiscs.filter((d) => d.visible));
          if (discHits.length) {
            doMove(discHits[0].object.userData.move as Move);
            return;
          }
          // …then pieces.
          const hits = ray.intersectObjects(visuals.map((v) => v.proxy));
          if (!hits.length) {
            clearHighlights();
            return;
          }
          const v = visuals.find((x) => x.proxy === hits[0].object)!;
          if (game.result) return;
          // Clicking an enemy piece you can legally take = take it. (Aiming at
          // the tiny square disc under a piece is fiddly; the piece IS the target.)
          if (selected && v.piece.color === "black") {
            const cap = legalMoves(game, selected.piece).find(
              (m) => m.file === v.piece.file && m.rank === v.piece.rank,
            );
            if (cap) {
              doMove(cap);
              return;
            }
          }
          // Human plays White only; Black is the auto opponent.
          if (v.piece.color !== "white" || game.turn !== "white") {
            clearHighlights();
            return;
          }
          if (selected === v) clearHighlights();
          else select(v);
        });

        // ── Frame loop ──
        const clock = new THREE.Clock();
        let time = 0;
        function frame() {
          if (disposed) return;
          raf = requestAnimationFrame(frame);
          const dt = Math.min(clock.getDelta(), 0.05);
          time += dt;

          // Idle spin only when nothing is selected and the player is idle.
          if (!reduced && !selected && performance.now() - lastInteract > 3500) {
            spin += 0.045 * dt;
          }
          root.rotation.y = spin;

          // Move animation: arc between squares with a lift.
          for (const v of visuals) {
            if (!v.anim) continue;
            v.anim.t = Math.min(1, v.anim.t + dt / 0.3);
            const e = 1 - Math.pow(1 - v.anim.t, 3);
            v.obj.position.lerpVectors(v.anim.from, v.anim.to, e);
            const lift = Math.sin(Math.PI * e) * 0.12;
            v.obj.position.multiplyScalar(1 + lift / Math.max(0.001, v.obj.position.length()));
            v.obj.quaternion.slerpQuaternions(v.anim.qFrom, v.anim.qTo, e);
            v.proxy.position.copy(v.obj.position);
            v.proxy.quaternion.copy(v.obj.quaternion);
            if (v.anim.t >= 1) {
              v.anim = null;
              placeAtCell(v);
            }
          }

          // Captured pieces fly off and dissolve.
          for (let k = flyers.length - 1; k >= 0; k--) {
            const fl = flyers[k];
            fl.life -= dt / 1.4;
            fl.obj.position.addScaledVector(fl.vel, dt);
            fl.obj.rotation.x += fl.spin.x * dt;
            fl.obj.rotation.y += fl.spin.y * dt;
            fl.obj.rotation.z += fl.spin.z * dt;
            fl.mat.uniforms.uBoost.value = Math.max(0, fl.life) * 1.2;
            if (fl.life <= 0) {
              root.remove(fl.obj);
              fl.obj.geometry.dispose();
              flyers.splice(k, 1);
            }
          }

          // Piece name tags: project each piece's crown to the label layer;
          // hide tags on the far side of the planet.
          if (labelsOnRef.current) {
            labelLayer.style.display = "";
            const lw = labelLayer.clientWidth, lh = labelLayer.clientHeight;
            for (const v of visuals) {
              vTip.set(0, v.scale * 0.66, 0);
              v.obj.localToWorld(vTip);
              vDir.copy(vTip).sub(center);
              if (vDir.z < 0.22) { v.label.style.opacity = "0"; continue; }
              vTip.project(camera);
              const x = ((vTip.x + 1) / 2) * lw;
              const y = ((1 - vTip.y) / 2) * lh;
              v.label.style.opacity = String(Math.min(1, (vDir.z - 0.22) * 3.2));
              v.label.style.transform = `translate(-50%, -100%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
            }
          } else {
            labelLayer.style.display = "none";
          }

          // Pulse the rings.
          selRing.m.uniforms.uTime.value = time;
          hintRing.m.uniforms.uTime.value = time;
          moveRings.forEach((r) => (r.m.uniforms.uTime.value = time));

          renderer!.render(scene, camera);
        }
        frame();

        const onResize = () => {
          if (!renderer) return;
          renderer.setSize(CW(), CH());
          camera.aspect = W() / H();
          camera.updateProjectionMatrix();
          const base = H() * PT_BASE;
          for (const m of allMats) {
            const mul = (m.userData.scaleMul as number) ?? 1;
            m.uniforms.uScale.value = base * mul;
          }
          selRing.m.uniforms.uScale.value = CH() * 0.0075;
          hintRing.m.uniforms.uScale.value = CH() * 0.0105;
          moveRings.forEach((r) => (r.m.uniforms.uScale.value = CH() * 0.0075));
        };
        ro = new ResizeObserver(onResize);
        ro.observe(host);

        // Test hook (harmless): lets QA click exact cells.
        (window as unknown as Record<string, unknown>).__spChess = {
          screen: (f: number, r: number) => {
            const n = cellNormal(f, r, new THREE.Vector3());
            const world = n.multiplyScalar(GLOBE_R + 0.05).applyMatrix4(root.matrixWorld);
            const p = world.project(camera);
            const rct = el.getBoundingClientRect();
            return [rct.left + ((p.x + 1) / 2) * rct.width, rct.top + ((1 - p.y) / 2) * rct.height];
          },
          state: () => ({ turn: game.turn, selected: !!selected, result: game.result }),
          spin: () => spin,
        };
      } catch {
        setHud("");
        setPhase("svg"); // WebGL/fetch failed — restore the static fallback
      }
    })();

    return () => {
      disposed = true;
      hostRef.current?.querySelector(".lp-chess-labels")?.remove();
      cancelAnimationFrame(raf);
      ro?.disconnect();
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, []);

  return (
    <div ref={hostRef} className={`lp-chess lp-chess-hero${ready ? " is-live" : ""} lp-phase-${phase}`}>
      {/* Static 3-piece cluster: only for SSR / no-WebGL (phase svg). */}
      {phase === "svg" ? (
        <div className="lp-chess-fallback" aria-hidden="true" dangerouslySetInnerHTML={{ __html: particleChessCluster("sp-hero") }} />
      ) : null}
      {/* While the globe loads, a quiet placeholder ring — never the old cluster. */}
      {phase === "boot" ? <div className="lp-chess-boot" aria-hidden="true" /> : null}
      {ready ? (
        <div className="lp-game-hud">
          <span aria-live="polite">{hud}</span>
          <button type="button" onClick={() => hintRef.current()}>Hint</button>
          <button type="button" aria-pressed={labelsOn} onClick={() => setLabelsOn((v) => !v)}>
            {labelsOn ? "Labels: on" : "Labels: off"}
          </button>
          <button type="button" onClick={() => resetRef.current()}>Reset</button>
        </div>
      ) : null}
      {banner ? (
        <div className={`lp-chess-banner${banner.win ? " is-win" : ""}`} role="status">
          <strong>{banner.big}</strong>
          <span>{banner.sub}</span>
          <button type="button" onClick={() => resetRef.current()}>Play again</button>
        </div>
      ) : null}
    </div>
  );
}
