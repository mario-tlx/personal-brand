import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function Work() {
  return (
    <section id="work" className="section-shell">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium tracking-[0.28em] text-accent uppercase">
            Work
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Selected projects and proof points.
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-muted md:text-base">
          Replace these placeholders with case studies, launches, or content
          that best represent your personal brand.
        </p>
      </div>

      <div className="grid gap-6">
        {siteConfig.projects.map((project, index) => (
          <article
            key={project.title}
            className="glass-card group flex flex-col gap-6 p-6 transition hover:border-accent/30 md:flex-row md:items-center md:justify-between md:p-8"
          >
            <div className="max-w-2xl">
              <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase">
                0{index + 1}
              </p>
              <h3 className="mt-2 text-2xl font-semibold">{project.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted md:text-base">
                {project.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border px-3 py-1 text-xs text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href={project.href}
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition group-hover:text-accent"
            >
              View details
              <span aria-hidden="true">→</span>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
