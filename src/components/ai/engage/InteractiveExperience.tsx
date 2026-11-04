import React, { useState, useEffect, useRef } from 'react';
import { Cpu, CheckCircle2, RotateCw, Keyboard, Sparkles, Check } from 'lucide-react';
import { EngageContentItem } from '../../../types/engage';

interface InteractiveExperienceProps {
  item: EngageContentItem;
  onInteract?: () => void;
}

export const InteractiveExperience: React.FC<InteractiveExperienceProps> = React.memo(
  ({ item, onInteract }) => {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [copiedPrompt, setCopiedPrompt] = useState(false);
    const [revealedShortcut, setRevealedShortcut] = useState(false);
    const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Reset local state and clear pending timer whenever the active card item changes or unmounts
    useEffect(() => {
      setSelectedOption(null);
      setIsFlipped(false);
      setCopiedPrompt(false);
      setRevealedShortcut(false);

      return () => {
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
          copyTimeoutRef.current = null;
        }
      };
    }, [item.id]);

    const config = item.interactiveConfig;
    const kind = config?.kind || 'poll';

    const handleSelectOption = (idx: number) => {
      setSelectedOption(idx);
      onInteract?.();
    };

    const handleToggleFlip = () => {
      setIsFlipped((prev) => !prev);
      onInteract?.();
    };

    const handleCopyPrompt = (text: string) => {
      try {
        navigator.clipboard?.writeText(text);
        setCopiedPrompt(true);
        onInteract?.();
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }
        copyTimeoutRef.current = setTimeout(() => {
          setCopiedPrompt(false);
          copyTimeoutRef.current = null;
        }, 2000);
      } catch {
        // Ignore clipboard failures in restricted environments
      }
    };

    return (
      <div className="flex items-start gap-3 sm:gap-3.5">
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          {kind === 'shortcut_learning' || kind === 'shortcut_challenge' ? (
            <Keyboard size={18} className="text-[#eb3b2d]" />
          ) : kind === 'prompt_improvement' || kind === 'prompt_spark' ? (
            <Sparkles size={18} className="text-[#eb3b2d]" />
          ) : (
            <Cpu size={18} className="text-[#eb3b2d]" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div>
            {item.subtitle && (
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                {item.subtitle}
              </div>
            )}
            <h4 className="text-xs sm:text-sm font-semibold text-white leading-snug break-words">
              {item.title}
            </h4>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed break-words">
            {item.body}
          </p>

          {/* 1. Prompt Improvement Micro-Experience */}
          {(kind === 'prompt_improvement' || kind === 'prompt_spark') &&
            (config?.beforePrompt || config?.afterPrompt || config?.sparkPrompt) && (
              <div className="pt-1 space-y-2">
                {config.beforePrompt && (
                  <div className="px-2.5 py-1.5 rounded-lg bg-neutral-900/50 border border-neutral-800/80 text-[11px] text-neutral-400 break-words">
                    <span className="font-mono text-[10px] uppercase text-neutral-500 block mb-0.5">
                      Generic Prompt:
                    </span>
                    <span>“{config.beforePrompt}”</span>
                  </div>
                )}
                {(config.afterPrompt || config.sparkPrompt) && (
                  <div className="px-2.5 py-2 rounded-lg bg-neutral-900 border border-neutral-700/80 text-[11px] text-neutral-200 flex flex-col sm:flex-row items-start justify-between gap-2">
                    <div className="min-w-0 break-words">
                      <span className="font-mono text-[10px] uppercase text-[#eb3b2d] block mb-0.5">
                        High-Signal Structured Prompt:
                      </span>
                      <span>“{config.afterPrompt || config.sparkPrompt}”</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyPrompt(config.afterPrompt || config.sparkPrompt || '')
                      }
                      className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] font-mono text-white shrink-0 transition-colors cursor-pointer"
                    >
                      {copiedPrompt ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <Check size={11} /> Copied
                        </span>
                      ) : (
                        'Copy Tip'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

          {/* 2. Quick Concept Flashcard */}
          {kind === 'flashcard' && config?.flashcardFront && config?.flashcardBack && (
            <div className="pt-1">
              <button
                type="button"
                onClick={handleToggleFlip}
                aria-expanded={isFlipped}
                className="w-full text-left px-3 py-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#eb3b2d]">
                    {isFlipped ? 'Concept Answer' : 'Concept Flashcard • Click to Reveal'}
                  </span>
                  <RotateCw size={12} className="text-neutral-400 shrink-0" />
                </div>
                <p className="text-xs text-neutral-200 leading-relaxed break-words">
                  {isFlipped ? config.flashcardBack : config.flashcardFront}
                </p>
              </button>
            </div>
          )}

          {/* 3. Keyboard Shortcut Learning */}
          {(kind === 'shortcut_learning' || kind === 'shortcut_challenge') &&
            config?.shortcutKeys && (
              <div className="pt-1 flex items-center justify-between gap-3 flex-wrap px-3 py-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  {config.shortcutKeys.map((k, idx) => (
                    <kbd
                      key={`${k}-${idx}`}
                      className="px-2 py-1 text-[11px] font-mono font-semibold text-white bg-neutral-950 border border-neutral-700 rounded shadow-xs"
                    >
                      {k}
                    </kbd>
                  ))}
                  {config.shortcutAction && (
                    <span className="text-xs text-neutral-300 ml-1 break-words">
                      {config.shortcutAction}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRevealedShortcut(true);
                    onInteract?.();
                  }}
                  aria-pressed={revealedShortcut}
                  className="text-[10px] font-mono px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer shrink-0"
                >
                  {revealedShortcut ? '✓ Practiced' : 'Mark Learned'}
                </button>
              </div>
            )}

          {/* 4. One-Click Creative Decision / Poll */}
          {(kind === 'poll' || kind === 'creative_decision') &&
            config?.options &&
            config.options.length > 0 && (
              <div className="pt-1 space-y-1.5">
                {config.question && (
                  <div className="text-[11px] font-medium text-neutral-200 break-words">
                    {config.question}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-1.5">
                  {config.options.map((opt, idx) => {
                    const isChosen = selectedOption === idx;
                    const hasCorrectAnswer = typeof config.correctIndex === 'number';
                    const isCorrect = config.correctIndex === idx;

                    return (
                      <button
                        key={`${item.id}-opt-${idx}`}
                        type="button"
                        aria-pressed={isChosen}
                        onClick={() => handleSelectOption(idx)}
                        className={`text-left px-3 py-1.5 rounded-lg border text-[11px] transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                          selectedOption === null
                            ? 'bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
                            : hasCorrectAnswer && isCorrect
                            ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                            : isChosen
                            ? hasCorrectAnswer
                              ? 'bg-red-950/40 border-red-800/60 text-red-200'
                              : 'bg-neutral-800 border-[#eb3b2d]/60 text-white'
                            : 'bg-neutral-900/40 border-neutral-800/50 text-neutral-500'
                        }`}
                      >
                        <span className="break-words">{opt}</span>
                        {selectedOption !== null &&
                          ((hasCorrectAnswer && isCorrect) ||
                            (!hasCorrectAnswer && isChosen)) && (
                            <CheckCircle2
                              size={13}
                              className="text-emerald-400 shrink-0"
                            />
                          )}
                      </button>
                    );
                  })}
                </div>
                {selectedOption !== null && config.explanation && (
                  <div className="text-[11px] text-neutral-300 bg-neutral-900/70 border border-neutral-800 rounded-lg px-2.5 py-1.5 break-words">
                    {config.explanation}
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    );
  }
);
InteractiveExperience.displayName = 'InteractiveExperience';
