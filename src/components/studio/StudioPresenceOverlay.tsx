import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Users,
  Eye,
  EyeOff,
  Radio,
  MousePointer2,
  LogIn,
  AlertCircle,
} from 'lucide-react';
import { useStudioPresenceContext } from '../../context/StudioPresenceContext';
import { useAuth } from '../../context/AuthContext';
import { StudioPeerPresence } from '../../hooks/useStudioPresence';

/**
 * Single remote collaborator pointer with smooth spring interpolation
 * and a high-contrast VIZRA nameplate tag.
 */
const RemoteCollaboratorCursor: React.FC<{
  peer: StudioPeerPresence;
  viewport: { width: number; height: number };
  reducedMotion: boolean;
}> = ({ peer, viewport, reducedMotion }) => {
  const pxX = Math.round(peer.x * viewport.width);
  const pxY = Math.round(peer.y * viewport.height);

  return (
    <motion.div
      key={peer.sessionId}
      initial={{ opacity: 0, scale: 0.85, x: pxX, y: pxY }}
      animate={{ opacity: 1, scale: peer.isClicking ? 0.92 : 1, x: pxX, y: pxY }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={
        reducedMotion
          ? { duration: 0.05 }
          : {
              x: { type: 'spring', stiffness: 460, damping: 34, mass: 0.35 },
              y: { type: 'spring', stiffness: 460, damping: 34, mass: 0.35 },
              opacity: { duration: 0.16 },
              scale: { duration: 0.12 },
            }
      }
      className="fixed top-0 left-0 will-change-transform select-none"
      style={{ zIndex: 60 }}
      aria-hidden="true"
    >
      {/* Click Ripple Pulse */}
      {peer.isClicking && !reducedMotion && (
        <motion.span
          initial={{ scale: 0.4, opacity: 0.85 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="absolute -top-2 -left-2 w-5 h-5 rounded-full border-2"
          style={{ borderColor: peer.color }}
        />
      )}

      {/* Precision Cursor Vector */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)]"
      >
        <path
          d="M4.5 3.2L19.4 10.7C20.2 11.1 20.1 12.2 19.2 12.5L13.1 14.3L10.3 20C9.9 20.8 8.7 20.7 8.5 19.8L4 4.1C3.8 3.4 4.1 3 4.5 3.2Z"
          fill={peer.color}
          stroke="#09090B"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>

      {/* Collaborator Nameplate */}
      <div
        className="ml-3.5 -mt-1 inline-flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-md shadow-[0_6px_18px_rgba(0,0,0,0.5)] border border-black/40 backdrop-blur-md max-w-[160px]"
        style={{ backgroundColor: peer.color }}
      >
        {peer.photoURL ? (
          <img
            src={peer.photoURL}
            alt=""
            referrerPolicy="no-referrer"
            className="w-3.5 h-3.5 rounded-sm object-cover shrink-0 bg-black/20"
          />
        ) : (
          <span className="w-3.5 h-3.5 rounded-sm bg-black/25 text-[8px] font-bold text-white flex items-center justify-center shrink-0">
            {peer.initials}
          </span>
        )}
        <span className="text-[11px] font-semibold tracking-tight text-white truncate leading-tight">
          {peer.displayName}
        </span>
      </div>
    </motion.div>
  );
};

/**
 * Full-viewport non-blocking overlay rendering live remote collaborators' cursors
 * across active Studio routes (/ai, /studio, /workspace).
 */
export const StudioPresenceOverlay: React.FC = () => {
  const { isStudioRoute, peers, showCursors, connectionState } = useStudioPresenceContext();
  const prefersReducedMotion = useReducedMotion();
  const [viewport, setViewport] = useState<{ width: number; height: number }>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isStudioRoute || !showCursors || connectionState !== 'connected') {
    return null;
  }

  const visiblePeers = peers.filter((p) => p.visible);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[60] overflow-hidden"
      aria-label="Active Studio collaborators cursor overlay"
    >
      <AnimatePresence>
        {visiblePeers.map((peer) => (
          <RemoteCollaboratorCursor
            key={peer.sessionId}
            peer={peer}
            viewport={viewport}
            reducedMotion={Boolean(prefersReducedMotion)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface StudioPresenceIndicatorProps {
  /** Compact inline variant for headers or floating corner HUD for /studio */
  variant?: 'header' | 'floating';
  className?: string;
}

/**
 * Compact collaborator presence badge & interactive popover for toggling
 * live cursor visibility, cursor broadcasting, and inspecting active Studio peers.
 */
export const StudioPresenceIndicator: React.FC<StudioPresenceIndicatorProps> = ({
  variant = 'header',
  className = '',
}) => {
  const {
    isStudioRoute,
    roomLabel,
    peers,
    selfColor,
    connectionState,
    errorMessage,
    showCursors,
    toggleShowCursors,
    broadcastCursor,
    toggleBroadcastCursor,
  } = useStudioPresenceContext();
  const { user, openLoginModal } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  if (!isStudioRoute) return null;

  const totalOnline = connectionState === 'connected' ? peers.length + 1 : peers.length;
  const visibleAvatarPeers = peers.slice(0, 3);
  const overflowCount = Math.max(0, peers.length - visibleAvatarPeers.length);

  const dotColorClass =
    connectionState === 'connected'
      ? 'bg-emerald-400'
      : connectionState === 'connecting'
      ? 'bg-amber-400 animate-pulse'
      : connectionState === 'error'
      ? 'bg-red-400'
      : 'bg-zinc-500';

  const statusText =
    connectionState === 'connected'
      ? totalOnline === 1
        ? '1 live'
        : `${totalOnline} live`
      : connectionState === 'connecting'
      ? 'Syncing'
      : connectionState === 'unauthenticated'
      ? 'Live Off'
      : connectionState === 'error'
      ? 'RTDB Setup'
      : 'Offline';

  return (
    <div
      ref={containerRef}
      className={
        variant === 'floating'
          ? `fixed bottom-5 right-5 z-40 ${className}`
          : `relative inline-flex ${className}`
      }
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Studio live presence: ${statusText}`}
        className={`flex items-center gap-2 h-8 px-2.5 rounded-full border transition-all cursor-pointer select-none ${
          variant === 'floating'
            ? 'bg-[#0E0E12]/95 border-white/[0.14] hover:border-[#EB3B2D]/60 shadow-[0_12px_32px_rgba(0,0,0,0.6)] backdrop-blur-md'
            : 'bg-[#141418] hover:bg-[#1B1B21] border-[#23232A] hover:border-[#DC143C]/45'
        }`}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          {connectionState === 'connected' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColorClass}`} />
        </span>

        {/* Collaborator Avatar Stack */}
        {visibleAvatarPeers.length > 0 ? (
          <div className="flex items-center -space-x-1.5">
            {visibleAvatarPeers.map((peer) => (
              <span
                key={peer.sessionId}
                title={peer.displayName}
                className="w-5 h-5 rounded-full ring-2 ring-[#141418] text-[9px] font-bold text-white flex items-center justify-center overflow-hidden shrink-0"
                style={{ backgroundColor: peer.color }}
              >
                {peer.photoURL ? (
                  <img
                    src={peer.photoURL}
                    alt={peer.displayName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  peer.initials
                )}
              </span>
            ))}
            {overflowCount > 0 && (
              <span className="w-5 h-5 rounded-full ring-2 ring-[#141418] bg-zinc-800 text-[9px] font-mono text-zinc-200 flex items-center justify-center shrink-0">
                +{overflowCount}
              </span>
            )}
          </div>
        ) : (
          <Users size={13} className="text-zinc-400 shrink-0" />
        )}

        <span className="text-[11px] font-medium text-zinc-200 whitespace-nowrap hidden xl:inline">
          {statusText}
        </span>
      </button>

      {/* Presence Control Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: variant === 'floating' ? 8 : -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: variant === 'floating' ? 8 : -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            role="dialog"
            aria-label="Studio Live Presence Controls"
            className={`absolute right-0 w-72 rounded-xl bg-[#111115] border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.75)] backdrop-blur-xl p-3.5 z-50 text-left ${
              variant === 'floating' ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {roomLabel} Presence
                </div>
                <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColorClass}`} />
                  <span>
                    {connectionState === 'connected'
                      ? 'Firebase RTDB Connected'
                      : connectionState === 'connecting'
                      ? 'Connecting to Firebase RTDB...'
                      : connectionState === 'unauthenticated'
                      ? 'Sign in for live cursors'
                      : connectionState === 'error'
                      ? 'Realtime DB setup needed'
                      : 'Reconnecting...'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-300 shrink-0">
                {totalOnline} active
              </span>
            </div>

            {/* Unauthenticated CTA */}
            {connectionState === 'unauthenticated' && (
              <div className="py-3 space-y-2.5">
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Sign in with your VIZRA account to see other active creators&apos; cursors and broadcast your live presence in this Studio room.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    openLoginModal();
                  }}
                  className="w-full h-8 px-3 rounded-lg bg-[#EB3B2D] hover:bg-[#d62e20] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogIn size={13} />
                  <span>Sign in to Join Live Room</span>
                </button>
              </div>
            )}

            {/* RTDB Configuration / Rules Error Notice */}
            {connectionState === 'error' && errorMessage && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-red-950/35 border border-red-800/45 text-[11px] text-red-200 flex items-start gap-2">
                <AlertCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Active Collaborator Roster */}
            {user && connectionState !== 'unauthenticated' && (
              <div className="py-2.5 space-y-1.5 max-h-44 overflow-y-auto">
                {/* Current User Row */}
                <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/[0.04]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center shrink-0"
                      style={{ backgroundColor: selfColor }}
                    >
                      {(user.displayName || user.email || 'Y').slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium text-white truncate">
                        {user.displayName || user.email?.split('@')[0] || 'You'}{' '}
                        <span className="text-zinc-500">(you)</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate">
                        {broadcastCursor ? 'Broadcasting cursor' : 'Cursor hidden'}
                      </div>
                    </div>
                  </div>
                  <MousePointer2
                    size={12}
                    style={{ color: selfColor }}
                    className={broadcastCursor ? 'opacity-100' : 'opacity-30'}
                  />
                </div>

                {/* Remote Peers */}
                {peers.length === 0 ? (
                  <div className="px-2 py-2 text-[11px] text-zinc-500 text-center">
                    No other active collaborators in this room yet.
                  </div>
                ) : (
                  peers.map((peer) => (
                    <div
                      key={peer.sessionId}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center overflow-hidden shrink-0"
                          style={{ backgroundColor: peer.color }}
                        >
                          {peer.photoURL ? (
                            <img
                              src={peer.photoURL}
                              alt={peer.displayName}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            peer.initials
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[11px] font-medium text-zinc-100 truncate">
                            {peer.displayName}
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate">
                            {peer.visible ? 'Active in viewport' : 'Idle / background'}
                          </div>
                        </div>
                      </div>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: peer.visible ? peer.color : '#52525B',
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Toggle Controls */}
            {user && (
              <div className="pt-2.5 border-t border-white/[0.08] space-y-1.5">
                <button
                  type="button"
                  onClick={toggleShowCursors}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] text-[11px] text-zinc-200 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {showCursors ? (
                      <Eye size={13} className="text-emerald-400" />
                    ) : (
                      <EyeOff size={13} className="text-zinc-500" />
                    )}
                    <span>Show collaborator cursors</span>
                  </span>
                  <span
                    className={`text-[10px] font-mono ${
                      showCursors ? 'text-emerald-400' : 'text-zinc-500'
                    }`}
                  >
                    {showCursors ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={toggleBroadcastCursor}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] text-[11px] text-zinc-200 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Radio
                      size={13}
                      className={broadcastCursor ? 'text-[#EB3B2D]' : 'text-zinc-500'}
                    />
                    <span>Broadcast my cursor</span>
                  </span>
                  <span
                    className={`text-[10px] font-mono ${
                      broadcastCursor ? 'text-emerald-400' : 'text-zinc-500'
                    }`}
                  >
                    {broadcastCursor ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
