import { initializeApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut,
  deleteUser,
  onAuthStateChanged,
  linkWithPopup,
  linkWithCredential,
  unlink,
  EmailAuthProvider,
  reauthenticateWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  initializeFirestore,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize the Firebase application
const app = initializeApp(firebaseConfig);

// Initialize Firestore specifying database ID and long-polling to avoid iframe/proxy stream timeouts
export const db: Firestore = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);

// Resolve Firebase Realtime Database URL (supports explicit VITE_FIREBASE_DATABASE_URL override)
const envDatabaseUrl =
  typeof import.meta !== 'undefined' &&
  typeof (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_FIREBASE_DATABASE_URL ===
    'string'
    ? (import.meta as { env?: Record<string, string | undefined> }).env!.VITE_FIREBASE_DATABASE_URL!.trim()
    : '';

export const realtimeDatabaseUrl: string =
  envDatabaseUrl ||
  (firebaseConfig as { databaseURL?: string }).databaseURL ||
  `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com`;

let rtdbInstance: Database | null = null;
try {
  rtdbInstance = getDatabase(app, realtimeDatabaseUrl);
} catch (err) {
  console.warn('[Firebase RTDB] Initialization warning:', err);
  rtdbInstance = null;
}

export const rtdb: Database | null = rtdbInstance;

// Initialize Firebase Authentication with persistent IndexedDB / localStorage session storage
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

let persistencePromise: Promise<void> | null = null;

/**
 * Ensures Firebase Auth persists sessions across page refreshes using IndexedDB
 * first, with automatic fallback to browser localStorage.
 */
export function ensureAuthPersistence(): Promise<void> {
  if (!persistencePromise) {
    persistencePromise = setPersistence(auth, indexedDBLocalPersistence).catch(() =>
      setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.warn('[Firebase Auth] Persistence fallback warning:', err);
      })
    );
  }
  return persistencePromise;
}

// Kick off persistence configuration immediately on module load
ensureAuthPersistence();

// Operation Types for error diagnosis
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Standardized Firestore error handler conforming to FirestoreErrorInfo
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser: FirebaseUser | null = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Tests connection to Firestore from server on boot
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Checking network or config.');
    }
    return false;
  }
}

// Perform boot test connection asynchronously
testFirestoreConnection().catch(() => {
  // Silent catch on boot
});

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut,
  deleteUser,
  onAuthStateChanged,
  linkWithPopup,
  linkWithCredential,
  unlink,
  EmailAuthProvider,
  reauthenticateWithPopup,
};
export type { FirebaseUser };
