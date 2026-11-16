import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Sparkles, Shield, Zap, ArrowRight, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Dialog } from './ui/Dialog';
import { useToast } from './ui/Toast';

export type BillingCycle = 'monthly' | 'yearly';
export type PlanId = 'starter' | 'pro' | 'studio';

interface PricingTier {
  id: PlanId;
  name: string;
  badge?: string;
  popular?: boolean;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  creditsLabel: string;
  features: string[];
  ctaLabel: string;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Creator Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description:
      'Essential multimodal reasoning, grounded web citations, and 10-stage project workflows for individual creators.',
    creditsLabel: '60 requests / min · Standard Omnia 1.0',
    features: [
      'Omnia 1.0 Quick, Think & Research modes',
      'Verified web & primary source citations',
      'Up to 3 active 10-stage creative projects',
      'Drag-and-drop multimodal file ingestion (10MB)',
      'Standard procedural & diffusion visual synthesis',
    ],
    ctaLabel: 'Current Free Tier',
  },
  {
    id: 'pro',
    name: 'Omnia Pro',
    badge: 'Most Popular',
    popular: true,
    monthlyPrice: 24,
    yearlyPrice: 19,
    description:
      'Priority low-latency synthesis, unlimited 10-stage production workspaces, Lyria 3 music generation, and 4K asset exports.',
    creditsLabel: '240 requests / min · Priority Compute',
    features: [
      'Everything in Creator Free, plus:',
      'Unlimited 10-stage creative project workspaces',
      'Lyria 3 AI Music Studio & Gemini Live Voice sessions',
      'DeepMind Science Hub (AlphaFold / Earth Engine tools)',
      'Persistent cross-device Firestore project memory',
      'Priority streaming bandwidth & 60fps shader export',
    ],
    ctaLabel: 'Upgrade to Omnia Pro',
  },
  {
    id: 'studio',
    name: 'VIZRA Studio & Team',
    badge: 'Enterprise & Teams',
    monthlyPrice: 79,
    yearlyPrice: 64,
    description:
      'Shared team workspaces, custom RAG knowledge bases, VIZRA Engage governance console, and dedicated API rate limits.',
    creditsLabel: 'Custom concurrency · Dedicated SLA',
    features: [
      'Everything in Omnia Pro, plus:',
      'Collaborative team workspaces & role permissions',
      'Private RAG Knowledge Base & custom corpus indexing',
      'Developer Console & programmatic API access',
      'VIZRA Engage & Technical SEO Diagnostic Suite',
      'Zero-retention enterprise privacy governance',
    ],
    ctaLabel: 'Activate Studio Plan',
  },
];

const PLAN_STORAGE_KEY = 'vizra_active_plan_v1';

/**
 * 13 · Pricing Cards
 * Adapted from 21st.dev `pricing` pattern with Monthly/Yearly billing toggle,
 * plan comparison, current plan indicator, and real backend registration hook.
 */
export const PricingSection: React.FC<{ onLaunchOmnia?: () => void }> = ({
  onLaunchOmnia,
}) => {
  const { user, openLoginModal } = useAuth();
  const { toast } = useToast();
  const [billing, setBilling] = useState<BillingCycle>('yearly');
  const [activePlan, setActivePlan] = useState<PlanId>(() => {
    try {
      const saved = localStorage.getItem(PLAN_STORAGE_KEY) as PlanId | null;
      if (saved === 'starter' || saved === 'pro' || saved === 'studio') return saved;
    } catch {
      // Ignore
    }
    return 'starter';
  });

  const [selectedTierForModal, setSelectedTierForModal] = useState<PricingTier | null>(
    null
  );
  const [contactEmail, setContactEmail] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [isSubmittingUpgrade, setIsSubmittingUpgrade] = useState(false);

  const handleSelectTier = (tier: PricingTier) => {
    if (tier.id === activePlan) {
      onLaunchOmnia?.();
      return;
    }
    setContactEmail(user?.email || '');
    setWorkspaceName(user?.displayName ? `${user.displayName}'s Studio` : '');
    setSelectedTierForModal(tier);
  };

  const handleConfirmPlanActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTierForModal) return;

    const emailToUse = (contactEmail || user?.email || '').trim();
    if (!emailToUse || !emailToUse.includes('@')) {
      toast({
        title: 'Valid email required',
        description: 'Please provide your studio email to provision plan entitlements.',
        type: 'warning',
      });
      return;
    }

    setIsSubmittingUpgrade(true);
    try {
      await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToUse,
          role: `${selectedTierForModal.name} (${billing})`,
          useCase: workspaceName || 'VIZRA Studio Upgrade',
        }),
      });
    } catch {
      // Non-fatal network fallback
    }

    try {
      localStorage.setItem(PLAN_STORAGE_KEY, selectedTierForModal.id);
    } catch {
      // Ignore storage error
    }

    setActivePlan(selectedTierForModal.id);
    setIsSubmittingUpgrade(false);
    setSelectedTierForModal(null);

    toast({
      title: `${selectedTierForModal.name} Preview Selected`,
      description: `Workspace configured on ${selectedTierForModal.name} (${billing}) preview. No card is charged until commercial checkout is enabled.`,
      type: 'success',
    });
  };

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="relative py-24 md:py-32 px-6 md:px-16 lg:px-28 bg-[#090909] border-t border-white/[0.06] text-white select-none overflow-hidden"
    >
      {/* Subtle Ambient Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[580px] h-[240px] bg-[#DC2626]/[0.06] blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="space-y-3 max-w-2xl">
            <div className="typo-eyebrow flex items-center gap-2">
              <Sparkles size={12} />
              <span>Transparent Compute & Studio Tiers</span>
            </div>
            <h2
              id="pricing-heading"
              className="typo-section-title"
            >
              Scale from rapid ideation to full studio production.
            </h2>
            <p className="typo-body">
              Every plan includes grounded web citations, SSRF-hardened retrieval, and 60fps workspace physics. Upgrade anytime as your creative pipeline expands.
            </p>
          </div>

          {/* Monthly / Yearly Billing Toggle */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-[#111111] border border-white/[0.08] self-start md:self-auto">
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                billing === 'monthly'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBilling('yearly')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                billing === 'yearly'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Yearly Billing</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  billing === 'yearly'
                    ? 'bg-[#DC2626] text-white'
                    : 'bg-[#DC2626]/20 text-[#EB3B2D]'
                }`}
              >
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 3-Column Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {PRICING_TIERS.map((tier) => {
            const isCurrent = activePlan === tier.id;
            const price =
              billing === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice;

            return (
              <motion.div
                key={tier.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={`relative rounded-3xl p-7 flex flex-col justify-between transition-colors ${
                  tier.popular
                    ? 'bg-[#111111] border-2 border-[#DC2626]/70 shadow-[0_0_50px_-15px_rgba(220,38,38,0.25)]'
                    : 'bg-[#111111]/90 border border-white/[0.08] hover:border-white/[0.16]'
                }`}
              >
                <div>
                  {/* Card Top Row */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-white tracking-tight">
                      {tier.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {isCurrent && (
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                          Current Plan
                        </span>
                      )}
                      {tier.badge && (
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider ${
                            tier.popular
                              ? 'bg-[#DC2626] text-white font-semibold'
                              : 'bg-[#171717] border border-white/[0.1] text-neutral-300'
                          }`}
                        >
                          {tier.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price Lockup */}
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
                      ${price}
                    </span>
                    <span className="text-xs font-mono text-neutral-400">
                      {price === 0
                        ? '/ forever'
                        : `/ month ${billing === 'yearly' ? '(billed annually)' : ''}`}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed mb-5">
                    {tier.description}
                  </p>

                  {/* Compute Quota Pill */}
                  <div className="px-3 py-2 rounded-xl bg-[#090909] border border-white/[0.06] flex items-center gap-2 text-[11px] font-mono text-neutral-300 mb-6">
                    <Zap size={13} className="text-[#EB3B2D] shrink-0" />
                    <span>{tier.creditsLabel}</span>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-3 text-xs text-neutral-300 mb-8">
                    {tier.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check
                          size={14}
                          className="text-[#EB3B2D] shrink-0 mt-0.5"
                        />
                        <span className="leading-relaxed">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleSelectTier(tier)}
                    className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isCurrent
                        ? 'bg-[#171717] hover:bg-neutral-800 text-white border border-white/[0.12]'
                        : tier.popular
                        ? 'bg-[#DC2626] hover:bg-red-700 text-white shadow-lg'
                        : 'bg-white hover:bg-neutral-200 text-black'
                    }`}
                  >
                    <span>
                      {isCurrent ? 'Open Active Workspace' : tier.ctaLabel}
                    </span>
                    <ArrowRight size={14} />
                  </button>

                  {!user && tier.id !== 'starter' && (
                    <button
                      type="button"
                      onClick={openLoginModal}
                      className="w-full text-center text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                    >
                      Already have an account? Sign in to sync billing
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Plan Upgrade / Provisioning Dialog */}
      <Dialog
        isOpen={!!selectedTierForModal}
        onClose={() => setSelectedTierForModal(null)}
        title={
          selectedTierForModal
            ? `Select ${selectedTierForModal.name} (Preview)`
            : 'Select Plan'
        }
        description="Save your workspace tier preference and log priority studio access. No payment card is collected or charged until commercial billing launches."
        badge={billing === 'yearly' ? 'Annual · 20% Off Preview' : 'Monthly Preview'}
        maxWidth="md"
      >
        {selectedTierForModal && (
          <form onSubmit={handleConfirmPlanActivation} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#090909] border border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Layers size={16} className="text-[#EB3B2D]" />
                <div>
                  <div className="text-xs font-semibold text-white">
                    {selectedTierForModal.name}
                  </div>
                  <div className="text-[11px] font-mono text-neutral-400">
                    {selectedTierForModal.creditsLabel}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-white">
                  $
                  {billing === 'yearly'
                    ? selectedTierForModal.yearlyPrice
                    : selectedTierForModal.monthlyPrice}
                </span>
                <span className="text-[10px] font-mono text-neutral-500 block">
                  per month
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="upgrade-email"
                className="block text-[11px] font-medium text-neutral-300 mb-1"
              >
                Workspace Billing Email
              </label>
              <input
                id="upgrade-email"
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="founder@studio.ai"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090909] border border-white/[0.1] focus:border-[#DC2626] focus:outline-none text-xs text-white"
              />
            </div>

            <div>
              <label
                htmlFor="upgrade-workspace"
                className="block text-[11px] font-medium text-neutral-300 mb-1"
              >
                Studio / Team Name (Optional)
              </label>
              <input
                id="upgrade-workspace"
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Obsidian Labs"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090909] border border-white/[0.1] focus:border-[#DC2626] focus:outline-none text-xs text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTierForModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingUpgrade}
                className="flex-1 py-2.5 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Shield size={13} />
                <span>
                  {isSubmittingUpgrade ? 'Provisioning…' : 'Confirm & Activate Tier'}
                </span>
              </button>
            </div>
          </form>
        )}
      </Dialog>
    </section>
  );
};
