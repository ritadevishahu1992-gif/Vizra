import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  RotateCcw,
  Sliders,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import { resolveRouteSeoPayload } from '../seo/routeMetadata';
import {
  MAX_PROMPT_IDEA_LENGTH,
  OptimizePromptInput,
  OptimizedPromptResult,
  PROMPT_PRESETS,
  PromptDetailLevel,
  PromptPresetId,
  getPresetById,
  optimizeCreativePrompt,
} from '../utils/promptOptimizerEngine';
import { trackConversionEvent } from '../services/conversionTracking';

const TOOL_FAQS = [
  {
    question: 'Do I need to sign up or enter an API key to use the AI Prompt Optimizer?',
    answer:
      'No. The VIZRA AI Prompt Optimizer runs entirely in your browser with zero registration, zero credit card, and zero external API keys required.',
  },
  {
    question: 'Which AI tools work with the prompts generated here?',
    answer:
      'The structured output works directly inside VIZRA Omnia 1.0 (via the one-click "Run in Omnia 1.0" button) as well as any modern text, code, visual direction, or audio AI workflow.',
  },
  {
    question: 'Does this tool store or publish the prompts I type?',
    answer:
      'No. Your draft prompt is processed deterministically inside your local browser session. If you click "Run in Omnia 1.0", it passes your optimized text into your own Omnia composer via browser sessionStorage.',
  },
  {
    question: 'How does the structural rubric evaluate my raw prompt?',
    answer:
      'Rather than inventing an arbitrary AI quality score, the optimizer checks six concrete structural elements: Subject & Objective, Audience/Context, Visual or Technical Specs, Deliverable Format, Negative Constraints, and Verification Criteria — then automatically supplies any missing blocks.',
  },
];

export const PromptOptimizerPage: React.FC = () => {
  const navigate = useNavigate();
  const routeSeo = resolveRouteSeoPayload('/free-ai-prompt-optimizer');

  const [presetId, setPresetId] = useState<PromptPresetId>('motion-design');
  const [rawIdea, setRawIdea] = useState<string>(PROMPT_PRESETS[0].sampleIdea);
  const [targetFormat, setTargetFormat] = useState<string>(PROMPT_PRESETS[0].defaultFormat);
  const [tone, setTone] = useState<string>(PROMPT_PRESETS[0].defaultTone);
  const [audience, setAudience] = useState<string>('');
  const [exclusions, setExclusions] = useState<string>(PROMPT_PRESETS[0].sampleExclusions);
  const [detailLevel, setDetailLevel] = useState<PromptDetailLevel>('production');

  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [result, setResult] = useState<OptimizedPromptResult>(() =>
    optimizeCreativePrompt({
      rawIdea: PROMPT_PRESETS[0].sampleIdea,
      presetId: 'motion-design',
      targetFormat: PROMPT_PRESETS[0].defaultFormat,
      tone: PROMPT_PRESETS[0].defaultTone,
      detailLevel: 'production',
      audience: '',
      exclusions: PROMPT_PRESETS[0].sampleExclusions,
    })
  );

  const activePreset = useMemo(() => getPresetById(presetId), [presetId]);

  useEffect(() => {
    trackConversionEvent('organic_landing_visit', {
      page: '/free-ai-prompt-optimizer',
      category: 'Free Utility Tool',
    });
  }, []);

  const runOptimization = (overrides?: Partial<OptimizePromptInput>) => {
    const nextInput: OptimizePromptInput = {
      rawIdea: overrides?.rawIdea ?? rawIdea,
      presetId: overrides?.presetId ?? presetId,
      targetFormat: overrides?.targetFormat ?? targetFormat,
      tone: overrides?.tone ?? tone,
      detailLevel: overrides?.detailLevel ?? detailLevel,
      audience: overrides?.audience ?? audience,
      exclusions: overrides?.exclusions ?? exclusions,
    };

    const trimmed = nextInput.rawIdea.trim();
    if (!trimmed) {
      setError('Enter a creative idea or rough prompt (at least a few words) to optimize.');
      return;
    }
    if (trimmed.length > MAX_PROMPT_IDEA_LENGTH) {
      setError(
        `Your input exceeds the ${MAX_PROMPT_IDEA_LENGTH.toLocaleString()} character limit. Shorten it slightly and try again.`
      );
      return;
    }

    setError(null);
    const optimized = optimizeCreativePrompt(nextInput);
    setResult(optimized);
    setCopied(false);

    trackConversionEvent('free_tool_used', {
      tool: 'prompt_optimizer',
      action: 'optimize',
      preset: nextInput.presetId,
    });
  };

  const handleSelectPreset = (nextId: PromptPresetId) => {
    const nextPreset = getPresetById(nextId);
    setPresetId(nextId);
    setTargetFormat(nextPreset.defaultFormat);
    setTone(nextPreset.defaultTone);
    setExclusions(nextPreset.sampleExclusions);

    // If current input is empty or matches another preset's sample, update to the new preset's sample
    const isUsingSampleOrEmpty =
      !rawIdea.trim() || PROMPT_PRESETS.some((p) => p.sampleIdea === rawIdea.trim());
    const nextIdea = isUsingSampleOrEmpty ? nextPreset.sampleIdea : rawIdea;
    if (isUsingSampleOrEmpty) {
      setRawIdea(nextIdea);
    }

    setError(null);
    setCopied(false);
    setResult(
      optimizeCreativePrompt({
        rawIdea: nextIdea,
        presetId: nextId,
        targetFormat: nextPreset.defaultFormat,
        tone: nextPreset.defaultTone,
        detailLevel,
        audience,
        exclusions: nextPreset.sampleExclusions,
      })
    );

    trackConversionEvent('free_tool_used', {
      tool: 'prompt_optimizer',
      action: 'preset_selected',
      preset: nextId,
    });
  };

  const handleCopyPrompt = async () => {
    if (!result.optimizedPrompt) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(result.optimizedPrompt);
      } else {
        const temp = document.createElement('textarea');
        temp.value = result.optimizedPrompt;
        temp.setAttribute('readonly', 'true');
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }
      setCopied(true);
      trackConversionEvent('free_tool_used', {
        tool: 'prompt_optimizer',
        action: 'copy',
        preset: presetId,
      });
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setError('Clipboard access was blocked by your browser. Select and copy the prompt text manually.');
    }
  };

  const handleRunInOmnia = () => {
    if (!result.optimizedPrompt) return;
    try {
      sessionStorage.setItem('vizra_initial_prompt', result.optimizedPrompt);
    } catch {
      // Proceed even if storage is restricted
    }
    trackConversionEvent('free_tool_used', {
      tool: 'prompt_optimizer',
      action: 'launch_omnia',
      preset: presetId,
    });
    navigate('/ai');
  };

  const handleReset = () => {
    setRawIdea('');
    setAudience('');
    setExclusions('');
    setTargetFormat(activePreset.defaultFormat);
    setTone(activePreset.defaultTone);
    setError(null);
    setCopied(false);
  };

  const presentCount = result.audit.filter((d) => d.presentInRaw).length;

  return (
    <PageLayout
      title={routeSeo.title}
      description={routeSeo.description}
      canonicalPath="/free-ai-prompt-optimizer"
    >
      {/* Header */}
      <section className="pt-28 md:pt-32 pb-10 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-white/[0.06]">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-neutral-400 mb-5"
        >
          <Link to="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight size={13} className="text-neutral-600" aria-hidden="true" />
          <Link to="/tools" className="hover:text-white transition-colors">
            Tools
          </Link>
          <ChevronRight size={13} className="text-neutral-600" aria-hidden="true" />
          <span className="text-neutral-200">Free AI Prompt Optimizer</span>
        </nav>

        <div className="max-w-3xl space-y-3">
          <div className="typo-eyebrow">Free Creative Utility · No Registration Required</div>
          <h1 className="typo-page-title">Free AI Prompt Optimizer for Creative Workflows</h1>
          <p className="typo-body-lg text-neutral-300">
            Transform rough ideas into structured, production-ready prompts for motion design, visual art direction, WebGL/GLSL shaders, storyboards, research briefs, and AI music — instantly in your browser.
          </p>
        </div>
      </section>

      {/* Interactive Workbench */}
      <section className="py-10 md:py-14 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-white/[0.06]">
        {/* Preset Selector Strip */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-3">
            <label className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              1. Choose Creative Discipline
            </label>
            <span className="text-xs text-neutral-400 hidden sm:inline">
              {activePreset.description}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PROMPT_PRESETS.map((preset) => {
              const active = preset.id === presetId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-[#111111] text-neutral-300 border-white/[0.08] hover:border-white/[0.2] hover:text-white'
                  }`}
                >
                  {preset.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Two-Column Input / Output Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Builder Form */}
          <div className="lg:col-span-6 rounded-2xl border border-white/[0.08] bg-[#111111] p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sliders size={15} className="text-[#EB3B2D]" aria-hidden="true" />
                <h2 className="font-display text-base font-semibold text-white">
                  2. Input Your Rough Idea &amp; Controls
                </h2>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-neutral-400 hover:text-white inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw size={12} aria-hidden="true" />
                <span>Clear</span>
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="prompt-raw-idea"
                  className="text-xs font-medium text-neutral-300"
                >
                  Raw Creative Idea or Prompt *
                </label>
                <span className="text-[11px] font-mono text-neutral-500 tabular-nums">
                  {rawIdea.length}/{MAX_PROMPT_IDEA_LENGTH}
                </span>
              </div>
              <textarea
                id="prompt-raw-idea"
                rows={4}
                value={rawIdea}
                onChange={(e) => {
                  setRawIdea(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Describe what you want to create, code, direct, or research..."
                className="w-full px-4 py-3 rounded-xl bg-[#090909] border border-white/[0.1] focus:border-[#EB3B2D] focus:outline-none text-sm text-white placeholder-neutral-500 resize-y leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="prompt-format"
                  className="block text-xs font-medium text-neutral-300 mb-1.5"
                >
                  Target Deliverable Format
                </label>
                <input
                  id="prompt-format"
                  type="text"
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090909] border border-white/[0.1] focus:border-[#EB3B2D] focus:outline-none text-xs sm:text-sm text-white placeholder-neutral-500"
                />
              </div>

              <div>
                <label
                  htmlFor="prompt-tone"
                  className="block text-xs font-medium text-neutral-300 mb-1.5"
                >
                  Tone &amp; Craft Style
                </label>
                <input
                  id="prompt-tone"
                  type="text"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090909] border border-white/[0.1] focus:border-[#EB3B2D] focus:outline-none text-xs sm:text-sm text-white placeholder-neutral-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="prompt-audience"
                  className="block text-xs font-medium text-neutral-300 mb-1.5"
                >
                  Target Audience / Context (Optional)
                </label>
                <input
                  id="prompt-audience"
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g., Creative directors, indie game studio..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090909] border border-white/[0.1] focus:border-[#EB3B2D] focus:outline-none text-xs sm:text-sm text-white placeholder-neutral-500"
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Detail Depth
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'concise', label: 'Concise' },
                      { id: 'production', label: 'Production' },
                      { id: 'exhaustive', label: 'Exhaustive' },
                    ] as Array<{ id: PromptDetailLevel; label: string }>
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDetailLevel(opt.id)}
                      className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        detailLevel === opt.id
                          ? 'bg-white text-black border-white font-semibold'
                          : 'bg-[#090909] text-neutral-400 border-white/[0.08] hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="prompt-exclusions"
                className="block text-xs font-medium text-neutral-300 mb-1.5"
              >
                Negative Constraints / What to Avoid (Optional)
              </label>
              <input
                id="prompt-exclusions"
                type="text"
                value={exclusions}
                onChange={(e) => setExclusions(e.target.value)}
                placeholder="e.g., No buzzwords, no cliché neon lighting, no fabricated stats..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090909] border border-white/[0.1] focus:border-[#EB3B2D] focus:outline-none text-xs sm:text-sm text-white placeholder-neutral-500"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-[#EB3B2D]/40 bg-[#EB3B2D]/10 px-4 py-3 flex items-start gap-2.5 text-xs text-[#FCA5A5]"
              >
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-[#EB3B2D]" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setRawIdea(activePreset.sampleIdea);
                  setExclusions(activePreset.sampleExclusions);
                  runOptimization({
                    rawIdea: activePreset.sampleIdea,
                    exclusions: activePreset.sampleExclusions,
                  });
                }}
                className="text-xs text-neutral-400 hover:text-white underline underline-offset-4 cursor-pointer"
              >
                Load sample for {activePreset.shortLabel}
              </button>

              <button
                type="button"
                onClick={() => runOptimization()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-display font-semibold text-sm hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                <Wand2 size={15} className="text-[#DC2626]" aria-hidden="true" />
                <span>Optimize Prompt</span>
              </button>
            </div>
          </div>

          {/* Right: Structured Output & Rubric Audit */}
          <div className="lg:col-span-6 space-y-5">
            <div className="rounded-2xl border border-white/[0.1] bg-[#111111] p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-semibold text-white">
                    3. Production-Ready Optimized Prompt
                  </h2>
                  <p className="text-xs font-mono text-neutral-400 mt-0.5 tabular-nums">
                    {result.wordCountBefore} words → {result.wordCountAfter} words · Suggested Omnia Mode: {result.recommendedOmniaMode}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#090909] border border-white/[0.14] hover:border-white/[0.3] text-xs font-medium text-white transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check size={13} className="text-emerald-400" aria-hidden="true" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} aria-hidden="true" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleRunInOmnia}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EB3B2D] hover:bg-[#DC2626] text-xs font-display font-semibold text-white transition-colors cursor-pointer"
                  >
                    <Sparkles size={13} aria-hidden="true" />
                    <span>Run in Omnia 1.0</span>
                  </button>
                </div>
              </div>

              <pre className="w-full rounded-xl bg-[#090909] border border-white/[0.08] p-4 text-xs sm:text-sm text-neutral-100 font-mono whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto">
                {result.optimizedPrompt}
              </pre>

              {/* What Changed Checklist */}
              <div className="pt-2 border-t border-white/[0.06] space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  Structural Improvements Applied
                </div>
                <ul className="space-y-1.5">
                  {result.improvements.map((imp) => (
                    <li
                      key={imp}
                      className="flex items-start gap-2 text-xs text-neutral-300 leading-relaxed"
                    >
                      <CheckCircle2
                        size={13}
                        className="text-[#EB3B2D] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Deterministic 6-Point Rubric Panel */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-sm font-semibold text-white">
                  Input Structural Rubric Audit
                </h3>
                <span className="text-xs font-mono text-neutral-400 tabular-nums">
                  {presentCount}/6 detected in raw draft · 6/6 covered in output
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {result.audit.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-[#090909] border border-white/[0.06] p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-neutral-100">{item.label}</span>
                      <span
                        className={`font-mono text-[10px] ${
                          item.presentInRaw ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {item.presentInRaw ? 'In Draft' : 'Added'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      {item.guidance}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Educational Section: Why Structured Prompts Outperform One-Liners */}
      <section className="py-16 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="max-w-3xl mb-10 space-y-2">
          <div className="typo-eyebrow">Prompt Engineering Guide</div>
          <h2 className="typo-section-title">
            Why Structured Prompts Cut Creative Iteration Time
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
            Vague one-line prompts force AI models to guess your aesthetic, technical constraints, and deliverable structure. Separating role, objective, concrete specifications, format, and exclusions consistently yields cleaner first drafts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <article className="rounded-2xl border border-white/[0.08] bg-[#111111] p-6 space-y-2.5">
            <div className="text-xs font-mono text-[#EB3B2D]">01 · Role &amp; Objective</div>
            <h3 className="font-display text-base font-semibold text-white">
              Anchor Domain Vocabulary
            </h3>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Naming the creative craft (e.g., Motion Director vs Staff WebGL Engineer) shifts the model away from generic explanations toward production-grade specs, units, and timing language.
            </p>
          </article>

          <article className="rounded-2xl border border-white/[0.08] bg-[#111111] p-6 space-y-2.5">
            <div className="text-xs font-mono text-[#EB3B2D]">02 · Explicit Deliverable Format</div>
            <h3 className="font-display text-base font-semibold text-white">
              Prevent Wall-of-Text Responses
            </h3>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Defining an exact section outline — such as a beat-by-beat timeline, uniform contract, or two-column AV script — makes outputs immediately usable in real studio handoffs.
            </p>
          </article>

          <article className="rounded-2xl border border-white/[0.08] bg-[#111111] p-6 space-y-2.5">
            <div className="text-xs font-mono text-[#EB3B2D]">03 · Negative Constraints</div>
            <h3 className="font-display text-base font-semibold text-white">
              Eliminate Clichés &amp; Hallucinations
            </h3>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Explicit exclusions stop generic filler, unwanted visual tropes, and fabricated statistics before the model generates them.
            </p>
          </article>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-6 sm:px-10 lg:px-16 max-w-4xl mx-auto border-b border-white/[0.06]">
        <div className="mb-8 space-y-2">
          <div className="typo-eyebrow">Tool FAQs</div>
          <h2 className="typo-section-title">Questions About the AI Prompt Optimizer</h2>
        </div>

        <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {TOOL_FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={faq.question} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 text-left py-1 cursor-pointer group"
                >
                  <span className="font-display text-sm sm:text-base font-semibold text-white group-hover:text-[#EB3B2D] transition-colors">
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-neutral-400 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-white' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <p className="pt-3 pr-8 text-sm text-neutral-300 leading-relaxed">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Internal Links & Studio CTA */}
      <section className="py-16 md:py-20 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          <Link
            to="/ai-creative-studio"
            className="rounded-2xl border border-white/[0.08] bg-[#111111] hover:border-white/[0.2] p-5 transition-colors group"
          >
            <div className="font-display text-sm font-semibold text-white group-hover:text-[#EB3B2D] flex items-center justify-between mb-1.5">
              <span>VIZRA AI Creative Studio</span>
              <ArrowUpRight size={14} className="text-neutral-500" aria-hidden="true" />
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Run optimized prompts inside Omnia 1.0 alongside code, visual synthesis, and Lyria 3 audio.
            </p>
          </Link>

          <Link
            to="/ai-tools-for-motion-designers"
            className="rounded-2xl border border-white/[0.08] bg-[#111111] hover:border-white/[0.2] p-5 transition-colors group"
          >
            <div className="font-display text-sm font-semibold text-white group-hover:text-[#EB3B2D] flex items-center justify-between mb-1.5">
              <span>AI Tools for Motion Designers</span>
              <ArrowUpRight size={14} className="text-neutral-500" aria-hidden="true" />
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              See how motion designers combine GLSL shaders, storyboards, and WAV audio in VIZRA.
            </p>
          </Link>

          <Link
            to="/alternatives"
            className="rounded-2xl border border-white/[0.08] bg-[#111111] hover:border-white/[0.2] p-5 transition-colors group"
          >
            <div className="font-display text-sm font-semibold text-white group-hover:text-[#EB3B2D] flex items-center justify-between mb-1.5">
              <span>Compare Creative AI Platforms</span>
              <ArrowUpRight size={14} className="text-neutral-500" aria-hidden="true" />
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Read honest side-by-side comparisons against Canva, Runway, Krea AI, and Adobe Express.
            </p>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/[0.1] bg-[#111111] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-display text-2xl font-semibold text-white">
              Ready to run your optimized prompt?
            </h2>
            <p className="text-sm text-neutral-300">
              Open Omnia 1.0 directly with your prompt loaded, or explore VIZRA’s 10-stage creative workspace on the Creator Free tier.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRunInOmnia}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-display font-semibold text-sm hover:bg-neutral-200 transition-colors cursor-pointer shrink-0"
          >
            <span>Open in Omnia 1.0</span>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </section>
    </PageLayout>
  );
};
