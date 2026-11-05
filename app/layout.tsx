import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { EB_Garamond, IBM_Plex_Mono, Inter } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const content = site.en;
const title = `${content.name} — ${content.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL("https://mario.tlx.la"),
  title,
  description: content.bio,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description: content.bio,
    url: "/",
    siteName: content.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: content.bio,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0E1420",
  colorScheme: "dark",
};

/**
 * Runs before first paint: picks the scroll-animated version ("motion") or the
 * still version ("still", for prefers-reduced-motion). Without JavaScript neither
 * class is set and the page is a plain, readable document.
 * `?still` in the URL previews the reduced-motion version.
 */
const pickMode = `(function(){var d=document.documentElement;try{var still=matchMedia('(prefers-reduced-motion: reduce)').matches||/[?&]still\\b/.test(location.search);d.classList.add(still?'still':'motion')}catch(e){d.classList.add('still')}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${garamond.variable} ${plexMono.variable} ${inter.variable}`}
    >
      <body>
        <Script id="pick-mode" strategy="beforeInteractive">
          {pickMode}
        </Script>
        {children}
      </body>
    </html>
  );
}
