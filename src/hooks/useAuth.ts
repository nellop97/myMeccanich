// src/hooks/useAuth.ts - VERSIONE SICURA
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
  // Dati base da Firebase Auth
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  isAnonymous: boolean;

  // Dati aggiuntivi da Firestore
  name?: string; // Nome completo dell'utente
  createdAt?: string; // Data di creazione account
  lastLoginAt?: string; // Ultimo accesso
  isActive?: boolean; // Account attivo
  isEmailVerified?: boolean; // Conferma email (da Firestore)
  userType?: 'user' | 'mechanic'; // Tipo di utente

  // Impostazioni utente
  settings?: {
    language: string;
    currency: string;
    notifications: {
      maintenance: boolean;
      documents: boolean;
      reminders: boolean;
      marketing: boolean;
    };
    privacy: {
      shareDataWithWorkshops: boolean;
      allowMarketingEmails: boolean;
    };
  };

  // Informazioni officina (solo per userType: 'mechanic')
  workshopInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    vatNumber: string;
    specializations: string[];
    certifications: string[];
    workingHours: {
      [key: string]: {
        open: string;
        close: string;
        isClosed: boolean;
      };
    };
  };

  // Campi legacy per compatibilità
  firstName?: string;
  lastName?: string;
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
      console.log('🔍 DEBUG - Firebase User UID:', firebaseUser.uid);
      console.log('🔍 DEBUG - Firebase User Email:', firebaseUser.email);

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      console.log('🔍 DEBUG - Document path:', `users/${firebaseUser.uid}`);

      const userDoc = await getDoc(userDocRef);
      console.log('🔍 DEBUG - Document exists:', userDoc.exists());

      if (userDoc.exists()) {
        console.log('🔍 DEBUG - Document data:', userDoc.data());
        const userData = userDoc.data();

        // Resto del codice per processare i dati...
        const processedUserData = {
          ...userData,
          createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate().toISOString() : userData.createdAt,
          lastLoginAt: userData.lastLoginAt?.toDate ? userData.lastLoginAt.toDate().toISOString() : userData.lastLoginAt,
          emailVerified: userData.isEmailVerified ?? firebaseUser.emailVerified,
          displayName: userData.name ?? firebaseUser.displayName,
        };

        const baseUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          phoneNumber: firebaseUser.phoneNumber,
          isAnonymous: firebaseUser.isAnonymous,
        };

        return { ...baseUser, ...processedUserData };
      } else {
        console.log('❌ Documento utente non trovato in Firestore');
        console.log('🔍 DEBUG - Cerco altri documenti nella collezione users...');

        // Verifica se esistono altri documenti nella collezione
        const usersQuery = query(collection(db, 'users'), limit(5));
        const usersSnapshot = await getDocs(usersQuery);

        console.log('🔍 DEBUG - Documenti trovati nella collezione users:');
        usersSnapshot.forEach((doc) => {
          console.log(`  - ID: ${doc.id}, Email: ${doc.data().email}`);
        });

        // Prova a cercare per email
        if (firebaseUser.email) {
          console.log('🔍 DEBUG - Cerco documento per email:', firebaseUser.email);
          const emailQuery = query(
              collection(db, 'users'),
              where('email', '==', firebaseUser.email),
              limit(1)
          );
          const emailSnapshot = await getDocs(emailQuery);

          if (!emailSnapshot.empty) {
            const foundDoc = emailSnapshot.docs[0];
            console.log('✅ Trovato documento per email! ID:', foundDoc.id);
            console.log('⚠️  L\'ID del documento non corrisponde all\'UID Firebase');
            console.log('   UID Firebase:', firebaseUser.uid);
            console.log('   ID Documento:', foundDoc.id);

            // Potresti decidere di usare questo documento o crearne uno nuovo
            return {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              emailVerified: firebaseUser.emailVerified,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              phoneNumber: firebaseUser.phoneNumber,
              isAnonymous: firebaseUser.isAnonymous,
              ...foundDoc.data(),
            };
          }
        }

        console.log('🔄 Creo nuovo documento utente...');

        // Base user data
        const baseUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          phoneNumber: firebaseUser.phoneNumber,
          isAnonymous: firebaseUser.isAnonymous,
        };

        // Crea nuovo documento
        const newUserData = {
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          isEmailVerified: firebaseUser.emailVerified,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          isActive: true,
          userType: 'user',
          settings: {
            language: 'it',
            currency: 'EUR',
            notifications: {
              maintenance: true,
              documents: true,
              reminders: true,
              marketing: false,
            },
            privacy: {
              shareDataWithWorkshops: false,
              allowMarketingEmails: false,
            },
          },
        };

        // Salva il nuovo documento
        await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);
        console.log('✅ Nuovo documento utente creato con successo');

        return {
          ...baseUser,
          ...newUserData,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento dati utente:', error);

      // Controlla il tipo di errore
      if (error.code === 'permission-denied') {
        console.error('🚫 ERRORE PERMISSIONS - Controlla le regole Firestore');
      } else if (error.code === 'unavailable') {
        console.error('🌐 ERRORE CONNESSIONE - Controlla la connessione internet');
      }

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

  // 🔒 LISTENER SICURO - UNICA FONTE DI VERITÀ
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log('🔥 Firebase: Utente autenticato');
          const authUser = await loadUserData(firebaseUser);
          setUser(authUser);
        } else {
          console.log('🔥 Firebase: Utente non autenticato');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Errore auth state:', error);
        // 🔒 IN CASO DI ERRORE, SEMPRE LOGOUT PER SICUREZZA
        setUser(null);
      } finally {
        if (initializing) {
          console.log('🚀 Auth: Inizializzazione completata');
          setInitializing(false);
        }
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
      console.log('🔑 Tentativo login con email:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login riuscito');
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      console.error('❌ Errore login:', error);
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

      } else if (Platform.OS === 'ios' && AppleAuthentication) {
        // iOS Apple Sign-In
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

        const { identityToken } = credential;
        const provider = new OAuthProvider('apple.com');
        const authCredential = provider.credential({
          idToken: identityToken!,
        });

        const result = await signInWithCredential(auth, authCredential);
        showSuccess('Accesso effettuato con Apple!');
        return { success: true, user: result.user };

      } else {
        const errorMsg = 'Apple Sign-In non disponibile su questa piattaforma';
        showError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      console.error('Errore Apple Sign-In:', error);
      const errorMessage = getFirebaseErrorMessage(error);
      showError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [showError, showSuccess]);

  // Logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      console.log('🚪 Logout in corso...');
      setLoading(true);
      
      // Esegui il logout da Firebase
      await signOut(auth);
      
      // Reset manuale dello stato se necessario
      setUser(null);
      
      console.log('✅ Logout completato con successo');
    } catch (error: any) {
      console.error('❌ Errore durante il logout:', error);
      
      // In caso di errore, forza comunque il reset dell'utente
      setUser(null);
      
      const errorMessage = getFirebaseErrorMessage(error);
      showError(`Errore durante il logout: ${errorMessage}`);
      
      // Re-throw l'errore per permettere ai componenti di gestirlo
      throw error;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Invio email di verifica
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
