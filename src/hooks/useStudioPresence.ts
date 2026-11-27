import { useEffect, useState, useRef, useMemo } from 'react';
import {
  ref,
  onValue,
  set,
  update,
  remove,
  onDisconnect,
  serverTimestamp,
  off,
} from 'firebase/database';
import { rtdb } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export interface StudioPeerPresence {
  uid: string;
  sessionId: string;
  displayName: string;
  initials: string;
  photoURL?: string;
  color: string;
  /** Normalized viewport X coordinate in [0, 1] */
  x: number;
  /** Normalized viewport Y coordinate in [0, 1] */
  y: number;
  /** Whether the user's pointer is currently inside the active Studio viewport */
  visible: boolean;
  /** Momentary click pulse indicator */
  isClicking?: boolean;
  route: string;
  activeArea: string;
  lastActive: number;
}

export type PresenceConnectionState =
  | 'inactive'
  | 'unauthenticated'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface UseStudioPresenceOptions {
  /** Whether presence sync should be active (enabled only on Studio routes) */
  enabled: boolean;
  /** Logical Studio room identifier (e.g. 'ai_studio', 'creative_studio', 'workspace_console') */
  roomId: string;
  /** Current route path (e.g. '/ai', '/studio', '/workspace') */
  route: string;
  /** Human-readable area label for peer roster */
  activeArea: string;
  /** Whether the local user broadcasts their own cursor position */
  broadcastCursor: boolean;
}

export interface UseStudioPresenceResult {
  peers: StudioPeerPresence[];
  selfSessionId: string;
  selfColor: string;
  connectionState: PresenceConnectionState;
  errorMessage: string | null;
}

const CURSOR_PALETTE = [
  '#EB3B2D', // VIZRA Crimson
  '#06B6D4', // Cyan
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#10B981', // Emerald
  '#EC4899', // Rose
  '#38BDF8', // Sky
  '#84CC16', // Lime
] as const;

const STALE_PEER_THRESHOLD_MS = 45_000;
const HEARTBEAT_INTERVAL_MS = 20_000;
const POINTER_THROTTLE_MS = 50; // 20 Hz real-time sync
const MIN_COORD_DELTA = 0.002;
const TAB_SESSION_STORAGE_KEY = 'vizra_studio_presence_tab_id_v1';

function getOrCreateTabRandomId(): string {
  try {
    const existing = window.sessionStorage.getItem(TAB_SESSION_STORAGE_KEY);
    if (existing && /^[a-zA-Z0-9]{6,20}$/.test(existing)) {
      return existing;
    }
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
        : Math.random().toString(36).slice(2, 12);
    window.sessionStorage.setItem(TAB_SESSION_STORAGE_KEY, generated);
    return generated;
  } catch {
    return Math.random().toString(36).slice(2, 12);
  }
}

function pickDeterministicColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return CURSOR_PALETTE[hash % CURSOR_PALETTE.length];
}

function sanitizeRoomId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  return cleaned || 'ai_studio';
}

function sanitizeDisplayName(name?: string | null, email?: string | null): string {
  const candidate = (name || email?.split('@')[0] || 'Creator').trim();
  return candidate.replace(/[<>]/g, '').slice(0, 48) || 'Creator';
}

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function clampCoord(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

/**
 * Real-time multi-user Studio presence & cursor synchronization backed by Firebase Realtime Database.
 * Uses `.info/connected` + `onDisconnect().remove()` for automatic cleanup, 20 Hz throttled pointer
 * updates in normalized viewport coordinates [0, 1], and strict client-side + rule-side validation.
 */
export function useStudioPresence({
  enabled,
  roomId,
  route,
  activeArea,
  broadcastCursor,
}: UseStudioPresenceOptions): UseStudioPresenceResult {
  const { user, loading: authLoading } = useAuth();
  const [peers, setPeers] = useState<StudioPeerPresence[]>([]);
  const [connectionState, setConnectionState] = useState<PresenceConnectionState>('inactive');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const tabIdRef = useRef<string>(getOrCreateTabRandomId());
  const lastEmitAtRef = useRef<number>(0);
  const lastCoordsRef = useRef<{ x: number; y: number; visible: boolean }>({
    x: 0.5,
    y: 0.5,
    visible: false,
  });
  const pendingCoordsRef = useRef<{ x: number; y: number; visible: boolean } | null>(null);
  const throttleTimerRef = useRef<number | null>(null);
  const clickResetTimerRef = useRef<number | null>(null);
  const isConnectedRef = useRef<boolean>(false);

  const safeRoomId = useMemo(() => sanitizeRoomId(roomId), [roomId]);

  const selfSessionId = useMemo(() => {
    const uidPart = user?.uid ? user.uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48) : 'guest';
    return `${uidPart}_${tabIdRef.current}`.slice(0, 96);
  }, [user?.uid]);

  const selfColor = useMemo(() => pickDeterministicColor(selfSessionId), [selfSessionId]);

  useEffect(() => {
    if (!enabled) {
      setPeers([]);
      setConnectionState('inactive');
      setErrorMessage(null);
      return;
    }

    if (authLoading) {
      setConnectionState('connecting');
      return;
    }

    if (!user?.uid) {
      setPeers([]);
      setConnectionState('unauthenticated');
      setErrorMessage(null);
      return;
    }

    if (!rtdb) {
      setPeers([]);
      setConnectionState('error');
      setErrorMessage('Firebase Realtime Database is not initialized.');
      return;
    }

    let cancelled = false;
    setConnectionState('connecting');
    setErrorMessage(null);

    const database = rtdb;
    const roomPath = `studio_presence/${safeRoomId}`;
    const selfPath = `${roomPath}/${selfSessionId}`;
    const roomRef = ref(database, roomPath);
    const selfRef = ref(database, selfPath);
    const connectedRef = ref(database, '.info/connected');

    const displayName = sanitizeDisplayName(user.displayName, user.email);
    const initials = computeInitials(displayName);
    const safePhotoUrl =
      typeof user.photoURL === 'string' && /^https?:\/\//i.test(user.photoURL)
        ? user.photoURL.slice(0, 1024)
        : undefined;
    const safeRoute = route.slice(0, 120);
    const safeArea = activeArea.slice(0, 40);

    const buildPresenceRecord = (overrides?: Partial<StudioPeerPresence>) => {
      const payload: Record<string, unknown> = {
        uid: user.uid,
        sessionId: selfSessionId,
        displayName,
        initials,
        color: selfColor,
        x: clampCoord(overrides?.x ?? lastCoordsRef.current.x),
        y: clampCoord(overrides?.y ?? lastCoordsRef.current.y),
        visible: broadcastCursor ? Boolean(overrides?.visible ?? lastCoordsRef.current.visible) : false,
        isClicking: Boolean(overrides?.isClicking ?? false),
        route: safeRoute,
        activeArea: safeArea,
        lastActive: serverTimestamp(),
      };
      if (safePhotoUrl) {
        payload.photoURL = safePhotoUrl;
      }
      return payload;
    };

    const handleRtdbError = (err: unknown) => {
      if (cancelled) return;
      const msg = err instanceof Error ? err.message : String(err);
      setConnectionState('error');
      if (/permission_denied|permission denied/i.test(msg)) {
        setErrorMessage(
          'Realtime Database rules denied access. Deploy database.rules.json to your Firebase Realtime Database.'
        );
      } else {
        setErrorMessage(
          'Unable to reach Firebase Realtime Database. Enable Realtime Database in Firebase Console or set VITE_FIREBASE_DATABASE_URL.'
        );
      }
    };

    // 1. Monitor real RTDB WebSocket connection & register server-side onDisconnect cleanup
    const unsubscribeConnected = onValue(
      connectedRef,
      async (snap) => {
        if (cancelled) return;
        const connected = snap.val() === true;
        isConnectedRef.current = connected;

        if (!connected) {
          setConnectionState((prev) => (prev === 'error' ? 'error' : 'disconnected'));
          return;
        }

        try {
          // Register automatic server-side cleanup BEFORE writing presence state
          await onDisconnect(selfRef).remove();
          await set(selfRef, buildPresenceRecord());
          if (!cancelled) {
            setConnectionState('connected');
            setErrorMessage(null);
          }
        } catch (err) {
          handleRtdbError(err);
        }
      },
      (err) => {
        handleRtdbError(err);
      }
    );

    // 2. Subscribe to all active peers in this Studio room
    const parsePeersFromSnapshot = (rawVal: unknown): StudioPeerPresence[] => {
      if (!rawVal || typeof rawVal !== 'object') return [];
      const now = Date.now();
      const nextPeers: StudioPeerPresence[] = [];

      for (const [key, entry] of Object.entries(rawVal as Record<string, unknown>)) {
        if (key === selfSessionId || !entry || typeof entry !== 'object') continue;
        const record = entry as Record<string, unknown>;
        const lastActive = Number(record.lastActive || 0);
        if (lastActive > 0 && now - lastActive > STALE_PEER_THRESHOLD_MS) {
          continue;
        }
        const entrySessionId = typeof record.sessionId === 'string' ? record.sessionId : key;
        const entryUid = typeof record.uid === 'string' ? record.uid : '';
        if (!entryUid) continue;

        const peerName = sanitizeDisplayName(
          typeof record.displayName === 'string' ? record.displayName : null,
          null
        );
        const peerColor = isValidHexColor(record.color)
          ? record.color
          : pickDeterministicColor(entrySessionId);

        nextPeers.push({
          uid: entryUid,
          sessionId: entrySessionId,
          displayName: peerName,
          initials:
            typeof record.initials === 'string' && record.initials.trim()
              ? record.initials.trim().slice(0, 4)
              : computeInitials(peerName),
          photoURL:
            typeof record.photoURL === 'string' && /^https?:\/\//i.test(record.photoURL)
              ? record.photoURL
              : undefined,
          color: peerColor,
          x: clampCoord(record.x),
          y: clampCoord(record.y),
          visible: Boolean(record.visible),
          isClicking: Boolean(record.isClicking),
          route: typeof record.route === 'string' ? record.route : safeRoute,
          activeArea: typeof record.activeArea === 'string' ? record.activeArea : 'Studio',
          lastActive: lastActive || now,
        });
      }

      return nextPeers.sort((a, b) => b.lastActive - a.lastActive);
    };

    const unsubscribeRoom = onValue(
      roomRef,
      (snapshot) => {
        if (cancelled) return;
        setPeers(parsePeersFromSnapshot(snapshot.val()));
      },
      (err) => {
        handleRtdbError(err);
      }
    );

    // 3. Throttled pointer emitter (20 Hz max, normalized viewport coordinates)
    const flushCoords = (coords: { x: number; y: number; visible: boolean }) => {
      if (cancelled || !isConnectedRef.current) return;
      lastEmitAtRef.current = Date.now();
      lastCoordsRef.current = coords;
      update(selfRef, {
        x: clampCoord(coords.x),
        y: clampCoord(coords.y),
        visible: broadcastCursor ? coords.visible : false,
        lastActive: serverTimestamp(),
      }).catch((err) => {
        handleRtdbError(err);
      });
    };

    const schedulePointerEmit = (x: number, y: number, visible: boolean) => {
      if (!broadcastCursor || !isConnectedRef.current) return;
      const prev = lastCoordsRef.current;
      const dx = Math.abs(x - prev.x);
      const dy = Math.abs(y - prev.y);
      if (visible === prev.visible && dx < MIN_COORD_DELTA && dy < MIN_COORD_DELTA) {
        return;
      }

      const now = Date.now();
      const elapsed = now - lastEmitAtRef.current;
      if (elapsed >= POINTER_THROTTLE_MS) {
        if (throttleTimerRef.current !== null) {
          window.clearTimeout(throttleTimerRef.current);
          throttleTimerRef.current = null;
        }
        pendingCoordsRef.current = null;
        flushCoords({ x, y, visible });
      } else {
        pendingCoordsRef.current = { x, y, visible };
        if (throttleTimerRef.current === null) {
          throttleTimerRef.current = window.setTimeout(() => {
            throttleTimerRef.current = null;
            if (pendingCoordsRef.current) {
              const next = pendingCoordsRef.current;
              pendingCoordsRef.current = null;
              flushCoords(next);
            }
          }, POINTER_THROTTLE_MS - elapsed);
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const vw = Math.max(window.innerWidth, 1);
      const vh = Math.max(window.innerHeight, 1);
      schedulePointerEmit(clampCoord(e.clientX / vw), clampCoord(e.clientY / vh), true);
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (!broadcastCursor || !isConnectedRef.current || e.pointerType === 'touch') return;
      const vw = Math.max(window.innerWidth, 1);
      const vh = Math.max(window.innerHeight, 1);
      const x = clampCoord(e.clientX / vw);
      const y = clampCoord(e.clientY / vh);
      lastCoordsRef.current = { x, y, visible: true };
      update(selfRef, {
        x,
        y,
        visible: true,
        isClicking: true,
        lastActive: serverTimestamp(),
      }).catch(() => {});

      if (clickResetTimerRef.current !== null) {
        window.clearTimeout(clickResetTimerRef.current);
      }
      clickResetTimerRef.current = window.setTimeout(() => {
        clickResetTimerRef.current = null;
        if (!cancelled && isConnectedRef.current) {
          update(selfRef, { isClicking: false }).catch(() => {});
        }
      }, 220);
    };

    const handlePointerLeave = () => {
      if (!isConnectedRef.current) return;
      flushCoords({ ...lastCoordsRef.current, visible: false });
    };

    const handleVisibilityChange = () => {
      if (!isConnectedRef.current) return;
      if (document.hidden) {
        flushCoords({ ...lastCoordsRef.current, visible: false });
      } else {
        update(selfRef, { lastActive: serverTimestamp() }).catch(() => {});
      }
    };

    // 4. Periodic heartbeat & local stale-peer sweep so idle users stay fresh and ghosts vanish
    const heartbeatTimer = window.setInterval(() => {
      if (cancelled) return;
      if (!document.hidden && isConnectedRef.current) {
        update(selfRef, { lastActive: serverTimestamp() }).catch(() => {});
      }
      const cutoff = Date.now() - STALE_PEER_THRESHOLD_MS;
      setPeers((prev) => prev.filter((p) => p.lastActive >= cutoff));
    }, HEARTBEAT_INTERVAL_MS);

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);
    window.addEventListener('blur', handlePointerLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      isConnectedRef.current = false;
      window.clearInterval(heartbeatTimer);
      if (throttleTimerRef.current !== null) {
        window.clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
      if (clickResetTimerRef.current !== null) {
        window.clearTimeout(clickResetTimerRef.current);
        clickResetTimerRef.current = null;
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('blur', handlePointerLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsubscribeConnected();
      unsubscribeRoom();
      off(connectedRef);
      off(roomRef);
      remove(selfRef).catch(() => {});
    };
  }, [enabled, authLoading, user?.uid, user?.displayName, user?.email, user?.photoURL, safeRoomId, route, activeArea, selfSessionId, selfColor, broadcastCursor]);

  return {
    peers,
    selfSessionId,
    selfColor,
    connectionState,
    errorMessage,
  };
}
