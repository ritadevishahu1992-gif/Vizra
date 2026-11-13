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
  FirebaseUser,
  auth,
  googleProvider,
} from '../lib/firebase';
import { syncUserProfile } from '../services/firestoreService';

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
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Try signing in instead.';
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

export function purgeUserSessionStorage(): void {
  try {
    for (const key of USER_SCOPED_LOCAL_KEYS) {
      localStorage.removeItem(key);
    }
    localStorage.removeItem(ACTIVE_USER_UID_STORAGE_KEY);
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
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser: FirebaseUser | null) => {
      // Cross-user browser storage isolation: if a different user signs in on a shared browser,
      // purge the previous user's local workspace cache before initializing the new session.
      try {
        const previousUid = localStorage.getItem(ACTIVE_USER_UID_STORAGE_KEY);
        if (currentUser) {
          if (previousUid && previousUid !== currentUser.uid) {
            purgeUserSessionStorage();
          }
          localStorage.setItem(ACTIVE_USER_UID_STORAGE_KEY, currentUser.uid);
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

    return () => unsubscribe();
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
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
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
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (result.user) {
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
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (result.user) {
        if (name.trim()) {
          await updateProfile(result.user, { displayName: name.trim() });
        }
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
      await signOut(auth);
    } catch (err: any) {
      console.error('Sign-out failed:', err);
      setError(err.message || 'Failed to sign out.');
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
