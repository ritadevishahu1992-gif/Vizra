import { getPublishedBlogPost } from '../data/blogPosts';

export const SITE_ORIGIN = 'https://vizra.vercel.app';
export const SITE_NAME = 'VIZRA — AI Creative Studio';
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;
export const OG_IMAGE_WIDTH = '1200';
export const OG_IMAGE_HEIGHT = '630';
export const OG_IMAGE_ALT =
  'VIZRA — AI Creative Studio & Omnia 1.0 Multimodal Workspace';

/**
 * Permanent alias map (HTTP 301/308 redirects & canonical consolidation)
 */
export const REDIRECT_ALIASES: Record<string, string> = {
  '/roadmap': '/studio',
  '/terms': '/terms-and-conditions',
  '/privacy': '/privacy-policy',
  '/cookies': '/cookie-policy',
  '/dashboard': '/workspace',
  '/crawler-audit': '/seo-diagnostics',
};

export const PUBLIC_INDEXABLE_ROUTES = [
  '/',
  '/features',
  '/tools',
  '/studio',
  '/explore',
  '/pricing',
  '/about',
  '/contact',
  '/docs',
  '/blog',
  '/terms-and-conditions',
  '/privacy-policy',
  '/cookie-policy',
] as const;

export const PRIVATE_OR_UTILITY_ROUTES = [
  '/ai',
  '/history',
  '/settings',
  '/workspace',
  '/seo-diagnostics',
] as const;

export interface RoutePrehydrationSection {
  heading: string;
  body: string;
  bullets?: string[];
  table?: {
    headers: string[];
    rows: string[][];
  };
  faqs?: { q: string; a: string }[];
}

export interface RoutePrehydrationContent {
  eyebrow: string;
  h1: string;
  lead: string;
  sections: RoutePrehydrationSection[];
}

export interface RouteSeoDefinition {
  canonicalPath: string;
  title: string;
  description: string;
  isIndexable: boolean;
  robots: 'index, follow' | 'noindex, nofollow';
  ogType: 'website' | 'article';
  breadcrumbLabel?: string;
  jsonLd: Record<string, unknown>[];
  prehydration: RoutePrehydrationContent;
}

export interface RouteSeoPayload {
  requestedPath: string;
  canonicalPath: string | null;
  canonicalUrl: string | null;
  httpStatus: 200 | 301 | 404;
  redirectTo?: string;
  isIndexable: boolean;
  includeSocialPreview: boolean;
  robots: 'index, follow' | 'noindex, nofollow';
  xRobotsTag: 'index, follow' | 'noindex, nofollow';
  title: string;
  description: string;
  ogTitle: string | null;
  ogDescription: string | null;
  ogType: 'website' | 'article' | null;
  ogUrl: string | null;
  ogImage: string | null;
  ogImageWidth: string | null;
  ogImageHeight: string | null;
  ogImageAlt: string | null;
  ogSiteName: string | null;
  ogLocale: string | null;
  twitterCard: 'summary_large_image' | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  twitterImageAlt: string | null;
  jsonLd: Record<string, unknown>[];
  prehydration: RoutePrehydrationContent;
}

function buildBreadcrumbSchema(
  name: string,
  path: string
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${SITE_ORIGIN}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name,
        item: `${SITE_ORIGIN}${path}`,
      },
    ],
  };
}

function buildWebPageSchema(
  name: string,
  description: string,
  path: string
): Record<string, unknown> {
  const fullUrl = `${SITE_ORIGIN}${path === '/' ? '/' : path}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${fullUrl}#webpage`,
    url: fullUrl,
    name,
    description,
    inLanguage: 'en-US',
    isPartOf: {
      '@id': `${SITE_ORIGIN}/#website`,
    },
    about: {
      '@id': `${SITE_ORIGIN}/#software`,
    },
  };
}

const LEGAL_ENTITY_NAME =
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env
      ?.VITE_LEGAL_ENTITY_NAME) ||
  (typeof process !== 'undefined' && process.env?.VITE_LEGAL_ENTITY_NAME) ||
  'VIZRA AI Creative Studio';

const ORGANIZATION_SCHEMA: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_ORIGIN}/#organization`,
  name: 'VIZRA',
  legalName: LEGAL_ENTITY_NAME,
  url: `${SITE_ORIGIN}/`,
  logo: {
    '@type': 'ImageObject',
    url: DEFAULT_OG_IMAGE,
    width: 1200,
    height: 630,
  },
  description:
    'An intelligent AI creative studio and multimodal workflow platform powered by Omnia 1.0.',
};

const WEBSITE_SCHEMA: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_ORIGIN}/#website`,
  url: `${SITE_ORIGIN}/`,
  name: 'Vizra — AI Creative Studio & Omnia 1.0',
  description:
    'A modern AI creative studio built to make AI-powered creation simpler for creators, animators, motion designers, developers, and beginners.',
  inLanguage: 'en-US',
  publisher: {
    '@id': `${SITE_ORIGIN}/#organization`,
  },
};

const SOFTWARE_APPLICATION_SCHEMA: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': `${SITE_ORIGIN}/#software`,
  name: 'Vizra AI Creative Studio (Omnia 1.0)',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web',
  url: `${SITE_ORIGIN}/`,
  image: DEFAULT_OG_IMAGE,
  description:
    'Unified AI creative workspace combining conversational intelligence, multimodal file analysis, grounded web research, and 10-stage project workflows.',
  creator: {
    '@id': `${SITE_ORIGIN}/#organization`,
  },
  offers: {
    '@type': 'Offer',
    name: 'Creator Free',
    price: '0',
    priceCurrency: 'USD',
    url: `${SITE_ORIGIN}/pricing`,
    description:
      'Creator Free tier with Omnia 1.0 conversational intelligence, grounded web citations, and up to 3 active 10-stage creative workspaces.',
  },
};

const PRICING_FAQS: { q: string; a: string }[] = [
  {
    q: 'How are AI generation credits calculated across Omnia 1.0 modes?',
    a: 'Standard conversational queries (Quick and Think modes) use 1 credit per turn. Deep web research, high-resolution visual synthesis, and Lyria 3 audio generation consume credits proportional to compute complexity, tracked live in your header Credit Usage Indicator.',
  },
  {
    q: 'Can I switch between Monthly and Yearly billing at any time?',
    a: 'Yes. You can toggle between Monthly and Annual billing directly from the Pricing page or your Workspace Console. Annual billing provides an immediate 20% discount across Omnia Pro and VIZRA Studio tiers.',
  },
  {
    q: 'What happens to my 10-stage projects if I downgrade to Creator Free?',
    a: 'Your existing project history, files, and research notes are never deleted. On Creator Free, up to 3 projects remain actively editable while additional projects stay safely archived in read-only mode until you re-activate Pro or Studio.',
  },
  {
    q: 'Do you offer custom enterprise deployments or academic studio grants?',
    a: 'Yes. Production studios, universities, and research teams can request tailored concurrency quotas and dedicated onboarding through our Contact page.',
  },
];

const PRICING_FAQ_SCHEMA: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: PRICING_FAQS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
};

export const ROUTE_DEFINITIONS: Record<string, RouteSeoDefinition> = {
  '/': {
    canonicalPath: '/',
    title: 'Vizra — AI Creative Studio & Omnia 1.0 Workspace',
    description:
      'A modern AI creative studio powered by Omnia 1.0. Generate, design, write, research, and build across 10-stage creative workflows in one unified workspace.',
    isIndexable: true,
    robots: 'index, follow',
    ogType: 'website',
    jsonLd: [
      ORGANIZATION_SCHEMA,
      WEBSITE_SCHEMA,
      SOFTWARE_APPLICATION_SCHEMA,
      buildWebPageSchema(
        'Vizra — AI Creative Studio & Omnia 1.0 Workspace',
        'A modern AI creative studio powered by Omnia 1.0. Generate, design, write, research, and build across 10-stage creative workflows in one unified workspace.',
        '/'
      ),
    ],
    prehydration: {
      eyebrow: 'VIZRA AI CREATIVE STUDIO · OMNIA 1.0',
      h1: 'An intelligent creative workspace. Powered by Omnia 1.0.',
      lead: 'Think, create, and build with one unified AI creative studio—moving seamlessly from raw intuition to production-ready work.',
      sections: [
        {
          heading: 'Navigate the Vizra Ecosystem',
          body: 'Every capability in Vizra has a dedicated workspace uniting conversational reasoning, grounded research, specialized tools, 60fps studio engines, and 3D showcase exploration.',
          bullets: [
            'Features & Pipeline (/features): Explore the 4 Core Pillars (Think, Create, Build, Explore), 5-Step Idea-to-Finish pipeline, and 10-stage persistent project memory.',
            'AI Tools & Create Hub (/tools): Launch specialized workflows for scriptwriting, design systems, visual canvas synthesis, React & GLSL code, presentations, and grounded research.',
            'Creative Studio & Roadmap (/studio): Inspect 4 core studio engines (Temporal Motion Synthesis, Omnia Neural Direction, Procedural Shader Synthesis, Kinetic Spatial Typography) plus 6 interactive R&D prototypes.',
            '3D Creative Universe Showcase (/explore): Fly through the 3D perspective tunnel featuring curated AI artworks, inspect synthesis prompts, and launch directly inside Omnia 1.0.',
          ],
        },
        {
          heading: 'Plans, Technical Documentation & Governance',
          body: 'VIZRA offers predictable compute tiers from Creator Free ($0 forever) to Omnia Pro ($19/mo annual) and VIZRA Studio & Team ($64/mo annual), backed by deterministic SSRF protection and strict 18+ operating policies.',
          bullets: [
            'Pricing & Compute Tiers (/pricing): Compare Creator Free ($0), Omnia Pro ($19/mo annual or $24/mo monthly), and VIZRA Studio & Team ($64/mo annual or $79/mo monthly).',
            'Public Documentation Centre (/docs): Complete A–Z user and platform guide (Sections A–H), 10-stage project workflows, feature availability matrix, and operational boundaries (50,000-char prompt limit, 10 MB file upload limit).',
            'About VIZRA (/about): Core philosophy ("Don\'t just ask AI. Work with it.") and zero fabricated citations policy.',
            'Contact & Early Access (/contact): Enterprise onboarding, technical support SLAs (<4h Pro/Studio, <24h general), and beta access requests.',
          ],
        },
      ],
    },
  },
  '/features': {
    canonicalPath: '/features',
    title: 'Features & Architecture — Vizra AI Creative Studio',
    description:
      'Explore the 4 Core Pillars of Vizra (Think, Create, Build, Explore), our 5-step Idea-to-Finish pipeline, and 10-stage persistent project memory in Omnia 1.0.',
    isIndexable: true,
    robots: 'index, follow',
    ogType: 'website',
    breadcrumbLabel: 'Features & Architecture',
    jsonLd: [
      buildBreadcrumbSchema('Features & Architecture', '/features'),
      buildWebPageSchema(
        'Features & Architecture — Vizra AI Creative Studio',
        'Explore the 4 Core Pillars of Vizra (Think, Create, Build, Explore), our 5-step Idea-to-Finish pipeline, and 10-stage persistent project memory in Omnia 1.0.',
        '/features'
      ),
    ],
    prehydration: {
      eyebrow: 'PLATFORM ARCHITECTURE · 10-STAGE WORKFLOW',
      h1: 'Engineered to carry your work from initial spark to finished production.',
      lead: 'Explore the 4 Core Pillars of Vizra (Think, Create, Build, Explore), our 5-step Idea-to-Finish pipeline, and 10-stage persistent project memory in Omnia 1.0.',
      sections: [
        {
          heading: 'Four Core Pillars',
          body: 'VIZRA organizes multimodal creation across four interconnected operational pillars.',
          bullets: [
            'Think: Multi-step analytical reasoning, live Google Search grounding with verified clickable citations, and cross-session memory.',
            'Create: Editorial and script writing in English, Hindi, or Hinglish alongside design systems and procedural visual synthesis.',
            'Build: Production-grade React, TypeScript, WebGL/GLSL shaders, and 10-stage structured project deliverables.',
            'Explore: Interactive 3D creative universe tunnel, starter prompt library, and scientific retrieval (AlphaFold DB, PubChem, PubMed).',
          ],
        },
        {
          heading: '5-Step Idea-to-Finish Pipeline & 10-Stage Memory',
          body: 'Structured creative projects preserve shared objectives, style tokens, research sources, and iteration checkpoints across 10 discrete workflow stages synchronized via owner-isolated cloud storage (when signed in) or local browser persistence.',
        },
        {
          heading: 'Live vs. Staging Capabilities Transparency',
          body: 'Conversational AI modes, live web grounding, Science Hub, Lyria 3 audio composition, and authenticated Gemini Live Voice are implemented in production routes, while Temporal Video & Scene Synthesis and third-party OAuth cloud drive connectors remain clearly labeled In Staging.',
        },
      ],
    },
  },
  '/tools': {
    canonicalPath: '/tools',
    title: 'AI Tools & Create Hub — Vizra AI Creative Studio',
    description:
      'Launch 8 specialized AI creative tools in Omnia 1.0 for scriptwriting, design systems, visual synthesis, React and GLSL shaders, presentations, and research.',
    isIndexable: true,
    robots: 'index, follow',
    ogType: 'website',
    breadcrumbLabel: 'AI Tools & Create Hub',
    jsonLd: [
      buildBreadcrumbSchema('AI Tools & Create Hub', '/tools'),
      buildWebPageSchema(
        'AI Tools & Create Hub — Vizra AI Creative Studio',
        'Launch 8 specialized AI creative tools in Omnia 1.0 for scriptwriting, design systems, visual synthesis, React and GLSL shaders, presentations, and research.',
        '/tools'
      ),
      SOFTWARE_APPLICATION_SCHEMA,
    ],
    prehydration: {
      eyebrow: '8 SPECIALIZED CREATIVE TOOLS',
      h1: 'One intelligence. Every creative discipline.',
      lead: 'Launch any specialized workflow directly inside Omnia 1.0. Every tool shares unified project context, brand tokens, and persistent workspace memory.',
      sections: [
        {
          heading: 'Live & Staged Creative Disciplines (8 Tools)',
          body: 'Seven live multimodal creative workflows and one video synthesis workflow currently in staging:',
          bullets: [
            '1. Editorial & Script Writing (Live): Long-form articles, film scripts, pitch decks, and multilingual tone in English, Hindi, and Hinglish.',
            '2. Design System & Token Architect (Live): Typographic scales, Obsidian color tokens, UI component blueprints, and accessibility contrast audits.',
            '3. Visual & Procedural Canvas Synthesis (Live): Concept art, SVG compositions, procedural graphics, and AI visual ideation.',
            '4. React, TypeScript & GLSL Code (Live): Modular React/TypeScript components, 60fps WebGL fragment shaders, state logic, and security reviews.',
            '5. Executive Presentation Builder (Live): Slide outlines, narrative arcs, structured key takeaways, and clean deck copy.',
            '6. Grounded Live Web Research (Live): Live Google Search verification returning validated, clickable citation links.',
            '7. Multimodal File & Code Audit (Live): Analyze uploaded code files, PDFs, screenshots, CSVs, and logs inside the unified prompt bar.',
            '8. Temporal Video & Scene Synthesis (In Staging): Multi-scene storyboard sequencing and motion prompt choreography currently undergoing internal testing.',
          ],
        },
        {
          heading: 'Supported Workspace Connectors & OAuth Status',
          body: 'Local multimodal file uploads are live (up to 5 files per turn, 10 MB per file; binary video files are not analyzed in chat). External third-party OAuth integrations—Google Drive/Docs/Sheets, GitHub, Figma, Canva, YouTube, Notion, and Dropbox—are displayed transparently as UNAVAILABLE / In Staging pending external OAuth configuration.',
        },
      ],
    },
  },
  '/studio': {
    canonicalPath: '/studio',
    title: 'Creative Studio & Roadmap — Vizra AI Creative Studio',
    description:
      'Inspect Vizra’s 60fps studio engines—Temporal Motion, Neural Direction, Procedural Shaders, and Kinetic Typography—plus 6 interactive R&D roadmap prototypes.',
    isIndexable: true,
    robots: 'index, follow',
    ogType: 'website',
    breadcrumbLabel: 'Creative Studio & Roadmap',
    jsonLd: [
      buildBreadcrumbSchema('Creative Studio & Roadmap', '/studio'),
      buildWebPageSchema(
        'Creative Studio & Roadmap — Vizra AI Creative Studio',
        'Inspect Vizra’s 60fps studio engines—Temporal Motion, Neural Direction, Procedural Shaders, and Kinetic Typography—plus 6 interactive R&D roadmap prototypes.',
        '/studio'
      ),
    ],
    prehydration: {
      eyebrow: 'CREATIVE STUDIO · ENGINES & R&D',
      h1: 'Precision creative engines built for motion, shaders, and spatial direction.',
      lead: 'Explore the four production engines powering Vizra Creative Studio today, alongside six interactive R&D roadmap concept prototypes.',
      sections: [
        {
          heading: 'Four Core Studio Engines',
          body: 'Built for motion designers, animators, and creative developers seeking speed without sacrificing surgical compositional control.',
          bullets: [
            '01. Temporal Motion Synthesis (Kinetic Physics — 60 FPS · Zero Drift · Bezier Output): Fluid motion paths, camera trajectories, and organic physics interactions from natural language prompts.',
            '02. Omnia Neural Direction (Creative Control — Multi-layer · PBR Lighting · 4K): Direct cinematic lighting vectors, depth-of-field focal stops, and Obsidian color grading.',
            '03. Procedural Shader Synthesis (Code & WebGL — GLSL · WebGL2 · Pure Math): Production GLSL fragment shaders, raymarching volumetric effects, and WebGL/Three.js-ready code.',
            '04. Kinetic Spatial Typography (Editorial Motion — Variable Axes · Audio Reactive · SVG): Variable font harmonization, procedural kerning, and dimensional kinetic text.',
          ],
        },
        {
          heading: 'Future of VIZRA — R&D Concept Roadmap (6 Prototypes)',
          body: 'Transparent engineering preview of upcoming concepts across active development and planning phases:',
          bullets: [
            'Omnia Spatial Director (PROJECT AETHER — In Development): Multi-camera 3D virtual blocking & Hermite cubic spline paths.',
            'Neural Audio Stem Decomposer (PROJECT HARMONIX — In Development): 6-stem adaptive audio synthesis synchronized to visual pacing.',
            'Kinetic Consistency Engine (PROJECT CHRONOS — Coming Soon): Cross-shot character, wardrobe, and PBR lighting persistence.',
            'Vizra Team Production Canvas (PROJECT SYNDICATE — Coming Soon): Multiplayer CRDT collaborative timeline with branching takes.',
            'Edge Omnia Local Runtime (PROJECT SILICON — Planned): Quantized 4-bit offline inference for Apple Silicon & RTX workstations.',
            'Tactile Cinematic Jog Controller (PROJECT TACTILE — Planned): USB-C WebHID rotary jog-wheel for 0.01-frame latent scrubbing.',
          ],
        },
      ],
    },
  },
  '/explore': {
    canonicalPath: '/explore',
    title: 'Explore 3D Creative Showcase — Vizra AI Creative Studio',
    description:
      'Enter the Vizra 3D Creative Universe Showcase. Explore curated AI visuals inside an interactive perspective tunnel, inspect prompts, and launch in Omnia 1.0.',
    isIndexable: true,
    robots: 'index, follow',
    ogType: 'website',
    breadcrumbLabel: 'Explore & Creative Showcase',
    jsonLd: [
      buildBreadcrumbSchema('Explore & Creative Showcase', '/explore'),
      buildWebPageSchema(
        'Explore 3D Creative Showcase — Vizra AI Creative Studio',
        'Enter the Vizra 3D Creative Universe Showcase. Explore curated AI visuals inside an interactive perspective tunnel, inspect prompts, and launch in Omnia 1.0.',
        '/explore'
      ),
    ],
    prehydration: {
      eyebrow: 'VIZRA CREATIVE UNIVERSE SHOWCASE',
      h1: 'ENTER THE CREATIVE UNIVERSE.',
      lead: 'Explore a universe of ideas, visuals, and creative possibilities brought to life with AI inside the 3D perspective showcase, and launch starter prompts directly in Omnia 1.0.',
      sections: [
        {
          heading: 'Built for Every Creative Discipline (6 Creator Profiles)',
          body: 'Vizra scales from rapid conversational questions to full 10-stage creative production across six core creator workflows:',
          bullets: [
            'Creators & Directors: Synthesize motion concepts, 3-act cinematic treatments, and visual direction.',
            'Designers & Art Directors: Iterate dark-mode typographic hierarchies pairing Space Grotesk with Inter and high-contrast Obsidian tokens.',
            'Creative Developers: Build 60fps interactive React, TypeScript, and WebGL raymarched shader components.',
            'Students & Researchers: Ask complex scientific and academic questions with verified, source-grounded explanations.',
            'Writers & Storytellers: Brainstorm storylines, scripts, and editorial pieces naturally in English, Hindi, or Hinglish.',
            'Beginners & Explorers: Turn raw ideas into structured 10-stage digital projects step-by-step.',
          ],
        },
      ],
    },
  },
  '/pricing': {
    canonicalPath: '/pricing',
    title: 'Pricing & Compute Tiers — Vizra AI Creative Studio',
    description:
      'Compare Vizra’s Creator Free ($0), Omnia Pro ($19/mo), and VIZRA Studio ($64/mo) plans with transparent compute quotas and 10-stage creative workspaces.',
    isIndexable: true,
    robots: 'index, follow',
    ogType: 'website',
    breadcrumbLabel: 'Pricing & Compute Tiers',
    jsonLd: [
      buildBreadcrumbSchema('Pricing & Compute Tiers', '/pricing'),
      buildWebPageSchema(
        'Pricing & Compute Tiers — Vizra AI Creative Studio',
        'Compare Vizra’s Creator Free ($0), Omnia Pro ($19/mo), and VIZRA Studio ($64/mo) plans with transparent compute quotas and 10-stage creative workspaces.',
        '/pricing'
      ),
      PRICING_FAQ_SCHEMA,
    ],
    prehydration: {
      eyebrow: 'PRICING & STUDIO ENTITLEMENTS',
      h1: 'Predictable pricing engineered for individual creators and production teams.',
      lead: 'Start free with Omnia 1.0 conversational intelligence and grounded search, then upgrade as your creative pipeline scales into multi-stage production.',
      sections: [
        {
          heading: 'Plan Tiers & Compute Quotas',
          body: 'Three transparent tiers designed for solo creators, power builders, and studios. Note: Paid plan upgrade selections currently log early-access preview requests inside the platform without charging payment cards until commercial billing launches.',
          bullets: [
            'Creator Free ($0 / forever): Omnia 1.0 Quick, Think & Research modes, grounded Google Search citations, up to 3 active 10-stage projects, 60 requests/min rate quota, 10 MB multimodal attachments, and local history JSON export.',
            'Omnia Pro ($19/mo billed yearly — Save 20%, or $24/mo billed monthly): Unlimited 10-stage workspaces, 240 requests/min quota, 15 MB multimodal attachments, Lyria 3 AI Music Studio & Gemini Live Voice, DeepMind Science Hub, cross-device Firestore project sync, and personal memory bank.',
            'VIZRA Studio & Team ($64/mo billed yearly — Save 20%, or $79/mo billed monthly): Custom enterprise concurrency SLA, shared team workspaces with role permissions, private RAG corpus indexing, Developer Console API keys, VIZRA Engage & Technical SEO Diagnostic Suite, and priority onboarding.',
          ],
        },
        {
          heading: 'Full Plan Entitlement Comparison',
          body: 'Side-by-side comparison of limits, quotas, and studio capabilities across plans:',
          table: {
            headers: ['Feature / Entitlement', 'Creator Free', 'Omnia Pro', 'VIZRA Studio'],
            rows: [
              ['Monthly Price', '$0 / forever', '$24 / mo', '$79 / mo'],
              ['Annual Price (Save 20%)', '$0 / forever', '$19 / mo ($228/yr)', '$64 / mo ($768/yr)'],
              ['Active 10-Stage Projects', 'Up to 3 Projects', 'Unlimited', 'Unlimited + Shared Team'],
              ['Request Rate Quota', '60 req / min', '240 req / min', 'Custom Concurrency SLA'],
              ['Multimodal Attachments', 'Up to 10 MB', 'Up to 15 MB', 'Up to 15 MB + Batch RAG'],
              ['Grounded Web Search Citations', 'Included', 'Included', 'Included + Domain Filters'],
              ['Lyria 3 & Gemini Live Voice', 'Standard Preview', 'Unlimited Studio', 'Unlimited + Team Access'],
              ['DeepMind Science Hub (AlphaFold / PubChem)', 'Included', 'Included', 'Included'],
              ['Developer API Keys & VIZRA Engage', '—', '—', 'Included'],
            ],
          },
        },
        {
          heading: 'Frequently Asked Pricing Questions',
          body: 'Details on credit accounting, billing toggles, project preservation upon downgrade, and academic/enterprise grants:',
          faqs: PRICING_FAQS,
        },
      ],
    },
  },
  '/about': {
    canonicalPath: '/about',
    title: 'About VIZRA & Core Philosophy — Vizra AI Creative Studio',
    description:
      'Learn about Vizra’s mission, the Omnia 1.0 philosophy, and our commitment to response proportionality, verified citations, and persistent studio context.',
    isIndexable: true,
    robots: 'index, follow',
    ogType: 'website',
    breadcrumbLabel: 'About VIZRA',
    jsonLd: [
      buildBreadcrumbSchema('About VIZRA', '/about'),
      {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'About VIZRA & Core Philosophy',
        url: `${SITE_ORIGIN}/about`,
        description:
          'Learn about Vizra’s mission, the Omnia 1.0 philosophy, and our commitment to transparent, grounded AI creative workflows.',
        mainEntity: {
          '@id': `${SITE_ORIGIN}/#organization`,
        },
      },
    ],
    prehydration: {
      eyebrow: 'ABOUT VIZRA · CORE CREED',
      h1: '“Don’t just ask AI. Work with it.”',
      lead: 'Vizra was created to bridge the gap between fleeting AI chat threads and real finished creative work—uniting conversation, context, creativity, and workflow under one Obsidian studio platform.',
      sections: [
        {
          heading: 'Four Core Engineering Principles',
          body: 'Every capability in VIZRA and Omnia 1.0 adheres to deterministic engineering and editorial transparency standards:',
          bullets: [
            '1. Response Proportionality: Short greetings receive natural direct replies; complex design, coding, or research requests receive thorough structured execution.',
            '2. Zero Fabricated Citations: When external search grounding fails to confirm a source or query targets an unannounced product, Omnia states the uncertainty candidly.',
            '3. Persistent Studio Context: Long-running creative work persists across 10 project stages, design decisions, and research sources without losing thread coherence.',
            '4. Architectural Honesty: Live production capabilities are strictly separated in UI and documentation from staging prototypes and future R&D concepts.',
          ],
        },
        {
          heading: 'Who Vizra Is Built For',
          body: 'Designed for creators, film directors, motion designers, frontend/GLSL developers, researchers, and writers seeking speed with full creative control.',
        },
      ],
    },
  },
  '/contact': {
    canonicalPath: '/contact',
    title: 'Contact & Studio Inquiries — Vizra AI Creative Studio',
    description:
      'Contact the Vizra team for enterprise studio onboarding, technical support, partnership inquiries, or private beta early access to upcoming studio engines.',
    isIndexable: true,
    robots: 'index, follow',
    ogType: 'website',
    breadcrumbLabel: 'Contact & Studio Inquiries',
    jsonLd: [
      buildBreadcrumbSchema('Contact & Studio Inquiries', '/contact'),
      {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'Contact & Studio Inquiries — Vizra AI Creative Studio',
        url: `${SITE_ORIGIN}/contact`,
        description:
          'Contact the Vizra team for enterprise studio onboarding, technical support, partnership inquiries, or private beta early access.',
      },
    ],
    prehydration: {
      eyebrow: 'CONTACT & STUDIO ONBOARDING',
      h1: 'Connect with the Vizra team.',
      lead: 'Whether you are scaling a creative studio, integrating with our developer API, or requesting private beta access for upcoming engines, reach our team directly at /contact.',
      sections: [
        {
          heading: 'Direct Support Channels & Response SLAs',
          body: 'Inquiries submitted via the /contact form are routed via `POST /api/contact` and Early-Access requests are validated with strict payload checks:',
          bullets: [
            'Enterprise Studio & Pricing: Custom concurrency quotas, team seats, academic grants, and institutional onboarding.',
            'Platform & Technical Support: Troubleshooting for Omnia 1.0 workspace tools, 10-stage workflows, account controls, and security questions.',
            'Private Beta Early Access: Waitlist requests for Temporal Video & Scene Synthesis, Omnia Spatial Director, Harmonix, Chronos, and Syndicate.',
            'Response SLA — Studio & Pro Priority Support: Under 4 Hours.',
            'Response SLA — General Inquiries: Under 24 Hours.',
          ],
        },
      ],
    },
  },
  '/docs': {
    canonicalPath: '/docs',
    title: 'Public Documentation Centre (A–Z) — Vizra AI Creative Studio',
    description:
      'Complete A–Z Public Documentation Centre for VIZRA and Omnia 1.0 covering platform guides, verified feature availability, prompting, privacy, security, and troubleshooting.',
    isIndexable: true,
    robots: 'index, follow',
    ogType: 'article',
    breadcrumbLabel: 'Public Documentation',
    jsonLd: [
      buildBreadcrumbSchema('Public Documentation', '/docs'),
      {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: 'VIZRA Public Documentation Centre (Sections A–H)',
        description:
          'Complete A–Z Public Documentation Centre for VIZRA and Omnia 1.0 covering platform guides, verified feature availability, prompting, privacy, security, and troubleshooting.',
        url: `${SITE_ORIGIN}/docs`,
        author: {
          '@id': `${SITE_ORIGIN}/#organization`,
        },
        publisher: {
          '@id': `${SITE_ORIGIN}/#organization`,
        },
      },
    ],
    prehydration: {
      eyebrow: 'PUBLIC DOCUMENTATION CENTRE · SECTIONS A–H',
      h1: 'VIZRA Documentation',
      lead: 'Verified A–Z guides for creators, visitors, and teams covering Omnia 1.0, studio tools, 10-stage workflows, live vs. staged availability, privacy & safety controls, and troubleshooting.',
      sections: [
        {
          heading: '1. Complete Documentation Structure (Sections A–H)',
          body: 'Browse 50 public reference topics and 17 dedicated feature guides organized across eight clear sections:',
          bullets: [
            'Section A — Introduction (Topics 01–08): What VIZRA is, core philosophy, 18+ adult studio eligibility, getting started, and terminology.',
            'Section B — Understanding the Platform (Topics 09–15): Platform overview, how Omnia 1.0 assists users, project workflows, navigation, and device compatibility.',
            'Section C — Features & Tools (17 Feature Guides): Clear availability statuses (AVAILABLE, LIMITED, UNAVAILABLE, COMING SOON) across Chat, Live Web Research, Design, Code, Visual Canvas, AI Music Studio, Science Hub, Live Voice, and Knowledge Base.',
            'Section D & E — OMNIA Prompting & User Guides (Topics 16–29): Effective prompting habits, multimodal file workflows, citations, and 10-stage studio walkthroughs.',
            'Section F, G & H — Security, Troubleshooting & Technical Info (Topics 30–50): Privacy controls, 18+ safety safeguards, FAQs, system limits, and Public API status.',
          ],
        },
        {
          heading: '2. Verified Availability, Operational Limits & Public API Status',
          body: 'VIZRA operates transparently by separating production features from staged concepts:',
          bullets: [
            'Public External API Status (UNAVAILABLE — Topic 48): VIZRA does not currently offer a public external REST API, SDK, or webhook platform; interactive creation operates inside /ai and /workspace.',
            'Prompt & File Bounds: Up to 50,000 characters per prompt; up to 5 file attachments per turn (10 MB max per file in chat); Knowledge Base Explorer local index up to 25 MB.',
            'Staged Features Disclosed Clearly: Temporal Video & Scene Synthesis (COMING SOON) and external OAuth cloud connectors (Drive, GitHub, Figma, Canva, YouTube, Notion, Dropbox) remain UNAVAILABLE / In Staging.',
          ],
        },
        {
          heading: '3. Security, Privacy & SSRF Controls',
          body: 'All AI generation runs strictly through protected server proxies without client-exposed API keys. URL inspection validates HTTP/HTTPS protocols and DNS resolution while blocking loopback (127.0.0.1, ::1), cloud metadata (169.254.169.254), and private RFC1918 networks. Diagnostic and user workspaces remain isolated behind authentication and `noindex, nofollow` controls.',
        },
      ],
    },
  },
  '/blog': {
    canonicalPath: '/blog',
    title: 'Blog & Studio Updates — Vizra AI Creative Studio',
    description:
      'Official blog and editorial updates for VIZRA AI Creative Studio and Omnia 1.0.',
    isIndexable: true,
    robots: 'index, follow',
    ogType: 'website',
    breadcrumbLabel: 'Blog',
    jsonLd: [
      buildBreadcrumbSchema('Blog', '/blog'),
      {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'VIZRA Blog & Studio Updates',
        url: `${SITE_ORIGIN}/blog`,
        description:
          'Official editorial announcements, product notes, and workflow guides from VIZRA AI Creative Studio.',
        publisher: {
          '@id': `${SITE_ORIGIN}/#organization`,
        },
      },
    ],
    prehydration: {
      eyebrow: 'VIZRA EDITORIAL & STUDIO UPDATES',
      h1: 'Blog',
      lead: 'Product announcements, engineering notes, and creative workflow guides from VIZRA AI Creative Studio.',
      sections: [
        {
          heading: 'Editorial Archive Status',
          body: 'No articles published yet. Verified product releases, technical essays, and Omnia 1.0 creative workflow guides will be indexed here and at /blog/:slug as they are released.',
          bullets: [
            'Browse Documentation (/docs): Explore complete A–Z user and developer reference guides across Sections A–H.',
            'Platform Features (/features): Review the 4 Core Pillars, 5-step Idea-to-Finish pipeline, and 10-stage workflow architecture.',
            'Creative Studio (/studio): Inspect production 60fps engines and R&D roadmap prototypes.',
          ],
        },
      ],
    },
  },
  '/terms-and-conditions': {
    canonicalPath: '/terms-and-conditions',
    title: 'Terms & Conditions — Vizra AI Creative Studio',
    description:
      'Terms and Conditions governing use of Vizra AI Creative Studio and Omnia 1.0, user responsibilities, acceptable use, intellectual property, third-party advertising, and liability limits.',
    isIndexable: true,
    robots: 'index, follow',
    ogType: 'website',
    breadcrumbLabel: 'Terms & Conditions',
    jsonLd: [
      buildBreadcrumbSchema('Terms & Conditions', '/terms-and-conditions'),
      buildWebPageSchema(
        'Terms & Conditions — Vizra AI Creative Studio',
        'Terms and Conditions governing use of Vizra AI Creative Studio and Omnia 1.0, user responsibilities, acceptable use, intellectual property, third-party advertising, and liability limits.',
        '/terms-and-conditions'
      ),
    ],
    prehydration: {
      eyebrow: 'PLATFORM AGREEMENT & RULES OF USE · POLICY V2026-11',
      h1: 'Terms & Conditions',
      lead: 'Effective Date: November 11, 2026 · Updated: November 18, 2026. Official Terms and Conditions governing access to VIZRA AI Creative Studio, Omnia 1.0, and advertising-supported public pages.',
      sections: [
        {
          heading: '1. Age Eligibility (`STRICT_18_PLUS`) & Child Online Safety Controls',
          body: 'VIZRA currently operates strictly as an 18+ adult creative studio (`STRICT_18_PLUS`), with minor-safe safeguards enforced in server middleware:',
          bullets: [
            'Active Operating Policy: 18+ minimum age requirement; passive minor access is rejected.',
            'Jurisdictional Verifiable Parental Consent Readiness (Option 3): Designed without storing raw minor birthdates or unhashed guardian emails; live external parental verification remains blocked (`HTTP 424`) pending accredited vendor integration.',
            'Age-Appropriate Feature Restrictions (Option 4): Middleware blocks under-18 flagged sessions from Live Voice (`/live`), external workspace OAuth connectors, unrestricted audio synthesis, paid upgrades, and sponsored VIZRA Engage cards, paired with strict `BLOCK_LOW_AND_ABOVE` safety thresholds.',
          ],
        },
        {
          heading: '2. Intellectual Property, AI Copyrightability & DMCA Procedure',
          body: 'Users retain ownership of original human inputs. Under USCO guidance, purely AI-generated outputs without sufficient human authorship may not qualify for copyright registration. Copyright takedown notices under 17 U.S.C. § 512 may be submitted via /contact.',
        },
        {
          heading: '3. Acceptable Use, API Limits, AI Provenance & Third-Party Advertising',
          body: 'Requests must respect the 50,000-character prompt limit, 15MB attachment cap, and safety prohibitions against CSAM/CSAE, self-harm, CBRN, and non-consensual synthetic media. Exported visuals and audio include machine-readable AI provenance aligned with EU AI Act Article 50(2). Public informational pages integrate Google AdSense (publisher pub-2808034055890408); VIZRA does not endorse third-party advertisers, external ad links are governed by third-party terms, and ad availability is not guaranteed.',
        },
      ],
    },
  },
  '/privacy-policy': {
    canonicalPath: '/privacy-policy',
    title: 'Privacy Policy & Data Protection — Vizra AI Studio',
    description:
      'Privacy Policy detailing information collection, Google AdSense advertising disclosures, processing, retention, third-party processors, security controls, and user privacy rights in Vizra.',
    isIndexable: true,
    robots: 'index, follow',
    ogType: 'website',
    breadcrumbLabel: 'Privacy Policy',
    jsonLd: [
      buildBreadcrumbSchema('Privacy Policy', '/privacy-policy'),
      buildWebPageSchema(
        'Privacy Policy & Data Protection — Vizra AI Studio',
        'Privacy Policy detailing information collection, Google AdSense advertising disclosures, processing, retention, third-party processors, security controls, and user privacy rights in Vizra.',
        '/privacy-policy'
      ),
    ],
    prehydration: {
      eyebrow: 'DATA PROTECTION & PRIVACY NOTICE · POLICY V2026-11',
      h1: 'Privacy Policy',
      lead: 'Effective Date: November 11, 2026 · Updated: November 18, 2026. How VIZRA AI Creative Studio collects, processes, protects, discloses Google AdSense advertising on public pages, and lets you export or erase your data.',
      sections: [
        {
          heading: '1. Data Collected & Legal Bases',
          body: 'VIZRA practices strict data minimization (GDPR Arts. 6, 15–22; CCPA/CPRA; India DPDP Act 2023):',
          bullets: [
            'Account Information (Optional Google Sign-In): Firebase User UID, display name, email, and avatar (`users/{userId}`).',
            'Workspace Prompts & Attachments: User prompts and uploaded multimodal files routed via HTTPS proxy (`/api/*`) to Google Gemini (`@google/genai`), with personal memories scoped per UID and scrubbed for email/phone/key patterns.',
            'Consent & Security Records: Anonymous random consent UUID (`consentId`) without raw IP logging; login security notification alerts mask IPs (`/24` IPv4 or `/48` IPv6).',
            'Zero Data Sales: VIZRA never sells personal data to data brokers.',
          ],
        },
        {
          heading: '2. Google AdSense, Advertising Technologies & Regional Rights',
          body: 'Eligible public pages load Google AdSense (`ca-pub-2808034055890408`), which is excluded from private AI workspaces (`/ai`, `/workspace`, `/history`, `/settings`). Google and its partners may use cookies or device identifiers to serve personalized or non-personalized ads (see https://policies.google.com/technologies/ads). When enabled in the AdSense publisher console, regional consent for EEA/UK/Switzerland (GDPR/TCF) and applicable US states is managed via Google Privacy & Messaging alongside VIZRA consent controls.',
        },
        {
          heading: '3. Subprocessors & Self-Service Rights',
          body: 'Infrastructure and advertising subprocessors include Google Cloud & Firebase (Auth/Firestore), Google Gemini API & Lyria, Google AdSense & Funding Choices, EMBL-EBI AlphaFold DB & NCBI PubChem/PubMed (Science Hub), Vercel Inc. (hosting & cookieless Web Analytics), Google Fonts, and optional Google Sheets / Resend email. Users can export JSON threads from /history or permanently erase server and local account records via `DELETE /api/account/data` on /settings.',
        },
      ],
    },
  },
  '/cookie-policy': {
    canonicalPath: '/cookie-policy',
    title: 'Cookie & Storage Policy — Vizra AI Creative Studio',
    description:
      'Cookie and browser storage policy explaining strictly necessary, analytics, functional, marketing, and Google AdSense advertising technologies used in Vizra and consent controls.',
    isIndexable: true,
    robots: 'index, follow',
    ogType: 'website',
    breadcrumbLabel: 'Cookie Policy',
    jsonLd: [
      buildBreadcrumbSchema('Cookie Policy', '/cookie-policy'),
      buildWebPageSchema(
        'Cookie & Storage Policy — Vizra AI Creative Studio',
        'Cookie and browser storage policy explaining strictly necessary, analytics, functional, marketing, and Google AdSense advertising technologies used in Vizra and consent controls.',
        '/cookie-policy'
      ),
    ],
    prehydration: {
      eyebrow: 'CONSENT & BROWSER STORAGE GOVERNANCE · POLICY V2026-11',
      h1: 'Cookie & Storage Policy',
      lead: 'Effective Date: November 11, 2026 · Updated: November 18, 2026. Transparent disclosure of browser localStorage, IndexedDB, cookieless Vercel Web Analytics, Google AdSense advertising technologies, and consent withdrawal controls.',
      sections: [
        {
          heading: '1. First-Party Storage Categories, Cookieless Analytics & Google AdSense',
          body: 'VIZRA first-party optional categories (`Analytics` / `@vercel/speed-insights`, `Functional`, and `Marketing` / VIZRA Engage) default to OFF until explicit opt-in. `@vercel/analytics` operates cookieless without cross-site identifiers. On eligible public pages, Google AdSense (`pub-2808034055890408`) is integrated and may read/write advertising or measurement cookies subject to regional Google Privacy & Messaging CMP choices; rejecting optional advertising cookies affects personalization rather than removing non-personalized contextual ads.',
        },
        {
          heading: '2. Browser Storage & Technology Inventory',
          body: 'Complete inventory of browser keys, telemetry scripts, and third-party advertising technologies referenced in VIZRA:',
          table: {
            headers: ['Key / Technology', 'Category', 'Storage Type', 'Purpose'],
            rows: [
              ['vizra_cookie_consent_v1', 'Strictly Necessary', 'localStorage', 'Stores versioned first-party consent state'],
              ['vizra_anonymous_consent_id_v1', 'Strictly Necessary', 'localStorage', 'Anonymous UUID linking consent audit events'],
              ['firebase:authUser:*', 'Strictly Necessary', 'IndexedDB / Local', 'Maintains authenticated Google sign-in session'],
              ['@vercel/analytics', 'Cookieless Web', 'Cookieless Beacon', 'Aggregate pageview metrics without cookies'],
              ['@vercel/speed-insights', 'Analytics (Opt-In)', 'Telemetry Script', 'Core Web Vitals gated behind Analytics consent'],
              ['vizra_theme_mode_v1', 'Functional', 'localStorage', 'Remembers Dark/Light UI theme across reloads'],
              ['omnia_conversations_v1', 'Functional', 'localStorage', 'Local Omnia chat threads for /history and /ai'],
              ['vizra_engage_dismissed_cards', 'Marketing (Opt-In)', 'sessionStorage', 'Dismissed studio tips purged on consent withdrawal'],
              ['Google AdSense / Funding Choices', 'Advertising (Third-Party)', 'Third-Party Cookies / Storage', 'Ad delivery, frequency capping, fraud prevention, and regional consent signals on public pages'],
            ],
          },
        },
      ],
    },
  },

  // Utility, User-Specific & Private Diagnostic Routes (excluded from sitemap, noindex, nofollow)
  '/ai': {
    canonicalPath: '/ai',
    title: 'Omnia 1.0 AI Workspace — Vizra AI Creative Studio',
    description:
      'Interactive Omnia 1.0 multimodal workspace for conversational reasoning, grounded web research, code synthesis, Lyria 3 music, and 10-stage creative projects.',
    isIndexable: false,
    robots: 'noindex, nofollow',
    ogType: 'website',
    jsonLd: [],
    prehydration: {
      eyebrow: 'OMNIA 1.0 LIVE WORKSPACE · NOINDEX',
      h1: 'Omnia 1.0 AI Creative Workspace',
      lead: 'Private interactive workspace for multimodal reasoning, grounded research, code synthesis, and 10-stage creative projects.',
      sections: [],
    },
  },
  '/history': {
    canonicalPath: '/history',
    title: 'Conversation History — Vizra AI Creative Studio',
    description:
      'Review, search, export, and manage your saved Omnia 1.0 conversation threads and creative sessions.',
    isIndexable: false,
    robots: 'noindex, nofollow',
    ogType: 'website',
    jsonLd: [],
    prehydration: {
      eyebrow: 'SESSION ARCHIVE · NOINDEX',
      h1: 'Saved Conversations',
      lead: 'Private user-specific session archive for managing saved Omnia 1.0 threads.',
      sections: [],
    },
  },
  '/settings': {
    canonicalPath: '/settings',
    title: 'Application Settings — Vizra AI Creative Studio',
    description:
      'Configure your Vizra studio theme, Omnia 1.0 response style, language preferences, local cache, and privacy controls.',
    isIndexable: false,
    robots: 'noindex, nofollow',
    ogType: 'website',
    jsonLd: [],
    prehydration: {
      eyebrow: 'STUDIO PREFERENCES · NOINDEX',
      h1: 'Application Settings',
      lead: 'Private account preferences, response style controls, and data erasure tools.',
      sections: [],
    },
  },
  '/workspace': {
    canonicalPath: '/workspace',
    title: 'Workspace & Developer Console — Vizra AI Studio',
    description:
      'Manage your 10-stage creative projects, uploaded multimodal assets, D3 credit usage analytics, and developer API tokens.',
    isIndexable: false,
    robots: 'noindex, nofollow',
    ogType: 'website',
    jsonLd: [],
    prehydration: {
      eyebrow: 'WORKSPACE & DEVELOPER CONSOLE · NOINDEX',
      h1: 'Workspace & Developer Console',
      lead: 'Private user console for 10-stage creative projects, usage telemetry, and workspace tools.',
      sections: [],
    },
  },
  '/seo-diagnostics': {
    canonicalPath: '/seo-diagnostics',
    title: 'Search & Crawler Diagnostic Console — Vizra Admin',
    description:
      'Restricted administrator diagnostic console for verifying robots.txt, XML sitemaps, HTTP headers, and SSRF security.',
    isIndexable: false,
    robots: 'noindex, nofollow',
    ogType: 'website',
    jsonLd: [],
    prehydration: {
      eyebrow: 'ADMINISTRATOR DIAGNOSTICS · NOINDEX',
      h1: 'Search Indexing & Crawlability Verification',
      lead: 'Restricted administrator console for technical SEO and crawler verification.',
      sections: [],
    },
  },
};

const NOT_FOUND_DEFINITION: Omit<RouteSeoDefinition, 'canonicalPath'> = {
  title: '404 Page Not Found — Vizra AI Creative Studio',
  description:
    'The requested route could not be found on the Vizra AI Creative Studio platform.',
  isIndexable: false,
  robots: 'noindex, nofollow',
  ogType: 'website',
  jsonLd: [],
  prehydration: {
    eyebrow: 'HTTP 404 · ROUTE NOT FOUND',
    h1: 'This route does not exist in the Vizra workspace.',
    lead: 'The requested URL could not be resolved. Return to the Vizra homepage or browse our public documentation.',
    sections: [],
  },
};

export function normalizePathname(rawPathname: string): string {
  const withoutQuery = (rawPathname || '/').split('?')[0].split('#')[0].trim();
  if (!withoutQuery || withoutQuery === '/') return '/';
  const withLeadingSlash = withoutQuery.startsWith('/')
    ? withoutQuery
    : `/${withoutQuery}`;
  return withLeadingSlash.length > 1 && withLeadingSlash.endsWith('/')
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
}

export interface SeoOverrides {
  title?: string;
  description?: string;
  canonicalPath?: string | null;
  noindex?: boolean;
}

/**
 * Resolves the complete, deterministic SEO payload for any route path.
 */
export function resolveRouteSeoPayload(
  rawPathname: string,
  overrides?: SeoOverrides
): RouteSeoPayload {
  const normalizedPath = normalizePathname(rawPathname);
  const redirectTarget = REDIRECT_ALIASES[normalizedPath];
  const effectivePath = redirectTarget || normalizedPath;

  const matchedDef = ROUTE_DEFINITIONS[effectivePath];

  if (!matchedDef && effectivePath.startsWith('/blog/')) {
    const slug = effectivePath.slice('/blog/'.length);
    const publishedPost = getPublishedBlogPost(slug);
    if (publishedPost) {
      const canonicalPath = `/blog/${publishedPost.slug}`;
      const canonicalUrl = `${SITE_ORIGIN}${canonicalPath}`;
      return {
        requestedPath: normalizedPath,
        canonicalPath,
        canonicalUrl,
        httpStatus: 200,
        isIndexable: true,
        includeSocialPreview: true,
        robots: 'index, follow',
        xRobotsTag: 'index, follow',
        title: `${publishedPost.title} — Vizra Blog`,
        description: publishedPost.description,
        ogTitle: `${publishedPost.title} — Vizra Blog`,
        ogDescription: publishedPost.description,
        ogType: 'article',
        ogUrl: canonicalUrl,
        ogImage: DEFAULT_OG_IMAGE,
        ogImageWidth: OG_IMAGE_WIDTH,
        ogImageHeight: OG_IMAGE_HEIGHT,
        ogImageAlt: OG_IMAGE_ALT,
        ogSiteName: SITE_NAME,
        ogLocale: 'en_US',
        twitterCard: 'summary_large_image',
        twitterTitle: `${publishedPost.title} — Vizra Blog`,
        twitterDescription: publishedPost.description,
        twitterImage: DEFAULT_OG_IMAGE,
        twitterImageAlt: OG_IMAGE_ALT,
        jsonLd: [
          buildBreadcrumbSchema(publishedPost.title, canonicalPath),
          {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: publishedPost.title,
            description: publishedPost.description,
            datePublished: publishedPost.publishedAt,
            dateModified: publishedPost.updatedAt || publishedPost.publishedAt,
            url: canonicalUrl,
            author: {
              '@type': 'Organization',
              name: publishedPost.author,
            },
            publisher: {
              '@id': `${SITE_ORIGIN}/#organization`,
            },
          },
        ],
        prehydration: {
          eyebrow: `VIZRA BLOG · ${publishedPost.category}`,
          h1: publishedPost.title,
          lead: publishedPost.description,
          sections: [
            {
              heading: publishedPost.category,
              body: publishedPost.body.join(' '),
            },
          ],
        },
      };
    }
  }

  if (!matchedDef) {
    // Unknown 404 Route — must never receive a self-referencing canonical or misleading homepage social preview
    const title = overrides?.title || NOT_FOUND_DEFINITION.title;
    const description =
      overrides?.description || NOT_FOUND_DEFINITION.description;

    return {
      requestedPath: normalizedPath,
      canonicalPath: null,
      canonicalUrl: null,
      httpStatus: 404,
      isIndexable: false,
      includeSocialPreview: false,
      robots: 'noindex, nofollow',
      xRobotsTag: 'noindex, nofollow',
      title,
      description,
      ogTitle: null,
      ogDescription: null,
      ogType: null,
      ogUrl: null,
      ogImage: null,
      ogImageWidth: null,
      ogImageHeight: null,
      ogImageAlt: null,
      ogSiteName: null,
      ogLocale: null,
      twitterCard: null,
      twitterTitle: null,
      twitterDescription: null,
      twitterImage: null,
      twitterImageAlt: null,
      jsonLd: [],
      prehydration: NOT_FOUND_DEFINITION.prehydration,
    };
  }

  const title = overrides?.title || matchedDef.title;
  const description = overrides?.description || matchedDef.description;
  const isIndexable =
    overrides?.noindex === true ? false : matchedDef.isIndexable;
  const robots: 'index, follow' | 'noindex, nofollow' = isIndexable
    ? 'index, follow'
    : 'noindex, nofollow';

  const resolvedCanonicalPath =
    overrides?.canonicalPath === null
      ? null
      : overrides?.canonicalPath || matchedDef.canonicalPath;

  const canonicalUrl =
    resolvedCanonicalPath !== null
      ? `${SITE_ORIGIN}${resolvedCanonicalPath === '/' ? '/' : resolvedCanonicalPath}`
      : null;

  // Exclude private, utility, diagnostic, and non-indexable routes from public social preview cards
  const includeSocialPreview = isIndexable && canonicalUrl !== null;

  return {
    requestedPath: normalizedPath,
    canonicalPath: resolvedCanonicalPath,
    canonicalUrl,
    httpStatus: redirectTarget ? 301 : 200,
    redirectTo: redirectTarget,
    isIndexable,
    includeSocialPreview,
    robots,
    xRobotsTag: robots,
    title,
    description,
    ogTitle: includeSocialPreview ? title : null,
    ogDescription: includeSocialPreview ? description : null,
    ogType: includeSocialPreview ? matchedDef.ogType : null,
    ogUrl: includeSocialPreview ? canonicalUrl : null,
    ogImage: includeSocialPreview ? DEFAULT_OG_IMAGE : null,
    ogImageWidth: includeSocialPreview ? OG_IMAGE_WIDTH : null,
    ogImageHeight: includeSocialPreview ? OG_IMAGE_HEIGHT : null,
    ogImageAlt: includeSocialPreview ? OG_IMAGE_ALT : null,
    ogSiteName: includeSocialPreview ? SITE_NAME : null,
    ogLocale: includeSocialPreview ? 'en_US' : null,
    twitterCard: includeSocialPreview ? 'summary_large_image' : null,
    twitterTitle: includeSocialPreview ? title : null,
    twitterDescription: includeSocialPreview ? description : null,
    twitterImage: includeSocialPreview ? DEFAULT_OG_IMAGE : null,
    twitterImageAlt: includeSocialPreview ? OG_IMAGE_ALT : null,
    jsonLd: isIndexable ? matchedDef.jsonLd : [],
    prehydration: matchedDef.prehydration,
  };
}

/**
 * Updates browser DOM <head> metadata deterministically without duplicates or stale tags.
 */
export function applySeoToDocument(payload: RouteSeoPayload): void {
  if (typeof document === 'undefined') return;

  document.title = payload.title;

  const upsertMeta = (
    attrName: 'name' | 'property',
    attrValue: string,
    content: string | null
  ) => {
    const selector = `meta[${attrName}="${attrValue}"]`;
    const matches = Array.from(document.head.querySelectorAll(selector));

    if (content === null) {
      matches.forEach((el) => el.remove());
      return;
    }

    if (matches.length > 0) {
      matches[0].setAttribute('content', content);
      for (let i = 1; i < matches.length; i++) {
        matches[i].remove();
      }
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute(attrName, attrValue);
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
    }
  };

  upsertMeta('name', 'description', payload.description);
  upsertMeta('name', 'robots', payload.robots);
  upsertMeta('name', 'googlebot', payload.robots);

  upsertMeta('property', 'og:title', payload.ogTitle);
  upsertMeta('property', 'og:description', payload.ogDescription);
  upsertMeta('property', 'og:type', payload.ogType);
  upsertMeta('property', 'og:url', payload.ogUrl);
  upsertMeta('property', 'og:image', payload.ogImage);
  upsertMeta('property', 'og:image:width', payload.ogImageWidth);
  upsertMeta('property', 'og:image:height', payload.ogImageHeight);
  upsertMeta('property', 'og:image:alt', payload.ogImageAlt);
  upsertMeta('property', 'og:site_name', payload.ogSiteName);
  upsertMeta('property', 'og:locale', payload.ogLocale);

  upsertMeta('name', 'twitter:card', payload.twitterCard);
  upsertMeta('name', 'twitter:title', payload.twitterTitle);
  upsertMeta('name', 'twitter:description', payload.twitterDescription);
  upsertMeta('name', 'twitter:image', payload.twitterImage);
  upsertMeta('name', 'twitter:image:alt', payload.twitterImageAlt);

  const canonicalLinks = Array.from(
    document.head.querySelectorAll('link[rel="canonical"]')
  );
  if (payload.canonicalUrl) {
    if (canonicalLinks.length > 0) {
      canonicalLinks[0].setAttribute('href', payload.canonicalUrl);
      for (let i = 1; i < canonicalLinks.length; i++) {
        canonicalLinks[i].remove();
      }
    } else {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', payload.canonicalUrl);
      document.head.appendChild(link);
    }
  } else {
    canonicalLinks.forEach((el) => el.remove());
  }

  const existingJsonLd = Array.from(
    document.head.querySelectorAll('script[type="application/ld+json"]')
  );
  if (payload.jsonLd && payload.jsonLd.length > 0) {
    const serialized = JSON.stringify(
      payload.jsonLd.length === 1 ? payload.jsonLd[0] : payload.jsonLd
    ).replace(/</g, '\\u003c');

    if (existingJsonLd.length > 0) {
      existingJsonLd[0].id = 'vizra-jsonld';
      existingJsonLd[0].textContent = serialized;
      for (let i = 1; i < existingJsonLd.length; i++) {
        existingJsonLd[i].remove();
      }
    } else {
      const script = document.createElement('script');
      script.id = 'vizra-jsonld';
      script.type = 'application/ld+json';
      script.textContent = serialized;
      document.head.appendChild(script);
    }
  } else {
    existingJsonLd.forEach((el) => el.remove());
  }

  // Ensure Google AdSense script is mounted once if user navigated client-side from a private route onto an eligible public route
  if (payload.isIndexable && typeof document.head?.querySelectorAll === 'function') {
    const existingAdSenseScripts = Array.from(
      document.head.querySelectorAll('script')
    ).filter((el) => {
      const src = el.getAttribute?.('src') || '';
      return src.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js');
    });

    if (existingAdSenseScripts.length === 0) {
      const adScript = document.createElement('script');
      adScript.async = true;
      adScript.setAttribute(
        'src',
        'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2808034055890408'
      );
      adScript.setAttribute('crossorigin', 'anonymous');
      document.head.appendChild(adScript);
    }
  }
}

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Generates visible, Obsidian dark-themed semantic HTML for `<div id="root">`
 * with zero nested `<div>` elements so any crawler or HTML parser extracts
 * complete headings, navigation links, feature lists, tables, and FAQs cleanly
 * prior to React mount. React cleanly replaces `#root` contents on boot.
 */
export function buildPrehydrationRootHtml(payload: RouteSeoPayload): string {
  if (!payload.isIndexable) {
    return `<!-- VIZRA_PRERENDER_START -->
      <main style="background:#050505;color:#e5e5e5;font-family:Inter,system-ui,sans-serif;max-width:48rem;margin:4rem auto;padding:2rem;">
        <p style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#eb3b2d;margin:0 0 0.75rem;">${escapeHtmlText(payload.prehydration.eyebrow)}</p>
        <h1 style="font-size:2rem;line-height:1.2;color:#ffffff;margin:0 0 0.75rem;">${escapeHtmlText(payload.prehydration.h1)}</h1>
        <p style="font-size:1rem;line-height:1.6;color:#a3a3a3;margin:0 0 1.5rem;">${escapeHtmlText(payload.prehydration.lead)}</p>
        <nav aria-label="Primary recovery links"><a href="/" style="color:#ffffff;text-decoration:underline;margin-right:1.25rem;">Return to VIZRA Home</a><a href="/docs" style="color:#d4d4d4;text-decoration:underline;">Technical Documentation</a></nav>
      </main>
      <!-- VIZRA_PRERENDER_END -->`;
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/features', label: 'Features' },
    { href: '/tools', label: 'AI Tools' },
    { href: '/studio', label: 'Creative Studio' },
    { href: '/explore', label: 'Explore 3D' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/docs', label: 'Docs' },
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  const navHtml = navLinks
    .map(
      (link) =>
        `<a href="${escapeHtmlAttr(link.href)}" style="color:${
          payload.canonicalPath === link.href ? '#ffffff' : '#a3a3a3'
        };text-decoration:none;font-size:13px;margin-right:16px;">${escapeHtmlText(link.label)}</a>`
    )
    .join('');

  const sectionsHtml = payload.prehydration.sections
    .map((sec) => {
      const bulletsHtml =
        sec.bullets && sec.bullets.length > 0
          ? `<ul style="margin:0.75rem 0 0;padding-left:1.25rem;color:#d4d4d4;line-height:1.7;">${sec.bullets
              .map((b) => `<li style="margin-bottom:0.4rem;">${escapeHtmlText(b)}</li>`)
              .join('')}</ul>`
          : '';

      const tableHtml = sec.table
        ? `<table style="width:100%;border-collapse:collapse;margin-top:1rem;font-size:13px;text-align:left;color:#e5e5e5;">
            <thead><tr style="border-bottom:1px solid #262626;">${sec.table.headers
              .map((h) => `<th style="padding:10px 8px;color:#ffffff;">${escapeHtmlText(h)}</th>`)
              .join('')}</tr></thead>
            <tbody>${sec.table.rows
              .map(
                (row) =>
                  `<tr style="border-bottom:1px solid #171717;">${row
                    .map((cell) => `<td style="padding:10px 8px;color:#d4d4d4;">${escapeHtmlText(cell)}</td>`)
                    .join('')}</tr>`
              )
              .join('')}</tbody>
          </table>`
        : '';

      const faqsHtml =
        sec.faqs && sec.faqs.length > 0
          ? `<dl style="margin:1rem 0 0;">${sec.faqs
              .map(
                (f) =>
                  `<dt style="font-weight:600;color:#ffffff;margin-top:0.9rem;">${escapeHtmlText(f.q)}</dt><dd style="margin:0.35rem 0 0;color:#a3a3a3;line-height:1.6;">${escapeHtmlText(f.a)}</dd>`
              )
              .join('')}</dl>`
          : '';

      return `<section style="margin-top:2rem;padding:1.5rem;border:1px solid #1f1f1f;border-radius:12px;background:#111111;">
          <h2 style="font-size:1.25rem;color:#ffffff;margin:0 0 0.6rem;">${escapeHtmlText(sec.heading)}</h2>
          <p style="font-size:0.95rem;line-height:1.65;color:#a3a3a3;margin:0;">${escapeHtmlText(sec.body)}</p>${bulletsHtml}${tableHtml}${faqsHtml}
        </section>`;
    })
    .join('\n');

  return `<!-- VIZRA_PRERENDER_START -->
      <header style="background:#050505;border-bottom:1px solid #1a1a1a;padding:18px 24px;">
        <nav aria-label="Main navigation" style="max-width:68rem;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;gap:8px;">
          <a href="/" style="color:#ffffff;font-weight:700;letter-spacing:0.08em;text-decoration:none;margin-right:24px;">VIZRA</a>
          ${navHtml}
        </nav>
      </header>
      <main style="background:#050505;color:#e5e5e5;font-family:Inter,system-ui,sans-serif;max-width:68rem;margin:0 auto;padding:48px 24px 56px;">
        <p style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#eb3b2d;margin:0 0 0.75rem;">${escapeHtmlText(payload.prehydration.eyebrow)}</p>
        <h1 style="font-size:2.25rem;line-height:1.15;color:#ffffff;margin:0 0 1rem;">${escapeHtmlText(payload.prehydration.h1)}</h1>
        <p style="font-size:1.05rem;line-height:1.65;color:#d4d4d4;margin:0 0 2rem;max-width:52rem;">${escapeHtmlText(payload.prehydration.lead)}</p>
        ${sectionsHtml}
      </main>
      <footer style="background:#050505;border-top:1px solid #1a1a1a;padding:24px;color:#737373;font-size:12px;">
        <nav aria-label="Footer navigation" style="max-width:68rem;margin:0 auto;display:flex;flex-wrap:wrap;gap:16px;">
          <span>VIZRA — AI Creative Studio &amp; Omnia 1.0</span>
          <a href="/terms-and-conditions" style="color:#a3a3a3;text-decoration:none;">Terms &amp; Conditions</a>
          <a href="/privacy-policy" style="color:#a3a3a3;text-decoration:none;">Privacy Policy</a>
          <a href="/cookie-policy" style="color:#a3a3a3;text-decoration:none;">Cookie Policy</a>
          <a href="/llms.txt" style="color:#a3a3a3;text-decoration:none;">llms.txt</a>
          <a href="/sitemap.xml" style="color:#a3a3a3;text-decoration:none;">Sitemap</a>
        </nav>
      </footer>
      <!-- VIZRA_PRERENDER_END -->`;
}

/**
 * Injects route-specific metadata, JSON-LD, and complete visible semantic HTML
 * inside `<div id="root">` for initial server responses and prerendered static files.
 */
export function injectSeoIntoHtml(
  rawHtml: string,
  payload: RouteSeoPayload
): string {
  const safeTitle = escapeHtmlText(payload.title);
  const safeDesc = escapeHtmlAttr(payload.description);
  const safeRobots = escapeHtmlAttr(payload.robots);

  const canonicalTag = payload.canonicalUrl
    ? `\n    <link rel="canonical" href="${escapeHtmlAttr(payload.canonicalUrl)}" />`
    : '';

  const socialTagsBlock =
    payload.includeSocialPreview &&
    payload.ogTitle &&
    payload.ogDescription &&
    payload.ogType &&
    payload.ogUrl &&
    payload.ogImage &&
    payload.ogImageWidth &&
    payload.ogImageHeight &&
    payload.ogImageAlt &&
    payload.ogSiteName &&
    payload.ogLocale &&
    payload.twitterCard &&
    payload.twitterTitle &&
    payload.twitterDescription &&
    payload.twitterImage &&
    payload.twitterImageAlt
      ? `\n    <meta property="og:title" content="${escapeHtmlAttr(payload.ogTitle)}" />
    <meta property="og:description" content="${escapeHtmlAttr(payload.ogDescription)}" />
    <meta property="og:type" content="${escapeHtmlAttr(payload.ogType)}" />
    <meta property="og:url" content="${escapeHtmlAttr(payload.ogUrl)}" />
    <meta property="og:image" content="${escapeHtmlAttr(payload.ogImage)}" />
    <meta property="og:image:width" content="${escapeHtmlAttr(payload.ogImageWidth)}" />
    <meta property="og:image:height" content="${escapeHtmlAttr(payload.ogImageHeight)}" />
    <meta property="og:image:alt" content="${escapeHtmlAttr(payload.ogImageAlt)}" />
    <meta property="og:site_name" content="${escapeHtmlAttr(payload.ogSiteName)}" />
    <meta property="og:locale" content="${escapeHtmlAttr(payload.ogLocale)}" />
    <meta name="twitter:card" content="${escapeHtmlAttr(payload.twitterCard)}" />
    <meta name="twitter:title" content="${escapeHtmlAttr(payload.twitterTitle)}" />
    <meta name="twitter:description" content="${escapeHtmlAttr(payload.twitterDescription)}" />
    <meta name="twitter:image" content="${escapeHtmlAttr(payload.twitterImage)}" />
    <meta name="twitter:image:alt" content="${escapeHtmlAttr(payload.twitterImageAlt)}" />`
      : '';

  const jsonLdTag =
    payload.jsonLd && payload.jsonLd.length > 0
      ? `\n    <script id="vizra-jsonld" type="application/ld+json">${JSON.stringify(
          payload.jsonLd.length === 1 ? payload.jsonLd[0] : payload.jsonLd
        ).replace(/</g, '\\u003c')}</script>`
      : '';

  const headBlock = `<!-- VIZRA_SEO_HEAD_START -->
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}" />
    <meta name="robots" content="${safeRobots}" />
    <meta name="googlebot" content="${safeRobots}" />${canonicalTag}${socialTagsBlock}${jsonLdTag}
    <!-- VIZRA_SEO_HEAD_END -->`;

  const markerPattern =
    /<!--\s*VIZRA_SEO_HEAD_START\s*-->[\s\S]*?<!--\s*VIZRA_SEO_HEAD_END\s*-->/i;
  const fallbackPattern =
    /<title>[\s\S]*<\/script>|<title>[\s\S]*?<meta\s+name="twitter:image:alt"[^>]*>/i;

  let html = rawHtml;
  if (markerPattern.test(html)) {
    html = html.replace(markerPattern, headBlock);
  } else if (fallbackPattern.test(html)) {
    html = html.replace(fallbackPattern, headBlock);
  }

  // Conditionally include Google AdSense script ONLY on eligible public HTML routes (never on /ai, /history, /settings, /workspace, /seo-diagnostics, or 404s)
  const adSenseTag = payload.isIndexable
    ? `<!-- VIZRA_ADSENSE_HEAD_START -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2808034055890408"
     crossorigin="anonymous"></script>
    <!-- VIZRA_ADSENSE_HEAD_END -->`
    : '<!-- VIZRA_ADSENSE_HEAD_START --><!-- VIZRA_ADSENSE_HEAD_END -->';

  const adSenseMarkerPattern =
    /<!--\s*VIZRA_ADSENSE_HEAD_START\s*-->[\s\S]*?<!--\s*VIZRA_ADSENSE_HEAD_END\s*-->/i;
  if (adSenseMarkerPattern.test(html)) {
    html = html.replace(adSenseMarkerPattern, adSenseTag);
  } else if (!payload.isIndexable) {
    html = html.replace(
      /<script[^>]+pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js[^>]*>\s*<\/script>/gi,
      ''
    );
  }

  const prerenderHtml = buildPrehydrationRootHtml(payload);
  const prerenderMarkerPattern =
    /<!--\s*VIZRA_PRERENDER_START\s*-->[\s\S]*?<!--\s*VIZRA_PRERENDER_END\s*-->/i;
  const mainPattern = /<main\b[^>]*>[\s\S]*?<\/main>/i;
  const rootEmptyPattern = /(<div\b[^>]*id=["']root["'][^>]*>)[\s\S]*?(<\/div>)/i;

  if (prerenderMarkerPattern.test(html)) {
    html = html.replace(prerenderMarkerPattern, prerenderHtml);
  } else if (mainPattern.test(html)) {
    html = html.replace(mainPattern, prerenderHtml);
  } else if (rootEmptyPattern.test(html)) {
    html = html.replace(rootEmptyPattern, `$1\n      ${prerenderHtml}\n    $2`);
  }

  return html;
}
