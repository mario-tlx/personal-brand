import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function Hero() {
  return (
    <section className="section-shell pt-16 md:pt-24">
      <div className="glass-card relative overflow-hidden px-8 py-14 md:px-12 md:py-20">
        <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-0 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl" />

        <div className="relative max-w-3xl">
          <p className="mb-4 text-sm font-medium tracking-[0.3em] text-accent uppercase">
            Personal Brand
          </p>
          <h1 className="text-4xl leading-tight font-semibold tracking-tight md:text-6xl">
            <span className="text-gradient">{siteConfig.name}</span>
          </h1>
          <p className="mt-5 text-xl text-muted md:text-2xl">{siteConfig.title}</p>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            {siteConfig.description} Based in {siteConfig.location}. Open to
            collaborations, consulting, and meaningful projects.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="#work"
              className="rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:scale-[1.02]"
            >
              View selected work
            </Link>
            <Link
              href={`mailto:${siteConfig.email}`}
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:border-accent/50 hover:bg-accent-soft"
            >
              Email me
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
