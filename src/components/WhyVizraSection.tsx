import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Brain, Sparkles, FolderGit2, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const WhyVizraSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      label: 'ASK',
      title: 'Natural Conversation',
      description: 'Start with raw intuition, questions, code snippets, or ideas in English, Hindi, or Hinglish.',
      icon: MessageSquare,
    },
    {
      step: '02',
      label: 'UNDERSTAND',
      title: 'Intent & Context',
      description: 'Omnia recognizes what you need: quick factual answer, deep research, code, or a structured project.',
      icon: Brain,
    },
    {
      step: '03',
      label: 'CREATE',
      title: 'Direct Synthesis',
      description: 'Generate real assets: 60fps kinetic motion, GLSL shaders, clean TypeScript, or structured outlines.',
      icon: Sparkles,
    },
    {
      step: '04',
      label: 'ORGANIZE',
      title: 'Project Memory',
      description: 'Keep all prompts, files, research notes, and iterations united under one persistent workspace context.',
      icon: FolderGit2,
    },
    {
      step: '05',
      label: 'FINISH',
      title: 'Production Result',
      description: 'Export ready-to-run code, verified citations, and finished deliverables instead of plain text fragments.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="py-24 md:py-32 px-6 md:px-20 bg-black border-t border-neutral-900 relative selection:bg-[#eb3b2d] selection:text-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
            <span>Product Philosophy</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-white mb-6">
            Why Vizra?
          </h2>

          <p className="text-xl md:text-2xl text-neutral-300 font-normal leading-snug">
            “Your ideas shouldn&apos;t have to live across disconnected conversations.”
          </p>

          <p className="text-sm md:text-base text-neutral-400 mt-4 max-w-2xl mx-auto leading-relaxed">
            In standard AI tools, every session starts from zero and ends in a pile of copy-pasted text.
            Vizra unites conversation, intelligence, and execution into one fluid pipeline.
          </p>
        </div>

        {/* The 5-Step Unified Flow: ASK -> UNDERSTAND -> CREATE -> ORGANIZE -> FINISH */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 group-hover:text-[#eb3b2d] transition-colors">
                      {item.step} · {item.label}
                    </span>
                    <Icon size={16} className="text-neutral-500 group-hover:text-white transition-colors" />
                  </div>

                  <h3 className="text-base font-semibold text-white mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-neutral-900/80 flex items-center justify-between text-[11px] font-mono text-neutral-600">
                  <span>Phase {item.step}</span>
                  {index < steps.length - 1 && (
                    <span className="text-neutral-500 font-sans hidden md:inline">→</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Editorial Callout */}
        <div className="mt-12 p-6 rounded-xl bg-neutral-950/60 border border-neutral-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-[#eb3b2d]" />
            <span>
              <strong>Vizra Formula:</strong> Conversation + Context + Creativity + Workflow = Finished Real Work.
            </span>
          </div>

          <Link
            to="/explore"
            className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1 font-medium whitespace-nowrap"
          >
            <span>Learn how Omnia 1.0 powers this</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
};
