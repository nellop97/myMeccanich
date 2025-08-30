// Firebase SDK PULITO - Solo Firebase JS per tutte le piattaforme
import { Platform } from 'react-native';

// Configurazione Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC-AmP6d3a_VVXJnCWVHB1WmU_wPHF0ISI",
  authDomain: "mymecanich.firebaseapp.com",
  projectId: "mymecanich",
  storageBucket: "mymecanich.firebasestorage.app",
  messagingSenderId: "619020396283",
  appId: "1:619020396283:web:883f0ca48dce8c4d05b25e"
};

// Variabili globali
let auth: any = null;
let db: any = null;
let app: any = null;

// Inizializzazione Firebase JS SDK per tutte le piattaforme
try {
  const { initializeApp } = require('firebase/app');
  const { getFirestore } = require('firebase/firestore');
  const { getAuth, initializeAuth } = require('firebase/auth');

  // Inizializza Firebase App
  app = initializeApp(firebaseConfig);
  
  // Inizializza Firestore
  db = getFirestore(app);
  
  // Inizializza Auth con gestione persistenza per mobile
  if (Platform.OS !== 'web') {
    try {
      const { getReactNativePersistence } = require('firebase/auth/react-native');
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
      console.log('🔥 Firebase Mobile con persistenza inizializzato');
    } catch (persistenceError) {
      console.warn('⚠️ Persistenza non disponibile, usando auth standard');
      auth = getAuth(app);
    }
  } else {
    // Web: auth standard
    auth = getAuth(app);
    console.log('🔥 Firebase Web inizializzato');
  }
  
  console.log('✅ Firebase inizializzato con successo per', Platform.OS);
} catch (error) {
  console.error('❌ Errore inizializzazione Firebase:', error);
  // Fallback vuoto per evitare crash
  auth = null;
  db = null;
}

// Funzioni di utilità
export const isFirebaseReady = (): boolean => {
  return auth !== null && db !== null;
};

export const getFirebaseAuth = () => {
  if (!auth) {
    console.warn('⚠️ Firebase Auth non inizializzato');
  }
  return auth;
};

export const getFirebaseDB = () => {
  if (!db) {
    console.warn('⚠️ Firebase Firestore non inizializzato');
  }
  return db;
};

// Esportazioni principali
export { auth, db, app };
export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS !== 'web';