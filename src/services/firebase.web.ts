// src/services/firebase.web.ts - Versione specifica per Web
import {
    initializeApp,
    getApps,
    getApp,
    FirebaseApp
} from 'firebase/app';
import {
    getAuth,
    browserLocalPersistence,
    setPersistence,
    Auth
} from 'firebase/auth';
import {
    getFirestore,
    Firestore,
    connectFirestoreEmulator
} from 'firebase/firestore';
import {
    getStorage,
    FirebaseStorage,
    connectStorageEmulator
} from 'firebase/storage';

// Configurazione Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBH6F0JOVh8X-X41h2xN7cXxNEZnmY2nMk",
    authDomain: "mymecanich.firebaseapp.com",
    projectId: "mymecanich",
    storageBucket: "mymecanich.firebasestorage.app",
    messagingSenderId: "619020396283",
    appId: "1:619020396283:web:2f97f5f3e5e5dc5105b25e",
    measurementId: "G-7K1E9X8RLN"
};

// Inizializzazione singleton
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let initialized = false;

// Flag per emulatori (development)
const USE_EMULATORS = false; // Imposta su true per usare emulatori locali

try {
    // Inizializza o recupera app esistente
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
        console.log('🔥 Firebase App inizializzata');
    } else {
        app = getApp();
        console.log('🔥 Firebase App esistente recuperata');
    }

    // Inizializza servizi
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    initialized = true;

    // Imposta persistenza per web
    setPersistence(auth, browserLocalPersistence)
        .then(() => {
            console.log('✅ Persistenza browser impostata');
        })
        .catch((error) => {
            console.warn('⚠️ Errore impostazione persistenza:', error);
        });

    // Connetti agli emulatori se in development
    if (USE_EMULATORS && typeof window !== 'undefined') {
        // @ts-ignore - Controlla se già connesso
        if (!window._firebaseEmulatorsConnected) {
            try {
                // Connetti auth emulator
                // connectAuthEmulator(auth, 'http://localhost:9099');

                // Connetti Firestore emulator
                connectFirestoreEmulator(db, 'localhost', 8080);

                // Connetti Storage emulator
                connectStorageEmulator(storage, 'localhost', 9199);

                // @ts-ignore
                window._firebaseEmulatorsConnected = true;
                console.log('🔧 Connesso agli emulatori Firebase');
            } catch (error) {
                console.warn('⚠️ Emulatori già connessi o non disponibili');
            }
        }
    }

    // Log configurazione in development
    if (process.env.NODE_ENV === 'development') {
        console.log('🔥 Firebase Web Configuration:', {
            projectId: firebaseConfig.projectId,
            authDomain: firebaseConfig.authDomain,
            emulators: USE_EMULATORS,
        });
    }

} catch (error) {
    console.error('❌ Errore inizializzazione Firebase:', error);
    throw error;
}

// Verifica se Firebase è pronto
export const isFirebaseReady = (): boolean => {
    return initialized && !!auth && !!db;
};

// Helper per gestire errori di autenticazione
export const handleAuthError = (error: any): string => {
    const errorMessages: { [key: string]: string } = {
        'auth/network-request-failed': 'Errore di connessione. Verifica la tua connessione internet.',
        'auth/email-already-in-use': 'Email già registrata. Prova ad accedere.',
        'auth/invalid-email': 'Email non valida.',
        'auth/operation-not-allowed': 'Operazione non permessa.',
        'auth/weak-password': 'Password troppo debole. Usa almeno 6 caratteri.',
        'auth/user-disabled': 'Account disabilitato. Contatta il supporto.',
        'auth/user-not-found': 'Utente non trovato.',
        'auth/wrong-password': 'Password errata.',
        'auth/invalid-credential': 'Credenziali non valide.',
        'auth/popup-blocked': 'Popup bloccato dal browser. Abilita i popup per questo sito.',
        'auth/popup-closed-by-user': 'Accesso annullato.',
        'auth/account-exists-with-different-credential': 'Un account esiste già con la stessa email ma credenziali diverse.',
        'auth/too-many-requests': 'Troppi tentativi. Riprova più tardi.',
    };

    return errorMessages[error.code] || `Errore: ${error.message}`;
};

// Export servizi Firebase
export { app, auth, db, storage };

// Export utilities
export const isWeb = true;
export const isMobile = false;

// Export types
export type { FirebaseApp, Auth, Firestore, FirebaseStorage };