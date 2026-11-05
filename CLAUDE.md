# CLAUDE.md — mario.tlx.la (personal site + portfolio)

## What this project is
Personal website and portfolio for **Mario Oviedo**, a finance leader who builds his own AI tools.
The whole site is **one continuous scroll**: it starts as a single dot, gains one dimension per
scene (line → curve → plane → cube), and folds back into a dot at the contact card.
Live at **mario.tlx.la**, deployed on Vercel. English + Spanish versions.

Source docs (the content and storyboard live there; ask Mario if something here conflicts):
- Step 1 Content: https://claude.ai/artifact/5L94orv1GJ3hWpgCQy5qeE
- Step 2 Storyboard: https://claude.ai/artifact/Xqj9t1cUjySY5WwaAVTCci

## Hard rules (from Mario — never break)
- Name: **"Mario Oviedo"** everywhere, both languages. Never the full legal name.
- **No location anywhere** (no city, no country) on any page, meta tag or share image.
- Motivus and IBM/Kyndryl may be named. **No screenshots, diagrams or internals** of the Motivus
  platform. No client names.
- AgentOps, Actichat and the TLX suite: high level only (what they do), no architecture or code.
- Art references: Velázquez paintings or Rodin sculptures, **public-domain sources only**; record
  the source URL and license of every image in `content/credits.ts`.
- Leave a **photo placeholder** in "Beyond work"; Mario adds the photo later.
- Don't invent facts, numbers or dates. All copy comes from `content/site.ts`.

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS, deployed on Vercel
- GSAP + ScrollTrigger — every animation is scrubbed by scroll position
- React Three Fiber (Three.js) — the dot / line / plane / cube object
- D3 — the curve and number counters
- Lenis — smooth scrolling
- Fonts (next/font, Google Fonts): EB Garamond (headlines, quote), IBM Plex Mono (numbers, axes), Inter (body)

## Architecture
- **One fixed 3D canvas** behind the page for the entire scroll. The dot is ONE object that morphs
  scene to scene. Never a separate canvas per section.
- **One master ScrollTrigger timeline** drives all scenes, with scene labels at the scroll ranges below.
- **All text is real HTML** layered over the canvas (readable, selectable, SEO).
- **All content in one file:** `content/site.ts` with `en` and `es` objects (bio, numbers, timeline,
  skills, projects, interests, contact). Changing words never touches animation code.
- Routes: `/` (English) and `/es` (Spanish), with an EN/ES toggle.

## Scenes (scroll ranges are starting points — tune them)
| # | Scene | Scroll | What happens |
|---|---|---|---|
| 0 | The dot | 0–8% | Blue dot breathes in the center; Hamlet quote writes in word by word (EN on `/`, Mario's Spanish translation on `/es`); name + "Finance · AI" |
| 1 | The line | 8–25% | Dot stretches into a time axis 2015 → today; 7 role ticks appear with cards; BS (2016) and MS (2025) as brown markers |
| 2 | The curve | 25–38% | Line bends into a rising chart; 5 counters roll up: $500M · $50M · ~50% · +10% · 3 days → hours |
| 3 | The plane | 38–55% | Second axis swings up: Finance depth × Data and AI depth; skill dots fall into 4 quadrants; "Where I play" (top-right) fills brown last |
| 4 | The cube | 55–75% | Plane tilts back and extrudes into a wireframe cube; camera orbits with scroll; 4 project points light up; click opens a card |
| 5 | Beyond work | 75–88% | Cube breaks into 5 line drawings around the photo placeholder: basketball arc, Velázquez painting traced in line, open book, orbit (physics), Rodin sculpture outline |
| 6 | Back to a dot | 88–100% | Everything folds back into the dot beside the contact card: "The next data point is yours." / "El siguiente dato es tuyo." |

## Visual system
| Role | Hex |
|---|---|
| Background (deep navy) | #0E1420 |
| Main — dot, lines, axes (blue) | #4FA3D9 |
| Accent — what matters (brown/amber) | #C08A4E |
| Text (warm off-white) | #ECE6DA |
| Quiet text / grid | #6B7A90 / #1F2937 |

Motion rules: animation follows scroll and reverses when scrolling back; only the dot's pulse runs
on a timer. One main thing moves at a time; text arrives after the shape settles. Smooth easing,
no bounces. Brown appears only on what matters.

## Quality bar
- 60fps on a mid-range phone; Lighthouse 90+ (performance, accessibility, SEO)
- `prefers-reduced-motion`: each scene shows as a still frame of its final state
- Phone: same 7 scenes, shorter scroll; timeline runs vertically; project cards open full screen
- Content renders before the canvas loads (works on slow connections)
- Open Graph share image: the dot-to-cube frame, no location

## How to work in this repo
- Before big changes, explain the plan in a few lines and wait for Mario's OK.
- Build order: scenes 0→1 first and stop for review. Only then build 2→6.
- Work on a branch (`redesign`), commit in small steps with clear messages, never force-push `main`.
- Run `npm run dev` and check the page in the browser after each change; run `npm run build`
  before saying something is done.
- Keep anything from the old site that Mario wants (ask before deleting pages or files).
