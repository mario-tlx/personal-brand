/**
 * All words, numbers and links for the site live here.
 * Source: "Personal Website — Step 1: Content" (claude.ai/artifact/5L94orv1GJ3hWpgCQy5qeE).
 * Changing copy never requires touching animation code.
 *
 * Rules: name is "Mario Oviedo"; no personal location; no client names.
 * Spanish (`es`) is added later, mirroring this shape.
 */

export type Role = {
  /** Shown on screen, as written in Step 1. */
  dates: string;
  /** Start of the role as a fractional year (May 2016 → 2016 + 4/12). Places the tick on the axis. */
  start: number;
  title: string;
  org: string;
  line: string;
};

export type Education = {
  year: number;
  degree: string;
  school: string;
  /** Compact label for narrow screens. */
  short: string;
};

const en = {
  lang: "en",
  name: "Mario Oviedo",
  tagline: "Finance · AI",
  quote: {
    text: "I could be bounded in a nutshell, and count myself a king of infinite space.",
    source: "Hamlet",
  },
  bio: "Finance Global Lead with 10+ years partnering with Sales, Delivery and executives on forecasting, pricing and planning for US and Canadian clients. I run finance for a $50M US market, led global teams on a $500M account at IBM/Kyndryl, and hold an MS in Data Science. I build the AI tools that make finance faster.",
  languages: "Spanish (native) · English (full professional) · Portuguese (full professional)",

  ui: {
    scroll: "Scroll",
    career: "Career",
    education: "Education",
    numbers: "In numbers",
    axisStart: "2015",
    axisEnd: "Today",
  },

  /** Oldest first: this is the order they play on the line. */
  roles: [
    {
      dates: "2015",
      start: 2015,
      title: "Risk Analysis",
      org: "FINOX",
      line: "Built the risk unit: VaR, CVaR and Monte Carlo models in R.",
    },
    {
      dates: "2016",
      start: 2016,
      title: "Wealth Management trainee",
      org: "Citibanamex",
      line: "ARIMA (MATLAB) and GARCH (R) models for USD/MXN.",
    },
    {
      dates: "May 2016 – Aug 2018",
      start: 2016 + 4 / 12,
      title: "Financial Analyst",
      org: "IBM",
      line: "US GAAP/SEC reporting for Mexico, Brazil and Italy; AR and credit scoring.",
    },
    {
      dates: "Aug 2018 – Apr 2020",
      start: 2018 + 7 / 12,
      title: "Senior Financial Analyst",
      org: "IBM",
      line: "Backlog, signings and quota models; forecast consolidation cut from 3 days to hours.",
    },
    {
      dates: "Apr 2020 – Mar 2021",
      start: 2020 + 3 / 12,
      title: "Canada Finance Lead",
      org: "IBM",
      line: "+$6M revenue (+6% YoY) on a key account; a loss-making operation turned to a 5% margin.",
    },
    {
      dates: "Mar 2021 – Jul 2022",
      start: 2021 + 2 / 12,
      title: "Global Finance Lead",
      org: "IBM/Kyndryl",
      line: "The region's largest account: $500M budget, 55 countries, 8 core + 20 extended analysts.",
    },
    {
      dates: "Jul 2022 – now",
      start: 2022 + 6 / 12,
      title: "Business Partner",
      org: "Motivus",
      line: "Run finance for the $50M US market: pricing, hiring and spend approvals, forecast, 13-week cash. Automated ~50% of the team's work with AI.",
    },
  ] satisfies Role[],

  education: [
    { year: 2016, degree: "BS in Finance", school: "Tecnológico de Monterrey", short: "BS" },
    { year: 2025, degree: "MS in Data Science", school: "ITESO", short: "MS" },
  ] satisfies Education[],

  /** Scene 2 (the curve). */
  numbers: [
    { value: "$500M", label: "budget across 55 countries" },
    { value: "$50M", label: "US market I run finance for" },
    { value: "~50%", label: "of the finance team's work integrated with AI" },
    { value: "+10%", label: "gross margin improve on a key account" },
    { value: "3 days → hours", label: "forecast consolidation, killed 80% of manual errors" },
  ],

  // Scene 3 (skills plane) is added when that scene is built (source: Step 1, "Skills map").

  /** Scene 4 (the cube). High level only; no internals or client names. */
  projects: [
    {
      title: "Finance monitoring platform (Motivus)",
      line: "Azure platform with ETL, models, dashboards, and automated revenue and margin alerts, built in Cursor. Replaced Power BI with an AI-built system.",
      href: null,
    },
    {
      title: "AI automation of the finance team (Motivus)",
      line: "A changing set of AI agents now does ~50% of the finance team's work.",
      href: null,
    },
    {
      title: "WhatsApp CRM + AI agent",
      line: "Chat archive plus a configurable RAG agent with approval and autonomous modes (Node, OpenRouter, SQLite, Railway).",
      href: "https://github.com/mario-tlx/whatsapp_crm",
    },
    {
      title: "AgentOps (texter)",
      line: "An agent operations platform: multimodal chat and an orchestrator across several LLMs (Railway, Vercel, Supabase).",
      href: null,
    },
  ],

  /** Scene 5 (beyond work). Photo is a placeholder until Mario adds it. */
  interests: ["Basketball", "Art history and classical art", "Reading the classics", "Physics"],

  /** Scene 6 (back to a dot). */
  closing: "The next data point is yours.",
  contact: {
    email: "mario_oviedo@outlook.com",
    linkedin: "https://www.linkedin.com/in/marioviedo",
    github: "https://github.com/MarioOvz",
  },
};

export type SiteContent = typeof en;

export const site = { en } as const;
