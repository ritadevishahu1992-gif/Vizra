import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Project, ProjectWorkflowStage } from '../types/ai';
import { DEFAULT_STAGE_TEMPLATES } from './projectService';

export interface UserProfileData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface ChatMessageRecord {
  id: string;
  userId: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * Sync user profile to Firestore (strictly aligned with firestore.rules isValidUserProfile)
 */
export async function syncUserProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    let existing: Partial<UserProfileData> | null = null;

    try {
      const existingSnap = await getDoc(userRef);
      if (existingSnap.exists()) {
        existing = existingSnap.data() as UserProfileData;
      }
    } catch (readErr) {
      console.warn('[Firestore] Profile pre-read non-fatal warning:', readErr);
    }

    const now = new Date().toISOString();
    const profilePayload: UserProfileData = {
      uid: user.uid,
      email: (user.email || existing?.email || '').slice(0, 254),
      displayName: (user.displayName || existing?.displayName || 'Vizra Creator').slice(0, 100),
      photoURL: (user.photoURL || existing?.photoURL || '').slice(0, 4000),
      createdAt: existing?.createdAt || now,
      lastLoginAt: now,
    };

    await setDoc(userRef, profilePayload);
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch (loggedErr) {
      console.warn('[Firestore] syncUserProfile handled warning:', loggedErr);
    }
  }
}

/**
 * Save user project to Firestore
 */
export async function saveUserProjectToFirestore(
  userId: string,
  project: Project
): Promise<void> {
  const path = `users/${userId}/projects/${project.id}`;
  try {
    const projectRef = doc(db, 'users', userId, 'projects', project.id);
    const now = new Date().toISOString();

    const allowedCategories = new Set([
      'video',
      'animation',
      'campaign',
      'app',
      'research',
      'writing',
      'general',
    ]);
    const normalizedCategory = allowedCategories.has(project.category)
      ? project.category
      : 'general';

    const sanitizedStages = Array.isArray(project.stages)
      ? project.stages.slice(0, 25).map((s, idx) => ({
          id: String(s.id || `stage-${idx + 1}`).slice(0, 64),
          index: Number(s.index || idx + 1),
          title: String(s.title || `Stage ${idx + 1}`).slice(0, 120),
          description: String(s.description || '').slice(0, 300),
          status:
            s.status === 'completed' || s.status === 'in_progress'
              ? s.status
              : 'not_started',
          content: String(s.content || '').slice(0, 4000),
          updatedAt: Number(s.updatedAt || Date.now()),
        }))
      : [];

    // Ensure payload adheres strictly to blueprint & firestore.rules bounds (stages <= 25)
    const payload = {
      id: project.id,
      ownerId: userId,
      title: project.title.slice(0, 120),
      category: normalizedCategory,
      description: (project.description || '').slice(0, 2000),
      status: 'active',
      stages: sanitizedStages,
      createdAt: new Date(project.createdAt || Date.now()).toISOString(),
      updatedAt: now,
    };

    await setDoc(projectRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch all user projects from Firestore
 */
export async function getUserProjectsFromFirestore(userId: string): Promise<Project[]> {
  const path = `users/${userId}/projects`;
  try {
    const projectsCol = collection(db, 'users', userId, 'projects');
    const q = query(projectsCol, orderBy('updatedAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const rawStages = Array.isArray(data.stages) ? data.stages : [];
      const hydratedStages: ProjectWorkflowStage[] =
        rawStages.length > 0
          ? rawStages.map((s: any, idx: number) => {
              const tmpl = DEFAULT_STAGE_TEMPLATES[idx];
              return {
                id: String(s?.id || `stage-${idx + 1}`),
                index: Number(s?.index || idx + 1),
                title: String(s?.title || tmpl?.title || `Stage ${idx + 1}`),
                description: String(s?.description || tmpl?.description || ''),
                status:
                  s?.status === 'completed' || s?.status === 'in_progress'
                    ? s.status
                    : 'not_started',
                content: String(s?.content || tmpl?.defaultContent || ''),
                updatedAt: Number(s?.updatedAt || Date.now()),
              };
            })
          : DEFAULT_STAGE_TEMPLATES.map((tmpl, idx) => ({
              id: `stage-${idx + 1}`,
              index: idx + 1,
              title: tmpl.title,
              description: tmpl.description,
              status: idx === 0 ? 'completed' : idx === 1 ? 'in_progress' : 'not_started',
              content: tmpl.defaultContent,
              updatedAt: Date.now(),
            }));

      return {
        id: data.id,
        title: data.title,
        category: data.category,
        description: data.description || '',
        createdAt: new Date(data.createdAt).getTime() || Date.now(),
        updatedAt: new Date(data.updatedAt).getTime() || Date.now(),
        stages: hydratedStages,
        memory: {
          goal: data.description || '',
          targetAudience: 'Vizra Community',
          style: 'Obsidian Kinetic 60fps',
          requirements: [],
          previousDecisions: [],
          currentProgress: `${hydratedStages.filter((s) => s.status === 'completed').length}/${hydratedStages.length} stages completed`,
        },
        tasks: [],
        notes: '',
        files: [],
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Delete a user project from Firestore
 */
export async function deleteUserProjectFromFirestore(
  userId: string,
  projectId: string
): Promise<void> {
  const path = `users/${userId}/projects/${projectId}`;
  try {
    const projectRef = doc(db, 'users', userId, 'projects', projectId);
    await deleteDoc(projectRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save chat message to Firestore (strictly aligned with firestore.rules isValidChatMessage)
 */
export async function saveChatMessageToFirestore(
  userId: string,
  conversationId: string,
  msg: { id: string; role: 'user' | 'assistant'; content: string }
): Promise<void> {
  const path = `users/${userId}/conversations/${conversationId}/messages/${msg.id}`;
  try {
    const msgRef = doc(db, 'users', userId, 'conversations', conversationId, 'messages', msg.id);
    const payload: ChatMessageRecord = {
      id: msg.id,
      userId,
      conversationId,
      role: msg.role,
      content: msg.content.slice(0, 20000),
      timestamp: new Date().toISOString(),
    };
    await setDoc(msgRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Deletes all user-owned Firestore projects, conversation messages, and profile documents
 * while respecting firestore.rules ownership constraints.
 */
export async function deleteUserFirestoreWorkspace(
  userId: string,
  conversationIds: string[] = []
): Promise<{
  deletedProjects: number;
  deletedMessages: number;
  deletedProfile: boolean;
}> {
  let deletedProjects = 0;
  let deletedMessages = 0;
  let deletedProfile = false;

  if (!userId) {
    return { deletedProjects, deletedMessages, deletedProfile };
  }

  try {
    const projectsSnap = await getDocs(collection(db, 'users', userId, 'projects'));
    for (const projDoc of projectsSnap.docs) {
      await deleteDoc(projDoc.ref);
      deletedProjects += 1;
    }
  } catch (err) {
    console.warn('[Firestore] Non-fatal project cascade delete warning:', err);
  }

  const validConvIds = Array.from(
    new Set(conversationIds.filter((cid) => typeof cid === 'string' && /^[a-zA-Z0-9_\-]+$/.test(cid)))
  );
  for (const convId of validConvIds) {
    try {
      const msgsSnap = await getDocs(
        collection(db, 'users', userId, 'conversations', convId, 'messages')
      );
      for (const msgDoc of msgsSnap.docs) {
        await deleteDoc(msgDoc.ref);
        deletedMessages += 1;
      }
    } catch (err) {
      console.warn(`[Firestore] Non-fatal message cascade warning (${convId}):`, err);
    }
  }

  try {
    await deleteDoc(doc(db, 'users', userId));
    deletedProfile = true;
  } catch (err) {
    console.warn('[Firestore] Non-fatal user profile delete warning:', err);
  }

  return { deletedProjects, deletedMessages, deletedProfile };
}
