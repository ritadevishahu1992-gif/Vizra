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
import { Project } from '../types/ai';

export interface UserProfileData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageRecord {
  id: string;
  userId: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

/**
 * Sync user profile to Firestore
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
      updatedAt: now,
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
    
    // Ensure payload adheres strictly to blueprint bounds
    const payload = {
      id: project.id,
      ownerId: userId,
      title: project.title.slice(0, 120),
      category: project.category || 'general',
      description: (project.description || '').slice(0, 2000),
      status: 'active',
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
      return {
        id: data.id,
        title: data.title,
        category: data.category,
        description: data.description || '',
        createdAt: new Date(data.createdAt).getTime() || Date.now(),
        updatedAt: new Date(data.updatedAt).getTime() || Date.now(),
        stages: [],
        memory: {
          goal: data.description || '',
          targetAudience: 'Vizra Community',
          style: 'Obsidian Kinetic 60fps',
          requirements: [],
          previousDecisions: [],
          currentProgress: 'Initiated in Firestore',
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
 * Save chat message to Firestore
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
      createdAt: new Date().toISOString(),
    };
    await setDoc(msgRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
