import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  useStudioPresence,
  StudioPeerPresence,
  PresenceConnectionState,
} from '../hooks/useStudioPresence';

interface StudioPresenceContextValue {
  isStudioRoute: boolean;
  roomId: string;
  roomLabel: string;
  peers: StudioPeerPresence[];
  selfColor: string;
  connectionState: PresenceConnectionState;
  errorMessage: string | null;
  showCursors: boolean;
  setShowCursors: (next: boolean) => void;
  toggleShowCursors: () => void;
  broadcastCursor: boolean;
  setBroadcastCursor: (next: boolean) => void;
  toggleBroadcastCursor: () => void;
}

const SHOW_CURSORS_KEY = 'vizra_studio_show_cursors_v1';
const BROADCAST_CURSOR_KEY = 'vizra_studio_broadcast_cursor_v1';

function readStoredBool(key: string, fallback: boolean): boolean {
  try {
    const val = localStorage.getItem(key);
    if (val === 'true') return true;
    if (val === 'false') return false;
  } catch {
    // Ignore storage error
  }
  return fallback;
}

const StudioPresenceContext = createContext<StudioPresenceContextValue>({
  isStudioRoute: false,
  roomId: 'ai_studio',
  roomLabel: 'Omnia AI Studio',
  peers: [],
  selfColor: '#EB3B2D',
  connectionState: 'inactive',
  errorMessage: null,
  showCursors: true,
  setShowCursors: () => {},
  toggleShowCursors: () => {},
  broadcastCursor: true,
  setBroadcastCursor: () => {},
  toggleBroadcastCursor: () => {},
});

function resolveStudioRoom(pathname: string): {
  isStudioRoute: boolean;
  roomId: string;
  roomLabel: string;
} {
  if (pathname === '/ai' || pathname.startsWith('/ai/')) {
    return { isStudioRoute: true, roomId: 'ai_studio', roomLabel: 'Omnia AI Studio' };
  }
  if (pathname === '/studio' || pathname.startsWith('/studio/')) {
    return { isStudioRoute: true, roomId: 'creative_studio', roomLabel: 'Creative Studio' };
  }
  if (pathname === '/workspace' || pathname.startsWith('/workspace/')) {
    return { isStudioRoute: true, roomId: 'workspace_console', roomLabel: 'Studio Console' };
  }
  return { isStudioRoute: false, roomId: 'none', roomLabel: '' };
}

export const StudioPresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [showCursors, setShowCursorsState] = useState<boolean>(() =>
    readStoredBool(SHOW_CURSORS_KEY, true)
  );
  const [broadcastCursor, setBroadcastCursorState] = useState<boolean>(() =>
    readStoredBool(BROADCAST_CURSOR_KEY, true)
  );

  const setShowCursors = useCallback((next: boolean) => {
    setShowCursorsState(next);
    try {
      localStorage.setItem(SHOW_CURSORS_KEY, String(next));
    } catch {
      // Ignore
    }
  }, []);

  const toggleShowCursors = useCallback(() => {
    setShowCursorsState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SHOW_CURSORS_KEY, String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const setBroadcastCursor = useCallback((next: boolean) => {
    setBroadcastCursorState(next);
    try {
      localStorage.setItem(BROADCAST_CURSOR_KEY, String(next));
    } catch {
      // Ignore
    }
  }, []);

  const toggleBroadcastCursor = useCallback(() => {
    setBroadcastCursorState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(BROADCAST_CURSOR_KEY, String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const roomMeta = useMemo(() => resolveStudioRoom(location.pathname), [location.pathname]);

  const { peers, selfColor, connectionState, errorMessage } = useStudioPresence({
    enabled: roomMeta.isStudioRoute,
    roomId: roomMeta.roomId,
    route: location.pathname,
    activeArea: roomMeta.roomLabel,
    broadcastCursor,
  });

  const value = useMemo<StudioPresenceContextValue>(
    () => ({
      isStudioRoute: roomMeta.isStudioRoute,
      roomId: roomMeta.roomId,
      roomLabel: roomMeta.roomLabel,
      peers,
      selfColor,
      connectionState,
      errorMessage,
      showCursors,
      setShowCursors,
      toggleShowCursors,
      broadcastCursor,
      setBroadcastCursor,
      toggleBroadcastCursor,
    }),
    [
      roomMeta.isStudioRoute,
      roomMeta.roomId,
      roomMeta.roomLabel,
      peers,
      selfColor,
      connectionState,
      errorMessage,
      showCursors,
      setShowCursors,
      toggleShowCursors,
      broadcastCursor,
      setBroadcastCursor,
      toggleBroadcastCursor,
    ]
  );

  return (
    <StudioPresenceContext.Provider value={value}>
      {children}
    </StudioPresenceContext.Provider>
  );
};

export function useStudioPresenceContext(): StudioPresenceContextValue {
  return useContext(StudioPresenceContext);
}
