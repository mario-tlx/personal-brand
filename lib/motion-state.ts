/**
 * Shared, mutable animation state. The master GSAP timeline tweens these numbers
 * (scrubbed by scroll); the 3D object reads them every frame. Nothing here triggers
 * React renders.
 */

export type Level = { v: number };

export const motionState = {
  /** Phone only: the dot slides from the center to the axis before stretching (0 → 1). */
  gather: 0,
  /** Length of the time axis as a share of its full length (0 = still a dot). */
  lineLen: 0,
  /** Where the dot sits along the axis (0 = 2015, 1 = today). 0.5 is the axis midpoint. */
  dotFrac: 0.5,
  /** Dot radius in CSS pixels. */
  dotR: 8,
  /** 0 → 1 growth of each role tick, oldest first. */
  ticks: [] as Level[],
  /** 0 → 1 growth of each education marker. */
  edu: [] as Level[],
};

export const INITIAL_DOT_R = 8;

export function resetMotionState(roleCount: number, eduCount: number) {
  motionState.gather = 0;
  motionState.lineLen = 0;
  motionState.dotFrac = 0.5;
  motionState.dotR = INITIAL_DOT_R;
  motionState.ticks = Array.from({ length: roleCount }, () => ({ v: 0 }));
  motionState.edu = Array.from({ length: eduCount }, () => ({ v: 0 }));
}
