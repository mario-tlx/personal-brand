/**
 * Scroll choreography: scene ranges, scroll length and the shared layout of the axis.
 * Timeline positions are in "journey units": 0 = top of the page, 1 = end of scene 6.
 */

export const SCENES = {
  dot: { start: 0, end: 0.08 },
  line: { start: 0.08, end: 0.25 },
  curve: { start: 0.25, end: 0.38 },
  plane: { start: 0.38, end: 0.55 },
  cube: { start: 0.55, end: 0.75 },
  beyond: { start: 0.75, end: 0.88 },
  back: { start: 0.88, end: 1 },
} as const;

/** Scenes built so far end here; the page's scroll length covers only this part. */
export const BUILT_UNTIL = SCENES.line.end;

/** Scroll length of the whole journey (0 → 1), in viewport heights. Phone is shorter. */
export const JOURNEY_VH = { desktop: 2400, phone: 1800 };

export const PHONE_MAX_WIDTH = 767;

export const AXIS_START_YEAR = 2015;

/**
 * Where the time axis sits inside the viewport. globals.css uses the same numbers
 * (search for "axis layout") — keep both in sync.
 */
export const AXIS = {
  desktop: { y: 0.5, x0: 0.1, x1: 0.9 },
  phone: { x: 76, y0: 0.14, y1: 0.86 },
} as const;

/** 0 at 2015, 1 at today. */
export function yearToFrac(year: number, today: number) {
  const f = (year - AXIS_START_YEAR) / (today - AXIS_START_YEAR);
  return Math.min(1, Math.max(0, f));
}

/** Education markers carry a year only; place them mid-year so they don't sit on a role tick. */
export const eduYear = (year: number) => year + 0.5;

export type Stop =
  | { kind: "role"; index: number; frac: number }
  | { kind: "edu"; index: number; frac: number };

/** Everything the playhead stops at, in time order. */
export function buildStops(roleStarts: number[], eduYears: number[], today: number): Stop[] {
  const stops: Stop[] = [
    ...roleStarts.map((y, index) => ({ kind: "role" as const, index, frac: yearToFrac(y, today) })),
    ...eduYears.map((y, index) => ({ kind: "edu" as const, index, frac: yearToFrac(eduYear(y), today) })),
  ];
  return stops.sort((a, b) => a.frac - b.frac);
}

/** Current date as a fractional year (evaluated at build time for the static page). */
export function currentYear(date = new Date()) {
  return date.getFullYear() + date.getMonth() / 12;
}
