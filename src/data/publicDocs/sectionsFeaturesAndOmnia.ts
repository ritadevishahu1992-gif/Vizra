import { DocArticle } from './types';

export const FEATURES_AND_OMNIA_DOCS: DocArticle[] = [
  // =========================================================================
  // SECTION C — FEATURES AND TOOLS DOCUMENTATION
  // =========================================================================
  {
    slug: 'feature-omnia-chat',
    code: 'C1',
    sectionId: 'C',
    sectionTitle: 'Section C · Features & Tools',
    title: 'Omnia 1.0 Conversational Workspace & 7 Modes',
    status: 'AVAILABLE',
    statusNote: 'Live for 18+ users in /ai with Quick, Think, Research, Science, Create, Code, and Analyze modes.',
    summary:
      'Real-time streaming AI workspace supporting English, Hindi, and Hinglish across 7 specialized modes.',
    diagramId: 'omnia-interaction',
    blocks: [
      {
        id: 'purpose',
        heading: 'Purpose & What It Does',
        paragraphs: [
          'Omnia 1.0 Conversational Workspace is the primary interactive chat environment in VIZRA. It streams answers in real time, adapts detail proportionally to your question, supports multi-language replies (English, Hindi, and Hinglish), and lets you switch between Quick, Think, Research, Science, Create, Code, and Analyze modes.',
        ],
      },
      {
        id: 'access-and-steps',
        heading: 'How to Access & Step-by-Step Usage',
        steps: [
          'Click "Launch Omnia" in the top navbar or navigate to /ai.',
          'Click the Mode selector pill in the prompt box to choose one of the 7 capability modes.',
          'Type your message (or press "/" to focus the box) and press Enter to submit.',
          'Use "Stop Generation" (or press Esc) anytime if you want to halt a long response early.',
          'Copy responses, regenerate, or export your chat thread using the message and thread action controls.',
        ],
      },
      {
        id: 'inputs-outputs',
        heading: 'Supported Inputs & Expected Outputs',
        table: {
          headers: ['Aspect', 'Verified Behavior'],
          rows: [
            ['Supported Inputs', 'Text prompts in English, Hindi, or Hinglish; up to 5 local file attachments; optional spoken dictation on supported browsers'],
            ['Expected Outputs', 'Streaming Markdown text, formatted code blocks, structured tables, grounded web citations (in Research mode), and downloadable Markdown transcripts'],
          ],
        },
      },
      {
        id: 'limits-errors-troubleshooting',
        heading: 'Limitations, Common Errors & Troubleshooting',
        bullets: [
          'Important Limitations: Sliding-window rate limits apply based on tier; very large prompts or oversized attachments are rejected before processing. Must meet 18+ studio eligibility.',
          'Common Errors: "Empty prompt", "Rate limit reached — please wait before sending again", or blocked response notices when safety filters trigger.',
          'Troubleshooting: If a reply stalls mid-stream, stop generation, shorten attached files, or start a fresh chat thread using "+ New chat".',
        ],
      },
    ],
  },
  {
    slug: 'feature-grounded-research',
    code: 'C2',
    sectionId: 'C',
    sectionTitle: 'Section C · Features & Tools',
    title: 'Grounded Web Research & Verified Citations',
    status: 'AVAILABLE',
    statusNote: 'Live in Research mode inside /ai and launchable directly from /tools.',
    summary:
      'Real-time web search grounding that attaches clickable, verified primary sources and avoids fabricated URLs.',
    diagramId: 'responsible-grounding',
    blocks: [
      {
        id: 'purpose',
        heading: 'Purpose & What It Does',
        paragraphs: [
          'When working on current facts, technical standards, product specs, or market research, standard language memory can become outdated. Grounded Web Research queries live search sources and displays verified links in a dedicated sources strip and citation drawer.',
        ],
      },
      {
        id: 'access-and-steps',
        heading: 'How to Access & Step-by-Step Usage',
        steps: [
          'Open /ai and switch the Mode selector to "Research" (or launch "Grounded Live Web Research" from /tools).',
          'Ask a factual, verifiable question with clear scope, dates, or entities.',
          'Review the generated synthesis along with the Sources bar displayed beneath the message.',
          'Click any citation pill or open the Citation Drawer to inspect the full external HTTPS link.',
        ],
      },
      {
        id: 'inputs-outputs',
        heading: 'Supported Inputs & Expected Outputs',
        bullets: [
          'Supported Inputs: Fact-based natural-language research questions, comparisons, or topic verification queries.',
          'Expected Outputs: Synthesized findings accompanied by verified HTTPS citations—or an explicit uncertainty notice if live verification cannot confirm a claim.',
        ],
      },
      {
        id: 'limits-errors-troubleshooting',
        heading: 'Limitations, Common Errors & Troubleshooting',
        bullets: [
          'Important Limitations: Search grounding is only active when live search returns accessible public web sources; paywalled or private intranet pages cannot be retrieved.',
          'Common Errors: "No verified web sources matched" or broad multi-question prompts returning sparse links.',
          'Troubleshooting: Narrow your query to specific terms or organizations and confirm Research mode is active before sending.',
        ],
      },
    ],
  },
  {
    slug: 'feature-writing-presentations',
    code: 'C3',
    sectionId: 'C',
    sectionTitle: 'Section C · Features & Tools',
    title: 'Editorial, Scriptwriting & Presentation Builder',
    status: 'AVAILABLE',
    statusNote: 'Live in Create Hub ("WRITE" and "PRESENTATION") and /tools.',
    summary:
      'Generate cinematic scripts, product briefs, documentation drafts, and slide deck outlines with speaker notes.',
    blocks: [
      {
        id: 'purpose',
        heading: 'Purpose & What It Does',
        paragraphs: [
          'Helps writers, directors, and product teams move quickly from blank page to structured scripts, narrative treatments, editorial copy, and slide-by-slide presentation outlines.',
        ],
      },
      {
        id: 'access-and-steps',
        heading: 'How to Access & Step-by-Step Usage',
        steps: [
          'Open /tools and choose "Editorial & Script Writing" or "Executive Presentation Builder" (or open Create Hub inside /ai).',
          'State your audience, runtime or slide count, tone, and key points to cover.',
          'Refine pacing, scene beats, or talking points conversationally and copy or export the final Markdown outline.',
        ],
      },
      {
        id: 'inputs-outputs',
        heading: 'Supported Inputs & Expected Outputs',
        bullets: [
          'Supported Inputs: Creative briefs, topic notes, audience descriptions, or uploaded reference PDFs/TXT briefs.',
          'Expected Outputs: Formatted scripts, Markdown copy, slide-by-slide outlines, and speaker talking points (note: VIZRA outputs editable text/Markdown outlines rather than downloadable .pptx binary slide files).',
        ],
      },
      {
        id: 'limits-errors-troubleshooting',
        heading: 'Limitations, Common Errors & Troubleshooting',
        bullets: [
          'Important Limitations: Does not export binary PowerPoint (.pptx) or Word (.docx) files directly—content exports cleanly as copyable Markdown text.',
          'Common Errors: Overly generic slide bullets when target audience and duration are omitted.',
          'Troubleshooting: Include exact constraints such as "6 slides, investor audience, technical tone, under 90 words per slide".',
        ],
      },
    ],
  },
  {
    slug: 'feature-design-systems',
    code: 'C4',
    sectionId: 'C',
    sectionTitle: 'Section C · Features & Tools',
    title: 'Design System Architect & Kinetic Curves',
    status: 'AVAILABLE',
    statusNote: 'Live in /tools, Create Hub ("DESIGN"), and Creation Tools ("Kinetic Curves").',
    summary:
      'Generate CSS design tokens, accessible dark/light color scales, typography hierarchies, and interactive 60fps cubic-bezier easing curves.',
    blocks: [
      {
        id: 'purpose',
        heading: 'Purpose & What It Does',
        paragraphs: [
          'Assists UI designers and frontend developers in planning color palettes, contrast hierarchies, typography scales, and custom cubic-bezier timing functions for smooth motion interfaces.',
        ],
      },
      {
        id: 'access-and-steps',
        heading: 'How to Access & Step-by-Step Usage',
        steps: [
          'Open /tools and launch "Design System & Token Architect", or click "Tools" in the Omnia composer and switch to "Kinetic Curves".',
          'For tokens: describe your brand palette, contrast goals, and target framework (e.g., CSS variables or Tailwind).',
          'For motion curves: adjust the interactive sliders (Attack P1 X and Overshoot P1 Y) to preview and copy the exact cubic-bezier(...) CSS rule.',
        ],
      },
      {
        id: 'inputs-outputs',
        heading: 'Supported Inputs & Expected Outputs',
        bullets: [
          'Supported Inputs: Brand mood descriptions, hex colors, accessibility targets, or numeric motion curve slider adjustments.',
          'Expected Outputs: CSS custom properties, JSON token specs, layout guidelines, and copyable cubic-bezier easing snippets.',
        ],
      },
      {
        id: 'limits-errors-troubleshooting',
        heading: 'Limitations, Common Errors & Troubleshooting',
        bullets: [
          'Important Limitations: Does not sync automatically to Figma or Canva cloud files while third-party connectors remain in staging.',
          'Common Errors: Low contrast ratios if custom hex pairings are forced without checking accessibility contrast.',
          'Troubleshooting: Ask OMNIA explicitly to verify WCAG AA contrast pairs when requesting color palettes.',
        ],
      },
    ],
  },
  {
    slug: 'feature-visual-synthesis',
    code: 'C5',
    sectionId: 'C',
    sectionTitle: 'Section C · Features & Tools',
    title: 'Visual & Procedural Canvas Synthesis',
    status: 'AVAILABLE',
    statusNote: 'Live in Image Crafter (/ai Creation Tools), /tools, and Workspace Asset Studio.',
    summary:
      'Compose structured visual prompts, preview generated artwork cards across aspect ratios, and export PNG files with embedded AI provenance.',
    blocks: [
      {
        id: 'purpose',
        heading: 'Purpose & What It Does',
        paragraphs: [
          'Combines a structured prompt builder (Subject & Geometry, Lighting & Material Treatment, and Aspect Ratio presets: 16:9, 9:16, 1:1, 21:9) with visual canvas generation and PNG export carrying machine-readable AI provenance metadata.',
        ],
      },
      {
        id: 'access-and-steps',
        heading: 'How to Access & Step-by-Step Usage',
        steps: [
          'In /ai, click "Tools" inside the prompt bar to open Creation Tools on the "Image Crafter" tab (or open the Visual tool on /tools or the Asset panel on /workspace).',
          'Enter your subject geometry, lighting style, and pick an aspect ratio (16:9, 9:16, 1:1, or 21:9).',
          'Copy the synthesized prompt, insert it into Omnia chat, or trigger image generation directly on the preview card.',
          'Save satisfying frames into your Workspace Asset Library or download as a PNG.',
        ],
      },
      {
        id: 'inputs-outputs',
        heading: 'Supported Inputs & Expected Outputs',
        bullets: [
          'Supported Inputs: Subject descriptions, lighting/style cues, and aspect ratio selections.',
          'Expected Outputs: Formatted prompt strings and PNG image frames with embedded AI provenance attribution.',
        ],
      },
      {
        id: 'limits-errors-troubleshooting',
        heading: 'Limitations, Common Errors & Troubleshooting',
        bullets: [
          'Important Limitations: High-demand rate limits apply; safety filters block prohibited or non-consensual synthetic imagery.',
          'Common Errors: "Generation failed or blocked by safety policy" or slow preview rendering on weak connections.',
          'Troubleshooting: Simplify overly contradictory style terms, avoid restricted subjects, and retry with a clear focal subject.',
        ],
      },
    ],
  },
  {
    slug: 'feature-code-workspace',
    code: 'C6',
    sectionId: 'C',
    sectionTitle: 'Section C · Features & Tools',
    title: 'React, TypeScript & Shader Code Workspace',
    status: 'AVAILABLE',
    statusNote: 'Live in Code mode (/ai), Create Hub ("CODE"), and Creation Tools.',
    summary:
      'Generate, refactor, and inspect React components, TypeScript modules, Tailwind layouts, and interactive WebGL/GLSL fragment shaders.',
    blocks: [
      {
        id: 'purpose',
        heading: 'Purpose & What It Does',
        paragraphs: [
          'Tailored for creative developers building interactive web interfaces, animations, and graphics shaders. Code mode focuses on clean syntax, balanced braces, modular structure, and readable explanation.',
        ],
      },
      {
        id: 'access-and-steps',
        heading: 'How to Access & Step-by-Step Usage',
        steps: [
          'Switch the Mode selector in /ai to "Code", or pick "CODE" from Create Hub / /tools.',
          'Specify your framework (React, TypeScript, Tailwind CSS, GLSL) and upload relevant source files if debugging existing code.',
          'Copy code blocks using the built-in copy button and verify behavior locally in your own project.',
        ],
      },
      {
        id: 'inputs-outputs',
        heading: 'Supported Inputs & Expected Outputs',
        bullets: [
          'Supported Inputs: Feature requirements, error stack traces, and uploaded .ts, .tsx, .js, .py, or .json files.',
          'Expected Outputs: Syntax-highlighted code blocks, architectural suggestions, and debugging explanations.',
        ],
      },
      {
        id: 'limits-errors-troubleshooting',
        heading: 'Limitations, Common Errors & Troubleshooting',
        bullets: [
          'Important Limitations: VIZRA does not execute arbitrary backend servers or deploy external apps directly from chat; always review, lint, and test generated code before shipping.',
          'Common Errors: Incomplete snippet if the prompt asks for an entire multi-file app in a single turn.',
          'Troubleshooting: Break large requests into module-by-module prompts or start a 10-stage technical project.',
        ],
      },
    ],
  },
  {
    slug: 'feature-file-ingestion',
    code: 'C7',
    sectionId: 'C',
    sectionTitle: 'Section C · Features & Tools',
    title: 'Multimodal File & Code Upload',
    status: 'LIMITED',
    statusNote: 'Live for local files up to 10 MB per file (up to 5 files per message). Video files cannot be analyzed in chat.',
    summary:
      'Attach local images, PDFs, CSV/TSV datasets, audio clips, Markdown, and code files directly into Omnia chat or Workspace Assets.',
    blocks: [
      {
        id: 'purpose',
        heading: 'Purpose & What It Does',
        paragraphs: [
          'Lets OMNIA read and reason over your own reference files—from summarizing PDFs and analyzing CSV spreadsheets to reviewing UI screenshots, audio clips, and source code.',
        ],
      },
      {
        id: 'access-and-steps',
        heading: 'How to Access & Step-by-Step Usage',
        steps: [
          'In /ai, click the "+" button at the bottom-left of the Prompt Composer (or visit /workspace under Multimodal Asset Ingestion).',
          'Drag and drop files into the upload zone or choose File / Image / Document.',
          'Wait for attachment preview chips to appear, write your question about the files, and send.',
        ],
      },
      {
        id: 'inputs-outputs',
        heading: 'Supported Inputs, Caps & Expected Outputs',
        table: {
          headers: ['Input Type', 'Supported Formats & Caps'],
          rows: [
            ['Images', 'PNG, JPG, WebP, SVG (max 10 MB per file in attachment menu)'],
            ['Documents & Data', 'PDF, TXT, MD, CSV, TSV, JSON (text & document parsing)'],
            ['Source Code', '.ts, .js, .py and plain-text source files'],
            ['Audio', 'Standard browser-readable audio files for inspection'],
            ['Video Files (Not Supported)', 'Binary video files are rejected in chat; upload still image frames, audio, or text transcripts instead'],
            ['Per-Turn Limits', 'Up to 5 attachments per request within total request payload size limits'],
          ],
        },
      },
      {
        id: 'limits-errors-troubleshooting',
        heading: 'Limitations, Common Errors & Troubleshooting',
        bullets: [
          'Important Limitations: Encrypted/password-protected PDFs or massive binary files over 10 MB cannot be ingested in chat. Video binary files are not analyzed.',
          'Common Errors: "File exceeds the 10MB limit" or notice explaining that video attachments are not supported yet.',
          'Troubleshooting: Compress images, split long PDFs into smaller chapters, or export spreadsheets as clean UTF-8 CSV.',
        ],
      },
    ],
  },
  {
    slug: 'feature-project-workflows',
    code: 'C8',
    sectionId: 'C',
    sectionTitle: 'Section C · Features & Tools',
    title: '10-Stage Project Workflows & Project Memory',
    status: 'LIMITED',
    statusNote: 'Live for all users; Creator Free includes up to 3 active projects. Cross-device cloud sync requires sign-in.',
    summary:
      'Turn ambitious ideas into structured 10-stage creative pipelines with editable stage briefs, persistent memory, tasks, notes, and exports.',
    diagramId: 'creative-workflow',
    blocks: [
      {
        id: 'purpose',
        heading: 'Purpose & What It Does',
        paragraphs: [
          'Provides structured continuity for multi-step creative or software builds. Each project organizes work across 10 production stages, holds editable Project Memory (Goal, Target Audience, Style & Tone, Requirements), tracks a checklist of Tasks, binds project documents, and saves freeform Notes.',
        ],
      },
      {
        id: 'access-and-steps',
        heading: 'How to Access & Step-by-Step Usage',
        steps: [
          'Click "+" next to Projects in the /ai left sidebar, use Create mode to request a new project, or click "New Project" on /workspace.',
          'Select any stage from Stage 01 to Stage 10 in the Project Workspace view to read, edit, copy, or mark its status (Not Started / In Progress / Completed).',
          'Open the "Project Memory" tab to lock in your goal, audience, and tone so future refinements stay consistent.',
          'Click "Refine this stage in Chat" to send any stage straight back to OMNIA for expansion, or click "Export Brief" / "Export JSON" to download your work.',
        ],
      },
      {
        id: 'inputs-outputs',
        heading: 'Supported Inputs & Expected Outputs',
        bullets: [
          'Supported Inputs: Project title, prompt brief, editable stage copy, memory fields, custom tasks, and notes.',
          'Expected Outputs: 10-stage milestone roadmap, downloadable Markdown (.md) full brief, and downloadable JSON specification.',
        ],
      },
      {
        id: 'limits-errors-troubleshooting',
        heading: 'Limitations, Common Errors & Troubleshooting',
        bullets: [
          'Important Limitations: Guest sessions store projects only in the current browser; clearing browser data deletes unsynced guest projects. Sign in to sync projects across devices.',
          'Common Errors: Missing project on a second device when created anonymously before signing in.',
          'Troubleshooting: Sign in with your account before building large projects, and periodically use "Export Brief" for an offline backup.',
        ],
      },
    ],
  },
  {
    slug: 'feature-music-studio',
    code: 'C9',
    sectionId: 'C',
    sectionTitle: 'Section C · Features & Tools',
    title: 'AI Music Studio',
    status: 'AVAILABLE',
    statusNote: 'Live inside /ai for generating custom clips (5–30s) and full tracks (up to 120s).',
    summary:
      'Generate custom background music, ambient loops, and soundtracks from text descriptions or an optional visual reference image.',
    blocks: [
      {
        id: 'purpose',
        heading: 'Purpose & What It Does',
        paragraphs: [
          'Creates instrumental soundtracks, ambient drones, lo-fi loops, and brand jingles tailored to your project mood. Includes one-click acoustic genre presets, a duration slider, an interactive waveform track player, WAV downloads, and a shortcut to send track metadata into chat.',
        ],
      },
      {
        id: 'access-and-steps',
        heading: 'How to Access & Step-by-Step Usage',
        steps: [
          'Click "AI Music" in the /ai header or "Music" in the Prompt Composer (also available inside the "+" Add menu).',
          'Select either Clip mode (5–30 seconds, ideal for jingles/loops) or Full Track mode (up to 120 seconds).',
          'Describe instruments, tempo, and mood—or click an Acoustic Preset—and optionally attach a visual inspiration image.',
          'Click "Generate AI Soundtrack", audition your track in the Soundtrack Outputs player, and download the WAV file.',
        ],
      },
      {
        id: 'inputs-outputs',
        heading: 'Supported Inputs & Expected Outputs',
        bullets: [
          'Supported Inputs: Text style description, duration (5–120s), preset genre selection, and an optional image file.',
          'Expected Outputs: Playable browser audio tracks and downloadable WAV audio files.',
        ],
      },
      {
        id: 'limits-errors-troubleshooting',
        heading: 'Limitations, Common Errors & Troubleshooting',
        bullets: [
          'Important Limitations: Audio generation consumes higher compute quotas than short text turns; age-safety protections apply.',
          'Common Errors: Audio playback blocked by browser autoplay rules or muted system volume.',
          'Troubleshooting: Click the Play Track button manually after generation if autoplay is blocked by your browser.',
        ],
      },
    ],
  },
  {
    slug: 'feature-live-voice',
    code: 'C10',
    sectionId: 'C',
    sectionTitle: 'Section C · Features & Tools',
    title: 'Omnia Live Voice Conversations',
    status: 'LIMITED',
    statusNote: 'Live for signed-in 18+ users only. Requires account authentication and browser microphone permission.',
    summary:
      'Real-time bidirectional voice conversation with OMNIA for hands-free brainstorming and creative direction.',
    blocks: [
      {
        id: 'purpose',
        heading: 'Purpose & What It Does',
        paragraphs: [
          'Lets you speak naturally with OMNIA and hear low-latency spoken replies in real time without typing prompts.',
        ],
      },
      {
        id: 'access-and-steps',
        heading: 'How to Access & Step-by-Step Usage',
        steps: [
          'Ensure you are signed in to an authenticated 18+ VIZRA account.',
          'Open /ai and click "Live Voice" in the top bar or "Live" inside the Prompt Composer.',
          'Allow microphone access when prompted by your browser.',
          'Wait for the status indicator to confirm connection, speak clearly, and click "End Session" when done.',
        ],
      },
      {
        id: 'inputs-outputs',
        heading: 'Supported Inputs & Expected Outputs',
        bullets: [
          'Supported Inputs: Live microphone speech (browser Web Audio stream).',
          'Expected Outputs: Real-time spoken AI voice playback.',
        ],
      },
      {
        id: 'limits-errors-troubleshooting',
        heading: 'Limitations, Common Errors & Troubleshooting',
        bullets: [
          'Important Limitations: Unavailable for guest/unauthenticated visitors and blocked for any session flagged under age-restriction policies. Requires stable network and working Web Audio API support.',
          'Common Errors: "Sign in required for Live Voice", "Microphone access denied", or "Session closed by safety/auth policy".',
          'Troubleshooting: Sign in first, verify your browser’s site microphone permission is set to Allow, and use headphones to prevent echo.',
        ],
      },
    ],
  },
  {
    slug: 'feature-science-hub',
    code: 'C11',
    sectionId: 'C',
    sectionTitle: 'Section C · Features & Tools',
    title: 'Science & Biomedical Research Hub',
    status: 'AVAILABLE',
    statusNote: 'Live in /ai ("Science" button). Educational & scientific reference only—not medical or clinical advice.',
    summary:
      'Query public AlphaFold protein structures, PubChem chemical compounds, and NCBI PubMed biomedical literature directly inside OMNIA.',
    blocks: [
      {
        id: 'purpose',
        heading: 'Purpose & What It Does',
        paragraphs: [
          'Connects creative researchers, students, and science writers with three public scientific databases: AlphaFold DB (3D protein predictions and .pdb/.cif links), PubChem (molecular formulas, SMILES, weights, 2D structure visuals), and NCBI PubMed (peer-reviewed article citations).',
        ],
        callout: {
          variant: 'warning',
          title: 'Non-Clinical Educational Notice',
          body: 'Science Hub results are strictly for educational and scientific reference. VIZRA does not provide medical diagnosis, clinical treatment advice, or healthcare recommendations.',
        },
      },
      {
        id: 'access-and-steps',
        heading: 'How to Access & Step-by-Step Usage',
        steps: [
          'Open /ai and click "Science" in the top header.',
          'Select one of the three tabs: Proteins & Structures, Chemistry & Compounds, or Biomedical Literature.',
          'Enter a UniProt ID/gene (e.g., P04637), compound name (e.g., aspirin), or PubMed research keyword—or click a Quick Preset.',
          'Inspect returned records or click "Ask Omnia to explain/synthesize in chat" to bring the reference straight into your conversation.',
        ],
      },
      {
        id: 'limits-errors-troubleshooting',
        heading: 'Limitations, Common Errors & Troubleshooting',
        bullets: [
          'Important Limitations: Queries external public scientific databases in real time; availability depends on EMBL-EBI and NCBI responsiveness.',
          'Common Errors: "No AlphaFold structure prediction found" when entering a colloquial phrase instead of a gene or UniProt ID.',
          'Troubleshooting: Try clicking one of the built-in Quick Presets first to verify formatting (e.g., P04637 for TP53).',
        ],
      },
    ],
  },
  {
    slug: 'feature-knowledge-base',
    code: 'C12',
    sectionId: 'C',
    sectionTitle: 'Section C · Features & Tools',
    title: 'Knowledge Base & Document Corpus Explorer',
    status: 'LIMITED',
    statusNote: 'Live inside /ai ("Knowledge Base"). Stores uploaded documents in browser session/vector index up to 25 MB per document.',
    summary:
      'Ingest structured reference files, inspect document sections, and test hybrid dense + keyword retrieval against your workspace corpus.',
    blocks: [
      {
        id: 'purpose',
        heading: 'Purpose & What It Does',
        paragraphs: [
          'Lets users organize reference manuals, specifications, and project notes into browsable knowledge tiers, upload TXT, Markdown, PDF, DOCX, CSV, or JSON files, and inspect how search queries match sections in real time.',
        ],
      },
      {
        id: 'access-and-steps',
        heading: 'How to Access & Step-by-Step Usage',
        steps: [
          'Click "Knowledge Base" in the /ai workspace top bar.',
          'Browse indexed documents in Document Corpus or switch to Ingestion Pipeline to upload or paste content.',
          'Use Retrieval Sandbox to test sample queries and tune dense vs. keyword weighting.',
        ],
      },
      {
        id: 'limits-errors-troubleshooting',
        heading: 'Limitations, Common Errors & Troubleshooting',
        bullets: [
          'Important Limitations: Operates primarily within browser-local storage for user session testing; large enterprise private cloud team corpora require Studio coordination.',
          'Common Errors: Empty sandbox matches when the minimum score threshold slider is set too high.',
          'Troubleshooting: Lower the minimum score threshold or check Document Corpus to confirm your file finished ingesting.',
        ],
      },
    ],
  },
  {
    slug: 'feature-history-settings',
    code: 'C13',
    sectionId: 'C',
    sectionTitle: 'Section C · Features & Tools',
    title: 'History Archive, Theme & Studio Settings',
    status: 'AVAILABLE',
    statusNote: 'Live on /history and /settings.',
    summary:
      'Search, rename, export, or delete past conversations, adjust OMNIA’s language/style/streaming settings, and erase account/local data.',
    blocks: [
      {
        id: 'purpose',
        heading: 'Purpose & What It Does',
        paragraphs: [
          'Gives you complete self-service control over saved conversation threads, interface appearance, response language/tone, and privacy erasure.',
        ],
      },
      {
        id: 'access-and-steps',
        heading: 'Key Controls Available',
        bullets: [
          'History (/history): Filter threads by keyword, rename titles, export conversations as JSON, delete individual or all threads, or resume any thread in /ai.',
          'Omnia AI Preferences (/settings): Switch Preferred Language (Auto, English, Hindi, Hinglish), Response Style (Concise, Detailed, Kinetic), and Stream Speed (Fast, Natural).',
          'Appearance (/settings): Toggle Dark Mode and Light Mode.',
          'Privacy & Data Erasure (/settings): Clear Local Cache or trigger immediate Delete Account & Data.',
        ],
      },
    ],
  },
  {
    slug: 'feature-explore-studio',
    code: 'C14',
    sectionId: 'C',
    sectionTitle: 'Section C · Features & Tools',
    title: '3D Creative Showcase & Studio Engines',
    status: 'AVAILABLE',
    statusNote: 'Live on /explore and /studio (upcoming R&D prototypes clearly marked as roadmap items).',
    summary:
      'Interactive 3D creative gallery and demonstrations of VIZRA’s temporal motion, neural direction, shader, and kinetic typography engines.',
    blocks: [
      {
        id: 'purpose',
        heading: 'What You Can Do There',
        paragraphs: [
          'Explore (/explore) presents curated visual compositions and reusable prompt formulas in an interactive 3D showcase. Studio (/studio) highlights the four active creative engines alongside transparent interactive prototypes on the product roadmap.',
        ],
      },
      {
        id: 'limits',
        heading: 'Important Limitations',
        bullets: [
          'Requires WebGL support in your browser for 3D perspective rendering.',
          'Items in the "Future of VIZRA" roadmap section on /studio are interactive concept previews—not final commercial releases.',
        ],
      },
    ],
  },
  {
    slug: 'feature-cloud-connectors',
    code: 'C15',
    sectionId: 'C',
    sectionTitle: 'Section C · Features & Tools',
    title: 'Third-Party Cloud Workspace Connectors',
    status: 'UNAVAILABLE',
    statusNote: 'Currently UNAVAILABLE (In Staging / External OAuth Approval Required).',
    summary:
      'Planned integrations for Google Drive, Google Docs, Google Sheets, GitHub, Figma, Canva, Notion, YouTube, and Dropbox.',
    blocks: [
      {
        id: 'status-explanation',
        heading: 'Current Public Status: UNAVAILABLE (In Staging)',
        paragraphs: [
          'While Google Drive, Google Docs, Google Sheets, GitHub, Figma, Canva, Notion, YouTube, and Dropbox appear in the Tools ecosystem roadmap and the "+" Connect menu inside /ai, live third-party OAuth authorization is currently NOT active for public users.',
          'Until external provider approvals are completed and announced, clicking these connectors shows an honest "External OAuth Approval Required" / "OAuth Pending" notice rather than connecting to external accounts.',
        ],
      },
      {
        id: 'workaround',
        heading: 'How to Work Around This Today',
        steps: [
          'Download or export your document, spreadsheet, or image from Google Docs, Sheets, Notion, Figma, or Drive onto your device.',
          'Use "Attach Local Files" (Available now, up to 10 MB) in /ai or /workspace to inspect the exact same content immediately.',
        ],
      },
    ],
  },
  {
    slug: 'feature-temporal-video',
    code: 'C16',
    sectionId: 'C',
    sectionTitle: 'Section C · Features & Tools',
    title: 'Temporal Video & Scene Synthesis',
    status: 'COMING SOON',
    statusNote: 'Explicitly listed as "In Staging" / "Coming Soon" on /tools, /studio, and Create Hub.',
    summary:
      'Upcoming multi-camera spatial blocking and temporal video rendering engine currently in staged development.',
    blocks: [
      {
        id: 'status-explanation',
        heading: 'What Is Ready vs. Coming Soon',
        paragraphs: [
          'Direct rendered video generation (the "VIDEO" category in Create Hub and "Temporal Video & Scene Synthesis" on /tools) is NOT yet active for live video rendering. No launch date has been published.',
          'Today, VIZRA supports video production pre-visualization: you can generate scripts, shot-by-shot camera trajectories, storyboard prompts, cubic-bezier motion curves, still visual concept frames, and AI audio soundtracks.',
        ],
      },
      {
        id: 'early-access',
        heading: 'Requesting Preview Updates',
        paragraphs: [
          'You can register interest in upcoming staged studio engines via the Early Access form on the Contact page (/contact).',
        ],
      },
    ],
  },
  {
    slug: 'feature-commercial-billing',
    code: 'C17',
    sectionId: 'C',
    sectionTitle: 'Section C · Features & Tools',
    title: 'Paid Tier Checkout & Plan Previews',
    status: 'LIMITED',
    statusNote: 'Creator Free ($0) is active. Omnia Pro and VIZRA Studio currently operate in preview selection mode with zero card charges.',
    summary:
      'Compare Creator Free, Omnia Pro, and VIZRA Studio & Team tiers and save workspace tier previews.',
    blocks: [
      {
        id: 'status-explanation',
        heading: 'How Plan Selection Works Today',
        paragraphs: [
          'VIZRA’s Creator Free tier ($0) is active with standard Omnia 1.0 access, web citations, up to 3 active 10-stage projects, and 10 MB local file ingestion.',
          'Selecting Omnia Pro or VIZRA Studio & Team on /pricing currently records a workspace tier preview and studio email notification preference—no payment card is collected or charged until commercial billing launches.',
        ],
      },
    ],
    relatedLinks: [
      { label: 'View Pricing Tiers', to: '/pricing' },
      { label: 'Contact for Studio Teams', to: '/contact' },
    ],
  },

  // =========================================================================
  // SECTION D — OMNIA DOCUMENTATION (16–22)
  // =========================================================================
  {
    slug: 'omnia-introduction',
    code: '16',
    sectionId: 'D',
    sectionTitle: 'Section D · OMNIA Documentation',
    title: 'Introduction to OMNIA',
    summary:
      'What OMNIA 1.0 is inside VIZRA and how it unifies conversation, research, creative planning, and specialized tools.',
    diagramId: 'omnia-interaction',
    blocks: [
      {
        id: 'identity',
        heading: 'Meet OMNIA 1.0',
        paragraphs: [
          'OMNIA 1.0 is the intelligent creative assistant built into the heart of VIZRA. Rather than forcing you to learn command-line syntax or separate specialized bots, OMNIA interprets your natural-language requests and connects you cleanly to the right reasoning, research, file-reading, or project workflow.',
        ],
      },
      {
        id: 'capabilities-summary',
        heading: 'What OMNIA Can Help With',
        bullets: [
          'Everyday Q&A and rapid brainstorming in Quick mode.',
          'Deep step-by-step analysis and structured trade-offs in Think mode.',
          'Live web fact checking with verifiable citations in Research mode.',
          'Educational protein, compound, and biomedical lookups in Science mode.',
          'Scripts, visual directions, design systems, and 10-stage projects in Create mode.',
          'React, TypeScript, CSS, and shader engineering in Code mode.',
          'Summarizing uploaded PDFs, CSV spreadsheets, images, and audio in Analyze mode.',
        ],
      },
    ],
  },
  {
    slug: 'omnia-role',
    code: '17',
    sectionId: 'D',
    sectionTitle: 'Section D · OMNIA Documentation',
    title: 'Role in VIZRA',
    summary:
      'Why OMNIA sits across chat threads, Create Hub disciplines, Project Memory, and Workspace tools.',
    blocks: [
      {
        id: 'orchestrator-role',
        heading: 'Connecting Ideas to Execution',
        paragraphs: [
          'OMNIA acts as the bridge across VIZRA’s studio tools. When you start a tool from /tools or Create Hub, it pre-configures OMNIA with a matching prompt and mode. When you edit a 10-stage project in the Project Workspace, OMNIA can refine any individual stage using your saved Project Memory.',
        ],
      },
      {
        id: 'clean-separation',
        heading: 'Clean Separation Between Chat and Projects',
        paragraphs: [
          'OMNIA keeps casual conversations separate from unrelated creative projects. Asking a science, math, or general programming question never pulls unrelated branding notes from a separate project unless you are actively working inside that project context.',
        ],
      },
    ],
  },
  {
    slug: 'understanding-ai-responses',
    code: '18',
    sectionId: 'D',
    sectionTitle: 'Section D · OMNIA Documentation',
    title: 'Understanding AI Responses',
    summary:
      'Why OMNIA varies response length, formatting, citations, and code blocks depending on your prompt and mode.',
    blocks: [
      {
        id: 'proportionality',
        heading: 'Proportional Response Formatting',
        paragraphs: [
          'OMNIA matches its output format to the complexity of your request. Simple questions get brief, conversational answers without unnecessary headings. Technical designs, scripts, or research requests receive organized headings, bullet points, tables, and copyable code blocks.',
        ],
      },
      {
        id: 'customizing-style',
        heading: 'Adjusting Style & Language in Settings',
        bullets: [
          'Response Style (/settings): Choose Concise (shorter executive bullets), Detailed (deeper explanations), or Kinetic (punchy creative framing).',
          'Language Preference (/settings): Set Auto, English, Hindi (Devanagari), or Hinglish.',
          'Stream Speed (/settings): Choose Fast or Natural reading cadence.',
        ],
      },
    ],
  },
  {
    slug: 'prompting-effectively',
    code: '19',
    sectionId: 'D',
    sectionTitle: 'Section D · OMNIA Documentation',
    title: 'Prompting Effectively',
    summary:
      'Core habits for getting clear, accurate, non-generic answers from OMNIA on the first try.',
    diagramId: 'guide-prompt-cycle',
    blocks: [
      {
        id: 'checklist',
        heading: 'Four Ingredients of a Strong Prompt',
        bullets: [
          '1. Pick the right Capability Mode first (e.g., Research for current facts, Code for programming, Analyze when files are attached).',
          '2. State the deliverable and audience clearly ("Write a 200-word product FAQ for beginner creators").',
          '3. Provide concrete constraints (word count, tone, aspect ratio, tech stack, or output format such as a comparison table).',
          '4. Attach source documents or examples rather than describing them from memory.',
        ],
      },
      {
        id: 'before-after',
        heading: 'Weak Prompt vs. Clear Prompt Example',
        example: {
          title: 'Improving Prompt Specificity',
          language: 'text',
          content: `Less clear: "Write about lighting."\n\nBetter (Create mode): "Create a lighting and color palette guide for a 20-second dark studio product film featuring brushed black aluminum. Include 3 camera angles, contrast mood, and a concise voiceover line per shot."`,
        },
      },
    ],
  },
  {
    slug: 'working-with-ai-results',
    code: '20',
    sectionId: 'D',
    sectionTitle: 'Section D · OMNIA Documentation',
    title: 'Working with AI-Generated Results',
    summary:
      'How to copy, refine, convert into projects, save to assets, or export OMNIA’s outputs cleanly.',
    blocks: [
      {
        id: 'actions-available',
        heading: 'Actions You Can Take After a Response',
        bullets: [
          'Copy Specific Blocks or Messages: Use copy controls on individual code blocks or full assistant replies.',
          'Follow-Up Refinement: Ask OMNIA to shorten, expand, translate (English/Hindi/Hinglish), or reformat an answer into a table or checklist.',
          'Export Conversation: Export saved chats from History (/history) as JSON or use chat export to save Markdown transcripts.',
          'Save Visuals & Audio: Save generated artwork cards to your Workspace Assets (/workspace) or download generated music tracks as WAV files.',
          'Move to a 10-Stage Project: Convert a promising brainstorm into a trackable project pipeline so progress persists across stages.',
        ],
      },
    ],
  },
  {
    slug: 'external-information-sources',
    code: '21',
    sectionId: 'D',
    sectionTitle: 'Section D · OMNIA Documentation',
    title: 'External Information and Sources',
    summary:
      'How OMNIA handles live web search grounding, Science Hub public records, and uploaded documents.',
    diagramId: 'responsible-grounding',
    blocks: [
      {
        id: 'source-types',
        heading: 'Three Grounded Information Channels',
        table: {
          headers: ['Channel', 'How You Trigger It', 'How Sources Are Shown'],
          rows: [
            ['Live Web Search', 'Select Research mode or ask for current, verifiable facts', 'Verified HTTPS source chips and clickable Citation Drawer'],
            ['Science Databases', 'Open Science Suite in /ai', 'Direct external links to AlphaFold DB, PubChem, and PubMed PMIDs'],
            ['User Files & Corpus', 'Attach local files or ingest into Knowledge Base', 'Parsed directly within your prompt or local RAG sandbox'],
          ],
        },
      },
      {
        id: 'no-fabricated-links',
        heading: 'Strict Anti-Fabrication Standard',
        paragraphs: [
          'VIZRA enforces strict source integrity: OMNIA will never invent fake article titles, study numbers, or broken URLs to look authoritative. When live verification is unavailable for a specific detail, OMNIA tells you openly.',
        ],
      },
    ],
  },
  {
    slug: 'ai-limitations-responsible-use',
    code: '22',
    sectionId: 'D',
    sectionTitle: 'Section D · OMNIA Documentation',
    title: 'AI Limitations and Responsible Usage',
    summary:
      'Understanding probabilistic AI limits, safety filters, provenance metadata, and human verification responsibilities.',
    blocks: [
      {
        id: 'limitations',
        heading: 'Inherent Limitations to Keep in Mind',
        bullets: [
          'Probabilistic Accuracy: Even with web grounding, AI can misinterpret nuanced context, miss very recent updates, or simplify technical caveats.',
          'Not Professional Advice: OMNIA outputs do not constitute legal, medical, clinical, tax, investment, or structural engineering advice.',
          'Copyright & Originality Review: Purely AI-generated material without meaningful human creative authorship may face copyright eligibility limits in certain jurisdictions; review Section 4 of the Terms & Conditions.',
        ],
      },
      {
        id: 'safety-controls',
        heading: 'Safety Filtering & Transparency',
        paragraphs: [
          'Automated safety filters evaluate prompts and responses against harmful or prohibited categories such as exploitation, self-harm encouragement, cyberattack instructions, or non-consensual synthetic media. When a request is blocked, OMNIA declines cleanly rather than generating unsafe output.',
          'Exported generated visual frames and audio streams embed machine-readable AI provenance attribution so downstream viewers can identify AI-assisted origin.',
        ],
      },
    ],
    relatedLinks: [
      { label: 'Responsible AI Usage (Section F)', to: '/docs?doc=responsible-ai-usage' },
      { label: 'Terms & Conditions', to: '/terms-and-conditions' },
    ],
  },
];
