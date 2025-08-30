// Firebase semplificato per risolvere problemi di moduli
import { Platform } from 'react-native';

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

let auth: any = null;
let db: any = null;

// Inizializzazione semplificata
try {
  if (Platform.OS === 'web') {
    // Web - Firebase JS SDK
    const { initializeApp } = require('firebase/app');
    const { getFirestore } = require('firebase/firestore');
    const { getAuth } = require('firebase/auth');

    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    console.log('🔥 Firebase Web inizializzato');
  } else {
    // Mobile - Firebase JS SDK con AsyncStorage
    const { initializeApp } = require('firebase/app');
    const { getFirestore } = require('firebase/firestore');
    const { getAuth, initializeAuth } = require('firebase/auth');
    
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    
    try {
      const { getReactNativePersistence } = require('firebase/auth/react-native');
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
      console.log('🔥 Firebase Mobile con persistenza inizializzato');
    } catch (e) {
      auth = getAuth(app);
      console.log('🔥 Firebase Mobile senza persistenza inizializzato');
    }
  }
} catch (error) {
  console.error('❌ Errore Firebase:', error);
}

export { auth, db };
export const isWeb = Platform.OS === 'web';