import React from 'react';
import { DocDiagramId } from '../../data/publicDocs/types';

interface DiagramProps {
  diagramId: DocDiagramId;
}

const DIAGRAM_METADATA: Record<
  DocDiagramId,
  { title: string; caption: string; ariaLabel: string }
> = {
  'platform-overview': {
    title: 'Diagram 01 · VIZRA Platform Overview',
    caption:
      'VIZRA unites public showcase and education surfaces with the interactive OMNIA workspace, specialized creative tools, and 10-stage project pipelines.',
    ariaLabel:
      'Conceptual architecture diagram showing Visitors entering VIZRA public pages, transitioning into the OMNIA interactive core, and utilizing Create Hub tools, Research grounding, and 10-stage Project Memory.',
  },
  'user-journey': {
    title: 'Diagram 02 · End-to-End User Journey',
    caption:
      'Typical flow from discovering capabilities on public pages to brainstorming in OMNIA, building structured project deliverables, and exporting finished work.',
    ariaLabel:
      'Step-by-step user journey diagram showing Explore and Learn, Start in OMNIA, Iterate with Modes and Files, Save to Project or History, and Export.',
  },
  'omnia-interaction': {
    title: 'Diagram 03 · Conceptual OMNIA Interaction Flow',
    caption:
      'Every prompt and optional attachment is interpreted with your active capability mode, verified against grounding or safety rules, and returned in a proportional format.',
    ariaLabel:
      'Conceptual flow showing User Prompt plus Optional Local Files entering Mode and Context Interpretation, passing Grounding and Safety Checks, and returning Text, Code, Citations, Visuals, or Audio.',
  },
  'creative-workflow': {
    title: 'Diagram 04 · AI-Assisted 10-Stage Creative Workflow',
    caption:
      'Complex ideas move through structured project memory so editorial direction, research sources, technical architecture, and exports remain consistent.',
    ariaLabel:
      'Workflow diagram linking Project Brief and Memory to Stages 1-3 Ideation and Research, Stages 4-7 Synthesis and Code/Assets, and Stages 8-10 Review and Export.',
  },
  'guide-prompt-cycle': {
    title: 'Diagram 05 · Effective Prompting & Iteration Loop',
    caption:
      'Selecting the right mode upfront, stating constraints clearly, attaching reference files, and refining step-by-step produces significantly cleaner outputs.',
    ariaLabel:
      'Circular prompting guide diagram: Define Goal and Audience, Pick Matching Mode, Attach Reference Files, Review Output, and Refine or Export.',
  },
  'responsible-grounding': {
    title: 'Diagram 06 · Verification, Provenance & Boundaries',
    caption:
      'Grounded web research verifies links, exported visuals carry AI provenance metadata, and unsupported queries receive transparent uncertainty notices.',
    ariaLabel:
      'Diagram illustrating safety and factual checks: Prompt Check, Safety Boundaries, Live Web or Science Lookup, and Transparent Output with Citations or Uncertainty.',
  },
};

export const DocsDiagramFigure: React.FC<DiagramProps> = ({ diagramId }) => {
  const meta = DIAGRAM_METADATA[diagramId];

  return (
    <figure className="rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#0D0D0D] overflow-hidden">
      <div className="px-5 py-3 border-b border-neutral-200 dark:border-white/[0.06] flex items-center justify-between gap-3">
        <figcaption className="font-mono text-[11px] uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
          {meta.title}
        </figcaption>
        <span className="font-mono text-[10px] text-[#EB3B2D] uppercase tracking-wider">
          Conceptual Diagram
        </span>
      </div>

      <div className="p-4 sm:p-6 bg-neutral-50/70 dark:bg-[#090909]">
        {diagramId === 'platform-overview' && (
          <svg
            viewBox="0 0 820 300"
            className="w-full h-auto"
            role="img"
            aria-label={meta.ariaLabel}
          >
            <defs>
              <marker
                id="arrow-red-1"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#EB3B2D" />
              </marker>
            </defs>

            {/* Background Grid Subtle */}
            <rect
              x="12"
              y="12"
              width="796"
              height="276"
              rx="14"
              className="fill-white dark:fill-[#101010] stroke-neutral-200 dark:stroke-white/10"
              strokeWidth="1"
            />

            {/* Column 1: Public Discovery */}
            <rect
              x="36"
              y="44"
              width="176"
              height="212"
              rx="10"
              className="fill-neutral-100 dark:fill-[#151515] stroke-neutral-300 dark:stroke-white/10"
            />
            <text
              x="52"
              y="70"
              className="fill-[#EB3B2D] font-mono text-[10px] font-semibold"
            >
              01 · DISCOVER
            </text>
            <text
              x="52"
              y="94"
              className="fill-neutral-900 dark:fill-white font-sans text-[14px] font-bold"
            >
              Public Studio
            </text>
            <rect
              x="52"
              y="114"
              width="144"
              height="32"
              rx="6"
              className="fill-white dark:fill-[#0B0B0B] stroke-neutral-300 dark:stroke-white/10"
            />
            <text
              x="64"
              y="134"
              className="fill-neutral-700 dark:fill-neutral-300 font-sans text-[11px]"
            >
              Features &amp; Tools
            </text>
            <rect
              x="52"
              y="156"
              width="144"
              height="32"
              rx="6"
              className="fill-white dark:fill-[#0B0B0B] stroke-neutral-300 dark:stroke-white/10"
            />
            <text
              x="64"
              y="176"
              className="fill-neutral-700 dark:fill-neutral-300 font-sans text-[11px]"
            >
              Explore Showcase
            </text>
            <rect
              x="52"
              y="198"
              width="144"
              height="32"
              rx="6"
              className="fill-white dark:fill-[#0B0B0B] stroke-neutral-300 dark:stroke-white/10"
            />
            <text
              x="64"
              y="218"
              className="fill-neutral-700 dark:fill-neutral-300 font-sans text-[11px]"
            >
              Documentation Hub
            </text>

            {/* Arrow 1 -> 2 */}
            <line
              x1="214"
              y1="150"
              x2="268"
              y2="150"
              stroke="#EB3B2D"
              strokeWidth="2"
              markerEnd="url(#arrow-red-1)"
            />

            {/* Column 2: OMNIA Core */}
            <rect
              x="274"
              y="44"
              width="256"
              height="212"
              rx="10"
              className="fill-neutral-900 dark:fill-[#171212] stroke-[#EB3B2D]/70"
              strokeWidth="1.5"
            />
            <text
              x="294"
              y="70"
              className="fill-[#EB3B2D] font-mono text-[10px] font-semibold"
            >
              02 · INTELLIGENCE LAYER
            </text>
            <text
              x="294"
              y="96"
              className="fill-white font-sans text-[16px] font-bold"
            >
              OMNIA 1.0 Workspace
            </text>
            <text
              x="294"
              y="116"
              className="fill-neutral-300 font-sans text-[11px]"
            >
              Conversational &amp; Multimodal Assistant
            </text>

            <rect
              x="294"
              y="134"
              width="102"
              height="48"
              rx="6"
              className="fill-[#1E1E1E] stroke-white/15"
            />
            <text x="304" y="154" className="fill-white font-mono text-[10px] font-semibold">
              7 AI Modes
            </text>
            <text x="304" y="170" className="fill-neutral-400 font-sans text-[10px]">
              Quick → Analyze
            </text>

            <rect
              x="408"
              y="134"
              width="102"
              height="48"
              rx="6"
              className="fill-[#1E1E1E] stroke-white/15"
            />
            <text x="418" y="154" className="fill-white font-mono text-[10px] font-semibold">
              File &amp; Web
            </text>
            <text x="418" y="170" className="fill-neutral-400 font-sans text-[10px]">
              Docs &amp; Citations
            </text>

            <rect
              x="294"
              y="194"
              width="216"
              height="40"
              rx="6"
              className="fill-[#1E1E1E] stroke-white/15"
            />
            <text x="306" y="218" className="fill-neutral-200 font-sans text-[11px]">
              Science Hub · Music Studio · Live Voice
            </text>

            {/* Arrow 2 -> 3 */}
            <line
              x1="532"
              y1="150"
              x2="586"
              y2="150"
              stroke="#EB3B2D"
              strokeWidth="2"
              markerEnd="url(#arrow-red-1)"
            />

            {/* Column 3: Outputs & Persistence */}
            <rect
              x="592"
              y="44"
              width="192"
              height="212"
              rx="10"
              className="fill-neutral-100 dark:fill-[#151515] stroke-neutral-300 dark:stroke-white/10"
            />
            <text
              x="608"
              y="70"
              className="fill-[#EB3B2D] font-mono text-[10px] font-semibold"
            >
              03 · DELIVER
            </text>
            <text
              x="608"
              y="94"
              className="fill-neutral-900 dark:fill-white font-sans text-[14px] font-bold"
            >
              Workspace &amp; Exports
            </text>
            <rect
              x="608"
              y="114"
              width="160"
              height="38"
              rx="6"
              className="fill-white dark:fill-[#0B0B0B] stroke-neutral-300 dark:stroke-white/10"
            />
            <text
              x="620"
              y="137"
              className="fill-neutral-800 dark:fill-neutral-200 font-sans text-[11px]"
            >
              10-Stage Project Plans
            </text>
            <rect
              x="608"
              y="162"
              width="160"
              height="38"
              rx="6"
              className="fill-white dark:fill-[#0B0B0B] stroke-neutral-300 dark:stroke-white/10"
            />
            <text
              x="620"
              y="185"
              className="fill-neutral-800 dark:fill-neutral-200 font-sans text-[11px]"
            >
              History &amp; Memory Sync
            </text>
            <rect
              x="608"
              y="210"
              width="160"
              height="30"
              rx="6"
              className="fill-white dark:fill-[#0B0B0B] stroke-neutral-300 dark:stroke-white/10"
            />
            <text
              x="620"
              y="229"
              className="fill-neutral-800 dark:fill-neutral-200 font-sans text-[11px]"
            >
              MD · JSON · PNG · WAV
            </text>
          </svg>
        )}

        {diagramId === 'user-journey' && (
          <svg
            viewBox="0 0 820 220"
            className="w-full h-auto"
            role="img"
            aria-label={meta.ariaLabel}
          >
            <defs>
              <marker
                id="arrow-red-2"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#EB3B2D" />
              </marker>
            </defs>
            <rect
              x="10"
              y="12"
              width="800"
              height="196"
              rx="14"
              className="fill-white dark:fill-[#101010] stroke-neutral-200 dark:stroke-white/10"
            />

            {[
              {
                x: 28,
                step: 'STEP 01',
                title: 'Explore Studio',
                sub: 'Browse features, tools & pricing',
              },
              {
                x: 186,
                step: 'STEP 02',
                title: 'Open Omnia',
                sub: 'Launch /ai or pick a tool card',
              },
              {
                x: 344,
                step: 'STEP 03',
                title: 'Select Mode',
                sub: 'Choose Quick, Think, Code, Research',
              },
              {
                x: 502,
                step: 'STEP 04',
                title: 'Attach & Iterate',
                sub: 'Add PDF/CSV/Images & refine',
              },
              {
                x: 660,
                step: 'STEP 05',
                title: 'Save & Export',
                sub: 'Organize stages or download',
              },
            ].map((node, idx) => (
              <g key={node.step}>
                <rect
                  x={node.x}
                  y="44"
                  width="132"
                  height="132"
                  rx="10"
                  className={
                    idx === 2
                      ? 'fill-neutral-900 dark:fill-[#191313] stroke-[#EB3B2D]/70'
                      : 'fill-neutral-100 dark:fill-[#151515] stroke-neutral-300 dark:stroke-white/10'
                  }
                />
                <text
                  x={node.x + 14}
                  y="72"
                  className="fill-[#EB3B2D] font-mono text-[10px] font-semibold"
                >
                  {node.step}
                </text>
                <text
                  x={node.x + 14}
                  y="98"
                  className={
                    idx === 2
                      ? 'fill-white font-sans text-[13px] font-bold'
                      : 'fill-neutral-900 dark:fill-white font-sans text-[13px] font-bold'
                  }
                >
                  {node.title}
                </text>
                <text
                  x={node.x + 14}
                  y="124"
                  className={
                    idx === 2
                      ? 'fill-neutral-300 font-sans text-[10px]'
                      : 'fill-neutral-600 dark:fill-neutral-400 font-sans text-[10px]'
                  }
                >
                  {node.sub.slice(0, 22)}
                </text>
                {node.sub.length > 22 && (
                  <text
                    x={node.x + 14}
                    y="139"
                    className={
                      idx === 2
                        ? 'fill-neutral-300 font-sans text-[10px]'
                        : 'fill-neutral-600 dark:fill-neutral-400 font-sans text-[10px]'
                    }
                  >
                    {node.sub.slice(22)}
                  </text>
                )}
                {idx < 4 && (
                  <line
                    x1={node.x + 134}
                    y1="110"
                    x2={node.x + 154}
                    y2="110"
                    stroke="#EB3B2D"
                    strokeWidth="2"
                    markerEnd="url(#arrow-red-2)"
                  />
                )}
              </g>
            ))}
          </svg>
        )}

        {diagramId === 'omnia-interaction' && (
          <svg
            viewBox="0 0 820 260"
            className="w-full h-auto"
            role="img"
            aria-label={meta.ariaLabel}
          >
            <defs>
              <marker
                id="arrow-red-3"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#EB3B2D" />
              </marker>
            </defs>
            <rect
              x="10"
              y="10"
              width="800"
              height="240"
              rx="14"
              className="fill-white dark:fill-[#101010] stroke-neutral-200 dark:stroke-white/10"
            />

            {/* Inputs */}
            <rect
              x="32"
              y="40"
              width="170"
              height="80"
              rx="8"
              className="fill-neutral-100 dark:fill-[#161616] stroke-neutral-300 dark:stroke-white/10"
            />
            <text x="48" y="66" className="fill-[#EB3B2D] font-mono text-[10px]">
              INPUT A
            </text>
            <text
              x="48"
              y="88"
              className="fill-neutral-900 dark:fill-white font-sans text-[13px] font-semibold"
            >
              Prompt &amp; Mode
            </text>
            <text x="48" y="106" className="fill-neutral-500 font-sans text-[10px]">
              Quick, Think, Research...
            </text>

            <rect
              x="32"
              y="140"
              width="170"
              height="80"
              rx="8"
              className="fill-neutral-100 dark:fill-[#161616] stroke-neutral-300 dark:stroke-white/10"
            />
            <text x="48" y="166" className="fill-[#EB3B2D] font-mono text-[10px]">
              INPUT B (OPTIONAL)
            </text>
            <text
              x="48"
              y="188"
              className="fill-neutral-900 dark:fill-white font-sans text-[13px] font-semibold"
            >
              Attachments &amp; Memory
            </text>
            <text x="48" y="206" className="fill-neutral-500 font-sans text-[10px]">
              Images, PDF, CSV, Project Context
            </text>

            <line
              x1="204"
              y1="80"
              x2="262"
              y2="115"
              stroke="#EB3B2D"
              strokeWidth="2"
              markerEnd="url(#arrow-red-3)"
            />
            <line
              x1="204"
              y1="180"
              x2="262"
              y2="145"
              stroke="#EB3B2D"
              strokeWidth="2"
              markerEnd="url(#arrow-red-3)"
            />

            {/* OMNIA Processing */}
            <rect
              x="270"
              y="52"
              width="260"
              height="156"
              rx="10"
              className="fill-neutral-900 dark:fill-[#171212] stroke-[#EB3B2D]/70"
              strokeWidth="1.5"
            />
            <text x="290" y="80" className="fill-[#EB3B2D] font-mono text-[10px] font-semibold">
              OMNIA ASSISTIVE ENGINE
            </text>
            <text x="290" y="104" className="fill-white font-sans text-[15px] font-bold">
              Contextual Understanding
            </text>
            <text x="290" y="128" className="fill-neutral-300 font-sans text-[11px]">
              1. Determines depth &amp; language style
            </text>
            <text x="290" y="148" className="fill-neutral-300 font-sans text-[11px]">
              2. Applies safety &amp; policy filters
            </text>
            <text x="290" y="168" className="fill-neutral-300 font-sans text-[11px]">
              3. Verifies citations if web grounding is active
            </text>
            <text x="290" y="188" className="fill-neutral-400 font-mono text-[10px]">
              Streams live · Cancelable anytime
            </text>

            <line
              x1="532"
              y1="130"
              x2="588"
              y2="130"
              stroke="#EB3B2D"
              strokeWidth="2"
              markerEnd="url(#arrow-red-3)"
            />

            {/* Structured Result */}
            <rect
              x="596"
              y="40"
              width="192"
              height="180"
              rx="8"
              className="fill-neutral-100 dark:fill-[#161616] stroke-neutral-300 dark:stroke-white/10"
            />
            <text x="614" y="68" className="fill-[#EB3B2D] font-mono text-[10px]">
              OUTPUTS
            </text>
            <text
              x="614"
              y="92"
              className="fill-neutral-900 dark:fill-white font-sans text-[13px] font-bold"
            >
              Proportional Results
            </text>
            <text x="614" y="118" className="fill-neutral-700 dark:fill-neutral-300 font-sans text-[11px]">
              • Concise answers or full specs
            </text>
            <text x="614" y="140" className="fill-neutral-700 dark:fill-neutral-300 font-sans text-[11px]">
              • Code blocks &amp; visual prompts
            </text>
            <text x="614" y="162" className="fill-neutral-700 dark:fill-neutral-300 font-sans text-[11px]">
              • Clickable source drawer
            </text>
            <text x="614" y="184" className="fill-neutral-700 dark:fill-neutral-300 font-sans text-[11px]">
              • Clear uncertainty if unverified
            </text>
          </svg>
        )}

        {diagramId === 'creative-workflow' && (
          <svg
            viewBox="0 0 820 240"
            className="w-full h-auto"
            role="img"
            aria-label={meta.ariaLabel}
          >
            <defs>
              <marker
                id="arrow-red-4"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#EB3B2D" />
              </marker>
            </defs>
            <rect
              x="10"
              y="10"
              width="800"
              height="220"
              rx="14"
              className="fill-white dark:fill-[#101010] stroke-neutral-200 dark:stroke-white/10"
            />

            {/* Top Memory Banner */}
            <rect
              x="36"
              y="28"
              width="748"
              height="44"
              rx="8"
              className="fill-neutral-900 dark:fill-[#191313] stroke-[#EB3B2D]/60"
            />
            <text x="54" y="54" className="fill-[#EB3B2D] font-mono text-[11px] font-semibold">
              PERSISTENT PROJECT MEMORY:
            </text>
            <text x="262" y="54" className="fill-neutral-200 font-sans text-[12px]">
              Goal · Target Audience · Style &amp; Tone · Uploaded Corpus · Task Checklist
            </text>

            {/* 3 Stage Clusters */}
            <rect
              x="36"
              y="96"
              width="224"
              height="112"
              rx="10"
              className="fill-neutral-100 dark:fill-[#161616] stroke-neutral-300 dark:stroke-white/10"
            />
            <text x="54" y="122" className="fill-[#EB3B2D] font-mono text-[10px]">
              STAGES 01 – 03
            </text>
            <text
              x="54"
              y="144"
              className="fill-neutral-900 dark:fill-white font-sans text-[13px] font-bold"
            >
              Concept &amp; Direction
            </text>
            <text x="54" y="168" className="fill-neutral-600 dark:fill-neutral-400 font-sans text-[11px]">
              1. Ideation &amp; Concept Brief
            </text>
            <text x="54" y="186" className="fill-neutral-600 dark:fill-neutral-400 font-sans text-[11px]">
              2. Grounded Research · 3. Visual Tone
            </text>

            <line
              x1="262"
              y1="152"
              x2="294"
              y2="152"
              stroke="#EB3B2D"
              strokeWidth="2"
              markerEnd="url(#arrow-red-4)"
            />

            <rect
              x="300"
              y="96"
              width="224"
              height="112"
              rx="10"
              className="fill-neutral-100 dark:fill-[#161616] stroke-neutral-300 dark:stroke-white/10"
            />
            <text x="318" y="122" className="fill-[#EB3B2D] font-mono text-[10px]">
              STAGES 04 – 07
            </text>
            <text
              x="318"
              y="144"
              className="fill-neutral-900 dark:fill-white font-sans text-[13px] font-bold"
            >
              Build &amp; Synthesis
            </text>
            <text x="318" y="168" className="fill-neutral-600 dark:fill-neutral-400 font-sans text-[11px]">
              4. Technical Architecture · 5. Prototypes
            </text>
            <text x="318" y="186" className="fill-neutral-600 dark:fill-neutral-400 font-sans text-[11px]">
              6. Visual/Audio Assets · 7. Motion Flow
            </text>

            <line
              x1="526"
              y1="152"
              x2="558"
              y2="152"
              stroke="#EB3B2D"
              strokeWidth="2"
              markerEnd="url(#arrow-red-4)"
            />

            <rect
              x="564"
              y="96"
              width="220"
              height="112"
              rx="10"
              className="fill-neutral-100 dark:fill-[#161616] stroke-neutral-300 dark:stroke-white/10"
            />
            <text x="582" y="122" className="fill-[#EB3B2D] font-mono text-[10px]">
              STAGES 08 – 10
            </text>
            <text
              x="582"
              y="144"
              className="fill-neutral-900 dark:fill-white font-sans text-[13px] font-bold"
            >
              Audit &amp; Delivery
            </text>
            <text x="582" y="168" className="fill-neutral-600 dark:fill-neutral-400 font-sans text-[11px]">
              8. Quality &amp; Accessibility Review
            </text>
            <text x="582" y="186" className="fill-neutral-600 dark:fill-neutral-400 font-sans text-[11px]">
              9. Brief Export · 10. Final Release
            </text>
          </svg>
        )}

        {diagramId === 'guide-prompt-cycle' && (
          <svg
            viewBox="0 0 820 220"
            className="w-full h-auto"
            role="img"
            aria-label={meta.ariaLabel}
          >
            <defs>
              <marker
                id="arrow-red-5"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#EB3B2D" />
              </marker>
            </defs>
            <rect
              x="10"
              y="10"
              width="800"
              height="200"
              rx="14"
              className="fill-white dark:fill-[#101010] stroke-neutral-200 dark:stroke-white/10"
            />
            {[
              { x: 32, tag: '01 · GOAL', heading: 'Define Intent', detail: 'Audience, tone & format' },
              { x: 224, tag: '02 · CONTEXT', heading: 'Select Mode', detail: 'Attach PDFs/CSVs/Images' },
              { x: 416, tag: '03 · VERIFY', heading: 'Review Output', detail: 'Check code & source links' },
              { x: 608, tag: '04 · SHIP', heading: 'Refine or Save', detail: 'Pin to Project or export' },
            ].map((item, i) => (
              <g key={item.tag}>
                <rect
                  x={item.x}
                  y="44"
                  width="172"
                  height="132"
                  rx="10"
                  className="fill-neutral-100 dark:fill-[#161616] stroke-neutral-300 dark:stroke-white/10"
                />
                <text x={item.x + 16} y="74" className="fill-[#EB3B2D] font-mono text-[10px]">
                  {item.tag}
                </text>
                <text
                  x={item.x + 16}
                  y="102"
                  className="fill-neutral-900 dark:fill-white font-sans text-[14px] font-bold"
                >
                  {item.heading}
                </text>
                <text
                  x={item.x + 16}
                  y="130"
                  className="fill-neutral-600 dark:fill-neutral-400 font-sans text-[11px]"
                >
                  {item.detail}
                </text>
                {i < 3 && (
                  <line
                    x1={item.x + 174}
                    y1="110"
                    x2={item.x + 190}
                    y2="110"
                    stroke="#EB3B2D"
                    strokeWidth="2"
                    markerEnd="url(#arrow-red-5)"
                  />
                )}
              </g>
            ))}
          </svg>
        )}

        {diagramId === 'responsible-grounding' && (
          <svg
            viewBox="0 0 820 240"
            className="w-full h-auto"
            role="img"
            aria-label={meta.ariaLabel}
          >
            <defs>
              <marker
                id="arrow-red-6"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#EB3B2D" />
              </marker>
            </defs>
            <rect
              x="10"
              y="10"
              width="800"
              height="220"
              rx="14"
              className="fill-white dark:fill-[#101010] stroke-neutral-200 dark:stroke-white/10"
            />
            <rect
              x="34"
              y="52"
              width="210"
              height="136"
              rx="10"
              className="fill-neutral-100 dark:fill-[#161616] stroke-neutral-300 dark:stroke-white/10"
            />
            <text x="52" y="80" className="fill-[#EB3B2D] font-mono text-[10px]">
              TRUST LAYER 01
            </text>
            <text
              x="52"
              y="104"
              className="fill-neutral-900 dark:fill-white font-sans text-[14px] font-bold"
            >
              Safety &amp; Boundaries
            </text>
            <text x="52" y="130" className="fill-neutral-600 dark:fill-neutral-400 font-sans text-[11px]">
              • 18+ adult studio eligibility
            </text>
            <text x="52" y="150" className="fill-neutral-600 dark:fill-neutral-400 font-sans text-[11px]">
              • Automated abuse &amp; safety filters
            </text>
            <text x="52" y="170" className="fill-neutral-600 dark:fill-neutral-400 font-sans text-[11px]">
              • Clear policy &amp; consent controls
            </text>

            <line
              x1="246"
              y1="120"
              x2="296"
              y2="120"
              stroke="#EB3B2D"
              strokeWidth="2"
              markerEnd="url(#arrow-red-6)"
            />

            <rect
              x="304"
              y="52"
              width="210"
              height="136"
              rx="10"
              className="fill-neutral-900 dark:fill-[#181313] stroke-[#EB3B2D]/70"
            />
            <text x="322" y="80" className="fill-[#EB3B2D] font-mono text-[10px]">
              TRUST LAYER 02
            </text>
            <text x="322" y="104" className="fill-white font-sans text-[14px] font-bold">
              Source Grounding
            </text>
            <text x="322" y="130" className="fill-neutral-300 font-sans text-[11px]">
              • Live search verification
            </text>
            <text x="322" y="150" className="fill-neutral-300 font-sans text-[11px]">
              • Zero fabricated citations
            </text>
            <text x="322" y="170" className="fill-neutral-300 font-sans text-[11px]">
              • Transparent uncertainty notices
            </text>

            <line
              x1="516"
              y1="120"
              x2="566"
              y2="120"
              stroke="#EB3B2D"
              strokeWidth="2"
              markerEnd="url(#arrow-red-6)"
            />

            <rect
              x="574"
              y="52"
              width="210"
              height="136"
              rx="10"
              className="fill-neutral-100 dark:fill-[#161616] stroke-neutral-300 dark:stroke-white/10"
            />
            <text x="592" y="80" className="fill-[#EB3B2D] font-mono text-[10px]">
              TRUST LAYER 03
            </text>
            <text
              x="592"
              y="104"
              className="fill-neutral-900 dark:fill-white font-sans text-[14px] font-bold"
            >
              AI Provenance &amp; Control
            </text>
            <text x="592" y="130" className="fill-neutral-600 dark:fill-neutral-400 font-sans text-[11px]">
              • Machine-readable image metadata
            </text>
            <text x="592" y="150" className="fill-neutral-600 dark:fill-neutral-400 font-sans text-[11px]">
              • Self-service export &amp; deletion
            </text>
            <text x="592" y="170" className="fill-neutral-600 dark:fill-neutral-400 font-sans text-[11px]">
              • Granular cookie preferences
            </text>
          </svg>
        )}
      </div>

      <div className="px-5 py-3 border-t border-neutral-200 dark:border-white/[0.06] text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
        {meta.caption}
      </div>
    </figure>
  );
};
