import { DocArticle } from './types';

export const GUIDES_TRUST_TECH_DOCS: DocArticle[] = [
  // =========================================================================
  // SECTION E — USER GUIDES (23–29)
  // =========================================================================
  {
    slug: 'first-time-user-guide',
    code: '23',
    sectionId: 'E',
    sectionTitle: 'Section E · User Guides',
    title: 'First-Time User Guide',
    summary:
      'A complete walkthrough for new 18+ visitors: navigating VIZRA, running your first session, and saving your work.',
    diagramId: 'user-journey',
    blocks: [
      {
        id: 'walkthrough',
        heading: 'Your First 5 Minutes in VIZRA',
        steps: [
          'Confirm you meet the 18+ adult studio eligibility requirement outlined in the Terms & Conditions.',
          'Browse Features (/features) or AI Tools (/tools) to pick a discipline, or click "Launch Omnia" directly in the top navbar.',
          'Review your cookie preference banner in the footer or first-visit prompt: optional analytics, functional, and marketing toggles remain off unless you accept them.',
          'Type a prompt inside the Prompt Composer on /ai, select a mode (e.g., Quick or Research), and press Enter.',
          'If you want your 10-stage projects and conversations synced across devices, sign in via Google using the Sign In menu in the header.',
        ],
      },
      {
        id: 'shortcuts-tip',
        heading: 'Productivity Shortcuts to Remember',
        bullets: [
          'Press "/" anytime inside Omnia to focus the prompt box.',
          'Press Cmd/Ctrl + K to launch the Command Palette for instant switching between tools and views.',
          'Press Cmd/Ctrl + / to inspect the complete Keyboard Shortcuts sheet.',
        ],
      },
    ],
  },
  {
    slug: 'using-ai-chat',
    code: '24',
    sectionId: 'E',
    sectionTitle: 'Section E · User Guides',
    title: 'Using AI Chat',
    summary:
      'Step-by-step guide to starting conversations, switching modes, attaching files, dictating prompts, and managing threads.',
    blocks: [
      {
        id: 'chat-workflow',
        heading: 'Running Productive Chat Sessions',
        steps: [
          'Click "+ New chat" (top left sidebar or header) whenever switching to an unrelated topic so context stays clean.',
          'Pick a Capability Mode from the Prompt Composer selector (Quick, Think, Research, Science, Create, Code, or Analyze).',
          'Optionally click "+" to attach up to 5 local images, PDFs, CSVs, audio clips, or code files (10 MB max per file).',
          'Press Enter to submit (or Shift + Enter for multi-line prompts). Click Stop Generation if you want to adjust mid-stream.',
          'Use the left sidebar menu on any conversation row to rename, archive, or delete old threads.',
        ],
      },
      {
        id: 'voice-options',
        heading: 'Speaking Prompts Instead of Typing',
        paragraphs: [
          'Click the Microphone button in the prompt bar to dictate text in browsers supporting Web Speech Recognition, or sign in and click "Live" to open a two-way Live Voice session.',
        ],
      },
    ],
  },
  {
    slug: 'using-creative-tools',
    code: '25',
    sectionId: 'E',
    sectionTitle: 'Section E · User Guides',
    title: 'Using Supported Creative Tools',
    summary:
      'How to launch Creation Tools, Create Hub disciplines, AI Music Studio, Science Suite, and 10-Stage Projects.',
    blocks: [
      {
        id: 'launching-tools',
        heading: 'Where Creative Tools Live',
        bullets: [
          'Create Hub (/tools or "Create Hub" in /ai header): Launches pre-configured workflows for Write, Design, Image, Code, Presentation, Research, and Analyze.',
          'Creation Tools ("Tools" button in Prompt Composer): Opens Image Crafter (aspect ratio & lighting prompt builder + preview card), Kinetic Curves (interactive cubic-bezier motion tuner), Video Director storyboard planner, Shader Generator, and Audio Brief builder.',
          'AI Music Studio ("AI Music" in /ai header): Generates 5–30s audio clips or up to 120s full instrumental tracks with WAV export.',
          'Science Hub ("Science" in /ai header): Queries AlphaFold protein records, PubChem compounds, and NCBI PubMed articles for educational research.',
        ],
      },
      {
        id: 'avoid-staged-confusion',
        heading: 'Checking Live vs. Staged Tools',
        paragraphs: [
          'Live creative tools open immediately in your browser. Tools marked "In Staging" or "Coming Soon" (such as Temporal Video & Scene Synthesis and Third-Party Cloud Connectors) are roadmap items rather than live generation pipelines.',
        ],
      },
    ],
    relatedLinks: [
      { label: 'Complete Feature & Tool Reference', to: '/docs?doc=feature-omnia-chat' },
      { label: 'Explore /tools Live Grid', to: '/tools' },
    ],
  },
  {
    slug: 'writing-effective-prompts',
    code: '26',
    sectionId: 'E',
    sectionTitle: 'Section E · User Guides',
    title: 'Writing Effective Prompts',
    summary:
      'Practical prompt patterns for writing, design systems, code engineering, visual concepts, and file analysis.',
    diagramId: 'guide-prompt-cycle',
    blocks: [
      {
        id: 'prompt-patterns',
        heading: 'Proven Prompt Templates',
        example: {
          title: 'Reusable Prompt Patterns by Mode',
          language: 'text',
          content: `[Code Mode]
"Create an accessible React modal hook in TypeScript supporting Escape key close and focus restoration. Keep dependencies zero and annotate edge cases."

[Design / Create Mode]
"Build a high-contrast dark theme token table with neutral backgrounds, white primary text, and #EB3B2D accent highlights. Include WCAG contrast notes."

[Analyze Mode + CSV Upload]
"Inspect the attached CSV file. Summarize the top 3 trends, flag missing or duplicate rows, and present summary metrics in a clean Markdown table."

[Research Mode]
"Compare European Union AI Act transparency duties for synthetic media under Article 50 using primary official sources."`,
        },
      },
      {
        id: 'iteration-tips',
        heading: 'Iterating Instead of Restarting',
        bullets: [
          'Keep your first prompt concise about goal and format, then follow up with "Make step 3 more technical" or "Condense this into 5 bullets".',
          'When switching languages (English, Hindi, Hinglish), specify your preferred script explicitly if not using Auto detection.',
        ],
      },
    ],
  },
  {
    slug: 'understanding-generated-results',
    code: '27',
    sectionId: 'E',
    sectionTitle: 'Section E · User Guides',
    title: 'Understanding Generated Results',
    summary:
      'How to read citations, verify code outputs, interpret audio/image provenance, and handle partial or uncertain answers.',
    blocks: [
      {
        id: 'reading-results',
        heading: 'Evaluating Every Output Type',
        table: {
          headers: ['Result Type', 'What to Check Before Using'],
          rows: [
            ['Cited Research Answers', 'Click the source links in the Sources bar or Citation Drawer to confirm exact figures and dates on the original page.'],
            ['Generated Code', 'Inspect imports, TypeScript types, edge-case checks, and run builds/tests in your environment before deploying.'],
            ['Visual Canvas PNGs', 'Exported visuals contain machine-readable AI provenance attribution identifying AI origin.'],
            ['Science Hub Records', 'Verify UniProt IDs, PubChem CIDs, or PubMed PMIDs via the direct links; remember Science Hub is non-clinical.'],
            ['Uncertainty Notices', 'If OMNIA states that a live fact cannot be verified, do not assume a missing claim is true—rephrase or supply source text.'],
          ],
        },
      },
    ],
  },
  {
    slug: 'managing-user-settings',
    code: '28',
    sectionId: 'E',
    sectionTitle: 'Section E · User Guides',
    title: 'Managing Available User Settings',
    summary:
      'How to configure language, response style, stream speed, Dark/Light theme, cookie preferences, and account deletion.',
    blocks: [
      {
        id: 'settings-guide',
        heading: 'Configurable Preferences on /settings',
        steps: [
          'Open /settings from the Workspace user menu or press Cmd/Ctrl + , inside /ai.',
          'Under Omnia AI Preferences, choose Preferred Language (Auto, English, Hindi, Hinglish), Response Style (Concise, Detailed, Kinetic), and Stream Speed (Fast, Natural).',
          'Under Appearance, toggle between Dark Mode (Obsidian default) and Light Mode.',
          'Under Privacy & Data Control, use "Clear Local Cache" to remove browser-stored settings/threads or "Delete Account & Data" to purge account records immediately.',
        ],
      },
      {
        id: 'cookie-preferences',
        heading: 'Managing Cookie & Telemetry Toggles',
        paragraphs: [
          'You can change or withdraw optional Analytics, Functional, and Marketing storage preferences anytime via "Manage Cookie Preferences" in the site footer or on the Cookie Policy page (/cookie-policy).',
        ],
      },
    ],
  },
  {
    slug: 'common-workflow-examples',
    code: '29',
    sectionId: 'E',
    sectionTitle: 'Section E · User Guides',
    title: 'Common Workflow Examples',
    summary:
      'Three end-to-end creative workflows showing how multiple VIZRA features work together cleanly.',
    diagramId: 'creative-workflow',
    blocks: [
      {
        id: 'workflow-1',
        heading: 'Example 1 · Product Launch Film Concept',
        steps: [
          'Initialize a 10-stage project in /ai or /workspace titled "Studio Hardware Launch" and set Goal, Target Audience, and Obsidian Tone in Project Memory.',
          'Switch to Research mode to gather verified competitor benchmarks with primary source links.',
          'Switch to Create mode and use Creation Tools ("Image Crafter") to lock aspect ratio (16:9) and visual framing prompts.',
          'Open AI Music Studio to generate a 30-second ambient soundtrack clip and download the WAV file.',
          'Export the complete 10-stage brief as Markdown or JSON for production review.',
        ],
      },
      {
        id: 'workflow-2',
        heading: 'Example 2 · Spreadsheet & Document Synthesis',
        steps: [
          'Switch to Analyze mode in /ai and attach your local CSV report and supporting PDF specification (under 10 MB each).',
          'Ask OMNIA to summarize anomalies, cross-check metrics against the PDF goals, and produce an executive 5-bullet brief.',
          'Switch to History (/history) afterward to search, rename, or export the conversation as JSON.',
        ],
      },
      {
        id: 'workflow-3',
        heading: 'Example 3 · Interactive Web Prototype & Shader',
        steps: [
          'Open Creation Tools -> Kinetic Curves to dial in an easing curve, then switch to Code mode.',
          'Ask OMNIA for a TypeScript + React component pairing your easing curve with responsive Tailwind layout rules.',
          'Copy the generated code block cleanly into your local IDE for verification and testing.',
        ],
      },
    ],
  },

  // =========================================================================
  // SECTION F — SECURITY, PRIVACY AND TRUST (30–36)
  // =========================================================================
  {
    slug: 'security-overview',
    code: '30',
    sectionId: 'F',
    sectionTitle: 'Section F · Security, Privacy & Trust',
    title: 'Security Overview',
    summary:
      'How VIZRA protects user accounts, prompts, diagnostic boundaries, and session integrity without compromising privacy.',
    diagramId: 'responsible-grounding',
    blocks: [
      {
        id: 'platform-protections',
        heading: 'Public Security Architecture Principles',
        bullets: [
          'Server-Mediated AI Processing: AI requests travel over encrypted HTTPS through VIZRA’s backend services rather than embedding provider credentials inside your browser.',
          'Owner-Isolated Account Storage: When signed in with Google or email, workspace project records are isolated strictly to your authenticated user identity.',
          'Automated Input & Rate Protections: Sliding-window rate limiting, maximum prompt length bounds, attachment size checks, and input/output safety filters keep sessions stable and protected against abuse.',
          'Network Inspection Hardening: URL validation blocks private local network ranges, loopback addresses, and cloud metadata routes.',
          'Privacy-Preserving Security Alerts: Verified account sign-ins trigger security alerts using masked network information rather than exposing raw full IP addresses in logs.',
        ],
      },
    ],
    relatedLinks: [
      { label: 'Privacy Policy', to: '/privacy-policy' },
      { label: 'Account Safety Tips', to: '/docs?doc=account-safety' },
    ],
  },
  {
    slug: 'privacy-overview',
    code: '31',
    sectionId: 'F',
    sectionTitle: 'Section F · Security, Privacy & Trust',
    title: 'Privacy Overview',
    summary:
      'Clear summary of what data VIZRA collects, why it is needed, and how consent works.',
    blocks: [
      {
        id: 'data-minimization',
        heading: 'Data Minimization in Practice',
        paragraphs: [
          'VIZRA collects only what is strictly necessary to run the creative studio and honor your preferences. Optional analytics, functional, and marketing storage categories start turned OFF until you explicitly opt in, and VIZRA never sells personal data to third-party brokers or advertisers.',
        ],
      },
      {
        id: 'what-is-stored',
        heading: 'Key Data Categories (Verified in Privacy Policy)',
        bullets: [
          'Optional Sign-In Profile: Firebase identity UID, display name, email, and avatar when you choose to sign in.',
          'Prompts, Attachments & Projects: Texts and files you submit for synthesis, plus 10-stage projects you create.',
          'Consent Records: Anonymous random consent identifier, selected category flags, action type, and policy version—stored without raw IP addresses or passwords.',
          'Cookieless Aggregate Web Metrics: Privacy-friendly aggregate pageview counts without cross-site tracking cookies.',
        ],
      },
    ],
    relatedLinks: [
      { label: 'Read Full Privacy Policy', to: '/privacy-policy' },
      { label: 'Read Cookie Policy', to: '/cookie-policy' },
    ],
  },
  {
    slug: 'responsible-ai-usage',
    code: '32',
    sectionId: 'F',
    sectionTitle: 'Section F · Security, Privacy & Trust',
    title: 'Responsible AI Usage',
    summary:
      'Safety filters, adult eligibility rules, non-clinical boundaries, AI provenance attribution, and ethical creation standards.',
    blocks: [
      {
        id: 'safeguards',
        heading: 'Built-In Responsible AI Commitments',
        bullets: [
          'Strict 18+ Adult Eligibility: VIZRA is currently operated exclusively for adults aged 18+, with safeguards blocking restricted real-time features for any minor-flagged session.',
          'Zero-Tolerance Harm Filtering: Prompts involving child exploitation, self-harm, severe illegal acts, cyberattacks, or non-consensual synthetic media are blocked.',
          'Non-Clinical Scientific Boundaries: Science Suite displays explicit educational-only disclaimers clarifying it is not medical advice.',
          'Provenance Metadata: Exported AI visuals and audio outputs carry machine-readable attribution aligned with modern synthetic content transparency standards.',
          'Transparent Uncertainty: OMNIA avoids pretending certainty or forging citations when sources are unavailable.',
        ],
      },
    ],
  },
  {
    slug: 'user-responsibilities',
    code: '33',
    sectionId: 'F',
    sectionTitle: 'Section F · Security, Privacy & Trust',
    title: 'User Responsibilities',
    summary:
      'What VIZRA expects from creators using the studio, uploading files, and publishing AI-assisted outputs.',
    blocks: [
      {
        id: 'creator-duties',
        heading: 'Your Responsibilities on the Platform',
        bullets: [
          'Age & Account Accuracy: Only access interactive workspace tools if you meet the 18+ eligibility requirement, and keep your login credentials confidential.',
          'Rights to Uploaded Material: Only upload images, PDFs, audio, or datasets that you have permission or rights to process.',
          'Verification Before Publication: Independently verify factual claims, legal references, mathematical calculations, and software code generated by OMNIA before relying on them in production.',
          'No Abuse or Probing: Do not attempt to bypass rate limits, automate scraping against service limits, forge session tokens, or probe internal endpoints.',
          'Copyright & Authorship Care: Document human creative arrangement and editing if seeking copyright protection for creative works containing AI-assisted outputs.',
        ],
      },
    ],
    relatedLinks: [
      { label: 'Read Terms & Conditions', to: '/terms-and-conditions' },
    ],
  },
  {
    slug: 'data-protection-information',
    code: '34',
    sectionId: 'F',
    sectionTitle: 'Section F · Security, Privacy & Trust',
    title: 'Data Protection Information',
    summary:
      'Where your data lives (browser vs. cloud), personal memory scrubbing, and how to export or erase your records.',
    blocks: [
      {
        id: 'where-data-lives',
        heading: 'Browser Local Storage vs. Cloud Persistence',
        table: {
          headers: ['Data Type', 'Guest Session', 'Signed-In Account'],
          rows: [
            ['Conversations (/history)', 'Stored locally in your browser', 'Synced with owner-isolated cloud storage when active'],
            ['10-Stage Projects', 'Stored locally in your browser', 'Synced to owner-isolated cloud documents'],
            ['Personal Memories', 'Scoped to current session & scrubbed for sensitive PII patterns', 'UID-scoped & scrubbed before prompt assembly'],
            ['Cookie Preferences', 'Stored locally + anonymous consent audit event', 'Same (contains zero PII)'],
          ],
        },
      },
      {
        id: 'your-rights',
        heading: 'Self-Service Access, Export & Erasure',
        steps: [
          'Export saved chats anytime from /history as JSON or directly from chat as Markdown.',
          'Withdraw optional browser cookies anytime via "Manage Cookie Preferences" in the footer or on /cookie-policy.',
          'Delete local cache or permanently erase server-side account ledgers, contact records, and local threads using "Delete Account & Data" on /settings.',
          'Submit formal privacy, GDPR, CCPA/CPRA, DPDP, or DMCA inquiries via the Contact page (/contact).',
        ],
      },
    ],
  },
  {
    slug: 'account-safety',
    code: '35',
    sectionId: 'F',
    sectionTitle: 'Section F · Security, Privacy & Trust',
    title: 'Account Safety',
    summary:
      'Best practices for protecting your Google/VIZRA sign-in, recognizing login security alerts, and avoiding sensitive pastes.',
    blocks: [
      {
        id: 'account-tips',
        heading: 'Keeping Your Workspace Account Safe',
        bullets: [
          'Protect Your Identity Provider: Use strong two-factor authentication (2FA) on the Google or email account used to sign in to VIZRA.',
          'Avoid Pasting Secrets in Prompts: Never paste production passwords, bank card numbers, private API keys, or confidential government IDs into chat prompts or notes.',
          'Sign Out on Shared Devices: Always use the User Menu to sign out—and clear browser history if using a public or shared computer.',
          'Manage Workspace Tokens Carefully: If you generate scoped workspace tokens inside /workspace, revoke unused keys immediately rather than sharing them publicly.',
        ],
      },
    ],
  },
  {
    slug: 'reporting-a-problem',
    code: '36',
    sectionId: 'F',
    sectionTitle: 'Section F · Security, Privacy & Trust',
    title: 'Reporting a Problem',
    summary:
      'How to report software bugs, safety concerns, copyright takedown notices (DMCA), or privacy requests through verified channels.',
    blocks: [
      {
        id: 'how-to-report',
        heading: 'Official Reporting Channel',
        paragraphs: [
          'All bug reports, technical support issues, safety concerns, privacy/data inquiries, and copyright/DMCA takedown notices are handled through the validated inquiry form on our Contact page (/contact).',
        ],
        steps: [
          'Visit /contact in the main navigation bar or footer.',
          'Choose the matching Inquiry Category ("Technical Support", "Studio & Team", "Partnership", or "Press & Media").',
          'Describe the page route, browser/device, steps to reproduce (or exact URL and copyright details for DMCA notices), and submit.',
        ],
        callout: {
          variant: 'info',
          title: 'Published Response Targets',
          body: 'Studio & Pro inquiries target a response under 4 hours, and general support inquiries target under 24 hours.',
        },
      },
    ],
    relatedLinks: [
      { label: 'Go to Contact & Support Form', to: '/contact' },
      { label: 'Privacy Policy', to: '/privacy-policy' },
    ],
  },

  // =========================================================================
  // SECTION G — TROUBLESHOOTING (37–43)
  // =========================================================================
  {
    slug: 'troubleshooting-ai-responses',
    code: '37',
    sectionId: 'G',
    sectionTitle: 'Section G · Troubleshooting',
    title: 'AI Response Issues',
    summary:
      'Fixing incomplete streams, blocked outputs, off-topic replies, or missing citations in Omnia 1.0.',
    blocks: [
      {
        id: 'response-troubleshooting',
        heading: 'Common Symptoms & Fixes',
        table: {
          headers: ['Issue', 'Likely Cause', 'Recommended Fix'],
          rows: [
            ['Response stops mid-sentence', 'Network hiccup or very long combined prompt + attachment output', 'Click "Continue writing cleanly from where you stopped" or split the task into smaller stages'],
            ['Safety notice / request blocked', 'Prompt or file matched safety policy thresholds', 'Rephrase clearly around benign educational/creative intent or remove restricted elements'],
            ['No web citations shown', 'Using Quick/Create mode instead of Research mode', 'Switch Mode selector to "Research" before asking factual queries'],
            ['Reply repeats old project theme', 'Asking a general question inside an active project thread', 'Click "+ New chat" to start a fresh, isolated general conversation'],
            ['Rate limit warning', 'Too many rapid consecutive requests', 'Wait briefly before retrying; consider upgrading tier preview for higher concurrency needs'],
          ],
        },
      },
    ],
  },
  {
    slug: 'troubleshooting-feature-availability',
    code: '38',
    sectionId: 'G',
    sectionTitle: 'Section G · Troubleshooting',
    title: 'Feature Availability Issues',
    summary:
      'Why specific tools appear disabled, gated behind sign-in, or labeled In Staging / Coming Soon.',
    blocks: [
      {
        id: 'availability-reasons',
        heading: 'Understanding Disabled or Gated Controls',
        bullets: [
          'Live Voice Says Sign-In Required: Live Voice (/ai) requires an authenticated 18+ account. Sign in first using the header menu and allow microphone access.',
          'Cloud Connectors Show "OAuth Pending": Google Drive, Docs, Sheets, GitHub, Figma, Canva, Notion, YouTube, and Dropbox connectors are currently UNAVAILABLE (in staging pending external provider approvals). Export files locally and attach them instead.',
          'Video Generation Says "Coming Soon": Temporal Video Synthesis is in staged R&D. Use Write, Image Crafter, and Audio Studio for pre-visualization assets today.',
          'Plan Selection Shows Preview Only: Paid commercial billing checkout is not active yet—selecting Pro or Studio configures a tier preference without charging a card.',
        ],
      },
    ],
  },
  {
    slug: 'troubleshooting-loading',
    code: '39',
    sectionId: 'G',
    sectionTitle: 'Section G · Troubleshooting',
    title: 'Loading Problems',
    summary:
      'Resolving blank views, slow workspace initialization, stalled uploads, or stale cached assets.',
    blocks: [
      {
        id: 'loading-steps',
        heading: 'Step-by-Step Loading Recovery',
        steps: [
          'Check your internet connection stability and confirm browser JavaScript is enabled.',
          'Perform a hard reload (Cmd/Ctrl + Shift + R) to fetch fresh frontend bundles.',
          'If a file attachment fails to upload, verify it is 10 MB or under and is a supported format (binary video files are rejected in chat).',
          'If old workspace state appears stuck, open /settings and use "Clear Local Cache" (export any important chats on /history first!).',
          'Temporarily disable aggressive ad/script blockers for VIZRA if essential UI scripts or sign-in popups are being blocked.',
        ],
      },
    ],
  },
  {
    slug: 'troubleshooting-browser-compatibility',
    code: '40',
    sectionId: 'G',
    sectionTitle: 'Section G · Troubleshooting',
    title: 'Browser Compatibility',
    summary:
      'Handling WebGL 3D canvas hiccups, Web Speech dictation limits, Audio playback blocks, and private browsing storage.',
    blocks: [
      {
        id: 'browser-quirks',
        heading: 'Resolving Browser-Specific Behavior',
        bullets: [
          '3D Showcase (/explore) Feels Sluggish: Ensure browser hardware acceleration is turned on and WebGL is enabled in your browser settings.',
          'Prompt Microphone Dictation Unsupported: Web Speech dictation depends on your browser’s built-in SpeechRecognition API (widely available in Chromium browsers; limited in some browsers). Type prompts or use authenticated Live Voice Mode instead.',
          'Generated Music Track Doesn’t Auto-Play: Modern browsers block unmuted autoplay until user interaction—click "Play Track" in the Soundtrack Outputs panel.',
          'Guest Threads Missing After Restart: Strict Private/Incognito windows or "clear cookies on exit" rules erase browser local storage. Sign in to preserve projects in cloud sync.',
        ],
      },
    ],
  },
  {
    slug: 'troubleshooting-account',
    code: '41',
    sectionId: 'G',
    sectionTitle: 'Section G · Troubleshooting',
    title: 'Account-Related Issues',
    summary:
      'Troubleshooting sign-in popups, missing cross-device projects, and data deletion requests.',
    blocks: [
      {
        id: 'account-fixes',
        heading: 'Sign-In & Account Synchronization Checklist',
        bullets: [
          'Sign-In Popup Blocked: Allow popups for VIZRA in your browser address bar when signing in with Google.',
          'Projects Created Before Sign-In: Projects created while signed out stay on that local browser until loaded while signed in.',
          'Missing Conversations on Another Computer: Thread history is stored locally unless synced with an authenticated session; export important threads via JSON on /history.',
          'Deleting Account Records: Visit /settings and click "Delete Account & Data" to remove server-side account data and local storage immediately.',
        ],
      },
    ],
  },
  {
    slug: 'faq',
    code: '42',
    sectionId: 'G',
    sectionTitle: 'Section G · Troubleshooting',
    title: 'Frequently Asked Questions',
    summary:
      'Direct answers to the most common questions about VIZRA, OMNIA, pricing, file limits, privacy, and staged features.',
    blocks: [
      {
        id: 'faq-general',
        heading: 'Platform & Feature Questions',
        table: {
          headers: ['Question', 'Verified Answer'],
          rows: [
            ['Is VIZRA free to start?', 'Yes. Creator Free costs $0 and includes Quick, Think, Research, Create, Code, and Analyze tools, up to 3 active 10-stage projects, and 10 MB file ingestion.'],
            ['Do I need an account to try OMNIA?', 'No for basic chat, tools, and local projects in your browser. Yes for Live Voice Mode and cross-device cloud project sync.'],
            ['Can anyone under 18 use VIZRA?', 'No. VIZRA currently operates strictly as an 18+ adult creative studio.'],
            ['Are Google Drive, GitHub, and Figma live?', 'Not yet—cloud workspace connectors are visibly marked In Staging / External OAuth Approval Required. Upload exported local files instead.'],
            ['Can VIZRA generate finished MP4 videos right now?', 'Not yet. Temporal Video Synthesis is marked Coming Soon; you can write scripts, camera plans, and soundtracks today.'],
            ['Is there a public developer REST API for external apps?', 'No external public API is currently offered. Visit /docs?doc=public-api-status or /contact for team inquiries.'],
            ['How do I delete my data?', 'Go to /settings and use "Clear Local Cache" or "Delete Account & Data", or use /contact for formal privacy requests.'],
          ],
        },
      },
    ],
  },
  {
    slug: 'contact-support-guidance',
    code: '43',
    sectionId: 'G',
    sectionTitle: 'Section G · Troubleshooting',
    title: 'Contact and Support Guidance',
    summary:
      'What details to include when reaching out through /contact so the team can help quickly.',
    blocks: [
      {
        id: 'preparing-request',
        heading: 'How to Get the Fastest Support Response',
        steps: [
          'Include the exact page where the issue occurred (for example: /ai, /workspace, /tools, or /settings).',
          'Mention whether you were in a Guest session or Signed-In account (without sharing any passwords or tokens).',
          'Share your browser name, device type (desktop or mobile), and the exact wording of any error message shown.',
          'Submit your inquiry via /contact under the matching category ("Technical Support" or "Studio & Team").',
        ],
      },
    ],
    relatedLinks: [
      { label: 'Open Contact Page', to: '/contact' },
    ],
  },

  // =========================================================================
  // SECTION H — TECHNICAL INFORMATION FOR PUBLIC USERS (44–50)
  // =========================================================================
  {
    slug: 'platform-compatibility',
    code: '44',
    sectionId: 'H',
    sectionTitle: 'Section H · Technical Information',
    title: 'Platform Compatibility',
    summary:
      'Supported operating systems, desktop/mobile form factors, network expectations, and web-first delivery.',
    blocks: [
      {
        id: 'web-first',
        heading: 'Web-Based Delivery Across Operating Systems',
        paragraphs: [
          'VIZRA runs directly in modern web browsers across Windows, macOS, Linux, ChromeOS, iOS, and Android without requiring native desktop installers.',
        ],
        table: {
          headers: ['Environment', 'Compatibility Status', 'Notes'],
          rows: [
            ['Desktop (Windows / macOS / Linux)', 'Full Experience', 'Optimal for Project Workspace, Code mode, Knowledge Base, and 3D Showcase'],
            ['Tablets (iPadOS / Android)', 'Supported', 'Responsive drawers; landscape orientation recommended for split project views'],
            ['Mobile Phones (iOS / Android)', 'Supported', 'Optimized for reading docs, quick Omnia prompts, history review, and audio playback'],
            ['Desktop Native Installer', 'Unavailable', 'Web application only; access via HTTPS in browser'],
          ],
        },
      },
    ],
  },
  {
    slug: 'browser-requirements',
    code: '45',
    sectionId: 'H',
    sectionTitle: 'Section H · Technical Information',
    title: 'Browser Requirements',
    summary:
      'Required browser APIs (JavaScript, HTTPS, Local Storage, WebGL, Web Audio) for every VIZRA capability.',
    blocks: [
      {
        id: 'api-requirements',
        heading: 'Browser Capabilities Needed',
        table: {
          headers: ['Browser Feature', 'Required For', 'If Disabled'],
          rows: [
            ['Modern JavaScript (ES Modules)', 'Entire VIZRA application', 'Interactive workspace tools cannot render'],
            ['Browser Local Storage / IndexedDB', 'Theme persistence, local threads, cookie consent, signed-in sessions', 'Guest history & preferences reset on reload'],
            ['WebGL 2 / Hardware Acceleration', '3D Explore Showcase (/explore) and interactive previews', '3D scenes may fall back or render slowly'],
            ['Web Audio API & Mic Permission', 'AI Music playback and authenticated Live Voice Mode', 'Audio synthesis playback or voice capture fails'],
            ['Web Speech API (SpeechRecognition)', 'Optional mic dictation button inside Prompt Composer', 'Shows notice suggesting typing or Live Voice'],
          ],
        },
      },
    ],
  },
  {
    slug: 'ai-service-availability',
    code: '46',
    sectionId: 'H',
    sectionTitle: 'Section H · Technical Information',
    title: 'AI Service Availability',
    summary:
      'Transparent public availability overview across all VIZRA features, quotas, and operating status.',
    blocks: [
      {
        id: 'availability-matrix',
        heading: 'Current Availability Summary',
        table: {
          headers: ['Feature / Capability', 'Public Status', 'Key Condition or Limit'],
          rows: [
            ['Omnia 1.0 Chat & 7 Modes', 'AVAILABLE', '18+ adult studio eligibility; sliding-window rate limits'],
            ['Grounded Web Research Citations', 'AVAILABLE', 'Depends on accessible public web sources'],
            ['Writing, Design, Code & Presentations', 'AVAILABLE', 'Outputs copyable Markdown, code & CSS tokens'],
            ['Visual & Procedural Canvas Synthesis', 'AVAILABLE', 'Rate-limited; exported PNGs embed provenance'],
            ['AI Music Studio (Clips & Full Tracks)', 'AVAILABLE', '5–120s instrumental WAV audio'],
            ['Science Hub (AlphaFold/PubChem/PubMed)', 'AVAILABLE', 'Educational/scientific reference only (non-clinical)'],
            ['Multimodal Local File Upload', 'LIMITED', 'Up to 10 MB per file / 5 files per turn; no chat video ingestion'],
            ['10-Stage Projects & Cloud Sync', 'LIMITED', 'Creator Free max 3 active projects; cross-device sync needs sign-in'],
            ['Knowledge Base Explorer', 'LIMITED', 'Local browser session index; max 25 MB upload'],
            ['Omnia Live Voice Mode', 'LIMITED', 'Requires authenticated 18+ account & microphone'],
            ['Paid Billing Checkout', 'LIMITED', 'Preview tier selection only; no live card billing yet'],
            ['Third-Party Cloud Connectors', 'UNAVAILABLE', 'In staging; requires external OAuth approvals'],
            ['Public External REST API', 'UNAVAILABLE', 'No third-party public API currently offered'],
            ['Temporal Video & Scene Synthesis', 'COMING SOON', 'In staged development; no fixed launch date'],
          ],
        },
      },
    ],
  },
  {
    slug: 'third-party-dependencies',
    code: '47',
    sectionId: 'H',
    sectionTitle: 'Section H · Technical Information',
    title: 'Third-Party Service Dependencies',
    summary:
      'Verified external infrastructure and public data providers disclosed in VIZRA’s Privacy Policy.',
    blocks: [
      {
        id: 'subprocessors-list',
        heading: 'Verified External Service Providers',
        paragraphs: [
          'As disclosed in Section 5 of our Privacy Policy, VIZRA relies on vetted infrastructure and scientific data services strictly to deliver core capabilities:',
        ],
        bullets: [
          'Google Cloud & Firebase: Account sign-in authentication and owner-isolated cloud workspace storage.',
          'Google AI Services: Multimodal language, vision, speech, audio, and live search grounding.',
          'Vercel: Web application hosting, edge delivery, cookieless aggregate analytics, and optional opt-in speed telemetry.',
          'Google Fonts: Typography delivery for interface readability.',
          'EMBL-EBI AlphaFold DB & NCBI (PubChem / PubMed): Queried on demand only when you run lookups inside the Science Hub.',
        ],
      },
      {
        id: 'pending-connectors-note',
        heading: 'Staged Connectors Not Yet Active',
        paragraphs: [
          'External creative platforms listed as "In Staging" (such as Google Drive, Docs, Sheets, GitHub, Figma, Canva, Notion, YouTube, and Dropbox) do not connect to user accounts in the current public release.',
        ],
      },
    ],
    relatedLinks: [
      { label: 'Full Privacy Policy Disclosures', to: '/privacy-policy' },
    ],
  },
  {
    slug: 'public-api-status',
    code: '48',
    sectionId: 'H',
    sectionTitle: 'Section H · Technical Information',
    title: 'Public API Information',
    status: 'UNAVAILABLE',
    statusNote: 'No officially supported external public developer API is currently published.',
    summary:
      'Transparent status on programmatic access: VIZRA currently operates as an interactive web studio without a public third-party API.',
    blocks: [
      {
        id: 'public-api-truth',
        heading: 'Current Public API Status: UNAVAILABLE',
        paragraphs: [
          'VIZRA does not currently offer an officially supported public REST API, SDK, or external developer webhook platform for third-party applications.',
          'All interactive AI capabilities, research tools, and 10-stage project workflows are designed for direct use inside the VIZRA web interface (/ai and /workspace). Note that workspace token controls inside /workspace are scoped solely for authorized interactive studio session governance—not for external public API consumption.',
        ],
        callout: {
          variant: 'limitation',
          title: 'Do Not Rely on Undocumented Web Endpoints',
          body: 'Internal browser-to-server application requests are not public APIs, carry no external stability guarantees, and reject unauthorized third-party requests.',
        },
      },
      {
        id: 'studio-inquiries',
        heading: 'Interested in Future API or Studio Integrations?',
        paragraphs: [
          'Teams or partners exploring dedicated studio integrations or future API availability can submit an inquiry through the Contact page (/contact).',
        ],
      },
    ],
    relatedLinks: [
      { label: 'Contact Studio Team', to: '/contact' },
      { label: 'Workspace Dashboard', to: '/workspace' },
    ],
  },
  {
    slug: 'known-limitations',
    code: '49',
    sectionId: 'H',
    sectionTitle: 'Section H · Technical Information',
    title: 'Known Limitations',
    summary:
      'An honest, consolidated summary of active system boundaries, quota caps, and unfinished capabilities.',
    blocks: [
      {
        id: 'limitations-list',
        heading: 'Current Verified Boundaries',
        bullets: [
          'Prompt & Attachment Caps: Prompts enforce maximum length limits (up to 50,000 characters on server requests), and chat file attachments are capped at 10 MB per file / up to 5 attachments per turn.',
          'No Video File Analysis in Chat: Binary video uploads cannot be inspected inside chat attachments; attach still image frames, audio, or text transcripts instead.',
          'Live Voice Authentication & Age Rules: Unavailable to signed-out guests or under-18 flagged sessions.',
          'Anonymous Browser Persistence: Signed-out users’ threads and 10-stage projects live only in the active browser and are lost if browser site data is wiped.',
          'Staged Features Remain Inactive: Cloud workspace OAuth connectors (Drive, GitHub, Figma, Notion, etc.), Temporal Video generation, commercial credit card checkout, and a public external API are not live.',
          'Probabilistic AI Output: Even grounded citations require creator review; VIZRA never provides medical, legal, or financial advice.',
        ],
      },
    ],
  },
  {
    slug: 'documentation-version-history',
    code: '50',
    sectionId: 'H',
    sectionTitle: 'Section H · Technical Information',
    title: 'Documentation Version History',
    summary:
      'Track updates, coverage expansions, and accuracy reviews for the VIZRA Public Documentation Centre.',
    blocks: [
      {
        id: 'changelog',
        heading: 'Published Revisions',
        table: {
          headers: ['Version', 'Date', 'Summary of Changes'],
          rows: [
            [
              'v2.0.0',
              'November 17, 2026',
              'Expanded /docs into a complete A–Z Public Documentation Centre covering Sections A–H (Topics 01–50 plus dedicated Feature & Tool guides C1–C17), added 6 conceptual SVG diagrams, audited all availability labels (AVAILABLE / LIMITED / UNAVAILABLE / COMING SOON), and removed internal engineering/private details.',
            ],
            [
              'v1.0.0',
              'November 2026',
              'Initial 5-module reference overview launched alongside the multi-page VIZRA web architecture.',
            ],
          ],
        },
      },
      {
        id: 'maintenance-note',
        heading: 'How Documentation Stays Accurate',
        paragraphs: [
          'Every status indicator in this Documentation Centre reflects verified features currently running in VIZRA. Staged capabilities remain clearly marked UNAVAILABLE or COMING SOON until live for public users.',
        ],
      },
    ],
  },
];
