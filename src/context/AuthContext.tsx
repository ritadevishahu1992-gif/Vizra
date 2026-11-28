import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut,
  linkWithPopup,
  linkWithCredential,
  unlink,
  EmailAuthProvider,
  FirebaseUser,
  auth,
  googleProvider,
  ensureAuthPersistence,
} from '../lib/firebase';
import { syncUserProfile } from '../services/firestoreService';
import { setMonitoringUser } from '../lib/monitoring';

export interface PersistedAuthSessionSnapshot {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  restoredFromStorageAt: number;
}

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  statusMessage: string | null;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  clearAuthMessages: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  signOutUser: () => Promise<void>;
  linkGoogleProvider: () => Promise<{ ok: boolean; message: string }>;
  linkEmailPasswordProvider: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  unlinkAuthProvider: (providerId: string) => Promise<{ ok: boolean; message: string }>;
  resendVerificationEmail: () => Promise<{ ok: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  statusMessage: null,
  isLoginModalOpen: false,
  openLoginModal: () => {},
  closeLoginModal: () => {},
  clearAuthMessages: () => {},
  signInWithGoogle: async () => {},
  signInWithEmail: async () => false,
  signUpWithEmail: async () => false,
  resetPassword: async () => false,
  signOutUser: async () => {},
  linkGoogleProvider: async () => ({ ok: false, message: 'Not signed in.' }),
  linkEmailPasswordProvider: async () => ({ ok: false, message: 'Not signed in.' }),
  unlinkAuthProvider: async () => ({ ok: false, message: 'Not signed in.' }),
  resendVerificationEmail: async () => ({ ok: false, message: 'Not signed in.' }),
});

function formatFirebaseAuthError(err: any): string {
  const code = err?.code || '';
  if (code === 'auth/popup-closed-by-user') {
    return 'Sign-in popup was closed. Please try again.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error during authentication. Check your internet connection.';
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Invalid email or password. Please verify your credentials.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many failed sign-in attempts. Access is temporarily locked—please wait a few minutes or reset your password.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (code === 'auth/credential-already-in-use') {
    return 'This sign-in credential is already linked to a different VIZRA account. Accounts are never merged silently—sign in to the original account to manage linked methods.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists for this email under another sign-in provider. Sign in with your original method first, then link additional providers in Settings.';
  }
  if (code === 'auth/provider-already-linked') {
    return 'This sign-in provider is already linked to your account.';
  }
  if (code === 'auth/requires-recent-login') {
    return 'For security, please sign out and sign back in recently before modifying authentication methods or deleting your account.';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 8 characters with numbers and symbols.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Email/password sign-in is not enabled on this Firebase project. Please use Continue with Google.';
  }
  return err?.message || 'Authentication failed. Please try again.';
}

const ACTIVE_USER_UID_STORAGE_KEY = 'vizra_active_user_uid_v1';
const PERSISTED_AUTH_SESSION_STORAGE_KEY = 'vizra_persisted_auth_session_v1';
const USER_SCOPED_LOCAL_KEYS = [
  'omnia_conversations_v1',
  'omnia_active_conv_id',
  'omnia_draft_prompt',
  'vizra_omnia_projects_v1',
  'vizra_omnia_active_project_id_v1',
  'vizra_omnia_personal_memories_v1',
  'vizra_workspace_uploaded_assets_v1',
  'vizra_workspace_client_tokens_v1',
];

function savePersistedAuthSessionSnapshot(firebaseUser: FirebaseUser): void {
  try {
    const snapshot: PersistedAuthSessionSnapshot = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || null,
      displayName: firebaseUser.displayName || null,
      photoURL: firebaseUser.photoURL || null,
      emailVerified: Boolean(firebaseUser.emailVerified),
      restoredFromStorageAt: Date.now(),
    };
    localStorage.setItem(PERSISTED_AUTH_SESSION_STORAGE_KEY, JSON.stringify(snapshot));
    localStorage.setItem(ACTIVE_USER_UID_STORAGE_KEY, firebaseUser.uid);
  } catch {
    // Ignore localStorage quota or private-browsing errors
  }
}

function loadPersistedAuthSessionSnapshot(): FirebaseUser | null {
  try {
    if (auth.currentUser) {
      return auth.currentUser;
    }
    const raw = localStorage.getItem(PERSISTED_AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedAuthSessionSnapshot>;
    if (!parsed || typeof parsed.uid !== 'string' || !parsed.uid.trim()) {
      return null;
    }
    // Create a compatible hydrated user proxy until Firebase IndexedDB finishes restoring the full User instance
    const hydratedProxy = {
      uid: parsed.uid,
      email: parsed.email ?? null,
      displayName: parsed.displayName ?? null,
      photoURL: parsed.photoURL ?? null,
      emailVerified: Boolean(parsed.emailVerified),
      isAnonymous: false,
      providerData: [],
      getIdToken: async (forceRefresh?: boolean) => {
        if (auth.currentUser) {
          return auth.currentUser.getIdToken(forceRefresh);
        }
        if (typeof (auth as any).authStateReady === 'function') {
          await (auth as any).authStateReady();
        }
        const restoredUser = auth.currentUser as FirebaseUser | null;
        return restoredUser ? restoredUser.getIdToken(forceRefresh) : '';
      },
    } as unknown as FirebaseUser;
    return hydratedProxy;
  } catch {
    return null;
  }
}

export function purgeUserSessionStorage(): void {
  try {
    for (const key of USER_SCOPED_LOCAL_KEYS) {
      localStorage.removeItem(key);
    }
    localStorage.removeItem(ACTIVE_USER_UID_STORAGE_KEY);
    localStorage.removeItem(PERSISTED_AUTH_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage access errors
  }
  try {
    sessionStorage.removeItem('vizra_admin_key');
  } catch {
    // Ignore sessionStorage access errors
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Hydrate initial user state synchronously from localStorage / auth.currentUser so page refreshes stay logged in
  const [user, setUser] = useState<FirebaseUser | null>(() => loadPersistedAuthSessionSnapshot());
  const [loading, setLoading] = useState<boolean>(() => loadPersistedAuthSessionSnapshot() === null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const initializeSessionRestoration = async () => {
      // 1. Ensure IndexedDB or localStorage persistence is configured on Firebase Auth
      await ensureAuthPersistence();

      // 2. Wait for Firebase Auth IndexedDB / localStorage state restoration to complete before subscribing
      if (typeof (auth as any).authStateReady === 'function') {
        try {
          await (auth as any).authStateReady();
        } catch {
          // Proceed to onAuthStateChanged listener
        }
      }

      if (!isMounted) return;

      unsubscribe = onAuthStateChanged(auth, async (currentUser: FirebaseUser | null) => {
        if (!isMounted) return;
        setMonitoringUser(currentUser?.uid ?? null);

        // Cross-user browser storage isolation: if a different user signs in on a shared browser,
        // purge the previous user's local workspace cache before initializing the new session.
        try {
          const previousUid = localStorage.getItem(ACTIVE_USER_UID_STORAGE_KEY);
          if (currentUser) {
            if (previousUid && previousUid !== currentUser.uid) {
              purgeUserSessionStorage();
            }
            savePersistedAuthSessionSnapshot(currentUser);
          } else if (previousUid) {
            purgeUserSessionStorage();
          }
        } catch {
          // Ignore localStorage access errors
        }

        setUser(currentUser);
        setLoading(false);

        if (currentUser) {
          try {
            await syncUserProfile({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
            });
          } catch (err) {
            console.error('Failed to sync user profile to Firestore:', err);
          }
        }
      });
    };

    initializeSessionRestoration();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const clearAuthMessages = () => {
    setError(null);
    setStatusMessage(null);
  };

  const openLoginModal = () => {
    clearAuthMessages();
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const dispatchServerLoginNotification = async (firebaseUser: FirebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      fetch('/api/auth/login-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      }).catch((notifyErr) => {
        console.warn('[Notification] Non-blocking dispatch warning:', notifyErr);
      });
    } catch (tokenErr) {
      console.warn('[Notification] Could not retrieve ID token for notification:', tokenErr);
    }
  };

  const signInWithGoogle = async () => {
    try {
      clearAuthMessages();
      await ensureAuthPersistence();
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        savePersistedAuthSessionSnapshot(result.user);
        setUser(result.user);
        try {
          await syncUserProfile({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
          });
        } catch (syncErr) {
          console.warn('Profile sync non-fatal warning:', syncErr);
        }
        await dispatchServerLoginNotification(result.user);
        setIsLoginModalOpen(false);
      }
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setError(formatFirebaseAuthError(err));
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<boolean> => {
    try {
      clearAuthMessages();
      await ensureAuthPersistence();
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (result.user) {
        savePersistedAuthSessionSnapshot(result.user);
        setUser(result.user);
        try {
          await syncUserProfile({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
          });
        } catch {
          // Non-fatal
        }
        await dispatchServerLoginNotification(result.user);
        setIsLoginModalOpen(false);
        return true;
      }
      return false;
    } catch (err: any) {
      setError(formatFirebaseAuthError(err));
      return false;
    }
  };

  const signUpWithEmail = async (
    name: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      clearAuthMessages();
      await ensureAuthPersistence();
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (result.user) {
        if (name.trim()) {
          await updateProfile(result.user, { displayName: name.trim() });
        }
        savePersistedAuthSessionSnapshot(result.user);
        setUser(result.user);
        try {
          await sendEmailVerification(result.user);
          setStatusMessage('Verification email sent. Please check your inbox.');
        } catch {
          // Non-fatal if verification email is rate-limited
        }
        try {
          await syncUserProfile({
            uid: result.user.uid,
            email: result.user.email,
            displayName: name.trim() || result.user.displayName,
            photoURL: result.user.photoURL,
          });
        } catch {
          // Non-fatal
        }
        await dispatchServerLoginNotification(result.user);
        return true;
      }
      return false;
    } catch (err: any) {
      setError(formatFirebaseAuthError(err));
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      clearAuthMessages();
      await sendPasswordResetEmail(auth, email.trim());
      setStatusMessage(`Password reset instructions have been sent to ${email.trim()}.`);
      return true;
    } catch (err: any) {
      setError(formatFirebaseAuthError(err));
      return false;
    }
  };

  const signOutUser = async () => {
    try {
      clearAuthMessages();
      purgeUserSessionStorage();
      setUser(null);
      await signOut(auth);
    } catch (err: any) {
      console.error('Sign-out failed:', err);
      setError(err.message || 'Failed to sign out.');
    }
  };

  const linkGoogleProvider = async (): Promise<{ ok: boolean; message: string }> => {
    if (!auth.currentUser) {
      return { ok: false, message: 'Sign in first to link Google to your account.' };
    }
    try {
      clearAuthMessages();
      const result = await linkWithPopup(auth.currentUser, googleProvider);
      if (result.user) {
        savePersistedAuthSessionSnapshot(result.user);
        setUser({ ...result.user } as FirebaseUser);
      }
      return { ok: true, message: 'Google sign-in linked to your account.' };
    } catch (err: any) {
      const msg = formatFirebaseAuthError(err);
      setError(msg);
      return { ok: false, message: msg };
    }
  };

  const linkEmailPasswordProvider = async (
    email: string,
    password: string
  ): Promise<{ ok: boolean; message: string }> => {
    if (!auth.currentUser) {
      return { ok: false, message: 'Sign in first to add Email & Password login.' };
    }
    if (password.length < 8) {
      return { ok: false, message: 'Password must be at least 8 characters long.' };
    }
    try {
      clearAuthMessages();
      const cred = EmailAuthProvider.credential(email.trim(), password);
      const result = await linkWithCredential(auth.currentUser, cred);
      if (result.user) {
        savePersistedAuthSessionSnapshot(result.user);
        setUser({ ...result.user } as FirebaseUser);
      }
      return { ok: true, message: 'Email & Password sign-in linked to your account.' };
    } catch (err: any) {
      const msg = formatFirebaseAuthError(err);
      setError(msg);
      return { ok: false, message: msg };
    }
  };

  const unlinkAuthProvider = async (
    providerId: string
  ): Promise<{ ok: boolean; message: string }> => {
    if (!auth.currentUser) {
      return { ok: false, message: 'Sign in first to manage linked providers.' };
    }
    const providers = auth.currentUser.providerData || [];
    if (providers.length <= 1) {
      return {
        ok: false,
        message: 'You cannot unlink your only remaining sign-in method.',
      };
    }
    try {
      clearAuthMessages();
      const updated = await unlink(auth.currentUser, providerId);
      savePersistedAuthSessionSnapshot(updated);
      setUser({ ...updated } as FirebaseUser);
      return { ok: true, message: 'Sign-in method unlinked successfully.' };
    } catch (err: any) {
      const msg = formatFirebaseAuthError(err);
      setError(msg);
      return { ok: false, message: msg };
    }
  };

  const resendVerificationEmail = async (): Promise<{ ok: boolean; message: string }> => {
    if (!auth.currentUser) {
      return { ok: false, message: 'Sign in first to verify your email address.' };
    }
    if (auth.currentUser.emailVerified) {
      return { ok: true, message: 'Your email address is already verified.' };
    }
    try {
      clearAuthMessages();
      await sendEmailVerification(auth.currentUser);
      return { ok: true, message: 'Verification email sent. Check your inbox.' };
    } catch (err: any) {
      const msg = formatFirebaseAuthError(err);
      setError(msg);
      return { ok: false, message: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        statusMessage,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        clearAuthMessages,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        signOutUser,
        linkGoogleProvider,
        linkEmailPasswordProvider,
        unlinkAuthProvider,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
