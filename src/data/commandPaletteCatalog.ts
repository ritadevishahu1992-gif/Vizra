import { ALL_DOC_ARTICLES } from './publicDocs';

export type GlobalCommandCategory =
  | 'Workspace'
  | 'Studio Tools'
  | 'Documentation'
  | 'Pages';

export type GlobalCommandIconKey =
  | 'sparkles'
  | 'dashboard'
  | 'layers'
  | 'folder'
  | 'chart'
  | 'terminal'
  | 'key'
  | 'history'
  | 'settings'
  | 'atom'
  | 'music'
  | 'radio'
  | 'database'
  | 'wrench'
  | 'globe'
  | 'brain'
  | 'code'
  | 'book'
  | 'home'
  | 'compass'
  | 'creditCard'
  | 'newspaper'
  | 'info'
  | 'mail'
  | 'shield';

export interface GlobalCommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: GlobalCommandCategory;
  path: string;
  iconKey: GlobalCommandIconKey;
  badge?: string;
  keywords: string[];
}

export const WORKSPACE_COMMANDS: GlobalCommandItem[] = [
  {
    id: 'ws-omnia-ai',
    title: 'Omnia AI Workspace',
    subtitle: 'Launch the conversational creative intelligence chat studio',
    category: 'Workspace',
    path: '/ai',
    iconKey: 'sparkles',
    badge: 'Core',
    keywords: ['omnia', 'chat', 'ai', 'prompt', 'assistant', 'workspace', 'create'],
  },
  {
    id: 'ws-dashboard',
    title: 'Workspace Dashboard',
    subtitle: 'Overview of creative projects, ingested assets, credits, and telemetry',
    category: 'Workspace',
    path: '/workspace',
    iconKey: 'dashboard',
    keywords: ['dashboard', 'overview', 'workspace', 'metrics', 'studio', 'home'],
  },
  {
    id: 'ws-projects',
    title: '10-Stage Projects',
    subtitle: 'Manage structured creative production pipelines and export specs',
    category: 'Workspace',
    path: '/workspace?tab=projects',
    iconKey: 'layers',
    keywords: ['projects', 'workflow', 'pipeline', 'stages', 'production'],
  },
  {
    id: 'ws-assets',
    title: 'Workspace Assets',
    subtitle: 'Upload and organize images, PDFs, datasets, and generated frames',
    category: 'Workspace',
    path: '/workspace?tab=assets',
    iconKey: 'folder',
    keywords: ['assets', 'files', 'uploads', 'media', 'library', 'images'],
  },
  {
    id: 'ws-analytics',
    title: 'Usage & Credit Analytics',
    subtitle: 'Inspect historical credit consumption and studio activity charts',
    category: 'Workspace',
    path: '/workspace?tab=analytics',
    iconKey: 'chart',
    keywords: ['analytics', 'credits', 'usage', 'charts', 'telemetry', 'quota'],
  },
  {
    id: 'ws-system-logs',
    title: 'System Logs & API Latency',
    subtitle: 'Open recent backend API call history, status codes, and latency trends',
    category: 'Workspace',
    path: '/workspace?logs=1',
    iconKey: 'terminal',
    badge: 'Live',
    keywords: ['logs', 'system logs', 'api', 'latency', 'requests', 'debug', 'status'],
  },
  {
    id: 'ws-developer',
    title: 'Developer API Tokens',
    subtitle: 'Create and revoke scoped client workspace integration tokens',
    category: 'Workspace',
    path: '/workspace?tab=developer',
    iconKey: 'key',
    keywords: ['developer', 'tokens', 'api keys', 'sdk', 'webhooks', 'integration'],
  },
  {
    id: 'ws-history',
    title: 'Conversation History',
    subtitle: 'Browse, search, resume, or export past Omnia AI sessions',
    category: 'Workspace',
    path: '/history',
    iconKey: 'history',
    keywords: ['history', 'conversations', 'threads', 'past chats', 'archive', 'export'],
  },
  {
    id: 'ws-settings',
    title: 'Account & Studio Settings',
    subtitle: 'Manage preferences, theme, memory retention, and account privacy',
    category: 'Workspace',
    path: '/settings',
    iconKey: 'settings',
    keywords: ['settings', 'preferences', 'account', 'profile', 'privacy', 'delete data'],
  },
];

export const STUDIO_TOOL_COMMANDS: GlobalCommandItem[] = [
  {
    id: 'tool-science-suite',
    title: 'Omnia Science Suite',
    subtitle: 'Explore AlphaFold 3D proteins, PubChem molecules, and PubMed literature',
    category: 'Studio Tools',
    path: '/ai?hub=science',
    iconKey: 'atom',
    badge: 'Hub',
    keywords: ['science', 'alphafold', 'proteins', 'pubchem', 'chemistry', 'pubmed', 'biology'],
  },
  {
    id: 'tool-music-studio',
    title: 'AI Music & Audio Studio',
    subtitle: 'Compose original instrumental soundtracks and loops with Lyria 3',
    category: 'Studio Tools',
    path: '/ai?hub=music',
    iconKey: 'music',
    badge: 'Lyria 3',
    keywords: ['music', 'audio', 'lyria', 'soundtrack', 'song', 'compose', 'loop'],
  },
  {
    id: 'tool-live-voice',
    title: 'Live Voice Studio',
    subtitle: 'Start a real-time hands-free spoken conversation with Omnia',
    category: 'Studio Tools',
    path: '/ai?hub=voice',
    iconKey: 'radio',
    badge: 'Live',
    keywords: ['voice', 'speech', 'live', 'microphone', 'audio', 'talk', 'speak'],
  },
  {
    id: 'tool-create-hub',
    title: 'Omnia Create Hub',
    subtitle: 'Launch 8 creative disciplines across storytelling, brand, video, and code',
    category: 'Studio Tools',
    path: '/ai?hub=create',
    iconKey: 'sparkles',
    badge: 'Hub',
    keywords: ['create hub', 'templates', 'storytelling', 'brand', 'video', 'creative'],
  },
  {
    id: 'tool-knowledge-base',
    title: 'RAG Knowledge Base Explorer',
    subtitle: 'Inspect verified documents, grounded citations, and ingested sources',
    category: 'Studio Tools',
    path: '/ai?hub=knowledge',
    iconKey: 'database',
    badge: 'RAG',
    keywords: ['knowledge', 'rag', 'sources', 'citations', 'documents', 'grounding'],
  },
  {
    id: 'tool-creation-workflows',
    title: 'Creative Tools & Workflows',
    subtitle: 'Specialized prompt presets and 10-stage project generation templates',
    category: 'Studio Tools',
    path: '/ai?hub=tools',
    iconKey: 'wrench',
    keywords: ['workflows', 'presets', 'tools', 'templates', 'project generator'],
  },
  {
    id: 'tool-research-mode',
    title: 'Research Mode (Web Grounding)',
    subtitle: 'Switch Omnia into real-time Google Search retrieval with source citations',
    category: 'Studio Tools',
    path: '/ai?mode=research',
    iconKey: 'globe',
    badge: 'Mode',
    keywords: ['research', 'search', 'web', 'grounding', 'citations', 'verify'],
  },
  {
    id: 'tool-think-mode',
    title: 'Think Mode (Deep Reasoning)',
    subtitle: 'Switch Omnia into multi-step analytical reasoning and logic mode',
    category: 'Studio Tools',
    path: '/ai?mode=think',
    iconKey: 'brain',
    badge: 'Mode',
    keywords: ['think', 'reasoning', 'logic', 'deep', 'analysis', 'math'],
  },
  {
    id: 'tool-code-mode',
    title: 'Code Mode (Engineering)',
    subtitle: 'Switch Omnia into full-stack coding, architecture, and debugging mode',
    category: 'Studio Tools',
    path: '/ai?mode=code',
    iconKey: 'code',
    badge: 'Mode',
    keywords: ['code', 'programming', 'typescript', 'python', 'debugging', 'engineering'],
  },
  {
    id: 'tool-analyze-mode',
    title: 'Analyze Mode (Data & Tables)',
    subtitle: 'Switch Omnia into dataset analysis, CSV audits, and structured comparisons',
    category: 'Studio Tools',
    path: '/ai?mode=analyze',
    iconKey: 'chart',
    badge: 'Mode',
    keywords: ['analyze', 'data', 'csv', 'tables', 'metrics', 'comparison'],
  },
  {
    id: 'tool-directory',
    title: 'AI Tools Directory',
    subtitle: 'Browse all available Vizra AI tools, capabilities, and integrations',
    category: 'Studio Tools',
    path: '/tools',
    iconKey: 'wrench',
    keywords: ['tools', 'directory', 'catalog', 'integrations', 'capabilities'],
  },
  {
    id: 'tool-studio-roadmap',
    title: 'Studio & Roadmap',
    subtitle: 'Explore the Vizra creative studio architecture and product roadmap',
    category: 'Studio Tools',
    path: '/studio',
    iconKey: 'layers',
    keywords: ['studio', 'roadmap', 'releases', 'upcoming', 'architecture'],
  },
];

export const PAGE_COMMANDS: GlobalCommandItem[] = [
  {
    id: 'page-home',
    title: 'Home',
    subtitle: 'Return to the VIZRA homepage',
    category: 'Pages',
    path: '/',
    iconKey: 'home',
    keywords: ['home', 'landing', 'start', 'vizra', 'main'],
  },
  {
    id: 'page-features',
    title: 'Platform Features',
    subtitle: 'Explore Omnia 1.0 capabilities, multimodal intelligence, and workflows',
    category: 'Pages',
    path: '/features',
    iconKey: 'sparkles',
    keywords: ['features', 'platform', 'capabilities', 'omnia'],
  },
  {
    id: 'page-explore',
    title: 'Explore Showcase',
    subtitle: 'Discover featured examples, prompts, and studio creations',
    category: 'Pages',
    path: '/explore',
    iconKey: 'compass',
    keywords: ['explore', 'showcase', 'examples', 'gallery', 'inspiration'],
  },
  {
    id: 'page-pricing',
    title: 'Pricing & Plans',
    subtitle: 'Compare Creator Free, Omnia Pro, and VIZRA Studio tiers',
    category: 'Pages',
    path: '/pricing',
    iconKey: 'creditCard',
    keywords: ['pricing', 'plans', 'billing', 'upgrade', 'pro', 'free', 'subscription'],
  },
  {
    id: 'page-blog',
    title: 'Blog & Articles',
    subtitle: 'Read product announcements, engineering deep dives, and AI guides',
    category: 'Pages',
    path: '/blog',
    iconKey: 'newspaper',
    keywords: ['blog', 'articles', 'news', 'guides', 'updates', 'posts'],
  },
  {
    id: 'page-about',
    title: 'About VIZRA',
    subtitle: 'Learn about our mission, studio philosophy, and design principles',
    category: 'Pages',
    path: '/about',
    iconKey: 'info',
    keywords: ['about', 'company', 'mission', 'team', 'story'],
  },
  {
    id: 'page-contact',
    title: 'Contact & Support',
    subtitle: 'Get in touch with the VIZRA team for support or enterprise inquiries',
    category: 'Pages',
    path: '/contact',
    iconKey: 'mail',
    keywords: ['contact', 'support', 'help', 'email', 'sales'],
  },
  {
    id: 'page-privacy',
    title: 'Privacy Policy',
    subtitle: 'Review data protection, storage practices, and user privacy rights',
    category: 'Pages',
    path: '/privacy-policy',
    iconKey: 'shield',
    keywords: ['privacy', 'policy', 'gdpr', 'data', 'legal'],
  },
  {
    id: 'page-prompt-optimizer',
    title: 'Free AI Prompt Optimizer',
    subtitle: 'Structure motion, visual, shader, research & audio prompts with zero sign-up',
    category: 'Pages',
    path: '/free-ai-prompt-optimizer',
    iconKey: 'sparkles',
    badge: 'Free Tool',
    keywords: ['prompt', 'optimizer', 'free', 'tool', 'motion', 'shader', 'audio'],
  },
  {
    id: 'page-ai-creative-studio',
    title: 'AI Creative Studio',
    subtitle: 'Overview of VIZRA browser studio, Omnia 1.0, shaders, audio & 10-stage workflows',
    category: 'Pages',
    path: '/ai-creative-studio',
    iconKey: 'layers',
    keywords: ['ai creative studio', 'studio', 'omnia', 'creative'],
  },
  {
    id: 'page-ai-workspace-creators',
    title: 'AI Workspace for Creators',
    subtitle: 'Persistent 10-stage pipelines, 5-file audits, and 25 MB local RAG explorer',
    category: 'Pages',
    path: '/ai-workspace-for-creators',
    iconKey: 'dashboard',
    keywords: ['workspace', 'creators', 'projects', 'rag', 'files'],
  },
  {
    id: 'page-motion-designers',
    title: 'AI Tools for Motion Designers',
    subtitle: 'WebGL/GLSL shader prototyping, kinetic concepts, storyboards & WAV audio',
    category: 'Pages',
    path: '/ai-tools-for-motion-designers',
    iconKey: 'code',
    keywords: ['motion', 'designers', 'glsl', 'shaders', 'webgl', 'storyboard'],
  },
  {
    id: 'page-ai-assistant-creative',
    title: 'AI Assistant for Creative Work',
    subtitle: 'Omnia 1.0 Quick, Think, Research, Code & Analyze modes with verified citations',
    category: 'Pages',
    path: '/ai-assistant-for-creative-work',
    iconKey: 'brain',
    keywords: ['assistant', 'omnia', 'citations', 'multilingual', 'creative'],
  },
  {
    id: 'page-alternatives',
    title: 'Compare VIZRA Alternatives (2026)',
    subtitle: 'Honest comparisons vs Canva, Runway, Krea AI, and Adobe Express',
    category: 'Pages',
    path: '/alternatives',
    iconKey: 'compass',
    keywords: ['alternatives', 'compare', 'canva', 'runway', 'krea', 'adobe express'],
  },
  {
    id: 'page-terms',
    title: 'Terms & Conditions',
    subtitle: 'Read the VIZRA platform terms of service and usage policies',
    category: 'Pages',
    path: '/terms-and-conditions',
    iconKey: 'shield',
    keywords: ['terms', 'conditions', 'legal', 'tos', 'service'],
  },
];

export const DOCUMENTATION_COMMANDS: GlobalCommandItem[] = [
  {
    id: 'doc-home',
    title: 'Documentation Centre (A–Z)',
    subtitle: 'Browse all public guides, feature status matrices, security docs, and FAQs',
    category: 'Documentation',
    path: '/docs',
    iconKey: 'book',
    badge: 'Index',
    keywords: ['docs', 'documentation', 'guides', 'help', 'manual', 'reference', 'faq'],
  },
  ...ALL_DOC_ARTICLES.map((article) => ({
    id: `doc-${article.slug}`,
    title: article.title,
    subtitle: article.summary,
    category: 'Documentation' as const,
    path: `/docs?doc=${article.slug}`,
    iconKey: 'book' as const,
    badge: `${article.sectionId} · ${article.code}`,
    keywords: [
      article.slug.replace(/-/g, ' '),
      article.code,
      article.sectionTitle,
      article.status || '',
      ...article.blocks.slice(0, 4).map((b) => b.heading),
    ].filter(Boolean),
  })),
];

export const ALL_GLOBAL_COMMANDS: GlobalCommandItem[] = [
  ...WORKSPACE_COMMANDS,
  ...STUDIO_TOOL_COMMANDS,
  ...DOCUMENTATION_COMMANDS,
  ...PAGE_COMMANDS,
];

/**
 * Scores how well a command matches a search query (0 = no match, higher = better).
 */
export function scoreGlobalCommandMatch(item: GlobalCommandItem, rawQuery: string): number {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return 1;

  const tokens = query.split(/\s+/).filter(Boolean);
  const titleLower = item.title.toLowerCase();
  const subtitleLower = item.subtitle.toLowerCase();
  const pathLower = item.path.toLowerCase();
  const categoryLower = item.category.toLowerCase();
  const badgeLower = (item.badge || '').toLowerCase();
  const keywordsLower = item.keywords.map((k) => k.toLowerCase());

  let totalScore = 0;

  for (const token of tokens) {
    let tokenScore = 0;
    if (titleLower === token) {
      tokenScore = 100;
    } else if (titleLower.startsWith(token)) {
      tokenScore = 70;
    } else if (titleLower.includes(token)) {
      tokenScore = 45;
    } else if (keywordsLower.some((k) => k === token || k.startsWith(token))) {
      tokenScore = 36;
    } else if (keywordsLower.some((k) => k.includes(token))) {
      tokenScore = 24;
    } else if (pathLower.includes(token) || badgeLower.includes(token)) {
      tokenScore = 22;
    } else if (categoryLower.includes(token)) {
      tokenScore = 18;
    } else if (subtitleLower.includes(token)) {
      tokenScore = 14;
    }

    if (tokenScore === 0) return 0;
    totalScore += tokenScore;
  }

  // Slight priority bonus for Workspace & Studio Tools over deep doc matches on tied scores
  if (item.category === 'Workspace') totalScore += 6;
  else if (item.category === 'Studio Tools') totalScore += 5;
  else if (item.category === 'Pages') totalScore += 2;

  return totalScore;
}
