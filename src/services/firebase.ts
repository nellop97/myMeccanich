// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Import condizionali per evitare errori
import { getAuth, initializeAuth } from 'firebase/auth';

// Configurazione Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC-AmP6d3a_VVXJnCWVHB1WmU_wPHF0ISI",
  authDomain: "mymecanich.firebaseapp.com",
  projectId: "mymecanich",
  storageBucket: "mymecanich.firebasestorage.app",
  messagingSenderId: "619020396283",
  appId: "1:619020396283:web:883f0ca48dce8c4d05b25e",
  measurementId: "G-FS1LZ8SWL1"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Inizializza Firestore
export const db = getFirestore(app);

// Inizializza Auth in modo cross-platform
let auth;

if (Platform.OS === 'web') {
  // Su web usa la configurazione standard
  auth = getAuth(app);
} else {
  // Su mobile usa la persistenza React Native
  try {
    // Import dinamico per React Native
    const { getReactNativePersistence } = require('firebase/auth/react-native');
    const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;

    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch (error) {
    console.warn('Fallback to default auth config:', error);
    // Fallback alla configurazione di default se la persistenza React Native non è disponibile
    auth = getAuth(app);
  }
}

export { auth };

// Utility per platform detection
export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS !== 'web';

// Helper per gestire errori Firebase in modo cross-platform
export const getFirebaseErrorMessage = (error: any): string => {
  const errorCode = error.code;

  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Utente non trovato';
    case 'auth/wrong-password':
      return 'Password non corretta';
    case 'auth/invalid-email':
      return 'Email non valida';
    case 'auth/email-already-in-use':
      return 'Questa email è già registrata';
    case 'auth/weak-password':
      return 'La password è troppo debole';
    case 'auth/user-disabled':
      return 'Account disabilitato';
    case 'auth/invalid-credential':
      return 'Credenziali non valide';
    case 'auth/network-request-failed':
      return 'Errore di connessione. Verifica la tua connessione internet.';
    case 'auth/too-many-requests':
      return 'Troppi tentativi. Riprova più tardi.';
    case 'auth/popup-closed-by-user':
      return 'Accesso annullato dall\'utente';
    case 'auth/cancelled-popup-request':
      return 'Richiesta di accesso annullata';
    case 'auth/popup-blocked':
      return 'Popup bloccato dal browser. Consenti i popup per questo sito.';
    case 'auth/configuration-not-found':
      return 'Configurazione OAuth non trovata. Controlla la configurazione Google.';
    case 'auth/invalid-oauth-provider':
      return 'Provider OAuth non valido';
    case 'auth/invalid-oauth-client-id':
      return 'Client ID OAuth non valido';
    default:
      console.error('Firebase Error:', error);
      return error.message || 'Si è verificato un errore. Riprova.';
  }
};

// Debug info in sviluppo
if (__DEV__) {
  console.log('🔥 Firebase initialized for platform:', Platform.OS);
  console.log('🔥 Auth persistence configured:', Platform.OS !== 'web' ? 'AsyncStorage' : 'Web Storage');
  console.log('🔥 Project ID:', firebaseConfig.projectId);
}
