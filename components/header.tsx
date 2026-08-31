import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-8">
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.24em] text-foreground uppercase"
        >
          {siteConfig.name.split(" ")[0]}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="#contact"
          className="rounded-full border border-border bg-accent-soft px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/40 hover:bg-accent/20"
        >
          Let&apos;s talk
        </Link>
      </div>
    </header>
  );
}
