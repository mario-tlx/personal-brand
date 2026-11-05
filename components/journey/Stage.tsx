"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
} from "three";
import { AXIS, CURVE, PHONE_MAX_WIDTH, growth, growthSlope } from "@/lib/journey";
import { motionState } from "@/lib/motion-state";

const BLUE = "#4FA3D9";
const BROWN = "#C08A4E";

const LINE_PX = 2;
const TICK_PX = 14;
const EDU_PX = 10;
const MARKER_PX = 7;
/** The line is drawn as a ribbon of this many segments, so it can bend. */
const SEGMENTS = 160;

type Props = { roleFracs: number[]; eduFracs: number[]; markerTs: number[] };

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
 * education markers) → rising chart line. Children are laid out in CSS pixels (y down);
 * the parent group maps pixels onto the z = 0 plane.
 */
function DotObject({ roleFracs, eduFracs, markerTs, onReady }: Props & { onReady: () => void }) {
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
  const line = useRef<Mesh>(null);
  const ticks = useRef<(Mesh | null)[]>([]);
  const edus = useRef<(Mesh | null)[]>([]);
  const markers = useRef<(Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    if (!group.current || !dot.current || !halo.current || !line.current) return;
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

    // A point on the line: the straight axis, bent toward the curve by `bend`.
    const bend = motionState.bend;
    const px = (t: number) => axisX(t) + (bend ? (curveX(t) - axisX(t)) * bend : 0) + ox;
    const py = (t: number) => axisY(t) + (bend ? (curveY(t) - axisY(t)) * bend : 0) + oy;

    // The line (axis, then curve), as a ribbon of LINE_PX width.
    const len = motionState.lineLen;
    line.current.visible = len > 0.001;
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

    // The dot, and its slow breathing halo (the only thing on a timer).
    const dx = px(motionState.dotFrac);
    const dy = py(motionState.dotFrac);
    const r = motionState.dotR;
    dot.current.position.set(dx, dy, 0.03);
    dot.current.scale.setScalar(r);

    const t = (clock.elapsedTime % 2.8) / 2.8;
    halo.current.position.set(dx, dy, 0.025);
    halo.current.scale.setScalar(r * (1 + 1.6 * t));
    (halo.current.material as MeshBasicMaterial).opacity = 0.4 * (1 - t) * (1 - t);

    // First drawn frame: the 3D dot is on screen, the CSS stand-in can go.
    if (!announced.current) {
      announced.current = true;
      onReady();
    }
  });

  return (
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

      <mesh ref={halo}>
        <ringGeometry args={[0.82, 1, 64]} />
        <meshBasicMaterial color={BLUE} side={DoubleSide} transparent depthWrite={false} />
      </mesh>

      <mesh ref={dot}>
        <circleGeometry args={[1, 48]} />
        <meshBasicMaterial color={BLUE} side={DoubleSide} />
      </mesh>
    </group>
  );
}
