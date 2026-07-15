"use client";

// ============================================================
//  The hero: a particle chessboard GLOBE (little-planet shot,
//  from Hans's sketch) with real Staunton pieces standing
//  radially on its surface — all of it made of particles.
//
//  Geometry: "A Beautiful Game" (© 2020 ASWF / © 2022 Ed
//  Mackey, CC BY 4.0 — credited in the footer), pre-sampled
//  into point clouds (public/chess-points.bin). The globe is
//  ~16K particles in a lat/long checkerboard; pieces are 4.2K
//  particles each. Physics is central gravity: click a piece
//  and it tumbles around the planet, collides, then glides
//  back to its square. SVG fallback stays for no-JS/no-WebGL/
//  reduced-motion.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { particleChessCluster } from "./chess-art";
import { FRAG, VERT, loadPoints } from "./points-lib";

const GLOBE_R = 0.9;
const GLOBE_CENTER = { x: 0.42, y: -0.04, z: 0.0 };

// Radial cast around the visible rim (angles clockwise from 12 o'clock,
// in the screen plane), pushed slightly toward the camera so every piece
// sits on the front of the planet. Mixed sizes, like the sketch.
const CAST: { name: string; deg: number; scale: number; spin: number }[] = [
  { name: "bishop", deg: 0, scale: 0.44, spin: 0.2 },
  { name: "knight", deg: 38, scale: 0.4, spin: -2.4 },
  { name: "pawn", deg: 74, scale: 0.27, spin: 0 },
  { name: "queen", deg: 108, scale: 0.46, spin: 0.4 },
  { name: "pawn", deg: 145, scale: 0.26, spin: 0.9 },
  { name: "rook", deg: 197, scale: 0.34, spin: 0.1 },
  { name: "king", deg: 237, scale: 0.5, spin: -0.3 },
  { name: "pawn", deg: 270, scale: 0.27, spin: 1.7 },
  { name: "knight", deg: 316, scale: 0.4, spin: 2.6 },
];

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
    let ro: ResizeObserver | null = null;

    (async () => {
      try {
        const [THREE, CANNON, points] = await Promise.all([
          import("three"),
          import("cannon-es"),
          loadPoints("/chess-points.bin"),
        ]);
        if (disposed) return;

        const W = () => host.clientWidth || 640;
        const H = () => host.clientHeight || 640;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(W(), H());
        renderer.domElement.className = "lp-chess-canvas";
        renderer.domElement.setAttribute("aria-hidden", "true");

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, W() / H(), 0.1, 30);
        camera.position.set(0.05, 0.0, 3.95);
        camera.lookAt(GLOBE_CENTER.x, GLOBE_CENTER.y, 0);

        const center = new THREE.Vector3(GLOBE_CENTER.x, GLOBE_CENTER.y, GLOBE_CENTER.z);
        let globePts: import("three").Points | null = null;
        let spin = 0; // planet rotation angle (radians)
        const SPIN_RATE = reduced ? 0 : 0.055;
        const yAxis = new THREE.Vector3(0, 1, 0);
        const spinQ = new THREE.Quaternion();
        const tmpV = new THREE.Vector3();
        const tmpQ = new THREE.Quaternion();
        const mats: { m: import("three").ShaderMaterial; mul: number }[] = [];
        const mkMat = (mul: number) => {
          const m = new THREE.ShaderMaterial({
            uniforms: { uScale: { value: H() * 0.0075 * mul } },
            vertexShader: VERT,
            fragmentShader: FRAG,
            transparent: true,
            depthWrite: false,
          });
          mats.push({ m, mul });
          return m;
        };

        // ── The planet: a checkerboard sphere of particles ──
        {
          const N = 26000;
          const pos = new Float32Array(N * 3);
          const nor = new Float32Array(N * 3);
          const lum = new Float32Array(N);
          let i = 0;
          let made = 0;
          let guard = 0;
          while (made < N && guard++ < N * 8) {
            const u = Math.random() * 2 - 1;
            const th = Math.random() * Math.PI * 2;
            const s = Math.sqrt(1 - u * u);
            const nx = s * Math.cos(th), ny = u, nz = s * Math.sin(th);
            // Checkerboard by lat/long — 8 × 8 fields.
            const lon = (Math.atan2(nz, nx) / (Math.PI * 2) + 0.5) * 14;
            const lat = (Math.asin(ny) / Math.PI + 0.5) * 10;
            const light = (Math.floor(lon) + Math.floor(lat)) % 2 === 0;
            // Light squares dense + bright; dark squares sparse ink speckle.
            if (!light && Math.random() > 0.13) continue;
            pos[i] = nx * GLOBE_R + center.x;
            pos[i + 1] = ny * GLOBE_R + center.y;
            pos[i + 2] = nz * GLOBE_R + center.z;
            nor[i] = nx; nor[i + 1] = ny; nor[i + 2] = nz;
            lum[made] = light ? (Math.random() > 0.93 ? 1.0 : 0.88) : 0.24;
            i += 3;
            made++;
          }
          const geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.BufferAttribute(pos.slice(0, made * 3), 3));
          geo.setAttribute("normal", new THREE.BufferAttribute(nor.slice(0, made * 3), 3));
          geo.setAttribute("aLum", new THREE.BufferAttribute(lum.slice(0, made), 1));
          globePts = new THREE.Points(geo, mkMat(0.5));
          scene.add(globePts);
        }

        // ── Physics: central gravity toward the planet's core ──
        const world = new CANNON.World({ gravity: new CANNON.Vec3(0, 0, 0) });
        world.allowSleep = true;
        world.defaultContactMaterial.friction = 0.5;
        world.defaultContactMaterial.restitution = 0.25;
        const planet = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Sphere(GLOBE_R) });
        planet.position.set(center.x, center.y, center.z);
        world.addBody(planet);

        type Piece = {
          obj: import("three").Points;
          proxy: import("three").Mesh;
          body: import("cannon-es").Body;
          homeP: import("cannon-es").Vec3;
          homeQ: import("cannon-es").Quaternion;
        };
        const pieces: Piece[] = [];
        const upY = new THREE.Vector3(0, 1, 0);

        for (const cast of CAST) {
          const data = points.get(cast.name)!;
          const s = cast.scale;
          const h = s;
          const half = h / 2;

          // Surface point on the front band of the planet.
          const a = (cast.deg * Math.PI) / 180;
          const zFrac = 0.3; // toward the camera
          const rimR = Math.sqrt(1 - zFrac * zFrac);
          const normal = new THREE.Vector3(Math.sin(a) * rimR, Math.cos(a) * rimR, zFrac).normalize();
          const bodyPos = center.clone().addScaledVector(normal, GLOBE_R + half + 0.002);

          // Orient the piece "up" along the surface normal, plus its own spin.
          const qAlign = new THREE.Quaternion().setFromUnitVectors(upY, normal);
          const qSpin = new THREE.Quaternion().setFromAxisAngle(upY, cast.spin);
          const q = qAlign.clone().multiply(qSpin);

          const pos = new Float32Array(data.pos.length);
          for (let i = 0; i < data.pos.length; i += 3) {
            pos[i] = data.pos[i] * s;
            pos[i + 1] = data.pos[i + 1] * s - half;
            pos[i + 2] = data.pos[i + 2] * s;
          }
          const lum = new Float32Array(data.meta.count).fill(0.92);
          const geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
          geo.setAttribute("normal", new THREE.BufferAttribute(data.nor.slice(), 3));
          geo.setAttribute("aLum", new THREE.BufferAttribute(lum, 1));
          const obj = new THREE.Points(geo, mkMat(0.58));
          obj.position.copy(bodyPos);
          obj.quaternion.copy(q);
          scene.add(obj);

          const proxy = new THREE.Mesh(
            new THREE.CylinderGeometry(data.meta.maxR * s * 1.2, data.meta.baseR * s * 1.2, h * 1.05, 10),
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
          );
          proxy.position.copy(bodyPos);
          proxy.quaternion.copy(q);
          scene.add(proxy);

          const body = new CANNON.Body({
            mass: 1,
            shape: new CANNON.Cylinder(data.meta.maxR * s * 0.72, data.meta.baseR * s * 0.95, h, 10),
            position: new CANNON.Vec3(bodyPos.x, bodyPos.y, bodyPos.z),
            angularDamping: 0.35,
            linearDamping: 0.22,
          });
          body.quaternion.set(q.x, q.y, q.z, q.w);
          body.allowSleep = true;
          body.sleepSpeedLimit = 0.28;
          body.sleepTimeLimit = 0.4;
          body.sleep();
          world.addBody(body);

          pieces.push({
            obj, proxy, body,
            homeP: new CANNON.Vec3(bodyPos.x, bodyPos.y, bodyPos.z),
            homeQ: new CANNON.Quaternion(q.x, q.y, q.z, q.w),
          });
        }

        host.appendChild(renderer.domElement);
        setReady(true);

        // ── Interaction: poke a piece, it tumbles around the planet ──
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
          piece.body.wakeUp(); // neighbors wake only on real contact
          const dir = ray.ray.direction;
          const impulse = new CANNON.Vec3(dir.x * 1.3, dir.y * 1.3 + 0.35, dir.z * 1.3);
          const rel = new CANNON.Vec3(
            hit.point.x - piece.body.position.x,
            hit.point.y - piece.body.position.y,
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
        const gDir = new CANNON.Vec3();

        function frame() {
          if (disposed) return;
          raf = requestAnimationFrame(frame);
          const dt = Math.min(clock.getDelta(), 0.05);

          spin += SPIN_RATE * dt;
          spinQ.setFromAxisAngle(yAxis, spin);
          if (globePts) {
            // Geometry is baked in world space around `center`: rotating the
            // object spins it about the ORIGIN, so re-anchor with p = c − R·c
            // (world = R·x + (c − R·c) ⇒ rotation about c).
            globePts.quaternion.copy(spinQ);
            globePts.position.copy(center).sub(tmpV.copy(center).applyQuaternion(spinQ));
          }

          if (!resetting) {
            // Sleeping pieces ride the planet's rotation (kinematic re-home).
            pieces.forEach((p, i) => {
              if (p.body.sleepState !== 2) return;
              tmpV.set(p.homeP.x - center.x, p.homeP.y - center.y, p.homeP.z - center.z).applyQuaternion(spinQ).add(center);
              tmpQ.set(p.homeQ.x, p.homeQ.y, p.homeQ.z, p.homeQ.w).premultiply(spinQ);
              p.body.position.set(tmpV.x, tmpV.y, tmpV.z);
              p.body.quaternion.set(tmpQ.x, tmpQ.y, tmpQ.z, tmpQ.w);
            });
            // Central gravity: every awake body falls toward the core.
            for (const p of pieces) {
              if (p.body.sleepState === 2 /* SLEEPING */) continue;
              gDir.set(center.x - p.body.position.x, center.y - p.body.position.y, center.z - p.body.position.z);
              gDir.normalize();
              gDir.scale(9.2 * p.body.mass, gDir);
              p.body.applyForce(gDir, p.body.position);
            }
            world.step(1 / 60, dt, 3);
            const anyAwake = pieces.some((p) => p.body.sleepState !== 2);
            for (const p of pieces) {
              p.obj.position.set(p.body.position.x, p.body.position.y, p.body.position.z);
              p.obj.quaternion.set(p.body.quaternion.x, p.body.quaternion.y, p.body.quaternion.z, p.body.quaternion.w);
              p.proxy.position.copy(p.obj.position);
              p.proxy.quaternion.copy(p.obj.quaternion);
            }
            if (lastPokeAt && (!anyAwake || performance.now() - lastPokeAt > 6500)) {
              lastPokeAt = 0;
              beginReset();
            }
          } else {
            const t = Math.min(1, (performance.now() - resetStart) / 1200);
            const e = 1 - Math.pow(1 - t, 3);
            pieces.forEach((p, i) => {
              tmpV.set(p.homeP.x - center.x, p.homeP.y - center.y, p.homeP.z - center.z).applyQuaternion(spinQ).add(center);
              tmpQ.set(p.homeQ.x, p.homeQ.y, p.homeQ.z, p.homeQ.w).premultiply(spinQ);
              p.obj.position.lerpVectors(resetFrom[i].p, tmpV, e);
              p.obj.quaternion.slerpQuaternions(resetFrom[i].q, tmpQ, e);
              p.proxy.position.copy(p.obj.position);
              p.proxy.quaternion.copy(p.obj.quaternion);
            });
            if (t >= 1) {
              pieces.forEach((p) => {
                tmpV.set(p.homeP.x - center.x, p.homeP.y - center.y, p.homeP.z - center.z).applyQuaternion(spinQ).add(center);
                tmpQ.set(p.homeQ.x, p.homeQ.y, p.homeQ.z, p.homeQ.w).premultiply(spinQ);
                p.body.position.set(tmpV.x, tmpV.y, tmpV.z);
                p.body.quaternion.set(tmpQ.x, tmpQ.y, tmpQ.z, tmpQ.w);
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
          mats.forEach(({ m, mul }) => (m.uniforms.uScale.value = H() * 0.0075 * mul));
        };
        ro = new ResizeObserver(onResize);
        ro.observe(host);
        window.addEventListener("resize", onResize);
      } catch {
        // WebGL/fetch failed — the SVG fallback simply stays.
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro?.disconnect();
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
