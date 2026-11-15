import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export const EarlyAccessForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'animator' | 'motion_designer' | 'developer' | 'creator' | 'beginner'>('motion_designer');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          interest: role,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setError(errData?.error?.message || 'Could not register email at this time.');
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Network error while submitting request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="early-access" className="py-24 md:py-32 px-8 md:px-28 bg-black border-t border-neutral-900 selection:bg-[#eb3b2d] selection:text-white">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 text-xs font-mono text-neutral-500 mb-3 tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
          <span>Private Beta</span>
          <span>·</span>
          <span>Rolling Access</span>
        </div>

        <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-4">
          Experience Omnia 1.0 First.
        </h2>

        <p className="text-neutral-400 text-sm md:text-base max-w-lg mx-auto mb-10 leading-relaxed">
          We are granting access to select motion studios, independent animators, and creative
          developers shaping the next era of intelligent digital art.
        </p>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-2xl bg-neutral-950 border border-neutral-800 max-w-md mx-auto text-center"
          >
            <div className="w-10 h-10 rounded-full bg-[#eb3b2d]/10 text-[#eb3b2d] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              You are on the Omnia 1.0 list
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              We have sent a verification note to <span className="text-white">{email}</span>. Invitations are dispatched weekly.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
            {/* Role Selector */}
            <div className="flex items-center justify-center gap-1.5 p-1 bg-neutral-950 border border-neutral-800 rounded-lg text-xs">
              {[
                { id: 'motion_designer', label: 'Motion' },
                { id: 'animator', label: 'Animator' },
                { id: 'developer', label: 'Developer' },
                { id: 'creator', label: 'Creator' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id as any)}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                    role === r.id
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Email Input & Submit */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter your work email"
                className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-neutral-700 focus:outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <span>Request Access</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {error && <p className="text-xs text-[#eb3b2d] text-left">{error}</p>}

            <p className="text-[11px] text-neutral-500 text-center pt-1">
              Zero spam. Direct SDK and Studio access invites only.
            </p>
          </form>
        )}
      </div>
    </section>
  );
};
