"use client";

import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import type { SiteContent } from "@/content/site";
import {
  BUILT_UNTIL,
  JOURNEY_VH,
  SCENES,
  buildStops,
  eduYear,
  yearToFrac,
  type Stop,
} from "@/lib/journey";
import { motionState, resetMotionState } from "@/lib/motion-state";

// The canvas loads after the HTML, so the words are readable before any 3D arrives.
const Stage = dynamic(() => import("./Stage"), { ssr: false });

type Props = { content: SiteContent; today: number };

const subscribeNoop = () => () => {};
const isMotionMode = () => document.documentElement.classList.contains("motion");

export function Journey({ content, today }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const motion = useSyncExternalStore(subscribeNoop, isMotionMode, () => false);
  const [canvasReady, setCanvasReady] = useState(false);

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

  useEffect(() => {
    if (!motion || !root.current) return;

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    resetMotionState(content.roles.length, content.education.length);

    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

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
      buildDotScene(tl);
      buildLineScene(tl, stops);
      // The timeline spans exactly the built part of the journey.
      tl.set({}, {}, BUILT_UNTIL);
    }, root);

    return () => {
      ctx.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
      resetMotionState(content.roles.length, content.education.length);
    };
  }, [motion, stops, content.roles.length, content.education.length]);

  const words = content.quote.text.split(" ");
  const journeyStyle = {
    "--len-desktop": `${JOURNEY_VH.desktop * BUILT_UNTIL}vh`,
    "--len-phone": `${JOURNEY_VH.phone * BUILT_UNTIL}vh`,
  } as CSSProperties;

  return (
    <>
      <div className="grid-bg" aria-hidden />
      {motion && <Stage roleFracs={roleFracs} eduFracs={eduFracs} onReady={() => setCanvasReady(true)} />}

      <main ref={root} className="journey" style={journeyStyle}>
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
            <div className="ident">
              <h1 id="name">{content.name}</h1>
              <p className="tagline">{content.tagline}</p>
            </div>
            <div className="scroll-cue" aria-hidden>
              {content.ui.scroll}
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
        </div>
      </main>
    </>
  );
}

/** Scene 0 (0–8%): the quote writes in word by word, then the text clears for the line. */
function buildDotScene(tl: gsap.core.Timeline) {
  const { end } = SCENES.dot;
  tl.to(".scroll-cue", { opacity: 0, duration: 0.01 }, 0);
  tl.fromTo(
    ".word",
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.01, ease: "power1.out", stagger: { amount: 0.038 } },
    0.004,
  );
  tl.fromTo(".quote footer", { opacity: 0 }, { opacity: 1, duration: 0.006 }, 0.046);
  tl.to([".quote", ".ident"], { opacity: 0, duration: 0.014 }, end - 0.016);
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
        tl.to(`[data-role="${shownCard}"]`, { opacity: 0, y: -8, duration: 0.08 * L }, s + 0.36 * L);
      }
      tl.fromTo(
        `[data-role="${stop.index}"]`,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.14 * L, ease: "power2.out" },
        s + 0.44 * L,
      );
      shownCard = stop.index;
    } else {
      tl.to(motionState.edu[stop.index], { v: 1, duration: 0.06 * L, ease: "power1.out" }, s + 0.3 * L);
      tl.fromTo(
        `[data-edu="${stop.index}"]`,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.14 * L, ease: "power2.out" },
        s + 0.36 * L,
      );
    }
  });

  // Last run: the playhead reaches today.
  tl.to(motionState, { dotFrac: 1, duration: 0.4 * L, ease: "power1.inOut" }, first + stops.length * L);
}
