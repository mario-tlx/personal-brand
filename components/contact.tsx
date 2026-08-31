import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function Contact() {
  return (
    <section id="contact" className="section-shell pb-28">
      <div className="glass-card overflow-hidden px-8 py-12 md:px-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <p className="text-sm font-medium tracking-[0.28em] text-accent uppercase">
              Contact
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Ready to build something worth remembering?
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted">
              Whether you want to collaborate, hire me, or just say hello, the
              fastest way to reach me is email. Social links are below too.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href={`mailto:${siteConfig.email}`}
              className="flex items-center justify-between rounded-2xl border border-border bg-background/40 px-5 py-4 transition hover:border-accent/40"
            >
              <span className="text-sm text-muted">Email</span>
              <span className="text-sm font-medium">{siteConfig.email}</span>
            </Link>

            {siteConfig.social.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-2xl border border-border bg-background/40 px-5 py-4 transition hover:border-accent/40"
              >
                <span className="text-sm text-muted">{item.label}</span>
                <span className="text-sm font-medium">Open profile</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
