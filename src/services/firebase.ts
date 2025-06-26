// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Per Firebase v10+, la configurazione di Auth è più semplice
import { getAuth, initializeAuth } from 'firebase/auth';

// Solo per React Native, importa getReactNativePersistence dal modulo corretto
let getReactNativePersistence: any = null;
let AsyncStorage: any = null;

if (Platform.OS !== 'web') {
  // Import condizionale per React Native
  try {
    // In Firebase v10+, importa da firebase/auth/react-native
    getReactNativePersistence = require('firebase/auth/react-native').getReactNativePersistence;
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch (error) {
    console.log('Using fallback auth configuration');
  }
}

// Configurazione Firebase - I tuoi dati reali
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

// Inizializza Auth con configurazione specifica per piattaforma
let auth;

try {
  if (Platform.OS === 'web') {
    // Per Web, usa getAuth normale
    auth = getAuth(app);
  } else if (getReactNativePersistence && AsyncStorage) {
    // Per React Native con persistenza (Firebase v10+)
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } else {
    // Fallback: configurazione semplice senza persistenza personalizzata
    auth = getAuth(app);
  }
} catch (error) {
  // Se initializeAuth fallisce (app già inizializzata), usa getAuth
  console.log('Auth already initialized, using getAuth');
  auth = getAuth(app);
}

// Inizializza Firestore
export const db = getFirestore(app);

// Esporta auth e app
export { auth };
export default app;

// Utility functions
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