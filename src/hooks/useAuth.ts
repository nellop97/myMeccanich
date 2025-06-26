// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, getFirebaseErrorMessage } from '../services/firebase';

// Expo imports condizionali
let AuthSession: any = null;
let AppleAuthentication: any = null;

if (Platform.OS !== 'web') {
  try {
    AuthSession = require('expo-auth-session');
    AppleAuthentication = require('expo-apple-authentication');
  } catch (error) {
    console.log('OAuth libraries not available');
  }
}

// Configurazione Google OAuth
const GOOGLE_CONFIG = {
  clientId: Platform.select({
    ios: '619020396283-i5qvfa2fnri304g3nndjrob5flhfrp5r.apps.googleusercontent.com',
    android: '619020396283-hsb93gobbbuokvc80idf466ptlh7fmdi.apps.googleusercontent.com',
    web: '619020396283-4gd2pd371hop6d1vkc0tvo6j3jaod2t6.apps.googleusercontent.com',
    default: '619020396283-hsb93gobbbuokvc80idf466ptlh7fmdi.apps.googleusercontent.com'
  }),
  scopes: ['openid', 'profile', 'email'],
};

// Interfacce TypeScript
export interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  isAnonymous: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  // Dati aggiuntivi da Firestore
  firstName?: string;
  lastName?: string;
  userType?: 'user' | 'mechanic';
  profileComplete?: boolean;
  workshopName?: string;
  address?: string;
  vatNumber?: string;
}

export interface AuthResult {
  success: boolean;
  user?: FirebaseUser;
  error?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  initializing: boolean;

  // Metodi di autenticazione
  loginWithEmail: (email: string, password: string) => Promise<AuthResult>;
  registerWithEmail: (email: string, password: string, displayName?: string) => Promise<AuthResult>;
  loginWithGoogle: () => Promise<AuthResult>;
  loginWithApple: () => Promise<AuthResult>;
  logout: () => Promise<void>;

  // Metodi di utilità
  sendVerificationEmail: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  updateUserProfile: (data: Partial<AuthUser>) => Promise<boolean>;
  refreshUserData: () => Promise<void>;
}

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Configurazione Google OAuth per mobile
  const [googleRequest, googleResponse, promptGoogleAsync] = AuthSession?.useAuthRequest ?
      AuthSession.useAuthRequest(
          {
            clientId: GOOGLE_CONFIG.clientId,
            scopes: GOOGLE_CONFIG.scopes,
            redirectUri: AuthSession.makeRedirectUri({
              scheme: 'com.mymeccanick',
              useProxy: true,
            }),
          },
          { authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth' }
      ) : [null, null, null];

  // Funzione per mostrare errori e messaggi
  const showError = useCallback((message: string) => {
    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert('Errore', message);
    }
  }, []);

  const showSuccess = useCallback((message: string) => {
    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert('Successo', message);
    }
  }, []);

  // Funzione per caricare i dati utente da Firestore
  const loadUserData = useCallback(async (firebaseUser: FirebaseUser): Promise<AuthUser | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      const baseUser: AuthUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        phoneNumber: firebaseUser.phoneNumber,
        isAnonymous: firebaseUser.isAnonymous,
        createdAt: firebaseUser.metadata.creationTime,
        lastLoginAt: firebaseUser.metadata.lastSignInTime,
      };

      if (userDoc.exists()) {
        const userData = userDoc.data();
        return { ...baseUser, ...userData };
      } else {
        console.log('Documento utente non trovato in Firestore');
        return baseUser;
      }
    } catch (error) {
      console.error('Errore nel caricamento dati utente:', error);
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        phoneNumber: firebaseUser.phoneNumber,
        isAnonymous: firebaseUser.isAnonymous,
        createdAt: firebaseUser.metadata.creationTime,
        lastLoginAt: firebaseUser.metadata.lastSignInTime,
      };
    }
  }, []);

  // Listener per i cambiamenti di stato dell'autenticazione
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const authUser = await loadUserData(firebaseUser);
          setUser(authUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Errore nell\'aggiornamento stato auth:', error);
        setUser(null);
      } finally {
        if (initializing) {
          setInitializing(false);
        }
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [initializing, loadUserData]);

  // Gestione risposta Google OAuth
  useEffect(() => {
    if (googleResponse?.type === 'success' && Platform.OS !== 'web') {
      handleGoogleAuthResponse(googleResponse);
    } else if (googleResponse?.type === 'error') {
      console.error('OAuth Error:', googleResponse.error);
      showError('Errore durante l\'autenticazione con Google');
      setLoading(false);
    }
  }, [googleResponse, showError]);

  // Gestione risposta Google OAuth per mobile
  const handleGoogleAuthResponse = useCallback(async (response: any) => {
    try {
      setLoading(true);
      const { access_token } = response.params;
      const credential = GoogleAuthProvider.credential(null, access_token);
      await signInWithCredential(auth, credential);
      showSuccess('Accesso effettuato con Google!');
    } catch (error: any) {
      console.error('Errore autenticazione Google:', error);
      showError(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [showError, showSuccess]);

  // Login con email e password
  const loginWithEmail = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error);
      showError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Registrazione con email e password
  const registerWithEmail = useCallback(async (
      email: string,
      password: string,
      displayName?: string
  ): Promise<AuthResult> => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }

      return { success: true, user: userCredential.user };
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error);
      showError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Login con Google
  const loginWithGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
      setLoading(true);

      if (Platform.OS === 'web') {
        // Web: usa popup
        const provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');

        const result = await signInWithPopup(auth, provider);
        showSuccess('Accesso effettuato con Google!');
        return { success: true, user: result.user };

      } else {
        // Mobile: usa Expo AuthSession
        if (!googleRequest || !promptGoogleAsync) {
          const errorMsg = 'Configurazione Google non disponibile. Verifica la configurazione.';
          showError(errorMsg);
          return { success: false, error: errorMsg };
        }

        await promptGoogleAsync();
        // Il risultato verrà gestito dal useEffect
        return { success: true };
      }
    } catch (error: any) {
      console.error('Errore Google Sign-In:', error);
      const errorMessage = getFirebaseErrorMessage(error);
      if (error.code !== 'auth/cancelled-popup-request') {
        showError(errorMessage);
      }
      return { success: false, error: errorMessage };
    } finally {
      if (Platform.OS === 'web') {
        setLoading(false);
      }
    }
  }, [googleRequest, promptGoogleAsync, showError, showSuccess]);

  // Login con Apple
  const loginWithApple = useCallback(async (): Promise<AuthResult> => {
    try {
      setLoading(true);

      if (Platform.OS === 'web') {
        // Web Apple Sign-In
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');

        const result = await signInWithPopup(auth, provider);
        showSuccess('Accesso effettuato con Apple!');
        return { success: true, user: result.user };

      } else if (AppleAuthentication) {
        // Mobile Apple Sign-In
        const isAvailable = await AppleAuthentication.isAvailableAsync();
        if (!isAvailable) {
          const errorMsg = 'Apple Sign-In non è disponibile su questo dispositivo';
          showError(errorMsg);
          return { success: false, error: errorMsg };
        }

        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

        // Crea il provider Apple per Firebase
        const provider = new OAuthProvider('apple.com');
        const authCredential = provider.credential({
          idToken: credential.identityToken!,
          rawNonce: credential.realUserStatus?.toString(),
        });

        const result = await signInWithCredential(auth, authCredential);
        showSuccess('Accesso effettuato con Apple!');
        return { success: true, user: result.user };

      } else {
        const errorMsg = 'Apple Sign-In non configurato';
        showError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      console.error('Errore Apple Sign-In:', error);
      const errorMessage = getFirebaseErrorMessage(error);
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        showError(errorMessage);
      }
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [showError, showSuccess]);

  // Logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      await signOut(auth);
    } catch (error: any) {
      console.error('Errore logout:', error);
      showError(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Invia email di verifica
  const sendVerificationEmail = useCallback(async (): Promise<boolean> => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        showSuccess('Email di verifica inviata!');
        return true;
      } else {
        showError('Nessun utente autenticato');
        return false;
      }
    } catch (error: any) {
      console.error('Errore invio email verifica:', error);
      showError(getFirebaseErrorMessage(error));
      return false;
    }
  }, [showError, showSuccess]);

  // Reset password
  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      await sendPasswordResetEmail(auth, email);
      showSuccess('Email per il reset della password inviata!');
      return true;
    } catch (error: any) {
      console.error('Errore reset password:', error);
      showError(getFirebaseErrorMessage(error));
      return false;
    }
  }, [showError, showSuccess]);

  // Aggiorna profilo utente
  const updateUserProfile = useCallback(async (data: Partial<AuthUser>): Promise<boolean> => {
    try {
      if (!auth.currentUser) {
        showError('Nessun utente autenticato');
        return false;
      }

      setLoading(true);

      // Aggiorna il profilo Firebase se necessario
      if (data.displayName !== undefined) {
        await updateProfile(auth.currentUser, { displayName: data.displayName });
      }

      // Aggiorna i dati in Firestore
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, {
        ...data,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Ricarica i dati utente
      await refreshUserData();

      showSuccess('Profilo aggiornato con successo!');
      return true;
    } catch (error: any) {
      console.error('Errore aggiornamento profilo:', error);
      showError(getFirebaseErrorMessage(error));
      return false;
    } finally {
      setLoading(false);
    }
  }, [showError, showSuccess]);

  // Ricarica dati utente
  const refreshUserData = useCallback(async (): Promise<void> => {
    try {
      if (auth.currentUser) {
        const userData = await loadUserData(auth.currentUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('Errore ricaricamento dati utente:', error);
    }
  }, [loadUserData]);

  return {
    user,
    loading,
    initializing,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginWithApple,
    logout,
    sendVerificationEmail,
    resetPassword,
    updateUserProfile,
    refreshUserData,
  };
};
