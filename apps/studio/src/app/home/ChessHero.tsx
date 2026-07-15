"use client";

// ============================================================
//  Interactive particle chess — the hero's main event.
//
//  Real Staunton geometry ("A Beautiful Game", © 2020 ASWF /
//  © 2022 Ed Mackey, CC BY 4.0 — see the site footer credit),
//  pre-sampled into point clouds (public/chess-points.bin) and
//  rendered as white particles in WebGL. Every piece is a real
//  rigid body: click one and it topples, rolls, and collides
//  with the others (cannon-es), then everything glides back to
//  its square. Server-rendered SVG stays as the fallback for
//  no-JS / no-WebGL / reduced-motion.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { particleChessCluster } from "./chess-art";

type PieceMeta = { name: string; count: number; baseR: number; maxR: number };

// Hero cast and staging: real-set relative heights, knight turned toward camera.
const CAST: { name: string; x: number; scale: number; rotY: number }[] = [
  { name: "bishop", x: -0.78, scale: 0.8, rotY: 0.4 },
  { name: "queen", x: 0.0, scale: 1.0, rotY: 0 },
  { name: "knight", x: 0.74, scale: 0.72, rotY: -2.35 },
];

async function loadPoints(url: string): Promise<Map<string, { meta: PieceMeta; pos: Float32Array; nor: Float32Array }>> {
  const buf = await (await fetch(url)).arrayBuffer();
  const dv = new DataView(buf);
  const hlen = dv.getUint32(0, true);
  const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hlen))) as { pieces: PieceMeta[] };
  let off = 4 + hlen;
  const out = new Map();
  for (const meta of header.pieces) {
    const pos = new Float32Array(meta.count * 3);
    const i16 = new Int16Array(buf, off, meta.count * 3);
    for (let i = 0; i < i16.length; i++) pos[i] = i16[i] / 20000;
    off += i16.byteLength;
    const nor = new Float32Array(meta.count * 3);
    const i8 = new Int8Array(buf, off, meta.count * 3);
    for (let i = 0; i < i8.length; i++) nor[i] = i8[i] / 127;
    off += i8.byteLength;
    out.set(meta.name, { meta, pos, nor });
  }
  return out;
}

const VERT = /* glsl */ `
  uniform float uScale;
  varying float vL;
  void main() {
    vec3 n = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 lightDir = normalize(vec3(-0.45, 0.55, 0.8));
    float diff = max(dot(normalize(mat3(modelMatrix) * normal), lightDir), 0.0);
    float rim = pow(1.0 - abs(n.z), 2.0);
    vL = clamp(0.12 + diff * 0.72 + rim * 0.5, 0.0, 1.0);
    gl_PointSize = (0.9 + vL * 1.6) * uScale * (300.0 / max(60.0, -mv.z * 100.0));
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAG = /* glsl */ `
  varying float vL;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float edge = smoothstep(0.5, 0.32, d);
    gl_FragColor = vec4(vec3(1.0), (0.1 + vL * 0.9) * edge);
  }
`;

export function ChessHero() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let raf = 0;
    let renderer: import("three").WebGLRenderer | null = null;

    (async () => {
      try {
        const [THREE, CANNON, points] = await Promise.all([
          import("three"),
          import("cannon-es"),
          loadPoints("/chess-points.bin"),
        ]);
        if (disposed) return;

        const W = () => host.clientWidth || 640;
        const H = () => host.clientHeight || 520;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
        renderer.setSize(W(), H());
        renderer.domElement.className = "lp-chess-canvas";
        renderer.domElement.setAttribute("aria-hidden", "true");

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, W() / H(), 0.1, 20);
        camera.position.set(0, 0.62, 3.6);
        camera.lookAt(0, 0.42, 0);

        // Physics
        const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.8, 0) });
        world.allowSleep = true;
        const ground = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Plane() });
        ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        world.addBody(ground);

        type Piece = {
          obj: import("three").Points;
          proxy: import("three").Mesh;
          body: import("cannon-es").Body;
          home: { x: number; scale: number; rotY: number; h: number };
        };
        const pieces: Piece[] = [];

        for (const cast of CAST) {
          const data = points.get(cast.name)!;
          const s = cast.scale;
          const h = s; // normalized height 1 × scale
          const half = h / 2;

          // Geometry with origin at the piece's center of mass.
          const pos = new Float32Array(data.pos.length);
          for (let i = 0; i < data.pos.length; i += 3) {
            pos[i] = data.pos[i] * s;
            pos[i + 1] = data.pos[i + 1] * s - half;
            pos[i + 2] = data.pos[i + 2] * s;
          }
          const geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
          geo.setAttribute("normal", new THREE.BufferAttribute(data.nor.slice(), 3));
          const mat = new THREE.ShaderMaterial({
            uniforms: { uScale: { value: H() * 0.0085 } },
            vertexShader: VERT,
            fragmentShader: FRAG,
            transparent: true,
            depthWrite: false,
          });
          const obj = new THREE.Points(geo, mat);
          scene.add(obj);

          // Invisible click proxy (slightly padded cylinder).
          const proxy = new THREE.Mesh(
            new THREE.CylinderGeometry(data.meta.maxR * s * 1.15, data.meta.baseR * s * 1.15, h, 12),
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
          );
          scene.add(proxy);

          // Rigid body: a cylinder matched to the base footprint.
          const body = new CANNON.Body({
            mass: 1.1,
            shape: new CANNON.Cylinder(data.meta.maxR * s * 0.72, data.meta.baseR * s * 0.95, h, 10),
            position: new CANNON.Vec3(cast.x, half + 0.001, 0),
            material: new CANNON.Material({ friction: 0.38, restitution: 0.32 }),
            angularDamping: 0.12,
            linearDamping: 0.06,
          });
          body.quaternion.setFromEuler(0, cast.rotY, 0);
          body.allowSleep = true;
          body.sleepSpeedLimit = 0.16;
          body.sleepTimeLimit = 0.6;
          body.sleep();
          world.addBody(body);

          pieces.push({ obj, proxy, body, home: { x: cast.x, scale: s, rotY: cast.rotY, h } });
        }

        // Piece-vs-piece contacts get a little bounce.
        world.defaultContactMaterial.friction = 0.35;
        world.defaultContactMaterial.restitution = 0.3;

        host.appendChild(renderer.domElement);
        setReady(true);

        // ── Interaction ──
        const ray = new THREE.Raycaster();
        const ndc = new THREE.Vector2();
        let lastPokeAt = 0;
        let resetting = false;
        let resetStart = 0;
        const resetFrom: { p: import("three").Vector3; q: import("three").Quaternion }[] = [];

        function poke(ev: PointerEvent) {
          if (reduced || resetting) return;
          const r = renderer!.domElement.getBoundingClientRect();
          ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
          ray.setFromCamera(ndc, camera);
          const hits = ray.intersectObjects(pieces.map((p) => p.proxy));
          if (!hits.length) return;
          const hit = hits[0];
          const piece = pieces.find((p) => p.proxy === hit.object)!;
          piece.body.wakeUp();
          const dir = ray.ray.direction.clone();
          const impulse = new CANNON.Vec3(dir.x * 2.6, 0.9, dir.z * 2.6 - 0.6);
          const rel = new CANNON.Vec3(
            hit.point.x - piece.body.position.x,
            Math.max(0.18, hit.point.y - piece.body.position.y),
            hit.point.z - piece.body.position.z,
          );
          piece.body.applyImpulse(impulse, rel);
          lastPokeAt = performance.now();
        }
        renderer.domElement.addEventListener("pointerdown", poke);
        renderer.domElement.style.cursor = reduced ? "default" : "pointer";

        function beginReset() {
          resetting = true;
          resetStart = performance.now();
          resetFrom.length = 0;
          for (const p of pieces) {
            p.body.sleep();
            resetFrom.push({ p: p.obj.position.clone(), q: p.obj.quaternion.clone() });
          }
        }

        const clock = new THREE.Clock();
        const homeQ = pieces.map((p) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.home.rotY));

        function frame() {
          if (disposed) return;
          raf = requestAnimationFrame(frame);
          const dt = Math.min(clock.getDelta(), 0.05);

          if (!resetting) {
            world.step(1 / 60, dt, 3);
            const anyAwake = pieces.some((p) => p.body.sleepState !== CANNON.Body.SLEEPING);
            for (const p of pieces) {
              p.obj.position.set(p.body.position.x, p.body.position.y, p.body.position.z);
              p.obj.quaternion.set(p.body.quaternion.x, p.body.quaternion.y, p.body.quaternion.z, p.body.quaternion.w);
              p.proxy.position.copy(p.obj.position);
              p.proxy.quaternion.copy(p.obj.quaternion);
            }
            // Everything settled (or wandered too long) → glide home.
            if (lastPokeAt && (!anyAwake || performance.now() - lastPokeAt > 9000)) {
              lastPokeAt = 0;
              beginReset();
            }
          } else {
            const t = Math.min(1, (performance.now() - resetStart) / 1100);
            const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
            pieces.forEach((p, i) => {
              p.obj.position.lerpVectors(resetFrom[i].p, new THREE.Vector3(p.home.x, p.home.h / 2 + 0.001, 0), e);
              p.obj.quaternion.slerpQuaternions(resetFrom[i].q, homeQ[i], e);
              p.proxy.position.copy(p.obj.position);
              p.proxy.quaternion.copy(p.obj.quaternion);
            });
            if (t >= 1) {
              pieces.forEach((p, i) => {
                p.body.position.set(p.home.x, p.home.h / 2 + 0.001, 0);
                p.body.quaternion.set(homeQ[i].x, homeQ[i].y, homeQ[i].z, homeQ[i].w);
                p.body.velocity.setZero();
                p.body.angularVelocity.setZero();
                p.body.sleep();
              });
              resetting = false;
            }
          }
          renderer!.render(scene, camera);
        }
        frame();

        const onResize = () => {
          if (!renderer) return;
          renderer.setSize(W(), H());
          camera.aspect = W() / H();
          camera.updateProjectionMatrix();
          pieces.forEach((p) => {
            (p.obj.material as import("three").ShaderMaterial).uniforms.uScale.value = H() * 0.0085;
          });
        };
        const ro = new ResizeObserver(onResize);
        ro.observe(host);
        window.addEventListener("resize", onResize);
      } catch {
        // WebGL/fetch failed — the SVG fallback simply stays.
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, []);

  return (
    <div ref={hostRef} className={`lp-chess lp-chess-hero${ready ? " is-live" : ""}`} aria-hidden="true">
      {/* Server-rendered fallback — hidden once the canvas is live. */}
      <div className="lp-chess-fallback" dangerouslySetInnerHTML={{ __html: particleChessCluster("sp-hero") }} />
    </div>
  );
}
