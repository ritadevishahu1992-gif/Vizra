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

export interface RoutePrehydrationContent {
  eyebrow: string;
  h1: string;
  lead: string;
  sections: { heading: string; body: string }[];
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

const PRICING_FAQ_SCHEMA: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How are AI generation credits calculated across Omnia 1.0 modes?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Standard conversational queries (Quick and Think modes) use 1 credit per turn. Deep web research, high-resolution visual synthesis, and Lyria 3 audio generation consume credits proportional to compute complexity, tracked live in your header Credit Usage Indicator.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I switch between Monthly and Yearly billing at any time?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. You can toggle between Monthly and Annual billing directly from the Pricing page or your Workspace Console. Annual billing provides an immediate 20% discount across Omnia Pro and VIZRA Studio tiers.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens to my 10-stage projects if I downgrade to Creator Free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Your existing project history, files, and research notes are never deleted. On Creator Free, up to 3 projects remain actively editable while additional projects stay safely archived in read-only mode until you re-activate Pro or Studio.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you offer custom enterprise deployments or academic studio grants?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Production studios, universities, and research teams can request tailored concurrency quotas and dedicated onboarding through our Contact page.',
      },
    },
  ],
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
    jsonLd: [ORGANIZATION_SCHEMA, WEBSITE_SCHEMA, SOFTWARE_APPLICATION_SCHEMA],
    prehydration: {
      eyebrow: 'VIZRA AI CREATIVE STUDIO · OMNIA 1.0',
      h1: 'Vizra — AI Creative Studio & Omnia 1.0',
      lead: 'A modern AI creative studio built to make AI-powered creation simpler for creators, animators, motion designers, developers, and beginners.',
      sections: [
        {
          heading: 'Core Studio Engines',
          body: 'Motion Engine for physics-based animations and timeline sequencing, Character Engine for multi-angle 3D avatar animation, and Omnia 1.0 for conversational reasoning and 10-stage creative workflows.',
        },
        {
          heading: 'On the Horizon — Future Features',
          body: 'Spatial AI Canvas, Real-Time Motion Diffusion, and Multi-Agent Studio Collaboration.',
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
    jsonLd: [buildBreadcrumbSchema('Features & Architecture', '/features')],
    prehydration: {
      eyebrow: 'PLATFORM ARCHITECTURE',
      h1: 'Engineered to carry your work from initial spark to finished production.',
      lead: 'Explore the 4 Core Pillars of Vizra (Think, Create, Build, Explore), our 5-step Idea-to-Finish pipeline, and 10-stage persistent project memory.',
      sections: [
        {
          heading: 'Four Core Pillars',
          body: 'Think with grounded reasoning, Create across writing and visual disciplines, Build 10-stage engineering and shader workflows, and Explore interactive spatial galleries.',
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
      SOFTWARE_APPLICATION_SCHEMA,
    ],
    prehydration: {
      eyebrow: '8 SPECIALIZED DISCIPLINES',
      h1: 'One intelligence. Every creative discipline.',
      lead: 'Dedicated AI tools for writing, visual systems, motion direction, React and GLSL code synthesis, presentations, and grounded research.',
      sections: [
        {
          heading: 'Unified Creative Tools',
          body: 'Switch seamlessly between scriptwriting, design token synthesis, WebGL shader coding, document analysis, and Lyria 3 music generation.',
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
    jsonLd: [buildBreadcrumbSchema('Creative Studio & Roadmap', '/studio')],
    prehydration: {
      eyebrow: 'CREATIVE STUDIO ENGINES & ROADMAP',
      h1: 'Precision creative engines built for motion, shaders, and spatial direction.',
      lead: 'Four production studio engines paired with our transparent R&D engineering roadmap.',
      sections: [
        {
          heading: 'Studio Engines & Upcoming R&D',
          body: 'Temporal Motion Engine, Neural Direction Engine, Procedural Shader Forge, and Kinetic Typography System.',
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
    jsonLd: [buildBreadcrumbSchema('Explore & Creative Showcase', '/explore')],
    prehydration: {
      eyebrow: 'VIZRA CREATIVE SHOWCASE',
      h1: 'ENTER THE CREATIVE UNIVERSE.',
      lead: 'Explore a universe of ideas, visuals and creative possibilities, brought to life with AI.',
      sections: [
        {
          heading: 'Built for anyone with an idea.',
          body: 'Vizra scales from rapid conversational questions to full 10-stage creative production across directors, designers, developers, students, and writers.',
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
      PRICING_FAQ_SCHEMA,
    ],
    prehydration: {
      eyebrow: 'PRICING & STUDIO ENTITLEMENTS',
      h1: 'Predictable pricing engineered for individual creators and production teams.',
      lead: 'Start free with Omnia 1.0 conversational intelligence and grounded search, then upgrade as your creative pipeline scales into multi-stage production.',
      sections: [
        {
          heading: 'Compute & Entitlement Matrix',
          body: 'Creator Free ($0), Omnia Pro ($19/mo), and VIZRA Studio ($64/mo) tiers with transparent concurrency and workspace entitlements.',
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
      lead: 'Vizra was created to bridge the gap between fleeting AI chat threads and real finished creative work—uniting conversation, context, creativity, and workflow under one platform.',
      sections: [
        {
          heading: 'Core Engineering Principles',
          body: 'Response Proportionality, Zero Fabricated Citations, Persistent Studio Context, and Architectural Honesty.',
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
      lead: 'Whether you are scaling a creative studio, integrating with our developer API, or requesting private beta access for upcoming engines, our team is ready to help.',
      sections: [
        {
          heading: 'Direct Studio & Enterprise Inquiry',
          body: 'Submit studio onboarding, technical support, partnership, or press inquiries directly to the Vizra team.',
        },
      ],
    },
  },
  '/docs': {
    canonicalPath: '/docs',
    title: 'Technical Documentation & API Reference — Vizra AI Creative Studio',
    description:
      'Official technical documentation for Vizra and Omnia 1.0 covering intent classification, model routing, 10-stage project workflows, REST APIs, and SSRF security.',
    isIndexable: true,
    robots: 'index, follow',
    ogType: 'article',
    breadcrumbLabel: 'Technical Documentation',
    jsonLd: [
      buildBreadcrumbSchema('Technical Documentation', '/docs'),
      {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: 'Omnia 1.0 Technical Documentation & Architecture',
        description:
          'Official technical documentation for Vizra and Omnia 1.0 covering intent classification, model routing, 10-stage project workflows, REST APIs, and SSRF security.',
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
      eyebrow: 'TECHNICAL DOCUMENTATION',
      h1: 'Omnia 1.0 Technical Documentation & Architecture.',
      lead: 'System architecture guides, deterministic intent routing, 10-stage project workflows, REST streaming APIs, and SSRF security controls.',
      sections: [
        {
          heading: 'Platform Overview & Neural Routing',
          body: 'Intent classification, cross-request context isolation, grounded web retrieval, and server-side API governance.',
        },
      ],
    },
  },
  '/terms-and-conditions': {
    canonicalPath: '/terms-and-conditions',
    title: 'Terms & Conditions — Vizra AI Creative Studio',
    description:
      'Terms and Conditions governing use of Vizra AI Creative Studio and Omnia 1.0, user responsibilities, acceptable use, intellectual property, and liability limits.',
    isIndexable: true,
    robots: 'index, follow',
    ogType: 'website',
    breadcrumbLabel: 'Terms & Conditions',
    jsonLd: [buildBreadcrumbSchema('Terms & Conditions', '/terms-and-conditions')],
    prehydration: {
      eyebrow: 'PLATFORM AGREEMENT & RULES OF USE',
      h1: 'Terms & Conditions',
      lead: 'Official Terms and Conditions governing access to and use of Vizra AI Creative Studio and Omnia 1.0.',
      sections: [
        {
          heading: 'Service Description & Acceptable Use',
          body: 'Covers account responsibilities, intellectual property rights, AI-generated output disclosures, and limitation of liability.',
        },
      ],
    },
  },
  '/privacy-policy': {
    canonicalPath: '/privacy-policy',
    title: 'Privacy Policy & Data Protection — Vizra AI Studio',
    description:
      'Privacy Policy detailing information collection, processing, retention, third-party processors, security controls, and user privacy rights in Vizra.',
    isIndexable: true,
    robots: 'index, follow',
    ogType: 'website',
    breadcrumbLabel: 'Privacy Policy',
    jsonLd: [buildBreadcrumbSchema('Privacy Policy', '/privacy-policy')],
    prehydration: {
      eyebrow: 'DATA PROTECTION & PRIVACY NOTICE',
      h1: 'Privacy Policy',
      lead: 'How Vizra AI Creative Studio collects, processes, secures, and protects your data and privacy rights.',
      sections: [
        {
          heading: 'Data Governance & User Rights',
          body: 'Details workspace data isolation, third-party processors, retention schedules, and GDPR/CCPA rights.',
        },
      ],
    },
  },
  '/cookie-policy': {
    canonicalPath: '/cookie-policy',
    title: 'Cookie & Storage Policy — Vizra AI Creative Studio',
    description:
      'Cookie and browser storage policy explaining strictly necessary, analytics, functional, and marketing technologies used in Vizra and consent controls.',
    isIndexable: true,
    robots: 'index, follow',
    ogType: 'website',
    breadcrumbLabel: 'Cookie Policy',
    jsonLd: [buildBreadcrumbSchema('Cookie Policy', '/cookie-policy')],
    prehydration: {
      eyebrow: 'CONSENT & BROWSER STORAGE GOVERNANCE',
      h1: 'Cookie & Storage Policy',
      lead: 'Transparent disclosure of browser storage and cookies used across Vizra AI Creative Studio, with real-time consent withdrawal controls.',
      sections: [
        {
          heading: 'Storage Categories & Consent Controls',
          body: 'Strictly Necessary, Analytics, Functional, and Marketing storage governance.',
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
      eyebrow: 'OMNIA 1.0 LIVE WORKSPACE',
      h1: 'Omnia 1.0 AI Creative Workspace',
      lead: 'Interactive workspace for multimodal reasoning, grounded research, code generation, and 10-stage creative projects.',
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
      eyebrow: 'SESSION ARCHIVE',
      h1: 'Saved Conversations',
      lead: 'Manage your saved Omnia 1.0 conversation threads.',
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
      eyebrow: 'STUDIO PREFERENCES',
      h1: 'Application Settings',
      lead: 'Configure theme, response style, language preferences, and privacy controls.',
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
      eyebrow: 'WORKSPACE & DEVELOPER CONSOLE',
      h1: 'Workspace & Developer Console',
      lead: 'Manage 10-stage creative projects, multimodal assets, and usage telemetry.',
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
      eyebrow: 'ADMINISTRATOR DIAGNOSTICS',
      h1: 'Search Indexing & Crawlability Verification',
      lead: 'Restricted administrator console for technical SEO and crawler diagnostics.',
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
    lead: 'The requested URL could not be resolved. Return to the Vizra homepage or launch Omnia 1.0.',
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
      // Remove any accidental duplicates
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

  // Open Graph tags (automatically removed if payload is a private/utility or 404 route)
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

  // Twitter / X Card tags (automatically removed if payload is a private/utility or 404 route)
  upsertMeta('name', 'twitter:card', payload.twitterCard);
  upsertMeta('name', 'twitter:title', payload.twitterTitle);
  upsertMeta('name', 'twitter:description', payload.twitterDescription);
  upsertMeta('name', 'twitter:image', payload.twitterImage);
  upsertMeta('name', 'twitter:image:alt', payload.twitterImageAlt);

  // Canonical link tag (removed on 404 routes)
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

  // JSON-LD Structured Data script
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
 * Injects route-specific metadata, JSON-LD, and accessible pre-hydration HTML into index.html
 * for initial server responses before React hydration.
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

  // Replace pre-hydration <main> inside #root with route-accurate accessible content (without aria-hidden="true")
  const sectionsHtml = payload.prehydration.sections
    .map(
      (sec) =>
        `\n        <h2>${escapeHtmlText(sec.heading)}</h2>\n        <p>${escapeHtmlText(sec.body)}</p>`
    )
    .join('');

  const mainFallbackHtml = `<main class="sr-only">
        <h1>${escapeHtmlText(payload.prehydration.h1)}</h1>
        <p>${escapeHtmlText(payload.prehydration.lead)}</p>${sectionsHtml}
      </main>`;

  const mainPattern = /<main\b[^>]*>[\s\S]*?<\/main>/i;
  if (mainPattern.test(html)) {
    html = html.replace(mainPattern, mainFallbackHtml);
  }

  return html;
}
