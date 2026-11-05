"use client";

import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import type { Quadrant, SiteContent } from "@/content/site";
import { Drawing } from "./Drawings";
import {
  BEYOND,
  BUILT_UNTIL,
  JOURNEY_VH,
  SCENES,
  beyondSlot,
  buildStops,
  counterT,
  curveYDesktop,
  eduYear,
  parseCounter,
  yearToFrac,
  type Counter,
  type Stop,
} from "@/lib/journey";
import { motionState, resetMotionState } from "@/lib/motion-state";

// The canvas loads after the HTML, so the words are readable before any 3D arrives.
const Stage = dynamic(() => import("./Stage"), { ssr: false });

/** How long the dot breathes alone, once the canvas is up, before the name appears. */
const INTRO_HOLD_MS = 3000;
/** If the canvas never arrives (no WebGL), show the name after this long anyway. */
const INTRO_FALLBACK_MS = 5000;

type Props = { content: SiteContent; today: number };

const subscribeNoop = () => () => {};
const isMotionMode = () => document.documentElement.classList.contains("motion");

export function Journey({ content, today }: Props) {
  const root = useRef<HTMLElement>(null);
  const nav = useRef<HTMLElement>(null);
  const motion = useSyncExternalStore(subscribeNoop, isMotionMode, () => false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [introShown, setIntroShown] = useState(false);
  const [openProject, setOpenProject] = useState<number | null>(null);
  const anchors = useRef<(HTMLElement | null)[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  const roleFracs = useMemo(() => content.roles.map((r) => yearToFrac(r.start, today)), [content.roles, today]);
  const eduFracs = useMemo(
    () => content.education.map((e) => yearToFrac(eduYear(e.year), today)),
    [content.education, today],
  );
  const stops = useMemo(
    () =>
      buildStops(
        content.roles.map((r) => r.start),
        content.education.map((e) => e.year),
        today,
      ),
    [content.roles, content.education, today],
  );
  const counters = useMemo(() => content.numbers.map((n) => parseCounter(n.value)), [content.numbers]);
  const markerTs = useMemo(() => counters.map((_, i) => counterT(i, counters.length)), [counters]);

  // Intro: the dot breathes alone for a moment, then the name and tagline appear.
  useEffect(() => {
    if (!motion || introShown) return;
    const id = setTimeout(() => setIntroShown(true), canvasReady ? INTRO_HOLD_MS : INTRO_FALLBACK_MS);
    return () => clearTimeout(id);
  }, [motion, canvasReady, introShown]);

  useEffect(() => {
    if (!motion || !root.current || !nav.current) return;
    const navEl = nav.current;

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    resetMotionState(content.roles.length, content.education.length, counters.length, content.projects.length);

    const lenis = new Lenis({ anchors: true });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const rollEls = Array.from(root.current.querySelectorAll<HTMLElement>("[data-roll]"));

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });
      buildDotScene(tl, navEl);
      buildLineScene(tl, stops);
      buildCurveScene(tl, counters, markerTs, rollEls, content.roles.length - 1);
      buildPlaneScene(tl, content.skills.quadrants);
      buildCubeScene(tl, content.projects.length);
      buildBeyondScene(tl, content.beyond.drawings.length);
      // The timeline spans exactly the built part of the journey.
      tl.set({}, {}, BUILT_UNTIL);
    }, root);

    return () => {
      ctx.revert();
      // Counters were rewritten to "0" for the roll; put the real values back.
      rollEls.forEach((el, i) => (el.textContent = counters[i]?.main ?? el.textContent));
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
      resetMotionState(content.roles.length, content.education.length, counters.length, content.projects.length);
    };
  }, [
    motion,
    stops,
    counters,
    markerTs,
    content.roles.length,
    content.education.length,
    content.skills.quadrants,
    content.projects.length,
    content.beyond.drawings.length,
  ]);

  // Project card: a modal dialog. The page holds still while it is open.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (openProject === null) {
      if (el.open) el.close();
      return;
    }
    motionState.selected = openProject;
    lenisRef.current?.stop();
    if (!el.open) el.showModal();
    return () => {
      motionState.selected = -1;
      lenisRef.current?.start();
    };
  }, [openProject]);

  const words = content.quote.text.split(" ");
  const orbitSlot = Math.max(
    0,
    content.beyond.drawings.findIndex((d) => d.id === "orbit"),
  );
  const photoStyle = {
    "--photo-d": `${BEYOND.desktop.photoW}px`,
    "--photo-p": `${BEYOND.phone.photoW}px`,
    "--pcx-d": BEYOND.desktop.cx,
    "--pcy-d": BEYOND.desktop.cy,
    "--pcx-p": BEYOND.phone.cx,
    "--pcy-p": BEYOND.phone.cy,
    "--slot-d": `${BEYOND.desktop.slot}px`,
    "--slot-p": `${BEYOND.phone.slot}px`,
  } as CSSProperties;
  const slotStyle = (i: number) => {
    const n = content.beyond.drawings.length;
    const d = beyondSlot(i, n, BEYOND.desktop);
    const p = beyondSlot(i, n, BEYOND.phone);
    return { "--sx-d": d.x, "--sy-d": d.y, "--sx-p": p.x, "--sy-p": p.y } as CSSProperties;
  };
  const journeyStyle = {
    "--len-desktop": `${JOURNEY_VH.desktop * BUILT_UNTIL}vh`,
    "--len-phone": `${JOURNEY_VH.phone * BUILT_UNTIL}vh`,
  } as CSSProperties;

  return (
    <>
      <div className="grid-bg" aria-hidden />
      {motion && (
        <Stage
          roleFracs={roleFracs}
          eduFracs={eduFracs}
          markerTs={markerTs}
          projectCount={content.projects.length}
          anchors={anchors}
          restSlot={orbitSlot}
          slotCount={content.beyond.drawings.length}
          onReady={() => setCanvasReady(true)}
        />
      )}

      <header ref={nav} className="site-nav">
        <a href="#top" className="site-nav-name">
          {content.name}
        </a>
      </header>

      <main
        ref={root}
        id="top"
        className={`journey${introShown ? " intro-shown" : ""}`}
        style={journeyStyle}
      >
        <div className="journey-viewport">
          {/* Scene 0 — the dot */}
          <section className="scene scene-dot" data-scene="dot" aria-labelledby="name">
            <blockquote className="quote">
              <p>
                {words.map((w, i) => (
                  <Fragment key={i}>
                    <span className="word">{w}</span>
                    {i < words.length - 1 ? " " : ""}
                  </Fragment>
                ))}
              </p>
              <footer>— {content.quote.source}</footer>
            </blockquote>
            {/* Shown until the 3D dot takes over (and always without JS / in reduced motion). */}
            <span className={`dot-fallback${canvasReady ? " is-hidden" : ""}`} aria-hidden />
            {/* Outer element: faded by scroll. Inner element: the timed intro. */}
            <div className="ident">
              <div className="ident-inner">
                <h1 id="name">{content.name}</h1>
                <p className="tagline">{content.tagline}</p>
              </div>
            </div>
            <div className="scroll-cue" aria-hidden>
              <span className="scroll-cue-inner">{content.ui.scroll}</span>
            </div>
          </section>

          {/* Scene 1 — the line */}
          <section className="scene scene-line" data-scene="line" aria-labelledby="career">
            <h2 id="career" className="scene-title">
              {content.ui.career}
            </h2>
            <div className="axis-labels" aria-hidden>
              <span className="axis-start">{content.ui.axisStart}</span>
              <span className="axis-end">{content.ui.axisEnd}</span>
            </div>
            <ol className="roles">
              {content.roles.map((role, i) => (
                <li key={role.dates + role.title} className="role" style={{ "--f": roleFracs[i] } as CSSProperties}>
                  <div className="role-card" data-role={i}>
                    <span className="role-dates">{role.dates}</span>
                    <span className="role-title">
                      {role.title}, <span className="role-org">{role.org}</span>
                    </span>
                    <p className="role-line">{role.line}</p>
                  </div>
                </li>
              ))}
            </ol>
            <h3 className="scene-title edu-heading">{content.ui.education}</h3>
            <ul className="edu">
              {content.education.map((edu, i) => (
                <li key={edu.degree} style={{ "--f": eduFracs[i] } as CSSProperties}>
                  <div className="edu-label" data-edu={i}>
                    <span className="edu-degree">
                      {edu.degree} · {edu.year}
                    </span>
                    <span className="edu-school">{edu.school}</span>
                    <span className="edu-short" aria-hidden>
                      {edu.short}
                      <br />
                      {edu.year}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Scene 2 — the curve */}
          <section className="scene scene-curve" data-scene="curve" aria-labelledby="numbers">
            <h2 id="numbers" className="scene-title">
              {content.ui.numbers}
            </h2>
            <div className="leaders" aria-hidden>
              {markerTs.map((t, i) => (
                <span
                  key={i}
                  className="leader"
                  data-leader={i}
                  style={{ "--t": t, "--my": curveYDesktop(t) } as CSSProperties}
                />
              ))}
            </div>
            <ul className="numbers">
              {content.numbers.map((n, i) => (
                <li key={n.value} className="number" data-number={i} style={{ "--t": markerTs[i] } as CSSProperties}>
                  <span className="number-value">
                    <span data-roll={i}>{counters[i].main}</span>
                    {counters[i].then && (
                      <>
                        {" "}
                        <span className="number-then" data-then={i}>
                          {counters[i].then}
                        </span>
                      </>
                    )}
                  </span>
                  <span className="number-label">{n.label}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Scene 3 — the plane */}
          <section className="scene scene-plane" data-scene="plane" aria-labelledby="skills">
            <h2 id="skills" className="scene-title">
              {content.ui.skills}
            </h2>
            <div className="plane-labels">
              <span className="plane-x" data-plane-label>
                {content.skills.xAxis} →
              </span>
              <span className="plane-y" data-plane-label>
                {content.skills.yAxis} →
              </span>
            </div>
            <div className="quadrants">
              {content.skills.quadrants.map((q) => (
                <div
                  key={q.id}
                  className={`quadrant${q.highlight ? " is-highlight" : ""}`}
                  data-quadrant={q.id}
                  data-qx={q.x}
                  data-qy={q.y}
                  style={{ "--qx": q.x, "--qy": q.y } as CSSProperties}
                >
                  <h3 className="quadrant-title">{q.title}</h3>
                  <ul className="skills">
                    {q.items.map((item) => (
                      <li key={item} className="skill">
                        <span className="skill-dot" aria-hidden />
                        <span className="skill-text">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Scene 4 — the cube */}
          <section className="scene scene-cube" data-scene="cube" aria-labelledby="projects">
            <h2 id="projects" className="scene-title">
              {content.ui.projects}
            </h2>
            <ol className="projects">
              {content.projects.map((project, k) => (
                <li key={project.title} className="project" data-project={k}>
                  {/* In motion mode the canvas keeps this anchor on the project's point. */}
                  <div className="project-anchor" ref={(el) => void (anchors.current[k] = el)}>
                    {motion ? (
                      <button
                        type="button"
                        className="project-label"
                        aria-haspopup="dialog"
                        onClick={() => setOpenProject(k)}
                      >
                        {project.title}
                      </button>
                    ) : (
                      <h3 className="project-title">{project.title}</h3>
                    )}
                  </div>
                  <p className="project-line">{project.line}</p>
                  {project.href && (
                    <a className="project-link" href={project.href} target="_blank" rel="noopener noreferrer">
                      {content.ui.viewLink} ↗
                    </a>
                  )}
                </li>
              ))}
            </ol>
            <p className="projects-hint" aria-hidden>
              {content.ui.projectsHint}
            </p>
          </section>

          {/* Scene 5 — beyond work */}
          <section className="scene scene-beyond" data-scene="beyond" aria-labelledby="beyond" style={photoStyle}>
            <h2 id="beyond" className="scene-title">
              {content.ui.beyond}
            </h2>
            {/* Placeholder: Mario adds his photo here later. */}
            <div className="photo" data-photo aria-hidden>
              <span>{content.ui.photoPlaceholder}</span>
            </div>
            <ul className="drawings">
              {content.beyond.drawings.map((d, i) => (
                <li key={d.id} className="drawing" data-drawing={i} style={slotStyle(i)}>
                  <Drawing id={d.id} />
                  <span className="drawing-caption">{d.caption}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <dialog
        ref={dialog}
        className="project-dialog"
        aria-labelledby="project-dialog-title"
        onClose={() => setOpenProject(null)}
        onClick={(e) => {
          // A click on the backdrop (the dialog element itself) closes it.
          if (e.target === e.currentTarget) setOpenProject(null);
        }}
      >
        {openProject !== null && (
          <div className="project-card">
            <span className="project-kicker">{content.ui.projectKicker}</span>
            <h3 id="project-dialog-title" className="project-card-title">
              {content.projects[openProject].title}
            </h3>
            <p className="project-card-line">{content.projects[openProject].line}</p>
            {content.projects[openProject].href && (
              <a
                className="project-link"
                href={content.projects[openProject].href ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
              >
                {content.ui.viewLink} ↗
              </a>
            )}
            <button type="button" className="project-close" onClick={() => setOpenProject(null)}>
              {content.ui.close}
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}

/**
 * Scene 0 (0–8%): the name fades as the quote writes in word by word; when the quote
 * leaves, the navbar (with the name) arrives and stays.
 */
function buildDotScene(tl: gsap.core.Timeline, navEl: HTMLElement) {
  const { end } = SCENES.dot;
  tl.to(".scroll-cue", { opacity: 0, duration: 0.01 }, 0);
  tl.to(".ident", { autoAlpha: 0, y: 8, duration: 0.02, ease: "power1.inOut" }, 0.004);
  tl.fromTo(
    ".word",
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.01, ease: "power1.out", stagger: { amount: 0.038 } },
    0.004,
  );
  tl.fromTo(".quote footer", { opacity: 0 }, { opacity: 1, duration: 0.006 }, 0.046);
  tl.to(".quote", { autoAlpha: 0, duration: 0.014 }, end - 0.016);
  tl.fromTo(navEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, end - 0.008);
}

/**
 * Scene 1 (8–25%): the dot stretches into the time axis, then travels it as a playhead.
 * Each stop gets the same share of scroll, so short roles are as readable as long ones.
 */
function buildLineScene(tl: gsap.core.Timeline, stops: Stop[]) {
  const { start, end } = SCENES.line;

  // Phone: slide to the axis first (no-op on desktop, where the axis runs through the center).
  tl.to(motionState, { gather: 1, duration: 0.008 }, start);
  // The dot stretches into the line, riding its 2015 end.
  tl.to(motionState, { lineLen: 1, dotFrac: 0, dotR: 6, duration: 0.024 }, start + 0.009);
  tl.to(".axis-labels > span", { opacity: 1, duration: 0.007 }, start + 0.034);

  const first = start + 0.042;
  const segments = stops.length + 1; // every stop, then the run to "today"
  const L = (end - 0.001 - first) / segments;
  let shownCard: number | null = null;

  stops.forEach((stop, k) => {
    const s = first + k * L;
    tl.to(motionState, { dotFrac: stop.frac, duration: 0.3 * L, ease: "power1.inOut" }, s);

    if (stop.kind === "role") {
      tl.to(motionState.ticks[stop.index], { v: 1, duration: 0.06 * L, ease: "power1.out" }, s + 0.3 * L);
      if (shownCard !== null) {
        tl.to(`[data-role="${shownCard}"]`, { autoAlpha: 0, y: -8, duration: 0.08 * L }, s + 0.36 * L);
      }
      tl.fromTo(
        `[data-role="${stop.index}"]`,
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.14 * L, ease: "power2.out" },
        s + 0.44 * L,
      );
      shownCard = stop.index;
    } else {
      tl.to(motionState.edu[stop.index], { v: 1, duration: 0.06 * L, ease: "power1.out" }, s + 0.3 * L);
      tl.fromTo(
        `[data-edu="${stop.index}"]`,
        { autoAlpha: 0, y: 6 },
        { autoAlpha: 1, y: 0, duration: 0.14 * L, ease: "power2.out" },
        s + 0.36 * L,
      );
    }
  });

  // Last run: the playhead reaches today.
  tl.to(motionState, { dotFrac: 1, duration: 0.4 * L, ease: "power1.inOut" }, first + stops.length * L);
}

/**
 * Scene 2 (25–38%): the career text clears, the dot rewinds to 2015, the axis bends into a
 * rising chart line, then the dot climbs it. At each counter the number rolls up from 0;
 * the steep part of the curve turns brown behind the dot.
 */
function buildCurveScene(
  tl: gsap.core.Timeline,
  counters: Counter[],
  markerTs: number[],
  rollEls: HTMLElement[],
  lastRole: number,
) {
  const { start, end } = SCENES.curve;

  // Clear scene 1: last card, labels, ticks and markers.
  tl.to([`[data-role="${lastRole}"]`, ".edu-label", ".axis-labels > span"], { autoAlpha: 0, duration: 0.006 }, start);
  tl.to([...motionState.ticks, ...motionState.edu], { v: 0, duration: 0.006, ease: "power1.in" }, start + 0.002);

  // Rewind to 2015, then bend.
  tl.to(motionState, { dotFrac: 0, duration: 0.012 }, start + 0.009);
  tl.to(motionState, { bend: 1, duration: 0.02 }, start + 0.022);
  tl.to(motionState, { glow: 1, duration: 0.004 }, start + 0.044);

  const first = start + 0.046;
  const segments = counters.length + 1; // every counter, then the run to the top
  const L = (end - 0.001 - first) / segments;

  counters.forEach((c, i) => {
    const s = first + i * L;
    tl.to(motionState, { dotFrac: markerTs[i], duration: 0.34 * L, ease: "power1.inOut" }, s);
    tl.to(motionState.markers[i], { v: 1, duration: 0.08 * L, ease: "power1.out" }, s + 0.34 * L);
    tl.fromTo(`[data-leader="${i}"]`, { opacity: 0 }, { opacity: 1, duration: 0.12 * L }, s + 0.36 * L);
    tl.fromTo(
      `[data-number="${i}"]`,
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: 0.14 * L, ease: "power2.out" },
      s + 0.4 * L,
    );

    const el = rollEls[i];
    if (el && c.num !== null) {
      const format = (n: number) => `${c.prefix}${n.toFixed(c.decimals)}${c.suffix}`;
      const counter = { n: 0 };
      el.textContent = format(0);
      tl.to(
        counter,
        {
          n: c.num,
          duration: 0.32 * L,
          ease: "power1.out",
          onUpdate: () => {
            const step = 10 ** -c.decimals;
            el.textContent = format(Math.round(counter.n / step) * step);
          },
        },
        s + 0.44 * L,
      );
    }
    if (c.then) {
      tl.fromTo(`[data-then="${i}"]`, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.1 * L }, s + 0.78 * L);
    }
  });

  // Last run: the dot reaches the top of the curve (today).
  tl.to(motionState, { dotFrac: 1, duration: 0.4 * L, ease: "power1.inOut" }, first + counters.length * L);
}

/**
 * Scene 3 (38–55%): the counters clear, the curve lies down as the x-axis while the dot
 * slides to the origin, and the second axis swings up around it. The dividers draw in,
 * then each quadrant's skill dots fall into place, one quadrant at a time. The highlighted
 * quadrant ("Where I play") comes last and fills brown.
 */
function buildPlaneScene(tl: gsap.core.Timeline, quadrants: Quadrant[]) {
  const { start, end } = SCENES.plane;

  // Clear scene 2.
  tl.to([".number", ".leader"], { autoAlpha: 0, duration: 0.006 }, start);
  tl.to([...motionState.markers], { v: 0, duration: 0.006, ease: "power1.in" }, start + 0.001);
  tl.to(motionState, { glow: 0, duration: 0.006 }, start + 0.001);

  // The curve lies down as the x-axis; the dot slides to the origin.
  tl.to(motionState, { flat: 1, dotFrac: 0, duration: 0.017 }, start + 0.009);
  // The second axis swings up.
  tl.to(motionState, { swing: 1, duration: 0.018, ease: "power2.inOut" }, start + 0.028);
  tl.fromTo("[data-plane-label]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.006 }, start + 0.047);
  tl.to(motionState, { grid: 1, duration: 0.008 }, start + 0.05);

  const first = start + 0.06;
  const fillAt = end - 0.016;
  const Q = (fillAt - first) / quadrants.length;

  quadrants.forEach((q, k) => {
    const s = first + k * Q;
    const sel = `[data-quadrant="${q.id}"]`;
    tl.fromTo(`${sel} .quadrant-title`, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18 * Q }, s);
    // Each dot falls into place, then its words arrive.
    const n = q.items.length;
    const step = (0.55 * Q) / Math.max(n, 1);
    for (let i = 0; i < n; i++) {
      const t = s + 0.16 * Q + i * step;
      const item = `${sel} .skill:nth-child(${i + 1})`;
      tl.fromTo(
        `${item} .skill-dot`,
        { autoAlpha: 0, y: -36 },
        { autoAlpha: 1, y: 0, duration: 0.16 * Q, ease: "power2.in" },
        t,
      );
      tl.fromTo(`${item} .skill-text`, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.14 * Q }, t + 0.14 * Q);
    }
  });

  // "Where I play" fills brown last.
  const hl = quadrants.find((q) => q.highlight);
  if (hl) {
    const sel = `[data-quadrant="${hl.id}"]`;
    tl.to(
      sel,
      { backgroundColor: "rgba(192, 138, 78, 0.12)", borderColor: "rgba(192, 138, 78, 0.9)", duration: 0.008 },
      fillAt,
    );
    tl.to(`${sel} .quadrant-title`, { color: "#C08A4E", duration: 0.008 }, fillAt);
    tl.to(`${sel} .skill-dot`, { backgroundColor: "#C08A4E", duration: 0.008 }, fillAt + 0.002);
  }
}

/**
 * Scene 4 (55–75%): the plane's frame closes, it tilts back and becomes the floor of a
 * cube that extrudes upward while the view orbits with scroll. The dot then visits each
 * project point; the point lights up (brown while current) and its name appears. At the
 * end every name stays as a button that opens the project's card.
 */
function buildCubeScene(tl: gsap.core.Timeline, projectCount: number) {
  const { start, end } = SCENES.cube;

  // Clear scene 3: words, labels, the brown fill and the dividers.
  tl.to(
    [".quadrant-title", ".skill-dot", ".skill-text", "[data-plane-label]"],
    { autoAlpha: 0, duration: 0.006 },
    start,
  );
  tl.to(".quadrant.is-highlight", { backgroundColor: "rgba(192, 138, 78, 0)", borderColor: "rgba(192, 138, 78, 0)", duration: 0.006 }, start);
  tl.to(motionState, { grid: 0, duration: 0.006 }, start + 0.001);

  // The cube's edges take over from the flat axes; the frame closes.
  tl.set(motionState, { handoff: 1 }, start + 0.007);
  tl.to(motionState, { close: 1, duration: 0.007 }, start + 0.008);
  // Tilt back into perspective, settling into the cube's place and size.
  tl.to(motionState, { tilt: 1, morph: 1, elev: 1, duration: 0.022 }, start + 0.016);
  // Extrude upward.
  tl.to(motionState, { extrude: 1, duration: 0.014 }, start + 0.039);
  // The view orbits for the rest of the scene.
  tl.to(motionState, { orbit: 1, duration: end - 0.002 - (start + 0.05), ease: "none" }, start + 0.05);

  const first = start + 0.056;
  const hintAt = end - 0.012;
  const L = (hintAt - first) / Math.max(projectCount, 1);

  for (let k = 0; k < projectCount; k++) {
    const s = first + k * L;
    tl.to(motionState, { dotPath: k + 1, duration: 0.32 * L, ease: "power1.inOut" }, s);
    tl.to(motionState.lit[k], { v: 1, duration: 0.1 * L, ease: "power1.out" }, s + 0.3 * L);
    if (k > 0) tl.to(motionState.act[k - 1], { v: 0, duration: 0.1 * L }, s);
    tl.to(motionState.act[k], { v: 1, duration: 0.1 * L }, s + 0.3 * L);
    tl.fromTo(
      `[data-project="${k}"] .project-label`,
      { autoAlpha: 0, x: -6 },
      { autoAlpha: 1, x: 0, duration: 0.16 * L, ease: "power2.out" },
      s + 0.4 * L,
    );
  }
  // The dot returns to the cube's corner, leaving every point (and its name) clear.
  if (projectCount > 0) tl.to(motionState.act[projectCount - 1], { v: 0, duration: 0.004 }, hintAt - 0.004);
  tl.to(motionState, { dotPath: projectCount + 1, duration: 0.008, ease: "power1.inOut" }, hintAt - 0.004);
  tl.fromTo(".projects-hint", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.006 }, hintAt + 0.002);
}

/**
 * Scene 5 (75–88%): the names leave, the cube's edges fly apart and fade, and the dot
 * settles where the orbit drawing will be. The photo placeholder appears, then each line
 * drawing draws itself in, clockwise from the top, and its caption follows.
 */
function buildBeyondScene(tl: gsap.core.Timeline, drawingCount: number) {
  const { start, end } = SCENES.beyond;

  // Clear scene 4.
  tl.to([".project-label", ".projects-hint"], { autoAlpha: 0, duration: 0.005 }, start);
  tl.to([...motionState.lit], { v: 0, duration: 0.005 }, start + 0.001);

  // The cube breaks apart; the dot goes to its place in the orbit.
  tl.to(motionState, { shatter: 1, duration: 0.016, ease: "power2.in" }, start + 0.004);
  tl.to(motionState, { dotRest: 1, dotR: 7, duration: 0.014 }, start + 0.016);

  tl.fromTo("[data-photo]", { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.008 }, start + 0.03);

  const first = start + 0.04;
  const D = (end - 0.004 - first) / Math.max(drawingCount, 1);
  for (let i = 0; i < drawingCount; i++) {
    const s = first + i * D;
    const sel = `[data-drawing="${i}"]`;
    tl.set(`${sel} .drawing-art`, { autoAlpha: 1 }, s);
    tl.fromTo(
      `${sel} .stroke`,
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 0.5 * D, ease: "power1.inOut", stagger: { amount: 0.25 * D } },
      s,
    );
    tl.fromTo(`${sel} .drawing-caption`, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 * D }, s + 0.72 * D);
  }
}
