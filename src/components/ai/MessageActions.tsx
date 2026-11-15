import React, { useState } from 'react';
import { Copy, Check, RotateCw, ThumbsUp, ThumbsDown, Edit3, X, Send, Flag, AlertCircle } from 'lucide-react';
import { omniaLearningService } from '../../services/omniaLearningService';
import { auth } from '../../lib/firebase';

function getClientSessionHeaderId(): string {
  try {
    const key = 'vizra_client_tenant_id_v1';
    let id = localStorage.getItem(key);
    if (!id || !/^[a-zA-Z0-9_-]{4,64}$/.test(id)) {
      id = `cli_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return 'cli_anonymous';
  }
}

interface MessageActionsProps {
  content: string;
  question?: string;
  retrievedSources?: any[];
  onRegenerate: () => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  content,
  question,
  retrievedSources,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'HELPFUL' | 'NOT_HELPFUL' | null>(null);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [correctionText, setCorrectionText] = useState('');
  const [correctionSubmitted, setCorrectionSubmitted] = useState(false);

  const [isSafetyReportOpen, setIsSafetyReportOpen] = useState(false);
  const [safetyReason, setSafetyReason] = useState('Harmful or unsafe content');
  const [safetyDetails, setSafetyDetails] = useState('');
  const [safetySubmitted, setSafetySubmitted] = useState(false);
  const [isSubmittingSafety, setIsSubmittingSafety] = useState(false);
  const [safetyError, setSafetyError] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleThumbs = (type: 'HELPFUL' | 'NOT_HELPFUL') => {
    const next = feedback === type ? null : type;
    setFeedback(next);
    if (next) {
      omniaLearningService.submitFeedback({
        question: question || 'Omnia Conversational Query',
        answer: content,
        retrievedSources,
        userFeedback: next,
      });
    }
  };

  const handleSubmitCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionText.trim()) return;

    omniaLearningService.submitFeedback({
      question: question || 'Omnia Conversational Query',
      answer: content,
      retrievedSources,
      userFeedback: 'CORRECTION',
      correction: correctionText.trim(),
    });

    setCorrectionSubmitted(true);
    setTimeout(() => {
      setIsCorrectionOpen(false);
      setCorrectionSubmitted(false);
      setCorrectionText('');
    }, 1800);
  };

  const handleSubmitSafetyReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingSafety) return;
    setSafetyError(null);
    setIsSubmittingSafety(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Vizra-Client-Id': getClientSessionHeaderId(),
      };
      if (auth?.currentUser) {
        try {
          const idToken = await auth.currentUser.getIdToken();
          if (idToken) headers.Authorization = `Bearer ${idToken}`;
        } catch {
          // Proceed anonymously if token refresh fails
        }
      }

      const res = await fetch('/api/safety/report', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messageId: `msg_${Date.now().toString(36)}`,
          reason: safetyReason,
          details: safetyDetails.trim() || content.slice(0, 300),
          modelId: 'omnia-1.0',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSafetyError(
          data?.error?.message || `Failed to submit safety report (HTTP ${res.status}). Please retry.`
        );
        return;
      }

      setSafetySubmitted(true);
      setTimeout(() => {
        setIsSafetyReportOpen(false);
        setSafetySubmitted(false);
        setSafetyDetails('');
        setSafetyError(null);
      }, 1800);
    } catch {
      setSafetyError('Network error submitting safety report. Please check your connection and try again.');
    } finally {
      setIsSubmittingSafety(false);
    }
  };

  return (
    <div className="flex flex-col mt-3 pt-2 text-neutral-500 text-xs select-none">
      <div className="flex items-center gap-1">
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
          title="Copy response"
          aria-label="Copy response"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>

        {/* Regenerate button */}
        <button
          onClick={onRegenerate}
          className="p-1.5 rounded-md hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
          title="Regenerate response"
          aria-label="Regenerate response"
        >
          <RotateCw size={14} />
        </button>

        {/* Good response */}
        <button
          onClick={() => handleThumbs('HELPFUL')}
          className={`p-1.5 rounded-md hover:bg-neutral-900 transition-colors cursor-pointer ${
            feedback === 'HELPFUL' ? 'text-emerald-400 bg-neutral-900' : 'hover:text-white'
          }`}
          title="Helpful response"
          aria-label="Helpful response"
        >
          <ThumbsUp size={14} />
        </button>

        {/* Bad response */}
        <button
          onClick={() => handleThumbs('NOT_HELPFUL')}
          className={`p-1.5 rounded-md hover:bg-neutral-900 transition-colors cursor-pointer ${
            feedback === 'NOT_HELPFUL' ? 'text-red-400 bg-neutral-900' : 'hover:text-white'
          }`}
          title="Not helpful"
          aria-label="Not helpful"
        >
          <ThumbsDown size={14} />
        </button>

        {/* Suggest Correction (Learning Pipeline) */}
        <button
          onClick={() => {
            setIsCorrectionOpen(!isCorrectionOpen);
            setIsSafetyReportOpen(false);
          }}
          className={`p-1.5 rounded-md hover:bg-neutral-900 transition-colors cursor-pointer flex items-center gap-1 ${
            isCorrectionOpen ? 'text-[#eb3b2d] bg-neutral-900' : 'hover:text-white'
          }`}
          title="Suggest correction to teach Omnia"
          aria-label="Suggest correction"
        >
          <Edit3 size={13} />
          <span className="text-[10px] hidden sm:inline">Teach / Correct</span>
        </button>

        {/* Report Unsafe Output (AI Safety Governance) */}
        <button
          onClick={() => {
            setIsSafetyReportOpen(!isSafetyReportOpen);
            setIsCorrectionOpen(false);
            setSafetyError(null);
          }}
          className={`p-1.5 rounded-md hover:bg-neutral-900 transition-colors cursor-pointer flex items-center gap-1 ${
            isSafetyReportOpen ? 'text-amber-400 bg-neutral-900' : 'hover:text-white'
          }`}
          title="Report unsafe or inaccurate AI output"
          aria-label="Report unsafe output"
        >
          <Flag size={13} />
          <span className="text-[10px] hidden sm:inline">Report Safety</span>
        </button>

        {feedback && (
          <span className="text-[10px] text-neutral-400 ml-1 font-mono">
            {feedback === 'HELPFUL' ? 'Marked helpful' : 'Marked not helpful'}
          </span>
        )}
      </div>

      {/* Popover / Drawer for submitting correction to continuous learning system */}
      {isCorrectionOpen && (
        <div className="mt-2.5 p-3 rounded-xl bg-neutral-950 border border-neutral-800 max-w-md shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-neutral-300 font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
              <span>Omnia Knowledge Correction</span>
            </div>
            <button
              onClick={() => setIsCorrectionOpen(false)}
              className="text-neutral-500 hover:text-white cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>

          {correctionSubmitted ? (
            <div className="py-2 text-[11px] font-mono text-emerald-400 flex items-center gap-2">
              <Check size={14} />
              <span>Correction logged. Queued for validation &amp; review.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitCorrection} className="space-y-2">
              <p className="text-[11px] text-neutral-400">
                Provide factual corrections or verified details to update Omnia&apos;s knowledge base (do not include personal data):
              </p>
              <textarea
                value={correctionText}
                onChange={(e) => setCorrectionText(e.target.value)}
                placeholder="Enter verified facts or corrections (e.g. The Curiosity rover landed on August 6, 2012 UTC)..."
                rows={2}
                className="w-full px-2.5 py-1.5 text-xs text-white bg-neutral-900 border border-neutral-800 rounded-lg focus:outline-none focus:border-[#eb3b2d] resize-none"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-neutral-500 font-mono">
                  Enters PENDING review before approval
                </span>
                <button
                  type="submit"
                  disabled={!correctionText.trim()}
                  className="px-2.5 py-1 rounded bg-[#eb3b2d] hover:bg-[#eb3b2d]/90 text-white font-medium text-[11px] flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send size={11} />
                  <span>Submit Correction</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Popover / Drawer for reporting unsafe or harmful AI outputs */}
      {isSafetyReportOpen && (
        <div className="mt-2.5 p-3 rounded-xl bg-neutral-950 border border-amber-900/50 max-w-md shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-[11px]">
              <Flag size={12} className="text-amber-400" />
              <span>Report AI Safety or Policy Issue</span>
            </div>
            <button
              onClick={() => setIsSafetyReportOpen(false)}
              className="text-neutral-500 hover:text-white cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>

          {safetySubmitted ? (
            <div className="py-2 text-[11px] font-mono text-emerald-400 flex items-center gap-2">
              <Check size={14} />
              <span>Safety incident logged for Trust &amp; Safety review.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitSafetyReport} className="space-y-2">
              {safetyError && (
                <div
                  role="alert"
                  className="p-2 rounded-lg bg-red-950/40 border border-red-800/60 text-[11px] text-red-200 flex items-start gap-1.5"
                >
                  <AlertCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
                  <span>{safetyError}</span>
                </div>
              )}
              <select
                value={safetyReason}
                onChange={(e) => setSafetyReason(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs text-white bg-neutral-900 border border-neutral-800 rounded-lg focus:outline-none focus:border-amber-500"
              >
                <option value="Harmful or unsafe content">Harmful or unsafe content</option>
                <option value="Inaccurate medical or legal claim">Inaccurate medical, scientific, or legal claim</option>
                <option value="Privacy or personal data concern">Privacy or personal data concern</option>
                <option value="Copyright or attribution issue">Copyright or attribution issue</option>
              </select>
              <textarea
                value={safetyDetails}
                onChange={(e) => setSafetyDetails(e.target.value)}
                placeholder="Optional context about why this output is unsafe or harmful..."
                rows={2}
                className="w-full px-2.5 py-1.5 text-xs text-white bg-neutral-900 border border-neutral-800 rounded-lg focus:outline-none focus:border-amber-500 resize-none"
              />
              <div className="flex items-center justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmittingSafety}
                  className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-black font-semibold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send size={11} />
                  <span>{isSubmittingSafety ? 'Submitting...' : 'Submit Report'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
