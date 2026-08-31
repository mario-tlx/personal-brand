import { siteConfig } from "@/lib/site-config";

export function About() {
  return (
    <section id="about" className="section-shell">
      <div className="mb-10 max-w-2xl">
        <p className="text-sm font-medium tracking-[0.28em] text-accent uppercase">
          About
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          A focused presence for how you work and what you stand for.
        </h2>
        <p className="mt-4 text-base leading-7 text-muted md:text-lg">
          This site is built to be fast, polished, and easy to deploy on Vercel.
          Update your story in one config file and ship changes in minutes.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {siteConfig.highlights.map((item) => (
          <article key={item.title} className="glass-card p-6 md:p-8">
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted md:text-base">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
