import { PersonalMemoryItem, ProjectMemory } from '../types/ai';

const PERSONAL_MEMORY_KEY_PREFIX = 'vizra_omnia_personal_memories_v1';
const MEMORY_ENABLED_KEY = 'vizra_omnia_memory_enabled_v1';
const ACTIVE_SESSION_STORAGE_KEY = 'vizra_active_auth_session_v1';
const PERSISTED_SESSION_STORAGE_KEY = 'vizra_persisted_auth_session_v1';
const ACTIVE_UID_STORAGE_KEY = 'vizra_active_user_uid_v1';

function resolveScopedMemoryKey(explicitUid?: string): string {
  if (explicitUid && explicitUid.trim()) {
    return `${PERSONAL_MEMORY_KEY_PREFIX}_${explicitUid.trim()}`;
  }
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const directUid = localStorage.getItem(ACTIVE_UID_STORAGE_KEY);
      if (directUid && directUid.trim()) {
        return `${PERSONAL_MEMORY_KEY_PREFIX}_${directUid.trim()}`;
      }
      for (const sessionKey of [ACTIVE_SESSION_STORAGE_KEY, PERSISTED_SESSION_STORAGE_KEY]) {
        const rawSession = localStorage.getItem(sessionKey);
        if (rawSession) {
          const parsed = JSON.parse(rawSession);
          const candidateUid = parsed?.uid || parsed?.user?.uid;
          if (candidateUid && typeof candidateUid === 'string') {
            return `${PERSONAL_MEMORY_KEY_PREFIX}_${candidateUid}`;
          }
        }
      }
    }
  } catch {}
  return `${PERSONAL_MEMORY_KEY_PREFIX}_anon`;
}

export function scrubMemoryPii(text: string): string {
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
    .replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[REDACTED_PHONE]')
    .replace(/\b(?:AIza[0-9A-Za-z_-]{35}|sk-[a-zA-Z0-9]{20,})\b/g, '[REDACTED_KEY]')
    .trim();
}

const defaultPersonalMemories: PersonalMemoryItem[] = [
  {
    id: 'mem-1',
    category: 'language',
    content: 'Default to English, but mirror Hindi and Hinglish when the user writes in them.',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: 'mem-2',
    category: 'style',
    content: 'Prefers clean, structured answers without excessive filler or sycophancy.',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: 'mem-3',
    category: 'workflow',
    content: 'Focuses on 60fps kinetic motion, cinematic visual directions, and modern web architecture.',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
];

const inMemoryStorage = new Map<string, string>();

function safeStorageGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {}
  return inMemoryStorage.get(key) || null;
}

function safeStorageSet(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
  } catch {}
  inMemoryStorage.set(key, value);
}

export function getPersonalMemories(uid?: string): PersonalMemoryItem[] {
  try {
    const key = resolveScopedMemoryKey(uid);
    const raw = safeStorageGet(key);
    if (!raw) {
      safeStorageSet(key, JSON.stringify(defaultPersonalMemories));
      return defaultPersonalMemories;
    }
    return JSON.parse(raw);
  } catch {
    return defaultPersonalMemories;
  }
}

export function savePersonalMemories(memories: PersonalMemoryItem[], uid?: string): void {
  try {
    const key = resolveScopedMemoryKey(uid);
    const sanitized = memories.map((m) => ({
      ...m,
      content: scrubMemoryPii(m.content),
    }));
    safeStorageSet(key, JSON.stringify(sanitized));
  } catch (err) {
    console.error('Failed to save memories', err);
  }
}

export function addPersonalMemory(category: PersonalMemoryItem['category'], content: string, uid?: string): PersonalMemoryItem {
  const memories = getPersonalMemories(uid);
  const newMemory: PersonalMemoryItem = {
    id: `mem-${Date.now()}`,
    category,
    content: scrubMemoryPii(content),
    createdAt: Date.now(),
  };
  const updated = [newMemory, ...memories];
  savePersonalMemories(updated, uid);
  return newMemory;
}

export function deletePersonalMemory(id: string, uid?: string): void {
  const memories = getPersonalMemories(uid);
  const updated = memories.filter((m) => m.id !== id);
  savePersonalMemories(updated, uid);
}

export function clearAllPersonalMemories(uid?: string): void {
  savePersonalMemories([], uid);
}

export function isMemoryEnabled(): boolean {
  try {
    const val = safeStorageGet(MEMORY_ENABLED_KEY);
    return val !== 'false';
  } catch {
    return true;
  }
}

export function setMemoryEnabled(enabled: boolean): void {
  try {
    safeStorageSet(MEMORY_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to toggle memory', err);
  }
}

export function createDefaultProjectMemory(goal: string = ''): ProjectMemory {
  return {
    goal: goal || 'Produce high-impact creative direction and technical assets.',
    targetAudience: 'Global creators, developers, and visual storytellers.',
    style: 'Kinetic minimalism, obsidian depth, surgical Vizra red accents, high-contrast geometry.',
    requirements: [
      'Strict brand adherence (pure black base)',
      '60fps motion curve trajectories',
      'Step-by-step modular pipeline',
    ],
    previousDecisions: [
      'Approved 10-stage creative workflow',
      'Selected procedural bezier easing',
    ],
    currentProgress: 'Creative brief synthesized. Ready for production stage execution.',
  };
}
