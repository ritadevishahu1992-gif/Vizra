import { DocArticle } from './types';

export const INTRO_AND_PLATFORM_DOCS: DocArticle[] = [
  // =========================================================================
  // SECTION A — INTRODUCTION (1–8)
  // =========================================================================
  {
    slug: 'welcome-to-vizra',
    code: '01',
    sectionId: 'A',
    sectionTitle: 'Section A · Introduction',
    title: 'Welcome to VIZRA',
    summary:
      'An introduction to the VIZRA Public Documentation Centre and how to navigate guides for visitors, creators, and teams.',
    diagramId: 'platform-overview',
    blocks: [
      {
        id: 'overview',
        heading: 'Using This Documentation Centre',
        paragraphs: [
          'Welcome to the official VIZRA Public Documentation Centre. This knowledge hub explains how VIZRA works, how its AI assistant OMNIA helps you plan and produce creative work, which tools are live today, and how privacy, security, and responsible usage work across the platform.',
          'Every guide on these pages describes real, verified capabilities available in the current web experience. Features that have usage boundaries, browser dependencies, or staged availability are clearly labeled as AVAILABLE, LIMITED, UNAVAILABLE, or COMING SOON.',
        ],
      },
      {
        id: 'who-it-is-for',
        heading: 'Who These Docs Are Written For',
        bullets: [
          'First-time visitors evaluating what VIZRA offers and how OMNIA differs from a standard chat box.',
          'Creators, writers, designers, filmmakers, and developers working inside the Omnia workspace.',
          'Researchers and educators using live web grounding or the Science Research Suite.',
          'Teams and reviewers checking safety safeguards, cookie controls, privacy rights, and platform limits.',
        ],
      },
      {
        id: 'quick-paths',
        heading: 'Recommended Starting Paths',
        steps: [
          'Read "What is VIZRA?" and "Getting Started" in Section A if you are brand new.',
          'Review Section B to understand OMNIA modes, workspace navigation, and supported browsers.',
          'Browse Section C whenever you need step-by-step usage instructions or limits for a specific tool.',
          'Check Sections F, G, and H for privacy self-service controls, troubleshooting, and availability statuses.',
        ],
      },
    ],
    relatedLinks: [
      { label: 'What is VIZRA?', to: '/docs?doc=what-is-vizra' },
      { label: 'First-Time User Guide', to: '/docs?doc=first-time-user-guide' },
      { label: 'Open Omnia Workspace', to: '/ai' },
    ],
  },
  {
    slug: 'what-is-vizra',
    code: '02',
    sectionId: 'A',
    sectionTitle: 'Section A · Introduction',
    title: 'What is VIZRA?',
    summary:
      'VIZRA is a web-based AI creative studio and multimodal workflow platform powered by the Omnia 1.0 operating layer.',
    blocks: [
      {
        id: 'definition',
        heading: 'Core Definition',
        paragraphs: [
          'VIZRA combines an intelligent conversational workspace (Omnia 1.0), specialized creative discipline tools (Create Hub), grounded web research, multimodal file inspection, scientific lookup utilities, and structured 10-stage project planning in one browser application.',
          'Rather than scattering scripts, code prototypes, research notes, and media prompts across unrelated apps, VIZRA brings ideation, research, creation, and export together inside a single cohesive studio.',
        ],
      },
      {
        id: 'pillars',
        heading: 'The Four Studio Pillars',
        table: {
          headers: ['Pillar', 'Focus Area', 'Where to Experience It'],
          rows: [
            ['Think', 'Brainstorming, step-by-step reasoning, and grounded web research', 'Omnia AI (/ai) & Features (/features)'],
            ['Create', 'Editorial scripts, visual concepts, design tokens, and soundtracks', 'AI Tools (/tools) & Omnia AI (/ai)'],
            ['Build', 'React, TypeScript, shader prototypes, and 10-stage production plans', 'Omnia AI (/ai) & Workspace (/workspace)'],
            ['Explore', 'Curated 3D creative gallery and studio engine demonstrations', 'Explore (/explore) & Studio (/studio)'],
          ],
        },
      },
    ],
    relatedLinks: [
      { label: 'Explore Features Overview', to: '/features' },
      { label: 'Browse AI Tools', to: '/tools' },
    ],
  },
  {
    slug: 'purpose-of-vizra',
    code: '03',
    sectionId: 'A',
    sectionTitle: 'Section A · Introduction',
    title: 'Purpose of VIZRA',
    summary:
      'Why VIZRA exists: turning scattered multi-tool creative friction into a calm, transparent, project-aware creative studio.',
    blocks: [
      {
        id: 'problem-solved',
        heading: 'Reducing Creative Fragmentation',
        paragraphs: [
          'Modern digital production frequently forces creators to jump between separate chat windows, note apps, search engines, spreadsheet analyzers, and code editors. Critical context—such as brand tone, target audience, or verified source links—gets lost between tabs.',
          'VIZRA was created to hold that context together cleanly. Simple questions receive quick, direct replies, while larger initiatives can grow into structured 10-stage project briefs with persistent memory and task tracking.',
        ],
      },
      {
        id: 'core-commitments',
        heading: 'Foundational Goals',
        bullets: [
          'Proportional assistance: direct answers when you need speed, deeper structured workflows when you are building.',
          'Verified grounding: live web citations with real clickable URLs—never invented references.',
          'Honest status reporting: clear labels showing what works today versus what remains in staging or coming soon.',
        ],
      },
    ],
    relatedLinks: [
      { label: 'About VIZRA', to: '/about' },
      { label: 'Product Philosophy', to: '/docs?doc=product-philosophy' },
    ],
  },
  {
    slug: 'product-philosophy',
    code: '04',
    sectionId: 'A',
    sectionTitle: 'Section A · Introduction',
    title: 'Product Philosophy',
    summary:
      '“Don’t just ask AI. Work with it.” — The principles shaping VIZRA’s interface, response style, and transparency standards.',
    blocks: [
      {
        id: 'working-with-ai',
        heading: 'Active Collaboration Over One-Off Prompts',
        paragraphs: [
          'VIZRA treats AI as a structured studio partner rather than a vending machine for generic text. Every interface element—from capability modes to editable 10-stage workflows—keeps you in control of direction, edits, and final judgment.',
        ],
      },
      {
        id: 'guiding-principles',
        heading: 'Five Guiding Principles',
        bullets: [
          'Zero Fabricated Citations: When live facts cannot be independently verified, OMNIA states uncertainty rather than guessing URLs or dates.',
          'Proportional Depth: Everyday questions get conversational clarity without rigid report templates.',
          'Quiet Obsidian Precision: An uncluttered interface designed to highlight your work, text, and visuals without visual noise.',
          'Honest Feature Boundaries: Unready connectors and upcoming engines like temporal video synthesis are marked openly as staged or coming soon.',
          'User Control Over Data: Self-service conversation deletion, local export, granular cookie consent, and full account data erasure remain directly accessible.',
        ],
      },
    ],
  },
  {
    slug: 'ai-creative-studio',
    code: '05',
    sectionId: 'A',
    sectionTitle: 'Section A · Introduction',
    title: 'Understanding the AI Creative Studio',
    summary:
      'How the public showcase pages, interactive OMNIA workspace, and project management console fit together.',
    blocks: [
      {
        id: 'studio-layers',
        heading: 'Two Complementary Layers',
        paragraphs: [
          'When you visit VIZRA, you encounter two connected experiences tailored to what you need in the moment:',
        ],
        bullets: [
          'Public Studio Pages (Home, Features, Tools, Studio, Explore, Pricing, Docs, Contact): Open without sign-in so visitors can inspect capabilities, preview pricing tiers, explore the 3D showcase, and read documentation.',
          'Interactive Creation Layer (/ai, /workspace, /history, /settings): Where you chat with OMNIA 1.0, attach local files, run research queries, synthesize audio tracks or visual canvases, and track 10-stage projects.',
        ],
      },
      {
        id: 'what-stays-human',
        heading: 'Human Creative Ownership',
        paragraphs: [
          'AI outputs in VIZRA are meant to accelerate drafting, structuring, exploration, and prototyping. You retain ownership over your original human-authored inputs, while copyrightability of AI-assisted outputs depends on applicable jurisdiction and sufficient human creative authorship as detailed in the Terms & Conditions.',
        ],
      },
    ],
    relatedLinks: [
      { label: 'Platform Overview Diagram', to: '/docs?doc=platform-overview' },
      { label: 'Terms & Conditions', to: '/terms-and-conditions' },
    ],
  },
  {
    slug: 'who-can-use-vizra',
    code: '06',
    sectionId: 'A',
    sectionTitle: 'Section A · Introduction',
    title: 'Who Can Use VIZRA?',
    summary:
      'Omnia Adult (18+) and Omnia Youth (verified parental consent) eligibility, guest access versus signed-in accounts, and creator audiences.',
    blocks: [
      {
        id: 'eligibility',
        heading: 'Age Assurance & Parental Consent Policy',
        paragraphs: [
          'VIZRA operates the Age Assurance & Parental Consent Framework supporting Omnia Adult (eligible users aged 18+) and Omnia Youth (eligible users under 18 with jurisdiction-appropriate verifiable parental consent and mandatory safeguards).',
          'Age declaration is used only for initial routing, never as proof of age, and VIZRA performs zero behavioral age inference. For Omnia Youth accounts, Live Voice, unrestricted audio synthesis, paid upgrades, external connectors, and targeted ads remain disabled even with parental consent.',
        ],
        callout: {
          variant: 'warning',
          title: 'Omnia Adult & Omnia Youth Eligibility',
          body: 'Adults aged 18+ access Omnia Adult. Minors under 18 require verified parental consent under applicable law via /parental-consent (fail-closed until independent parent identity verification is completed).',
        },
      },
      {
        id: 'guest-vs-signed-in',
        heading: 'Guest Exploration vs. Signed-In Accounts',
        table: {
          headers: ['Capability', 'Guest Browser Session', 'Signed-In Account (Google / Email)'],
          rows: [
            ['Public website, Pricing & Docs', 'Available', 'Available'],
            ['Omnia chat, Research & File Upload', 'Available (local browser storage)', 'Available'],
            ['History & 10-Stage Projects', 'Saved in current browser only', 'Synced across devices via cloud storage'],
            ['Live Voice Mode', 'Unavailable (requires sign-in)', 'Available (requires auth & mic)'],
            ['Self-Service Data Erasure', 'Clear local cache & session', 'Purge cloud/account & local data'],
          ],
        },
      },
    ],
    relatedLinks: [
      { label: 'Terms & Conditions', to: '/terms-and-conditions' },
      { label: 'Account Safety', to: '/docs?doc=account-safety' },
    ],
  },
  {
    slug: 'getting-started',
    code: '07',
    sectionId: 'A',
    sectionTitle: 'Section A · Introduction',
    title: 'Getting Started',
    summary:
      'Go from opening VIZRA for the first time to completing your first prompt, attachment inspection, or 10-stage project.',
    diagramId: 'user-journey',
    blocks: [
      {
        id: 'quick-start-steps',
        heading: 'Five Steps to Start Creating',
        steps: [
          'Open VIZRA and click "Launch Omnia" in the top navigation bar (or visit /ai directly).',
          'Choose a capability mode in the prompt bar—such as Quick for fast answers, Research for cited web facts, or Create for structured studio work.',
          'Type your request in plain English, Hindi, or Hinglish, and optionally attach a local image, PDF, CSV, or code file.',
          'Review OMNIA’s response, inspect any source citations in the citations drawer, or use Message Actions to copy, export Markdown, or ask a follow-up.',
          'Optionally sign in with Google to synchronize your 10-stage projects across devices and unlock Live Voice sessions.',
        ],
      },
      {
        id: 'starter-prompts',
        heading: 'Three Starter Prompts to Try Immediately',
        example: {
          title: 'Starter Prompts by Goal',
          language: 'text',
          content: `1. Quick Answer: "Compare CSS Grid and Flexbox for a two-column dashboard layout in 4 bullet points."\n2. Grounded Research (Research Mode): "Summarize current USB-C Power Delivery wattage standards with primary sources."\n3. Studio Planning (Create Mode): "Outline a 30-second product reveal script for an obsidian mechanical keyboard."`,
        },
      },
    ],
    relatedLinks: [
      { label: 'First-Time User Guide', to: '/docs?doc=first-time-user-guide' },
      { label: 'Launch Omnia AI', to: '/ai' },
    ],
  },
  {
    slug: 'basic-terminology',
    code: '08',
    sectionId: 'A',
    sectionTitle: 'Section A · Introduction',
    title: 'Basic Terminology',
    summary:
      'Plain-language glossary of key VIZRA terms you will see across the interface and these guides.',
    blocks: [
      {
        id: 'glossary',
        heading: 'Core Terms & Definitions',
        table: {
          headers: ['Term', 'Meaning in VIZRA'],
          rows: [
            ['OMNIA 1.0', 'The AI intelligence and workflow engine operating inside VIZRA’s workspace.'],
            ['Capability Mode', 'Your selected working style in chat: Quick, Think, Research, Science, Create, Code, or Analyze.'],
            ['Grounded Citation', 'A live web source URL retrieved and attached to a Research answer so you can verify facts directly.'],
            ['Create Hub', 'The organized launcher inside Tools and Omnia offering specialized workflows across writing, design, images, code, decks, research, and file analysis.'],
            ['10-Stage Project', 'A structured creative plan tracking work from Stage 01 (Ideation) through Stage 10 (Release) with saved memory and tasks.'],
            ['Project Memory', 'Editable project-level facts (goal, target audience, tone/style, requirements) kept available while working inside a project.'],
            ['Science Suite', 'Built-in lookup tool connecting to public scientific records (AlphaFold DB, PubChem, and PubMed) for educational research.'],
            ['Knowledge Base (RAG)', 'A local-session document explorer that splits uploaded specs into searchable sections for project retrieval testing.'],
            ['Availability Status', 'Honest state labels used throughout docs: AVAILABLE, LIMITED, UNAVAILABLE, or COMING SOON.'],
          ],
        },
      },
    ],
  },

  // =========================================================================
  // SECTION B — UNDERSTANDING THE PLATFORM (9–15)
  // =========================================================================
  {
    slug: 'platform-overview',
    code: '09',
    sectionId: 'B',
    sectionTitle: 'Section B · Understanding the Platform',
    title: 'Platform Overview',
    summary:
      'How VIZRA connects public exploration pages, the Omnia workspace, the Project Console, History archive, and Settings.',
    diagramId: 'platform-overview',
    blocks: [
      {
        id: 'route-map',
        heading: 'Public Pages vs. Workspace Areas',
        paragraphs: [
          'VIZRA separates public informational routes—which anyone can read and search engines can index—from private interactive workspace routes where your personal prompts, chats, and projects live.',
        ],
        table: {
          headers: ['Area', 'Route', 'Primary Purpose'],
          rows: [
            ['Home & Overview', '/', 'Introduction to VIZRA, core pillars, and quick entry into Omnia'],
            ['Features & Tools', '/features · /tools', 'Detailed visual breakdown of workflows and launchable Create Hub disciplines'],
            ['Creative Studio & Showcase', '/studio · /explore', 'Motion/shader capabilities, upcoming R&D concepts, and 3D gallery'],
            ['Pricing & Contact', '/pricing · /contact', 'Tier comparison, preview selection, inquiries, and early access requests'],
            ['Public Docs & Legal', '/docs · /privacy-policy · /terms-and-conditions · /cookie-policy', 'A–Z user guidance and governance policies'],
            ['Omnia AI Workspace', '/ai', 'Live chat, multimodal attachments, music, science, live voice, and project editor'],
            ['Workspace Console', '/workspace', '10-stage project table, asset uploader, analytics, and client token controls'],
            ['History & Settings', '/history · /settings', 'Thread search/export and theme, language, cache, and account erasure controls'],
          ],
        },
      },
    ],
  },
  {
    slug: 'understanding-omnia',
    code: '10',
    sectionId: 'B',
    sectionTitle: 'Section B · Understanding the Platform',
    title: 'Understanding OMNIA',
    summary:
      'How the OMNIA 1.0 assistant adapts its reasoning depth, mode behavior, and response formatting to match your task.',
    diagramId: 'omnia-interaction',
    blocks: [
      {
        id: 'what-omnia-is',
        heading: 'What OMNIA Does',
        paragraphs: [
          'OMNIA 1.0 is the conversational and multimodal engine powering VIZRA. Instead of treating every message identically, OMNIA pays attention to the active Capability Mode you select, any files you attach, and whether you are working inside a general chat or a dedicated 10-stage project.',
          'General knowledge questions remain isolated from unrelated creative projects so your science, math, or coding answers stay focused and uncontaminated.',
        ],
      },
      {
        id: 'seven-modes',
        heading: 'The 7 Capability Modes Explained',
        table: {
          headers: ['Mode', 'Best Used For', 'Response Style'],
          rows: [
            ['Quick', 'Everyday facts, definitions, rapid drafts', 'Fast, concise, conversational without unnecessary padding'],
            ['Think', 'Complex logic, system trade-offs, planning', 'Step-by-step structured reasoning'],
            ['Research', 'Current events, verified references, comparisons', 'Live web search grounding with clickable source URLs'],
            ['Science', 'Protein IDs, chemical formulas, biomedical papers', 'Educational science context + AlphaFold/PubChem/PubMed lookups'],
            ['Create', 'Scripts, visual concepts, design systems, decks', 'Creative direction, structured treatments, 10-stage kickoffs'],
            ['Code', 'React, TypeScript, CSS, WebGL shaders, debugging', 'Clean syntax, modular examples, implementation guidance'],
            ['Analyze', 'Inspecting uploaded PDFs, CSV tables, or images', 'Document extraction, summaries, and audit observations'],
          ],
        },
      },
    ],
    relatedLinks: [
      { label: 'OMNIA Detailed Docs (Section D)', to: '/docs?doc=omnia-introduction' },
      { label: 'Omnia AI Workspace Guide', to: '/docs?doc=feature-omnia-chat' },
    ],
  },
  {
    slug: 'how-omnia-assists',
    code: '11',
    sectionId: 'B',
    sectionTitle: 'Section B · Understanding the Platform',
    title: 'How OMNIA Assists Users',
    summary:
      'Practical ways OMNIA supports brainstorming, drafting, multimodal inspection, research verification, and multi-stage builds.',
    blocks: [
      {
        id: 'practical-assistance',
        heading: 'Day-to-Day Assistance Patterns',
        bullets: [
          'Conversational Drafting: Iterate on copy, video scripts, keynote outlines, and social campaigns in real time.',
          'File-Aware Analysis: Upload an image, PDF, CSV spreadsheet, or code file in the prompt bar to ask targeted questions about what is inside.',
          'Source-Backed Research: Switch to Research mode when accuracy and verifiable primary links matter.',
          'Creative Media Companions: Open the AI Music Studio for custom audio loops, Creation Tools for diffusion prompt building and Bezier easing curves, or Live Voice when you prefer speaking out loud.',
          'Persistent Project Scaffolding: Convert a multi-part idea into a 10-stage project so requirements and decisions stay visible while you refine each milestone.',
        ],
      },
      {
        id: 'what-omnia-does-not-replace',
        heading: 'Where Human Judgment Remains Essential',
        paragraphs: [
          'OMNIA assists with creative synthesis and information gathering, but it does not replace qualified legal, medical, financial, or engineering sign-off. Always verify critical code, numbers, and factual claims before publishing or deploying work.',
        ],
      },
    ],
  },
  {
    slug: 'ai-assisted-workflows',
    code: '12',
    sectionId: 'B',
    sectionTitle: 'Section B · Understanding the Platform',
    title: 'Understanding AI-Assisted Workflows',
    summary:
      'How single-turn prompts evolve into repeatable 10-stage creative workflows with persistent project memory.',
    diagramId: 'creative-workflow',
    blocks: [
      {
        id: 'single-vs-workflow',
        heading: 'Chat Threads vs. 10-Stage Workflows',
        paragraphs: [
          'Not every task needs a project plan. Quick questions and single edits work best as regular chat threads stored in your conversation sidebar and History page.',
          'When you are producing something multi-layered—such as a product launch, software prototype, brand identity, or film treatment—VIZRA lets you initialize a 10-stage project workspace containing a structured roadmap, editable stage briefs, project memory, a task checklist, and freeform notes.',
        ],
      },
      {
        id: 'ten-stages-summary',
        heading: 'Lifecycle Inside a Workflow',
        steps: [
          'Define core parameters in Project Memory (Goal, Target Audience, Style & Tone, Requirements).',
          'Step through stages from Concept Brief and Research Grounding through Prototyping, Assets, Audit, and Release.',
          'Attach supporting project documents or inspect individual stage briefs—and click "Refine this stage in Chat" whenever you want OMNIA to expand or rewrite a section.',
          'Export the complete specification as Markdown or JSON when finished.',
        ],
      },
    ],
    relatedLinks: [
      { label: '10-Stage Project Workflows Guide', to: '/docs?doc=feature-project-workflows' },
      { label: 'Common Workflow Examples', to: '/docs?doc=common-workflow-examples' },
    ],
  },
  {
    slug: 'navigation-workspace-overview',
    code: '13',
    sectionId: 'B',
    sectionTitle: 'Section B · Understanding the Platform',
    title: 'Navigation and Workspace Overview',
    summary:
      'A tour of the public navigation bar, footer directories, and the layout of the Omnia workspace.',
    blocks: [
      {
        id: 'public-navigation',
        heading: 'Public Top Navigation & Footer',
        paragraphs: [
          'Across all public pages, the top header provides direct links to Platform modules (via the Platform dropdown), Features, AI Tools, Studio, Explore, Pricing, Docs, About, and Contact, alongside the Light/Dark theme toggle, Notification Center, Sign-In menu, and the "Launch Omnia" button.',
          'The site footer organizes links across six columns (Platform, Products / Tools, Resources, Company, Legal, Ecosystem) and provides persistent access to Manage Cookie Preferences at any time.',
        ],
      },
      {
        id: 'workspace-layout',
        heading: 'Inside the Omnia Workspace (/ai)',
        bullets: [
          'Left Sidebar (collapsible on desktop, drawer on mobile): "+ New chat", conversation search, active 10-Stage Projects list, time-grouped chat history (Today, Yesterday, Previous 7 days), credit indicator, and shortcut link to Workspace Console.',
          'Top Workspace Header: Model/capability controls, Create Hub, Science Suite, Knowledge Base, AI Music, Live Voice, Engage panel, Command Palette, New Chat, Shortcuts Help, Settings, Theme Toggle, and Profile menu.',
          'Main Stage: Streaming conversation canvas (or 10-stage Project Workspace view when a project is active) paired with the bottom Prompt Composer.',
          'Workspace Console (/workspace): Dedicated management dashboard with Overview, Projects table, Multimodal Asset uploader, Usage Analytics charts, and Workspace Token controls.',
        ],
      },
    ],
  },
  {
    slug: 'ui-overview',
    code: '14',
    sectionId: 'B',
    sectionTitle: 'Section B · Understanding the Platform',
    title: 'UI Overview',
    summary:
      'Visual themes, interactive controls, keyboard shortcuts, and how status indicators work across VIZRA.',
    blocks: [
      {
        id: 'themes',
        heading: 'Dark Mode & Light Mode',
        paragraphs: [
          'VIZRA defaults to an obsidian dark theme designed for low-glare reading and high visual contrast. A Light Mode toggle is available in the top navigation bar, inside the Omnia header, and on the Settings page. Your choice is saved locally in your browser.',
        ],
      },
      {
        id: 'composer-controls',
        heading: 'Prompt Composer Anatomy',
        bullets: [
          'Plus (+) Button: Opens the Add menu to drag-and-drop local files, browse images/documents, view staged cloud connectors, or jump to Create workflows.',
          'Mode Pill: Displays your active mode (Quick by default) and opens the 7-mode selector.',
          'Quick Launchers: Direct buttons for Creation Tools, AI Music Studio, and Live Voice Mode.',
          'Microphone & Send/Stop: Dictate prompts using supported browser speech recognition, submit with Enter (Shift+Enter for new line), or halt an active stream immediately.',
        ],
      },
      {
        id: 'keyboard-shortcuts',
        heading: 'Built-In Keyboard Navigation',
        paragraphs: [
          'Inside the Omnia workspace, press "/" to focus the message box, Cmd/Ctrl + K to open the Command Palette, Cmd/Ctrl + N for a new conversation, Cmd/Ctrl + / to inspect all shortcuts, and Cmd/Ctrl + , to open Settings.',
        ],
      },
    ],
  },
  {
    slug: 'supported-devices-browsers',
    code: '15',
    sectionId: 'B',
    sectionTitle: 'Section B · Understanding the Platform',
    title: 'Supported Devices and Browsers',
    summary:
      'Device form factors, responsive layouts, and browser capabilities needed for smooth operation.',
    blocks: [
      {
        id: 'devices',
        heading: 'Desktop, Tablet & Mobile Support',
        paragraphs: [
          'VIZRA is a responsive web application usable on desktop monitors, laptops, tablets, and smartphones without installing separate software. Sidebar drawers automatically collapse on smaller viewports so reading and prompting stay comfortable.',
          'Complex multi-pane activities—such as reviewing 10-stage project plans, writing code, browsing the Knowledge Base, or exploring the 3D Showcase—are most comfortable on a desktop or landscape tablet screen.',
        ],
      },
      {
        id: 'browser-features',
        heading: 'Modern Browser Requirements',
        bullets: [
          'Use a current release of Chrome, Edge, Safari, or Firefox with JavaScript and WebGL enabled.',
          'Hardware acceleration / WebGL 2 is recommended for the 3D Explore gallery and Studio visual previews.',
          'Microphone permission and Web Audio API support are required for Live Voice Mode and browser speech dictation.',
          'Local browser storage must not be blocked in private/incognito strict mode if you want guest threads, projects, or theme preferences remembered across reloads.',
        ],
      },
    ],
    relatedLinks: [
      { label: 'Full Browser Requirements (Section H)', to: '/docs?doc=browser-requirements' },
      { label: 'Browser Compatibility Troubleshooting', to: '/docs?doc=troubleshooting-browser-compatibility' },
    ],
  },
];
