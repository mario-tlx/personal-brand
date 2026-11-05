# mario.tlx.la

Personal site and portfolio for Mario Oviedo. One continuous scroll: a dot gains one dimension
per scene (line → curve → plane → cube) and folds back into a dot at the contact card.
See `CLAUDE.md` for the full brief.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · GSAP ScrollTrigger · React Three Fiber · Lenis.
Deployed on Vercel.

## Getting started

```powershell
npm install
npm run dev
```

Open http://localhost:3000. Add `?still` to preview the reduced-motion version.

## Where things live

- `content/site.ts`: every word, number and link (English now; Spanish comes later).
- `lib/journey.ts`: scene scroll ranges, scroll length and axis layout.
- `components/journey/Journey.tsx`: the HTML layer and the master scroll timeline.
- `components/journey/Stage.tsx`: the single fixed 3D canvas (the dot, the line, the plane, the cube).
- `components/journey/Drawings.tsx`: the five line drawings of "Beyond work".
- `content/credits.ts`: source and license of every image or traced artwork.

## Scripts

- `npm run dev`: local dev server
- `npm run build`: production build
- `npm run lint`: ESLint
