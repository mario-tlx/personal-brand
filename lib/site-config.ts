export const siteConfig = {
  name: "Mario Vázquez",
  title: "Builder · Strategist · Creator",
  description:
    "Personal brand site showcasing work, ideas, and ways to connect.",
  url: "https://mariovazquez.dev",
  ogImage: "/og-image.png",
  email: "hello@mariovazquez.dev",
  location: "Mexico",
  nav: [
    { label: "About", href: "#about" },
    { label: "Work", href: "#work" },
    { label: "Contact", href: "#contact" },
  ],
  social: [
    { label: "LinkedIn", href: "https://linkedin.com/in/your-profile" },
    { label: "GitHub", href: "https://github.com/your-username" },
    { label: "X", href: "https://x.com/your-handle" },
  ],
  highlights: [
    {
      title: "Product & Strategy",
      description:
        "Turning complex problems into clear products people actually use.",
    },
    {
      title: "Technical Execution",
      description:
        "Shipping modern web experiences with performance and craft in mind.",
    },
    {
      title: "Personal Brand",
      description:
        "Sharing ideas, building in public, and growing an authentic audience.",
    },
  ],
  projects: [
    {
      title: "Featured Project One",
      description:
        "A concise case study placeholder. Replace with your flagship work.",
      tags: ["Strategy", "Design", "Build"],
      href: "#",
    },
    {
      title: "Featured Project Two",
      description:
        "Another highlight that shows range — product, content, or consulting.",
      tags: ["Leadership", "Delivery"],
      href: "#",
    },
    {
      title: "Featured Project Three",
      description:
        "Use this slot for a side project, talk, newsletter, or open-source work.",
      tags: ["Community", "Writing"],
      href: "#",
    },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
