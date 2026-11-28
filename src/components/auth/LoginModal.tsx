import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Sparkles,
  Shield,
  Cpu,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { VizraLogo } from '../VizraLogo';
import { useAuth } from '../../context/AuthContext';
import { trackConversionEvent } from '../../services/conversionTracking';

export type AuthTabMode = 'signin' | 'signup' | 'forgot';

/**
 * 01 · Authentication (Split-Screen Auth Modal + Password Strength + Active 18+ Eligibility Gate)
 * Connected directly to VIZRA's Firebase Authentication context.
 */
export const LoginModal: React.FC = () => {
  const {
    isLoginModalOpen,
    closeLoginModal,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    clearAuthMessages,
    error,
    statusMessage,
    user,
  } = useAuth();

  const [mode, setMode] = useState<AuthTabMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ageAndTermsConfirmed, setAgeAndTermsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localValidationError, setLocalValidationError] = useState<string | null>(null);

  const passwordMetrics = useMemo(() => {
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    const score = [hasLength, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
    const label =
      score === 0
        ? 'Enter password'
        : score === 1
        ? 'Weak'
        : score === 2
        ? 'Fair'
        : score === 3
        ? 'Good'
        : 'Strong';
    return { score, label, hasLength, hasUpper, hasNumber, hasSymbol };
  }, [password]);

  useEffect(() => {
    if (!isLoginModalOpen || user) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLoginModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoginModalOpen, user, closeLoginModal]);

  if (!isLoginModalOpen || user) return null;

  const switchMode = (nextMode: AuthTabMode) => {
    setMode(nextMode);
    setLocalValidationError(null);
    clearAuthMessages();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalValidationError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setLocalValidationError('Please enter a valid email address.');
      return;
    }

    if (mode === 'signin') {
      if (!password) {
        setLocalValidationError('Please enter your password.');
        return;
      }
      setIsSubmitting(true);
      await signInWithEmail(trimmedEmail, password);
      setIsSubmitting(false);
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setLocalValidationError('Please enter your full name or studio handle.');
        return;
      }
      if (password.length < 8) {
        setLocalValidationError('Password must be at least 8 characters long.');
        return;
      }
      if (!ageAndTermsConfirmed) {
        setLocalValidationError(
          'You must confirm that you are at least 18 years old (or meet the minimum legal age of digital consent in your jurisdiction) and agree to the Terms & Privacy Policy.'
        );
        return;
      }
      setIsSubmitting(true);
      trackConversionEvent('registration_started', {
        method: 'email',
        source: 'login_modal',
      });
      const succeeded = await signUpWithEmail(name, trimmedEmail, password);
      if (succeeded) {
        trackConversionEvent('registration_completed', {
          method: 'email',
          source: 'login_modal',
        });
      }
      setIsSubmitting(false);
      return;
    }

    if (mode === 'forgot') {
      setIsSubmitting(true);
      await resetPassword(trimmedEmail);
      setIsSubmitting(false);
      return;
    }
  };

  const activeError = localValidationError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-[#090909] border border-white/[0.1] rounded-3xl shadow-2xl text-white overflow-hidden grid grid-cols-1 md:grid-cols-12"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
      >
        {/* Left Editorial Brand Panel (Desktop) */}
        <div className="hidden md:flex md:col-span-5 bg-[#111111] border-r border-white/[0.07] p-8 flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-56 h-56 bg-[#DC2626]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <VizraLogo size={28} />
              <div>
                <span className="text-lg font-bold tracking-tight text-white block leading-none">
                  VIZRA
                </span>
                <span className="text-[10px] font-mono text-neutral-400 block mt-0.5 tracking-wider uppercase">
                  Multimodal Creative OS
                </span>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#DC2626]/15 border border-[#DC2626]/30 text-[10px] font-mono uppercase tracking-wider text-[#EB3B2D]">
                Omnia 1.0 Studio
              </span>
              <h3 className="text-2xl font-serif font-normal tracking-tight text-white leading-snug">
                Precision reasoning meets 60fps creative synthesis.
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Authenticate to synchronize your 10-stage production pipelines, verified RAG citations, and studio assets across devices.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-3 pt-6 border-t border-white/[0.06]">
            <div className="flex items-start gap-2.5 text-xs text-neutral-300">
              <Sparkles size={14} className="text-[#EB3B2D] shrink-0 mt-0.5" />
              <span>Multi-device synchronization for projects & timelines</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-neutral-300">
              <Cpu size={14} className="text-[#EB3B2D] shrink-0 mt-0.5" />
              <span>Omnia persistent reasoning memory & grounded citations</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-neutral-300">
              <Shield size={14} className="text-[#EB3B2D] shrink-0 mt-0.5" />
              <span>Zero-leakage encrypted workspace governance</span>
            </div>
          </div>
        </div>

        {/* Right Interactive Authentication Form Panel */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between relative">
          {/* Top Header Row */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              {mode === 'signin' || mode === 'signup' ? (
                <div className="inline-flex p-0.5 rounded-xl bg-[#111111] border border-white/[0.08] text-xs">
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      mode === 'signin'
                        ? 'bg-[#171717] text-white border border-white/[0.1]'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      mode === 'signup'
                        ? 'bg-[#171717] text-white border border-white/[0.1]'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Sign In</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={closeLoginModal}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
              aria-label="Close authentication modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Main Form Body */}
          <div className="py-5 space-y-5">
            <div>
              <h2
                id="login-title"
                className="text-xl sm:text-2xl font-serif font-normal tracking-tight text-white"
              >
                {mode === 'signin' && 'Sign in to VIZRA Workspace'}
                {mode === 'signup' && 'Create your VIZRA Studio account'}
                {mode === 'forgot' && 'Reset your studio password'}
              </h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                {mode === 'signin' &&
                  'Use Google Single Sign-On or your workspace email credentials (18+ active platform policy).'}
                {mode === 'signup' &&
                  'Provision an encrypted creator workspace with persistent Omnia memory.'}
                {mode === 'forgot' &&
                  'Enter your account email and we will dispatch a password reset link.'}
              </p>
            </div>

            {/* Error Alert */}
            {activeError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-xs text-red-200 flex items-start gap-2"
              >
                <AlertCircle size={15} className="text-[#EB3B2D] shrink-0 mt-0.5" />
                <span>{activeError}</span>
              </div>
            )}

            {/* Status / Success Banner */}
            {statusMessage && (
              <div
                role="status"
                className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-200 flex items-start gap-2"
              >
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Google Single Sign-On (Shown on Sign In & Sign Up) */}
            {(mode === 'signin' || mode === 'signup') && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    trackConversionEvent('registration_started', {
                      method: 'google',
                      source: mode === 'signup' ? 'login_modal_signup' : 'login_modal_signin',
                    });
                    await signInWithGoogle();
                  }}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white text-black font-semibold text-xs sm:text-sm hover:bg-neutral-200 transition-all duration-200 shadow-md cursor-pointer group"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-0.5 transition-transform text-neutral-600"
                  />
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-white/[0.07] w-full" />
                  <span className="bg-[#090909] px-3 text-[10px] font-mono uppercase tracking-wider text-neutral-500 shrink-0">
                    or continue with email
                  </span>
                  <div className="border-t border-white/[0.07] w-full" />
                </div>
              </>
            )}

            {/* Email / Password / OTP Form */}
            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label
                    htmlFor="vizra-auth-name"
                    className="block text-[11px] font-medium text-neutral-300 mb-1"
                  >
                    Full Name / Studio Handle
                  </label>
                  <div className="relative">
                    <UserIcon
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
                    />
                    <input
                      id="vizra-auth-name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ada Lovelace"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#111111] border border-white/[0.08] focus:border-[#DC2626] focus:outline-none text-xs text-white placeholder-neutral-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="vizra-auth-email"
                  className="block text-[11px] font-medium text-neutral-300 mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
                  />
                  <input
                    id="vizra-auth-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="creator@vizra.ai"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#111111] border border-white/[0.08] focus:border-[#DC2626] focus:outline-none text-xs text-white placeholder-neutral-500 transition-colors"
                  />
                </div>
              </div>

              {(mode === 'signin' || mode === 'signup') && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="vizra-auth-password"
                      className="text-[11px] font-medium text-neutral-300"
                    >
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-[11px] text-neutral-400 hover:text-[#EB3B2D] transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
                    />
                    <input
                      id="vizra-auth-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={
                        mode === 'signin' ? 'current-password' : 'new-password'
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#111111] border border-white/[0.08] focus:border-[#DC2626] focus:outline-none text-xs text-white placeholder-neutral-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  {/* Password Strength Meter (Sign Up Mode) */}
                  {mode === 'signup' && password.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-neutral-400">Password strength</span>
                        <span
                          className={
                            passwordMetrics.score >= 3
                              ? 'text-emerald-400'
                              : passwordMetrics.score === 2
                              ? 'text-amber-400'
                              : 'text-[#EB3B2D]'
                          }
                        >
                          {passwordMetrics.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[1, 2, 3, 4].map((seg) => (
                          <div
                            key={seg}
                            className={`h-1 rounded-full transition-colors ${
                              passwordMetrics.score >= seg
                                ? passwordMetrics.score >= 3
                                  ? 'bg-emerald-500'
                                  : passwordMetrics.score === 2
                                  ? 'bg-amber-500'
                                  : 'bg-[#DC2626]'
                                : 'bg-neutral-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mandatory 18+ Age & Terms Confirmation on Sign Up */}
              {mode === 'signup' && (
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#111111] border border-white/[0.08] cursor-pointer text-[11px] text-neutral-300 leading-relaxed">
                  <input
                    type="checkbox"
                    checked={ageAndTermsConfirmed}
                    onChange={(e) => {
                      setAgeAndTermsConfirmed(e.target.checked);
                      setLocalValidationError(null);
                    }}
                    className="mt-0.5 accent-[#DC2626] rounded cursor-pointer"
                  />
                  <span>
                    I confirm that I am at least <strong>18 years of age</strong> (or have verifiable parental/guardian authorization where required by law) and agree to VIZRA&apos;s Terms &amp; Conditions and Privacy Policy.
                  </span>
                </label>
              )}

              <div className="pt-1 flex items-center justify-between gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#DC2626] hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>
                    {isSubmitting
                      ? 'Authenticating…'
                      : mode === 'signin'
                      ? 'Sign In with Email'
                      : mode === 'signup'
                      ? 'Create Studio Account'
                      : 'Send Reset Instructions'}
                  </span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>

          {/* Footer Note */}
          <div className="pt-3 border-t border-white/[0.06] text-center text-[11px] text-neutral-500 font-sans">
            Minimum age 18+ required to access VIZRA Workspace under active platform policy. By authenticating, you agree to our Terms of Service &amp; Privacy Governance.
          </div>
        </div>
      </div>
    </div>
  );
};
