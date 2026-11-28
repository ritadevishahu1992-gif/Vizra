export type PromptPresetId =
  | 'motion-design'
  | 'visual-direction'
  | 'creative-code'
  | 'storyboard-script'
  | 'brand-system'
  | 'research-brief'
  | 'music-audio';

export type PromptDetailLevel = 'concise' | 'production' | 'exhaustive';

export interface PromptPresetDefinition {
  id: PromptPresetId;
  label: string;
  shortLabel: string;
  description: string;
  defaultRole: string;
  defaultFormat: string;
  defaultTone: string;
  sampleIdea: string;
  sampleExclusions: string;
  domainDirectives: string[];
  outputChecklist: string[];
}

export interface PromptAuditDimension {
  id: string;
  label: string;
  presentInRaw: boolean;
  addedByOptimizer: boolean;
  guidance: string;
}

export interface OptimizePromptInput {
  rawIdea: string;
  presetId: PromptPresetId;
  targetFormat: string;
  tone: string;
  detailLevel: PromptDetailLevel;
  audience: string;
  exclusions: string;
}

export interface OptimizedPromptResult {
  optimizedPrompt: string;
  wordCountBefore: number;
  wordCountAfter: number;
  audit: PromptAuditDimension[];
  improvements: string[];
  recommendedOmniaMode: 'Quick' | 'Think' | 'Research' | 'Code' | 'Analyze';
}

export const MAX_PROMPT_IDEA_LENGTH = 4000;

export const PROMPT_PRESETS: PromptPresetDefinition[] = [
  {
    id: 'motion-design',
    label: 'Motion Design & Kinetic Concept',
    shortLabel: 'Motion Design',
    description:
      'Turn rough motion ideas into structured briefs covering pacing, easing curves, camera movement, lighting, and shot transitions.',
    defaultRole: 'Senior Motion Director and Kinetic Typography Specialist',
    defaultFormat: 'Shot-by-shot motion treatment with timing cues, easing curves, and lighting notes',
    defaultTone: 'Crisp, directorial, and production-ready',
    sampleIdea:
      'Create a 12-second product reveal motion concept for an obsidian hardware synth with crimson LED accents and kinetic Swiss typography.',
    sampleExclusions: 'No generic neon cyberpunk cliches, no dizzying camera shakes, no lens flare spam',
    domainDirectives: [
      'Specify exact duration beats (seconds/frames), transition mechanics, and easing profiles (e.g., cubic-bezier deceleration).',
      'Define lighting contrast, surface material response (matte obsidian, brushed metal, specular rim highlights), and typographic hierarchy.',
      'Separate primary hero motion from subtle secondary ambient micro-motion so legibility stays sharp.',
    ],
    outputChecklist: [
      'Visual & Lighting Direction',
      'Beat-by-Beat Timeline (with timestamps)',
      'Typography & Motion Choreography',
      'Sound / Rhythm Sync Cues',
    ],
  },
  {
    id: 'visual-direction',
    label: 'Visual & Art Direction',
    shortLabel: 'Art Direction',
    description:
      'Structure composition, focal hierarchy, lighting physics, material texture, color ratios, and framing for concept frames and moodboards.',
    defaultRole: 'Principal Art Director and Visual Systems Designer',
    defaultFormat: 'Structured visual direction prompt with framing, lighting, palette ratios, and texture specs',
    defaultTone: 'Evocative yet concrete and unambiguous',
    sampleIdea:
      'Editorial architectural photography concept of a minimalist desert concrete pavilion at blue hour with warm interior tungsten glow.',
    sampleExclusions: 'No oversaturated HDR tones, no distorted architecture, no stock-photo symmetry',
    domainDirectives: [
      'Establish foreground, midground, and background depth with explicit camera lens feel and framing ratio.',
      'Define exact light sources (key, fill, ambient color temperature) and surface imperfections for realism.',
      'Specify a disciplined color ratio (dominant neutral, supporting midtone, controlled accent).',
    ],
    outputChecklist: [
      'Subject & Composition',
      'Lighting & Atmosphere',
      'Materials, Palette & Lens Spec',
      'Negative Constraints',
    ],
  },
  {
    id: 'creative-code',
    label: 'WebGL / GLSL Shader & Creative Code',
    shortLabel: 'Creative Code',
    description:
      'Produce precise engineering prompts for GLSL fragment shaders, Three.js scenes, or interactive React/TypeScript UI components.',
    defaultRole: 'Staff Creative Technologist specializing in WebGL, GLSL, React, and TypeScript',
    defaultFormat: 'Clean, modular TypeScript / GLSL implementation with uniform definitions and performance guardrails',
    defaultTone: 'Precise, architectural, and zero-fluff',
    sampleIdea:
      'Build a smooth interactive WebGL ripple distortion shader reacting to pointer velocity with subtle chromatic dispersion at 60fps.',
    sampleExclusions: 'No deprecated APIs, no unthrottled resize loops, no unnecessary heavy third-party libraries',
    domainDirectives: [
      'State exact technical stack, shader uniforms/attributes, and target frame budget (60fps desktop, graceful degradation on mobile).',
      'Require clean resource disposal (geometries, textures, event listeners, requestAnimationFrame cleanup).',
      'Include edge-case handling for reduced-motion preferences, high-DPI devicePixelRatio caps, and resize events.',
    ],
    outputChecklist: [
      'Architecture & State / Uniform Contract',
      'Complete Modular Code Implementation',
      'Performance & Accessibility Guardrails',
      'Integration Notes',
    ],
  },
  {
    id: 'storyboard-script',
    label: 'Scriptwriting & Storyboard',
    shortLabel: 'Storyboard',
    description:
      'Convert rough story concepts into paced scene beats, visual framing notes, voiceover cadence, and sound cues.',
    defaultRole: 'Lead Creative Copywriter and Commercial Storyboard Director',
    defaultFormat: 'Two-column AV script (Visual / Audio) with scene beats and pacing targets',
    defaultTone: 'Sharp, narrative-driven, and free of hype filler',
    sampleIdea:
      'Write a 45-second launch film storyboard showing how a solo designer consolidates research, shader tests, and audio inside one dark studio workspace.',
    sampleExclusions: 'No buzzwords like "revolutionary" or "game-changing", no vague abstract montage clichés',
    domainDirectives: [
      'Anchor every beat to a concrete visual action the viewer can immediately understand without narration.',
      'Keep voiceover lines concise enough to breathe naturally against visual cuts (~2.2 words per second).',
      'Specify hook (first 3 seconds), proof moment, and clear closing call to action.',
    ],
    outputChecklist: [
      'Narrative Arc & Hook',
      'Scene-by-Scene Visual + Voiceover Table',
      'Pacing & Sound Design Notes',
      'Closing Call-to-Action Options',
    ],
  },
  {
    id: 'brand-system',
    label: 'Brand Identity & Design System',
    shortLabel: 'Brand System',
    description:
      'Define typography pairings, color hierarchy, component rules, voice guidelines, and anti-patterns for cohesive products.',
    defaultRole: 'Principal Brand Systems Designer and Design Director',
    defaultFormat: 'Actionable design system specification with tokens, hierarchy rules, and do/don’t examples',
    defaultTone: 'Editorial, systematic, and high-craft',
    sampleIdea:
      'Design a visual identity and UI token foundation for an independent architectural acoustics studio targeting cinema and museum clients.',
    sampleExclusions: 'No generic SaaS purple gradients, no excessive badge clutter, no low-contrast body text',
    domainDirectives: [
      'Specify exact typographic scale roles (display, body, monospace metadata) and contrast compliance (WCAG AA minimum).',
      'Define surface hierarchy (canvas, elevated panel, hairline border) and strict accent restraint.',
      'Provide concrete voice & copy do/don’t examples tailored to the target audience.',
    ],
    outputChecklist: [
      'Brand Positioning & Visual Principles',
      'Color & Surface Token Table',
      'Typography & Spacing Scale',
      'UI & Voice Anti-Patterns',
    ],
  },
  {
    id: 'research-brief',
    label: 'Grounded Research & Technical Brief',
    shortLabel: 'Research Brief',
    description:
      'Instruct AI assistants to verify facts, cite real HTTPS sources, separate verified evidence from assumptions, and present clear tradeoffs.',
    defaultRole: 'Senior Technical Researcher and Strategy Analyst',
    defaultFormat: 'Evidence-backed brief with source verification, comparison matrix, and explicit unknowns',
    defaultTone: 'Objective, analytical, and strictly non-speculative',
    sampleIdea:
      'Compare browser WebGPU adoption, fallback strategies, and mobile constraints for interactive creative web applications in 2026.',
    sampleExclusions: 'Do not fabricate benchmarks, statistics, or URLs; clearly flag unverified items',
    domainDirectives: [
      'Ground factual claims in verified primary sources and attach clickable HTTPS URLs whenever web search is available.',
      'Explicitly separate verified facts from estimates or unverified gaps — never invent numbers or citations.',
      'Conclude with concrete architectural tradeoffs and recommended next steps.',
    ],
    outputChecklist: [
      'Executive Summary (Verified Facts Only)',
      'Structured Tradeoff Matrix',
      'Verified Source References',
      'Open Unknowns & Verification Steps',
    ],
  },
  {
    id: 'music-audio',
    label: 'AI Music & Audio Direction (Lyria 3)',
    shortLabel: 'Music & Audio',
    description:
      'Craft rich instrumental music prompts specifying genre fusion, BPM, instrumentation, mix space, and dynamic progression.',
    defaultRole: 'Composer and Sonic Identity Producer',
    defaultFormat: 'Production-ready instrumental music prompt with BPM, instruments, arrangement arc, and mix notes',
    defaultTone: 'Musical, tactile, and sonically specific',
    sampleIdea:
      'Compose a focused 60-second dark minimalist electronic background track for a product demo with warm analog bass and restrained percussion.',
    sampleExclusions: 'No vocals, no harsh distorted EDM drops, no abrupt clipping at loop boundaries',
    domainDirectives: [
      'Specify tempo (BPM), key/mood, core instrumentation, and stereo/reverb space (dry close-mic vs wide atmospheric tail).',
      'Map the dynamic arc across intro, build, main groove, and clean outro fade or loopable tail.',
      'Keep frequency range balanced so voiceover or UI interactions remain intelligible if layered over the track.',
    ],
    outputChecklist: [
      'Single-Paragraph Generation Prompt (Ready for Lyria 3)',
      'Tempo, Key & Instrumentation Breakdown',
      'Dynamic Arrangement Arc',
      'Mix & Negative Constraints',
    ],
  },
];

export function getPresetById(id: PromptPresetId): PromptPresetDefinition {
  return PROMPT_PRESETS.find((p) => p.id === id) || PROMPT_PRESETS[0];
}

function countWords(text: string): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).length;
}

function hasPattern(text: string, regex: RegExp): boolean {
  return regex.test(text);
}

/**
 * Deterministic, zero-API-key creative prompt optimizer and structural rubric auditor.
 * Inspects a raw idea for 6 concrete structural elements and synthesizes a clean,
 * ready-to-paste prompt without fabricating metrics or requiring login.
 */
export function optimizeCreativePrompt(input: OptimizePromptInput): OptimizedPromptResult {
  const raw = input.rawIdea.trim();
  const preset = getPresetById(input.presetId);
  const wordCountBefore = countWords(raw);

  const effectiveFormat = input.targetFormat.trim() || preset.defaultFormat;
  const effectiveTone = input.tone.trim() || preset.defaultTone;
  const effectiveAudience = input.audience.trim();
  const effectiveExclusions = input.exclusions.trim();

  // Objective structural checks on the user's raw input
  const hasClearSubject = wordCountBefore >= 6;
  const hasContextOrAudience =
    Boolean(effectiveAudience) ||
    hasPattern(raw, /\b(for|targeting|audience|client|brand|team|viewer|user|demo|launch)\b/i);
  const hasTechnicalOrVisualSpecs = hasPattern(
    raw,
    /\b(\d+\s?(s|sec|seconds|fps|px|bpm|%|k|ms)|lighting|camera|shader|webgl|glsl|react|palette|typography|color|tempo|reverb|composition|contrast|aspect)\b/i
  );
  const hasExplicitFormat =
    Boolean(input.targetFormat.trim()) ||
    hasPattern(raw, /\b(table|list|script|storyboard|json|markdown|code|brief|outline|prompt|spec|sections)\b/i);
  const hasConstraints =
    Boolean(effectiveExclusions) ||
    hasPattern(raw, /\b(avoid|no |without|exclude|do not|don't|must not|limit|under \d+)\b/i);
  const hasSuccessCriteria = hasPattern(
    raw,
    /\b(goal|objective|ensure|optimize|readable|accessible|60fps|verified|accurate|loopable|concise)\b/i
  );

  const audit: PromptAuditDimension[] = [
    {
      id: 'subject',
      label: 'Subject & Core Objective',
      presentInRaw: hasClearSubject,
      addedByOptimizer: true,
      guidance: hasClearSubject
        ? 'Clear core idea detected and preserved as the primary brief.'
        : 'Short input detected — framed inside an explicit Role + Objective block so the model does not guess intent.',
    },
    {
      id: 'context',
      label: 'Audience & Context',
      presentInRaw: hasContextOrAudience,
      addedByOptimizer: true,
      guidance: hasContextOrAudience
        ? 'Context or audience cue captured.'
        : 'Added domain context and professional studio perspective.',
    },
    {
      id: 'specs',
      label: 'Visual / Technical Specifications',
      presentInRaw: hasTechnicalOrVisualSpecs,
      addedByOptimizer: true,
      guidance: hasTechnicalOrVisualSpecs
        ? 'Technical or aesthetic details preserved and expanded with discipline-specific parameters.'
        : 'Injected concrete discipline directives (pacing, materials, architecture, or audio parameters).',
    },
    {
      id: 'format',
      label: 'Deliverable Format',
      presentInRaw: hasExplicitFormat,
      addedByOptimizer: true,
      guidance: `Locked deliverable structure to: ${effectiveFormat}.`,
    },
    {
      id: 'constraints',
      label: 'Negative Constraints & Guardrails',
      presentInRaw: hasConstraints,
      addedByOptimizer: true,
      guidance: hasConstraints
        ? 'Your exclusions and guardrails are isolated in a dedicated Constraints block.'
        : 'Added anti-cliche and factual-discipline guardrails to prevent generic filler.',
    },
    {
      id: 'criteria',
      label: 'Quality & Verification Criteria',
      presentInRaw: hasSuccessCriteria,
      addedByOptimizer: true,
      guidance: 'Added explicit verification and craft checklist before final output.',
    },
  ];

  const depthInstruction =
    input.detailLevel === 'concise'
      ? 'Keep the response tight, scannable, and immediately executable with zero preamble.'
      : input.detailLevel === 'exhaustive'
      ? 'Provide thorough, production-grade depth with explicit technical specifications, edge cases, and rationale for key creative choices.'
      : 'Balance clarity with actionable production detail so a creator can execute directly without follow-up guesswork.';

  const constraintLines: string[] = [];
  if (effectiveExclusions) {
    constraintLines.push(`- Explicitly avoid: ${effectiveExclusions}.`);
  }
  constraintLines.push(
    '- Do not fabricate statistics, citations, or unverified claims; flag assumptions clearly.'
  );
  constraintLines.push(
    '- Avoid vague marketing fluff and generic filler; favor concrete visual, structural, or technical language.'
  );

  const directives =
    input.detailLevel === 'concise'
      ? preset.domainDirectives.slice(0, 2)
      : preset.domainDirectives;

  const sections: string[] = [
    `ROLE\nAct as a ${preset.defaultRole}.`,
    `OBJECTIVE\n${raw}`,
  ];

  if (effectiveAudience) {
    sections.push(`TARGET AUDIENCE & CONTEXT\nTailor all decisions, terminology, and craft level for: ${effectiveAudience}.`);
  }

  sections.push(
    `CREATIVE & TECHNICAL DIRECTIVES\n${directives.map((d) => `- ${d}`).join('\n')}`
  );

  sections.push(
    `DELIVERABLE FORMAT & TONE\n- Format: ${effectiveFormat}\n- Tone & Style: ${effectiveTone}\n- Depth: ${depthInstruction}\n- Include these sections:\n${preset.outputChecklist
      .map((item, idx) => `  ${idx + 1}. ${item}`)
      .join('\n')}`
  );

  sections.push(`CONSTRAINTS & GUARDRAILS\n${constraintLines.join('\n')}`);

  if (input.detailLevel === 'exhaustive') {
    sections.push(
      `FINAL SELF-CHECK\nBefore concluding, verify that every requirement in Objective, Directives, and Constraints is satisfied cleanly and highlight any open creative tradeoffs worth confirming.`
    );
  }

  const optimizedPrompt = sections.join('\n\n');
  const wordCountAfter = countWords(optimizedPrompt);

  const improvements: string[] = [
    `Assigned specialized studio role (${preset.defaultRole}) to anchor terminology and craft.`,
    `Structured your raw idea into explicit Objective, Directives, Deliverable Format, and Guardrails blocks.`,
    `Added ${directives.length} ${preset.shortLabel.toLowerCase()}-specific parameters so outputs stay concrete instead of generic.`,
    `Defined a ${preset.outputChecklist.length}-part output skeleton (${preset.outputChecklist.join(', ')}).`,
    effectiveExclusions
      ? 'Elevated your custom negative constraints into a dedicated guardrails block.'
      : 'Added zero-fabrication and anti-cliche guardrails to eliminate filler.',
  ];

  const modeMap: Record<PromptPresetId, 'Quick' | 'Think' | 'Research' | 'Code' | 'Analyze'> = {
    'motion-design': 'Think',
    'visual-direction': 'Think',
    'creative-code': 'Code',
    'storyboard-script': 'Think',
    'brand-system': 'Think',
    'research-brief': 'Research',
    'music-audio': 'Quick',
  };

  return {
    optimizedPrompt,
    wordCountBefore,
    wordCountAfter,
    audit,
    improvements,
    recommendedOmniaMode: modeMap[preset.id],
  };
}
