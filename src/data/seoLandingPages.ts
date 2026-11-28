export interface SeoLandingProblemSolution {
  problem: string;
  solution: string;
  vizraFeature: string;
}

export interface SeoLandingFeatureBlock {
  title: string;
  category: string;
  description: string;
  status: 'Live Today' | 'In Staging';
  linkTo: string;
  linkLabel: string;
}

export interface SeoLandingFaqItem {
  question: string;
  answer: string;
}

export interface SeoLandingSpecRow {
  capability: string;
  detail: string;
  availability: string;
}

export interface SeoLandingPageConfig {
  slug: string;
  canonicalPath: string;
  category: 'Product' | 'Use Case' | 'Feature';
  eyebrow: string;
  h1: string;
  lead: string;
  secondaryLead: string;
  heroVisualTitle: string;
  heroVisualCaption: string;
  heroVisualItems: Array<{ label: string; value: string }>;
  primaryCtaLabel: string;
  primaryCtaPath: string;
  secondaryCtaLabel: string;
  secondaryCtaPath: string;
  problemsSectionTitle: string;
  problems: SeoLandingProblemSolution[];
  featuresSectionTitle: string;
  featuresSectionIntro: string;
  features: SeoLandingFeatureBlock[];
  specsSectionTitle: string;
  specs: SeoLandingSpecRow[];
  transparencyNote: string;
  faqs: SeoLandingFaqItem[];
  relatedLinks: Array<{ label: string; to: string; description: string }>;
}

export const SEO_LANDING_PAGES: Record<string, SeoLandingPageConfig> = {
  '/ai-creative-studio': {
    slug: 'ai-creative-studio',
    canonicalPath: '/ai-creative-studio',
    category: 'Product',
    eyebrow: 'AI Creative Studio',
    h1: 'An AI Creative Studio Built for Real Production Workflows',
    lead: 'VIZRA brings conversational AI reasoning, visual concept synthesis, React and GLSL shader coding, instrumental audio generation, and 10-stage project workflows into one browser workspace.',
    secondaryLead:
      'Instead of bouncing between separate chat windows, code sandboxes, research tabs, and asset generators, creative professionals run concept development, technical prototyping, and asset direction inside Omnia 1.0.',
    heroVisualTitle: 'Inside the VIZRA Studio Environment',
    heroVisualCaption:
      'Live capabilities available in the browser today without local GPU installation.',
    heroVisualItems: [
      { label: 'Core Engine', value: 'Omnia 1.0 (Quick, Think, Research, Code, Analyze)' },
      { label: 'Multimodal Audit', value: 'Up to 5 files/turn (PDF, CSV, images, code, TXT)' },
      { label: 'Audio Studio', value: 'Lyria 3 & procedural WAV soundtracks (5–120s)' },
      { label: 'Project Memory', value: '10-stage persistent pipelines in /workspace' },
    ],
    primaryCtaLabel: 'Launch Omnia 1.0 Studio',
    primaryCtaPath: '/ai',
    secondaryCtaLabel: 'Try Free AI Prompt Optimizer',
    secondaryCtaPath: '/free-ai-prompt-optimizer',
    problemsSectionTitle: 'Why Fragmented AI Tools Slow Down Creative Studios',
    problems: [
      {
        problem: 'Context disappears every time you switch from ideation chat to code, design direction, or audio.',
        solution:
          'VIZRA keeps prompts, uploaded briefs, technical drafts, and 10-stage project milestones inside one workspace with cloud sync via Firebase when signed in.',
        vizraFeature: '10-Stage Studio Workspace (/workspace)',
      },
      {
        problem: 'Generic chat assistants hallucinate URLs, invent references, or dump bloated paragraphs when you asked for a quick technical answer.',
        solution:
          'Omnia 1.0 pairs live Google Search grounding (returning verified HTTPS citations) with adaptive response proportionality across Quick, Think, Research, Code, and Analyze modes.',
        vizraFeature: 'Grounded Research & Adaptive Modes (/ai)',
      },
      {
        problem: 'Prototyping interactive visuals, GLSL shaders, and moodboard concepts usually requires juggling four subscriptions.',
        solution:
          'Generate React, TypeScript, and WebGL/GLSL shader code alongside procedural PNG concept canvases and instrumental WAV audio tracks in a single browser tab.',
        vizraFeature: 'Visual, Code & Lyria 3 Audio Engines (/studio)',
      },
    ],
    featuresSectionTitle: 'What Is Live Inside VIZRA Today',
    featuresSectionIntro:
      'Every capability below is verified in the active VIZRA web application. Experimental and staged modules are labeled transparently.',
    features: [
      {
        title: 'Omnia 1.0 Multimodal Workspace',
        category: 'Core Assistant',
        description:
          'Switch between Quick, Think, Research, Code, and Analyze modes in English, Hindi, or Hinglish. Attach up to 5 PDFs, CSVs, images, or source files per turn for direct critique and extraction.',
        status: 'Live Today',
        linkTo: '/ai',
        linkLabel: 'Open Omnia 1.0',
      },
      {
        title: 'Procedural Visual & Code Synthesis',
        category: 'Creative Coding',
        description:
          'Generate procedural PNG concept canvases with embedded provenance metadata, plus production-structured React, TypeScript, Tailwind, and WebGL/GLSL shader prototypes.',
        status: 'Live Today',
        linkTo: '/studio',
        linkLabel: 'Explore Studio Engines',
      },
      {
        title: 'AI Music Studio (Lyria 3 & WAV)',
        category: 'Audio Direction',
        description:
          'Compose instrumental soundtracks, ambient beds, and sonic logos from 5 to 120 seconds with downloadable WAV output for reels, prototypes, and mood films.',
        status: 'Live Today',
        linkTo: '/tools',
        linkLabel: 'Inspect Tools Suite',
      },
      {
        title: 'DeepMind Science Hub & Local RAG',
        category: 'Research & Verification',
        description:
          'Query live AlphaFold DB, PubChem, and PubMed records for scientific visualization projects, or index up to 25 MB of local reference documents in the browser RAG explorer.',
        status: 'Live Today',
        linkTo: '/features',
        linkLabel: 'View All Capabilities',
      },
    ],
    specsSectionTitle: 'Verified VIZRA Studio Capabilities at a Glance',
    specs: [
      {
        capability: 'Conversational Modes',
        detail: 'Quick, Think, Research (live Google Search citations), Code, Analyze',
        availability: 'Live Today (Free Tier Included)',
      },
      {
        capability: 'File Upload & Audit',
        detail: 'PDF, CSV, TXT, PNG/JPG/WebP, source code (10 MB/file Free; 15 MB Pro/Studio)',
        availability: 'Live Today',
      },
      {
        capability: 'Audio Generation',
        detail: 'Lyria 3 & procedural instrumental WAV synthesis (5–120s)',
        availability: 'Live Today',
      },
      {
        capability: 'Project Pipelines',
        detail: '10-stage persistent project tracking & Firebase Firestore cloud sync',
        availability: 'Live Today',
      },
      {
        capability: 'Temporal Video & 3P OAuth Connectors',
        detail: 'Temporal Video Engine and external Drive/Figma/Canva OAuth connectors',
        availability: 'In Staging (Roadmap)',
      },
    ],
    transparencyNote:
      'Transparency note: VIZRA is operated under a strict 18+ policy. Core Omnia 1.0 chat, grounded search, code/shader generation, visual canvas synthesis, audio studio, and 10-stage workspace are live today on the Free tier. Temporal Video generation, R&D lab engines, and external third-party OAuth connectors are currently in staging, and paid tier buttons log early-access preview requests without charging payment cards.',
    faqs: [
      {
        question: 'What makes VIZRA different from a standard AI chatbot?',
        answer:
          'Standard chatbots reset context with every thread and focus only on text. VIZRA combines Omnia 1.0 adaptive reasoning modes, live grounded HTTPS citations, 5-file multimodal auditing, React/GLSL code generation, procedural PNG visual concepts, instrumental WAV audio synthesis, and a 10-stage project workspace in one creative studio.',
      },
      {
        question: 'Can I use VIZRA AI Creative Studio for free?',
        answer:
          'Yes. The Creator Free tier ($0/month) includes Omnia 1.0 across Quick, Think, Research, Code, and Analyze modes, file uploads up to 10 MB per file, visual and audio tools, and workspace project tracking. You can also use the standalone AI Prompt Optimizer without creating an account.',
      },
      {
        question: 'Does VIZRA require installing desktop software or a local GPU?',
        answer:
          'No. VIZRA runs directly in modern desktop and mobile web browsers. Signing in with Google SSO or email syncs your conversations and 10-stage projects via Firebase.',
      },
      {
        question: 'Is AI video generation live in VIZRA right now?',
        answer:
          'Not yet. VIZRA’s Temporal Video & Scene Synthesis engine is currently in staging. Today, motion and video teams use VIZRA for storyboarding, script pacing, WebGL/GLSL shader prototyping, visual moodboards, and instrumental audio tracks.',
      },
    ],
    relatedLinks: [
      {
        label: 'Free AI Prompt Optimizer',
        to: '/free-ai-prompt-optimizer',
        description: 'Structure and refine creative prompts with zero sign-up required.',
      },
      {
        label: 'AI Workspace for Creators',
        to: '/ai-workspace-for-creators',
        description: 'See how 10-stage pipelines keep creative projects organized.',
      },
      {
        label: 'Compare VIZRA Alternatives',
        to: '/alternatives',
        description: 'Honest side-by-side comparisons against Canva, Runway, Adobe Express, and Krea AI.',
      },
    ],
  },

  '/ai-workspace-for-creators': {
    slug: 'ai-workspace-for-creators',
    canonicalPath: '/ai-workspace-for-creators',
    category: 'Use Case',
    eyebrow: 'AI Workspace for Creators',
    h1: 'A Unified AI Workspace for Creators Who Ship Multi-Stage Projects',
    lead: 'Replace dozens of disconnected browser tabs with a single creative workspace combining persistent 10-stage project pipelines, multimodal brief analysis, grounded research, and studio asset generation.',
    secondaryLead:
      'Built for independent creators, art directors, technical artists, and small creative teams who need continuity from initial brief to final deliverable.',
    heroVisualTitle: 'Structured Creative Continuity',
    heroVisualCaption:
      'From messy reference documents to repeatable creative production stages.',
    heroVisualItems: [
      { label: 'Workflow Tracking', value: '10-stage project console in /workspace' },
      { label: 'Brief & Asset Audit', value: 'Upload PDFs, CSVs, scripts, and reference images' },
      { label: 'Local Knowledge', value: 'Browser RAG Explorer supporting up to 25 MB' },
      { label: 'Cloud Continuity', value: 'Firebase Auth + per-user Firestore isolation' },
    ],
    primaryCtaLabel: 'Open Workspace Console',
    primaryCtaPath: '/workspace',
    secondaryCtaLabel: 'Start in Omnia 1.0',
    secondaryCtaPath: '/ai',
    problemsSectionTitle: 'Solving Tab Sprawl and Lost Context for Creators',
    problems: [
      {
        problem: 'Creative briefs, client PDFs, moodboards, and AI outputs get scattered across chat histories you can never find again.',
        solution:
          'Organize deliverables inside VIZRA’s 10-stage project console alongside searchable conversation history (/history) and account-isolated cloud persistence.',
        vizraFeature: 'Workspace & History Persistence (/workspace, /history)',
      },
      {
        problem: 'Creators waste hours manually checking whether an AI assistant fabricated a statistic, product detail, or source link.',
        solution:
          'Omnia 1.0 Research mode runs live Google Search grounding and attaches verified HTTPS citation links so you can inspect every claim before publishing.',
        vizraFeature: 'Verified HTTPS Search Grounding',
      },
      {
        problem: 'Cross-disciplinary projects need copy, visuals, interactive code, and background music — not just text.',
        solution:
          'Move from brief critique to procedural visual frames, React/GLSL prototypes, and instrumental WAV soundtracks without leaving your VIZRA session.',
        vizraFeature: 'Unified Multimodal Studio (/ai & /tools)',
      },
    ],
    featuresSectionTitle: 'Workspace Features Designed Around Creator Workflows',
    featuresSectionIntro:
      'Every tool in the VIZRA workspace focuses on reducing handoff friction while keeping your private projects strictly isolated to your account.',
    features: [
      {
        title: '10-Stage Project Lifecycle',
        category: 'Project Organization',
        description:
          'Track creative concepts from intake and research through visual direction, prototyping, review, and export inside /workspace with persistent state.',
        status: 'Live Today',
        linkTo: '/workspace',
        linkLabel: 'View Workspace',
      },
      {
        title: '5-File Multimodal Brief Inspection',
        category: 'Document & Image Analysis',
        description:
          'Attach up to 5 PDFs, CSV sheets, images, or code files in a single Omnia 1.0 turn to extract requirements, critique layouts, or summarize technical specs.',
        status: 'Live Today',
        linkTo: '/ai',
        linkLabel: 'Analyze Files in Omnia',
      },
      {
        title: 'Client-Side RAG Knowledge Explorer',
        category: 'Reference Memory',
        description:
          'Load up to 25 MB of style guides, brand notes, or research excerpts into the local RAG explorer to retrieve exact passages during creative drafting.',
        status: 'Live Today',
        linkTo: '/tools',
        linkLabel: 'Explore Studio Tools',
      },
      {
        title: 'Strict Account-Isolated Privacy',
        category: 'Data Governance',
        description:
          'Signed-in user conversations and projects are isolated by Firebase UID rules, and private workspace routes are excluded from search engine indexing.',
        status: 'Live Today',
        linkTo: '/privacy-policy',
        linkLabel: 'Read Privacy Governance',
      },
    ],
    specsSectionTitle: 'Creator Workspace Technical Specifications',
    specs: [
      {
        capability: 'Authentication & Sync',
        detail: 'Google SSO and Email/Password via Firebase Auth with per-user Firestore rules',
        availability: 'Live Today',
      },
      {
        capability: 'Attachment Support',
        detail: 'Up to 5 files/turn (PDF, CSV, TXT, PNG, JPG, WebP, code); video uploads not supported',
        availability: 'Live Today',
      },
      {
        capability: 'Multilingual Workflows',
        detail: 'Native English, Hindi, and Hinglish prompting and responses in Omnia 1.0',
        availability: 'Live Today',
      },
      {
        capability: 'External Cloud Connectors',
        detail: 'Google Drive, Notion, Figma, Canva, and GitHub OAuth connectors',
        availability: 'In Staging (Not Yet Live)',
      },
    ],
    transparencyNote:
      'Honest scope notice: VIZRA’s built-in workspace, project stages, local RAG explorer, and Firebase sync are live today. Third-party cloud drive connectors (Google Drive, Notion, Figma, Canva, Dropbox) remain in staging and are not yet active in production.',
    faqs: [
      {
        question: 'Are my private workspace projects indexed by search engines?',
        answer:
          'No. All authenticated and application routes (/ai, /workspace, /history, /settings) emit X-Robots-Tag: noindex, nofollow headers, are disallowed in robots.txt, and are excluded from XML sitemaps.',
      },
      {
        question: 'Can I use VIZRA without creating an account first?',
        answer:
          'You can explore public pages, studio demos, documentation, and the Free AI Prompt Optimizer without signing in. Creating a free account unlocks persistent Firebase cloud sync across sessions and devices.',
      },
      {
        question: 'What file types can creators upload for analysis?',
        answer:
          'Omnia 1.0 accepts PDFs, CSVs, plain text, code files, and standard image formats (PNG, JPG, WebP) up to 10 MB per file on Free and 15 MB on Pro/Studio tiers. Binary video file uploads are not currently supported.',
      },
      {
        question: 'Does VIZRA connect to Google Drive or Notion right now?',
        answer:
          'Not yet. External third-party OAuth integrations are currently in staging. Today you can upload reference files directly into Omnia 1.0 or index documents locally in the 25 MB RAG explorer.',
      },
    ],
    relatedLinks: [
      {
        label: 'AI Creative Studio Overview',
        to: '/ai-creative-studio',
        description: 'Explore the complete VIZRA creative studio architecture.',
      },
      {
        label: 'AI Assistant for Creative Work',
        to: '/ai-assistant-for-creative-work',
        description: 'Learn how Omnia 1.0 adapts across Quick, Think, Research, and Code modes.',
      },
      {
        label: 'VIZRA vs Canva',
        to: '/vizra-vs-canva',
        description: 'Compare template-driven graphic design with VIZRA’s AI creative workspace.',
      },
    ],
  },

  '/ai-tools-for-motion-designers': {
    slug: 'ai-tools-for-motion-designers',
    canonicalPath: '/ai-tools-for-motion-designers',
    category: 'Use Case',
    eyebrow: 'AI Tools for Motion Designers',
    h1: 'AI Tools for Motion Designers, Creative Coders & Visual Directors',
    lead: 'Prototype WebGL and GLSL shaders, plan kinetic typography systems, write beat-synced storyboards, and generate instrumental WAV audio beds inside VIZRA’s Obsidian studio environment.',
    secondaryLead:
      'Designed for motion designers and creative technologists who want technical code control, structured pre-production, and honest tool boundaries.',
    heroVisualTitle: 'Built for Motion Pre-Production & Creative Code',
    heroVisualCaption:
      'Combine shader prototyping, 60fps interactive visual references, and instrumental audio beds.',
    heroVisualItems: [
      { label: 'Code & Shaders', value: 'WebGL, GLSL fragment shaders, React & CSS motion' },
      { label: 'Interactive Reference', value: '4 live 60fps creative engine showcases in /studio' },
      { label: 'Soundtrack Beds', value: 'Lyria 3 & procedural WAV audio (5–120s)' },
      { label: 'Video Generation Status', value: 'Temporal Video Engine is In Staging (Roadmap)' },
    ],
    primaryCtaLabel: 'Explore Studio Engines',
    primaryCtaPath: '/studio',
    secondaryCtaLabel: 'Optimize a Motion Prompt (Free)',
    secondaryCtaPath: '/free-ai-prompt-optimizer',
    problemsSectionTitle: 'Where Motion Designers Lose Hours Before Opening After Effects or WebGL',
    problems: [
      {
        problem: 'Writing custom GLSL shaders, easing math, and procedural canvas effects from scratch slows down concept exploration.',
        solution:
          'Use Omnia 1.0 Code mode to draft, debug, and iterate GLSL fragment shaders, Three.js scenes, and React motion choreography with crisp technical explanations.',
        vizraFeature: 'Omnia 1.0 Code & Shader Synthesis (/ai)',
      },
      {
        problem: 'Early motion pitches need structured shot lists, timing breakdowns, and temporary instrumental music before locking final sound design.',
        solution:
          'Draft shot-by-shot storyboards and timing tables in Omnia 1.0, then synthesize 5–120 second instrumental WAV scratch tracks in the integrated AI Music Studio.',
        vizraFeature: 'Storyboarding + Lyria 3 Audio Studio (/tools)',
      },
      {
        problem: 'Creative tools often overpromise instant final video renders when you actually need deterministic visual systems and clean pre-production assets.',
        solution:
          'VIZRA focuses today on live creative coding, procedural visual frames, structured prompt engineering, and audio direction — while transparently marking Temporal Video synthesis as in staging.',
        vizraFeature: 'Studio Architecture & Transparent Roadmap (/studio)',
      },
    ],
    featuresSectionTitle: 'Motion & Visual Direction Capabilities Live Today',
    featuresSectionIntro:
      'Use VIZRA alongside your existing NLE, After Effects, Blender, or Three.js pipeline to speed up ideation, shader coding, and sonic prototyping.',
    features: [
      {
        title: 'WebGL & GLSL Shader Prototyping',
        category: 'Creative Coding',
        description:
          'Generate and refactor fragment shaders, noise fields, refraction uniforms, and React/CSS motion choreography directly in Omnia 1.0 Code mode.',
        status: 'Live Today',
        linkTo: '/ai',
        linkLabel: 'Open Code Mode',
      },
      {
        title: 'Interactive Studio Engine Showcases',
        category: 'Visual Reference',
        description:
          'Inspect live interactive WebGL and canvas visual engines in /studio and /explore to study real-time motion pacing and obsidian lighting aesthetics.',
        status: 'Live Today',
        linkTo: '/explore',
        linkLabel: 'Open 3D Creative Universe',
      },
      {
        title: 'Instrumental Scratch Tracks & Sonic Logos',
        category: 'Audio Direction',
        description:
          'Generate 5 to 120 second instrumental WAV tracks tuned to BPM and mood prompts so motion tests cut cleanly to rhythm.',
        status: 'Live Today',
        linkTo: '/tools',
        linkLabel: 'Inspect Music Studio',
      },
      {
        title: 'Temporal Video & Scene Synthesis',
        category: 'Upcoming R&D',
        description:
          'Dedicated generative video synthesis is currently in staging and not yet active for production rendering. Teams needing generative video today should review our Runway comparison.',
        status: 'In Staging',
        linkTo: '/vizra-vs-runway',
        linkLabel: 'Compare VIZRA vs Runway',
      },
    ],
    specsSectionTitle: 'Motion Workflow Capability Matrix',
    specs: [
      {
        capability: 'Shader & Motion Code',
        detail: 'GLSL, WebGL, Three.js, React, TypeScript, CSS keyframes & Motion specs',
        availability: 'Live Today',
      },
      {
        capability: 'Storyboard & Timing Briefs',
        detail: 'Structured shot lists, pacing scripts, camera direction & art direction briefs',
        availability: 'Live Today',
      },
      {
        capability: 'Audio Scratch Tracks',
        detail: '5–120s downloadable instrumental WAV files via Lyria 3 / procedural synthesis',
        availability: 'Live Today',
      },
      {
        capability: 'Generative Text-to-Video',
        detail: 'Temporal Video Engine (frame-coherent video generation)',
        availability: 'In Staging — Not Yet Live',
      },
    ],
    transparencyNote:
      'Straightforward expectation check: If your immediate need is generating finished AI video clips from text or images today, Runway is purpose-built for generative video right now. VIZRA excels today for motion designers who combine creative coding, shader prototyping, structured storyboarding, visual direction, and instrumental audio inside one workspace.',
    faqs: [
      {
        question: 'Can VIZRA generate production AI video clips today?',
        answer:
          'No. VIZRA’s Temporal Video Engine is currently in staging. Today VIZRA helps motion designers with GLSL/WebGL shader code, React/CSS motion prototypes, shot-list storyboards, procedural PNG concept frames, and downloadable WAV scratch soundtracks.',
      },
      {
        question: 'How do motion designers use the Free AI Prompt Optimizer?',
        answer:
          'Select the "Motion Design & Kinetic Concept" or "WebGL / GLSL Shader" preset on /free-ai-prompt-optimizer to turn a rough visual idea into a structured prompt specifying camera movement, pacing, easing, lighting, aspect ratio, and exclusions.',
      },
      {
        question: 'Can I upload a storyboard PDF or styleframe image for feedback?',
        answer:
          'Yes. You can attach up to 5 PDFs or reference images (PNG, JPG, WebP) per turn in Omnia 1.0 to audit visual hierarchy, refine pacing scripts, or translate a styleframe into shader parameters.',
      },
      {
        question: 'Does the AI Music Studio export usable audio files?',
        answer:
          'Yes. The Music Studio generates downloadable instrumental WAV audio from 5 to 120 seconds, suitable for timing motion edits and pitch prototypes.',
      },
    ],
    relatedLinks: [
      {
        label: 'VIZRA vs Runway',
        to: '/vizra-vs-runway',
        description: 'Honest comparison for video and motion teams evaluating both platforms.',
      },
      {
        label: 'Free AI Prompt Optimizer',
        to: '/free-ai-prompt-optimizer',
        description: 'Build structured motion and shader prompts without signing up.',
      },
      {
        label: 'Studio Engine Showcase',
        to: '/studio',
        description: 'Inspect VIZRA’s live interactive engines and transparent roadmap.',
      },
    ],
  },

  '/ai-assistant-for-creative-work': {
    slug: 'ai-assistant-for-creative-work',
    canonicalPath: '/ai-assistant-for-creative-work',
    category: 'Feature',
    eyebrow: 'AI Assistant for Creative Work',
    h1: 'Omnia 1.0: An AI Assistant Engineered for Creative and Technical Work',
    lead: 'Switch intentionally between Quick, Think, Research, Code, and Analyze modes with live verified HTTPS citations, 5-file multimodal auditing, and multilingual English, Hindi, and Hinglish fluency.',
    secondaryLead:
      'Omnia 1.0 respects your time through response proportionality — short direct answers for fast lookups, deep structured reasoning for complex creative and architectural decisions.',
    heroVisualTitle: 'Five Dedicated Cognitive Modes in Omnia 1.0',
    heroVisualCaption:
      'Match the assistant’s reasoning depth and citation rigor to your exact creative task.',
    heroVisualItems: [
      { label: 'Quick & Think', value: 'Fast turnaround or structured multi-step creative reasoning' },
      { label: 'Research Mode', value: 'Live Google Search grounding with verified HTTPS links' },
      { label: 'Code & Analyze', value: 'React/TS/GLSL drafting + 5-file PDF/CSV/image audits' },
      { label: 'Multilingual', value: 'Natural English, Hindi, and Hinglish studio collaboration' },
    ],
    primaryCtaLabel: 'Start Using Omnia 1.0 Free',
    primaryCtaPath: '/ai',
    secondaryCtaLabel: 'Test Free Prompt Optimizer',
    secondaryCtaPath: '/free-ai-prompt-optimizer',
    problemsSectionTitle: 'Fixing the Daily Frustrations of Generic AI Assistants',
    problems: [
      {
        problem: 'One-size-fits-all chat responses either over-explain simple questions or give shallow bullet points on complex architecture.',
        solution:
          'Omnia 1.0 explicitly separates Quick, Think, Research, Code, and Analyze modes and calibrates response depth to prompt complexity.',
        vizraFeature: 'Adaptive Reasoning & Proportionality (/ai)',
      },
      {
        problem: 'Unverified citations and broken links ruin research-backed articles, pitch decks, and product strategy.',
        solution:
          'Research mode runs live Google Search grounding and outputs verified HTTPS source cards — and refuses to fabricate URLs when evidence is unavailable.',
        vizraFeature: 'Live Search Grounding & Citation Cards',
      },
      {
        problem: 'Bilingual creators working across English, Hindi, and Hinglish often get stiff, unnatural translations from standard models.',
        solution:
          'Omnia 1.0 responds natively across English, Hindi, and Hinglish while keeping technical terminology accurate.',
        vizraFeature: 'Multilingual Creative Fluency',
      },
    ],
    featuresSectionTitle: 'Core Capabilities of the Omnia 1.0 Assistant',
    featuresSectionIntro:
      'Built directly inside the VIZRA creative studio so every chat can transition seamlessly into visual frames, audio, code, or saved project milestones.',
    features: [
      {
        title: 'Grounded Web Research with Source Cards',
        category: 'Accuracy & Citations',
        description:
          'Verify market facts, technical specifications, and reference material via live Google Search grounding with clickable HTTPS sources.',
        status: 'Live Today',
        linkTo: '/ai',
        linkLabel: 'Try Research Mode',
      },
      {
        title: 'Multimodal File Auditing (Up to 5 Files)',
        category: 'Document & Image Review',
        description:
          'Upload creative briefs, pitch PDFs, CSV datasets, UI screenshots, or codebases together in one prompt for cohesive critique.',
        status: 'Live Today',
        linkTo: '/ai',
        linkLabel: 'Upload & Analyze',
      },
      {
        title: 'DeepMind Science Hub Integration',
        category: 'Scientific Reference',
        description:
          'Pull real molecular, protein, and biomedical literature records from AlphaFold DB, PubChem, and PubMed directly inside the studio.',
        status: 'Live Today',
        linkTo: '/tools',
        linkLabel: 'Inspect Science Hub',
      },
      {
        title: 'Live Voice Mode (Stateful Runtime)',
        category: 'Voice Collaboration',
        description:
          'Authenticated real-time voice sessions are supported on VIZRA’s stateful Node.js WebSocket runtime (note: stateless serverless edge deployments run text/multimodal modes).',
        status: 'Live Today',
        linkTo: '/docs',
        linkLabel: 'Read Runtime Docs',
      },
    ],
    specsSectionTitle: 'Omnia 1.0 Technical Profile',
    specs: [
      {
        capability: 'Reasoning Modes',
        detail: 'Quick, Think, Research, Code, Analyze',
        availability: 'Live Today',
      },
      {
        capability: 'Grounded Citations',
        detail: 'Live Google Search grounding returning verified HTTPS URLs',
        availability: 'Live Today',
      },
      {
        capability: 'File Upload Limits',
        detail: '5 files/turn; 10 MB/file on Creator Free, 15 MB/file on Pro/Studio',
        availability: 'Live Today',
      },
      {
        capability: 'Languages Supported',
        detail: 'English, Hindi, Hinglish, and technical programming languages',
        availability: 'Live Today',
      },
    ],
    transparencyNote:
      'Accuracy & runtime notice: Omnia 1.0 grounds web queries via live search and avoids fabricated links, though users should still verify critical legal, medical, or financial decisions independently. Authenticated Live Voice WebSockets require the stateful Node.js runtime rather than stateless serverless hosting.',
    faqs: [
      {
        question: 'How does Omnia 1.0 prevent fabricated links?',
        answer:
          'When using Research mode, Omnia 1.0 invokes live Google Search grounding and extracts verified HTTPS citations into structured source cards rather than guessing URLs from memory.',
      },
      {
        question: 'Can I write prompts in Hindi or Hinglish?',
        answer:
          'Yes. Omnia 1.0 natively understands and responds in English, Hindi, and Hinglish while keeping code snippets, design terms, and technical specifications intact.',
      },
      {
        question: 'What happens to my conversations when I sign in?',
        answer:
          'When signed in via Google SSO or email, your conversations sync to your account-isolated Firebase Firestore workspace and can be reopened or searched anytime in /history.',
      },
      {
        question: 'How can I write better prompts for Omnia 1.0?',
        answer:
          'Try our free, zero-signup AI Prompt Optimizer at /free-ai-prompt-optimizer. It structures your raw idea into a production brief and lets you send it straight into Omnia 1.0 with one click.',
      },
    ],
    relatedLinks: [
      {
        label: 'Free AI Prompt Optimizer',
        to: '/free-ai-prompt-optimizer',
        description: 'Structure creative prompts and send them directly into Omnia 1.0.',
      },
      {
        label: 'AI Creative Studio',
        to: '/ai-creative-studio',
        description: 'See how Omnia 1.0 connects with visual, code, and audio engines.',
      },
      {
        label: 'VIZRA vs Krea AI',
        to: '/vizra-vs-krea-ai',
        description: 'Compare real-time image canvases with an all-in-one AI creative studio.',
      },
    ],
  },
};
