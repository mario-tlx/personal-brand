"use client";

import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { DoubleSide, type Group, type Mesh, type MeshBasicMaterial } from "three";
import { AXIS, PHONE_MAX_WIDTH } from "@/lib/journey";
import { motionState } from "@/lib/motion-state";

const BLUE = "#4FA3D9";
const BROWN = "#C08A4E";

const LINE_PX = 2;
const TICK_PX = 14;
const EDU_PX = 10;

type Props = { roleFracs: number[]; eduFracs: number[] };

/** The one fixed canvas behind the page for the whole scroll. */
export default function Stage({ roleFracs, eduFracs, onReady }: Props & { onReady: () => void }) {
  return (
    <div className="stage" aria-hidden>
      <Canvas
        flat
        dpr={[1, 2]}
        camera={{ position: [0, 0, 10], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
      >
        <DotObject roleFracs={roleFracs} eduFracs={eduFracs} onReady={onReady} />
      </Canvas>
    </div>
  );
}

/**
 * The dot. One object that morphs scene to scene; for now: dot → time axis with
 * role ticks and education markers. Children are laid out in CSS pixels (y down),
 * the parent group maps pixels onto the z = 0 plane.
 */
function DotObject({ roleFracs, eduFracs, onReady }: Props & { onReady: () => void }) {
  const size = useThree((s) => s.size);
  const viewport = useThree((s) => s.viewport);
  const announced = useRef(false);

  const group = useRef<Group>(null);
  const dot = useRef<Mesh>(null);
  const halo = useRef<Mesh>(null);
  const line = useRef<Mesh>(null);
  const ticks = useRef<(Mesh | null)[]>([]);
  const edus = useRef<(Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    if (!group.current || !dot.current || !halo.current || !line.current) return;
    const W = size.width;
    const H = size.height;
    const phone = W <= PHONE_MAX_WIDTH;

    group.current.position.set(-viewport.width / 2, viewport.height / 2, 0);
    group.current.scale.set(viewport.width / W, -viewport.height / H, 1);

    const axisPoint = (f: number): [number, number] =>
      phone
        ? [AXIS.phone.x, H * (AXIS.phone.y0 + f * (AXIS.phone.y1 - AXIS.phone.y0))]
        : [W * (AXIS.desktop.x0 + f * (AXIS.desktop.x1 - AXIS.desktop.x0)), H * AXIS.desktop.y];

    // Before the dot "gathers" onto the axis it sits in the center of the screen.
    const [mx, my] = axisPoint(0.5);
    const k = 1 - motionState.gather;
    const ox = (W / 2 - mx) * k;
    const oy = (H / 2 - my) * k;

    // Axis
    const len = motionState.lineLen;
    const [ax, ay] = axisPoint(0.5 - len / 2);
    const [bx, by] = axisPoint(0.5 + len / 2);
    const span = Math.hypot(bx - ax, by - ay);
    line.current.visible = span > 0.5;
    line.current.position.set((ax + bx) / 2 + ox, (ay + by) / 2 + oy, 0);
    line.current.scale.set(phone ? LINE_PX : span, phone ? span : LINE_PX, 1);

    // Role ticks: grow away from the axis, toward the cards.
    roleFracs.forEach((f, i) => {
      const m = ticks.current[i];
      if (!m) return;
      const v = motionState.ticks[i]?.v ?? 0;
      m.visible = v > 0.001;
      const [x, y] = axisPoint(f);
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
      const [x, y] = axisPoint(f);
      m.position.set(x, y, 0.02);
      m.scale.setScalar(EDU_PX * v);
    });

    // The dot, and its slow breathing halo (the only thing on a timer).
    const [dx, dy] = axisPoint(motionState.dotFrac);
    const r = motionState.dotR;
    dot.current.position.set(dx + ox, dy + oy, 0.03);
    dot.current.scale.setScalar(r);

    const t = (clock.elapsedTime % 2.8) / 2.8;
    halo.current.position.set(dx + ox, dy + oy, 0.025);
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
      <mesh ref={line}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={BLUE} side={DoubleSide} />
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
