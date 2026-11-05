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
export const BUILT_UNTIL = SCENES.beyond.end;

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

/**
 * Scene 2: the axis bends into a rising chart line. Same idea as AXIS: fractions of the
 * viewport (phone x uses a pixel gutter). y0 is the left (2015) end, y1 the right (today) end.
 */
export const CURVE = {
  /** Steepness of the growth curve; higher = flatter start, steeper finish. */
  k: 2.6,
  desktop: { x0: 0.1, x1: 0.9, y0: 0.8, y1: 0.36 },
  phone: { pad: 24, y0: 0.9, y1: 0.62 },
} as const;

/**
 * Scene 3: the skills plane. The line lies down as its x-axis (Data and AI depth) and a
 * second axis (Finance depth) swings up from the origin, bottom-left. globals.css uses the
 * same numbers (search for "plane layout") — keep both in sync.
 * desktop: fractions of the viewport. phone: x in pixels from each side, y fractions.
 */
export const PLANE = {
  desktop: { x0: 0.1, x1: 0.9, yTop: 0.15, yBottom: 0.86 },
  phone: { left: 30, right: 12, yTop: 0.12, yBottom: 0.9 },
} as const;

/**
 * Scene 4: the cube. The plane becomes the cube's floor: it tilts back, extrudes upward,
 * and the view orbits with scroll. Sizes and centers are fractions of the viewport
 * (desktop: size of the height; phone: size of the width).
 */
export const CUBE = {
  /** Final downward look at the cube, radians (shows the top face). */
  elev: 0.42,
  /** How far the view orbits over the scene, radians. */
  orbit: 0.75,
  desktop: { size: 0.38, cx: 0.42, cy: 0.54 },
  /** Phone: the cube sits higher; the project names are a list of buttons below it. */
  phone: { size: 0.52, cx: 0.5, cy: 0.36 },
  /**
   * Project points inside the cube, in cube coordinates: x and y span -0.5..0.5 on the
   * floor (x = data and AI depth, y = finance depth), z is height 0..1.
   */
  points: [
    [-0.22, 0.2, 0.72],
    [0.25, 0.25, 0.4],
    [-0.25, -0.2, 0.3],
    [0.2, -0.25, 0.8],
  ] as [number, number, number][],
} as const;

/**
 * Scene 5: the photo in the middle, the line drawings on a ring around it (clockwise from
 * the top). Centers and radii are fractions of the viewport; sizes are pixels. The page
 * reads these through CSS variables, so there is nothing to keep in sync by hand.
 */
export const BEYOND = {
  desktop: { cx: 0.5, cy: 0.52, rx: 0.33, ry: 0.33, photoW: 210, slot: 120 },
  phone: { cx: 0.5, cy: 0.5, rx: 0.36, ry: 0.32, photoW: 140, slot: 80 },
} as const;

/** Center of drawing slot i of n, as viewport fractions. */
export function beyondSlot(i: number, n: number, layout: { cx: number; cy: number; rx: number; ry: number }) {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return { x: layout.cx + layout.rx * Math.cos(a), y: layout.cy + layout.ry * Math.sin(a) };
}

/** 0 → 1 rise of the chart line at t (0 = left end, 1 = right end). */
export function growth(t: number) {
  return (Math.exp(CURVE.k * t) - 1) / (Math.exp(CURVE.k) - 1);
}

/** Slope of the curve at t, normalized so the steepest point (t = 1) is 1. */
export function growthSlope(t: number) {
  return Math.exp(CURVE.k * (t - 1));
}

/** Where counter i of n sits along the curve: the center of its column. */
export const counterT = (i: number, n: number) => (i + 0.5) / n;

/** Desktop only: viewport height fraction of the curve at t (for the dashed leaders in CSS). */
export const curveYDesktop = (t: number) =>
  CURVE.desktop.y0 - (CURVE.desktop.y0 - CURVE.desktop.y1) * growth(t);

export type Counter = {
  prefix: string;
  /** The number that rolls up from 0, or null when the value has no number. */
  num: number | null;
  decimals: number;
  suffix: string;
  /** Text after an arrow ("3 days → hours"), shown once the roll ends. */
  then: string | null;
  /** The value without the arrow part, as written. */
  main: string;
};

/** "$500M" → { prefix "$", num 500, suffix "M" }; "3 days → hours" → main "3 days", then "→ hours". */
export function parseCounter(value: string): Counter {
  const [main, ...rest] = value.split(/\s*→\s*/);
  const then = rest.length ? `→ ${rest.join(" → ")}` : null;
  const m = main.match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/);
  if (!m) return { prefix: main, num: null, decimals: 0, suffix: "", then, main };
  return {
    prefix: m[1],
    num: parseFloat(m[2]),
    decimals: (m[2].split(".")[1] ?? "").length,
    suffix: m[3],
    then,
    main,
  };
}

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
