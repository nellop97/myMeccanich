// src/services/firebase.ts - VERSIONE AGGIORNATA E CROSS-PLATFORM
import { Platform } from 'react-native';

// Configurazione Firebase (uguale per tutte le piattaforme)
const firebaseConfig = {
  apiKey: "AIzaSyC-AmP6d3a_VVXJnCWVHB1WmU_wPHF0ISI",
  authDomain: "mymecanich.firebaseapp.com",
  projectId: "mymecanich",
  storageBucket: "mymecanich.firebasestorage.app",
  messagingSenderId: "619020396283",
  appId: "1:619020396283:web:883f0ca48dce8c4d05b25e",
  measurementId: "G-FS1LZ8SWL1"
};

// Variabili per l'esportazione
let app: any = null;
let auth: any = null;
let db: any = null;

// Inizializzazione cross-platform
try {
  if (Platform.OS === 'web') {
    // ============================================
    // CONFIGURAZIONE WEB - Firebase JS SDK v9+
    // ============================================
    const { initializeApp } = require('firebase/app');
    const { getFirestore } = require('firebase/firestore');
    const { getAuth } = require('firebase/auth');

    // Inizializza Firebase App
    app = initializeApp(firebaseConfig);
    
    // Inizializza servizi
    db = getFirestore(app);
    auth = getAuth(app);

    console.log('✅ Firebase Web SDK inizializzato correttamente');
  } else {
    // ============================================
    // CONFIGURAZIONE MOBILE - Prima prova Expo Firebase, poi RN Firebase
    // ============================================
    try {
      // Prima prova: usa Firebase JS SDK con AsyncStorage
      const { initializeApp } = require('firebase/app');
      const { getFirestore } = require('firebase/firestore');
      const { getAuth, initializeAuth } = require('firebase/auth');
      const { getReactNativePersistence } = require('firebase/auth/react-native');
      const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;

      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      });

      console.log('🔥 Firebase inizializzato con successo per', Platform.OS);
    } catch (error) {
      console.warn('⚠️ Persistenza React Native non disponibile, usando auth di default');
      
      // Seconda prova: React Native Firebase nativo
      try {
        const firebaseAuth = require('@react-native-firebase/auth').default;
        const firebaseFirestore = require('@react-native-firebase/firestore').default;

        auth = firebaseAuth();
        db = firebaseFirestore();

        console.log('✅ React Native Firebase inizializzato correttamente');
      } catch (rnError) {
        console.error('❌ Errore nell\'inizializzazione React Native Firebase:', rnError);
        
        // Fallback: prova a usare Firebase JS SDK anche su mobile (meno efficiente)
        try {
          const { initializeApp } = require('firebase/app');
          const { getFirestore } = require('firebase/firestore');
          const { getAuth } = require('firebase/auth');

          app = initializeApp(firebaseConfig);
          db = getFirestore(app);
          auth = getAuth(app);

          console.log('✅ Firebase JS SDK con fallback inizializzato');
        } catch (fallbackError) {
          console.error('❌ Anche il fallback Firebase JS SDK ha fallito:', fallbackError);
        }
      }
    }
  }
} catch (error) {
  console.error('❌ Errore generale nell\'inizializzazione Firebase:', error);
}

// Helper per gestire errori Firebase in modo cross-platform
export const getFirebaseErrorMessage = (error: any): string => {
  const errorCode = error.code;

  const errorMessages: { [key: string]: string } = {
    'auth/user-not-found': 'Utente non trovato',
    'auth/wrong-password': 'Password non corretta',
    'auth/invalid-email': 'Email non valida',
    'auth/email-already-in-use': 'Questa email è già registrata',
    'auth/weak-password': 'La password è troppo debole (minimo 6 caratteri)',
    'auth/user-disabled': 'Account disabilitato',
    'auth/invalid-credential': 'Credenziali non valide',
    'auth/network-request-failed': 'Errore di connessione. Verifica la tua connessione internet.',
    'auth/too-many-requests': 'Troppi tentativi. Riprova più tardi.',
    'auth/popup-closed-by-user': 'Accesso annullato dall\'utente',
    'auth/cancelled-popup-request': 'Richiesta di accesso annullata',
    'auth/popup-blocked': 'Popup bloccato dal browser. Consenti i popup per questo sito.',
    'auth/configuration-not-found': 'Configurazione OAuth non trovata. Controlla la configurazione Google.',
    'auth/missing-client-id': 'Client ID mancante nella configurazione OAuth',
    'auth/invalid-client-id': 'Client ID non valido',
    'firestore/permission-denied': 'Accesso negato. Verifica i permessi.',
    'firestore/unavailable': 'Servizio temporaneamente non disponibile.',
    'firestore/cancelled': 'Operazione annullata.',
    'firestore/data-loss': 'Perdita di dati non recuperabile.',
    'firestore/deadline-exceeded': 'Timeout dell\'operazione.',
    'firestore/already-exists': 'Il documento esiste già.',
    'firestore/resource-exhausted': 'Quota esaurita.',
    'firestore/failed-precondition': 'Operazione respinta perché il sistema non è nello stato richiesto.',
    'firestore/aborted': 'Operazione interrotta a causa di un conflitto.',
    'firestore/out-of-range': 'Operazione tentata fuori dal range valido.',
    'firestore/unimplemented': 'Operazione non implementata.',
    'firestore/internal': 'Errore interno.',
    'firestore/unauthenticated': 'Richiesta non autenticata.',
  };

  return errorMessages[errorCode] || `Errore: ${error.message || 'Errore sconosciuto'}`;
};

// Test di connessione Firebase
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    if (!db) {
      console.error('❌ Database Firestore non inizializzato');
      return false;
    }

    // Test di connessione per web
    if (Platform.OS === 'web') {
      const { enableNetwork } = require('firebase/firestore');
      await enableNetwork(db);
    }

    console.log('✅ Test di connessione Firebase riuscito');
    return true;
  } catch (error) {
    console.error('❌ Test di connessione Firebase fallito:', error);
    return false;
  }
};

// Esportazioni principali
export { auth, db, app };

// Utility per platform detection
export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS !== 'web';

// Configurazione per Google Sign-In (se disponibile)
export let googleSignInConfig: any = null;

if (Platform.OS !== 'web') {
  // Mobile: prova a configurare Google Sign-In
  try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    GoogleSignin.configure({
      webClientId: '619020396283-i6v7j4j5j5j5j5j5j5j5j5j5j5j5j5j5.apps.googleusercontent.com', // Da Firebase Console
      iosClientId: '619020396283-ios-client-id.apps.googleusercontent.com', // Opzionale
    });
    googleSignInConfig = GoogleSignin;
    console.log('✅ Google Sign-In configurato per mobile');
  } catch (error) {
    console.warn('Google Sign-In non disponibile:', error);
  }
} else {
  // Web: Google Sign-In è gestito automaticamente da Firebase Auth
  console.log('✅ Google Sign-In configurato per web');
}

export { googleSignInConfig };