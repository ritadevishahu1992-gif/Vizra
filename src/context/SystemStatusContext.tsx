import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  API_HEALTH_SIGNAL_EVENT,
  type ApiHealthSignalDetail,
} from '../utils/apiErrorHandler';

export type SystemStatusLevel = 'normal' | 'heavy_traffic' | 'limited_access';

export interface SystemStatusDetails {
  apiReachable: boolean;
  aiServiceReady: boolean;
  activeRequests: number;
  maxConcurrent: number;
  queuedRequests: number;
  maxQueueSize: number;
  degradedModels: string[];
  backendP95LatencyMs: number | null;
  reason: string;
}

export interface SystemStatusContextValue {
  level: SystemStatusLevel;
  label: 'Normal' | 'Heavy Traffic' | 'Limited Access';
  latencyMs: number | null;
  lastCheckedAt: Date | null;
  isChecking: boolean;
  details: SystemStatusDetails;
  refresh: () => Promise<void>;
}

const POLL_INTERVAL_MS = 30_000;
const HEALTH_TIMEOUT_MS = 5_000;
const HEAVY_TRAFFIC_LATENCY_MS = 600;
const LIMITED_ACCESS_LATENCY_MS = 2_500;
const LIVE_SIGNAL_TTL_MS = 40_000;

interface HealthApiResponse {
  status?: string;
  serviceState?: SystemStatusLevel;
  hasGemini?: boolean;
  reliability?: {
    activeAiRequests?: number;
    maxConcurrentAiRequests?: number;
    queuedAiRequests?: number;
    maxQueueSize?: number;
    avgQueueWaitMs?: number;
    avgResponseLatencyMs?: number;
    p95ResponseLatencyMs?: number;
    modelHealth?: Record<string, { degraded?: boolean; consecutiveFailures?: number }>;
  };
}

export const STATUS_LABELS: Record<
  SystemStatusLevel,
  'Normal' | 'Heavy Traffic' | 'Limited Access'
> = {
  normal: 'Normal',
  heavy_traffic: 'Heavy Traffic',
  limited_access: 'Limited Access',
};

const DEFAULT_DETAILS: SystemStatusDetails = {
  apiReachable: true,
  aiServiceReady: true,
  activeRequests: 0,
  maxConcurrent: 6,
  queuedRequests: 0,
  maxQueueSize: 24,
  degradedModels: [],
  backendP95LatencyMs: null,
  reason: 'All core services and Omnia AI are operating normally.',
};

const SystemStatusContext = createContext<SystemStatusContextValue | null>(null);

export const SystemStatusProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [level, setLevel] = useState<SystemStatusLevel>('normal');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [details, setDetails] = useState<SystemStatusDetails>(DEFAULT_DETAILS);

  const inFlightRef = useRef<boolean>(false);
  const lastCheckTsRef = useRef<number>(0);
  const recentSignalRef = useRef<ApiHealthSignalDetail | null>(null);
  const recoveryTimerRef = useRef<number | null>(null);
  const mountedRef = useRef<boolean>(true);

  const checkHealth = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (mountedRef.current) {
      setIsChecking(true);
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      inFlightRef.current = false;
      lastCheckTsRef.current = Date.now();
      if (mountedRef.current) {
        setLevel('limited_access');
        setLatencyMs(null);
        setLastCheckedAt(new Date());
        setDetails({
          ...DEFAULT_DETAILS,
          apiReachable: false,
          aiServiceReady: false,
          reason: 'Your device appears offline. Backend services are unreachable.',
        });
        setIsChecking(false);
      }
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    try {
      const response = await fetch(`/api/health?t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      const elapsedMs = Math.max(
        1,
        Math.round(
          (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime
        )
      );

      window.clearTimeout(timeoutId);

      if (!response.ok) {
        const nextLevel: SystemStatusLevel =
          response.status === 429 ? 'heavy_traffic' : 'limited_access';
        if (mountedRef.current) {
          setLevel(nextLevel);
          setLatencyMs(elapsedMs);
          setLastCheckedAt(new Date());
          setDetails({
            ...DEFAULT_DETAILS,
            apiReachable: response.status === 429,
            aiServiceReady: response.status === 429,
            reason:
              response.status === 429
                ? 'Elevated request volume detected. Responses may take slightly longer.'
                : `Backend health check returned HTTP ${response.status}. Service access is currently limited.`,
          });
        }
        return;
      }

      const data = (await response.json()) as HealthApiResponse;
      const rel = data.reliability || {};
      const activeRequests = Number(rel.activeAiRequests ?? 0);
      const maxConcurrent = Number(rel.maxConcurrentAiRequests ?? 6);
      const queuedRequests = Number(rel.queuedAiRequests ?? 0);
      const maxQueueSize = Number(rel.maxQueueSize ?? 24);
      const avgQueueWaitMs = Number(rel.avgQueueWaitMs ?? 0);
      const backendP95LatencyMs =
        typeof rel.p95ResponseLatencyMs === 'number' && rel.p95ResponseLatencyMs > 0
          ? rel.p95ResponseLatencyMs
          : null;

      const modelHealthMap = rel.modelHealth || {};
      const modelNames = Object.keys(modelHealthMap);
      const degradedModels = modelNames.filter((name) => Boolean(modelHealthMap[name]?.degraded));
      const allModelsDegraded =
        modelNames.length > 0 && degradedModels.length === modelNames.length;

      const aiServiceReady = data.hasGemini !== false;
      const queueSaturated = maxQueueSize > 0 && queuedRequests >= maxQueueSize;
      const highConcurrency =
        maxConcurrent > 0 && activeRequests >= Math.max(1, Math.ceil(maxConcurrent * 0.7));

      // Check if an active live API overload/unavailable signal occurred very recently
      const signal = recentSignalRef.current;
      const signalActive =
        signal !== null && Date.now() - signal.timestamp < LIVE_SIGNAL_TTL_MS;

      let computedLevel: SystemStatusLevel = 'normal';
      let reason = 'All core services and Omnia AI are operating normally.';

      if (
        data.status !== 'ok' ||
        !aiServiceReady ||
        data.serviceState === 'limited_access' ||
        allModelsDegraded ||
        queueSaturated ||
        elapsedMs >= LIMITED_ACCESS_LATENCY_MS
      ) {
        computedLevel = 'limited_access';
        if (!aiServiceReady) {
          reason = 'Omnia AI service is temporarily unavailable. Core web features remain active.';
        } else if (allModelsDegraded) {
          reason = 'AI model endpoints are experiencing degraded availability.';
        } else if (queueSaturated) {
          reason = 'Request capacity is currently saturated. New AI requests may be delayed.';
        } else if (elapsedMs >= LIMITED_ACCESS_LATENCY_MS) {
          reason = `Severe backend latency detected (${elapsedMs} ms). Access may be intermittent.`;
        } else {
          reason = 'Service availability is currently restricted.';
        }
      } else if (
        data.serviceState === 'heavy_traffic' ||
        elapsedMs >= HEAVY_TRAFFIC_LATENCY_MS ||
        queuedRequests > 0 ||
        highConcurrency ||
        degradedModels.length > 0 ||
        avgQueueWaitMs >= 1500
      ) {
        computedLevel = 'heavy_traffic';
        if (queuedRequests > 0) {
          reason = `Handling high traffic (${queuedRequests} queued). Responses may take slightly longer.`;
        } else if (degradedModels.length > 0) {
          reason = 'Elevated load on primary AI model; automatic fallback routing is active.';
        } else if (elapsedMs >= HEAVY_TRAFFIC_LATENCY_MS) {
          reason = `Elevated backend latency (${elapsedMs} ms) under current traffic load.`;
        } else {
          reason = 'High concurrent demand detected across Omnia AI services.';
        }
      } else if (signalActive && signal && signal.kind !== 'ok') {
        computedLevel = signal.kind;
        reason =
          signal.kind === 'limited_access'
            ? 'Recent AI request encountered temporary service unavailability.'
            : 'Recent AI request encountered elevated traffic load.';
      }

      if (mountedRef.current) {
        setLevel(computedLevel);
        setLatencyMs(elapsedMs);
        setLastCheckedAt(new Date());
        setDetails({
          apiReachable: true,
          aiServiceReady,
          activeRequests,
          maxConcurrent,
          queuedRequests,
          maxQueueSize,
          degradedModels,
          backendP95LatencyMs,
          reason,
        });
      }
    } catch {
      window.clearTimeout(timeoutId);
      if (mountedRef.current) {
        setLevel('limited_access');
        setLatencyMs(null);
        setLastCheckedAt(new Date());
        setDetails({
          ...DEFAULT_DETAILS,
          apiReachable: false,
          aiServiceReady: false,
          reason: 'Unable to reach backend services. Retrying automatically.',
        });
      }
    } finally {
      inFlightRef.current = false;
      lastCheckTsRef.current = Date.now();
      if (mountedRef.current) {
        setIsChecking(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void checkHealth();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void checkHealth();
      }
    }, POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - lastCheckTsRef.current >= 10_000
      ) {
        void checkHealth();
      }
    };

    const handleOnline = () => {
      void checkHealth();
    };

    const handleOffline = () => {
      setLevel('limited_access');
      setLatencyMs(null);
      setLastCheckedAt(new Date());
      setDetails({
        ...DEFAULT_DETAILS,
        apiReachable: false,
        aiServiceReady: false,
        reason: 'Your device appears offline. Backend services are unreachable.',
      });
    };

    const handleApiSignal = (event: Event) => {
      const customEvent = event as CustomEvent<ApiHealthSignalDetail>;
      const detail = customEvent.detail;
      if (!detail) return;
      recentSignalRef.current = detail;

      if (detail.kind === 'limited_access') {
        setLevel('limited_access');
        setDetails((prev) => ({
          ...prev,
          reason: 'Temporary service interruption detected on a live request.',
        }));
      } else if (detail.kind === 'heavy_traffic') {
        setLevel((prev) => (prev === 'limited_access' ? prev : 'heavy_traffic'));
        setDetails((prev) => ({
          ...prev,
          reason: 'Elevated traffic detected on recent requests. Automatic retries are active.',
        }));
      } else if (detail.kind === 'ok') {
        // Clear stale error signal and verify health if we were degraded
        recentSignalRef.current = null;
      }

      if (detail.kind !== 'ok') {
        if (recoveryTimerRef.current !== null) {
          window.clearTimeout(recoveryTimerRef.current);
        }
        recoveryTimerRef.current = window.setTimeout(() => {
          recoveryTimerRef.current = null;
          void checkHealth();
        }, 4_000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(API_HEALTH_SIGNAL_EVENT, handleApiSignal);

    return () => {
      mountedRef.current = false;
      window.clearInterval(intervalId);
      if (recoveryTimerRef.current !== null) {
        window.clearTimeout(recoveryTimerRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(API_HEALTH_SIGNAL_EVENT, handleApiSignal);
    };
  }, [checkHealth]);

  const value = useMemo<SystemStatusContextValue>(
    () => ({
      level,
      label: STATUS_LABELS[level],
      latencyMs,
      lastCheckedAt,
      isChecking,
      details,
      refresh: checkHealth,
    }),
    [level, latencyMs, lastCheckedAt, isChecking, details, checkHealth]
  );

  return (
    <SystemStatusContext.Provider value={value}>
      {children}
    </SystemStatusContext.Provider>
  );
};

export function useSystemStatus(): SystemStatusContextValue {
  const ctx = useContext(SystemStatusContext);
  if (!ctx) {
    return {
      level: 'normal',
      label: 'Normal',
      latencyMs: null,
      lastCheckedAt: null,
      isChecking: false,
      details: DEFAULT_DETAILS,
      refresh: async () => {},
    };
  }
  return ctx;
}
