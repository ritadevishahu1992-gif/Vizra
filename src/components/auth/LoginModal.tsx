import React from 'react';
import { X, Sparkles, Shield, Cpu, ArrowRight } from 'lucide-react';
import { VizraLogo } from '../VizraLogo';
import { useAuth } from '../../context/AuthContext';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, signInWithGoogle, error, user } = useAuth();

  if (!isLoginModalOpen || user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div
        className="relative w-full max-w-md bg-[#0a0a0a] border border-neutral-800 rounded-3xl p-7 md:p-8 shadow-2xl text-white overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
      >
        {/* Subtle Ambient Crimson Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#eb3b2d]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row with Vizra Logo on Top Left Side */}
        <div className="flex items-center justify-between pb-6 border-b border-neutral-900/90 relative z-10">
          <div className="flex items-center gap-3">
            <VizraLogo size={28} />
            <div className="text-left">
              <span className="text-lg font-bold tracking-tight text-white block leading-none">
                Vizra
              </span>
              <span className="text-[10px] font-mono text-neutral-400 block mt-0.5 tracking-wider uppercase">
                Creative Studio
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={closeLoginModal}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="py-6 space-y-6 relative z-10">
          <div>
            <h2 id="login-title" className="text-2xl md:text-3xl font-serif font-normal tracking-tight text-white">
              Log in Vizra
            </h2>
            <p className="text-xs md:text-sm text-neutral-400 mt-2 leading-relaxed">
              Connect to your creative workspace to sync projects, persist Omnia reasoning threads, and access your generated media across all devices.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-xs text-red-200">
              {error}
            </div>
          )}

          {/* Primary Action: Google Single Sign-On (No watermark, clean styling) */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer group"
            >
              {/* Clean Google icon */}
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
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform text-neutral-600" />
            </button>
          </div>

          {/* Creator Benefits Pillars */}
          <div className="pt-2 space-y-2.5">
            <div className="flex items-start gap-2.5 text-xs text-neutral-300">
              <Sparkles size={14} className="text-[#eb3b2d] shrink-0 mt-0.5" />
              <span>Multi-device synchronization for projects and timeline tracks</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-neutral-300">
              <Cpu size={14} className="text-[#eb3b2d] shrink-0 mt-0.5" />
              <span>Omnia persistent reasoning memory & intelligence context</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-neutral-300">
              <Shield size={14} className="text-[#eb3b2d] shrink-0 mt-0.5" />
              <span>Encrypted cloud storage with zero data leakage</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-4 border-t border-neutral-900 text-center text-[11px] text-neutral-500 font-sans">
          By signing in to Vizra, you agree to our Terms of Service & Privacy Policy.
        </div>
      </div>
    </div>
  );
};
