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
let app: any;
let auth: any;
let db: any;

// Inizializzazione cross-platform
if (Platform.OS === 'web') {
  // ============================================
  // CONFIGURAZIONE WEB - Firebase JS SDK v9+
  // ============================================
  try {
    const { initializeApp } = require('firebase/app');
    const { getFirestore } = require('firebase/firestore');
    const { getAuth } = require('firebase/auth');

    // Inizializza Firebase App
    app = initializeApp(firebaseConfig);
    
    // Inizializza servizi
    db = getFirestore(app);
    auth = getAuth(app);

    console.log('✅ Firebase Web SDK inizializzato correttamente');
  } catch (error) {
    console.error('❌ Errore nell\'inizializzazione Firebase Web:', error);
  }
} else {
  // ============================================
  // CONFIGURAZIONE MOBILE - React Native Firebase
  // ============================================
  try {
    // React Native Firebase si auto-configura dal google-services.json/GoogleService-Info.plist
    const firebaseAuth = require('@react-native-firebase/auth').default;
    const firebaseFirestore = require('@react-native-firebase/firestore').default;

    auth = firebaseAuth();
    db = firebaseFirestore();

    console.log('✅ React Native Firebase inizializzato correttamente');
  } catch (error) {
    console.error('❌ Errore nell\'inizializzazione React Native Firebase:', error);
    
    // Fallback: prova a usare Firebase JS SDK anche su mobile (meno efficiente)
    try {
      const { initializeApp } = require('firebase/app');
      const { getFirestore } = require('firebase/firestore');
      const { getAuth, initializeAuth } = require('firebase/auth');

      app = initializeApp(firebaseConfig);
      db = getFirestore(app);

      // Prova a usare la persistenza React Native se disponibile
      try {
        const { getReactNativePersistence } = require('firebase/auth/react-native');
        const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;

        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(ReactNativeAsyncStorage),
        });
        console.log('✅ Firebase JS SDK con persistenza React Native inizializzato');
      } catch (persistenceError) {
        console.warn('⚠️ Persistenza React Native non disponibile, usando auth di default');
        auth = getAuth(app);
      }
    } catch (fallbackError) {
      console.error('❌ Anche il fallback Firebase JS SDK ha fallito:', fallbackError);
    }
  }
}

// Esportazioni
export { auth, db };

// Utility per platform detection
export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS !== 'web';

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

    // Test di connessione semplice
    if (isWeb) {
      const { doc, getDoc } = require('firebase/firestore');
      await getDoc(doc(db, 'test', 'connection'));
    } else {
      // Per React Native Firebase
      await db.doc('test/connection').get();
    }

    console.log('✅ Connessione Firebase funzionante');
    return true;
  } catch (error) {
    console.error('❌ Test connessione Firebase fallito:', getFirebaseErrorMessage(error));
    return false;
  }
};

// Log dello stato di inizializzazione
if (auth && db) {
  console.log('🔥 Firebase inizializzato con successo per', Platform.OS);
} else {
  console.error('❌ Firebase non è stato inizializzato correttamente');
}