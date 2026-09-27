import { PersonalMemoryItem, ProjectMemory } from '../types/ai';

const PERSONAL_MEMORY_KEY = 'vizra_omnia_personal_memories_v1';
const MEMORY_ENABLED_KEY = 'vizra_omnia_memory_enabled_v1';

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

export function getPersonalMemories(): PersonalMemoryItem[] {
  try {
    const raw = localStorage.getItem(PERSONAL_MEMORY_KEY);
    if (!raw) {
      localStorage.setItem(PERSONAL_MEMORY_KEY, JSON.stringify(defaultPersonalMemories));
      return defaultPersonalMemories;
    }
    return JSON.parse(raw);
  } catch {
    return defaultPersonalMemories;
  }
}

export function savePersonalMemories(memories: PersonalMemoryItem[]): void {
  try {
    localStorage.setItem(PERSONAL_MEMORY_KEY, JSON.stringify(memories));
  } catch (err) {
    console.error('Failed to save memories', err);
  }
}

export function addPersonalMemory(category: PersonalMemoryItem['category'], content: string): PersonalMemoryItem {
  const memories = getPersonalMemories();
  const newMemory: PersonalMemoryItem = {
    id: `mem-${Date.now()}`,
    category,
    content: content.trim(),
    createdAt: Date.now(),
  };
  const updated = [newMemory, ...memories];
  savePersonalMemories(updated);
  return newMemory;
}

export function deletePersonalMemory(id: string): void {
  const memories = getPersonalMemories();
  const updated = memories.filter((m) => m.id !== id);
  savePersonalMemories(updated);
}

export function clearAllPersonalMemories(): void {
  savePersonalMemories([]);
}

export function isMemoryEnabled(): boolean {
  try {
    const val = localStorage.getItem(MEMORY_ENABLED_KEY);
    return val !== 'false';
  } catch {
    return true;
  }
}

export function setMemoryEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(MEMORY_ENABLED_KEY, enabled ? 'true' : 'false');
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
