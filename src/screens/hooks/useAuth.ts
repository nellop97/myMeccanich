// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { auth, getFirebaseErrorMessage, isWeb } from '../services/firebase';

// Expo imports condizionali per evitare errori su web
let AuthSession: any = null;
let WebBrowser: any = null;

if (!isWeb) {
  try {
    AuthSession = require('expo-auth-session');
    WebBrowser = require('expo-web-browser');
    WebBrowser.maybeCompleteAuthSession();
  } catch (error) {
    console.log('Expo Auth Session not available');
  }
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  isAnonymous: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Google OAuth configuration - SOSTITUISCI CON I TUOI CLIENT ID REALI
  const googleConfig = {
    // Questi sono placeholder - sostituisci con i tuoi veri Client ID
    webClientId: '619020396283-i5qvfa2fnri304g3nndjrob5flhfrp5r.apps.googleusercontent.com',
    iosClientId: '619020396283-i5qvfa2fnri304g3nndjrob5flhfrp5r.apps.googleusercontent.com',
    androidClientId: '619020396283-hsb93gobbbuokvc80idf466ptlh7fmdi.apps.googleusercontent.com',
    expoClientId: '619020396283-expo-client-id.apps.googleusercontent.com',
  };

  // Seleziona il Client ID appropriato per la piattaforma
  const getClientId = () => {
    switch (Platform.OS) {
      case 'web':
        return googleConfig.webClientId;
      case 'ios':
        return googleConfig.iosClientId;
      case 'android':
        return googleConfig.androidClientId;
      default:
        return googleConfig.expoClientId;
    }
  };

  // Setup Google Auth Request per mobile (solo se disponibile)
  let request: any = null;
  let response: any = null;
  let promptAsync: any = null;

  if (!isWeb && AuthSession) {
    try {
      [request, response, promptAsync] = AuthSession.useAuthRequest({
        clientId: getClientId(),
        scopes: ['openid', 'profile', 'email'],
        redirectUri: AuthSession.makeRedirectUri({
          scheme: 'mymeccanich', // Deve corrispondere a app.json
          path: 'redirect'
        }),
      }, {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth'
      });
    } catch (error) {
      console.log('Could not initialize Google Auth Request:', error);
    }
  }

  // Listener per cambio stato autenticazione
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const authUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          phoneNumber: firebaseUser.phoneNumber,
          isAnonymous: firebaseUser.isAnonymous,
        };
        setUser(authUser);
      } else {
        setUser(null);
      }

      if (initializing) {
        setInitializing(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [initializing]);

  // Handle Google OAuth response per mobile
  useEffect(() => {
    if (response?.type === 'success' && !isWeb) {
      handleGoogleAuthResponse(response);
    } else if (response?.type === 'error') {
      console.error('OAuth Error:', response.error);
      showError('Errore durante l\'autenticazione con Google');
    }
  }, [response]);

  // Utility per mostrare errori
  const showError = (message: string) => {
    if (isWeb) {
      alert(message);
    } else {
      Alert.alert('Errore', message);
    }
  };

  const showSuccess = (message: string) => {
    if (isWeb) {
      alert(message);
    } else {
      Alert.alert('Successo', message);
    }
  };

  // Login con email e password
  const loginWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error);
      showError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Registrazione con email e password
  const registerWithEmail = async (
    email: string,
    password: string,
    displayName?: string
  ) => {
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
  };

  // Login con Google
  const loginWithGoogle = async () => {
    try {
      setLoading(true);

      if (isWeb) {
        // Web: usa popup
        const provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');

        const result = await signInWithPopup(auth, provider);
        showSuccess('Accesso effettuato con Google!');
        return { success: true, user: result.user };

      } else {
        // Mobile: usa Expo AuthSession
        if (!request || !promptAsync) {
          showError('Configurazione Google non disponibile. Verifica la configurazione.');
          return { success: false, error: 'Google config not available' };
        }

        await promptAsync();
        // Il risultato verrà gestito da useEffect
        return { success: true };
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      const errorMessage = getFirebaseErrorMessage(error);
      showError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      if (isWeb) {
        setLoading(false);
      }
      // Per mobile, setLoading(false) viene chiamato in handleGoogleAuthResponse
    }
  };

  // Handle Google Auth Response per mobile
  const handleGoogleAuthResponse = async (authResponse: any) => {
    try {
      const { authentication } = authResponse;

      if (!authentication?.accessToken) {
        throw new Error('Token di accesso mancante');
      }

      const credential = GoogleAuthProvider.credential(
        authentication.idToken,
        authentication.accessToken
      );

      const result = await signInWithCredential(auth, credential);
      showSuccess('Accesso effettuato con Google!');
      return { success: true, user: result.user };

    } catch (error: any) {
      console.error('Google Auth Response Error:', error);
      const errorMessage = getFirebaseErrorMessage(error);
      showError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await auth.signOut();
      return { success: true };
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error);
      showError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return {
    user,
    loading,
    initializing,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    // Stato per Google Auth
    googleAuthReady: isWeb || (!!request && !!promptAsync),
  };
};
