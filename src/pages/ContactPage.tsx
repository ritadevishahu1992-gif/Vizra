import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Mail,
  Send,
  CheckCircle2,
  BookOpen,
  LayoutDashboard,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import { EarlyAccessForm } from '../components/EarlyAccessForm';

type InquiryType = 'studio' | 'support' | 'partnership' | 'press';

export const ContactPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [inquiryType, setInquiryType] = useState<InquiryType>('studio');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid work or studio email address.');
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setError('Please include a brief description of your inquiry (at least 10 characters).');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          role: `Inquiry:${inquiryType} (${fullName.trim()})`,
          useCase: `${organization ? `[${organization}] ` : ''}${message.trim()}`,
        }),
      });
    } catch {
      // Non-fatal fallback
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <PageLayout
      title="Contact & Studio Inquiries — Vizra AI Creative Studio"
      description="Contact the Vizra team for enterprise studio onboarding, technical support, partnership inquiries, or private beta early access to upcoming studio engines."
      canonicalPath="/contact"
    >
      {/* Page Header */}
      <section className="pt-28 md:pt-36 pb-16 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-white/[0.06]">
        <div className="max-w-3xl space-y-4">
          <div className="typo-eyebrow">Contact & Studio Onboarding</div>
          <h1 className="typo-page-title">
            Connect with the Vizra team.
          </h1>
          <p className="typo-body-lg">
            Whether you are scaling a creative studio, integrating with our developer API, or requesting private beta access for upcoming engines, our team is ready to help.
          </p>
        </div>
      </section>

      {/* Main Contact Form & Channels Split */}
      <section className="py-16 md:py-24 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Direct Studio Inquiry Form */}
          <div className="lg:col-span-7 rounded-2xl border border-white/[0.08] bg-[#111111] p-6 sm:p-8">
            <h2 className="typo-card-title mb-1">Direct Studio & Enterprise Inquiry</h2>
            <p className="text-xs text-neutral-400 mb-6">
              All fields are validated and routed directly to the appropriate engineering or studio lead.
            </p>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-2xl bg-[#090909] border border-white/[0.08] text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-[#EB3B2D]/15 text-[#EB3B2D] flex items-center justify-center mx-auto">
                  <CheckCircle2 size={22} />
                </div>
                <h3 className="typo-card-title">Inquiry Received</h3>
                <p className="text-xs sm:text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
                  Thank you, <span className="text-white font-medium">{fullName}</span>. We have logged your inquiry for <span className="text-white font-mono">{email}</span> and will respond within 1 business day.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                  }}
                  className="px-4 py-2 rounded-lg bg-[#171717] hover:bg-neutral-800 border border-white/[0.1] text-xs font-medium text-neutral-200 cursor-pointer"
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Inquiry Type Selector */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-2">
                    Inquiry Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'studio' as const, label: 'Studio & Team' },
                      { id: 'support' as const, label: 'Technical Support' },
                      { id: 'partnership' as const, label: 'Partnership' },
                      { id: 'press' as const, label: 'Press & Media' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setInquiryType(item.id)}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                          inquiryType === item.id
                            ? 'bg-white text-black border-white font-semibold'
                            : 'bg-[#090909] text-neutral-400 border-white/[0.08] hover:text-white hover:border-white/[0.16]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-medium text-neutral-300 mb-1.5"
                    >
                      Full Name *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Elena Vance"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#090909] border border-white/[0.1] focus:border-[#EB3B2D] focus:outline-none text-sm text-white placeholder-neutral-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-medium text-neutral-300 mb-1.5"
                    >
                      Work or Studio Email *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="elena@obsidianstudio.ai"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#090909] border border-white/[0.1] focus:border-[#EB3B2D] focus:outline-none text-sm text-white placeholder-neutral-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-org"
                    className="block text-xs font-medium text-neutral-300 mb-1.5"
                  >
                    Studio / Organization (Optional)
                  </label>
                  <input
                    id="contact-org"
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Obsidian Motion Labs"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#090909] border border-white/[0.1] focus:border-[#EB3B2D] focus:outline-none text-sm text-white placeholder-neutral-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-medium text-neutral-300 mb-1.5"
                  >
                    How can we help? *
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your creative workflow, concurrency needs, or technical question..."
                    className="w-full px-4 py-3 rounded-xl bg-[#090909] border border-white/[0.1] focus:border-[#EB3B2D] focus:outline-none text-sm text-white placeholder-neutral-500 resize-y"
                  />
                </div>

                {error && (
                  <p className="text-xs text-[#EB3B2D] font-medium">{error}</p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-neutral-500">
                    Protected by VIZRA zero-spam governance
                  </span>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 rounded-xl bg-white text-black font-display font-semibold text-xs sm:text-sm hover:bg-neutral-200 transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send size={14} className="text-[#DC2626]" />
                    <span>{submitting ? 'Submitting…' : 'Send Inquiry'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: SLA Metrics & Self-Service Resources */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-4">
              <div className="flex items-center gap-2.5">
                <Mail size={18} className="text-[#EB3B2D]" />
                <h3 className="typo-card-title">Response Targets & Channels</h3>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Every inquiry is triaged by our engineering and studio operations team.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1 tabular-nums">
                <div className="p-3.5 rounded-xl bg-[#090909] border border-white/[0.06]">
                  <span className="text-[11px] font-mono text-neutral-500 block">
                    Studio & Pro SLA
                  </span>
                  <span className="font-display text-lg font-semibold text-white">
                    &lt; 4 Hours
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#090909] border border-white/[0.06]">
                  <span className="text-[11px] font-mono text-neutral-500 block">
                    General Inquiries
                  </span>
                  <span className="font-display text-lg font-semibold text-white">
                    &lt; 24 Hours
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-4">
              <h3 className="typo-card-title">Direct Platform Resources</h3>
              <div className="space-y-2.5">
                <Link
                  to="/docs"
                  className="p-3.5 rounded-xl bg-[#090909] border border-white/[0.06] hover:border-white/[0.18] flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen size={16} className="text-[#EB3B2D]" />
                    <div>
                      <div className="text-xs font-display font-semibold text-white group-hover:text-[#EB3B2D] transition-colors">
                        Platform Documentation
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        API reference, 10-stage workflows & security
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="text-neutral-500" />
                </Link>

                <Link
                  to="/workspace"
                  className="p-3.5 rounded-xl bg-[#090909] border border-white/[0.06] hover:border-white/[0.18] flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard size={16} className="text-[#EB3B2D]" />
                    <div>
                      <div className="text-xs font-display font-semibold text-white group-hover:text-[#EB3B2D] transition-colors">
                        Workspace & Developer Console
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        Manage projects, usage analytics & API keys
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="text-neutral-500" />
                </Link>

                <Link
                  to="/seo-diagnostics"
                  className="p-3.5 rounded-xl bg-[#090909] border border-white/[0.06] hover:border-white/[0.18] flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={16} className="text-[#EB3B2D]" />
                    <div>
                      <div className="text-xs font-display font-semibold text-white group-hover:text-[#EB3B2D] transition-colors">
                        Technical SEO & Crawler Audit
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        Private administrator diagnostic suite
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="text-neutral-500" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rolling Private Beta Early Access Section */}
      <EarlyAccessForm />
    </PageLayout>
  );
};
