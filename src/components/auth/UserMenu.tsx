import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, FolderKanban, ShieldCheck, History, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UserMenu: React.FC = () => {
  const { user, signOutUser, openLoginModal } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!user) {
    return (
      <button
        type="button"
        onClick={openLoginModal}
        className="h-9 px-2.5 sm:px-3 rounded-lg text-xs sm:text-[13px] font-medium text-neutral-300 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-colors duration-150 cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d]"
      >
        <User size={14} className="hidden sm:block text-neutral-400" />
        <span>Log in</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Open account menu"
        className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-white/[0.06] border border-transparent hover:border-white/[0.1] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d]"
        title={user.displayName || user.email || 'Creator Account'}
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Creator'}
            className="w-7 h-7 rounded-full object-cover border border-white/[0.14]"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#1B1B21] border border-white/[0.14] flex items-center justify-center text-xs font-semibold text-white">
            {(user.displayName || user.email || 'V')[0].toUpperCase()}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#111114] border border-white/[0.1] shadow-2xl p-2 z-50 text-white animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3 border-b border-white/[0.06]">
            <p className="text-xs font-semibold truncate text-white">
              {user.displayName || 'Vizra Creator'}
            </p>
            <p className="text-[11px] text-neutral-400 truncate mt-0.5">
              {user.email}
            </p>
            <div className="mt-2 flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-400 w-fit">
              <ShieldCheck size={11} className="text-[#eb3b2d]" />
              <span>Verified Creator</span>
            </div>
          </div>

          <div className="py-1 space-y-0.5">
            <Link
              to="/workspace"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FolderKanban size={13} className="text-[#eb3b2d]" />
              <span>Workspace Console</span>
            </Link>
            <Link
              to="/history"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-lg flex items-center gap-2 transition-colors"
            >
              <History size={13} className="text-neutral-400" />
              <span>Conversation History</span>
            </Link>
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Settings size={13} className="text-neutral-400" />
              <span>Application Settings</span>
            </Link>
          </div>

          <div className="pt-1 border-t border-neutral-900">
            <button
              type="button"
              onClick={async () => {
                setIsOpen(false);
                await signOutUser();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut size={13} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
