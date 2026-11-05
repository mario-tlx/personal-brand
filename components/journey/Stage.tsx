"use client";

import { useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Euler,
  Matrix4,
  Vector3,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
} from "three";
import {
  AXIS,
  BEYOND,
  CLOSING,
  CUBE,
  CURVE,
  PHONE_MAX_WIDTH,
  PLANE,
  beyondSlot,
  growth,
  growthSlope,
} from "@/lib/journey";
import { motionState } from "@/lib/motion-state";

const BLUE = "#4FA3D9";
const BROWN = "#C08A4E";
const QUIET = "#6B7A90";

const LINE_PX = 2;
const TICK_PX = 14;
const EDU_PX = 10;
const MARKER_PX = 7;
/** The line is drawn as a ribbon of this many segments, so it can bend. */
const SEGMENTS = 160;
const POINT_PX = 5;

type Vec3 = [number, number, number];
type Edge = { a: Vec3; b: Vec3; kind: "axis" | "grow" | "up" };

/**
 * The cube's 12 edges in cube coordinates (floor x, y in -0.5..0.5, height z in 0..1).
 * "axis" edges are the plane's two axes; "grow" edges close the plane's frame;
 * "up" edges exist only once the cube extrudes.
 */
const EDGES: Edge[] = [
  { a: [-0.5, -0.5, 0], b: [0.5, -0.5, 0], kind: "axis" },
  { a: [-0.5, -0.5, 0], b: [-0.5, 0.5, 0], kind: "axis" },
  { a: [-0.5, 0.5, 0], b: [0.5, 0.5, 0], kind: "grow" },
  { a: [0.5, -0.5, 0], b: [0.5, 0.5, 0], kind: "grow" },
  { a: [-0.5, -0.5, 0], b: [-0.5, -0.5, 1], kind: "up" },
  { a: [0.5, -0.5, 0], b: [0.5, -0.5, 1], kind: "up" },
  { a: [0.5, 0.5, 0], b: [0.5, 0.5, 1], kind: "up" },
  { a: [-0.5, 0.5, 0], b: [-0.5, 0.5, 1], kind: "up" },
  { a: [-0.5, -0.5, 1], b: [0.5, -0.5, 1], kind: "up" },
  { a: [-0.5, -0.5, 1], b: [-0.5, 0.5, 1], kind: "up" },
  { a: [-0.5, 0.5, 1], b: [0.5, 0.5, 1], kind: "up" },
  { a: [0.5, -0.5, 1], b: [0.5, 0.5, 1], kind: "up" },
];

/** Where the dot starts its 3D tour: the cube's corner at the plane's origin. */
const CORNER: Vec3 = [-0.5, -0.5, 0];

// Scratch objects for the per-frame cube math (one canvas, so module scope is fine).
const M = new Matrix4();
const M2 = new Matrix4();
const EUL = new Euler(0, 0, 0, "XYZ");
const VA = new Vector3();
const VB = new Vector3();
const VUP = new Vector3(0, 1, 0);
const VC = new Vector3();

type Props = {
  roleFracs: number[];
  eduFracs: number[];
  markerTs: number[];
  projectCount: number;
  /** Project labels in the HTML layer; the canvas keeps each one on its point. */
  anchors: RefObject<(HTMLElement | null)[]>;
  /** Scene 5: which drawing slot the dot settles in (the orbit's center), and how many slots. */
  restSlot: number;
  slotCount: number;
};

/** The one fixed canvas behind the page for the whole scroll. */
export default function Stage({ onReady, ...props }: Props & { onReady: () => void }) {
  return (
    <div className="stage" aria-hidden>
      <Canvas
        flat
        dpr={[1, 2]}
        camera={{ position: [0, 0, 10], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
      >
        <DotObject {...props} onReady={onReady} />
      </Canvas>
    </div>
  );
}

function makeRibbon() {
  const geometry = new BufferGeometry();
  const verts = (SEGMENTS + 1) * 2;
  const position = new BufferAttribute(new Float32Array(verts * 3), 3);
  const color = new BufferAttribute(new Float32Array(verts * 3), 3);
  position.setUsage(DynamicDrawUsage);
  color.setUsage(DynamicDrawUsage);
  const index: number[] = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const a = 2 * i;
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  geometry.setAttribute("position", position);
  geometry.setAttribute("color", color);
  geometry.setIndex(index);
  return geometry;
}

/** Hermite smoothstep; works with edge0 > edge1 too (a falling step). */
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * The dot. One object that morphs scene to scene: dot → time axis (with role ticks and
 * education markers) → rising chart line → the two axes of the skills plane → a wireframe
 * cube that breaks apart, leaving the dot at the center of the orbit drawing → back to a
 * single dot beside the contact card. Flat parts are laid out in CSS pixels (y down) in a group that maps pixels onto the
 * z = 0 plane; the cube lives in world space and is projected back to pixels for the dot,
 * the project points and their HTML labels.
 */
function DotObject({
  roleFracs,
  eduFracs,
  markerTs,
  projectCount,
  anchors,
  restSlot,
  slotCount,
  onReady,
}: Props & { onReady: () => void }) {
  const size = useThree((s) => s.size);
  const viewport = useThree((s) => s.viewport);
  const announced = useRef(false);

  const ribbon = useMemo(() => makeRibbon(), []);
  // Scratch buffer for the line's points, reused every frame.
  const scratch = useRef(new Float32Array((SEGMENTS + 1) * 2));
  const colors = useMemo(() => ({ blue: new Color(BLUE), brown: new Color(BROWN) }), []);

  const group = useRef<Group>(null);
  const dot = useRef<Mesh>(null);
  const halo = useRef<Mesh>(null);
  const pulse = useRef<Mesh>(null);
  const line = useRef<Mesh>(null);
  const ticks = useRef<(Mesh | null)[]>([]);
  const edus = useRef<(Mesh | null)[]>([]);
  const markers = useRef<(Mesh | null)[]>([]);
  const yAxis = useRef<Mesh>(null);
  const gridV = useRef<Mesh>(null);
  const gridH = useRef<Mesh>(null);
  const edges = useRef<(Mesh | null)[]>([]);
  const points = useRef<(Mesh | null)[]>([]);

  useFrame(({ clock, camera }) => {
    if (!group.current || !dot.current || !halo.current || !line.current || !pulse.current) return;
    if (!yAxis.current || !gridV.current || !gridH.current) return;
    const W = size.width;
    const H = size.height;
    const phone = W <= PHONE_MAX_WIDTH;

    group.current.position.set(-viewport.width / 2, viewport.height / 2, 0);
    group.current.scale.set(viewport.width / W, -viewport.height / H, 1);

    const axisX = (f: number) => (phone ? AXIS.phone.x : W * (AXIS.desktop.x0 + f * (AXIS.desktop.x1 - AXIS.desktop.x0)));
    const axisY = (f: number) => (phone ? H * (AXIS.phone.y0 + f * (AXIS.phone.y1 - AXIS.phone.y0)) : H * AXIS.desktop.y);
    const curveX = (t: number) =>
      phone
        ? CURVE.phone.pad + t * (W - 2 * CURVE.phone.pad)
        : W * (CURVE.desktop.x0 + t * (CURVE.desktop.x1 - CURVE.desktop.x0));
    const curveY = (t: number) => {
      const c = phone ? CURVE.phone : CURVE.desktop;
      return H * (c.y0 - (c.y0 - c.y1) * growth(t));
    };

    // Before the dot "gathers" onto the axis it sits in the center of the screen.
    const k = 1 - motionState.gather;
    const ox = (W / 2 - axisX(0.5)) * k;
    const oy = (H / 2 - axisY(0.5)) * k;

    // The skills plane: origin bottom-left, x-axis along the bottom.
    const plane = phone
      ? { x0: PLANE.phone.left, x1: W - PLANE.phone.right, yt: H * PLANE.phone.yTop, yb: H * PLANE.phone.yBottom }
      : {
          x0: W * PLANE.desktop.x0,
          x1: W * PLANE.desktop.x1,
          yt: H * PLANE.desktop.yTop,
          yb: H * PLANE.desktop.yBottom,
        };

    // A point on the line: the straight axis, bent toward the curve by `bend`,
    // then laid down as the plane's x-axis by `flat`.
    const bend = motionState.bend;
    const flat = motionState.flat;
    const bx = (t: number) => axisX(t) + (bend ? (curveX(t) - axisX(t)) * bend : 0);
    const by = (t: number) => axisY(t) + (bend ? (curveY(t) - axisY(t)) * bend : 0);
    const px = (t: number) => {
      const x = bx(t);
      return (flat ? x + (plane.x0 + t * (plane.x1 - plane.x0) - x) * flat : x) + ox;
    };
    const py = (t: number) => {
      const y = by(t);
      return (flat ? y + (plane.yb - y) * flat : y) + oy;
    };

    const cubeOn = motionState.handoff > 0.5;

    // The line (axis, then curve), as a ribbon of LINE_PX width.
    const len = motionState.lineLen;
    line.current.visible = len > 0.001 && !cubeOn;
    if (line.current.visible) {
      const pts = scratch.current;
      const geometry = line.current.geometry;
      const t0 = 0.5 - len / 2;
      for (let i = 0; i <= SEGMENTS; i++) {
        const t = t0 + (len * i) / SEGMENTS;
        pts[2 * i] = px(t);
        pts[2 * i + 1] = py(t);
      }
      const pos = geometry.attributes.position as BufferAttribute;
      const col = geometry.attributes.color as BufferAttribute;
      const head = motionState.dotFrac;
      const glow = motionState.glow;
      const { blue, brown } = colors;
      for (let i = 0; i <= SEGMENTS; i++) {
        const t = t0 + (len * i) / SEGMENTS;
        // Brown where the curve rises steeply, only behind the dot.
        const w = glow ? glow * smoothstep(0.3, 0.75, growthSlope(t)) * smoothstep(head + 0.004, head - 0.03, t) : 0;
        const a = Math.max(i - 1, 0);
        const b = Math.min(i + 1, SEGMENTS);
        const dx = pts[2 * b] - pts[2 * a];
        const dy = pts[2 * b + 1] - pts[2 * a + 1];
        const l = Math.hypot(dx, dy) || 1;
        const half = (LINE_PX / 2) * (1 + 0.5 * w);
        const nx = (-dy / l) * half;
        const ny = (dx / l) * half;
        const x = pts[2 * i];
        const y = pts[2 * i + 1];
        pos.setXYZ(2 * i, x + nx, y + ny, 0);
        pos.setXYZ(2 * i + 1, x - nx, y - ny, 0);
        const r = blue.r + (brown.r - blue.r) * w;
        const g = blue.g + (brown.g - blue.g) * w;
        const bl = blue.b + (brown.b - blue.b) * w;
        col.setXYZ(2 * i, r, g, bl);
        col.setXYZ(2 * i + 1, r, g, bl);
      }
      pos.needsUpdate = true;
      col.needsUpdate = true;
    }

    // Role ticks: grow away from the axis, toward the cards.
    roleFracs.forEach((f, i) => {
      const m = ticks.current[i];
      if (!m) return;
      const v = motionState.ticks[i]?.v ?? 0;
      m.visible = v > 0.001;
      if (!m.visible) return;
      const x = axisX(f);
      const y = axisY(f);
      const l = TICK_PX * v;
      if (phone) {
        m.position.set(x + l / 2, y, 0.01);
        m.scale.set(l, LINE_PX, 1);
      } else {
        m.position.set(x, y - l / 2, 0.01);
        m.scale.set(LINE_PX, l, 1);
      }
    });

    // Education markers: small brown diamonds on the axis.
    eduFracs.forEach((f, i) => {
      const m = edus.current[i];
      if (!m) return;
      const v = motionState.edu[i]?.v ?? 0;
      m.visible = v > 0.001;
      if (!m.visible) return;
      m.position.set(axisX(f), axisY(f), 0.02);
      m.scale.setScalar(EDU_PX * v);
    });

    // Counter markers: small rings on the curve.
    markerTs.forEach((t, i) => {
      const m = markers.current[i];
      if (!m) return;
      const v = motionState.markers[i]?.v ?? 0;
      m.visible = v > 0.001;
      if (!m.visible) return;
      m.position.set(px(t), py(t), 0.015);
      m.scale.setScalar(MARKER_PX * v);
    });

    // The second axis swings up around the origin, from lying on the x-axis to upright.
    const swing = motionState.swing;
    yAxis.current.visible = swing > 0.001 && !cubeOn;
    if (yAxis.current.visible) {
      const theta = (swing * Math.PI) / 2;
      const L = plane.yb - plane.yt;
      yAxis.current.position.set(plane.x0 + (Math.cos(theta) * L) / 2, plane.yb - (Math.sin(theta) * L) / 2, 0.005);
      yAxis.current.rotation.z = -theta;
      yAxis.current.scale.set(L, LINE_PX, 1);
    }

    // Quadrant dividers: the vertical one grows up from the x-axis, the horizontal one
    // grows right from the y-axis.
    const grid = motionState.grid;
    gridV.current.visible = gridH.current.visible = grid > 0.001;
    if (grid > 0.001) {
      const xm = (plane.x0 + plane.x1) / 2;
      const ym = (plane.yt + plane.yb) / 2;
      const lv = (plane.yb - plane.yt) * grid;
      const lh = (plane.x1 - plane.x0) * grid;
      gridV.current.position.set(xm, plane.yb - lv / 2, 0.004);
      gridV.current.scale.set(1, lv, 1);
      gridH.current.position.set(plane.x0 + lh / 2, ym, 0.004);
      gridH.current.scale.set(lh, 1, 1);
    }

    // The cube: cube coordinates → world. The plane's rectangle (on screen, at z = 0)
    // morphs into a centered cube of side S, tilting back to become its floor.
    const kpx = viewport.width / W;
    const toWorldX = (x: number) => (x - W / 2) * kpx;
    const toWorldY = (y: number) => (H / 2 - y) * kpx;
    const S = phone ? CUBE.phone.size * viewport.width : CUBE.desktop.size * viewport.height;
    const c = phone ? CUBE.phone : CUBE.desktop;
    const m = motionState.morph;
    const rectX = toWorldX((plane.x0 + plane.x1) / 2);
    const rectY = toWorldY((plane.yt + plane.yb) / 2);
    const floorX = toWorldX(c.cx * W);
    const floorY = toWorldY(c.cy * H) - (S / 2) * Math.cos(CUBE.elev);
    const floorZ = -(S / 2) * Math.sin(CUBE.elev);
    const A = (plane.x1 - plane.x0) * kpx * (1 - m) + S * m;
    const B = (plane.yb - plane.yt) * kpx * (1 - m) + S * m;
    const C = Math.max(S * motionState.extrude, 1e-4);
    M.makeTranslation(rectX + (floorX - rectX) * m, rectY + (floorY - rectY) * m, floorZ * m);
    EUL.set(motionState.elev * CUBE.elev, motionState.orbit * CUBE.orbit, 0);
    M.multiply(M2.makeRotationFromEuler(EUL));
    M.multiply(M2.makeRotationX((-motionState.tilt * Math.PI) / 2));
    M.multiply(M2.makeScale(A, B, C));

    const th = LINE_PX * kpx;
    const shatter = motionState.shatter;
    VC.set(0, 0, 0.5).applyMatrix4(M); // the cube's center, in world space
    EDGES.forEach((e, i) => {
      const mesh = edges.current[i];
      if (!mesh) return;
      const grow = e.kind === "grow" ? motionState.close : 1;
      mesh.visible =
        cubeOn &&
        shatter < 0.999 &&
        (e.kind === "axis" || (e.kind === "grow" && grow > 0.001) || (e.kind === "up" && motionState.extrude > 0.001));
      if (!mesh.visible) return;
      VA.set(e.a[0], e.a[1], e.a[2]).applyMatrix4(M);
      VB.set(
        e.a[0] + (e.b[0] - e.a[0]) * grow,
        e.a[1] + (e.b[1] - e.a[1]) * grow,
        e.a[2] + (e.b[2] - e.a[2]) * grow,
      ).applyMatrix4(M);
      const l = VA.distanceTo(VB) * (1 - 0.7 * shatter);
      mesh.position.copy(VA).add(VB).multiplyScalar(0.5);
      if (l > 1e-6) mesh.quaternion.setFromUnitVectors(VUP, VB.sub(VA).normalize());
      mesh.scale.set(th, Math.max(l, 1e-4), th);
      if (shatter > 0) {
        // Fly outward from the cube's center.
        VB.copy(mesh.position).sub(VC);
        if (VB.lengthSq() < 1e-8) VB.set(0, 1, 0);
        mesh.position.addScaledVector(VB.normalize(), shatter * S * 1.1);
      }
      (mesh.material as MeshBasicMaterial).opacity = 1 - shatter;
    });

    // Cube coordinates → screen pixels.
    const toPx = (p: Vec3): [number, number] => {
      VA.set(p[0], p[1], p[2]).applyMatrix4(M).project(camera);
      return [((VA.x + 1) / 2) * W, ((1 - VA.y) / 2) * H];
    };
    const pointAt = (i: number): Vec3 => CUBE.points[i % CUBE.points.length];

    // Project points (and their HTML labels) light up inside the cube.
    for (let i = 0; i < projectCount; i++) {
      const mesh = points.current[i];
      const anchor = anchors.current?.[i];
      const [sx, sy] = cubeOn ? toPx(pointAt(i)) : [0, 0];
      const v = motionState.lit[i]?.v ?? 0;
      if (mesh) {
        mesh.visible = cubeOn && v > 0.001;
        if (mesh.visible) {
          mesh.position.set(sx, sy, 0.02);
          mesh.scale.setScalar(POINT_PX * v);
          const w = motionState.selected === i ? 1 : (motionState.act[i]?.v ?? 0);
          (mesh.material as MeshBasicMaterial).color.copy(colors.blue).lerp(colors.brown, w);
        }
      }
      if (anchor && cubeOn) {
        anchor.style.setProperty("transform", `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`);
        anchor.setAttribute("data-side", sx > W * 0.6 ? "left" : "right");
      }
    }

    // The dot, and its slow breathing halo (the only thing on a timer).
    // From the cube's handoff on it travels in 3D: the corner, each project point, and
    // back to the corner (path 0 … projectCount + 1).
    let dx = px(motionState.dotFrac);
    let dy = py(motionState.dotFrac);
    if (cubeOn && projectCount > 0) {
      const path = Math.min(Math.max(motionState.dotPath, 0), projectCount + 1);
      const seg = Math.min(Math.floor(path), projectCount);
      const f = path - seg;
      const from = seg === 0 ? CORNER : pointAt(seg - 1);
      const to = seg === projectCount ? CORNER : pointAt(seg);
      [dx, dy] = toPx([
        from[0] + (to[0] - from[0]) * f,
        from[1] + (to[1] - from[1]) * f,
        from[2] + (to[2] - from[2]) * f,
      ]);
    }
    const home = motionState.dotHome;
    const rest = motionState.dotRest;
    if (rest > 0 && slotCount > 0) {
      const slot = beyondSlot(restSlot, slotCount, phone ? BEYOND.phone : BEYOND.desktop);
      dx += (slot.x * W - dx) * rest;
      dy += (slot.y * H - dy) * rest;
    }
    if (home > 0) {
      const c = phone ? CLOSING.phone : CLOSING.desktop;
      dx += (c.x * W - dx) * home;
      dy += (c.y * H - dy) * home;
    }
    const r = motionState.dotR;
    dot.current.position.set(dx, dy, 0.03);
    dot.current.scale.setScalar(r);

    const t = (clock.elapsedTime % 2.8) / 2.8;
    halo.current.position.set(dx, dy, 0.025);
    halo.current.scale.setScalar(r * (1 + 1.6 * t));
    (halo.current.material as MeshBasicMaterial).opacity = 0.4 * (1 - t) * (1 - t);

    // The single closing pulse (scrubbed by scroll, unlike the breathing halo).
    const p = motionState.pulse;
    pulse.current.visible = p > 0.001 && p < 0.999;
    if (pulse.current.visible) {
      pulse.current.position.set(dx, dy, 0.026);
      pulse.current.scale.setScalar(r * (1 + 5 * p));
      (pulse.current.material as MeshBasicMaterial).opacity = 0.7 * (1 - p);
    }

    // First drawn frame: the 3D dot is on screen, the CSS stand-in can go.
    if (!announced.current) {
      announced.current = true;
      onReady();
    }
  });

  return (
    <>
      {/* World space: the cube's edges. */}
      <group>
        {EDGES.map((_, i) => (
          <mesh key={`edge-${i}`} ref={(el) => void (edges.current[i] = el)} visible={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color={BLUE} transparent />
          </mesh>
        ))}
      </group>

      <group ref={group}>
      <mesh ref={line} geometry={ribbon} frustumCulled={false} visible={false}>
        <meshBasicMaterial vertexColors side={DoubleSide} />
      </mesh>

      {roleFracs.map((_, i) => (
        <mesh key={`tick-${i}`} ref={(m) => void (ticks.current[i] = m)} visible={false}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color={BLUE} side={DoubleSide} />
        </mesh>
      ))}

      {eduFracs.map((_, i) => (
        <mesh key={`edu-${i}`} ref={(m) => void (edus.current[i] = m)} rotation={[0, 0, Math.PI / 4]} visible={false}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color={BROWN} side={DoubleSide} />
        </mesh>
      ))}

      {markerTs.map((_, i) => (
        <mesh key={`marker-${i}`} ref={(m) => void (markers.current[i] = m)} visible={false}>
          <ringGeometry args={[0.6, 1, 40]} />
          <meshBasicMaterial color={BLUE} side={DoubleSide} />
        </mesh>
      ))}

      <mesh ref={yAxis} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={BLUE} side={DoubleSide} />
      </mesh>

      <mesh ref={gridV} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={QUIET} side={DoubleSide} transparent opacity={0.55} />
      </mesh>
      <mesh ref={gridH} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={QUIET} side={DoubleSide} transparent opacity={0.55} />
      </mesh>

      {Array.from({ length: projectCount }, (_, i) => (
        <mesh key={`point-${i}`} ref={(el) => void (points.current[i] = el)} visible={false}>
          <circleGeometry args={[1, 32]} />
          <meshBasicMaterial color={BLUE} side={DoubleSide} />
        </mesh>
      ))}

      <mesh ref={pulse} visible={false}>
        <ringGeometry args={[0.9, 1, 64]} />
        <meshBasicMaterial color={BLUE} side={DoubleSide} transparent depthWrite={false} />
      </mesh>

      <mesh ref={halo}>
        <ringGeometry args={[0.82, 1, 64]} />
        <meshBasicMaterial color={BLUE} side={DoubleSide} transparent depthWrite={false} />
      </mesh>

      <mesh ref={dot}>
        <circleGeometry args={[1, 48]} />
        <meshBasicMaterial color={BLUE} side={DoubleSide} />
      </mesh>
      </group>
    </>
  );
}
