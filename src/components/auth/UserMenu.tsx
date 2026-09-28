import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, FolderKanban, ShieldCheck } from 'lucide-react';
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <button
        type="button"
        onClick={openLoginModal}
        className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer flex items-center gap-1.5"
      >
        <User size={13} className="text-[#eb3b2d]" />
        <span>Log in</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:ring-1 hover:ring-neutral-700 transition-all cursor-pointer"
        title={user.displayName || user.email || 'Creator Account'}
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Creator'}
            className="w-8 h-8 rounded-full object-cover border border-neutral-800"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-bold text-white">
            {(user.displayName || user.email || 'V')[0].toUpperCase()}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl p-2 z-50 text-white animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3 border-b border-neutral-900">
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

          <div className="py-1">
            <div className="px-3 py-2 text-xs text-neutral-400 flex items-center gap-2">
              <FolderKanban size={13} className="text-neutral-500" />
              <span>Firestore Sync: Active</span>
            </div>
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
