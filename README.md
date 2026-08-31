# Personal Brand

A modern personal brand website built with Next.js, optimized for deployment on [Vercel](https://vercel.com).

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Vercel-ready defaults (zero config deploy)

## Getting started

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Customize your content

Edit `lib/site-config.ts` to update:

- Name, title, and bio
- Email and social links
- Highlights and featured projects
- Site URL for SEO metadata

## Deploy on Vercel

1. Push this repo to GitHub.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Deploy with default settings (framework preset: Next.js).

Vercel will automatically detect the Next.js project and run `npm run build`.

## Scripts

- `npm run dev` — start local dev server
- `npm run build` — production build
- `npm run start` — run production server locally
- `npm run lint` — lint the codebase
